import { Client, GatewayIntentBits, Routes } from 'discord.js';
import * as dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildEmojisAndStickers]
});

client.once('clientReady', async () => {
  try {
    const guild = await client.guilds.fetch('1568618183223414934');
    console.log(`Sunucu: ${guild.name} (Tier: ${guild.premiumTier})`);

    // Stickers
    const stickers = await guild.stickers.fetch();
    console.log(`\nStickers count: ${stickers.size} / 15`);
    stickers.forEach(s => {
      console.log(`- Sticker: ${s.name} (ID: ${s.id}, format: ${s.format})`);
    });

    // Soundboard
    try {
      const sounds = await client.rest.get(Routes.guildSoundboardSounds(guild.id)) as any[];
      console.log(`\nSoundboard sounds count: ${sounds.length}`);
      sounds.forEach(s => {
        console.log(`- Sound: ${s.name} (ID: ${s.sound_id})`);
      });
    } catch (e: any) {
      console.log('Soundboard error / endpoint check:', e.message);
    }
  } catch (err: any) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
});

client.login(process.env.DISCORD_TOKEN);
