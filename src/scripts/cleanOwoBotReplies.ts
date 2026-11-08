import dotenv from 'dotenv';
dotenv.config();

import { Client, GatewayIntentBits } from 'discord.js';
import { config } from '../config';

const TARGET_GUILD_ID = '1568618183223414934';

async function main() {
  console.log('🧹 OwO botunun "disabled" mesajları aranıyor ve siliniyor...');

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  await client.login(config.discordToken);

  const guild = await client.guilds.fetch({ guild: TARGET_GUILD_ID, force: true });
  if (!guild) {
    console.error('Sunucu bulunamadı!');
    process.exit(1);
  }

  const channels = await guild.channels.fetch();
  let totalDeleted = 0;

  for (const [, ch] of channels) {
    if (ch && ch.isTextBased() && !ch.isVoiceBased()) {
      try {
        const messages = await ch.messages.fetch({ limit: 100 });
        for (const [, msg] of messages) {
          const content = msg.content.toLowerCase();
          const isOwo = msg.author.bot && (msg.author.username.toLowerCase().includes('owo') || msg.author.id === '408785106942164992');
          
          // Check if OwO message mentions disabled or commands
          if (isOwo && (content.includes('disable') || content.includes('command') || content.includes('disabled'))) {
            try {
              await msg.delete();
              totalDeleted++;
              console.log(`  🗑️ Silindi [#${ch.name}]: "${msg.content.slice(0, 50)}"`);
              await new Promise((r) => setTimeout(r, 200));
            } catch (e: any) {
              console.warn(`  ⚠️ Silinemedi [#${ch.name}]:`, e.message);
            }
          }
        }
      } catch (err: any) {}
    }
  }

  console.log(`\n✅ OwO mesajları temizliği tamamlandı! Toplam silinen mesaj: ${totalDeleted}`);
  client.destroy();
}

main().catch(console.error);
