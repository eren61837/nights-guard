import dotenv from 'dotenv';
dotenv.config();
import { Client, GatewayIntentBits } from 'discord.js';
import { config } from '../config';

const TARGET_GUILD_ID = '1568618183223414934';

async function main() {
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  await client.login(config.discordToken);
  const guild = await client.guilds.fetch({ guild: TARGET_GUILD_ID, force: true });
  console.log(`Sunucu: ${guild.name}`);

  console.log('\n--- KATEGORİLER VE KANALLAR ---');
  guild.channels.cache.forEach((c) => {
    if (c.type === 4) {
      console.log(`\n📁 [KATEGORİ] ${c.name}`);
      guild.channels.cache.filter((ch) => ch.parentId === c.id).forEach((ch) => {
        console.log(`   - #${ch.name} (ID: ${ch.id}, Tip: ${ch.type})`);
      });
    }
  });

  client.destroy();
  process.exit(0);
}

main().catch(console.error);
