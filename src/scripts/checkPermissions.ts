import { Client, GatewayIntentBits, PermissionFlagsBits } from 'discord.js';
import * as dotenv from 'dotenv';
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('clientReady', async () => {
  const guild = await client.guilds.fetch('1568618183223414934');
  const channels = await guild.channels.fetch();
  console.log('--- CHANNEL PERMISSIONS FOR @EVERYONE ---');
  for (const [, ch] of channels) {
    if (!ch) continue;
    const po = ch.permissionOverwrites.cache.get(guild.id);
    const denied = po?.deny?.has(PermissionFlagsBits.ViewChannel);
    const allowed = po?.allow?.has(PermissionFlagsBits.ViewChannel);
    const status = denied ? 'DENIED (Hidden)' : (allowed ? 'ALLOWED (Visible)' : 'DEFAULT (Inherited)');
    console.log(`[${ch.type}] ${ch.name} -> ${status}`);
  }
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
