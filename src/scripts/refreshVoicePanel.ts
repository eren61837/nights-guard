import dotenv from 'dotenv';
dotenv.config();

import {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionFlagsBits,
  TextChannel,
} from 'discord.js';
import { config } from '../config';
import { VoicePanelManager } from '../services/features/voicePanelManager';

const GUILD_ID = '1568618183223414934';

async function main() {
  console.log('🎛️ Ses Kontrol Paneli Yenileniyor...');

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  });

  await client.login(config.discordToken);

  const guild = await client.guilds.fetch(GUILD_ID);
  if (!guild) {
    console.error('Sunucu bulunamadı!');
    client.destroy();
    return;
  }

  const channels = await guild.channels.fetch();
  const voicePanelChannel = channels.find(
    (c) =>
      c &&
      c.type === ChannelType.GuildText &&
      (c.id === '1568654013405204701' ||
        c.name.includes('kontrol-paneli') ||
        c.name.includes('ses-paneli'))
  ) as TextChannel | undefined;

  if (!voicePanelChannel) {
    console.error('❌ Ses paneli kanalı bulunamadı!');
    client.destroy();
    return;
  }

  // Ensure channel name is 🎛️・ses-paneli
  if (voicePanelChannel.name !== '🎛️・ses-paneli') {
    await voicePanelChannel.setName('🎛️・ses-paneli').catch(() => {});
  }

  // Delete previous bot messages in this channel
  const oldMessages = await voicePanelChannel.messages.fetch({ limit: 10 });
  for (const [, msg] of oldMessages) {
    if (msg.author.id === client.user?.id) {
      await msg.delete().catch(() => {});
    }
  }

  // Send upgraded panel with 10 buttons (2 rows)
  await voicePanelChannel.send({
    embeds: [VoicePanelManager.getVoicePanelEmbed()],
    components: VoicePanelManager.getVoicePanelControls(),
  });

  console.log('✅ #🎛️・ses-paneli başarıyla 10 butonlu yeni sistemle yenilendi!');
  client.destroy();
}

main().catch(console.error);
