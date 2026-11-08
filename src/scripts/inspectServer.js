const { Client, GatewayIntentBits, ChannelType } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
    try {
        const guild = await client.guilds.fetch('1568618183223414934');
        console.log('=== GUILD INFO ===');
        console.log('Name:', guild.name, '| ID:', guild.id, '| Members:', guild.memberCount);

        const channels = await guild.channels.fetch();
        const categories = channels.filter(c => c && c.type === ChannelType.GuildCategory);
        
        console.log('\n=== CATEGORIES & CHANNELS ===');
        for (const [, cat] of categories) {
            console.log(`\n📁 CATEGORY: ${cat.name} (${cat.id})`);
            const children = channels.filter(c => c && c.parentId === cat.id).sort((a,b) => a.rawPosition - b.rawPosition);
            for (const [, ch] of children) {
                console.log(`   - [${ch.type}] ${ch.name} (${ch.id})`);
            }
        }

        const uncategorized = channels.filter(c => c && !c.parentId && c.type !== ChannelType.GuildCategory);
        if (uncategorized.size > 0) {
            console.log('\n📁 UNCATEGORIZED:');
            for (const [, ch] of uncategorized) {
                console.log(`   - [${ch.type}] ${ch.name} (${ch.id})`);
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        client.destroy();
    }
});

client.login(process.env.DISCORD_TOKEN);
