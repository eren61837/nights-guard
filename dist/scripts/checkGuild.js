"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const discord_js_1 = require("discord.js");
const config_1 = require("../config");
const client = new discord_js_1.Client({
    intents: [discord_js_1.GatewayIntentBits.Guilds, discord_js_1.GatewayIntentBits.GuildVoiceStates, discord_js_1.GatewayIntentBits.GuildMessages, discord_js_1.GatewayIntentBits.MessageContent]
});
async function main() {
    await client.login(config_1.config.discordToken);
    const guild = await client.guilds.fetch('1568618183223414934');
    console.log('Sunucu:', guild.name);
    console.log('Boost Seviyesi:', guild.premiumTier);
    const emojis = await guild.emojis.fetch();
    console.log('Emoji Sayısı:', emojis.size);
    const channels = await guild.channels.fetch();
    console.log('Kanallar:');
    channels.forEach((ch) => {
        if (ch)
            console.log(`[${ch.type}] ${ch.name} (${ch.id})`);
    });
    const roles = await guild.roles.fetch();
    console.log('Roller:');
    roles.forEach((r) => {
        console.log(`- ${r.name} (pos: ${r.position}, hoist: ${r.hoist})`);
    });
    client.destroy();
}
main().catch(console.error);
