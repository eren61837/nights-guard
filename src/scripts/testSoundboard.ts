import { Client, GatewayIntentBits, Routes } from 'discord.js';
import * as dotenv from 'dotenv';
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('clientReady', async () => {
  try {
    const guild = await client.guilds.fetch('1568618183223414934');
    const res: any = await client.rest.get(Routes.guildSoundboardSounds(guild.id));
    console.log('Soundboard response:', JSON.stringify(res));
  } catch (e: any) {
    console.error('Error:', e);
  } finally {
    process.exit(0);
  }
});

client.login(process.env.DISCORD_TOKEN);
