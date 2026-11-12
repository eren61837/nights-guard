import dotenv from 'dotenv';
dotenv.config();

import { Client, GatewayIntentBits, PermissionFlagsBits } from 'discord.js';
import { config } from '../config';
import { LanguageGateManager } from '../services/features/languageGateManager';

const TARGET_GUILD_ID = '1568618183223414934';

async function main() {
  console.log('🚀 [DeployLanguageGate] Dil kapısı ve izole kayıt sistemi uygulanıyor...');

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
    ],
  });

  await client.login(config.discordToken);

  const guild = await client.guilds.fetch({ guild: TARGET_GUILD_ID, force: true });
  console.log(`✅ Sunucuya bağlanıldı: ${guild.name} (${guild.id})`);

  // 1. Dil kapısı, rolleri, kanalları ve panelleri kur
  await LanguageGateManager.ensureLanguageGate(guild);

  console.log('\n🔍 [Doğrulama] Kanal izinleri kontrol ediliyor...');
  const channels = await guild.channels.fetch();
  let visibleToEveryoneCount = 0;

  for (const [, ch] of channels) {
    if (!ch) continue;
    const po = ch.permissionOverwrites.cache.get(guild.id);
    const denied = po?.deny?.has(PermissionFlagsBits.ViewChannel);
    const allowed = po?.allow?.has(PermissionFlagsBits.ViewChannel);

    if (allowed) {
      console.log(`  🟢 [AÇIK] ${ch.name} (${ch.type})`);
      visibleToEveryoneCount++;
    } else if (denied) {
      // Hidden
    } else {
      console.log(`  ⚪ [VARSAYILAN] ${ch.name} (${ch.type})`);
    }
  }

  console.log(`\n📊 @everyone rolüne doğrudan açık kanal sayısı: ${visibleToEveryoneCount}`);
  console.log('✨ [Tamamlandı] Dil seçim ve kayıt kapısı kusursuz şekilde hazır!');

  client.destroy();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Hata oluştu:', err);
  process.exit(1);
});
