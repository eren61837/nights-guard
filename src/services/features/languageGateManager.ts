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
// 🌙 NIGHTS GUARD • ULTIMATE PREMIUM REGISTRATION & LANGUAGE GATE
// ═══════════════════════════════════════════════════════════════

// Akıcı, 60fps neon Discord animasyonları (Embed içine entegre)
const ANIMATIONS = {
  portal:    'https://media.giphy.com/media/26tn3334mvoVClhos/giphy.gif', // Neon mor siber portal
  wave:      'https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif', // Neon mavi dalga akışı
  flow:      'https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif', // Mor siber enerji akışı
  celebrate: 'https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif', // Yeşil zafer / onay patlaması
};

export class LanguageGateManager {
  private static ran = false;

  public static async init(client: Client): Promise<void> {
    if (this.ran) return;
    this.ran = true;

    for (const [_, guild] of client.guilds.cache) {
      try {
        await this.ensureLanguageGate(guild);
      } catch (err: any) {
        console.error(`[LanguageGateManager] ${guild.name} kurulum hatası:`, err.message);
      }
    }
  }

  public static async ensureRoles(guild: Guild): Promise<{
    trRole: Role;
    enRole: Role;
    onayliRole?: Role;
    uyeRole?: Role;
    erkekRole?: Role;
    kizRole?: Role;
    waitingRole?: Role;
  }> {
    const roles = await guild.roles.fetch();

    let trRole = roles.find((r) => r.name === '🇹🇷・Türkçe' || r.name === 'Türkçe');
    if (!trRole) {
      trRole = await guild.roles.create({
        name: '🇹🇷・Türkçe',
        color: 0x3b82f6,
        reason: 'Nights Guard • Dil Seçim Rolü',
      });
      console.log(`[LanguageGateManager] '🇹🇷・Türkçe' rolü oluşturuldu (${trRole.id})`);
    }

    let enRole = roles.find((r) => r.name === '🇬🇧・English' || r.name === 'English');
    if (!enRole) {
      enRole = await guild.roles.create({
        name: '🇬🇧・English',
        color: 0xa855f7,
        reason: 'Nights Guard • Language Role',
      });
      console.log(`[LanguageGateManager] '🇬🇧・English' rolü oluşturuldu (${enRole.id})`);
    }

    const onayliRole = roles.find((r) => r.name === 'Onaylı' || r.name.includes('Onaylı'));
    const uyeRole = roles.find((r) => r.name === 'Üye' || r.name.includes('Üye'));
    const erkekRole = roles.find((r) => r.name === 'Erkek');
    const kizRole = roles.find((r) => r.name === 'Kız');
    const waitingRole = roles.find((r) => r.name.includes('Kayıt Bekleyen') || r.name.includes('Cinsiyet Bekleyen'));

    return { trRole, enRole, onayliRole, uyeRole, erkekRole, kizRole, waitingRole };
  }

  public static async ensureLanguageGate(guild: Guild): Promise<void> {
    const { trRole, enRole, onayliRole, uyeRole, waitingRole } = await this.ensureRoles(guild);
    const everyoneRole = guild.roles.everyone;

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

    // ═══ 1. 🌐・dil-secimi ═══
    let langChannel = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildText && (c.name.includes('dil-secimi') || c.name.includes('language-select'))
    ) as TextChannel | undefined;

    if (!langChannel) {
      langChannel = await guild.channels.create({
        name: '🌐・dil-secimi',
        type: ChannelType.GuildText,
        parent: category.id,
        position: 0,
        topic: '🌐 Sunucuya giriş yapmak için dilinizi seçiniz / Select your language to enter.',
      });
      console.log(`[LanguageGateManager] '🌐・dil-secimi' kanalı oluşturuldu.`);
    }

    await langChannel.permissionOverwrites.edit(everyoneRole.id, {
      ViewChannel: true,
      SendMessages: false,
      ReadMessageHistory: true,
      AddReactions: false,
      CreatePublicThreads: false,
      CreatePrivateThreads: false,
    });

    if (onayliRole) {
      await langChannel.permissionOverwrites.edit(onayliRole.id, { ViewChannel: false });
    }
    if (uyeRole) {
      await langChannel.permissionOverwrites.edit(uyeRole.id, { ViewChannel: false });
    }

    // ═══ 2. 🛡️・kayit-onay (Türkçe) ═══
    let kayitChannel = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildText && c.name.includes('kayit-onay')
    ) as TextChannel | undefined;

    if (kayitChannel) {
      await kayitChannel.setParent(category.id).catch(() => {});
      await kayitChannel.setPosition(1).catch(() => {});
      await kayitChannel.permissionOverwrites.edit(everyoneRole.id, { ViewChannel: false, SendMessages: false });
      await kayitChannel.permissionOverwrites.edit(trRole.id, { ViewChannel: true, SendMessages: false, ReadMessageHistory: true });
      await kayitChannel.permissionOverwrites.edit(enRole.id, { ViewChannel: false });
      if (onayliRole) await kayitChannel.permissionOverwrites.edit(onayliRole.id, { ViewChannel: false });
      if (uyeRole) await kayitChannel.permissionOverwrites.edit(uyeRole.id, { ViewChannel: false });
    }

    // ═══ 3. 🛡️・registration (English) ═══
    let regChannel = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildText && (c.name.includes('registration') || c.name.includes('register-en'))
    ) as TextChannel | undefined;

    if (!regChannel) {
      regChannel = await guild.channels.create({
        name: '🛡️・registration',
        type: ChannelType.GuildText,
        parent: category.id,
        position: 2,
        topic: '🛡️ Complete your registration to access Nights server.',
      });
      console.log(`[LanguageGateManager] '🛡️・registration' İngilizce kayıt odası oluşturuldu.`);
    } else {
      await regChannel.setParent(category.id).catch(() => {});
      await regChannel.setPosition(2).catch(() => {});
    }

    await regChannel.permissionOverwrites.edit(everyoneRole.id, { ViewChannel: false, SendMessages: false });
    await regChannel.permissionOverwrites.edit(enRole.id, { ViewChannel: true, SendMessages: false, ReadMessageHistory: true });
    await regChannel.permissionOverwrites.edit(trRole.id, { ViewChannel: false });
    if (onayliRole) await regChannel.permissionOverwrites.edit(onayliRole.id, { ViewChannel: false });
    if (uyeRole) await regChannel.permissionOverwrites.edit(uyeRole.id, { ViewChannel: false });

    // ═══ 4. 🚻・cinsiyet-secimi (Eski kanal tamamen gizlenir, kafa karıştırmaz!) ═══
    const cinsiyetChannel = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildText && c.name.includes('cinsiyet-secimi')
    ) as TextChannel | undefined;

    if (cinsiyetChannel) {
      await cinsiyetChannel.permissionOverwrites.edit(everyoneRole.id, { ViewChannel: false, SendMessages: false });
      if (waitingRole) {
        await cinsiyetChannel.permissionOverwrites.edit(waitingRole.id, { ViewChannel: false, SendMessages: false });
      }
      if (onayliRole) await cinsiyetChannel.permissionOverwrites.edit(onayliRole.id, { ViewChannel: false });
      if (uyeRole) await cinsiyetChannel.permissionOverwrites.edit(uyeRole.id, { ViewChannel: false });
    }

    // ═══ SERVER-WIDE ISOLATION LOCK ═══
    await this.applyServerWideIsolationLock(guild, langChannel.id, category.id);

    // ═══ PANELLERİ GÖNDER ═══
    await this.sendLanguagePanel(langChannel);
    if (kayitChannel) await this.sendTurkishRegistrationPanel(kayitChannel);
    if (regChannel) await this.sendEnglishRegistrationPanel(regChannel);
  }

  public static async applyServerWideIsolationLock(
    guild: Guild,
    allowedLangChannelId: string,
    allowedCategoryId: string
  ): Promise<void> {
    const channels = await guild.channels.fetch();
    const everyoneRole = guild.roles.everyone;
    const roles = await guild.roles.fetch();
    const onayliRole = roles.find((r) => r.name === 'Onaylı' || r.name.includes('Onaylı'));

    for (const [, ch] of channels) {
      if (!ch) continue;
      if (ch.id === allowedLangChannelId || ch.id === allowedCategoryId) continue;

      const currentOverwrites = ch.permissionOverwrites.cache.get(everyoneRole.id);
      const isEveryoneAllowed = currentOverwrites?.allow.has(PermissionFlagsBits.ViewChannel);

      if (isEveryoneAllowed || currentOverwrites?.deny.has(PermissionFlagsBits.ViewChannel) === false) {
        try {
          await ch.permissionOverwrites.edit(everyoneRole.id, { ViewChannel: false, SendMessages: false });
          if (
            onayliRole &&
            !ch.name.includes('kayit-onay') &&
            !ch.name.includes('registration') &&
            !ch.name.includes('cinsiyet-secimi') &&
            !ch.name.includes('yetkili') &&
            !ch.name.includes('log')
          ) {
            await ch.permissionOverwrites.edit(onayliRole.id, { ViewChannel: true });
          }
        } catch (err: any) {
          console.warn(`[LanguageGateManager] ${ch.name} kilitlenirken hata:`, err.message);
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 🌐 TEK PARÇA SİNEMATİK DİL SEÇİM PANELİ
  // ═══════════════════════════════════════════════════════════
  public static async sendLanguagePanel(channel: TextChannel): Promise<void> {
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
        .setColor(0x7c3aed) // Neon Mor / Dark Nights
        .setAuthor({
          name: `${guild.name.toUpperCase()} • RESMİ TOPLULUK KAPISI`,
          iconURL: iconUrl,
        })
        .setTitle('🌐  DİL SEÇİMİ  ┃  LANGUAGE SELECTION')
        .setDescription(
          `### 🌙 Nights Dünyasına Hoş Geldiniz!\n` +
          `Sunucumuza erişebilmek ve diğer üyelerimizle etkileşime geçebilmek için lütfen aşağıdaki butonlardan **ana dilinizi** seçiniz.\n\n` +
          `*To access the server and explore our community, please select your **preferred language** using the buttons below.*\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `🇹🇷 **Türkçe Seçeneği**\n` +
          `> Butona tıkladığınızda **#🛡️・kayit-onay** kanalı açılır.\n` +
          `> İsminizi ve yaşınızı belirterek 5 saniyede kaydınızı tamamlayabilirsiniz.\n\n` +
          `🇬🇧 **English Option**\n` +
          `> Clicking below unlocks the **#🛡️・registration** channel.\n` +
          `> Enter your nickname to join our global community instantly.\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `📊 **Toplam Üye:** \`${guild.memberCount}\` • 🛡️ **Güvenlik Koruması:** \`7/24 Aktif\``
        )
        .setThumbnail(iconUrl || null)
        .setImage(ANIMATIONS.portal) // Entegre animasyon bannerı (alt kısımda estetik birleşik kart)
        .setFooter({
          text: 'Nights Guard • Gateway Security Engine • Made by erencix',
          iconURL: channel.client.user?.displayAvatarURL(),
        })
        .setTimestamp();

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('btn_lang_tr')
          .setLabel('Türkçe')
          .setEmoji('🇹🇷')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('btn_lang_en')
          .setLabel('English')
          .setEmoji('🇬🇧')
          .setStyle(ButtonStyle.Primary)
      );

      await channel.send({ embeds: [embed], components: [row] });
      console.log(`[LanguageGateManager] Tek parça lüks dil paneli '#${channel.name}' kanalına gönderildi.`);
    } catch (err: any) {
      console.error(`[LanguageGateManager] Dil paneli gönderim hatası:`, err.message);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 🇹🇷 TEK PARÇA TÜRKÇE KAYIT PANELİ (HIZLI & DİREKT)
  // ═══════════════════════════════════════════════════════════
  public static async sendTurkishRegistrationPanel(channel: TextChannel): Promise<void> {
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
        .setColor(0x00d2d3) // Neon Turkuaz / Cyberpunk
        .setAuthor({
          name: `${guild.name.toUpperCase()} • HIZLI KAYIT MERKEZİ`,
          iconURL: iconUrl,
        })
        .setTitle('🛡️  NIGHTS AİLESİNE HOŞ GELDİNİZ!')
        .setDescription(
          `Aramıza katılmak ve tüm sunucu kanallarının kilidini anında açmak için aşağıdaki **Erkek** veya **Kız** butonuna tıklayarak kaydınızı tamamlayın.\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `⚡ **Nasıl Kayıt Olunur? (Sadece 5 Saniye)**\n` +
          `> **1.** Cinsiyetinize uygun butona tıklayın (**Erkek** veya **Kız**).\n` +
          `> **2.** Açılan ekranda **İsminizi** ve (isteğe bağlı) **Yaşınızı** yazın.\n` +
          `> **3.** **Gönder** butonuna bastığınız anda tüm sunucu açılır!\n\n` +
          `💎 **Kayıt Sonrası Açılacak Ayrıcalıklar:**\n` +
          `• 💬 **Genel Sohbet & Medya Kanalları**\n` +
          `• 🎙️ **384 Kbps Stüdyo Kalitesinde Ses Odaları & Müzik Botu**\n` +
          `• 🎮 **Oyun Lobileri** (Valorant, CS2, LoL ve topluluk turnuvaları)\n` +
          `• 🍿 **Sinema & Anime Geceleri**\n` +
          `• 💰 **Seviye, Ekonomi & Nights Coin Sistemi**\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `🔒 *İsminiz sunucu düzeni için otomatik olarak \`☊ İsim | Yaş\` şeklinde ayarlanacaktır.*`
        )
        .setThumbnail(iconUrl || null)
        .setImage(ANIMATIONS.wave) // Entegre dalga animasyonu
        .setFooter({
          text: 'Nights Guard • Hızlı Kayıt Sistemi v3.0 • Made by erencix',
          iconURL: channel.client.user?.displayAvatarURL(),
        })
        .setTimestamp();

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('btn_cinsiyet_erkek')
          .setLabel('Erkek Kayıt')
          .setEmoji('👦')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('btn_cinsiyet_kiz')
          .setLabel('Kız Kayıt')
          .setEmoji('👧')
          .setStyle(ButtonStyle.Danger)
      );

      await channel.send({ embeds: [embed], components: [row] });
      console.log(`[LanguageGateManager] Tek parça lüks Türkçe kayıt paneli '#${channel.name}' kanalına gönderildi.`);
    } catch (err: any) {
      console.error(`[LanguageGateManager] Türkçe kayıt paneli hatası:`, err.message);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 🇬🇧 TEK PARÇA İNGİLİZCE KAYIT PANELİ
  // ═══════════════════════════════════════════════════════════
  public static async sendEnglishRegistrationPanel(channel: TextChannel): Promise<void> {
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
        .setColor(0xa855f7) // Electric Purple
        .setAuthor({
          name: `${guild.name.toUpperCase()} • VERIFICATION DESK`,
          iconURL: iconUrl,
        })
        .setTitle('🛡️  WELCOME TO NIGHTS COMMUNITY!')
        .setDescription(
          `To gain full access to all channels and join our community, please click either the **Male** or **Female** button below to complete your registration.\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `⚡ **How to Register? (Takes 5 Seconds)**\n` +
          `> **1.** Click your gender button below (**Male** or **Female**).\n` +
          `> **2.** Enter your **Name** and (optional) **Age** in the form.\n` +
          `> **3.** Hit **Submit** — and all server channels unlock immediately!\n\n` +
          `💎 **What You Unlock:**\n` +
          `• 💬 **Community Chat & Media Channels**\n` +
          `• 🎙️ **384 Kbps Ultra HD Voice Rooms & 24/7 Music Bot**\n` +
          `• 🎮 **Gaming Rooms** (Valorant, CS2, LoL & Events)\n` +
          `• 🍿 **Movie & Anime Watch Parties**\n` +
          `• 💰 **Leveling, Economy & Nights Coin System**\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `🔒 *Your nickname will automatically be formatted as: \`☊ Name | Age\`.*`
        )
        .setThumbnail(iconUrl || null)
        .setImage(ANIMATIONS.flow) // Entegre siber mor animasyon
        .setFooter({
          text: 'Nights Guard • Global Verification v3.0 • Made by erencix',
          iconURL: channel.client.user?.displayAvatarURL(),
        })
        .setTimestamp();

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('btn_reg_male')
          .setLabel('Male Registration')
          .setEmoji('👦')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('btn_reg_female')
          .setLabel('Female Registration')
          .setEmoji('👧')
          .setStyle(ButtonStyle.Danger)
      );

      await channel.send({ embeds: [embed], components: [row] });
      console.log(`[LanguageGateManager] Tek parça lüks İngilizce kayıt paneli '#${channel.name}' kanalına gönderildi.`);
    } catch (err: any) {
      console.error(`[LanguageGateManager] İngilizce kayıt paneli hatası:`, err.message);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 🎉 TEK PARÇA KUTLAMA EMBEDİ (Kullanıcıya Özel Ephemeral)
  // ═══════════════════════════════════════════════════════════
  public static buildRegistrationSuccessEmbed(
    member: { id: string; user: { tag: string; displayAvatarURL: (opts?: any) => string } },
    isim: string,
    yas: string,
    isMale: boolean,
    isEnglish: boolean,
    guild: { name: string; memberCount: number; iconURL: (opts?: any) => string | null }
  ): EmbedBuilder[] {
    const formattedNick = `☊ ${isim}${yas ? ' | ' + yas : ''}`;
    const genderIcon = isMale ? '👦' : '👧';
    const genderColor = isMale ? 0x3b82f6 : 0xec4899;

    if (isEnglish) {
      const successEmbed = new EmbedBuilder()
        .setColor(genderColor)
        .setTitle('🎉  REGISTRATION COMPLETE!')
        .setDescription(
          `### 👑 Welcome to ${guild.name}, **${isim}**!\n` +
          `Your verification is complete and all server channels are now open.\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `> 👤 **Nickname:** \`${formattedNick}\`\n` +
          `> ${genderIcon} **Gender:** **${isMale ? 'Male' : 'Female'}**\n` +
          `> 🌐 **Language:** 🇬🇧 English\n` +
          `> 🏆 **Member Order:** \`#${guild.memberCount}\`\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `✨ *Feel free to say hi in **#genel-sohbet** and meet the community!* 🚀`
        )
        .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
        .setImage(ANIMATIONS.celebrate) // Yeşil onay patlaması animasyonu
        .setFooter({ text: 'Nights Guard • Verification Complete' })
        .setTimestamp();

      return [successEmbed];
    }

    const successEmbed = new EmbedBuilder()
      .setColor(genderColor)
      .setTitle('🎉  KAYDINIZ BAŞARIYLA TAMAMLANDI!')
      .setDescription(
        `### 👑 Hoş Geldin, **${isim}**!\n` +
        `Kayıt işlemin başarıyla onaylandı ve tüm sunucunun kilidi açıldı.\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `> 👤 **Yeni İsmin:** \`${formattedNick}\`\n` +
        `> ${genderIcon} **Cinsiyet:** **${isMale ? 'Erkek' : 'Kız'}**\n` +
        `> 🌐 **Dil:** 🇹🇷 Türkçe\n` +
        `> 🏆 **Üye Sırası:** \`#${guild.memberCount}. Üyemiz!\`\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `✨ *Hemen **#genel-sohbet** kanalında bir selam ver ve topluluğumuzla tanış!* 🚀`
      )
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .setImage(ANIMATIONS.celebrate) // Yeşil onay patlaması animasyonu
      .setFooter({ text: 'Nights Guard • Kayıt Sistemi v3.0' })
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
    isEnglish: boolean,
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
        { name: `${isMale ? '👦' : '👧'} Cinsiyet`, value: isMale ? '**Erkek**' : '**Kız**', inline: true },
        { name: '📝 Yeni İsim', value: `\`${formattedNick}\``, inline: true },
        { name: '🌐 Dil', value: isEnglish ? '🇬🇧 English' : '🇹🇷 Türkçe', inline: true },
        { name: '⏰ Kayıt Saati', value: `\`${timeStr}\``, inline: true },
        { name: '📊 Toplam Üye', value: `**${guild.memberCount}**`, inline: true }
      )
      .setThumbnail(member.user.displayAvatarURL({ size: 128 }))
      .setFooter({ text: 'Nights Guard • Kayıt Log Motoru' })
      .setTimestamp();
  }

  // ═══════════════════════════════════════════════════════════
  // 🇹🇷 DİL SEÇİMİ GERİ BİLDİRİM EMBEDİ
  // ═══════════════════════════════════════════════════════════
  public static buildLanguageSelectedEmbed(isTr: boolean, channelMention: string): EmbedBuilder {
    if (isTr) {
      return new EmbedBuilder()
        .setColor(0x10b981)
        .setTitle('✅  DİL BAŞARIYLA BELİRLENDİ!')
        .setDescription(
          `🇹🇷 **Türkçe dili seçildi.**\n\n` +
          `Kayıt kanalınız açıldı! Lütfen ${channelMention} kanalına geçerek kaydınızı tamamlayınız ve tüm sunucunun kilidini açınız.\n\n` +
          `*Kayıt işlemi sadece birkaç saniye sürer.*`
        )
        .setFooter({ text: 'Nights Guard • Dil Kapısı' })
        .setTimestamp();
    }

    return new EmbedBuilder()
      .setColor(0x8b5cf6)
      .setTitle('✅  LANGUAGE SET SUCCESSFULLY!')
      .setDescription(
        `🇬🇧 **English language selected.**\n\n` +
        `Your registration channel is now open! Please head over to ${channelMention} to complete your verification.\n\n` +
        `*Registration takes only a few seconds.*`
      )
      .setFooter({ text: 'Nights Guard • Language Gate' })
      .setTimestamp();
  }
}
