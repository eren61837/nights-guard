import { Client, GatewayIntentBits } from 'discord.js';
import * as dotenv from 'dotenv';
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('clientReady', async () => {
  const guild = await client.guilds.fetch('1568618183223414934');
  const channels = await guild.channels.fetch();
  channels.forEach(c => {
    if (c) console.log(`${c.type}: ${c.name} (${c.id})`);
  });
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
