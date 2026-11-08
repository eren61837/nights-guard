import dotenv from 'dotenv';
dotenv.config();

import { Client, GatewayIntentBits } from 'discord.js';
import { config } from '../config';
import { MusicPlayer } from '../services/features/musicPlayer';

const TARGET_GUILD_ID = '1568618183223414934';

async function main() {
  console.log('🔄 #muzik-komut paneli yeni neon equalizer görseliyle güncelleniyor...');

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  });

  await client.login(config.discordToken);

  const guild = await client.guilds.fetch({ guild: TARGET_GUILD_ID, force: true });
  const channels = await guild.channels.fetch();

  const chMuzikKomut = channels.find((c) => c && c.name.includes('muzik-komut') && c.isTextBased());
  if (chMuzikKomut && chMuzikKomut.isTextBased()) {
    const oldMsgs = await (chMuzikKomut as any).messages.fetch({ limit: 10 });
    for (const [, m] of oldMsgs) await m.delete();

    await (chMuzikKomut as any).send({
      embeds: [MusicPlayer.getMusicPanelEmbed()],
      components: [MusicPlayer.getMusicControls()],
    });
    console.log('✅ #muzik-komut yeni neon equalizer görseliyle güncellendi!');
  } else {
    console.error('Kanal bulunamadı!');
  }

  client.destroy();
}

main().catch(console.error);
