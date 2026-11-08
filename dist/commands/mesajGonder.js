"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aliasData = exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const config_1 = require("../config");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('mesajgönder')
    .setDescription('Sunucudaki üyelere özel mesaj (DM) ile resmi topluluk duyurusu gönderir.')
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
    .addStringOption((opt) => opt
    .setName('mesaj')
    .setDescription('Gönderilecek duyuru metni')
    .setRequired(true))
    .addStringOption((opt) => opt
    .setName('baslik')
    .setDescription('Duyuru başlığı (Varsayılan: 📢 NIGHTS TOPLULUK DUYURUSU)')
    .setRequired(false))
    .addRoleOption((opt) => opt
    .setName('hedef_rol')
    .setDescription('Yalnızca bu role sahip olanlara gönder (Boşsa herkese gider)')
    .setRequired(false));
// ASCII alias for clients/terminals without special characters
exports.aliasData = new discord_js_1.SlashCommandBuilder()
    .setName('mesajgonder')
    .setDescription('Sunucudaki üyelere özel mesaj (DM) ile resmi topluluk duyurusu gönderir.')
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
    .addStringOption((opt) => opt
    .setName('mesaj')
    .setDescription('Gönderilecek duyuru metni')
    .setRequired(true))
    .addStringOption((opt) => opt
    .setName('baslik')
    .setDescription('Duyuru başlığı (Varsayılan: 📢 NIGHTS TOPLULUK DUYURUSU)')
    .setRequired(false))
    .addRoleOption((opt) => opt
    .setName('hedef_rol')
    .setDescription('Yalnızca bu role sahip olanlara gönder (Boşsa herkese gider)')
    .setRequired(false));
async function execute(interaction) {
    const { guild, member, user } = interaction;
    if (!guild) {
        await interaction.reply({ content: 'Bu komut sadece sunucularda kullanılabilir.', ephemeral: true });
        return;
    }
    const ownerId = config_1.config.ownerId || '1138498666785677492';
    const isOwner = user.id === ownerId;
    const isAdmin = member?.permissions?.has(discord_js_1.PermissionFlagsBits.Administrator);
    if (!isOwner && !isAdmin) {
        await interaction.reply({
            content: '⛔ **Erişim Engellendi:** Bu komut yalnızca sunucu kurucusu veya yöneticiler tarafından kullanılabilir!',
            ephemeral: true,
        });
        return;
    }
    await interaction.deferReply({ ephemeral: true });
    const rawMessage = interaction.options.getString('mesaj', true);
    const title = interaction.options.getString('baslik') || '📢 NIGHTS TOPLULUK DUYURUSU';
    const targetRole = interaction.options.getRole('hedef_rol');
    // Fetch all members
    await interaction.editReply({
        content: '🔍 **Üye listesi taranıyor...** Lütfen bekleyin.',
    });
    const allMembers = await guild.members.fetch();
    let candidates = Array.from(allMembers.values()).filter((m) => !m.user.bot);
    if (targetRole) {
        candidates = candidates.filter((m) => m.roles.cache.has(targetRole.id));
    }
    if (candidates.length === 0) {
        await interaction.editReply({
            content: '⚠️ Belirtilen kriterlere uygun mesaj gönderilecek üye bulunamadı.',
        });
        return;
    }
    await interaction.editReply({
        content: `⏳ **Toplu DM Gönderimi Başlatıldı!**\n` +
            `• Hedef Üye Sayısı: **${candidates.length}**\n` +
            `• Hedef Kitle: **${targetRole ? `<@&${targetRole.id}>` : 'Tüm Sunucu Üyeleri'}**\n` +
            `• Güvenlik Koruması: *Discord Rate Limit koruması için mesajlar sıralı iletiliyor...*`,
    });
    const dmEmbed = new discord_js_1.EmbedBuilder()
        .setTitle(title)
        .setDescription(rawMessage)
        .setColor('#8B5CF6')
        .setThumbnail(guild.iconURL({ size: 256 }) || user.displayAvatarURL())
        .addFields({
        name: '👑 Duyuruyu Gönderen',
        value: `<@${user.id}> (${member.displayName})`,
        inline: true,
    }, {
        name: '🌐 Sunucu',
        value: `**${guild.name}**`,
        inline: true,
    })
        .setImage('https://media.giphy.com/media/EPfV3ijMQVl60/giphy.gif')
        .setFooter({ text: 'Nights Community Official Broadcast Engine • Made by erencix' })
        .setTimestamp();
    let successCount = 0;
    let failedCount = 0;
    const startTime = Date.now();
    for (let i = 0; i < candidates.length; i++) {
        const target = candidates[i];
        try {
            await target.send({ embeds: [dmEmbed] });
            successCount++;
        }
        catch (dmErr) {
            // DM closed, blocked or privacy settings
            failedCount++;
        }
        // Update progress periodically (every 5 members or on last)
        if ((i + 1) % 5 === 0 || i === candidates.length - 1) {
            const progressPercent = Math.round(((i + 1) / candidates.length) * 100);
            await interaction.editReply({
                content: `⏳ **Toplu DM Gönderimi Devam Ediyor...** (${progressPercent}%)\n` +
                    `• İlerleyen: **${i + 1} / ${candidates.length}**\n` +
                    `• ✅ Başarılı İletilen: **${successCount}**\n` +
                    `• ❌ DM Kapalı / İletilemeyen: **${failedCount}**`,
            }).catch(() => { });
        }
        // Rate-limit pause (1.2 seconds between DMs)
        if (i < candidates.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1200));
        }
    }
    const durationSec = Math.round((Date.now() - startTime) / 1000);
    const reportEmbed = new discord_js_1.EmbedBuilder()
        .setTitle('✅ Toplu DM Gönderimi Tamamlandı!')
        .setDescription(`Topluluk duyurusu hedeflenen üyelere başarıyla iletildi.\n\n` +
        `**📊 Detaylı İstatistikler:**\n` +
        `• 🎯 Toplam Hedef Üye: **${candidates.length}**\n` +
        `• ✅ Başarıyla Ulaşan: **${successCount} Üye**\n` +
        `• 🚫 DM'si Kapalı Olan: **${failedCount} Üye** *(Gizlilik ayarları nedeniyle engelli)*\n` +
        `• ⏱️ Toplam Süre: **${durationSec} saniye**\n` +
        `• 🏷️ Hedef Rol: **${targetRole ? `<@&${targetRole.id}>` : 'Herkes'}**`)
        .setColor('#2ECC71')
        .setFooter({ text: 'Nights Broadcast Center' })
        .setTimestamp();
    await interaction.editReply({
        content: '🎉 **Duyuru başarıyla dağıtıldı!**',
        embeds: [reportEmbed],
    });
}
