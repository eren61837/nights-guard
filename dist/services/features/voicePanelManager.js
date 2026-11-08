"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoicePanelManager = void 0;
const discord_js_1 = require("discord.js");
class VoicePanelManager {
    static getVoicePanelEmbed() {
        return new discord_js_1.EmbedBuilder()
            .setTitle('🎛️ NIGHTS GELİŞMİŞ SES ODASI KONTROL MERKEZİ 🎙️')
            .setDescription('Özel ses odanızı aşağıdaki 10 güçlü kontrol seçeneğiyle dilediğiniz gibi yönetin ve özelleştirin!\n\n' +
            '### ⚡ Kontrol Seçenekleri:\n' +
            '• 🔒 **Odayı Kilitle:** Odaya yabancı üyelerin girişini engeller.\n' +
            '• 🔓 **Kilidi Aç:** Odanın kilidini açar, tüm üyeler katılabilir.\n' +
            '• 👁️ **Gizle / Göster:** Odayı kanallar listesinde gizler veya görünür yapar.\n' +
            '• 👥 **Kişi Limiti:** Oda kapasitesini sırayla ayarlar *(2 ➔ 5 ➔ 10 ➔ 15 ➔ Sınırsız)*.\n' +
            '• ✏️ **İsim Değiştir:** Odanızın adını modal penceresinden özelleştirir.\n' +
            '• 🔇 **Odayı Sustur / Aç:** Odanın genel konuşma iznini açar veya kapatır.\n' +
            '• 🚀 **Ses Kalitesi (Bitrate):** Kristal netliğinde Hi-Fi ses kalitesi sunar.\n' +
            '• 👑 **Sahipliği Al:** Sahibi ayrılmış odanın liderliğini üzerinize tanımlar.\n' +
            '• 📊 **Oda Durumu:** Aktif oda bilgileri, limit ve üye durumunu gösterir.\n' +
            '• ➕ **Özel Oda Aç:** Sizin adınıza anında yeni bir özel ses odası kurar.\n\n' +
            '> 💡 *Butonları kullanabilmek için sunucumuzdaki bir ses kanalında bulunmanız gerekmektedir.*')
            .setImage('https://media.giphy.com/media/ErZ8hv5eO92JW/giphy.gif')
            .setColor('#9B59B6')
            .setFooter({ text: 'Nights Advanced Voice Studio • Made by erencix' });
    }
    static getVoicePanelControls() {
        const row1 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId('btn_voice_lock')
            .setLabel('Odayı Kilitle')
            .setStyle(discord_js_1.ButtonStyle.Danger)
            .setEmoji('🔒'), new discord_js_1.ButtonBuilder()
            .setCustomId('btn_voice_unlock')
            .setLabel('Kilidi Aç')
            .setStyle(discord_js_1.ButtonStyle.Success)
            .setEmoji('🔓'), new discord_js_1.ButtonBuilder()
            .setCustomId('btn_voice_hide')
            .setLabel('Gizle / Göster')
            .setStyle(discord_js_1.ButtonStyle.Secondary)
            .setEmoji('👁️'), new discord_js_1.ButtonBuilder()
            .setCustomId('btn_voice_limit')
            .setLabel('Kişi Limiti')
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setEmoji('👥'), new discord_js_1.ButtonBuilder()
            .setCustomId('btn_voice_rename')
            .setLabel('İsim Değiştir')
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setEmoji('✏️'));
        const row2 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId('btn_voice_mute')
            .setLabel('Sustur / Aç')
            .setStyle(discord_js_1.ButtonStyle.Secondary)
            .setEmoji('🔇'), new discord_js_1.ButtonBuilder()
            .setCustomId('btn_voice_bitrate')
            .setLabel('Bitrate (Kalite)')
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setEmoji('🚀'), new discord_js_1.ButtonBuilder()
            .setCustomId('btn_voice_claim')
            .setLabel('Sahipliği Al')
            .setStyle(discord_js_1.ButtonStyle.Secondary)
            .setEmoji('👑'), new discord_js_1.ButtonBuilder()
            .setCustomId('btn_voice_info')
            .setLabel('Oda Durumu')
            .setStyle(discord_js_1.ButtonStyle.Secondary)
            .setEmoji('📊'), new discord_js_1.ButtonBuilder()
            .setCustomId('btn_voice_create')
            .setLabel('Özel Oda Aç')
            .setStyle(discord_js_1.ButtonStyle.Success)
            .setEmoji('➕'));
        return [row1, row2];
    }
    static async handleVoiceButton(interaction) {
        const member = interaction.member;
        const guild = interaction.guild;
        if (!member || !guild)
            return;
        const customId = interaction.customId;
        // 1. Özel Oda Aç butonu: Ses kanalında olmasa bile oda açıp davet edebilir
        if (customId === 'btn_voice_create') {
            try {
                const category = guild.channels.cache.find((c) => c.type === discord_js_1.ChannelType.GuildCategory && c.name.includes('SES ODALARI'));
                const newChannel = await guild.channels.create({
                    name: `🔊・${member.displayName} Odası`,
                    type: discord_js_1.ChannelType.GuildVoice,
                    parent: category?.id,
                    permissionOverwrites: [
                        {
                            id: member.id,
                            allow: [
                                discord_js_1.PermissionFlagsBits.ManageChannels,
                                discord_js_1.PermissionFlagsBits.MoveMembers,
                                discord_js_1.PermissionFlagsBits.Connect,
                                discord_js_1.PermissionFlagsBits.Speak,
                            ],
                        },
                    ],
                });
                // Eğer kullanıcı bir sesteyse otomatik taşı
                if (member.voice.channel) {
                    await member.voice.setChannel(newChannel);
                }
                await interaction.reply({
                    content: `🎉 **Özel ses odanız başarıyla açıldı:** <#${newChannel.id}>\nOdanıza katılarak arkadaşlarınızı davet edebilir ve paneli kullanabilirsiniz!`,
                    ephemeral: true,
                });
            }
            catch (err) {
                await interaction.reply({
                    content: `❌ Oda oluşturulamadı: ${err.message}`,
                    ephemeral: true,
                });
            }
            return;
        }
        // 2. Diğer butonlar için kullanıcının ses kanalında olması gerekir
        const currentVoice = member.voice.channel;
        if (!currentVoice) {
            await interaction.reply({
                content: '⚠️ **Bu işlemi yapabilmek için sunucumuzdaki bir ses kanalında bulunmalısınız!**',
                ephemeral: true,
            });
            return;
        }
        const everyoneRole = guild.roles.everyone;
        switch (customId) {
            // ✏️ İsim Değiştir (Modal Penceresi)
            case 'btn_voice_rename': {
                const modal = new discord_js_1.ModalBuilder()
                    .setCustomId('modal_voice_rename')
                    .setTitle('Ses Kanalı İsmini Değiştir');
                const nameInput = new discord_js_1.TextInputBuilder()
                    .setCustomId('input_voice_name')
                    .setLabel('Yeni Oda İsmi')
                    .setStyle(discord_js_1.TextInputStyle.Short)
                    .setPlaceholder('Örn: 🎮・Valorant Dereceli veya 🎧・Chill Lo-Fi')
                    .setValue(currentVoice.name)
                    .setMinLength(2)
                    .setMaxLength(40)
                    .setRequired(true);
                modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(nameInput));
                await interaction.showModal(modal);
                break;
            }
            // 🔒 Odayı Kilitle
            case 'btn_voice_lock': {
                await currentVoice.permissionOverwrites.edit(everyoneRole, {
                    Connect: false,
                });
                await currentVoice.permissionOverwrites.edit(member.id, {
                    Connect: true,
                    Speak: true,
                });
                await interaction.reply({
                    content: `🔒 **${currentVoice.name}** odası kilitlendi! Artık dışarıdan yabancı üyeler katılamaz.`,
                    ephemeral: true,
                });
                break;
            }
            // 🔓 Kilidi Aç
            case 'btn_voice_unlock': {
                await currentVoice.permissionOverwrites.edit(everyoneRole, {
                    Connect: null,
                });
                await interaction.reply({
                    content: `🔓 **${currentVoice.name}** odasının kilidi açıldı! Tüm üyeler serbestçe katılabilir.`,
                    ephemeral: true,
                });
                break;
            }
            // 👁️ Odayı Gizle / Göster
            case 'btn_voice_hide': {
                const currentOverwrites = currentVoice.permissionsFor(everyoneRole);
                const isVisible = currentOverwrites?.has(discord_js_1.PermissionFlagsBits.ViewChannel) ?? true;
                if (isVisible) {
                    await currentVoice.permissionOverwrites.edit(everyoneRole, {
                        ViewChannel: false,
                    });
                    await currentVoice.permissionOverwrites.edit(member.id, {
                        ViewChannel: true,
                    });
                    await interaction.reply({
                        content: `👁️ **${currentVoice.name}** odası gizlendi! Artık kanal listesinde görünmez (hayalet oda).`,
                        ephemeral: true,
                    });
                }
                else {
                    await currentVoice.permissionOverwrites.edit(everyoneRole, {
                        ViewChannel: null,
                    });
                    await interaction.reply({
                        content: `👁️ **${currentVoice.name}** odası tekrar görünür hale getirildi!`,
                        ephemeral: true,
                    });
                }
                break;
            }
            // 👥 Kişi Limiti
            case 'btn_voice_limit': {
                const currentLimit = currentVoice.userLimit || 0;
                let nextLimit = 0;
                if (currentLimit === 0)
                    nextLimit = 2;
                else if (currentLimit === 2)
                    nextLimit = 5;
                else if (currentLimit === 5)
                    nextLimit = 10;
                else if (currentLimit === 10)
                    nextLimit = 15;
                else
                    nextLimit = 0;
                await currentVoice.setUserLimit(nextLimit);
                await interaction.reply({
                    content: `👥 **${currentVoice.name}** odasının kişi kapasitesi **${nextLimit === 0 ? 'Sınırsız ♾️' : nextLimit + ' Kişi'}** olarak ayarlandı.`,
                    ephemeral: true,
                });
                break;
            }
            // 🔇 Odayı Sustur / Aç
            case 'btn_voice_mute': {
                const currentOverwrites = currentVoice.permissionsFor(everyoneRole);
                const canSpeak = currentOverwrites?.has(discord_js_1.PermissionFlagsBits.Speak) ?? true;
                await currentVoice.permissionOverwrites.edit(everyoneRole, {
                    Speak: !canSpeak,
                });
                await interaction.reply({
                    content: `🔇 **${currentVoice.name}** odasında genel konuşma durumu: **${!canSpeak ? 'Konuşma Açık 🔊' : 'Oda Sessize Alındı 🔇'}**`,
                    ephemeral: true,
                });
                break;
            }
            // 🚀 Bitrate (Ses Kalitesi)
            case 'btn_voice_bitrate': {
                const currentBitrate = currentVoice.bitrate;
                // Non-boosted limit is 96kbps
                let nextBitrate = 64000;
                let bitrateLabel = '64 kbps (Standart Kalite)';
                if (currentBitrate <= 64000) {
                    nextBitrate = 96000;
                    bitrateLabel = '96 kbps (Stüdyo & Hi-Fi Kalite 🎧)';
                }
                else {
                    nextBitrate = 64000;
                    bitrateLabel = '64 kbps (Standart Kalite 🔊)';
                }
                try {
                    await currentVoice.setBitrate(nextBitrate);
                    await interaction.reply({
                        content: `🚀 **${currentVoice.name}** ses odasının ses iletim kalitesi **${bitrateLabel}** olarak ayarlandı!`,
                        ephemeral: true,
                    });
                }
                catch (err) {
                    await interaction.reply({
                        content: `⚠️ Bitrate ayarlanırken sunucu limiti uyarısı: ${err.message}`,
                        ephemeral: true,
                    });
                }
                break;
            }
            // 👑 Sahipliği Al
            case 'btn_voice_claim': {
                await currentVoice.permissionOverwrites.edit(member.id, {
                    ManageChannels: true,
                    MoveMembers: true,
                    Connect: true,
                    Speak: true,
                });
                await interaction.reply({
                    content: `👑 **${currentVoice.name}** odasının oda yöneticisi ve sahipliği başarıyla üzerinize tanımlandı!`,
                    ephemeral: true,
                });
                break;
            }
            // 📊 Oda Durumu
            case 'btn_voice_info': {
                const membersInVoice = currentVoice.members.map((m) => `• <@${m.id}>`).join('\n') || 'Oda boş';
                const isLocked = currentVoice.permissionsFor(everyoneRole)?.has(discord_js_1.PermissionFlagsBits.Connect) === false;
                const isHidden = currentVoice.permissionsFor(everyoneRole)?.has(discord_js_1.PermissionFlagsBits.ViewChannel) === false;
                const infoEmbed = new discord_js_1.EmbedBuilder()
                    .setTitle(`📊 Ses Odası Durum Raporu: ${currentVoice.name}`)
                    .setColor('#9B59B6')
                    .addFields({
                    name: '🔒 Kilit Durumu',
                    value: isLocked ? '🔴 Kilitli (Giriş Kapalı)' : '🟢 Herkese Açık',
                    inline: true,
                }, {
                    name: '👁️ Görünürlük',
                    value: isHidden ? '👻 Gizli (Hayalet Oda)' : '👀 Görünür',
                    inline: true,
                }, {
                    name: '👥 Kapasite',
                    value: currentVoice.userLimit === 0 ? '♾️ Sınırsız' : `${currentVoice.members.size} / ${currentVoice.userLimit} Kişi`,
                    inline: true,
                }, {
                    name: '🚀 Ses Kalitesi (Bitrate)',
                    value: `${Math.round(currentVoice.bitrate / 1000)} kbps`,
                    inline: true,
                }, {
                    name: '🎧 Odadaki Üyeler',
                    value: membersInVoice,
                    inline: false,
                })
                    .setFooter({ text: 'Nights Advanced Voice Studio' })
                    .setTimestamp();
                await interaction.reply({ embeds: [infoEmbed], ephemeral: true });
                break;
            }
            default:
                await interaction.reply({ content: 'Bilinmeyen ses işlemi.', ephemeral: true });
                break;
        }
    }
    static async handleVoiceModal(interaction) {
        const member = interaction.member;
        const currentVoice = member?.voice?.channel;
        if (!currentVoice) {
            await interaction.reply({
                content: '⚠️ Ses kanalında değilsiniz! İsim değiştirebilmek için bir ses odasında bulunmalısınız.',
                ephemeral: true,
            });
            return;
        }
        const newName = interaction.fields.getTextInputValue('input_voice_name').trim();
        try {
            await currentVoice.setName(newName);
            await interaction.reply({
                content: `✅ Odanızın adı başarıyla değiştirildi: **${newName}**`,
                ephemeral: true,
            });
        }
        catch (err) {
            await interaction.reply({
                content: `❌ İsim değiştirilemedi: ${err.message}`,
                ephemeral: true,
            });
        }
    }
}
exports.VoicePanelManager = VoicePanelManager;
