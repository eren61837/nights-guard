import dotenv from 'dotenv';
dotenv.config();

import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import { config } from '../config';

const TARGET_GUILD_ID = '1568618183223414934';

async function main() {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  });

  await client.login(config.discordToken);
  const guild = await client.guilds.fetch({ guild: TARGET_GUILD_ID, force: true });

  const { LanguageGateManager } = await import('../services/features/languageGateManager');

  // 1. kayit-onay kanalındaki eski mesajları sil ve yeni iki dilli paneli bas
  const kayitCh = guild.channels.cache.find((c) => c && c.name.includes('kayit-onay')) as TextChannel | undefined;
  if (kayitCh) {
    console.log('Mesajlar temizleniyor: #kayit-onay');
    const msgs = await kayitCh.messages.fetch({ limit: 10 });
    for (const [, m] of msgs) {
      if (m.author.id === client.user!.id) await m.delete().catch(() => {});
    }
    await LanguageGateManager.sendKayitOnayPanel(kayitCh);
    console.log('✅ #kayit-onay paneli güncellendi!');
  }

  // 2. cinsiyet-secimi kanalındaki eski mesajları sil ve yeni iki dilli paneli bas
  const cinsiyetCh = guild.channels.cache.find((c) => c && c.name.includes('cinsiyet-secimi')) as TextChannel | undefined;
  if (cinsiyetCh) {
    console.log('Mesajlar temizleniyor: #cinsiyet-secimi');
    const msgs = await cinsiyetCh.messages.fetch({ limit: 10 });
    for (const [, m] of msgs) {
      if (m.author.id === client.user!.id) await m.delete().catch(() => {});
    }
    await LanguageGateManager.sendCinsiyetSecimiPanel(cinsiyetCh);
    console.log('✅ #cinsiyet-secimi paneli güncellendi!');
  }

  client.destroy();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
