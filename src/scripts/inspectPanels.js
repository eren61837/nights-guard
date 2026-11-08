const { Client, GatewayIntentBits } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
    try {
        const guild = await client.guilds.fetch('1568618183223414934');
        const channelIds = [
            { name: 'kayit-onay', id: '1568644551797899368' },
            { name: 'cinsiyet-secimi', id: '1568644553567641644' },
            { name: 'kurallar', id: '1568644556139008154' },
            { name: 'itiraf-duvarı', id: '1568993069364281474' },
            { name: 'destek-talebi', id: '1568661850504306781' },
            { name: 'ses-paneli', id: '1568654013405204701' },
            { name: 'click-me', id: '1568646148468768779' }
        ];

        console.log('=== CHANNEL STATUS CHECK ===');
        for (const chInfo of channelIds) {
            const ch = await guild.channels.fetch(chInfo.id).catch(() => null);
            if (!ch) {
                console.log(`[MISSING] ${chInfo.name} (${chInfo.id})`);
                continue;
            }
            const messages = await ch.messages.fetch({ limit: 5 }).catch(() => null);
            console.log(`[OK] #${ch.name} -> Message Count: ${messages ? messages.size : 'error'}`);
            if (messages && messages.size > 0) {
                const first = messages.first();
                console.log(`     Last msg by: ${first.author.tag} | content/embed: ${first.embeds.length ? first.embeds[0].title : first.content.slice(0, 50)}`);
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        client.destroy();
    }
});

client.login(process.env.DISCORD_TOKEN);
