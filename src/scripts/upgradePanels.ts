import dotenv from 'dotenv';
dotenv.config();

import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import { config } from '../config';

const TARGET_GUILD_ID = '1568618183223414934';

async function main() {
  console.log('🎨 [Registration Upgrade] 2 Adımlı Aşamalı Kayıt Sistemi Kuruluyor...');

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages],
  });

  await client.login(config.discordToken);

  const guild = await client.guilds.fetch({ guild: TARGET_GUILD_ID, force: true });
  console.log(`✅ Sunucuya bağlanıldı: ${guild.name}`);

  // 1. Dil seçimi ve registration kanallarını tamamen sil
  const channels = await guild.channels.fetch();
  for (const [, ch] of channels) {
    if (ch && (ch.name.includes('dil-secimi') || ch.name.includes('registration') || ch.name.includes('register-en'))) {
      console.log(`🗑️ Dil kanalı siliniyor: #${ch.name}`);
      await ch.delete('Dil seçimi kaldırıldı, eski kayıt sistemine dönüldü').catch(() => {});
    }
  }

  // 2. LanguageGateManager'ı (Registration Engine) çalıştır
  const { LanguageGateManager } = await import('../services/features/languageGateManager');

  console.log('\n🚀 Kanallar ve izinler ayarlanıyor...');
  await LanguageGateManager.ensureRegistrationChannels(guild);

  console.log('\n🎉 YENİ 2 ADIMLI AŞAMALI KAYIT SİSTEMİ BAŞARIYLA KURULDU!');
  client.destroy();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Hata:', err);
  process.exit(1);
});
