"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('onizle')
    .setDescription('Sunucunuza dokunmadan mimari planını ve kanal/rol şemasını önizler.')
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
    .addStringOption((opt) => opt
    .setName('istek')
    .setDescription('Nasıl bir sunucu mimarisi görmek istersiniz?')
    .setRequired(true))
    .addStringOption((opt) => opt
    .setName('stil')
    .setDescription('Tasarım tarzı')
    .addChoices({ name: 'Modern & Estetik', value: 'modern' }, { name: 'Minimalist & Sade', value: 'minimalist' }, { name: 'Gaming / Oyun', value: 'gaming' }, { name: 'Anime / RP', value: 'anime' }, { name: 'Kurumsal / Profesyonel', value: 'professional' }));
async function execute(interaction, aiManager) {
    await interaction.deferReply();
    const prompt = interaction.options.getString('istek', true);
    const style = interaction.options.getString('stil') || 'modern';
    await interaction.editReply({
        content: `🔍 **Önizleme Hesaplanıyor...**\n> Prompt: *"${prompt}"*\nHerhangi bir kanal silinmeyecek veya eklenmeyecektir (Dry-Run Modu).`,
    });
    try {
        const { blueprint, source } = await aiManager.generateBlueprint({
            prompt,
            style,
            locale: 'tr',
        });
        let channelList = '';
        for (const cat of blueprint.categories) {
            channelList += `📁 **${cat.name}**\n`;
            if (cat.channels) {
                for (const ch of cat.channels.slice(0, 5)) {
                    const icon = ch.type === 'GUILD_VOICE' ? '🔊' : '💬';
                    channelList += `  └ ${icon} ${ch.name}\n`;
                }
                if (cat.channels.length > 5) {
                    channelList += `  └ *...ve ${cat.channels.length - 5} kanal daha*\n`;
                }
            }
        }
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle(`📋 MİMARİ ÖNİZLEME: ${blueprint.serverName}`)
            .setDescription(`**Tema:** ${blueprint.theme}\n**Açıklama:** ${blueprint.serverDescription}`)
            .addFields({
            name: '🛡️ Roller (' + blueprint.roles.length + ')',
            value: blueprint.roles.map((r) => `• ${r.name} (${r.color})`).join('\n').slice(0, 1024),
            inline: true,
        }, {
            name: '📁 Kategori ve Kanallar',
            value: channelList.slice(0, 1024),
            inline: false,
        }, {
            name: '🤖 AutoMod Kuralları',
            value: blueprint.automodRules?.map((r) => `• **${r.name}** (${r.triggerType})`).join('\n') || 'Tanımlanmadı',
            inline: true,
        }, {
            name: '🎨 Logo Promptu',
            value: `\`${blueprint.iconPrompt?.slice(0, 300) || 'Belirtilmedi'}\``,
            inline: false,
        })
            .setColor('#3498DB')
            .setFooter({ text: `Nights Guard • Made by erencix • Motor: ${source.toUpperCase()}` });
        await interaction.editReply({
            content: '',
            embeds: [embed],
        });
    }
    catch (err) {
        await interaction.editReply({
            content: `❌ Önizleme hatası: ${err.message}`,
        });
    }
}
