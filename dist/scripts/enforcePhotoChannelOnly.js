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
const discord_js_1 = require("discord.js");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const client = new discord_js_1.Client({
    intents: [discord_js_1.GatewayIntentBits.Guilds]
});
client.once('clientReady', async () => {
    try {
        const guild = await client.guilds.fetch('1568618183223414934');
        console.log(`Sunucu: ${guild.name}`);
        const roles = await guild.roles.fetch();
        const everyoneRole = guild.roles.everyone;
        const uyeRole = roles.find(r => r.name === 'Üye');
        const onayliRole = roles.find(r => r.name.toLowerCase() === 'onaylı' || r.name.includes('Onaylı'));
        // Seviye rolleri
        const levelRoles = roles.filter(r => r.name.includes('Level '));
        const targetRoles = [everyoneRole, uyeRole, onayliRole, ...levelRoles.values()].filter(Boolean);
        console.log(`Hedef rol sayısı: ${targetRoles.length}`);
        const channels = await guild.channels.fetch();
        for (const [, channel] of channels) {
            if (!channel || !channel.isTextBased() || channel.isThread() || channel.isVoiceBased())
                continue;
            const tc = channel;
            const chName = tc.name.toLowerCase();
            // Fotoğraf kanalı: #foto-medya
            if (chName.includes('foto-medya')) {
                console.log(`\n📸 [FOTOĞRAF KANALI] #${tc.name} -> Fotoğraf izni AÇILIYOR.`);
                for (const role of targetRoles) {
                    if (!role)
                        continue;
                    await tc.permissionOverwrites.edit(role.id, {
                        AttachFiles: true,
                        EmbedLinks: true,
                    }, { reason: 'Fotoğraf kanalı için medya izni açıldı' }).catch(() => { });
                }
                console.log(`  ✅ #${tc.name} kanalında fotoğraf paylaşımı serbest bırakıldı.`);
            }
            else {
                // Fotoğraf kanalı dışındaki tüm kanallar (ticket hariç): AttachFiles KAPATILIR
                if (chName.startsWith('bilet-') || chName.startsWith('ticket-'))
                    continue;
                console.log(`🔒 #${tc.name} -> Fotoğraf izni KAPATILIYOR.`);
                for (const role of targetRoles) {
                    if (!role)
                        continue;
                    await tc.permissionOverwrites.edit(role.id, {
                        AttachFiles: false,
                    }, { reason: 'Fotoğraf paylaşımı sadece #foto-medya kanalına sınırlandırıldı' }).catch(() => { });
                }
                console.log(`  ✅ #${tc.name} kanalında fotoğraf atma kapatıldı.`);
            }
        }
        console.log('\n🎉 TÜM KANALLARDA FOTOĞRAF İZİNLERİ KİLİTLENDİ!');
        console.log('Artık sadece #📸・foto-medya kanalında fotoğraf atılabilir.');
    }
    catch (err) {
        console.error('Hata:', err.message);
    }
    finally {
        process.exit(0);
    }
});
client.login(process.env.DISCORD_TOKEN);
