import fs from 'fs';
import path from 'path';

export class PersistentStore {
  private static dataDir = path.resolve(process.cwd(), 'data');
  private static backupDir = path.resolve(process.cwd(), 'data/backups');
  private static flushHandlers = new Map<string, () => void>();
  private static initialized = false;
  private static flushTimer: NodeJS.Timeout | null = null;

  public static init(): void {
    if (this.initialized) return;
    this.initialized = true;

    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      if (!fs.existsSync(this.backupDir)) {
        fs.mkdirSync(this.backupDir, { recursive: true });
      }
      console.log(`[PersistentStore] 📂 Güvenli kalıcı veri deposu hazır: ${this.dataDir}`);
    } catch (err: any) {
      console.error('[PersistentStore] Dizin oluşturma hatası:', err.message);
    }

    // 30 saniyede bir dirty datayı diske flush et
    this.flushTimer = setInterval(() => {
      this.flushAll();
    }, 30000);
    if (this.flushTimer.unref) {
      this.flushTimer.unref();
    }

    // Bot hosting / Process sonlanma sinyallerini yakala
    const gracefulExit = (signal: string) => {
      console.log(`[PersistentStore] 🛑 ${signal} sinyali alındı. Tüm veriler diske kaydediliyor...`);
      this.flushAll();
      process.exit(0);
    };

    process.once('SIGINT', () => gracefulExit('SIGINT'));
    process.once('SIGTERM', () => gracefulExit('SIGTERM'));
    process.once('beforeExit', () => {
      this.flushAll();
    });
  }

  public static registerFlushHandler(name: string, handler: () => void): void {
    this.flushHandlers.set(name, handler);
  }

  public static flushAll(): void {
    for (const [name, handler] of this.flushHandlers.entries()) {
      try {
        handler();
      } catch (err: any) {
        console.error(`[PersistentStore] ${name} kaydedilirken hata:`, err.message);
      }
    }
  }

  /**
   * Atomik dosya kaydetme:
   * 1. Önce .tmp dosyasına yazar.
   * 2. Boyutunu doğrular.
   * 3. Hedef dosya varsa .bak olarak yedeğini alır.
   * 4. .tmp dosyasını hedef dosyaya atomik olarak taşır.
   */
  public static atomicSaveJson(filename: string, data: any): boolean {
    this.init();
    const targetPath = path.resolve(this.dataDir, filename);
    const tmpPath = path.resolve(this.dataDir, `${filename}.tmp.${Date.now()}`);
    const bakPath = path.resolve(this.dataDir, `${filename}.bak`);

    try {
      const content = JSON.stringify(data, null, 2);
      fs.writeFileSync(tmpPath, content, 'utf-8');

      // Doğrulama: Boş yazılmışsa işlemi durdur
      const stats = fs.statSync(tmpPath);
      if (stats.size === 0) {
        try { fs.unlinkSync(tmpPath); } catch {}
        return false;
      }

      // Mevcut sağlam dosyanın .bak yedeğini oluştur
      if (fs.existsSync(targetPath)) {
        try {
          fs.copyFileSync(targetPath, bakPath);
        } catch {}
      }

      // Atomik Değiştirme (Rename)
      try {
        fs.renameSync(tmpPath, targetPath);
      } catch {
        // Windows dosya kilidi durumunda fallback
        fs.copyFileSync(tmpPath, targetPath);
        try { fs.unlinkSync(tmpPath); } catch {}
      }

      return true;
    } catch (err: any) {
      console.error(`[PersistentStore] ${filename} kaydedilemedi:`, err.message);
      try { if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath); } catch {}
      return false;
    }
  }

  /**
   * Güvenli veri okuma ve çok kademeli kurtarma:
   * 1. data/${filename} dosyası okunur.
   * 2. Bozuk veya boşsa data/${filename}.bak yedeğinden geri yüklenir.
   * 3. İkisi de yoksa fallbackPaths (eski assets/ dosyaları) aranır ve data/ klasörüne otomatik taşınır.
   * 4. Hiçbiri yoksa defaultVal döner.
   */
  public static safeReadJson<T>(
    filename: string,
    fallbackCandidates: string[] = [],
    defaultVal: T
  ): T {
    this.init();
    const targetPath = path.resolve(this.dataDir, filename);
    const bakPath = path.resolve(this.dataDir, `${filename}.bak`);

    // 1. Ana dosyayı dene
    if (fs.existsSync(targetPath)) {
      try {
        const raw = fs.readFileSync(targetPath, 'utf-8').trim();
        if (raw.length > 0) {
          const parsed = JSON.parse(raw);
          return parsed as T;
        }
      } catch (err: any) {
        console.warn(`[PersistentStore] ⚠️ ${filename} bozuk bulundu, yedekten kurtarılıyor...`);
      }
    }

    // 2. .bak dosyasını dene
    if (fs.existsSync(bakPath)) {
      try {
        const raw = fs.readFileSync(bakPath, 'utf-8').trim();
        if (raw.length > 0) {
          const parsed = JSON.parse(raw);
          console.log(`[PersistentStore] ✅ ${filename} yedek dosyasından (.bak) başarıyla kurtarıldı!`);
          this.atomicSaveJson(filename, parsed);
          return parsed as T;
        }
      } catch (err: any) {
        console.warn(`[PersistentStore] ⚠️ ${filename}.bak da bozuk çıktı.`);
      }
    }

    // 3. Fallback yollarını (eski assets/ verileri) kontrol et
    for (const fb of fallbackCandidates) {
      const resolvedFb = path.isAbsolute(fb) ? fb : path.resolve(process.cwd(), fb);
      if (fs.existsSync(resolvedFb)) {
        try {
          const raw = fs.readFileSync(resolvedFb, 'utf-8').trim();
          if (raw.length > 0) {
            const parsed = JSON.parse(raw);
            console.log(`[PersistentStore] 📦 Eski veri bulundu (${fb}), ${filename} konumuna migrate ediliyor!`);
            this.atomicSaveJson(filename, parsed);
            return parsed as T;
          }
        } catch {}
      }
    }

    // 4. Varsayılan veri ile ilk defa oluştur
    this.atomicSaveJson(filename, defaultVal);
    return defaultVal;
  }
}
