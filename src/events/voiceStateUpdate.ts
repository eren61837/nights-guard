import { VoiceState } from 'discord.js';
import { VoiceLobbyManager } from '../services/features/voiceLobbyManager';

export async function onVoiceStateUpdate(oldState: VoiceState, newState: VoiceState): Promise<void> {
  try {
    await VoiceLobbyManager.handleVoiceStateUpdate(oldState, newState);
  } catch (err) {
    console.error('[VoiceStateUpdate] Hata:', err);
  }
}
