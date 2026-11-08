"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onVoiceStateUpdate = onVoiceStateUpdate;
const voiceLobbyManager_1 = require("../services/features/voiceLobbyManager");
async function onVoiceStateUpdate(oldState, newState) {
    try {
        await voiceLobbyManager_1.VoiceLobbyManager.handleVoiceStateUpdate(oldState, newState);
    }
    catch (err) {
        console.error('[VoiceStateUpdate] Hata:', err);
    }
}
