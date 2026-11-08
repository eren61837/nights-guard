"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const config_1 = require("../config");
const TARGET_GUILD_ID = '1568618183223414934';
async function main() {
    const client = new discord_js_1.Client({
        intents: [
            discord_js_1.GatewayIntentBits.Guilds,
            discord_js_1.GatewayIntentBits.GuildEmojisAndStickers,
            discord_js_1.GatewayIntentBits.GuildMessages,
            discord_js_1.GatewayIntentBits.GuildMembers,
        ],
    });
    client.once('clientReady', async () => {
        try {
            const guild = await client.guilds.fetch(TARGET_GUILD_ID);
            console.log('=== BOT USER INFO ===');
            console.log('Bot Username:', client.user?.username);
            console.log('Bot Tag:', client.user?.tag);
            console.log('\n=== GUILD INFO ===');
            console.log('Guild Name:', guild.name);
            console.log('Guild Description:', guild.description);
            console.log('\n=== CHANNELS & CATEGORIES ===');
            const channels = await guild.channels.fetch();
            for (const ch of channels.values()) {
                if (!ch)
                    continue;
                const topic = 'topic' in ch ? ch.topic : '';
                console.log(`[${ch.type}] ${ch.name} (topic: "${topic || ''}")`);
            }
            console.log('\n=== ROLES ===');
            const roles = await guild.roles.fetch();
            for (const r of roles.values()) {
                console.log(`Role: "${r.name}" (managed: ${r.managed})`);
            }
            console.log('\n=== STICKERS ===');
            const stickers = await guild.stickers.fetch();
            for (const s of stickers.values()) {
                console.log(`Sticker: "${s.name}" (desc: "${s.description}")`);
            }
            console.log('\n=== EMOJIS ===');
            const emojis = await guild.emojis.fetch();
            for (const e of emojis.values()) {
                if (e.name && e.name.toLowerCase().includes('prayt')) {
                    console.log(`Emoji with Prayt: "${e.name}" (${e.id})`);
                }
            }
            console.log('\n=== RECENT MESSAGES IN KEY CHANNELS ===');
            for (const ch of channels.values()) {
                if (!ch || !ch.isTextBased() || ch.isThread())
                    continue;
                try {
                    const msgs = await ch.messages.fetch({ limit: 10 });
                    for (const m of msgs.values()) {
                        const hasPrayt = m.content.toLowerCase().includes('prayt') ||
                            m.embeds.some((emb) => JSON.stringify(emb).toLowerCase().includes('prayt'));
                        if (hasPrayt) {
                            console.log(`Found "prayt" in channel #${ch.name} (msg: ${m.id})`);
                        }
                    }
                }
                catch (ignore) { }
            }
        }
        catch (err) {
            console.error(err);
        }
        finally {
            await client.destroy();
            process.exit(0);
        }
    });
    await client.login(config_1.config.discordToken);
}
main();
