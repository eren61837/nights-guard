# 🏛️ Discord AI Architect (PeakBot & Onyx AI Engine)

Yapay zeka gücüyle saniyeler içinde baştan aşağı profesyonel, modern, güvenli ve eksiksiz Discord sunucuları kuran yeni nesil otonom Discord botu. **PeakBot**, **ServerForge** ve **Onyx AI** mimarisi referans alınarak TypeScript ve `discord.js` v14 ile geliştirilmiştir.

---

## 🌟 Öne Çıkan Özellikler

### 1. 🧠 Akıllı Mimari & Blueprint Motoru (AI Generator)
- **Doğal Dil Anlama:** Sunucunuzu istediğiniz dilde ve ayrıntıda anlatın (örn: *"Hardcore Cyberpunk Valorant takımı ve anime topluluğu, VIP üyelikler, turnuva odaları"*).
- **Çoklu Model Desteği:** Google Gemini (1.5 / 2.0 Flash) ve OpenAI (GPT-4o) tam uyumlu structured JSON schema desteği.
- **Akıllı Çevrimdışı Şablon Motoru (Smart Fallback):** API anahtarınız olmasa veya kota dolsa bile komut promptunuzu analiz ederek oyun, anime, yazılım, kripto ve topluluk kategorilerine özel kusursuz mimari üretir; bot **asla hata vermez ve çökmez**.

### 2. 🛡️ Rol Hiyerarşisi ve Hassas Yetkilendirme
- Rollerin gerçek yetki seviyelerine (`Administrator`, `ManageGuild`, `KickMembers`, `ManageMessages`, `ModerateMembers` vb.) göre sıralı oluşturulması.
- Renk kodları (`#HEX`), üye listesinde ayrı gösterme (`hoist: true`), etiketlenebilirlik ayarları.
- Kanal bazlı özel izin geçersiz kılmaları (Örn: `#📜・kurallar` kanalında `@everyone` okuyabilir ancak mesaj yazamaz ve tepki veremez; Yetkili kanalları `@everyone` için tamamen gizlidir).

### 3. 🎨 AI Logo & Asset Studio
- Sunucu konseptinize uygun **512x512** yüksek çözünürlüklü vektör ve neon sunucu logoları üretir.
- **Pollinations AI** entegrasyonu sayesinde **ücretsiz ve API anahtarı gerekmeden** doğrudan Flux/SDXL kalitesinde logo çizer.
- İstenirse tek tıkla veya komutla sunucunun resmi ikonu olarak otomatik ayarlar (`guild.setIcon`).

### 4. 🔍 İnteraktif Önizleme (Dry-Run Modu) & Butonlu Onay
- Mimari oluşturulduğunda kullanıcıya özet embed kartı sunulur:
  - `[🚀 Onayla ve İnşa Et]`
  - `[📋 Detaylı Planı İncele]`
  - `[❌ İptal Et]`
- Onay verilmeden sunucunuzda hiçbir değişiklik yapılmaz.

### 5. ⚡ Hız Limiti Korumalı Dağıtım Motoru (Rate-Limit Queue)
- Discord API'sinin kanal/rol oluşturma limitlerine takılmamak (HTTP 429) için görevleri güvenli aralıklarla yürütür.
- Olası bir sınırda dinamik `retry-after` süresince bekler ve otomatik devam eder.
- Kurulum esnasında arayüzde canlı ilerleme gösterir (Örn: *%65 - #🎮・oyun-odasi kanalı kuruluyor...*).

### 6. 🛠️ Dahili Özel Sistemler
- **➕・Oda Oluştur (Join-to-Create):** Kullanıcı tıkladığında dinamik olarak `🔊・[Kullanıcı] Odası` açılır ve kullanıcı odaya taşınır. Oda boşaldığında otomatik silinir.
- **🎫 Destek & Bilet Sistemi (Ticket):** Butonlu ticket paneli. Tıklandığında sadece talep sahibi ve yetkililerin görebildiği özel bilet kanalı oluşturulur, `[🔒 Talebi Kapat]` butonu ile kapatılır.
- **🤖 Discord AutoMod Koruması:** Küfür, reklam linkleri ve aşırı etiket (mention spam) gönderimlerine karşı Discord'un yerel güvenlik kurallarını otomatik tanımlar.
- **📜 Zengin Kurallar & Bilgi Embedleri:** `#kurallar` ve `#hosgeldin` kanallarına profesyonel formatlı şık duyuru embedleri gönderir.

---

## 📋 Slash Komutları (PeakBot Tam Takım)

| Komut | Açıklama |
| :--- | :--- |
| `/ai-kur [istek] [temizlik_modu] [otomatik_logo] [stil] [dil]` | İstediğiniz sunucuyu AI ile tasarlar ve butonlu onayınıza sunarak inşa eder. |
| `/plan [istek] [stil] [dil]` | **PeakBot Planlama Motoru:** Sunucu şemasını önceden planlar, rol ve kanal sayılarını hesaplar, web ve JSON bağlantısı sunar. |
| `/browser` | **PeakBot Web Studio:** Sunucu mimarisini web tarayıcısında (localhost:3000) interaktif görsel ağaç olarak açar. |
| `/boost [durum/ayricaliklar]` | **PeakBot Boost Hub:** Sunucu takviye seviyesi, booster rolleri, ayrıcalıklar ve teşekkür yönetimi. |
| `/teamwork [kadro/gorevler]` | **PeakBot Ekip Yönetimi:** Yönetim kadrosu hiyerarşisi, ticket sorumlulukları ve yetkili koordinasyonu. |
| `/ai-logo [istek] [uygula]` | Sunucunuz için özel 512x512 logo üretir ve tek tıkla ikonu günceller. |
| `/ai-onizle [istek] [stil]` | Sunucuya dokunmadan planı incelemenizi sağlayan simülasyon (Dry-Run) modu. |
| `/sunucu-temizle` | Sunucudaki tüm kanalları ve silinebilir rolleri güvenle sıfırlar (Clean Slate). |
| `/yardim` | Botun tüm özelliklerini ve kullanım kılavuzunu görüntüler. |

---

## 🚀 Kurulum ve Başlatma

### 1. Gereksinimler
- Node.js (v18 veya üzeri)
- Bir Discord Botu ve Tokeni ([Discord Developer Portal](https://discord.com/developers/applications))

### 2. Bot İzinleri (Developer Portal)
Botunuzu sunucuya davet ederken şu izinleri ve Privileged Intent'leri açtığınızdan emin olun:
- **Intents:** `Server Members Intent`, `Message Content Intent`
- **Bot Yetkileri:** `Administrator` (veya `Manage Channels`, `Manage Roles`, `Manage Guild`, `View Audit Log`)

### 3. Hızlı Başlatıcılar & Sihirbazlar
Masaüstünüzde ve proje klasöründe bulunan hazır `.bat` dosyaları ile tek tıkla çalıştırabilirsiniz:
- **`demo.bat` (veya `npm run demo`):** Token veya API Key gerekmeden anında 1 tıkla sistemi test eder, 512x512 logo ve sunucu şeması üretip web stüdyosunu tarayıcınızda açar.
- **`kurulum.bat` (veya `npm run setup`):** İnteraktif konsol sihirbazı ile token ve API anahtarlarınızı adım adım girmenizi sağlar ve tek tıkla bağlantıyı test eder.
- **`baslat.bat` (veya `npm start`):** Botu doğrudan başlatır.

### 4. Ayarları Yapılandırma (`.env`)
`kurulum.bat` dosyasını çalıştırarak veya `.env` dosyasını doğrudan düzenleyerek ayarları yapabilirsiniz:
```env
DISCORD_TOKEN=BOT_TOKENINIZI_BURAYA_YAPISTIRIN
AI_PROVIDER=auto
IMAGE_PROVIDER=pollinations
```

*(Opsiyonel)* Eğer Google Gemini veya OpenAI API anahtarınız varsa:
```env
GEMINI_API_KEY=AIzaSy...
# veya
OPENAI_API_KEY=sk-...
```
> **Not:** API anahtarı eklemeseniz dahi dahili Akıllı Şablon Motoru ve Dahili PNG Logo Motoru sayesinde bot %100 işlevseldir.

### 5. Testleri Çalıştırma
```bash
npm test
```
Tüm 64 birim ve entegrasyon testi (Permission Mapper, Smart Generator, RateLimitQueue, Cache, Diagnostics, Progress Bars, Procedural PNG, Setup Validator vb.) anında doğrulanır.

---

## 📁 Proje Dizin Yapısı

```
discord-ai-architect/
├── src/
│   ├── index.ts                      # Bot giriş noktası ve lifecycle
│   ├── config.ts                     # Çevresel değişken ve konfigürasyon yöneticisi
│   ├── types/
│   │   └── blueprint.ts              # Server Blueprint tipleri ve arayüzleri
│   ├── services/
│   │   ├── ai/
│   │   │   ├── aiManager.ts          # Sağlayıcı orkestratörü ve fallback zinciri
│   │   │   ├── geminiProvider.ts     # Google Gemini API entegrasyonu
│   │   │   ├── openaiProvider.ts     # OpenAI GPT-4o entegrasyonu
│   │   │   ├── smartFallback.ts      # Çevrimdışı zeki şablon jeneratörü
│   │   │   ├── blueprintSchema.ts    # JSON Schema tanımları
│   │   │   └── promptTemplates.ts    # PeakBot prompt tasarım şablonları
│   │   ├── image/
│   │   │   └── logoStudio.ts         # 512x512 AI logo jeneratörü & guild.setIcon
│   │   ├── engine/
│   │   │   ├── deployer.ts           # Adım adım sunucu inşa motoru
│   │   │   ├── cleaner.ts            # Güvenli sunucu temizleme (Clean Slate)
│   │   │   ├── rateLimitQueue.ts     # Discord 429 korumalı iş kuyruğu
│   │   │   ├── permissionMapper.ts   # Yetki bitfield çözümleyici
│   │   │   └── blueprintCache.ts     # Onay bekleyen inşa oturumu önbelleği
│   │   └── features/
│   │       ├── ticketManager.ts      # Dinamik ticket/bilet paneli & kanalları
│   │       └── voiceLobbyManager.ts  # Dinamik Join-to-Create ses odaları
│   ├── commands/                     # Slash komutları (/ai-kur, /ai-logo, vb.)
│   └── events/                       # Discord event dinleyicileri
├── test/
│   └── runTests.ts                   # 19 adımlı birim ve entegrasyon test paketi
├── package.json
├── tsconfig.json
├── baslat.bat                        # Tek tıkla Windows başlatıcısı
└── README.md
```

---

*Discord AI Architect - PeakBot Edition* 🚀
