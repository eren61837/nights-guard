import dotenv from 'dotenv';
dotenv.config();

import { Client, GatewayIntentBits, PermissionFlagsBits } from 'discord.js';
import { config } from '../config';

const TARGET_GUILD_ID = '1568618183223414934';

async function main() {
  console.log('🔒 Alt Başlık (Thread) İzinleri Kesin Olarak Kilitleniyor...');

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  await client.login(config.discordToken);

  const guild = await client.guilds.fetch({ guild: TARGET_GUILD_ID, force: true });
  const roles = await guild.roles.fetch();

  const everyoneRole = guild.roles.everyone;
  const uyeRole = roles.find((r) => r.name === 'Üye');
  const botRole = roles.find((r) => r.name === 'Bot');

  // @everyone'dan tüm Thread izinlerini kaldır
  try {
    const evPerms = everyoneRole.permissions.remove([
      PermissionFlagsBits.CreatePublicThreads,
      PermissionFlagsBits.CreatePrivateThreads,
      PermissionFlagsBits.SendMessagesInThreads,
    ]);
    await everyoneRole.setPermissions(evPerms);
    console.log('  ✅ @everyone rolünden tüm alt başlık (Thread) izinleri kaldırıldı!');
  } catch (err: any) {
    console.warn('  ⚠️ @everyone hata:', err.message);
  }

  // Üye rolünden tüm Thread izinlerini kaldır
  if (uyeRole) {
    try {
      const uyePerms = uyeRole.permissions.remove([
        PermissionFlagsBits.CreatePublicThreads,
        PermissionFlagsBits.CreatePrivateThreads,
        PermissionFlagsBits.SendMessagesInThreads,
      ]);
      await uyeRole.setPermissions(uyePerms);
      console.log('  ✅ Üye rolünden tüm alt başlık (Thread) izinleri kaldırıldı!');
    } catch (err: any) {
      console.warn('  ⚠️ Üye rolü hata:', err.message);
    }
  }

  // Bot rolünden de kaldır
  if (botRole) {
    try {
      const bPerms = botRole.permissions.remove([
        PermissionFlagsBits.CreatePublicThreads,
        PermissionFlagsBits.CreatePrivateThreads,
        PermissionFlagsBits.SendMessagesInThreads,
      ]);
      await botRole.setPermissions(bPerms);
      console.log('  ✅ Bot rolünden alt başlık izinleri kaldırıldı!');
    } catch (err: any) {}
  }

  // Sunucudaki tüm kanallarda da @everyone için CreatePublicThreads ve CreatePrivateThreads kilitlendiğinden emin ol
  const channels = await guild.channels.fetch();
  for (const [, ch] of channels) {
    if (ch && ch.isTextBased() && !ch.isVoiceBased()) {
      try {
        await ch.permissionOverwrites.edit(everyoneRole.id, {
          CreatePublicThreads: false,
          CreatePrivateThreads: false,
          SendMessagesInThreads: false,
        });
      } catch (e) {}
    }
  }
  console.log('  ✅ Tüm metin kanallarında alt başlık oluşturma kesin olarak kilitlendi!');

  client.destroy();
}

main().catch(console.error);
