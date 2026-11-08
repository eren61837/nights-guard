import { Client, GatewayIntentBits } from 'discord.js';
import * as dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

client.once('ready', async () => {
  const guild = await client.guilds.fetch('1568618183223414934');
  const members = await guild.members.fetch();
  console.log('Members count:', members.size);
  members.forEach(m => {
    console.log(`- ${m.user.tag} (ID: ${m.id}) | Nick: ${m.nickname} | Roles: ${m.roles.cache.map(r => r.name).join(', ')}`);
  });
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
