import dotenv from 'dotenv';
dotenv.config();

import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
import { config } from '../config';

const TARGET_GUILD_ID = '1568618183223414934';

async function main() {
  console.log('🗑️ Sunucu İstatistikleri kategorisi ve kanalları aranıyor ve siliniyor...');

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  await client.login(config.discordToken);

  const guild = await client.guilds.fetch({ guild: TARGET_GUILD_ID, force: true });
  const channels = await guild.channels.fetch();

  const category = channels.find(
    (c) => c && c.type === ChannelType.GuildCategory && c.name.includes('SUNUCU İSTATİSTİKLERİ')
  );

  let deletedCount = 0;

  // İstatistik kategorisinin altındaki tüm ses kanallarını sil
  if (category) {
    for (const [, ch] of channels) {
      if (ch && ch.parentId === category.id) {
        try {
          await ch.delete('İstatistik kanalları kaldırılıyor');
          deletedCount++;
          console.log(`  🗑️ Silindi: ${ch.name}`);
        } catch (e: any) {
          console.warn(`  ⚠️ Kanal silinemedi:`, e.message);
        }
      }
    }

    try {
      await category.delete('İstatistik kategorisi kaldırılıyor');
      deletedCount++;
      console.log(`  🗑️ Silindi: ${category.name}`);
    } catch (e: any) {
      console.warn(`  ⚠️ Kategori silinemedi:`, e.message);
    }
  } else {
    // Kategori bulunamadıysa isimle ara
    for (const [, ch] of channels) {
      if (
        ch &&
        (ch.name.includes('Toplam Üye') ||
          ch.name.includes('Aktif Üye') ||
          ch.name.includes('Sesteki') ||
          ch.name.includes('Güvenlik:'))
      ) {
        try {
          await ch.delete();
          deletedCount++;
          console.log(`  🗑️ Silindi: ${ch.name}`);
        } catch (e) {}
      }
    }
  }

  console.log(`✅ Sunucu istatistikleri başarıyla silindi! Toplam silinen: ${deletedCount}`);
  client.destroy();
}

main().catch(console.error);
