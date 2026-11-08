"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const discord_js_1 = require("discord.js");
const config_1 = require("../config");
const TARGET_GUILD_ID = '1568618183223414934';
async function main() {
    console.log('🗑️ Sayı saymaca kanalı aranıyor ve siliniyor...');
    const client = new discord_js_1.Client({ intents: [discord_js_1.GatewayIntentBits.Guilds] });
    await client.login(config_1.config.discordToken);
    const guild = await client.guilds.fetch({ guild: TARGET_GUILD_ID, force: true });
    const channels = await guild.channels.fetch();
    const chSayi = channels.find((c) => c && c.name.includes('sayi-saymaca'));
    if (chSayi) {
        await chSayi.delete('Kullanıcı isteğiyle sayı saymaca kaldırıldı');
        console.log(`✅ Kanal silindi: ${chSayi.name}`);
    }
    else {
        console.log('ℹ️ Sayı saymaca kanalı bulunamadı.');
    }
    client.destroy();
}
main().catch(console.error);
