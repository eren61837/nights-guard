"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const discord_js_1 = require("discord.js");
const config_1 = require("../config");
const ticketManager_1 = require("../services/features/ticketManager");
const GUILD_ID = '1568618183223414934';
async function main() {
    console.log('🎫 Dedicated Destek Talepleri Kategorisi Kuruluyor...');
    const client = new discord_js_1.Client({
        intents: [
            discord_js_1.GatewayIntentBits.Guilds,
            discord_js_1.GatewayIntentBits.GuildMessages,
            discord_js_1.GatewayIntentBits.GuildMembers,
        ],
    });
    await client.login(config_1.config.discordToken);
    const guild = await client.guilds.fetch(GUILD_ID);
    if (!guild) {
        console.error('❌ Sunucu bulunamadı!');
        client.destroy();
        return;
    }
    const channels = await guild.channels.fetch();
    const roles = await guild.roles.fetch();
    const everyoneRole = guild.roles.everyone;
    const onayliRole = roles.find((r) => r.name === 'Onaylı');
    const uyeRole = roles.find((r) => r.name === 'Üye');
    const modRole = roles.find((r) => r.name === 'Moderatör');
    const yoneticiRole = roles.find((r) => r.name === 'Yönetici');
    const kurucuRole = roles.find((r) => r.name === 'Kurucu');
    // 1. Find or create Category: 🎫 ┃ DESTEK TALEPLERİ
    let ticketCategory = channels.find((c) => c &&
        c.type === discord_js_1.ChannelType.GuildCategory &&
        (c.name.includes('DESTEK') || c.name.includes('BİLET')));
    if (!ticketCategory) {
        console.log('  🔨 "🎫 ┃ DESTEK TALEPLERİ" kategorisi oluşturuluyor...');
        ticketCategory = await guild.channels.create({
            name: '🎫 ┃ DESTEK TALEPLERİ',
            type: discord_js_1.ChannelType.GuildCategory,
            permissionOverwrites: [
                {
                    id: everyoneRole.id,
                    deny: [
                        discord_js_1.PermissionFlagsBits.ViewChannel,
                        discord_js_1.PermissionFlagsBits.SendMessages,
                        discord_js_1.PermissionFlagsBits.CreatePublicThreads,
                        discord_js_1.PermissionFlagsBits.CreatePrivateThreads,
                        discord_js_1.PermissionFlagsBits.SendMessagesInThreads,
                    ],
                },
                ...(guild.members.me
                    ? [
                        {
                            id: guild.members.me.id,
                            allow: [
                                discord_js_1.PermissionFlagsBits.ViewChannel,
                                discord_js_1.PermissionFlagsBits.SendMessages,
                                discord_js_1.PermissionFlagsBits.ManageChannels,
                                discord_js_1.PermissionFlagsBits.ReadMessageHistory,
                            ],
                        },
                    ]
                    : []),
                ...(onayliRole
                    ? [
                        {
                            id: onayliRole.id,
                            allow: [
                                discord_js_1.PermissionFlagsBits.ViewChannel,
                                discord_js_1.PermissionFlagsBits.ReadMessageHistory,
                            ],
                            deny: [
                                discord_js_1.PermissionFlagsBits.SendMessages,
                                discord_js_1.PermissionFlagsBits.CreatePublicThreads,
                                discord_js_1.PermissionFlagsBits.CreatePrivateThreads,
                            ],
                        },
                    ]
                    : []),
                ...(uyeRole
                    ? [
                        {
                            id: uyeRole.id,
                            allow: [
                                discord_js_1.PermissionFlagsBits.ViewChannel,
                                discord_js_1.PermissionFlagsBits.ReadMessageHistory,
                            ],
                            deny: [
                                discord_js_1.PermissionFlagsBits.SendMessages,
                                discord_js_1.PermissionFlagsBits.CreatePublicThreads,
                                discord_js_1.PermissionFlagsBits.CreatePrivateThreads,
                            ],
                        },
                    ]
                    : []),
                ...(modRole
                    ? [
                        {
                            id: modRole.id,
                            allow: [
                                discord_js_1.PermissionFlagsBits.ViewChannel,
                                discord_js_1.PermissionFlagsBits.SendMessages,
                                discord_js_1.PermissionFlagsBits.ManageMessages,
                                discord_js_1.PermissionFlagsBits.ReadMessageHistory,
                            ],
                        },
                    ]
                    : []),
                ...(yoneticiRole
                    ? [
                        {
                            id: yoneticiRole.id,
                            allow: [
                                discord_js_1.PermissionFlagsBits.ViewChannel,
                                discord_js_1.PermissionFlagsBits.SendMessages,
                                discord_js_1.PermissionFlagsBits.ManageMessages,
                                discord_js_1.PermissionFlagsBits.ReadMessageHistory,
                            ],
                        },
                    ]
                    : []),
                ...(kurucuRole
                    ? [
                        {
                            id: kurucuRole.id,
                            allow: [
                                discord_js_1.PermissionFlagsBits.ViewChannel,
                                discord_js_1.PermissionFlagsBits.SendMessages,
                                discord_js_1.PermissionFlagsBits.ManageMessages,
                                discord_js_1.PermissionFlagsBits.ReadMessageHistory,
                            ],
                        },
                    ]
                    : []),
            ],
        });
        console.log(`  ✅ Kategori oluşturuldu: ${ticketCategory.name} (${ticketCategory.id})`);
    }
    else {
        console.log(`  ℹ️ Kategori zaten mevcut: ${ticketCategory.name} (${ticketCategory.id})`);
    }
    // 2. Set Category Position (Right after Topluluk/Sohbet)
    const communityCat = channels.find((c) => c && c.type === discord_js_1.ChannelType.GuildCategory && c.name.includes('SOHBET'));
    if (communityCat && ticketCategory) {
        try {
            await ticketCategory.setPosition(communityCat.position + 1);
            console.log(`  📌 Kategori pozisyonu ayarlandı: ${ticketCategory.position}`);
        }
        catch (posErr) {
            console.warn('  ⚠️ Pozisyon ayarlanırken uyarı:', posErr);
        }
    }
    // 3. Find #destek-talebi channel and move it to this dedicated category
    let ticketChannel = channels.find((c) => c && c.type === discord_js_1.ChannelType.GuildText && c.name.includes('destek-talebi'));
    if (ticketChannel) {
        console.log(`  🚚 #destek-talebi kanalı (${ticketChannel.id}) ${ticketCategory.name} altına taşınıyor...`);
        await ticketChannel.setParent(ticketCategory.id, { lockPermissions: false });
        // Set permissions on #destek-talebi so all verified members see the panel
        const channelOverwrites = [
            {
                id: everyoneRole.id,
                deny: [
                    discord_js_1.PermissionFlagsBits.ViewChannel,
                    discord_js_1.PermissionFlagsBits.SendMessages,
                    discord_js_1.PermissionFlagsBits.CreatePublicThreads,
                    discord_js_1.PermissionFlagsBits.CreatePrivateThreads,
                ],
            },
            ...(guild.members.me
                ? [
                    {
                        id: guild.members.me.id,
                        allow: [
                            discord_js_1.PermissionFlagsBits.ViewChannel,
                            discord_js_1.PermissionFlagsBits.SendMessages,
                            discord_js_1.PermissionFlagsBits.ManageChannels,
                            discord_js_1.PermissionFlagsBits.ReadMessageHistory,
                        ],
                    },
                ]
                : []),
        ];
        if (onayliRole) {
            channelOverwrites.push({
                id: onayliRole.id,
                allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.ReadMessageHistory],
                deny: [
                    discord_js_1.PermissionFlagsBits.SendMessages,
                    discord_js_1.PermissionFlagsBits.CreatePublicThreads,
                    discord_js_1.PermissionFlagsBits.CreatePrivateThreads,
                    discord_js_1.PermissionFlagsBits.SendMessagesInThreads,
                ],
            });
        }
        if (uyeRole) {
            channelOverwrites.push({
                id: uyeRole.id,
                allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.ReadMessageHistory],
                deny: [
                    discord_js_1.PermissionFlagsBits.SendMessages,
                    discord_js_1.PermissionFlagsBits.CreatePublicThreads,
                    discord_js_1.PermissionFlagsBits.CreatePrivateThreads,
                    discord_js_1.PermissionFlagsBits.SendMessagesInThreads,
                ],
            });
        }
        if (modRole) {
            channelOverwrites.push({
                id: modRole.id,
                allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.ReadMessageHistory, discord_js_1.PermissionFlagsBits.SendMessages],
            });
        }
        await ticketChannel.permissionOverwrites.set(channelOverwrites);
        console.log('  ✅ #destek-talebi kanalı izinleri ve ebeveyn kategorisi güncellendi!');
        // Refresh Panel Message
        const oldMessages = await ticketChannel.messages.fetch({ limit: 10 });
        for (const [, msg] of oldMessages) {
            if (msg.author.id === client.user?.id) {
                await msg.delete().catch(() => { });
            }
        }
        await ticketChannel.send({
            embeds: [ticketManager_1.TicketManager.getTicketPanelEmbed()],
            components: [ticketManager_1.TicketManager.getTicketPanelControls()],
        });
        console.log('  ✅ Destek paneli ve butonu yenilendi!');
    }
    else {
        // Create new #destek-talebi if it didn't exist
        console.log('  🔨 Yeni #destek-talebi kanalı oluşturuluyor...');
        ticketChannel = await guild.channels.create({
            name: '🎫・destek-talebi',
            type: discord_js_1.ChannelType.GuildText,
            parent: ticketCategory.id,
            permissionOverwrites: [
                {
                    id: everyoneRole.id,
                    deny: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.SendMessages],
                },
                ...(onayliRole
                    ? [
                        {
                            id: onayliRole.id,
                            allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.ReadMessageHistory],
                            deny: [discord_js_1.PermissionFlagsBits.SendMessages, discord_js_1.PermissionFlagsBits.CreatePublicThreads, discord_js_1.PermissionFlagsBits.CreatePrivateThreads],
                        },
                    ]
                    : []),
                ...(uyeRole
                    ? [
                        {
                            id: uyeRole.id,
                            allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.ReadMessageHistory],
                            deny: [discord_js_1.PermissionFlagsBits.SendMessages, discord_js_1.PermissionFlagsBits.CreatePublicThreads, discord_js_1.PermissionFlagsBits.CreatePrivateThreads],
                        },
                    ]
                    : []),
            ],
        });
        await ticketChannel.send({
            embeds: [ticketManager_1.TicketManager.getTicketPanelEmbed()],
            components: [ticketManager_1.TicketManager.getTicketPanelControls()],
        });
        console.log('  ✅ Yeni #destek-talebi oluşturuldu ve panel gönderildi!');
    }
    // 4. Move any existing open tickets (bilet-*) into the dedicated category
    const openTickets = channels.filter((c) => Boolean(c && c.type === discord_js_1.ChannelType.GuildText && c.name.startsWith('bilet-')));
    for (const [, ticket] of openTickets) {
        if (ticket && ticket.parentId !== ticketCategory.id) {
            await ticket.setParent(ticketCategory.id, { lockPermissions: false });
            console.log(`  🚚 Açık bilet kanalı taşındı: ${ticket.name}`);
        }
    }
    console.log('\n🎉 Dedicated Destek Talepleri Kategorisi Başarıyla Kuruldu!');
    client.destroy();
}
main().catch(console.error);
