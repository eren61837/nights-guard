"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const discord_js_1 = require("discord.js");
const config_1 = require("../config");
const voicePanelManager_1 = require("../services/features/voicePanelManager");
const GUILD_ID = '1568618183223414934';
async function main() {
    console.log('🎛️ Ses Kontrol Paneli Yenileniyor...');
    const client = new discord_js_1.Client({
        intents: [discord_js_1.GatewayIntentBits.Guilds, discord_js_1.GatewayIntentBits.GuildMessages],
    });
    await client.login(config_1.config.discordToken);
    const guild = await client.guilds.fetch(GUILD_ID);
    if (!guild) {
        console.error('Sunucu bulunamadı!');
        client.destroy();
        return;
    }
    const channels = await guild.channels.fetch();
    const voicePanelChannel = channels.find((c) => c &&
        c.type === discord_js_1.ChannelType.GuildText &&
        (c.id === '1568654013405204701' ||
            c.name.includes('kontrol-paneli') ||
            c.name.includes('ses-paneli')));
    if (!voicePanelChannel) {
        console.error('❌ Ses paneli kanalı bulunamadı!');
        client.destroy();
        return;
    }
    // Ensure channel name is 🎛️・ses-paneli
    if (voicePanelChannel.name !== '🎛️・ses-paneli') {
        await voicePanelChannel.setName('🎛️・ses-paneli').catch(() => { });
    }
    // Delete previous bot messages in this channel
    const oldMessages = await voicePanelChannel.messages.fetch({ limit: 10 });
    for (const [, msg] of oldMessages) {
        if (msg.author.id === client.user?.id) {
            await msg.delete().catch(() => { });
        }
    }
    // Send upgraded panel with 10 buttons (2 rows)
    await voicePanelChannel.send({
        embeds: [voicePanelManager_1.VoicePanelManager.getVoicePanelEmbed()],
        components: voicePanelManager_1.VoicePanelManager.getVoicePanelControls(),
    });
    console.log('✅ #🎛️・ses-paneli başarıyla 10 butonlu yeni sistemle yenilendi!');
    client.destroy();
}
main().catch(console.error);
