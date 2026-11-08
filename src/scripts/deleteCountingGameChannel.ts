import dotenv from 'dotenv';
dotenv.config();

import { Client, GatewayIntentBits } from 'discord.js';
import { config } from '../config';

const TARGET_GUILD_ID = '1568618183223414934';

async function main() {
  console.log('🗑️ Sayı saymaca kanalı aranıyor ve siliniyor...');

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  await client.login(config.discordToken);

  const guild = await client.guilds.fetch({ guild: TARGET_GUILD_ID, force: true });
  const channels = await guild.channels.fetch();

  const chSayi = channels.find((c) => c && c.name.includes('sayi-saymaca'));
  if (chSayi) {
    await chSayi.delete('Kullanıcı isteğiyle sayı saymaca kaldırıldı');
    console.log(`✅ Kanal silindi: ${chSayi.name}`);
  } else {
    console.log('ℹ️ Sayı saymaca kanalı bulunamadı.');
  }

  client.destroy();
}

main().catch(console.error);
