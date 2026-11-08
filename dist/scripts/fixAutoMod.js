"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const config_1 = require("../config");
const TARGET_GUILD_ID = '1568618183223414934';
async function main() {
    const client = new discord_js_1.Client({ intents: [discord_js_1.GatewayIntentBits.Guilds] });
    client.once('clientReady', async () => {
        try {
            const guild = await client.guilds.fetch(TARGET_GUILD_ID);
            const automod = await guild.autoModerationRules.fetch();
            console.log(`AutoMod rules found: ${automod.size}`);
            for (const rule of automod.values()) {
                console.log(`Rule: "${rule.name}" (id: ${rule.id})`);
                if (rule.name.toLowerCase().includes('prayt')) {
                    const newName = rule.name.replace(/prayt/gi, 'Nights');
                    await rule.setName(newName);
                    console.log(`✅ Renamed AutoMod rule: "${rule.name}" -> "${newName}"`);
                }
            }
        }
        catch (e) {
            console.error('AutoMod error:', e.message);
        }
        finally {
            await client.destroy();
            process.exit(0);
        }
    });
    await client.login(config_1.config.discordToken);
}
main();
