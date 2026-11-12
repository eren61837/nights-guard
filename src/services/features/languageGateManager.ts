import {
  Guild,
  Client,
  ChannelType,
  PermissionFlagsBits,
  TextChannel,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Role,
  CategoryChannel,
} from 'discord.js';

// ═══════════════════════════════════════════════════════════════
// 🌙 NIGHTS GUARD • STEP-BY-STEP PROGRESSIVE REGISTRATION ENGINE
// ═══════════════════════════════════════════════════════════════

// Estetik Gece & Anime Animasyonları (Embed içine entegre)
const ANIMATIONS = {
  // Büyüleyici Anime Gece Gökyüzü & Kayan Yıldızlar
  animeNightStars: 'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZqOHo0bTJ5eWpkaWZ1Z29reTFrMmtnOGUza2Q1bDJqZ214NnB3dyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/L1R1tvI9svkIWwpVYr/giphy.gif',
  // Neon Siber Akış
  cyberFlow:       'https://media.giphy.com/media/26tn3334mvoVClhos/giphy.gif',
  // Anime Gece Penceresi / Chill Lo-Fi
  animeNightChill: 'https://media.giphy.com/media/EPfV3ijMQVl60/giphy.gif',
};

export class LanguageGateManager {
  private static ran = false;

  public static async init(client: Client): Promise<void> {
    if (this.ran) return;
    this.ran = true;

    for (const [_, guild] of client.guilds.cache) {
      try {
        await this.ensureRegistrationChannels(guild);
      } catch (err: any) {
        console.error(`[RegistrationManager] ${guild.name} kurulum hatası:`, err.message);
      }
    }
  }

  public static async ensureRoles(guild: Guild): Promise<{
    onayliRole?: Role;
    uyeRole?: Role;
    erkekRole?: Role;
    kizRole?: Role;
    waitingRole?: Role;
  }> {
    const roles = await guild.roles.fetch();

    const onayliRole = roles.find((r) => r.name === 'Onaylı' || r.name.includes('Onaylı'));
    const uyeRole = roles.find((r) => r.name === 'Üye' || (r.name.includes('Üye') && !r.name.includes('Onaylı')));
    const erkekRole = roles.find((r) => r.name === 'Erkek');
    const kizRole = roles.find((r) => r.name === 'Kız');

    let waitingRole = roles.find((r) => r.name.includes('Kayıt Bekleyen') || r.name.includes('Cinsiyet Bekleyen'));
    if (!waitingRole) {
      waitingRole = await guild.roles.create({
        name: '⏳ Kayıt Bekleyen',
        color: 0x64748b,
        hoist: false,
        reason: 'Nights Guard • Kayıt Süreci Ara Rolü',
      });
      console.log(`[RegistrationManager] '⏳ Kayıt Bekleyen' rolü oluşturuldu.`);
    }

    return { onayliRole, uyeRole, erkekRole, kizRole, waitingRole };
  }

  public static async ensureLanguageGate(guild: Guild): Promise<void> {
    await this.ensureRegistrationChannels(guild);
  }

  public static async ensureRegistrationChannels(guild: Guild): Promise<void> {
    const { onayliRole, uyeRole, erkekRole, kizRole, waitingRole } = await this.ensureRoles(guild);
    const everyoneRole = guild.roles.everyone;

    // 1. Eski gereksiz dil kanallarını temizle / sil (Kullanıcı dil seçimi istemiyor)
    const oldChannelsToDelete = guild.channels.cache.filter(
      (c) => c && (c.name.includes('dil-secimi') || c.name.includes('registration') || c.name.includes('register-en'))
    );
    for (const [, oldCh] of oldChannelsToDelete) {
      console.log(`[RegistrationManager] Eski kanal kaldırılıyor: #${oldCh.name}`);
      await oldCh.delete('Dil seçimi kaldırıldı, eski kayıt sistemine geçildi').catch(() => {});
    }

    // 2. Kategori: 🚪 ┃ GİRİŞ & KAYIT
    let category = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildCategory && (c.name.includes('GİRİŞ & KAYIT') || c.name.includes('GİRİŞ'))
    ) as CategoryChannel | undefined;

    if (!category) {
      category = await guild.channels.create({
        name: '🚪 ┃ GİRİŞ & KAYIT',
        type: ChannelType.GuildCategory,
        position: 0,
      });
    }

    // ═══ ADIM 1: 🛡️・kayit-onay (SADECE @everyone GÖRÜR) ═══
    let kayitChannel = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildText && c.name.includes('kayit-onay')
    ) as TextChannel | undefined;

    if (!kayitChannel) {
      kayitChannel = await guild.channels.create({
        name: '🛡️・kayit-onay',
        type: ChannelType.GuildText,
        parent: category.id,
        position: 0,
        topic: '🛡️ Sunucuya kayıt olmak için butona tıklayınız. / Click the button to register.',
      });
    } else {
      await kayitChannel.setParent(category.id).catch(() => {});
      await kayitChannel.setPosition(0).catch(() => {});
    }

    // İZİNLER: @everyone görür, ama butona basıp Kayıt Bekleyen alan veya Kaydolanlar ASLA GÖREMEZ!
    await kayitChannel.permissionOverwrites.set([
      {
        id: everyoneRole.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
        deny: [
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.AddReactions,
          PermissionFlagsBits.CreatePublicThreads,
          PermissionFlagsBits.CreatePrivateThreads,
        ],
      },
      ...(waitingRole ? [{ id: waitingRole.id, deny: [PermissionFlagsBits.ViewChannel] }] : []),
      ...(onayliRole ? [{ id: onayliRole.id, deny: [PermissionFlagsBits.ViewChannel] }] : []),
      ...(uyeRole ? [{ id: uyeRole.id, deny: [PermissionFlagsBits.ViewChannel] }] : []),
      ...(erkekRole ? [{ id: erkekRole.id, deny: [PermissionFlagsBits.ViewChannel] }] : []),
      ...(kizRole ? [{ id: kizRole.id, deny: [PermissionFlagsBits.ViewChannel] }] : []),
    ]);

    // ═══ ADIM 2: 🚻・cinsiyet-secimi (SADECE 'Kayıt Bekleyen' GÖRÜR) ═══
    let cinsiyetChannel = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildText && c.name.includes('cinsiyet-secimi')
    ) as TextChannel | undefined;

    if (!cinsiyetChannel) {
      cinsiyetChannel = await guild.channels.create({
        name: '🚻・cinsiyet-secimi',
        type: ChannelType.GuildText,
        parent: category.id,
        position: 1,
        topic: '🚻 Cinsiyet rolünüzü seçerek kaydınızı tamamlayınız. / Choose your gender to register.',
      });
    } else {
      await cinsiyetChannel.setParent(category.id).catch(() => {});
      await cinsiyetChannel.setPosition(1).catch(() => {});
    }

    // İZİNLER: @everyone ve Kayıtlılar ASLA GÖREMEZ! YALNIZCA Kayıt Bekleyen görür!
    await cinsiyetChannel.permissionOverwrites.set([
      {
        id: everyoneRole.id,
        deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
      },
      ...(waitingRole
        ? [
            {
              id: waitingRole.id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
              deny: [
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.AddReactions,
                PermissionFlagsBits.CreatePublicThreads,
                PermissionFlagsBits.CreatePrivateThreads,
              ],
            },
          ]
        : []),
      ...(onayliRole ? [{ id: onayliRole.id, deny: [PermissionFlagsBits.ViewChannel] }] : []),
      ...(uyeRole ? [{ id: uyeRole.id, deny: [PermissionFlagsBits.ViewChannel] }] : []),
      ...(erkekRole ? [{ id: erkekRole.id, deny: [PermissionFlagsBits.ViewChannel] }] : []),
      ...(kizRole ? [{ id: kizRole.id, deny: [PermissionFlagsBits.ViewChannel] }] : []),
    ]);

    // ═══ SERVER-WIDE ISOLATION LOCK (Kayıtsızlar diğer sunucu kanallarını göremez) ═══
    await this.applyServerWideIsolationLock(guild, kayitChannel.id, category.id);

    // ═══ PANELLERİ GÖNDER ═══
    await this.sendKayitOnayPanel(kayitChannel);
    await this.sendCinsiyetSecimiPanel(cinsiyetChannel);
  }

  public static async applyServerWideIsolationLock(
    guild: Guild,
    allowedKayitChannelId: string,
    allowedCategoryId: string
  ): Promise<void> {
    const channels = await guild.channels.fetch();
    const everyoneRole = guild.roles.everyone;
    const roles = await guild.roles.fetch();
    const onayliRole = roles.find((r) => r.name === 'Onaylı' || r.name.includes('Onaylı'));

    for (const [, ch] of channels) {
      if (!ch) continue;
      if (ch.id === allowedKayitChannelId || ch.id === allowedCategoryId) continue;

      const currentOverwrites = ch.permissionOverwrites.cache.get(everyoneRole.id);
      const isEveryoneAllowed = currentOverwrites?.allow.has(PermissionFlagsBits.ViewChannel);

      if (isEveryoneAllowed || currentOverwrites?.deny.has(PermissionFlagsBits.ViewChannel) === false) {
        try {
          await ch.permissionOverwrites.edit(everyoneRole.id, { ViewChannel: false, SendMessages: false });
          if (
            onayliRole &&
            !ch.name.includes('kayit-onay') &&
            !ch.name.includes('cinsiyet-secimi') &&
            !ch.name.includes('yetkili') &&
            !ch.name.includes('log')
          ) {
            await ch.permissionOverwrites.edit(onayliRole.id, { ViewChannel: true });
          }
        } catch (err: any) {
          console.warn(`[RegistrationManager] ${ch.name} kilitlenirken hata:`, err.message);
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 🛡️ ADIM 1: KAYIT ONAY PANELİ (Bilingual: TR & EN)
  // ═══════════════════════════════════════════════════════════
  public static async sendKayitOnayPanel(channel: TextChannel): Promise<void> {
    try {
      const messages = await channel.messages.fetch({ limit: 10 });
      const existingPanel = messages.find(
        (m) => m.author.id === channel.client.user?.id && m.embeds.length > 0
      );

      if (existingPanel) return;

      for (const [, msg] of messages) {
        if (msg.author.id === channel.client.user?.id) await msg.delete().catch(() => {});
      }

      const guild = channel.guild;
      const iconUrl = guild.iconURL({ size: 256 }) || undefined;

      const embed = new EmbedBuilder()
        .setColor(0x2ecc71) // Neon Zümrüt Yeşili
        .setAuthor({
          name: `${guild.name.toUpperCase()} • DOĞRULAMA SİSTEMİ / VERIFICATION`,
          iconURL: iconUrl,
        })
        .setTitle('🛡️  NIGHTS GÜVENLİK & KAYIT SİSTEMİ  ┃  REGISTRATION')
        .setDescription(
          `### 🌙 Topluluğumuza Hoş Geldiniz! / Welcome to Nights!\n` +
          `Sunucumuza erişim sağlamak ve bot hesapları engellemek amacıyla güvenli kayıt sistemimiz devrededir.\n\n` +
          `*To access the server and keep our community secure, our automated verification system is active.*\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `🇹🇷 **Nasıl Kayıt Olunur?**\n` +
          `> **1.** Aşağıdaki **"🛡️ Kayıt Ol & Doğrula"** butonuna tıklayınız.\n` +
          `> **2.** Açılacak **#cinsiyet-secimi** kanalından cinsiyetinizi seçiniz.\n` +
          `> **3.** İsminizi ve yaşınızı belirterek kaydınızı tamamlayınız!\n\n` +
          `🇬🇧 **How to Register?**\n` +
          `> **1.** Click the **"🛡️ Kayıt Ol & Doğrula / Register"** button below.\n` +
          `> **2.** Proceed to the newly opened **#cinsiyet-secimi** channel.\n` +
          `> **3.** Select your gender and enter your name to unlock the server!\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `🔒 *Her adımı tamamladığınızda bir önceki kanal otomatik olarak sizden gizlenecektir.*\n` +
          `*Previous channels will automatically disappear as you progress through each step.*`
        )
        .setThumbnail(iconUrl || null)
        .setImage(ANIMATIONS.animeNightStars) // Büyüleyici Anime Gece Gökyüzü Animasyonu
        .setFooter({
          text: 'Nights Guard • 7/24 Auto Verification • Made by erencix',
          iconURL: channel.client.user?.displayAvatarURL(),
        })
        .setTimestamp();

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('btn_kayit_basla')
          .setLabel('Kayıt Ol & Doğrula / Register')
          .setEmoji('🛡️')
          .setStyle(ButtonStyle.Success)
      );

      await channel.send({ embeds: [embed], components: [row] });
      console.log(`[RegistrationManager] Tek parça lüks Kayıt Onay paneli '#${channel.name}' kanalına yüklendi.`);
    } catch (err: any) {
      console.error(`[RegistrationManager] Kayıt Onay paneli hatası:`, err.message);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 🚻 ADIM 2: CİNSİYET SEÇİMİ PANELİ (Bilingual: TR & EN)
  // ═══════════════════════════════════════════════════════════
  public static async sendCinsiyetSecimiPanel(channel: TextChannel): Promise<void> {
    try {
      const messages = await channel.messages.fetch({ limit: 10 });
      const existingPanel = messages.find(
        (m) => m.author.id === channel.client.user?.id && m.embeds.length > 0
      );

      if (existingPanel) return;

      for (const [, msg] of messages) {
        if (msg.author.id === channel.client.user?.id) await msg.delete().catch(() => {});
      }

      const guild = channel.guild;
      const iconUrl = guild.iconURL({ size: 256 }) || undefined;

      const embed = new EmbedBuilder()
        .setColor(0x9b59b6) // Asil Mor / Cyber Amethyst
        .setAuthor({
          name: `${guild.name.toUpperCase()} • 2. ADIM: CİNSİYET SEÇİMİ / STEP 2`,
          iconURL: iconUrl,
        })
        .setTitle('🚻  CİNSİYET ROLÜ SEÇİMİ  ┃  GENDER SELECTION')
        .setDescription(
          `### 🌙 Profilinizi Belirleyin! / Choose Your Role!\n` +
          `Sunucudaki profil unvanınızı ve renginizi belirlemek için aşağıdaki butonlardan cinsiyetinizi seçiniz.\n\n` +
          `*Please choose your gender below to receive your profile color and nickname role.*\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `👦 **Erkek / Male:**\n` +
          `> Mavi profil rengi ve **Erkek** unvanı tanımlanır.\n` +
          `> *Blue profile color and Male role assigned.*\n\n` +
          `👧 **Kız / Female:**\n` +
          `> Pembe profil rengi ve **Kız** unvanı tanımlanır.\n` +
          `> *Pink profile color and Female role assigned.*\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `📝 *Butona bastığınızda isim ve yaşınızı gireceğiniz pencere açılacaktır.*\n` +
          `*Clicking a button opens the form to enter your name and age.*`
        )
        .setThumbnail(iconUrl || null)
        .setImage(ANIMATIONS.cyberFlow) // Entegre siber neon akış animasyonu
        .setFooter({
          text: 'Nights Guard • Gender Role & Verification • Made by erencix',
          iconURL: channel.client.user?.displayAvatarURL(),
        })
        .setTimestamp();

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('btn_cinsiyet_erkek')
          .setLabel('Erkek / Male')
          .setEmoji('👦')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('btn_cinsiyet_kiz')
          .setLabel('Kız / Female')
          .setEmoji('👧')
          .setStyle(ButtonStyle.Danger)
      );

      await channel.send({ embeds: [embed], components: [row] });
      console.log(`[RegistrationManager] Tek parça lüks Cinsiyet paneli '#${channel.name}' kanalına yüklendi.`);
    } catch (err: any) {
      console.error(`[RegistrationManager] Cinsiyet paneli hatası:`, err.message);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 🎉 ANİME GECE KUTLAMA EMBEDİ (Kullanıcıya Özel Ephemeral)
  // ═══════════════════════════════════════════════════════════
  public static buildRegistrationSuccessEmbed(
    member: { id: string; user: { tag: string; displayAvatarURL: (opts?: any) => string } },
    isim: string,
    yas: string,
    isMale: boolean,
    _isEnglish: boolean,
    guild: { name: string; memberCount: number; iconURL: (opts?: any) => string | null }
  ): EmbedBuilder[] {
    const formattedNick = `☊ ${isim}${yas ? ' | ' + yas : ''}`;
    const genderIcon = isMale ? '👦' : '👧';
    const genderText = isMale ? 'Erkek / Male' : 'Kız / Female';
    const genderColor = isMale ? 0x3b82f6 : 0xec4899;

    const successEmbed = new EmbedBuilder()
      .setColor(genderColor)
      .setTitle('🌙  AİLEMİZE HOŞ GELDİN!  ┃  WELCOME TO NIGHTS!')
      .setDescription(
        `### 👑 Tebrikler, **${isim}**!\n` +
        `Kayıt işleminiz başarıyla tamamlandı ve tüm sunucunun kilidi açıldı.\n` +
        `*Your verification is complete and all server channels are now unlocked!*\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `> 👤 **Yeni İsminiz / Nickname:** \`${formattedNick}\`\n` +
        `> ${genderIcon} **Cinsiyet / Gender:** **${genderText}**\n` +
        `> 🏆 **Üye Sırası / Member Order:** \`#${guild.memberCount}\`\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `✨ *Hemen **#genel-sohbet** kanalına geçerek topluluğumuzla tanışabilirsin!*\n` +
        `*Feel free to say hi in **#genel-sohbet** and meet the community!* 🚀`
      )
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .setImage(ANIMATIONS.animeNightStars) // Büyüleyici Anime Gece Kayan Yıldızlar
      .setFooter({ text: 'Nights Guard • Registration Complete • Made by erencix' })
      .setTimestamp();

    return [successEmbed];
  }

  // ═══════════════════════════════════════════════════════════
  // 📋 YETKİLİ LOG EMBEDİ (#kayit-log İçin)
  // ═══════════════════════════════════════════════════════════
  public static buildRegistrationLogEmbed(
    member: { id: string; user: { tag: string; displayAvatarURL: (opts?: any) => string } },
    isim: string,
    yas: string,
    isMale: boolean,
    _isEnglish: boolean,
    guild: { name: string; memberCount: number }
  ): EmbedBuilder {
    const formattedNick = `☊ ${isim}${yas ? ' | ' + yas : ''}`;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    return new EmbedBuilder()
      .setTitle(`📥 Yeni Kayıt Onaylandı • #${guild.memberCount}`)
      .setColor(isMale ? 0x3b82f6 : 0xec4899)
      .addFields(
        { name: '👤 Üye', value: `<@${member.id}>\n\`${member.user.tag}\``, inline: true },
        { name: `${isMale ? '👦' : '👧'} Cinsiyet`, value: isMale ? '**Erkek / Male**' : '**Kız / Female**', inline: true },
        { name: '📝 Yeni İsim', value: `\`${formattedNick}\``, inline: true },
        { name: '⏰ Kayıt Saati', value: `\`${timeStr}\``, inline: true },
        { name: '📊 Toplam Üye', value: `**${guild.memberCount}**`, inline: true }
      )
      .setThumbnail(member.user.displayAvatarURL({ size: 128 }))
      .setFooter({ text: 'Nights Guard • Kayıt Log Motoru' })
      .setTimestamp();
  }

  // Geriye uyumluluk için dummy
  public static buildLanguageSelectedEmbed(_isTr: boolean, _ch: string): EmbedBuilder {
    return new EmbedBuilder().setTitle('OK');
  }
}
