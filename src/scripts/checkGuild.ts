import dotenv from 'dotenv';
dotenv.config();
import { Client, GatewayIntentBits } from 'discord.js';
import { config } from '../config';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

async function main() {
  await client.login(config.discordToken);
  const guild = await client.guilds.fetch('1568618183223414934');
  console.log('Sunucu:', guild.name);
  console.log('Boost Seviyesi:', guild.premiumTier);
  const emojis = await guild.emojis.fetch();
  console.log('Emoji Sayısı:', emojis.size);
  const channels = await guild.channels.fetch();
  console.log('Kanallar:');
  channels.forEach((ch) => {
    if (ch) console.log(`[${ch.type}] ${ch.name} (${ch.id})`);
  });
  const roles = await guild.roles.fetch();
  console.log('Roller:');
  roles.forEach((r) => {
    console.log(`- ${r.name} (pos: ${r.position}, hoist: ${r.hoist})`);
  });
  client.destroy();
}

main().catch(console.error);
