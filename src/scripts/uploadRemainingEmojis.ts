import dotenv from 'dotenv';
dotenv.config();

import { Client, GatewayIntentBits } from 'discord.js';
import axios from 'axios';
import { config } from '../config';

const TARGET_GUILD_ID = '1568618183223414934';

async function main() {
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  await client.login(config.discordToken);

  const guild = await client.guilds.fetch({ guild: TARGET_GUILD_ID, force: true });
  const existingEmojis = await guild.emojis.fetch();
  console.log(`Mevcut emoji sayısı: ${existingEmojis.size}`);

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

  // Select top static and animated not already uploaded
  const existingNames = new Set(existingEmojis.map((e) => e.name?.toLowerCase()));

  const toUpload = cleanList
    .filter((e) => {
      let name = e.title.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 30);
      return !existingNames.has(name.toLowerCase());
    })
    .slice(0, 35);

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
        reason: 'Prayt Topluluk Emojileri',
      });

      added++;
      console.log(`  [+${added}] Eklendi: :${cleanName}:`);
      await new Promise((r) => setTimeout(r, 600));
    } catch (err: any) {
      if (err.message.includes('Maximum number of emojis reached')) {
        console.log('⚠️ Sunucu emoji limitine ulaşıldı.');
        break;
      } else if (err.status === 429 || err.message.includes('rate limit')) {
        console.log('⚠️ Discord emoji hız sınırına (rate-limit) ulaşıldı, kalanlar için bekleniyor.');
        break;
      } else {
        console.warn(`  ⚠️ Emoji eklenemedi (${cleanName}):`, err.message);
      }
    }
  }

  const finalEmojis = await guild.emojis.fetch();
  console.log(`Sonuç: Sunucuda toplam ${finalEmojis.size} adet emoji aktif!`);

  client.destroy();
}

main().catch(console.error);
