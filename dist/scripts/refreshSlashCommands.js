"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const discord_js_1 = require("discord.js");
const config_1 = require("../config");
const aiKurCmd = __importStar(require("../commands/aiKur"));
const aiLogoCmd = __importStar(require("../commands/aiLogo"));
const aiOnizleCmd = __importStar(require("../commands/aiOnizle"));
const sunucuTemizleCmd = __importStar(require("../commands/sunucuTemizle"));
const yardimCmd = __importStar(require("../commands/yardim"));
const planCmd = __importStar(require("../commands/plan"));
const boostCmd = __importStar(require("../commands/boost"));
const teamworkCmd = __importStar(require("../commands/teamwork"));
const browserCmd = __importStar(require("../commands/browser"));
const davetCmd = __importStar(require("../commands/davet"));
const mesajGonderCmd = __importStar(require("../commands/mesajGonder"));
const silCmd = __importStar(require("../commands/sil"));
const avatarCmd = __importStar(require("../commands/avatar"));
const sunucuCmd = __importStar(require("../commands/sunucu"));
const afkCmd = __importStar(require("../commands/afk"));
const istatistikCmd = __importStar(require("../commands/istatistik"));
const kullaniciCmd = __importStar(require("../commands/kullanici"));
const seviyeCmd = __importStar(require("../commands/seviye"));
const gonderCmd = __importStar(require("../commands/gonder"));
const itirafCmd = __importStar(require("../commands/itiraf"));
const muzikCmd = __importStar(require("../commands/muzik"));
async function main() {
    console.log('🔄 Slash komutları güncelleniyor (Müzik komutları dahil)...');
    const client = new discord_js_1.Client({ intents: [discord_js_1.GatewayIntentBits.Guilds] });
    await client.login(config_1.config.discordToken);
    const commands = [
        // Topluluk & Eğlence Komutları
        seviyeCmd.rankData,
        seviyeCmd.topData,
        seviyeCmd.seviyeAyarlaData,
        yardimCmd.data,
        avatarCmd.data,
        sunucuCmd.data,
        afkCmd.data,
        silCmd.data,
        istatistikCmd.data,
        kullaniciCmd.data,
        gonderCmd.data,
        itirafCmd.data,
        // Müzik Komutları
        muzikCmd.calData,
        muzikCmd.durdurData,
        muzikCmd.devamData,
        muzikCmd.gecData,
        muzikCmd.kuyrukData,
        muzikCmd.ayrilData,
        muzikCmd.sesData,
        // Yönetici & Kurulum Komutları
        aiKurCmd.data,
        planCmd.data,
        aiLogoCmd.data,
        aiOnizleCmd.data,
        boostCmd.data,
        teamworkCmd.data,
        browserCmd.data,
        sunucuTemizleCmd.data,
        davetCmd.data,
        mesajGonderCmd.data,
        mesajGonderCmd.aliasData,
    ];
    if (client.application) {
        await client.application.commands.set(commands);
        console.log(`✅ ${commands.length} adet Slash komutu Discord API'ye başarıyla kaydedildi (Müzik komutları tamamen temizlendi)!`);
    }
    client.destroy();
}
main().catch(console.error);
