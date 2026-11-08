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
const client = new discord_js_1.Client({ intents: [discord_js_1.GatewayIntentBits.Guilds, discord_js_1.GatewayIntentBits.GuildEmojisAndStickers] });
client.once('clientReady', async () => {
    try {
        const guild = await client.guilds.fetch('1568618183223414934');
        const emojis = await guild.emojis.fetch();
        console.log(`Sunucuda toplam ${emojis.size} emoji bulundu.`);
        const matched = emojis.filter(e => e.name?.toLowerCase().includes('succ'));
        console.log(`"succ" içeren emoji sayısı: ${matched.size}`);
        if (matched.size === 0) {
            console.log('Tüm emojiler listeleniyor (benzer isim kontrolü için):');
            emojis.forEach(e => {
                if (e.animated) {
                    console.log(`- [ANIMATED] ${e.name} (${e.id})`);
                }
            });
        }
        for (const [, emoji] of matched) {
            console.log(`Bulundu: ${emoji.name} (ID: ${emoji.id}, Animated: ${emoji.animated})`);
            await emoji.delete('Kullanıcı isteğiyle silindi');
            console.log(`✅ Başarıyla silindi: ${emoji.name}`);
        }
    }
    catch (err) {
        console.error('Hata:', err.message);
    }
    finally {
        process.exit(0);
    }
});
client.login(process.env.DISCORD_TOKEN);
