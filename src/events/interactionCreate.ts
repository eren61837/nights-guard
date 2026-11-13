import {
  Interaction,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  GuildMember,
  TextChannel,
  ChannelType,
  ModalSubmitInteraction,
  MessageFlags,
} from 'discord.js';
import { AIManager } from '../services/ai/aiManager';
import { BlueprintCache } from '../services/engine/blueprintCache';
import { ServerDeployer, renderProgressBar } from '../services/engine/deployer';
import { ServerCleaner } from '../services/engine/cleaner';
import { ServerDiagnostics } from '../services/engine/diagnostics';
import { LogoStudio } from '../services/image/logoStudio';
import { TicketManager } from '../services/features/ticketManager';
import { VoicePanelManager } from '../services/features/voicePanelManager';
import { pendingLogoCache } from '../commands/aiLogo';

import { config } from '../config';
import { LanguageGateManager } from '../services/features/languageGateManager';
import { AutoSecurityGuard } from '../services/features/autoSecurityGuard';
import * as aiKurCmd from '../commands/aiKur';
import * as aiLogoCmd from '../commands/aiLogo';
import * as aiOnizleCmd from '../commands/aiOnizle';
import * as sunucuTemizleCmd from '../commands/sunucuTemizle';
import * as yardimCmd from '../commands/yardim';
import * as planCmd from '../commands/plan';
import * as boostCmd from '../commands/boost';
import * as teamworkCmd from '../commands/teamwork';
import * as browserCmd from '../commands/browser';
import * as davetCmd from '../commands/davet';
import * as mesajGonderCmd from '../commands/mesajGonder';
import * as seviyeCmd from '../commands/seviye';
import * as silCmd from '../commands/sil';
import * as avatarCmd from '../commands/avatar';
import * as sunucuCmd from '../commands/sunucu';
import * as afkCmd from '../commands/afk';
import * as istatistikCmd from '../commands/istatistik';
import * as kullaniciCmd from '../commands/kullanici';
import * as gonderCmd from '../commands/gonder';
import * as itirafCmd from '../commands/itiraf';
import * as muzikCmd from '../commands/muzik';
import * as yedekCmd from '../commands/yedek';
import * as aiAnahtarCmd from '../commands/aiAnahtar';
import * as lobiCmd from '../commands/lobi';
import * as oyuncuCmd from '../commands/oyuncu';
import * as roastCmd from '../commands/roast';
import * as lakapCmd from '../commands/lakap';
import * as erenmodCmd from '../commands/erenmod';
import { GamerHubManager } from '../services/features/gamerHubManager';
import { RoastManager } from '../services/features/roastManager';
import { ErenModManager } from '../services/features/erenModManager';
import { SocialManager } from '../services/features/socialManager';
import { ConfessionManager } from '../services/features/confessionManager';
import { MusicPlayer } from '../services/features/musicPlayer';

// Click Me Event User Cache
export const eventClickUsers = new Set<string>();

export class InteractionHandler {
  private aiManager: AIManager;
  private deployer: ServerDeployer;
  private cleaner: ServerCleaner;
  private logoStudio: LogoStudio;

  constructor(aiManager: AIManager) {
    this.aiManager = aiManager;
    this.deployer = new ServerDeployer();
    this.cleaner = new ServerCleaner();
    this.logoStudio = new LogoStudio();
  }

  public async handle(interaction: Interaction): Promise<void> {
    try {
      // Kayıt, Dil Seçimi, Etkinlik (Click Me), Müzik (buton & /cal komutları), Ses Paneli, Gamer Hub ve Destek (Ticket) tüm üyelere açıktır:
      const isPublicInteraction =
        (interaction.isButton() && (
          interaction.customId === 'btn_kayit_basla' ||
          interaction.customId.startsWith('btn_lang_') ||
          interaction.customId.startsWith('btn_reg_') ||
          interaction.customId.startsWith('btn_cinsiyet_') ||
          interaction.customId === 'btn_event_click' ||
          interaction.customId.startsWith('btn_voice_') ||
          interaction.customId.startsWith('marry_') ||
          interaction.customId.startsWith('confess_') ||
          interaction.customId.startsWith('btn_music_') ||
          interaction.customId === 'btn_open_lobby_modal' ||
          interaction.customId === 'btn_how_it_works' ||
          interaction.customId.startsWith('lobby_') ||
          interaction.customId.startsWith('btn_roast_') ||
          interaction.customId.startsWith('btn_lakap_') ||
          interaction.customId === 'btn_erenmod_shuffle' ||
          interaction.customId === 'ticket_open' ||
          interaction.customId === 'ticket_close'
        )) ||
        (interaction.isModalSubmit() && (
          interaction.customId.startsWith('modal_kayit_') ||
          interaction.customId === 'modal_voice_rename' ||
          interaction.customId === 'modal_create_lobby'
        )) ||
        (interaction.isChatInputCommand() && [
          'rank', 'seviye', 'top', 'liderlik', 'yardim', 'avatar', 'sunucu', 'afk', 'sil',
          'istatistik', 'kullanici', 'gonder', 'itiraf', 'cal', 'durdur', 'devam', 'gec', 'kuyruk', 'ayril', 'ses',
          'lobi-bul', 'oyuncu', 'roast', 'lakap', 'erenmod'
        ].includes(interaction.commandName));

      if (!isPublicInteraction) {
        const ownerId = config.ownerId || process.env.OWNER_ID || '1138498666785677492';
        const isServerAdmin = (interaction.member as GuildMember)?.permissions?.has(PermissionFlagsBits.Administrator);
        if (interaction.user.id !== ownerId && !isServerAdmin) {
          if (interaction.isRepliable()) {
            await interaction.reply({
              content: `⛔ **Erişim Engellendi:** Bu komut yalnızca sunucu yöneticileri veya bot sahibi (<@${ownerId}>) tarafından kullanılabilir!`,
              flags: MessageFlags.Ephemeral,
            }).catch(() => {});
          }
          return;
        }
      }

      if (interaction.isChatInputCommand()) {
        await this.handleChatInput(interaction);
      } else if (interaction.isButton()) {
        await this.handleButton(interaction);
      } else if (interaction.isModalSubmit()) {
        await this.handleModalSubmit(interaction as ModalSubmitInteraction);
      }
    } catch (err: any) {
      console.error('[InteractionHandler] Genel hata:', err);
      try {
        if (interaction.isRepliable()) {
          if (interaction.deferred) {
            await interaction.editReply({
              content: `❌ Bir hata oluştu: ${err.message}`,
            }).catch(() => {});
          } else if (!interaction.replied) {
            await interaction.reply({
              content: `❌ Bir hata oluştu: ${err.message}`,
              flags: MessageFlags.Ephemeral,
            }).catch(() => {});
          }
        }
      } catch (e) {}
    }
  }

  private async handleChatInput(interaction: any): Promise<void> {
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
      case 'yedek-al':
      case 'yedekal':
        await yedekCmd.executeYedekAl(interaction);
        break;
      case 'yedekgetir':
      case 'yedek-kur':
      case 'yedekkur':
        await yedekCmd.executeYedekGetir(interaction);
        break;
      case 'ai-anahtar':
      case 'aianahtar':
      case 'ai-key':
        await aiAnahtarCmd.execute(interaction);
        break;
      case 'lobi-bul':
        await lobiCmd.execute(interaction);
        break;
      case 'oyuncu':
        await oyuncuCmd.execute(interaction);
        break;
      case 'roast':
        await roastCmd.execute(interaction);
        break;
      case 'lakap':
        await lakapCmd.execute(interaction);
        break;
      case 'erenmod':
      case 'eren':
        await erenmodCmd.execute(interaction);
        break;
      default:
        await interaction.reply({ content: 'Bilinmeyen komut.', flags: MessageFlags.Ephemeral });
        break;
    }
  }

  private async handleButton(interaction: any): Promise<void> {
    const customId = interaction.customId;

    // 1. Ticket buttons
    if (customId === 'ticket_open') {
      await TicketManager.handleTicketOpen(interaction);
      return;
    }
    if (customId === 'ticket_close') {
      await TicketManager.handleTicketClose(interaction);
      return;
    }

    // 1.5. Social & Marriage buttons
    if (customId.startsWith('marry_')) {
      await SocialManager.handleButton(interaction);
      return;
    }

    // 1.6. Confession Reactions
    if (customId.startsWith('confess_')) {
      await ConfessionManager.handleButton(interaction);
      return;
    }

    // 1.7. Music Controller buttons
    if (customId.startsWith('btn_music_')) {
      await MusicPlayer.handleMusicButton(interaction, interaction.client);
      return;
    }

    // 1.8. Gamer Hub Buttons
    if (customId === 'btn_open_lobby_modal') {
      const modal = new ModalBuilder()
        .setCustomId('modal_create_lobby')
        .setTitle('🎮 Hızlı Oyun Lobisi Oluştur');

      const gameInput = new TextInputBuilder()
        .setCustomId('input_lobby_game')
        .setLabel('Oyun Adı (Valorant, CS2, LoL, GTA...)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Örn: Valorant')
        .setRequired(true)
        .setMaxLength(30);

      const slotsInput = new TextInputBuilder()
        .setCustomId('input_lobby_slots')
        .setLabel('Kaç Kişi Arıyorsunuz? (1 - 9)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Örn: 2')
        .setRequired(true)
        .setMaxLength(2);

      const rankInput = new TextInputBuilder()
        .setCustomId('input_lobby_rank')
        .setLabel('Aranan Rank / Seviye (İsteğe bağlı)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Örn: Platin+, Gold, Fark etmez')
        .setRequired(false)
        .setMaxLength(30);

      const noteInput = new TextInputBuilder()
        .setCustomId('input_lobby_note')
        .setLabel('Lobi Notu (İsteğe bağlı)')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Örn: Ses şart, tryhard veya chill...')
        .setRequired(false)
        .setMaxLength(100);

      modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(gameInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(slotsInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(rankInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(noteInput)
      );

      await interaction.showModal(modal);
      return;
    }

    if (customId === 'btn_how_it_works' || customId.startsWith('lobby_')) {
      const handled = await GamerHubManager.handleButton(interaction);
      if (handled) return;
    }

    // 1.9. Roast & Lakap Buttons
    if (customId === 'btn_roast_self') {
      await interaction.reply({
        content: '🔥 Kendini veya bir başkasını fena roastlatmak için </roast:0> komutunu kullanabilirsin!',
        ephemeral: true,
      });
      return;
    }

    if (customId.startsWith('btn_lakap_reroll_')) {
      const targetUserId = customId.replace('btn_lakap_reroll_', '');
      const guild = interaction.guild;
      if (!guild) return;
      const targetMember = await guild.members.fetch(targetUserId).catch(() => null);
      if (!targetMember) return;

      await interaction.deferUpdate();
      try {
        const card = await RoastManager.generateNickname(guild, targetMember);
        const embed = RoastManager.buildNicknameEmbed(targetMember, card);
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`btn_lakap_reroll_${targetMember.id}`)
            .setLabel('🎲 Başka Lakap Üret')
            .setEmoji('🔄')
            .setStyle(ButtonStyle.Primary)
        );
        await interaction.editReply({ embeds: [embed], components: [row] });
      } catch (e: any) {
        console.warn('[LakapReroll] Hata:', e.message);
      }
      return;
    }

    if (customId === 'btn_erenmod_shuffle') {
      await ErenModManager.playErenMod({ interaction }, interaction.client, true);
      return;
    }

    // 2. Build Confirm
    if (customId.startsWith('build_confirm:')) {
      const cacheId = customId.split(':')[1];
      const pending = BlueprintCache.get(cacheId);

      if (!pending) {
        await interaction.reply({
          content: '⚠️ Bu kurulum oturumunun süresi dolmuş veya iptal edilmiş. Lütfen `/kur` ile yeniden deneyin.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        await interaction.reply({
          content: '❌ Sadece yöneticiler kurulumu başlatabilir.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      // Check Bot Diagnostics (Permissions & Role Hierarchy)
      const diagnostics = ServerDiagnostics.check(interaction.guild);
      if (!diagnostics.canDeploy) {
        await interaction.reply({
          content: '⚠️ **Kurulum başlatılamadı! Bot yetkileri veya rol hiyerarşisi eksik.**',
          embeds: [diagnostics.troubleshootingEmbed],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await interaction.deferUpdate();

      // Disable buttons
      const initialEmbed = new EmbedBuilder()
        .setTitle('🚀 Sunucu Mimarisi İnşa Ediliyor...')
        .setDescription(`### \`${renderProgressBar(5, 10)} Hazırlanıyor...\`\n\n> ⚙️ **Durum:** Sunucu şeması ve yetkiler doğrulanıyor...`)
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
        const report = await this.deployer.deploy(
          interaction.guild,
          pending.blueprint,
          {
            cleanSlate: pending.cleanSlate,
            applyLogo: pending.applyLogo,
            applyName: true,
            preserveChannelId: interaction.channelId,
          },
          async (status, percent) => {
            const now = Date.now();
            // Throttle Discord API edits to at most 1 update per 1.2s to prevent rate limits, always allow key milestones
            const isMilestone = percent === 5 || percent === 40 || percent === 80 || percent === 100;
            if (!isMilestone && now - lastProgressUpdate < 1200) {
              return;
            }
            lastProgressUpdate = now;

            const progressBar = renderProgressBar(percent, 10);
            const progressLine = `${progressBar} ${status}`;

            const progressEmbed = new EmbedBuilder()
              .setTitle('🏗️ Sunucu Mimarisi İnşa Ediliyor...')
              .setDescription(`### \`${progressBar}\`\n\n> 🔄 **Aşama:** **${status}**\n\n⏳ *Lütfen bekleyin, Discord API hız limitlerine uygun olarak sırayla kuruluyor...*`)
              .setColor('#5865F2')
              .addFields(
                { name: '📊 İlerleme Durumu', value: `\`\`\`text\n${progressLine}\n\`\`\``, inline: false },
                { name: '🏰 Hedef Sunucu', value: `**${pending.blueprint.serverName}**`, inline: true },
                { name: '⏱️ Geçen Süre', value: `${Math.round((Date.now() - startTime) / 1000)}s`, inline: true }
              )
              .setFooter({ text: 'Nights Guard • Made by erencix' })
              .setTimestamp();

            try {
              await interaction.editReply({
                content: '',
                embeds: [progressEmbed],
                components: [],
              });
            } catch (ignore) {}
          }
        );

        BlueprintCache.delete(cacheId);
        const durationSec = Math.round((Date.now() - startTime) / 1000);

        const successEmbed = new EmbedBuilder()
          .setTitle('🎉 SUNUCU KURULUMU BAŞARIYLA TAMAMLANDI!')
          .setDescription(
            `### \`${renderProgressBar(100, 10)} Logo yüklendi & AutoMod kuralları aktif edildi!\`\n\n**${pending.blueprint.serverName}** başarıyla kuruldu ve hizmete hazır hale getirildi!\nSüre: **${durationSec} saniye**`
          )
          .setColor('#2ECC71')
          .addFields(
            { name: '🛡️ Oluşturulan Roller', value: `${report.rolesCreated} Adet`, inline: true },
            { name: '📁 Oluşturulan Kanallar', value: `${report.channelsCreated} Adet`, inline: true },
            { name: '🤖 AutoMod Kuralları', value: `${report.automodRulesCreated} Adet`, inline: true },
            { name: '📜 Yerleştirilen Embedler', value: `${report.embedsPosted} Adet`, inline: true },
            { name: '🎨 Logo Durumu', value: report.logoApplied ? '✅ Uygulandı' : 'Uygulanmadı', inline: true },
            { name: '⚠️ Karşılaşılan Uyarılar', value: report.errors.length ? `${report.errors.length} adet (Loglarda)` : '0 Hata', inline: true }
          )
          .setFooter({ text: 'Nights Guard • Made by erencix' })
          .setTimestamp();

        await interaction.editReply({
          content: '✅ **Tüm işlemler başarıyla sonuçlandı!**',
          embeds: [successEmbed],
          components: [],
        });
      } catch (deployErr: any) {
        console.error('Deployment error:', deployErr);
        const failDiag = ServerDiagnostics.check(interaction.guild);
        if (!failDiag.healthy) {
          await interaction.editReply({
            content: `❌ **Kurulum sırasında yetkilendirme hatası meydana geldi:** ${deployErr.message}`,
            embeds: [failDiag.troubleshootingEmbed],
            components: [],
          });
        } else {
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
      const pending = BlueprintCache.get(cacheId);
      if (!pending) {
        await interaction.reply({ content: 'Oturum bulunamadı.', flags: MessageFlags.Ephemeral });
        return;
      }

      const jsonStr = JSON.stringify(pending.blueprint, null, 2);
      const snippet = jsonStr.slice(0, 1900);

      await interaction.reply({
        content: `📋 **MİMARİ PLANI (JSON KESİTİ):**\n\`\`\`json\n${snippet}\n\`\`\``,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // 4. Build Cancel
    if (customId.startsWith('build_cancel:')) {
      const cacheId = customId.split(':')[1];
      BlueprintCache.delete(cacheId);
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
      const cached = pendingLogoCache.get(logoId);
      if (!cached) {
        await interaction.reply({ content: 'Logo verisi bulunamadı veya süresi doldu.', flags: MessageFlags.Ephemeral });
        return;
      }

      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
        await interaction.reply({ content: '❌ Sunucuyu Yönet yetkiniz yok.', flags: MessageFlags.Ephemeral });
        return;
      }

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      try {
        await this.logoStudio.applyIconToGuild(interaction.guild, cached.buffer);
        pendingLogoCache.delete(logoId);
        await interaction.editReply({ content: '✅ Sunucu ikonu başarıyla güncellendi!' });
      } catch (err: any) {
        await interaction.editReply({ content: `❌ Logo güncellenemedi: ${err.message}` });
      }
      return;
    }

    // 6. Wipe Confirm
    if (customId.startsWith('wipe_confirm:')) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        await interaction.reply({ content: '❌ Bu işlemi yalnızca Yöneticiler gerçekleştirebilir.', flags: MessageFlags.Ephemeral });
        return;
      }

      await interaction.deferUpdate();
      await interaction.editReply({
        content: '💣 **Sunucu temizleniyor... Lütfen bekleyin.**',
        embeds: [],
        components: [],
      });

      try {
        const stats = await this.cleaner.purgeServer(
          interaction.guild,
          { preserveChannelId: interaction.channelId },
          async (msg) => {
            try {
              await interaction.editReply({ content: `🧹 ${msg}` });
            } catch (e) {}
          }
        );

        await interaction.editReply({
          content: `✅ **Temizlik Tamamlandı!**\n• Silinen Kanal/Kategori: **${stats.channelsDeleted}**\n• Silinen Rol: **${stats.rolesDeleted}**\nSunucu sıfırlandı ve yeni kuruluma hazır hale getirildi. Artık \`/kur\` veya \`/plan\` komutunu kullanabilirsiniz.`,
        });
      } catch (err: any) {
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

    // 7.8. Language Gate (Dil Seçimi: 🇹🇷 Türkçe / 🇬🇧 English)
    if (customId === 'btn_lang_tr' || customId === 'btn_lang_en') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const member = interaction.member as GuildMember;
      const guild = interaction.guild;
      if (!member || !guild) return;

      const roles = await guild.roles.fetch();
      let trRole = roles.find((r: any) => r.name === '🇹🇷・Türkçe' || r.name === 'Türkçe');
      let enRole = roles.find((r: any) => r.name === '🇬🇧・English' || r.name === 'English');

      if (!trRole) {
        trRole = await guild.roles.create({ name: '🇹🇷・Türkçe', color: '#3B82F6', reason: 'Dil Seçim Rolü' });
      }
      if (!enRole) {
        enRole = await guild.roles.create({ name: '🇬🇧・English', color: '#A855F7', reason: 'Language Role' });
      }

      const isTr = customId === 'btn_lang_tr';
      const targetRole = isTr ? trRole : enRole;
      const removeRole = isTr ? enRole : trRole;

      if (member.roles.cache.has(removeRole.id)) {
        await member.roles.remove(removeRole).catch(() => {});
      }
      await member.roles.add(targetRole).catch(() => {});

      if (isTr) {
        const kayitCh = guild.channels.cache.find(
          (c: any) => c.isTextBased() && c.name.includes('kayit-onay')
        );
        const mentionText = kayitCh ? `<#${kayitCh.id}>` : '**#kayit-onay**';
        const langEmbed = LanguageGateManager.buildLanguageSelectedEmbed(true, mentionText);
        await interaction.editReply({ embeds: [langEmbed] });
      } else {
        const regCh = guild.channels.cache.find(
          (c: any) => c.isTextBased() && c.name.includes('registration')
        );
        const mentionText = regCh ? `<#${regCh.id}>` : '**#registration**';
        const langEmbed = LanguageGateManager.buildLanguageSelectedEmbed(false, mentionText);
        await interaction.editReply({ embeds: [langEmbed] });
      }
      return;
    }

    // 7.9. Global English Registration (btn_reg_male / btn_reg_female) -> Modal
    if (customId === 'btn_reg_male' || customId === 'btn_reg_female') {
      const isMale = customId === 'btn_reg_male';
      const modal = new ModalBuilder()
        .setCustomId(isMale ? 'modal_kayit_male' : 'modal_kayit_female')
        .setTitle(`📝 Nights Registration (${isMale ? 'Male' : 'Female'})`);

      const nameInput = new TextInputBuilder()
        .setCustomId('input_isim')
        .setLabel('Your Name / Nickname')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('E.g. Alex')
        .setRequired(true)
        .setMaxLength(20);

      const ageInput = new TextInputBuilder()
        .setCustomId('input_yas')
        .setLabel('Your Age (Optional)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('E.g. 19')
        .setRequired(false)
        .setMaxLength(3);

      modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(ageInput)
      );

      await interaction.showModal(modal);
      return;
    }

    // 8. Registration Step 1: Kayıt Ol & Onay Al (1. Adım -> Kayıt Bekleyen verir, kayit-onay kapanır, cinsiyet-secimi açılır)
    if (customId === 'btn_kayit_basla') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const member = interaction.member as GuildMember;
      const guild = interaction.guild;
      if (!member || !guild) return;

      const roles = await guild.roles.fetch();
      const waitingRole = roles.find(
        (r: any) => r.name.includes('Cinsiyet Bekleyen') || r.name.includes('Kayıt Bekleyen')
      );
      if (waitingRole) {
        await member.roles.add(waitingRole).catch(() => {});
      }

      const cinsiyetCh = guild.channels.cache.find(
        (c: any) => c && c.name.includes('cinsiyet-secimi')
      );
      const mention = cinsiyetCh ? `<#${cinsiyetCh.id}>` : '#cinsiyet-secimi';

      await interaction.editReply({
        content: `✅ **1. Adım Tamamlandı!**\nLütfen size özel olarak açılan ${mention} kanalına geçerek cinsiyetinizi seçiniz.\n\n*Step 1 complete! Please proceed to ${mention} to select your gender.*`,
      });
      return;
    }

    // 9. Registration Step 2 & Gender Role Selection: Cinsiyet Seçimi (Erkek / Kız)
    if (customId === 'btn_cinsiyet_erkek' || customId === 'btn_cinsiyet_kiz') {
      const isMale = customId === 'btn_cinsiyet_erkek';
      const member = interaction.member as GuildMember;
      const guild = interaction.guild;
      if (!member || !guild) return;

      const roles = await guild.roles.fetch();
      const approvedRole = roles.find((r: any) => r.name.toLowerCase() === 'onaylı' || r.name.includes('Onaylı'));
      const memberRole = roles.find((r: any) => r.name.toLowerCase() === 'üye' || (r.name.includes('Üye') && !r.name.includes('Onaylı')));
      const maleRole = roles.find((r: any) => r.name.toLowerCase() === 'erkek' || r.name.includes('Erkek'));
      const femaleRole = roles.find((r: any) => r.name.toLowerCase() === 'kız' || r.name.includes('Kız'));

      const isAlreadyApproved = (approvedRole && member.roles.cache.has(approvedRole.id)) || (memberRole && member.roles.cache.has(memberRole.id));

      // ÜYE ZATEN KAYITLIYSA: Sadece cinsiyet rolünü güncelle (Modal açmaya gerek yok!)
      if (isAlreadyApproved) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const targetRole = isMale ? maleRole : femaleRole;
        const removeRole = isMale ? femaleRole : maleRole;

        if (removeRole && member.roles.cache.has(removeRole.id)) {
          await member.roles.remove(removeRole).catch(() => {});
        }
        if (targetRole && !member.roles.cache.has(targetRole.id)) {
          await member.roles.add(targetRole).catch(() => {});
        }

        await interaction.editReply({
          content: `✅ Cinsiyet rolünüz başarıyla **${isMale ? '👦 Erkek' : '👧 Kız'}** olarak güncellendi!`,
        });
        return;
      }

      // ÜYE HENÜZ KAYITLI DEĞİLSE: Kayıt modalını aç!
      const modal = new ModalBuilder()
        .setCustomId(isMale ? 'modal_kayit_erkek' : 'modal_kayit_kiz')
        .setTitle(`📝 Nights Kayıt / Registration (${isMale ? 'Erkek / Male' : 'Kız / Female'})`);

      const nameInput = new TextInputBuilder()
        .setCustomId('input_isim')
        .setLabel('İsminiz / Your Name')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Örn: Eren / Alex')
        .setRequired(true)
        .setMaxLength(20);

      const ageInput = new TextInputBuilder()
        .setCustomId('input_yas')
        .setLabel('Yaşınız / Your Age (İsteğe bağlı)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Örn: 19')
        .setRequired(false)
        .setMaxLength(3);

      modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(ageInput)
      );

      await interaction.showModal(modal);
      return;
    }

    // 10. Click Me Event Button (30 Click Target)
    if (customId === 'btn_event_click') {
      const userId = interaction.user.id;
      if (eventClickUsers.has(userId)) {
        await interaction.reply({
          content: `⚠️ **Zaten tıkladınız!**\nŞu anki toplam: **${eventClickUsers.size} / 30**. Diğer arkadaşlarınızı da çağırın, 30'a ulaşalım!`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      eventClickUsers.add(userId);
      const count = eventClickUsers.size;
      const target = 30;
      const percent = Math.min(100, Math.round((count / target) * 100));
      const progressBar = renderProgressBar(percent, 10);
      const isCompleted = count >= target;

      const currentEmbed = interaction.message.embeds[0];
      const updatedEmbed = EmbedBuilder.from(currentEmbed)
        .setDescription(
          `🎁 **30 TIKLAMA BÜYÜK EVENTİ!** 🔥\n\n` +
          `Aşağıdaki butona tıklayarak sayacı artırın. Toplam **30 farklı üye** tıkladığında sunucuda büyük sürpriz çekiliş ve ödüller aktifleşecek!\n\n` +
          `📊 **İlerleme:** \`${progressBar} ${count} / ${target} Tıklama (%${percent})\`\n\n` +
          (isCompleted ? '👑 **HEDEFE ULAŞILDI! BÜYÜK EVENT VE ÇEKİLİŞ BAŞLADI!** 🎉' : '🔥 *Herkes bir kez tıklayabilir. Arkadaşlarını davet et!*')
        )
        .setColor(isCompleted ? '#2ECC71' : '#E67E22');

      const updatedRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('btn_event_click')
          .setLabel(isCompleted ? '🎉 HEDEFE ULAŞILDI (30/30)' : `🔥 TIKLA! (${count}/30)`)
          .setStyle(isCompleted ? ButtonStyle.Success : ButtonStyle.Primary)
          .setEmoji(isCompleted ? '👑' : '🔥')
          .setDisabled(isCompleted)
      );

      await interaction.update({
        embeds: [updatedEmbed],
        components: [updatedRow],
      });

      if (isCompleted) {
        const ownerId = config.ownerId || '1138498666785677492';

        if (interaction.channel && 'send' in interaction.channel) {
          await (interaction.channel as any).send({
            content: `👑 <@${ownerId}> kral click me bitti event istiyoruz :D`,
          });

          // Reset user set for next round
          eventClickUsers.clear();

          // Send a brand new fresh Click Me panel so the cycle starts again:
          const nextTarget = 30;
          const newEmbed = new EmbedBuilder()
            .setTitle('🎁 30 TIKLAMA BÜYÜK EVENTİ! 🔥')
            .setDescription(
              `Hey @everyone! Önceki 30 tıklama hedefi başarıyla tamamlandı! 🎊\n\n` +
              `Şimdi **yeni event** için tıklama sayacı sıfırlandı. Aşağıdaki butona basarak sıradaki hedefe katkıda bulunun!\n\n` +
              `📊 **İlerleme:** \`[░░░░░░░░░░] 0 / ${nextTarget} Tıklama (%0)\`\n\n` +
              `🔥 *Hedef 30 olduğunda kral erencix'e anında bildirim gidecek!*`
            )
            .setImage('https://media.giphy.com/media/26tn3334mvoVClhos/giphy.gif')
            .setColor('#E67E22')
            .setFooter({ text: 'Nights Community Event • Made by erencix' });

          const newRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId('btn_event_click')
              .setLabel('🔥 TIKLA! (0/30)')
              .setStyle(ButtonStyle.Primary)
              .setEmoji('🔥')
          );

          await (interaction.channel as any).send({
            embeds: [newEmbed],
            components: [newRow],
          });
        }
      }
      return;
    }

    // 12. Voice Control Panel Buttons
    if (customId.startsWith('btn_voice_')) {
      await VoicePanelManager.handleVoiceButton(interaction);
      return;
    }
  }

  private async handleModalSubmit(interaction: ModalSubmitInteraction): Promise<void> {
    if (interaction.customId === 'modal_voice_rename') {
      await VoicePanelManager.handleVoiceModal(interaction);
      return;
    }

    if (interaction.customId === 'modal_create_lobby') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const member = interaction.member as GuildMember;
      const guild = interaction.guild;
      if (!member || !guild) return;

      const rawGame = interaction.fields.getTextInputValue('input_lobby_game').trim();
      const rawSlots = interaction.fields.getTextInputValue('input_lobby_slots').trim();
      const rawRank = interaction.fields.getTextInputValue('input_lobby_rank')?.trim();
      const rawNote = interaction.fields.getTextInputValue('input_lobby_note')?.trim();

      const parsedSlots = parseInt(rawSlots, 10);
      const neededSlots = isNaN(parsedSlots) || parsedSlots < 1 ? 1 : Math.min(9, parsedSlots);
      const targetSlots = neededSlots + 1; // Host + needed

      let gameKey = 'diger';
      const lower = rawGame.toLowerCase();
      if (lower.includes('valo')) gameKey = 'valorant';
      else if (lower.includes('cs') || lower.includes('counter')) gameKey = 'cs2';
      else if (lower.includes('lol') || lower.includes('league')) gameKey = 'lol';
      else if (lower.includes('gta') || lower.includes('fivem')) gameKey = 'gta';
      else if (lower.includes('mine')) gameKey = 'minecraft';
      else if (lower.includes('roblox')) gameKey = 'roblox';
      else if (lower.includes('tft')) gameKey = 'tft';

      let targetChannel = guild.channels.cache.find(
        (c) =>
          c.type === ChannelType.GuildText &&
          (c.name.includes('oyun-arkadasi-bul') || c.name.includes('lobi'))
      ) as TextChannel | undefined;

      if (!targetChannel) {
        if (interaction.channel && interaction.channel.type === ChannelType.GuildText) {
          targetChannel = interaction.channel as TextChannel;
        } else {
          await interaction.editReply({ content: '⚠️ Lobi kanalı bulunamadı!' });
          return;
        }
      }

      try {
        await GamerHubManager.createLobby({
          guild,
          channel: targetChannel,
          host: member,
          gameKey,
          customGameName: rawGame,
          targetSlots,
          rankReq: rawRank || undefined,
          note: rawNote || undefined,
        });

        await interaction.editReply({
          content: `🎉 **Lobiniz başarıyla oluşturuldu!** <#${targetChannel.id}> kanalında paylaşıldı.`,
        });
      } catch (err: any) {
        await interaction.editReply({
          content: `❌ Lobi oluşturulamadı: ${err.message}`,
        });
      }
      return;
    }

    if (interaction.customId.startsWith('modal_kayit_')) {
      // 1. ANINDA DEFER ET - 3 Saniyelik 'Zaman Aşımı' / 'Uygulama Yanıt Vermedi' Hatasını Tamamen Engelle!
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const isMale = interaction.customId === 'modal_kayit_erkek' || interaction.customId === 'modal_kayit_male';
      const isEnglish = interaction.customId.includes('male') || interaction.customId.includes('female');
      const isim = interaction.fields.getTextInputValue('input_isim').trim();
      const yas = interaction.fields.getTextInputValue('input_yas').trim();
      const member = interaction.member as GuildMember;
      const guild = interaction.guild;
      if (!member || !guild) return;

      // ══════════════════════════════════════════════════════
      // 🛡️ İSİM & YAŞ GERÇEKLİK VE GÜVENLİK DOĞRULAMASI
      // ══════════════════════════════════════════════════════
      const validation = this.validateNameAndAge(isim, yas);
      if (!validation.valid) {
        await interaction.editReply({
          content: `⚠️ **Kayıt Formu Reddedildi!**\n\n${validation.error}\n\n> *Lütfen **#cinsiyet-secimi** kanalındaki butona tekrar basarak gerçek bilgilerinizi giriniz.*`,
        });
        return;
      }

      const validIsim = validation.cleanName;
      const validYas = validation.cleanAge || '';

      // Update nickname: ☊ sembolü ile (örn: ☊ Eren | 19 veya ☊ Eren)
      const formattedNick = `☊ ${validIsim}${validYas ? ' | ' + validYas : ''}`.slice(0, 32);

      // Rolleri güncel API'den fetch ederek kesin olarak bul
      const roles = await guild.roles.fetch();
      const maleRole = roles.find((r: any) => r.name.toLowerCase() === 'erkek' || r.name.includes('Erkek'));
      const femaleRole = roles.find((r: any) => r.name.toLowerCase() === 'kız' || r.name.includes('Kız'));
      const memberRole = roles.find((r: any) => r.name.toLowerCase() === 'üye' || (r.name.includes('Üye') && !r.name.includes('Onaylı')));
      const approvedRole = roles.find((r: any) => r.name.toLowerCase() === 'onaylı' || r.name.includes('Onaylı'));

      const targetGenderRole = isMale ? maleRole : femaleRole;
      const rolesToAdd = [targetGenderRole, memberRole, approvedRole].filter(Boolean) as any[];

      // Üyenin güncel profilini çek ve bekleyen TÜM rolleri eksiksiz temizle
      const freshMember = await guild.members.fetch(member.id).catch(() => member);

      const waitingRoles = roles.filter(
        (r: any) =>
          r.name.toLowerCase().includes('bekleyen') ||
          r.name.toLowerCase().includes('kayıtsız') ||
          r.name.toLowerCase().includes('cinsiyet bekleyen') ||
          r.name.toLowerCase().includes('kayıt bekleyen')
      );

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

      // Premium kayıt başarı embed'i
      const successEmbeds = LanguageGateManager.buildRegistrationSuccessEmbed(
        member, validIsim, validYas, isMale, isEnglish,
        { name: guild.name, memberCount: guild.memberCount, iconURL: (opts?: any) => guild.iconURL(opts) }
      );
      await interaction.editReply({ embeds: successEmbeds });

      // Send log to #kayit-log asynchronously without blocking
      const logChannel = guild.channels.cache.find(
        (c: any) => c.name.includes('kayit-log') && c.isTextBased()
      ) as TextChannel | undefined;

      if (logChannel) {
        const logEmbed = LanguageGateManager.buildRegistrationLogEmbed(
          member, validIsim, validYas, isMale, isEnglish,
          { name: guild.name, memberCount: guild.memberCount }
        );
        logChannel.send({ embeds: [logEmbed] }).catch(() => {});
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 🛡️ İSİM & YAŞ GERÇEKLİK VE GÜVENLİK FİLTRESİ
  // ═══════════════════════════════════════════════════════════
  private validateNameAndAge(
    rawName: string,
    rawAge: string
  ): { valid: boolean; error?: string; cleanName: string; cleanAge?: string } {
    const clean = rawName.trim().replace(/\s+/g, ' ');

    // 1. İsim Uzunluğu Kontrolü (2 - 16 karakter)
    if (clean.length < 2) {
      return { valid: false, cleanName: clean, error: '❌ **İsim çok kısa!** İsminiz en az **2 harf** olmalıdır.' };
    }
    if (clean.length > 16) {
      return { valid: false, cleanName: clean, error: '❌ **İsim çok uzun!** İsminiz en fazla **16 karakter** olabilir.' };
    }

    // 2. Sadece Türkçe ve Latin harfler + en fazla 1 boşluk (İki isim için, örn: "Ali Can")
    // Rakamlar, özel semboller, noktalama işaretleri kesinlikle yasak!
    const nameRegex = /^[a-zA-ZçÇğĞıİöÖşŞüÜ]+(?:\s[a-zA-ZçÇğĞıİöÖşŞüÜ]+)?$/;
    if (!nameRegex.test(clean)) {
      return {
        valid: false,
        cleanName: clean,
        error: '❌ **Geçersiz karakter tespit edildi!** İsminiz sadece harflerden oluşmalıdır. Rakam, emoji veya özel sembol (`!@#$%^&*` vb.) içeremez.',
      };
    }

    // 3. Harf Tekrarı Spamı (Örn: "aaaaa", "Ereeeeen", "zzzzzz")
    if (/(.)\1{2,}/i.test(clean)) {
      return {
        valid: false,
        cleanName: clean,
        error: '❌ **Anlamsız harf tekrarı!** İsminizde aynı harf arka arkaya 3 veya daha fazla kez tekrar edemez.',
      };
    }

    // 4. Troll ve Anlamsız Kelime / Tuş Spamı Kontrolü
    const lower = clean.toLowerCase();
    const trollBlacklist = [
      'asdasd', 'qweqwe', 'sjksjk', 'zaaaxd', 'admin', 'mod', 'moderator',
      'kurucu', 'owner', 'everyone', 'here', 'discord', 'sahip', 'bot',
      'allah', 'tanrı', 'peygamber', 'orospu', 'pic', 'yarrak', 'amk', 'aq',
      'sik', 'sikik', 'got', 'meme', 'tasak', 'yarak', 'kahpe', 'kasar'
    ];

    if (trollBlacklist.some((bad) => lower.includes(bad))) {
      return {
        valid: false,
        cleanName: clean,
        error: '❌ **Uygunsuz veya kural dışı isim!** Lütfen gerçek adınızı yazınız.',
      };
    }

    // 5. Küfür ve Hakaret Kontrolü (AutoSecurityGuard entegre)
    if (AutoSecurityGuard.isProfane(clean)) {
      return {
        valid: false,
        cleanName: clean,
        error: '❌ **Uygunsuz kelime!** İsminiz küfür, hakaret veya argo içeremez.',
      };
    }

    // İsmi Şık Bir Şekilde Baş Harfleri Büyük Yap (Örn: "eReN" -> "Eren", "aLi cAn" -> "Ali Can")
    const formattedName = clean
      .split(' ')
      .map((part) => part.charAt(0).toLocaleUpperCase('tr-TR') + part.slice(1).toLocaleLowerCase('tr-TR'))
      .join(' ');

    // 6. Yaş Kontrolü (Eğer girildiyse)
    let cleanAge: string | undefined = undefined;
    if (rawAge && rawAge.trim().length > 0) {
      const ageTrimmed = rawAge.trim();

      // Sadece rakam olmalı
      if (!/^\d+$/.test(ageTrimmed)) {
        return {
          valid: false,
          cleanName: formattedName,
          error: '❌ **Geçersiz yaş biçimi!** Yaş kutucuğuna sadece rakam yazınız (örneğin: `19`).',
        };
      }

      const ageNum = parseInt(ageTrimmed, 10);
      // Gerçekçi Discord yaş aralığı: 13 - 50
      if (isNaN(ageNum) || ageNum < 13 || ageNum > 50) {
        return {
          valid: false,
          cleanName: formattedName,
          error: `❌ **Gerçek dışı yaş (${ageNum})!** Lütfen gerçekçi bir yaş giriniz (**13 ile 50 arası**).`,
        };
      }

      cleanAge = String(ageNum);
    }

    return {
      valid: true,
      cleanName: formattedName,
      cleanAge,
    };
  }
}
