import { VoiceState, ChannelType, PermissionFlagsBits, VoiceChannel } from 'discord.js';

export class VoiceLobbyManager {
  private static tempVoiceChannels = new Set<string>();

  public static async handleVoiceStateUpdate(oldState: VoiceState, newState: VoiceState): Promise<void> {
    const { member, guild } = newState;
    if (!member || !guild) return;

    // Check if user joined the Trigger channel ("➕・Oda Oluştur")
    const joinedChannel = newState.channel;
    if (joinedChannel && (joinedChannel.name.includes('Oda Oluştur') || joinedChannel.name.includes('Create Voice'))) {
      try {
        const category = joinedChannel.parent;

        // Create temporary voice room
        const roomName = `🔊・${member.displayName} Odası`;
        const tempVoice = await guild.channels.create({
          name: roomName,
          type: ChannelType.GuildVoice,
          parent: category?.id,
          permissionOverwrites: [
            {
              id: member.id,
              allow: [
                PermissionFlagsBits.ManageChannels,
                PermissionFlagsBits.MoveMembers,
                PermissionFlagsBits.Connect,
                PermissionFlagsBits.Speak,
              ],
            },
          ],
        });

        this.tempVoiceChannels.add(tempVoice.id);

        // Move member to the new room
        await member.voice.setChannel(tempVoice);
      } catch (err) {
        console.error('[VoiceLobbyManager] Geçici oda oluşturulurken hata:', err);
      }
    }

    // Check if user left a temporary room, and if that room is now empty, delete it
    const leftChannel = oldState.channel;
    if (leftChannel) {
      const isKnownTemp = this.tempVoiceChannels.has(leftChannel.id);
      const isDynamicPattern =
        (leftChannel.name.includes('Odası') || leftChannel.name.includes('Room') || leftChannel.name.includes('Lobby')) &&
        !leftChannel.name.includes('Oda Oluştur') &&
        !leftChannel.name.includes('Create Voice') &&
        !leftChannel.name.includes('Oyun Odası') &&
        !leftChannel.name.includes('Sohbet Odası') &&
        !leftChannel.name.includes('AFK') &&
        !leftChannel.name.includes('Müzik');

      if ((isKnownTemp || isDynamicPattern) && leftChannel.members.size === 0) {
        try {
          this.tempVoiceChannels.delete(leftChannel.id);
          await leftChannel.delete('Geçici oda boşaldığı için temizlendi.');
        } catch (err) {
          console.error('[VoiceLobbyManager] Boş oda silinirken hata:', err);
        }
      }
    }
  }
}
