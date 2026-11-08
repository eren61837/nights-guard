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
    intents: [discord_js_1.GatewayIntentBits.Guilds, discord_js_1.GatewayIntentBits.GuildMembers]
});
client.once('clientReady', async () => {
    try {
        const guild = await client.guilds.fetch('1568618183223414934');
        const members = await guild.members.fetch();
        console.log(`Sunucuda ${members.size} üye bulundu. Takma adlar güncelleniyor...`);
        for (const [, member] of members) {
            if (member.user.bot)
                continue;
            const currentNick = member.nickname;
            // Eğer zaten takma adı varsa ve başında ☊ yoksa
            if (currentNick && !currentNick.startsWith('☊')) {
                const newNick = `☊ ${currentNick}`.slice(0, 32);
                try {
                    await member.setNickname(newNick);
                    console.log(`✅ [${member.user.tag}] Takma ad güncellendi: "${currentNick}" -> "${newNick}"`);
                }
                catch (err) {
                    console.log(`⚠️ [${member.user.tag}] Takma ad değiştirilemedi (yetki yetersiz olabilir): ${err.message}`);
                }
            }
            else if (!currentNick) {
                // Eğer kayıtlı bir üyeyse (Onaylı veya Erkek/Kız rolü varsa) ama takma adı yoksa
                const hasApproved = member.roles.cache.some(r => r.name.includes('Onaylı') || r.name.includes('Erkek') || r.name.includes('Kız'));
                if (hasApproved && !member.permissions.has('Administrator')) {
                    const newNick = `☊ ${member.user.username}`.slice(0, 32);
                    try {
                        await member.setNickname(newNick);
                        console.log(`✅ [${member.user.tag}] Varsayılan nick güncellendi: "${newNick}"`);
                    }
                    catch (err) {
                        console.log(`⚠️ [${member.user.tag}] Değiştirilemedi: ${err.message}`);
                    }
                }
            }
        }
        console.log('🎉 Mevcut üyelerin takma ad güncellemesi tamamlandı!');
    }
    catch (error) {
        console.error('Hata:', error);
    }
    finally {
        process.exit(0);
    }
});
client.login(process.env.DISCORD_TOKEN);
