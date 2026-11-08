import { Client, GatewayIntentBits } from 'discord.js';
import * as dotenv from 'dotenv';
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('clientReady', async () => {
  const guild = await client.guilds.fetch('1568618183223414934');
  const automod = await guild.autoModerationRules.fetch();
  console.log('Automod rules count:', automod.size);
  automod.forEach(r => {
    console.log(`- Rule: "${r.name}" | TriggerType: ${r.triggerType} | Actions: ${r.actions.map(a => a.type).join(', ')} | ExemptRoles: ${r.exemptRoles.size} | ExemptChannels: ${r.exemptChannels.size}`);
  });
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
