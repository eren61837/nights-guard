"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const config_1 = require("../config");
async function main() {
    const client = new discord_js_1.Client({ intents: [discord_js_1.GatewayIntentBits.Guilds] });
    await client.login(config_1.config.discordToken);
    const guild = await client.guilds.fetch('1568618183223414934');
    const roles = await guild.roles.fetch();
    const sorted = Array.from(roles.values()).sort((a, b) => b.position - a.position);
    console.log('Roles:');
    sorted.forEach((r) => console.log(`[${r.position}] ${r.name} (${r.id})`));
    const botMember = await guild.members.fetch(client.user.id);
    console.log('Bot highest role position:', botMember.roles.highest.position, botMember.roles.highest.name);
    process.exit(0);
}
main();
