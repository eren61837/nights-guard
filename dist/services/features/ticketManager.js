"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketManager = void 0;
const discord_js_1 = require("discord.js");
class TicketManager {
    static async handleTicketOpen(interaction) {
        const { guild, user } = interaction;
        if (!guild)
            return;
        await interaction.deferReply({ ephemeral: true });
        const channels = await guild.channels.fetch();
        const roles = await guild.roles.fetch();
        // Check if user already has a ticket
        const channelName = `bilet-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        const existingChannel = channels.find((c) => c && c.name === channelName);
        if (existingChannel) {
            await interaction.editReply({
                content: `⚠️ Zaten açık bir destek talebiniz bulunuyor: <#${existingChannel.id}>`,
            });
            return;
        }
        // Find or create dedicated ticket category
        let category = channels.find((c) => c && c.type === discord_js_1.ChannelType.GuildCategory && (c.name.includes('DESTEK') || c.name.includes('destek')));
        if (!category) {
            try {
                category = await guild.channels.create({
                    name: '🎫 ┃ DESTEK TALEPLERİ',
                    type: discord_js_1.ChannelType.GuildCategory,
                    permissionOverwrites: [
                        {
                            id: guild.roles.everyone.id,
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
                                    ],
                                },
                            ]
                            : []),
                    ],
                });
            }
            catch (catErr) {
                console.error('[TicketManager] Destek kategorisi oluşturulurken hata:', catErr);
            }
        }
        // Find staff or moderator role
        const staffRole = roles.find((r) => r &&
            (r.name.toLowerCase().includes('moderatör') ||
                r.name.toLowerCase().includes('moderator') ||
                r.name.toLowerCase().includes('yönetici') ||
                r.name.toLowerCase().includes('admin') ||
                r.name.toLowerCase().includes('kurucu') ||
                r.name.toLowerCase().includes('yetkili')) &&
            !r.managed);
        try {
            const permissionOverwrites = [
                {
                    id: guild.roles.everyone.id,
                    deny: [
                        discord_js_1.PermissionFlagsBits.ViewChannel,
                        discord_js_1.PermissionFlagsBits.SendMessages,
                        discord_js_1.PermissionFlagsBits.CreatePublicThreads,
                        discord_js_1.PermissionFlagsBits.CreatePrivateThreads,
                        discord_js_1.PermissionFlagsBits.SendMessagesInThreads,
                    ],
                },
                {
                    id: user.id,
                    allow: [
                        discord_js_1.PermissionFlagsBits.ViewChannel,
                        discord_js_1.PermissionFlagsBits.SendMessages,
                        discord_js_1.PermissionFlagsBits.AttachFiles,
                        discord_js_1.PermissionFlagsBits.EmbedLinks,
                        discord_js_1.PermissionFlagsBits.ReadMessageHistory,
                    ],
                    deny: [
                        discord_js_1.PermissionFlagsBits.CreatePublicThreads,
                        discord_js_1.PermissionFlagsBits.CreatePrivateThreads,
                        discord_js_1.PermissionFlagsBits.SendMessagesInThreads,
                    ],
                },
                {
                    id: guild.members.me.id,
                    allow: [
                        discord_js_1.PermissionFlagsBits.ViewChannel,
                        discord_js_1.PermissionFlagsBits.SendMessages,
                        discord_js_1.PermissionFlagsBits.ManageChannels,
                        discord_js_1.PermissionFlagsBits.ReadMessageHistory,
                    ],
                },
            ];
            if (staffRole) {
                permissionOverwrites.push({
                    id: staffRole.id,
                    allow: [
                        discord_js_1.PermissionFlagsBits.ViewChannel,
                        discord_js_1.PermissionFlagsBits.SendMessages,
                        discord_js_1.PermissionFlagsBits.ManageMessages,
                        discord_js_1.PermissionFlagsBits.ReadMessageHistory,
                    ],
                });
            }
            const ticketChannel = await guild.channels.create({
                name: channelName,
                type: discord_js_1.ChannelType.GuildText,
                parent: category?.id,
                topic: `Destek Talebi Sahibi: ${user.tag} (${user.id})`,
                permissionOverwrites,
            });
            const welcomeEmbed = new discord_js_1.EmbedBuilder()
                .setTitle(`🎫 Destek Talebi: ${user.username}`)
                .setDescription(`Merhaba <@${user.id}>! Talebiniz başarıyla açıldı.\nLütfen sorununuzu, talebinizi veya ekran görüntülerinizi detaylıca iletiniz.\nYetkili ekibimiz en kısa sürede size dönüş yapacaktır.`)
                .setColor('#3498DB')
                .addFields({ name: '👤 Kullanıcı', value: `<@${user.id}>`, inline: true }, { name: '🛡️ İlgili Ekip', value: staffRole ? `<@&${staffRole.id}>` : 'Yetkili Ekip', inline: true })
                .setFooter({ text: 'Talebi sonlandırmak için aşağıdaki butona basabilirsiniz.' })
                .setTimestamp();
            const actionRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId('ticket_close')
                .setLabel('Talebi Kapat')
                .setEmoji('🔒')
                .setStyle(discord_js_1.ButtonStyle.Danger));
            await ticketChannel.send({
                content: `<@${user.id}> ${staffRole ? `<@&${staffRole.id}>` : ''}`,
                embeds: [welcomeEmbed],
                components: [actionRow],
            });
            await interaction.editReply({
                content: `✅ Destek talebiniz açıldı: <#${ticketChannel.id}>`,
            });
        }
        catch (err) {
            console.error('[TicketManager] Hata:', err);
            await interaction.editReply({
                content: `❌ Destek kanalı oluşturulamadı: ${err.message}`,
            });
        }
    }
    static getTicketPanelEmbed() {
        return new discord_js_1.EmbedBuilder()
            .setTitle('🎫 NIGHTS DESTEK & TALEP MERKEZİ 🛡️')
            .setDescription('Sunucumuzla ilgili soru, şikayet, öneri veya yetkili destek ihtiyaçlarınız için tek tıkla talep oluşturabilirsiniz.\n\n' +
            '### 📌 Destek Konuları:\n' +
            '• 🛡️ Sunucu İçi Şikayet ve İhlal Bildirimi\n' +
            '• ⭐ Rol, Seviye veya Çekiliş Ödülü Talebi\n' +
            '• 🤝 Partnerlik & İş Birliği Görüşmeleri\n' +
            '• 💡 Öneri ve Geri Bildirimler\n\n' +
            '> 💡 *Aşağıdaki **📩 Destek Talebi Aç** butonuna basarak size ve yetkililere özel güvenli bir destek odası başlatabilirsiniz.*')
            .setImage('https://media.giphy.com/media/26tn3334mvoVClhos/giphy.gif')
            .setColor('#3498DB')
            .setFooter({ text: 'Nights Ticket Engine • Made by erencix' });
    }
    static getTicketPanelControls() {
        return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId('ticket_open')
            .setLabel('Destek Talebi Aç')
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setEmoji('📩'));
    }
    static async handleTicketClose(interaction) {
        const channel = interaction.channel;
        if (!channel || channel.type !== discord_js_1.ChannelType.GuildText)
            return;
        await interaction.reply({
            content: '🔒 Bu destek talebi 5 saniye içinde kapatılıp silinecektir...',
        });
        setTimeout(async () => {
            try {
                await channel.delete('Destek talebi kullanıcı/yetkili tarafından kapatıldı.');
            }
            catch (err) {
                console.error('[TicketManager] Kanal silinirken hata:', err);
            }
        }, 5000);
    }
}
exports.TicketManager = TicketManager;
