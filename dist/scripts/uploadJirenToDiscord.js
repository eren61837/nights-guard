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
const discord_js_1 = require("discord.js");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const client = new discord_js_1.Client({
    intents: [discord_js_1.GatewayIntentBits.Guilds, discord_js_1.GatewayIntentBits.GuildEmojisAndStickers]
});
client.once('clientReady', async () => {
    try {
        const guildId = '1568618183223414934';
        const guild = await client.guilds.fetch(guildId);
        console.log(`Sunucu: ${guild.name}`);
        // 1. SES PANELİNE (SOUNDBOARD) YÜKLE
        console.log('\n[1/3] 🎙️ Soundboard Sesi Yükleniyor...');
        const soundPath = path_1.default.resolve('assets/jiren_soundboard.mp3');
        const soundBuf = fs_1.default.readFileSync(soundPath);
        const soundDataUri = `data:audio/mp3;base64,${soundBuf.toString('base64')}`;
        try {
            const soundRes = await client.rest.post(discord_js_1.Routes.guildSoundboardSounds(guildId), {
                body: {
                    name: 'Jiren Dance',
                    sound: soundDataUri,
                    volume: 1.0,
                    emoji_name: '🕺'
                }
            });
            console.log(`✅ Soundboard Sesi Başarıyla Eklendi: "${soundRes.name}" (ID: ${soundRes.sound_id})`);
        }
        catch (soundErr) {
            console.error('❌ Soundboard Hata:', soundErr.message, soundErr.rawError || '');
        }
        // 2. HAREKETLİ ANİMASYONLU EMOJİYE YÜKLE
        console.log('\n[2/3] ✨ Jiren Dance GIF Emojisi Yükleniyor...');
        const gifPath = path_1.default.resolve('assets/jiren_emoji.gif');
        try {
            const emoji = await guild.emojis.create({
                attachment: gifPath,
                name: 'Jiren_Dance'
            });
            console.log(`✅ Animasyonlu GIF Emoji Eklendi: <a:${emoji.name}:${emoji.id}>`);
        }
        catch (emojiErr) {
            console.error('❌ Emoji Hata:', emojiErr.message);
        }
        // 3. ÇIKARTMAYA (STICKER) YÜKLE
        console.log('\n[3/3] 🖼️ Jiren Dance Çıkartması (Sticker) Yükleniyor...');
        const stickerPath = path_1.default.resolve('assets/jiren_sticker.png');
        const stickers = await guild.stickers.fetch();
        console.log(`Mevcut çıkartma sayısı: ${stickers.size}/15`);
        // Eğer 15/15 doluysa yer açmak için generic birini sil
        if (stickers.size >= 15) {
            const toRemove = stickers.find(s => s.name === 'Deadly_Kirby' || s.name === 'Rigby_Gaming') || stickers.first();
            if (toRemove) {
                console.log(`⚠️ Kapasite dolu (15/15). "${toRemove.name}" silinerek Jiren için yer açılıyor...`);
                await toRemove.delete('Jiren Dance çıkartması için yer açıldı');
                console.log(`🗑️ Silindi: ${toRemove.name}`);
            }
        }
        try {
            const sticker = await guild.stickers.create({
                file: stickerPath,
                name: 'Jiren_Dance',
                tags: '🕺'
            });
            console.log(`✅ Çıkartma Başarıyla Eklendi: ${sticker.name} (ID: ${sticker.id})`);
        }
        catch (stickerErr) {
            console.error('❌ Çıkartma Hata:', stickerErr.message);
        }
        console.log('\n🎉 JİREN DANSI TÜM PLATFORMLARA (SES, ÇIKARTMA, EMOJİ) EKLENDİ!');
    }
    catch (err) {
        console.error('Genel Hata:', err);
    }
    finally {
        process.exit(0);
    }
});
client.login(process.env.DISCORD_TOKEN);
