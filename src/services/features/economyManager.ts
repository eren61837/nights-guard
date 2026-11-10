import { EmbedBuilder, User } from 'discord.js';
import { PersistentStore } from '../storage/persistentStore';

interface UserEconomyData {
  coins: number;
  lastDaily: number;
  lastWork: number;
}

export class EconomyManager {
  private static userEconomy = new Map<string, UserEconomyData>();
  private static loaded = false;

  public static load(): void {
    if (this.loaded) return;
    const raw = PersistentStore.safeReadJson<Record<string, UserEconomyData>>(
      'economy.json',
      ['assets/economyData.json'],
      {}
    );
    for (const [k, v] of Object.entries(raw)) {
      this.userEconomy.set(k, v);
    }
    this.loaded = true;

    PersistentStore.registerFlushHandler('EconomyManager', () => {
      this.save();
    });
  }

  public static save(): void {
    if (!this.loaded) return;
    const obj: Record<string, UserEconomyData> = {};
    for (const [k, v] of this.userEconomy.entries()) {
      obj[k] = v;
    }
    PersistentStore.atomicSaveJson('economy.json', obj);
  }

  private static getUser(userId: string): UserEconomyData {
    this.load();
    let data = this.userEconomy.get(userId);
    if (!data) {
      data = { coins: 100, lastDaily: 0, lastWork: 0 }; // 100 Başlangıç Parası
      this.userEconomy.set(userId, data);
    }
    return data;
  }

  public static getBalance(userId: string): number {
    return this.getUser(userId).coins;
  }

  public static addCoins(userId: string, amount: number) {
    const user = this.getUser(userId);
    user.coins += amount;
    this.save();
  }

  public static removeCoins(userId: string, amount: number): boolean {
    const user = this.getUser(userId);
    if (user.coins < amount) return false;
    user.coins -= amount;
    this.save();
    return true;
  }

  public static claimDaily(userId: string, isBooster = false): { success: boolean; amount: number; nextTime?: number } {
    const user = this.getUser(userId);
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000;

    if (now - user.lastDaily < cooldown) {
      return { success: false, amount: 0, nextTime: user.lastDaily + cooldown };
    }

    const reward = isBooster ? 1500 : 500;
    user.coins += reward;
    user.lastDaily = now;
    this.save();
    return { success: true, amount: reward };
  }

  public static work(userId: string): { success: boolean; amount: number; job: string; nextTime?: number } {
    const user = this.getUser(userId);
    const now = Date.now();
    const cooldown = 30 * 60 * 1000; // 30 Dakika

    if (now - user.lastWork < cooldown) {
      return { success: false, amount: 0, job: '', nextTime: user.lastWork + cooldown };
    }

    const jobs = [
      { name: 'Yazılımcı olarak freelance kod yazdın', min: 180, max: 320 },
      { name: 'Discord sunucusunda moderatörlük yaptın', min: 140, max: 260 },
      { name: 'Valorant turnuvasında birinci oldun', min: 200, max: 350 },
      { name: 'Twitch yayınında bağış topladın', min: 150, max: 300 },
      { name: 'Kripto borsasında başarılı al-sat yaptın', min: 170, max: 340 },
    ];

    const chosen = jobs[Math.floor(Math.random() * jobs.length)];
    const earned = Math.floor(Math.random() * (chosen.max - chosen.min + 1)) + chosen.min;

    user.coins += earned;
    user.lastWork = now;
    this.save();
    return { success: true, amount: earned, job: chosen.name };
  }

  public static coinflip(userId: string, bet: number, choice: 'yazi' | 'tura'): { win: boolean; result: 'yazi' | 'tura'; change: number } {
    const user = this.getUser(userId);
    if (user.coins < bet) {
      throw new Error(`Yetersiz bakiye! Mevcut paranız: **${user.coins} Nights Coin**`);
    }

    const outcome: 'yazi' | 'tura' = Math.random() < 0.5 ? 'yazi' : 'tura';
    const isWin = outcome === choice;

    if (isWin) {
      user.coins += bet;
    } else {
      user.coins -= bet;
    }

    this.save();
    return { win: isWin, result: outcome, change: isWin ? bet : -bet };
  }

  public static slot(userId: string, bet: number): { win: boolean; symbols: string[]; multiplier: number; change: number } {
    const user = this.getUser(userId);
    if (user.coins < bet) {
      throw new Error(`Yetersiz bakiye! Mevcut paranız: **${user.coins} Nights Coin**`);
    }

    const symbols = ['🍒', '🍋', '🍇', '💎', '7️⃣'];
    const s1 = symbols[Math.floor(Math.random() * symbols.length)];
    const s2 = symbols[Math.floor(Math.random() * symbols.length)];
    const s3 = symbols[Math.floor(Math.random() * symbols.length)];

    let multiplier = 0;
    if (s1 === s2 && s2 === s3) {
      multiplier = s1 === '7️⃣' ? 7 : 5;
    } else if (s1 === s2 || s2 === s3 || s1 === s3) {
      multiplier = 2;
    }

    const win = multiplier > 0;
    const change = win ? bet * (multiplier - 1) : -bet;
    user.coins += change;
    this.save();

    return { win, symbols: [s1, s2, s3], multiplier, change };
  }

  public static transfer(fromUserId: string, toUserId: string, amount: number): { success: boolean; message: string } {
    if (amount <= 0 || isNaN(amount)) {
      return { success: false, message: 'Geçersiz miktar! Pozitif bir sayı girmelisiniz.' };
    }
    if (fromUserId === toUserId) {
      return { success: false, message: 'Kendinize para transfer edemezsiniz!' };
    }

    const fromUser = this.getUser(fromUserId);
    if (fromUser.coins < amount) {
      return { success: false, message: `Yetersiz bakiye! Mevcut paranız: **${fromUser.coins} Nights Coin**` };
    }

    const toUser = this.getUser(toUserId);
    fromUser.coins -= amount;
    toUser.coins += amount;
    this.save();

    return {
      success: true,
      message: `Başarıyla <@${toUserId}> kullanıcısına **${amount} Nights Coin** aktarıldı!`,
    };
  }
}
