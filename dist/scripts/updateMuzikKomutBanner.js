"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const discord_js_1 = require("discord.js");
const config_1 = require("../config");
const musicPlayer_1 = require("../services/features/musicPlayer");
const TARGET_GUILD_ID = '1568618183223414934';
async function main() {
    console.log('🔄 #muzik-komut paneli yeni neon equalizer görseliyle güncelleniyor...');
    const client = new discord_js_1.Client({
        intents: [discord_js_1.GatewayIntentBits.Guilds, discord_js_1.GatewayIntentBits.GuildMessages],
    });
    await client.login(config_1.config.discordToken);
    const guild = await client.guilds.fetch({ guild: TARGET_GUILD_ID, force: true });
    const channels = await guild.channels.fetch();
    const chMuzikKomut = channels.find((c) => c && c.name.includes('muzik-komut') && c.isTextBased());
    if (chMuzikKomut && chMuzikKomut.isTextBased()) {
        const oldMsgs = await chMuzikKomut.messages.fetch({ limit: 10 });
        for (const [, m] of oldMsgs)
            await m.delete();
        await chMuzikKomut.send({
            embeds: [musicPlayer_1.MusicPlayer.getMusicPanelEmbed()],
            components: [musicPlayer_1.MusicPlayer.getMusicControls()],
        });
        console.log('✅ #muzik-komut yeni neon equalizer görseliyle güncellendi!');
    }
    else {
        console.error('Kanal bulunamadı!');
    }
    client.destroy();
}
main().catch(console.error);
