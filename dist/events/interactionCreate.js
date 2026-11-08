"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.InteractionHandler = exports.eventClickUsers = void 0;
const discord_js_1 = require("discord.js");
const blueprintCache_1 = require("../services/engine/blueprintCache");
const deployer_1 = require("../services/engine/deployer");
const cleaner_1 = require("../services/engine/cleaner");
const diagnostics_1 = require("../services/engine/diagnostics");
const logoStudio_1 = require("../services/image/logoStudio");
const ticketManager_1 = require("../services/features/ticketManager");
const voicePanelManager_1 = require("../services/features/voicePanelManager");
const aiLogo_1 = require("../commands/aiLogo");
const config_1 = require("../config");
const aiKurCmd = __importStar(require("../commands/aiKur"));
const aiLogoCmd = __importStar(require("../commands/aiLogo"));
const aiOnizleCmd = __importStar(require("../commands/aiOnizle"));
const sunucuTemizleCmd = __importStar(require("../commands/sunucuTemizle"));
const yardimCmd = __importStar(require("../commands/yardim"));
const planCmd = __importStar(require("../commands/plan"));
const boostCmd = __importStar(require("../commands/boost"));
const teamworkCmd = __importStar(require("../commands/teamwork"));
const browserCmd = __importStar(require("../commands/browser"));
const davetCmd = __importStar(require("../commands/davet"));
const mesajGonderCmd = __importStar(require("../commands/mesajGonder"));
const seviyeCmd = __importStar(require("../commands/seviye"));
const silCmd = __importStar(require("../commands/sil"));
const avatarCmd = __importStar(require("../commands/avatar"));
const sunucuCmd = __importStar(require("../commands/sunucu"));
const afkCmd = __importStar(require("../commands/afk"));
const istatistikCmd = __importStar(require("../commands/istatistik"));
const kullaniciCmd = __importStar(require("../commands/kullanici"));
const gonderCmd = __importStar(require("../commands/gonder"));
const itirafCmd = __importStar(require("../commands/itiraf"));
const muzikCmd = __importStar(require("../commands/muzik"));
const socialManager_1 = require("../services/features/socialManager");
const confessionManager_1 = require("../services/features/confessionManager");
const musicPlayer_1 = require("../services/features/musicPlayer");
// Click Me Event User Cache
exports.eventClickUsers = new Set();
class InteractionHandler {
    aiManager;
    deployer;
    cleaner;
    logoStudio;
    constructor(aiManager) {
        this.aiManager = aiManager;
        this.deployer = new deployer_1.ServerDeployer();
        this.cleaner = new cleaner_1.ServerCleaner();
        this.logoStudio = new logoStudio_1.LogoStudio();
    }
    async handle(interaction) {
        try {
            // Kayıt, Etkinlik (Click Me), Müzik (buton & /cal komutları), Ses Paneli ve Destek (Ticket) tüm üyelere açıktır:
            const isPublicInteraction = (interaction.isButton() && (interaction.customId === 'btn_kayit_basla' ||
                interaction.customId.startsWith('btn_cinsiyet_') ||
                interaction.customId === 'btn_event_click' ||
                interaction.customId.startsWith('btn_voice_') ||
                interaction.customId.startsWith('marry_') ||
                interaction.customId.startsWith('confess_') ||
                interaction.customId.startsWith('btn_music_') ||
                interaction.customId === 'ticket_open' ||
                interaction.customId === 'ticket_close')) ||
                (interaction.isModalSubmit() && (interaction.customId.startsWith('modal_kayit_') || interaction.customId === 'modal_voice_rename')) ||
                (interaction.isChatInputCommand() && [
                    'rank', 'seviye', 'top', 'liderlik', 'yardim', 'avatar', 'sunucu', 'afk', 'sil',
                    'istatistik', 'kullanici', 'gonder', 'itiraf', 'cal', 'durdur', 'devam', 'gec', 'kuyruk', 'ayril', 'ses'
                ].includes(interaction.commandName));
            if (!isPublicInteraction) {
                const ownerId = config_1.config.ownerId || process.env.OWNER_ID || '1138498666785677492';
                const isServerAdmin = interaction.member?.permissions?.has(discord_js_1.PermissionFlagsBits.Administrator);
                if (interaction.user.id !== ownerId && !isServerAdmin) {
                    if (interaction.isRepliable()) {
                        await interaction.reply({
                            content: `⛔ **Erişim Engellendi:** Bu komut yalnızca sunucu yöneticileri veya bot sahibi (<@${ownerId}>) tarafından kullanılabilir!`,
                            ephemeral: true,
                        });
                    }
                    return;
                }
            }
            if (interaction.isChatInputCommand()) {
                await this.handleChatInput(interaction);
            }
            else if (interaction.isButton()) {
                await this.handleButton(interaction);
            }
            else if (interaction.isModalSubmit()) {
                await this.handleModalSubmit(interaction);
            }
        }
        catch (err) {
            console.error('[InteractionHandler] Genel hata:', err);
            if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: `❌ Bir hata oluştu: ${err.message}`,
                    ephemeral: true,
                });
            }
        }
    }
    async handleChatInput(interaction) {
        const { commandName } = interaction;
        switch (commandName) {
            case 'kur':
            case 'ai-kur':
                await aiKurCmd.execute(interaction, this.aiManager);
                break;
            case 'plan':
                await planCmd.execute(interaction, this.aiManager);
                break;
            case 'logo':
            case 'ai-logo':
                await aiLogoCmd.execute(interaction);
                break;
            case 'onizle':
            case 'ai-onizle':
                await aiOnizleCmd.execute(interaction, this.aiManager);
                break;
            case 'boost':
                await boostCmd.execute(interaction);
                break;
            case 'teamwork':
                await teamworkCmd.execute(interaction);
                break;
            case 'browser':
                await browserCmd.execute(interaction);
                break;
            case 'sunucu-temizle':
                await sunucuTemizleCmd.execute(interaction);
                break;
            case 'yardim':
                await yardimCmd.execute(interaction);
                break;
            case 'davet':
                await davetCmd.execute(interaction);
                break;
            case 'mesajgönder':
            case 'mesajgonder':
                await mesajGonderCmd.execute(interaction);
                break;
            case 'rank':
            case 'seviye':
                await seviyeCmd.executeRank(interaction);
                break;
            case 'top':
            case 'liderlik':
                await seviyeCmd.executeTop(interaction);
                break;
            case 'seviye-ayarla':
                await seviyeCmd.executeSeviyeAyarla(interaction);
                break;
            case 'sil':
                await silCmd.execute(interaction);
                break;
            case 'avatar':
                await avatarCmd.execute(interaction);
                break;
            case 'sunucu':
                await sunucuCmd.execute(interaction);
                break;
            case 'afk':
                await afkCmd.execute(interaction);
                break;
            case 'istatistik':
                await istatistikCmd.execute(interaction);
                break;
            case 'kullanici':
                await kullaniciCmd.execute(interaction);
                break;
            case 'gonder':
                await gonderCmd.execute(interaction);
                break;
            case 'itiraf':
                await itirafCmd.execute(interaction);
                break;
            case 'cal':
                await muzikCmd.executeCal(interaction);
                break;
            case 'durdur':
                await muzikCmd.executeDurdur(interaction);
                break;
            case 'devam':
                await muzikCmd.executeDevam(interaction);
                break;
            case 'gec':
                await muzikCmd.executeGec(interaction);
                break;
            case 'kuyruk':
                await muzikCmd.executeKuyruk(interaction);
                break;
            case 'ayril':
                await muzikCmd.executeAyril(interaction);
                break;
            case 'ses':
                await muzikCmd.executeSes(interaction);
                break;
            default:
                await interaction.reply({ content: 'Bilinmeyen komut.', ephemeral: true });
                break;
        }
    }
    async handleButton(interaction) {
        const customId = interaction.customId;
        // 1. Ticket buttons
        if (customId === 'ticket_open') {
            await ticketManager_1.TicketManager.handleTicketOpen(interaction);
            return;
        }
        if (customId === 'ticket_close') {
            await ticketManager_1.TicketManager.handleTicketClose(interaction);
            return;
        }
        // 1.5. Social & Marriage buttons
        if (customId.startsWith('marry_')) {
            await socialManager_1.SocialManager.handleButton(interaction);
            return;
        }
        // 1.6. Confession Reactions
        if (customId.startsWith('confess_')) {
            await confessionManager_1.ConfessionManager.handleButton(interaction);
            return;
        }
        // 1.7. Music Controller buttons
        if (customId.startsWith('btn_music_')) {
            await musicPlayer_1.MusicPlayer.handleMusicButton(interaction, interaction.client);
            return;
        }
        // 2. Build Confirm
        if (customId.startsWith('build_confirm:')) {
            const cacheId = customId.split(':')[1];
            const pending = blueprintCache_1.BlueprintCache.get(cacheId);
            if (!pending) {
                await interaction.reply({
                    content: '⚠️ Bu kurulum oturumunun süresi dolmuş veya iptal edilmiş. Lütfen `/kur` ile yeniden deneyin.',
                    ephemeral: true,
                });
                return;
            }
            if (!interaction.memberPermissions?.has(discord_js_1.PermissionFlagsBits.Administrator)) {
                await interaction.reply({
                    content: '❌ Sadece yöneticiler kurulumu başlatabilir.',
                    ephemeral: true,
                });
                return;
            }
            // Check Bot Diagnostics (Permissions & Role Hierarchy)
            const diagnostics = diagnostics_1.ServerDiagnostics.check(interaction.guild);
            if (!diagnostics.canDeploy) {
                await interaction.reply({
                    content: '⚠️ **Kurulum başlatılamadı! Bot yetkileri veya rol hiyerarşisi eksik.**',
                    embeds: [diagnostics.troubleshootingEmbed],
                    ephemeral: true,
                });
                return;
            }
            await interaction.deferUpdate();
            // Disable buttons
            const initialEmbed = new discord_js_1.EmbedBuilder()
                .setTitle('🚀 Sunucu Mimarisi İnşa Ediliyor...')
                .setDescription(`### \`${(0, deployer_1.renderProgressBar)(5, 10)} Hazırlanıyor...\`\n\n> ⚙️ **Durum:** Sunucu şeması ve yetkiler doğrulanıyor...`)
                .setColor('#5865F2')
                .setFooter({ text: 'Nights Guard • Made by erencix' })
                .setTimestamp();
            await interaction.editReply({
                content: '',
                embeds: [initialEmbed],
                components: [],
            });
            const startTime = Date.now();
            let lastProgressUpdate = 0;
            try {
                const report = await this.deployer.deploy(interaction.guild, pending.blueprint, {
                    cleanSlate: pending.cleanSlate,
                    applyLogo: pending.applyLogo,
                    applyName: true,
                    preserveChannelId: interaction.channelId,
                }, async (status, percent) => {
                    const now = Date.now();
                    // Throttle Discord API edits to at most 1 update per 1.2s to prevent rate limits, always allow key milestones
                    const isMilestone = percent === 5 || percent === 40 || percent === 80 || percent === 100;
                    if (!isMilestone && now - lastProgressUpdate < 1200) {
                        return;
                    }
                    lastProgressUpdate = now;
                    const progressBar = (0, deployer_1.renderProgressBar)(percent, 10);
                    const progressLine = `${progressBar} ${status}`;
                    const progressEmbed = new discord_js_1.EmbedBuilder()
                        .setTitle('🏗️ Sunucu Mimarisi İnşa Ediliyor...')
                        .setDescription(`### \`${progressBar}\`\n\n> 🔄 **Aşama:** **${status}**\n\n⏳ *Lütfen bekleyin, Discord API hız limitlerine uygun olarak sırayla kuruluyor...*`)
                        .setColor('#5865F2')
                        .addFields({ name: '📊 İlerleme Durumu', value: `\`\`\`text\n${progressLine}\n\`\`\``, inline: false }, { name: '🏰 Hedef Sunucu', value: `**${pending.blueprint.serverName}**`, inline: true }, { name: '⏱️ Geçen Süre', value: `${Math.round((Date.now() - startTime) / 1000)}s`, inline: true })
                        .setFooter({ text: 'Nights Guard • Made by erencix' })
                        .setTimestamp();
                    try {
                        await interaction.editReply({
                            content: '',
                            embeds: [progressEmbed],
                            components: [],
                        });
                    }
                    catch (ignore) { }
                });
                blueprintCache_1.BlueprintCache.delete(cacheId);
                const durationSec = Math.round((Date.now() - startTime) / 1000);
                const successEmbed = new discord_js_1.EmbedBuilder()
                    .setTitle('🎉 SUNUCU KURULUMU BAŞARIYLA TAMAMLANDI!')
                    .setDescription(`### \`${(0, deployer_1.renderProgressBar)(100, 10)} Logo yüklendi & AutoMod kuralları aktif edildi!\`\n\n**${pending.blueprint.serverName}** başarıyla kuruldu ve hizmete hazır hale getirildi!\nSüre: **${durationSec} saniye**`)
                    .setColor('#2ECC71')
                    .addFields({ name: '🛡️ Oluşturulan Roller', value: `${report.rolesCreated} Adet`, inline: true }, { name: '📁 Oluşturulan Kanallar', value: `${report.channelsCreated} Adet`, inline: true }, { name: '🤖 AutoMod Kuralları', value: `${report.automodRulesCreated} Adet`, inline: true }, { name: '📜 Yerleştirilen Embedler', value: `${report.embedsPosted} Adet`, inline: true }, { name: '🎨 Logo Durumu', value: report.logoApplied ? '✅ Uygulandı' : 'Uygulanmadı', inline: true }, { name: '⚠️ Karşılaşılan Uyarılar', value: report.errors.length ? `${report.errors.length} adet (Loglarda)` : '0 Hata', inline: true })
                    .setFooter({ text: 'Nights Guard • Made by erencix' })
                    .setTimestamp();
                await interaction.editReply({
                    content: '✅ **Tüm işlemler başarıyla sonuçlandı!**',
                    embeds: [successEmbed],
                    components: [],
                });
            }
            catch (deployErr) {
                console.error('Deployment error:', deployErr);
                const failDiag = diagnostics_1.ServerDiagnostics.check(interaction.guild);
                if (!failDiag.healthy) {
                    await interaction.editReply({
                        content: `❌ **Kurulum sırasında yetkilendirme hatası meydana geldi:** ${deployErr.message}`,
                        embeds: [failDiag.troubleshootingEmbed],
                        components: [],
                    });
                }
                else {
                    await interaction.editReply({
                        content: `❌ Kurulum sırasında bir hata meydana geldi: ${deployErr.message}`,
                        components: [],
                    });
                }
            }
            return;
        }
        // 3. Build Details (JSON inspection)
        if (customId.startsWith('build_details:')) {
            const cacheId = customId.split(':')[1];
            const pending = blueprintCache_1.BlueprintCache.get(cacheId);
            if (!pending) {
                await interaction.reply({ content: 'Oturum bulunamadı.', ephemeral: true });
                return;
            }
            const jsonStr = JSON.stringify(pending.blueprint, null, 2);
            const snippet = jsonStr.slice(0, 1900);
            await interaction.reply({
                content: `📋 **MİMARİ PLANI (JSON KESİTİ):**\n\`\`\`json\n${snippet}\n\`\`\``,
                ephemeral: true,
            });
            return;
        }
        // 4. Build Cancel
        if (customId.startsWith('build_cancel:')) {
            const cacheId = customId.split(':')[1];
            blueprintCache_1.BlueprintCache.delete(cacheId);
            await interaction.update({
                content: '❌ **Kurulum işlemi iptal edildi.** Herhangi bir değişiklik yapılmadı.',
                embeds: [],
                components: [],
            });
            return;
        }
        // 5. Apply Logo Button
        if (customId.startsWith('apply_logo:')) {
            const logoId = customId.split(':')[1];
            const cached = aiLogo_1.pendingLogoCache.get(logoId);
            if (!cached) {
                await interaction.reply({ content: 'Logo verisi bulunamadı veya süresi doldu.', ephemeral: true });
                return;
            }
            if (!interaction.memberPermissions?.has(discord_js_1.PermissionFlagsBits.ManageGuild)) {
                await interaction.reply({ content: '❌ Sunucuyu Yönet yetkiniz yok.', ephemeral: true });
                return;
            }
            await interaction.deferReply({ ephemeral: true });
            try {
                await this.logoStudio.applyIconToGuild(interaction.guild, cached.buffer);
                aiLogo_1.pendingLogoCache.delete(logoId);
                await interaction.editReply({ content: '✅ Sunucu ikonu başarıyla güncellendi!' });
            }
            catch (err) {
                await interaction.editReply({ content: `❌ Logo güncellenemedi: ${err.message}` });
            }
            return;
        }
        // 6. Wipe Confirm
        if (customId.startsWith('wipe_confirm:')) {
            if (!interaction.memberPermissions?.has(discord_js_1.PermissionFlagsBits.Administrator)) {
                await interaction.reply({ content: '❌ Bu işlemi yalnızca Yöneticiler gerçekleştirebilir.', ephemeral: true });
                return;
            }
            await interaction.deferUpdate();
            await interaction.editReply({
                content: '💣 **Sunucu temizleniyor... Lütfen bekleyin.**',
                embeds: [],
                components: [],
            });
            try {
                const stats = await this.cleaner.purgeServer(interaction.guild, { preserveChannelId: interaction.channelId }, async (msg) => {
                    try {
                        await interaction.editReply({ content: `🧹 ${msg}` });
                    }
                    catch (e) { }
                });
                await interaction.editReply({
                    content: `✅ **Temizlik Tamamlandı!**\n• Silinen Kanal/Kategori: **${stats.channelsDeleted}**\n• Silinen Rol: **${stats.rolesDeleted}**\nSunucu sıfırlandı ve yeni kuruluma hazır hale getirildi. Artık \`/kur\` veya \`/plan\` komutunu kullanabilirsiniz.`,
                });
            }
            catch (err) {
                await interaction.editReply({
                    content: `❌ Temizlik sırasında hata: ${err.message}`,
                });
            }
            return;
        }
        // 7. Wipe Cancel
        if (customId === 'wipe_cancel') {
            await interaction.update({
                content: '🛡️ **Temizleme işlemi iptal edildi.** Hiçbir kanal veya rol silinmedi.',
                embeds: [],
                components: [],
            });
            return;
        }
        // 8. Registration Step 1: Kayıt Ol & Onay Al
        if (customId === 'btn_kayit_basla') {
            await interaction.deferReply({ ephemeral: true });
            const member = interaction.member;
            if (!member || !interaction.guild)
                return;
            const roles = await interaction.guild.roles.fetch();
            const waitingRole = roles.find((r) => r.name.includes('Cinsiyet Bekleyen') || r.name.includes('Kayıt Bekleyen'));
            if (waitingRole) {
                await member.roles.add(waitingRole).catch(() => { });
            }
            await interaction.editReply({
                content: '✅ **İlk doğrulama adımınız tamamlandı!**\nŞimdi size özel olarak açılan **#cinsiyet-secimi** kanalına geçerek cinsiyetinizi seçiniz.',
            });
            return;
        }
        // 9. Registration Step 2: Cinsiyet Seçimi (Erkek / Kız) -> Modal Açılır
        if (customId === 'btn_cinsiyet_erkek' || customId === 'btn_cinsiyet_kiz') {
            const isMale = customId === 'btn_cinsiyet_erkek';
            const modal = new discord_js_1.ModalBuilder()
                .setCustomId(isMale ? 'modal_kayit_erkek' : 'modal_kayit_kiz')
                .setTitle(`📝 Nights Kayıt (${isMale ? 'Erkek' : 'Kız'})`);
            const nameInput = new discord_js_1.TextInputBuilder()
                .setCustomId('input_isim')
                .setLabel('İsminiz')
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setPlaceholder('Örn: Eren')
                .setRequired(true)
                .setMaxLength(20);
            const ageInput = new discord_js_1.TextInputBuilder()
                .setCustomId('input_yas')
                .setLabel('Yaşınız (İsteğe bağlı)')
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setPlaceholder('Örn: 19')
                .setRequired(false)
                .setMaxLength(3);
            modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(nameInput), new discord_js_1.ActionRowBuilder().addComponents(ageInput));
            await interaction.showModal(modal);
            return;
        }
        // 10. Click Me Event Button (30 Click Target)
        if (customId === 'btn_event_click') {
            const userId = interaction.user.id;
            if (exports.eventClickUsers.has(userId)) {
                await interaction.reply({
                    content: `⚠️ **Zaten tıkladınız!**\nŞu anki toplam: **${exports.eventClickUsers.size} / 30**. Diğer arkadaşlarınızı da çağırın, 30'a ulaşalım!`,
                    ephemeral: true,
                });
                return;
            }
            exports.eventClickUsers.add(userId);
            const count = exports.eventClickUsers.size;
            const target = 30;
            const percent = Math.min(100, Math.round((count / target) * 100));
            const progressBar = (0, deployer_1.renderProgressBar)(percent, 10);
            const isCompleted = count >= target;
            const currentEmbed = interaction.message.embeds[0];
            const updatedEmbed = discord_js_1.EmbedBuilder.from(currentEmbed)
                .setDescription(`🎁 **30 TIKLAMA BÜYÜK EVENTİ!** 🔥\n\n` +
                `Aşağıdaki butona tıklayarak sayacı artırın. Toplam **30 farklı üye** tıkladığında sunucuda büyük sürpriz çekiliş ve ödüller aktifleşecek!\n\n` +
                `📊 **İlerleme:** \`${progressBar} ${count} / ${target} Tıklama (%${percent})\`\n\n` +
                (isCompleted ? '👑 **HEDEFE ULAŞILDI! BÜYÜK EVENT VE ÇEKİLİŞ BAŞLADI!** 🎉' : '🔥 *Herkes bir kez tıklayabilir. Arkadaşlarını davet et!*'))
                .setColor(isCompleted ? '#2ECC71' : '#E67E22');
            const updatedRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId('btn_event_click')
                .setLabel(isCompleted ? '🎉 HEDEFE ULAŞILDI (30/30)' : `🔥 TIKLA! (${count}/30)`)
                .setStyle(isCompleted ? discord_js_1.ButtonStyle.Success : discord_js_1.ButtonStyle.Primary)
                .setEmoji(isCompleted ? '👑' : '🔥')
                .setDisabled(isCompleted));
            await interaction.update({
                embeds: [updatedEmbed],
                components: [updatedRow],
            });
            if (isCompleted) {
                const ownerId = config_1.config.ownerId || '1138498666785677492';
                if (interaction.channel && 'send' in interaction.channel) {
                    await interaction.channel.send({
                        content: `👑 <@${ownerId}> kral click me bitti event istiyoruz :D`,
                    });
                    // Reset user set for next round
                    exports.eventClickUsers.clear();
                    // Send a brand new fresh Click Me panel so the cycle starts again:
                    const nextTarget = 30;
                    const newEmbed = new discord_js_1.EmbedBuilder()
                        .setTitle('🎁 30 TIKLAMA BÜYÜK EVENTİ! 🔥')
                        .setDescription(`Hey @everyone! Önceki 30 tıklama hedefi başarıyla tamamlandı! 🎊\n\n` +
                        `Şimdi **yeni event** için tıklama sayacı sıfırlandı. Aşağıdaki butona basarak sıradaki hedefe katkıda bulunun!\n\n` +
                        `📊 **İlerleme:** \`[░░░░░░░░░░] 0 / ${nextTarget} Tıklama (%0)\`\n\n` +
                        `🔥 *Hedef 30 olduğunda kral erencix'e anında bildirim gidecek!*`)
                        .setImage('https://media.giphy.com/media/26tn3334mvoVClhos/giphy.gif')
                        .setColor('#E67E22')
                        .setFooter({ text: 'Nights Community Event • Made by erencix' });
                    const newRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                        .setCustomId('btn_event_click')
                        .setLabel('🔥 TIKLA! (0/30)')
                        .setStyle(discord_js_1.ButtonStyle.Primary)
                        .setEmoji('🔥'));
                    await interaction.channel.send({
                        embeds: [newEmbed],
                        components: [newRow],
                    });
                }
            }
            return;
        }
        // 12. Voice Control Panel Buttons
        if (customId.startsWith('btn_voice_')) {
            await voicePanelManager_1.VoicePanelManager.handleVoiceButton(interaction);
            return;
        }
    }
    async handleModalSubmit(interaction) {
        if (interaction.customId === 'modal_voice_rename') {
            await voicePanelManager_1.VoicePanelManager.handleVoiceModal(interaction);
            return;
        }
        if (interaction.customId.startsWith('modal_kayit_')) {
            // 1. ANINDA DEFER ET - 3 Saniyelik 'Zaman Aşımı' / 'Uygulama Yanıt Vermedi' Hatasını Tamamen Engelle!
            await interaction.deferReply({ ephemeral: true });
            const isMale = interaction.customId === 'modal_kayit_erkek';
            const isim = interaction.fields.getTextInputValue('input_isim').trim();
            const yas = interaction.fields.getTextInputValue('input_yas').trim();
            const member = interaction.member;
            const guild = interaction.guild;
            if (!member || !guild)
                return;
            // Update nickname: ☊ sembolü ile (örn: ☊ Eren | 19 veya ☊ Eren)
            const formattedNick = `☊ ${isim}${yas ? ' | ' + yas : ''}`.slice(0, 32);
            // Rolleri güncel API'den fetch ederek kesin olarak bul
            const roles = await guild.roles.fetch();
            const maleRole = roles.find((r) => r.name.toLowerCase() === 'erkek' || r.name.includes('Erkek'));
            const femaleRole = roles.find((r) => r.name.toLowerCase() === 'kız' || r.name.includes('Kız'));
            const memberRole = roles.find((r) => r.name.toLowerCase() === 'üye' || (r.name.includes('Üye') && !r.name.includes('Onaylı')));
            const approvedRole = roles.find((r) => r.name.toLowerCase() === 'onaylı' || r.name.includes('Onaylı'));
            const targetGenderRole = isMale ? maleRole : femaleRole;
            const rolesToAdd = [targetGenderRole, memberRole, approvedRole].filter(Boolean);
            // Üyenin güncel profilini çek ve bekleyen TÜM rolleri eksiksiz temizle
            const freshMember = await guild.members.fetch(member.id).catch(() => member);
            const waitingRoles = roles.filter((r) => r.name.toLowerCase().includes('bekleyen') ||
                r.name.toLowerCase().includes('kayıtsız') ||
                r.name.toLowerCase().includes('cinsiyet bekleyen') ||
                r.name.toLowerCase().includes('kayıt bekleyen'));
            // 1. Bekleyen rollerin tamamını kaldır
            for (const [, wRole] of waitingRoles) {
                if (freshMember.roles.cache.has(wRole.id)) {
                    await freshMember.roles.remove(wRole).catch((err) => console.warn(`[Kayıt] ${wRole.name} silinemedi:`, err.message));
                }
            }
            // 2. Onaylı yeni rolleri ekle
            if (rolesToAdd.length > 0) {
                await freshMember.roles.add(rolesToAdd).catch((err) => console.warn('[Kayıt] Rol eklenemedi:', err.message));
            }
            // 3. İsmi ☊ sembolüyle güncelle
            await freshMember.setNickname(formattedNick).catch((err) => console.warn('[Kayıt] Nick değiştirilemedi:', err.message));
            await interaction.editReply({
                content: `🎉 **Tebrikler ${isim}! Kaydınız başarıyla tamamlandı.**\nArtık kayıt odaları sizden gizlendi ve tüm sohbet, medya ve oyun odalarına erişebilirsiniz! Aramıza hoş geldin!`,
            });
            // Send log to #kayit-log asynchronously without blocking
            const logChannel = guild.channels.cache.find((c) => c.name.includes('kayit-log') && c.isTextBased());
            if (logChannel) {
                const logEmbed = new discord_js_1.EmbedBuilder()
                    .setTitle('📥 Yeni Üye Kaydı Tamamlandı')
                    .setColor(isMale ? '#3498DB' : '#E91E63')
                    .addFields({ name: '👤 Üye', value: `<@${member.id}> (\`${member.user.tag}\`)`, inline: true }, { name: '🚻 Cinsiyet', value: isMale ? '👦 Erkek' : '👧 Kız', inline: true }, { name: '📝 Yeni İsim', value: `\`${formattedNick}\``, inline: true })
                    .setThumbnail(member.user.displayAvatarURL())
                    .setFooter({ text: 'Nights Guard • Kayıt Sistemi' })
                    .setTimestamp();
                logChannel.send({ embeds: [logEmbed] }).catch(() => { });
            }
        }
    }
}
exports.InteractionHandler = InteractionHandler;
