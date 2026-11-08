"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EconomyManager = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DATA_FILE = path_1.default.resolve('assets/economyData.json');
class EconomyManager {
    static userEconomy = new Map();
    static loaded = false;
    static load() {
        if (this.loaded)
            return;
        try {
            if (fs_1.default.existsSync(DATA_FILE)) {
                const raw = fs_1.default.readFileSync(DATA_FILE, 'utf-8');
                const parsed = JSON.parse(raw);
                for (const [k, v] of Object.entries(parsed)) {
                    this.userEconomy.set(k, v);
                }
            }
        }
        catch (e) { }
        this.loaded = true;
    }
    static save() {
        try {
            const dir = path_1.default.dirname(DATA_FILE);
            if (!fs_1.default.existsSync(dir))
                fs_1.default.mkdirSync(dir, { recursive: true });
            const obj = {};
            for (const [k, v] of this.userEconomy.entries()) {
                obj[k] = v;
            }
            fs_1.default.writeFileSync(DATA_FILE, JSON.stringify(obj, null, 2), 'utf-8');
        }
        catch (e) { }
    }
    static getUser(userId) {
        this.load();
        let data = this.userEconomy.get(userId);
        if (!data) {
            data = { coins: 100, lastDaily: 0, lastWork: 0 }; // 100 Başlangıç Parası
            this.userEconomy.set(userId, data);
        }
        return data;
    }
    static getBalance(userId) {
        return this.getUser(userId).coins;
    }
    static addCoins(userId, amount) {
        const user = this.getUser(userId);
        user.coins += amount;
        this.save();
    }
    static removeCoins(userId, amount) {
        const user = this.getUser(userId);
        if (user.coins < amount)
            return false;
        user.coins -= amount;
        this.save();
        return true;
    }
    static claimDaily(userId) {
        const user = this.getUser(userId);
        const now = Date.now();
        const cooldown = 24 * 60 * 60 * 1000;
        if (now - user.lastDaily < cooldown) {
            return { success: false, amount: 0, nextTime: user.lastDaily + cooldown };
        }
        const reward = 500;
        user.coins += reward;
        user.lastDaily = now;
        this.save();
        return { success: true, amount: reward };
    }
    static work(userId) {
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
    static coinflip(userId, bet, choice) {
        const user = this.getUser(userId);
        if (user.coins < bet) {
            throw new Error(`Yetersiz bakiye! Mevcut paranız: **${user.coins} Nights Coin**`);
        }
        const outcome = Math.random() < 0.5 ? 'yazi' : 'tura';
        const isWin = outcome === choice;
        if (isWin) {
            user.coins += bet;
        }
        else {
            user.coins -= bet;
        }
        this.save();
        return { win: isWin, result: outcome, change: isWin ? bet : -bet };
    }
    static slot(userId, bet) {
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
        }
        else if (s1 === s2 || s2 === s3 || s1 === s3) {
            multiplier = 2;
        }
        const win = multiplier > 0;
        const change = win ? bet * (multiplier - 1) : -bet;
        user.coins += change;
        this.save();
        return { win, symbols: [s1, s2, s3], multiplier, change };
    }
    static transfer(fromUserId, toUserId, amount) {
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
exports.EconomyManager = EconomyManager;
