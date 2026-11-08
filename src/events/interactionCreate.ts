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
      // Kayıt, Etkinlik (Click Me), Müzik (buton & /cal komutları), Ses Paneli ve Destek (Ticket) tüm üyelere açıktır:
      const isPublicInteraction =
        (interaction.isButton() && (
          interaction.customId === 'btn_kayit_basla' ||
          interaction.customId.startsWith('btn_cinsiyet_') ||
          interaction.customId === 'btn_event_click' ||
          interaction.customId.startsWith('btn_voice_') ||
          interaction.customId.startsWith('marry_') ||
          interaction.customId.startsWith('confess_') ||
          interaction.customId.startsWith('btn_music_') ||
          interaction.customId === 'ticket_open' ||
          interaction.customId === 'ticket_close'
        )) ||
        (interaction.isModalSubmit() && (interaction.customId.startsWith('modal_kayit_') || interaction.customId === 'modal_voice_rename')) ||
        (interaction.isChatInputCommand() && [
          'rank', 'seviye', 'top', 'liderlik', 'yardim', 'avatar', 'sunucu', 'afk', 'sil',
          'istatistik', 'kullanici', 'gonder', 'itiraf', 'cal', 'durdur', 'devam', 'gec', 'kuyruk', 'ayril', 'ses'
        ].includes(interaction.commandName));

      if (!isPublicInteraction) {
        const ownerId = config.ownerId || process.env.OWNER_ID || '1138498666785677492';
        const isServerAdmin = (interaction.member as GuildMember)?.permissions?.has(PermissionFlagsBits.Administrator);
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
      default:
        await interaction.reply({ content: 'Bilinmeyen komut.', ephemeral: true });
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

    // 2. Build Confirm
    if (customId.startsWith('build_confirm:')) {
      const cacheId = customId.split(':')[1];
      const pending = BlueprintCache.get(cacheId);

      if (!pending) {
        await interaction.reply({
          content: '⚠️ Bu kurulum oturumunun süresi dolmuş veya iptal edilmiş. Lütfen `/kur` ile yeniden deneyin.',
          ephemeral: true,
        });
        return;
      }

      if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        await interaction.reply({
          content: '❌ Sadece yöneticiler kurulumu başlatabilir.',
          ephemeral: true,
        });
        return;
      }

      // Check Bot Diagnostics (Permissions & Role Hierarchy)
      const diagnostics = ServerDiagnostics.check(interaction.guild);
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
        await interaction.reply({ content: 'Logo verisi bulunamadı veya süresi doldu.', ephemeral: true });
        return;
      }

      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
        await interaction.reply({ content: '❌ Sunucuyu Yönet yetkiniz yok.', ephemeral: true });
        return;
      }

      await interaction.deferReply({ ephemeral: true });
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

    // 8. Registration Step 1: Kayıt Ol & Onay Al
    if (customId === 'btn_kayit_basla') {
      await interaction.deferReply({ ephemeral: true });
      const member = interaction.member as GuildMember;
      if (!member || !interaction.guild) return;

      const roles = await interaction.guild.roles.fetch();
      const waitingRole = roles.find(
        (r: any) => r.name.includes('Cinsiyet Bekleyen') || r.name.includes('Kayıt Bekleyen')
      );
      if (waitingRole) {
        await member.roles.add(waitingRole).catch(() => {});
      }

      await interaction.editReply({
        content: '✅ **İlk doğrulama adımınız tamamlandı!**\nŞimdi size özel olarak açılan **#cinsiyet-secimi** kanalına geçerek cinsiyetinizi seçiniz.',
      });
      return;
    }

    // 9. Registration Step 2: Cinsiyet Seçimi (Erkek / Kız) -> Modal Açılır
    if (customId === 'btn_cinsiyet_erkek' || customId === 'btn_cinsiyet_kiz') {
      const isMale = customId === 'btn_cinsiyet_erkek';
      const modal = new ModalBuilder()
        .setCustomId(isMale ? 'modal_kayit_erkek' : 'modal_kayit_kiz')
        .setTitle(`📝 Nights Kayıt (${isMale ? 'Erkek' : 'Kız'})`);

      const nameInput = new TextInputBuilder()
        .setCustomId('input_isim')
        .setLabel('İsminiz')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Örn: Eren')
        .setRequired(true)
        .setMaxLength(20);

      const ageInput = new TextInputBuilder()
        .setCustomId('input_yas')
        .setLabel('Yaşınız (İsteğe bağlı)')
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
          ephemeral: true,
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

    if (interaction.customId.startsWith('modal_kayit_')) {
      // 1. ANINDA DEFER ET - 3 Saniyelik 'Zaman Aşımı' / 'Uygulama Yanıt Vermedi' Hatasını Tamamen Engelle!
      await interaction.deferReply({ ephemeral: true });

      const isMale = interaction.customId === 'modal_kayit_erkek';
      const isim = interaction.fields.getTextInputValue('input_isim').trim();
      const yas = interaction.fields.getTextInputValue('input_yas').trim();
      const member = interaction.member as GuildMember;
      const guild = interaction.guild;
      if (!member || !guild) return;

      // Update nickname: ☊ sembolü ile (örn: ☊ Eren | 19 veya ☊ Eren)
      const formattedNick = `☊ ${isim}${yas ? ' | ' + yas : ''}`.slice(0, 32);

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

      await interaction.editReply({
        content: `🎉 **Tebrikler ${isim}! Kaydınız başarıyla tamamlandı.**\nArtık kayıt odaları sizden gizlendi ve tüm sohbet, medya ve oyun odalarına erişebilirsiniz! Aramıza hoş geldin!`,
      });

      // Send log to #kayit-log asynchronously without blocking
      const logChannel = guild.channels.cache.find(
        (c: any) => c.name.includes('kayit-log') && c.isTextBased()
      ) as TextChannel | undefined;

      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setTitle('📥 Yeni Üye Kaydı Tamamlandı')
          .setColor(isMale ? '#3498DB' : '#E91E63')
          .addFields(
            { name: '👤 Üye', value: `<@${member.id}> (\`${member.user.tag}\`)`, inline: true },
            { name: '🚻 Cinsiyet', value: isMale ? '👦 Erkek' : '👧 Kız', inline: true },
            { name: '📝 Yeni İsim', value: `\`${formattedNick}\``, inline: true }
          )
          .setThumbnail(member.user.displayAvatarURL())
          .setFooter({ text: 'Nights Guard • Kayıt Sistemi' })
          .setTimestamp();

        logChannel.send({ embeds: [logEmbed] }).catch(() => {});
      }
    }
  }
}
