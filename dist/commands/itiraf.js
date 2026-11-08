"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const confessionManager_1 = require("../services/features/confessionManager");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('itiraf')
    .setDescription('Sunucuya tamamen anonim ve gizli olarak bir itirafta bulunmanızı sağlar.')
    .addStringOption((option) => option
    .setName('itiraf')
    .setDescription('Anonim olarak paylaşmak istediğiniz itiraf metni')
    .setRequired(true)
    .setMaxLength(1000));
async function execute(interaction) {
    const guild = interaction.guild;
    if (!guild) {
        await interaction.reply({
            content: '❌ Bu komut yalnızca sunucu içerisinde kullanılabilir.',
            ephemeral: true,
        });
        return;
    }
    const text = interaction.options.getString('itiraf', true);
    // Yanıtı yalnızca komutu kullanan üye görür (Ephemeral)
    await interaction.deferReply({ ephemeral: true });
    const result = await confessionManager_1.ConfessionManager.submit(guild, interaction.user, text);
    await interaction.editReply({
        content: result.message,
    });
}
