import { Client, GatewayIntentBits } from 'discord.js';
import { config } from '../config';

async function main() {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildEmojisAndStickers],
  });

  client.once('clientReady', async () => {
    try {
      const guild = await client.guilds.fetch('1568618183223414934');
      const emojis = await guild.emojis.fetch();
      console.log('--- Current Emojis ---');
      emojis.forEach((e) => console.log(`${e.name} (${e.animated ? 'GIF' : 'PNG'}, id: ${e.id})`));

      const stickers = await guild.stickers.fetch();
      console.log('--- Current Stickers ---');
      stickers.forEach((s) => console.log(`${s.name} (id: ${s.id})`));
    } catch (err) {
      console.error(err);
    } finally {
      await client.destroy();
      process.exit(0);
    }
  });

  await client.login(config.discordToken);
}
main();
