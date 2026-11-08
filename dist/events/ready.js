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
Object.defineProperty(exports, "__esModule", { value: true });
exports.onReady = onReady;
const discord_js_1 = require("discord.js");
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
const gonderCmd = __importStar(require("../commands/gonder"));
const itirafCmd = __importStar(require("../commands/itiraf"));
const muzikCmd = __importStar(require("../commands/muzik"));
const seviye_1 = require("../commands/seviye");
const levelManager_1 = require("../services/features/levelManager");
async function onReady(client) {
    console.log(`\n======================================================`);
    console.log(`🛡️ NIGHTS GUARD (Made by erencix) ÇALIŞIYOR!`);
    console.log(`👤 Bot: ${client.user?.tag} (${client.user?.id})`);
    console.log(`🌐 Bağlı Sunucu Sayısı: ${client.guilds.cache.size}`);
    console.log(`======================================================\n`);
    // Dinamik ve zengin dönen durum (Rotating Rich Presence)
    const activities = [
        { name: '☊ Nights Topluluğu', type: discord_js_1.ActivityType.Watching },
        { name: '🛡️ 7/24 Sunucu & Medya Koruması', type: discord_js_1.ActivityType.Custom },
        { name: '🎙️ Ses Kanalları & Sohbet', type: discord_js_1.ActivityType.Listening },
        { name: '⭐ /yardim | Made by erencix', type: discord_js_1.ActivityType.Playing },
        { name: '💎 Seviye & Ekonomi Sistemi', type: discord_js_1.ActivityType.Competing },
    ];
    let currentActivityIndex = 0;
    client.user?.setPresence({
        activities: [activities[0]],
        status: 'online',
    });
    setInterval(() => {
        currentActivityIndex = (currentActivityIndex + 1) % activities.length;
        client.user?.setPresence({
            activities: [activities[currentActivityIndex]],
            status: 'online',
        });
    }, 15000);
    // Sesli Kanallarda Seviye & XP Takip Motorunu Başlat
    levelManager_1.LevelManager.startVoiceTracker(client);
    // Register Slash Commands Globally
    try {
        console.log('[Slash Commands] Slash komutları kaydediliyor...');
        const commands = [
            // Genel Kullanıcı Komutları (Tüm Üyelere Açık)
            yardimCmd.data,
            avatarCmd.data,
            sunucuCmd.data,
            afkCmd.data,
            istatistikCmd.data,
            kullaniciCmd.data,
            gonderCmd.data,
            itirafCmd.data,
            // Müzik Komutları (Tüm Üyelere Açık)
            muzikCmd.calData,
            muzikCmd.durdurData,
            muzikCmd.devamData,
            muzikCmd.gecData,
            muzikCmd.kuyrukData,
            muzikCmd.ayrilData,
            muzikCmd.sesData,
            // Moderasyon Komutu
            silCmd.data,
            // Seviye ve Sıralama Komutları (Tüm Üyelere Açık)
            seviye_1.rankData,
            seviye_1.topData,
            // Yönetici & Kurulum Komutları (Admin-Only, Normal Üyelere Gizli)
            seviye_1.seviyeAyarlaData,
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
            console.log(`[Slash Commands] ${commands.length} adet Slash komutu genel olarak kaydedildi!`);
        }
        // Sunucularda anında (0 saniye gecikmeyle) görünmesi için bağlı tüm sunuculara doğrudan kaydet
        for (const guild of client.guilds.cache.values()) {
            try {
                await guild.commands.set(commands);
                console.log(`[Slash Commands] ⚡ ${guild.name} sunucusuna ${commands.length} adet komut anında yüklendi!`);
            }
            catch (gErr) {
                console.warn(`[Slash Commands] ${guild.name} için sunucu içi kayıt atlandı:`, gErr.message);
            }
        }
    }
    catch (err) {
        console.error('[Slash Commands] Komutlar kaydedilirken hata oluştu:', err);
    }
}
