import { Client, GatewayIntentBits } from 'discord.js';
import { config } from '../config';

async function main() {
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  await client.login(config.discordToken);
  const guild = await client.guilds.fetch('1568618183223414934');
  const roles = await guild.roles.fetch();
  const sorted = Array.from(roles.values()).sort((a, b) => b.position - a.position);
  console.log('Roles:');
  sorted.forEach((r) => console.log(`[${r.position}] ${r.name} (${r.id})`));

  const botMember = await guild.members.fetch(client.user!.id);
  console.log('Bot highest role position:', botMember.roles.highest.position, botMember.roles.highest.name);
  process.exit(0);
}
main();
