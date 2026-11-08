import dotenv from 'dotenv';
dotenv.config();

import { Client, GatewayIntentBits } from 'discord.js';
import axios from 'axios';
import { config } from '../config';

const TARGET_GUILD_ID = '1568618183223414934';

const STICKERS_TO_CREATE = [
  {
    name: 'Prayt_Fire',
    tags: '🔥',
    description: 'Prayt Fire & Hype Sticker',
    url: 'https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/color/618x618/1F525.png',
  },
  {
    name: 'Prayt_Cool',
    tags: '😎',
    description: 'Prayt Cool Sunglasses Sticker',
    url: 'https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/color/618x618/1F60E.png',
  },
  {
    name: 'Prayt_Gaming',
    tags: '🎮',
    description: 'Prayt Gaming Controller Sticker',
    url: 'https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/color/618x618/1F3AE.png',
  },
  {
    name: 'Prayt_Trophy',
    tags: '🏆',
    description: 'Prayt Victory GG Trophy Sticker',
    url: 'https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/color/618x618/1F3C6.png',
  },
];

async function main() {
  console.log('🎨 Çıkartmalar (Stickers) ve Yeni Emojiler Yükleniyor...');

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildEmojisAndStickers,
    ],
  });

  await client.login(config.discordToken);

  const guild = await client.guilds.fetch({ guild: TARGET_GUILD_ID, force: true });
  if (!guild) {
    console.error('❌ Sunucu bulunamadı!');
    client.destroy();
    return;
  }

  // 1. ÇIKARTMALAR (STICKERS)
  console.log('\n--- 1. Sunucu Çıkartmaları (Stickers) Kurulumu ---');
  const existingStickers = await guild.stickers.fetch();
  console.log(`Mevcut çıkartma sayısı: ${existingStickers.size} / 5`);

  const existingStickerNames = new Set(existingStickers.map((s) => s.name.toLowerCase()));

  for (const st of STICKERS_TO_CREATE) {
    if (existingStickerNames.has(st.name.toLowerCase())) {
      console.log(`  ⏩ Çıkartma zaten mevcut: ${st.name}`);
      continue;
    }

    if (existingStickers.size >= 5) {
      console.log('  ⚠️ Çıkartma limiti (5/5) doldu, daha fazla çıkartma eklenemez.');
      break;
    }

    try {
      const res = await axios.get(st.url, { responseType: 'arraybuffer', timeout: 10000 });
      const sticker = await guild.stickers.create({
        file: Buffer.from(res.data),
        name: st.name,
        tags: st.tags,
        description: st.description,
      });
      console.log(`  ✅ Yeni Çıkartma Oluşturuldu: ${sticker.name} (${sticker.id})`);
      existingStickerNames.add(sticker.name.toLowerCase());
      await new Promise((r) => setTimeout(r, 1200));
    } catch (err: any) {
      console.warn(`  ❌ Çıkartma oluşturulamadı (${st.name}):`, err.message);
    }
  }

  // 2. YENİ EMOJİLER
  console.log('\n--- 2. Yeni Popüler Topluluk Emojileri Yüklemesi ---');
  const existingEmojis = await guild.emojis.fetch();
  console.log(`Mevcut emoji sayısı: ${existingEmojis.size}`);

  const existingEmojiNames = new Set(existingEmojis.map((e) => e.name?.toLowerCase()));

  try {
    const apiRes = await axios.get('https://emoji.gg/api', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 15000,
    });
    const allEmojis: any[] = apiRes.data;

    const blockedWords = ['nsfw', 'porn', 'thot', 'loli', 'lewd', 'boob', 'dick', 'sex', 'gay', 'kill', 'suicide', 'kys'];
    const cleanList = allEmojis.filter((e) => {
      if (!e.title || !e.image) return false;
      const lower = e.title.toLowerCase();
      return !blockedWords.some((w) => lower.includes(w));
    });

    cleanList.sort((a, b) => (b.faves || 0) - (a.faves || 0));

    const toUpload = cleanList
      .filter((e) => {
        let name = e.title.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 30);
        return !existingEmojiNames.has(name.toLowerCase());
      })
      .slice(0, 20); // 20 yeni emoji

    console.log(`Yüklenecek aday emoji sayısı: ${toUpload.length}`);

    let added = 0;
    for (const item of toUpload) {
      let cleanName = item.title.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 30);
      if (cleanName.length < 2) cleanName = `e_${cleanName}`;

      try {
        const imgRes = await axios.get(item.image, {
          responseType: 'arraybuffer',
          timeout: 10000,
        });

        await guild.emojis.create({
          attachment: Buffer.from(imgRes.data),
          name: cleanName,
          reason: 'Prayt Yeni Topluluk Emojileri',
        });

        added++;
        console.log(`  [${added}/${toUpload.length}] ✅ Emoji yüklendi: :${cleanName}:`);
        existingEmojiNames.add(cleanName.toLowerCase());
        await new Promise((r) => setTimeout(r, 1200));
      } catch (e: any) {
        console.warn(`  ⚠️ Emoji atlandı (${cleanName}): ${e.message}`);
        if (e.message.includes('429') || e.message.includes('rate limit')) {
          console.log('  ⏳ Rate limit algılandı, 5 saniye bekleniyor...');
          await new Promise((r) => setTimeout(r, 5000));
        }
      }
    }

    console.log(`\n🎉 Toplam ${added} yeni emoji ve çıkartmalar başarıyla yüklendi!`);
  } catch (err: any) {
    console.error('Emoji API hatası:', err.message);
  }

  client.destroy();
}

main().catch(console.error);
