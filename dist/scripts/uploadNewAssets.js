"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config");
const TARGET_GUILD_ID = '1568618183223414934';
const STICKERS_TO_UPLOAD = [
    {
        name: 'Loki_Crown',
        url: 'https://raw.githubusercontent.com/katerberg/emojis/master/loki.png',
        tag: '👑',
        description: 'Marvel Loki Golden Horns Crown Sticker',
    },
    {
        name: 'Loki_Mischief',
        url: 'https://cdn3.emoji.gg/emojis/37963-loki-smile.png',
        tag: '😈',
        description: 'Loki Smirk Mischief Sticker',
    },
    {
        name: 'Loki_Marvel',
        url: 'https://cdn3.emoji.gg/emojis/73524-loki-marvelrivals.png',
        tag: '💚',
        description: 'Marvel Rivals Loki Sticker',
    },
    {
        name: 'Lokitty',
        url: 'https://cdn3.emoji.gg/emojis/8080-lokitty.png',
        tag: '🐱',
        description: 'Cute Lokitty Horns Cat Sticker',
    },
    {
        name: 'Pepe_Wine',
        url: 'https://cdn3.emoji.gg/emojis/868020-pepewine.png',
        tag: '🍷',
        description: 'Pepe Cheers Wine Sticker',
    },
    {
        name: 'Pepe_Happy',
        url: 'https://cdn3.emoji.gg/emojis/943635-pepehappy.png',
        tag: '😊',
        description: 'Pepe Wholesome Happy Smile Sticker',
    },
    {
        name: 'Vegeta_Power',
        url: 'https://cdn.stickers.gg/stickers/59491-vegeta.png',
        tag: '⚡',
        description: 'Vegeta Super Saiyan Power Sticker',
    },
    {
        name: 'Rigby_Gaming',
        url: 'https://cdn.stickers.gg/stickers/64387-rigby.png',
        tag: '🎮',
        description: 'Rigby Gamer Pro Sticker',
    },
    {
        name: 'Deadly_Kirby',
        url: 'https://cdn.stickers.gg/stickers/9917-deadlycurby.png',
        tag: '💥',
        description: 'Deadly Kirby Tactical Meme Sticker',
    },
    {
        name: 'Nitro_Booster',
        url: 'https://cdn3.emoji.gg/emojis/526202-booster.png',
        tag: '🚀',
        description: 'Discord Server Nitro Booster Rocket Sticker',
    },
];
const EMOJIS_TO_UPLOAD = [
    // 1. Loki Emojileri (Özel İstek!)
    { name: 'Loki_Smile', url: 'https://cdn3.emoji.gg/emojis/37963-loki-smile.png' },
    { name: 'Loki_Marvel', url: 'https://cdn3.emoji.gg/emojis/73524-loki-marvelrivals.png' },
    { name: 'Loki_Heart', url: 'https://cdn3.emoji.gg/emojis/14479-lokiheart.png' },
    { name: 'Loki_Wink', url: 'https://cdn3.emoji.gg/emojis/35992-lokiwink.png' },
    { name: 'Loki_Cheers', url: 'https://cdn3.emoji.gg/emojis/92731-lokicheers.png' },
    { name: 'Loki_Laugh', url: 'https://cdn3.emoji.gg/emojis/33937-lokilaugh.png' },
    { name: 'Loki_ThumbsUp', url: 'https://cdn3.emoji.gg/emojis/23480-lokithumbsup.png' },
    { name: 'Loki_Wave', url: 'https://cdn3.emoji.gg/emojis/41156-lokiwave.png' },
    { name: 'Loki_Popcorn', url: 'https://cdn3.emoji.gg/emojis/63244-lokipopcorn.png' },
    { name: 'Loki_Stab', url: 'https://cdn3.emoji.gg/emojis/7566-lokistab.png' },
    { name: 'Loki_Vanish', url: 'https://cdn3.emoji.gg/emojis/9355-lokivanish.gif' },
    { name: 'Lokitty', url: 'https://cdn3.emoji.gg/emojis/8080-lokitty.png' },
    { name: 'Loki_Helmet', url: 'https://raw.githubusercontent.com/jmeridth/emojis/master/loki.png' },
    { name: 'Loki_Crown', url: 'https://raw.githubusercontent.com/katerberg/emojis/master/loki.png' },
    // 2. Pepe Emojileri
    { name: 'Pepe_Wine', url: 'https://cdn3.emoji.gg/emojis/868020-pepewine.png' },
    { name: 'Pepe_Happy', url: 'https://cdn3.emoji.gg/emojis/943635-pepehappy.png' },
    { name: 'Pepe_Eat', url: 'https://cdn3.emoji.gg/emojis/985242-pepeeat.png' },
    { name: 'Pepe_Stare', url: 'https://cdn3.emoji.gg/emojis/689168-pepestare.png' },
    { name: 'Pepe_Stop', url: 'https://cdn3.emoji.gg/emojis/23615-pepestop.png' },
    // 3. Nitro & Topluluk Rozetleri
    { name: 'Discord_Nitro', url: 'https://cdn3.emoji.gg/emojis/330960-nitro.png' },
    { name: 'Nitro_Boost', url: 'https://cdn3.emoji.gg/emojis/526202-booster.png' },
    // 4. Animasyonlu Gaming & Eğlence (GIF)
    { name: 'Diamond_Pickaxe', url: 'https://cdn3.emoji.gg/emojis/137353-diamondpickaxe.gif' },
    { name: 'Diamond_Axe', url: 'https://cdn3.emoji.gg/emojis/223627-diamondaxe.gif' },
    { name: 'Magic_Potion', url: 'https://cdn3.emoji.gg/emojis/25903-potion.gif' },
    { name: 'Kitty_HeartEyes', url: 'https://cdn3.emoji.gg/emojis/27453-pinkkittyhearteyes.gif' },
    { name: 'Kitty_Money', url: 'https://cdn3.emoji.gg/emojis/868374-pinkkittymoneyeyes.gif' },
    { name: 'Delcatty_Dance', url: 'https://cdn3.emoji.gg/emojis/413937-delcatty.gif' },
    { name: 'DBZ_Logo', url: 'https://cdn3.emoji.gg/emojis/698180-dbzdragonballanimelogo.gif' },
];
async function downloadBuffer(url) {
    const res = await axios_1.default.get(url, {
        responseType: 'arraybuffer',
        timeout: 10000,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
    });
    return Buffer.from(res.data);
}
async function uploadAssets() {
    console.log('🚀 Yeni Çıkartmalar ve Loki & Popüler Emojiler Yükleniyor...');
    const client = new discord_js_1.Client({
        intents: [discord_js_1.GatewayIntentBits.Guilds, discord_js_1.GatewayIntentBits.GuildEmojisAndStickers],
    });
    client.once('clientReady', async () => {
        try {
            const guild = await client.guilds.fetch(TARGET_GUILD_ID);
            console.log(`🏰 Hedef Sunucu: ${guild.name} (Premium Tier: ${guild.premiumTier})`);
            // ==========================================
            // 1. ÇIKARTMALAR (STICKERS)
            // ==========================================
            console.log('\n--- 1. Yeni Çıkartmalar (Stickers) Yükleniyor ---');
            const currentStickers = await guild.stickers.fetch();
            const existingStickerNames = new Set(currentStickers.map((s) => s.name.toLowerCase()));
            const maxStickers = guild.premiumTier === 1 ? 15 : guild.premiumTier === 2 ? 30 : guild.premiumTier === 3 ? 60 : 5;
            console.log(`Mevcut Çıkartmalar: ${currentStickers.size} / ${maxStickers}`);
            let stickersAdded = 0;
            for (const st of STICKERS_TO_UPLOAD) {
                if (existingStickerNames.has(st.name.toLowerCase())) {
                    console.log(`⏩ Çıkartma zaten mevcut: ${st.name}`);
                    continue;
                }
                if (currentStickers.size + stickersAdded >= maxStickers) {
                    console.log(`⚠️ Çıkartma limiti (${maxStickers}) doldu.`);
                    break;
                }
                try {
                    const buffer = await downloadBuffer(st.url);
                    const created = await guild.stickers.create({
                        file: buffer,
                        name: st.name,
                        tags: st.tag,
                        description: st.description,
                    });
                    stickersAdded++;
                    console.log(`[${stickersAdded}] ✅ Yeni Çıkartma Eklendi: ${created.name} (Tag: ${created.tags})`);
                    existingStickerNames.add(st.name.toLowerCase());
                    await new Promise((r) => setTimeout(r, 1400));
                }
                catch (err) {
                    console.warn(`❌ Çıkartma eklenemedi (${st.name}):`, err.message);
                    if (err.message.includes('429')) {
                        console.log('⏳ Rate limit! 5s bekleniyor...');
                        await new Promise((r) => setTimeout(r, 5000));
                    }
                }
            }
            // ==========================================
            // 2. YENİ EMOJİLER (LOKI + PEPE + NITRO + GIF)
            // ==========================================
            console.log('\n--- 2. Yeni Emojiler Yükleniyor ---');
            const currentEmojis = await guild.emojis.fetch();
            const existingEmojiNames = new Set(currentEmojis.map((e) => e.name?.toLowerCase()));
            console.log(`Mevcut Emojiler: ${currentEmojis.size} adet`);
            let emojisAdded = 0;
            for (const em of EMOJIS_TO_UPLOAD) {
                const cleanName = em.name.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 32);
                if (existingEmojiNames.has(cleanName.toLowerCase())) {
                    console.log(`⏩ Emoji zaten mevcut: :${cleanName}:`);
                    continue;
                }
                try {
                    const buffer = await downloadBuffer(em.url);
                    const created = await guild.emojis.create({
                        attachment: buffer,
                        name: cleanName,
                        reason: 'Prayt Topluluk Loki & Özel Emojileri',
                    });
                    emojisAdded++;
                    console.log(`[${emojisAdded}/${EMOJIS_TO_UPLOAD.length}] ✅ Emoji Eklendi: <${created.animated ? 'a' : ''}:${created.name}:${created.id}>`);
                    existingEmojiNames.add(cleanName.toLowerCase());
                    await new Promise((r) => setTimeout(r, 1200));
                }
                catch (err) {
                    console.warn(`⚠️ Emoji eklenemedi (:${cleanName}:):`, err.message);
                    if (err.message.includes('429')) {
                        console.log('⏳ Rate limit! 5s bekleniyor...');
                        await new Promise((r) => setTimeout(r, 5000));
                    }
                }
            }
            console.log('\n==============================================');
            console.log(`🎉 BAŞARIYLA TAMAMLANDI!`);
            console.log(`🏷️ Eklenen Çıkartmalar: ${stickersAdded} adet`);
            console.log(`✨ Eklenen Emojiler: ${emojisAdded} adet`);
            console.log('==============================================');
        }
        catch (err) {
            console.error('Genel hata:', err);
        }
        finally {
            await client.destroy();
            process.exit(0);
        }
    });
    await client.login(config_1.config.discordToken);
}
uploadAssets().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
