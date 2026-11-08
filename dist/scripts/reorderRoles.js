"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const config_1 = require("../config");
const ROLES_ORDER = [
    '1568680202807156888', // Level 5
    '1568680215872278680', // Level 10
    '1568680219450155129', // Level 20
    '1568680222495084746', // Level 30
    '1568680226324484167', // Level 50
];
async function main() {
    const client = new discord_js_1.Client({ intents: [discord_js_1.GatewayIntentBits.Guilds] });
    await client.login(config_1.config.discordToken);
    const guild = await client.guilds.fetch('1568618183223414934');
    for (const roleId of ROLES_ORDER) {
        const role = await guild.roles.fetch(roleId);
        const vipRole = await guild.roles.fetch('1568644529828012072'); // VIP role
        if (role && vipRole) {
            console.log(`Setting ${role.name} position to below VIP (${vipRole.position - 1})...`);
            // Setting position to vipRole.position - 1 pushes it just below VIP
            await role.setPosition(vipRole.position - 1);
            await new Promise((r) => setTimeout(r, 600));
        }
    }
    console.log('✅ Reordering complete.');
    process.exit(0);
}
main();
