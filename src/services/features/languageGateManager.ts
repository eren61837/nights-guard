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

export class LanguageGateManager {
  private static ran = false;

  /**
   * Sunucu genelindeki dil kapısını ve kayıt kanallarını başlatır / garanti eder
   */
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

  /**
   * Dil rollerini (🇹🇷・Türkçe, 🇬🇧・English) ve kayıt rollerini kontrol eder / oluşturur
   */
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
        color: '#3B82F6',
        reason: 'Nights Guard • Dil Seçim Rolü',
      });
      console.log(`[LanguageGateManager] '🇹🇷・Türkçe' rolü oluşturuldu (${trRole.id})`);
    }

    let enRole = roles.find((r) => r.name === '🇬🇧・English' || r.name === 'English');
    if (!enRole) {
      enRole = await guild.roles.create({
        name: '🇬🇧・English',
        color: '#A855F7',
        reason: 'Nights Guard • Language Role',
      });
      console.log(`[LanguageGateManager] '🇬🇧・English' rolü oluşturuldu (${enRole.id})`);
    }

    const onayliRole = roles.find((r) => r.name === 'Onaylı' || r.name.includes('Onaylı'));
    const uyeRole = roles.find((r) => r.name === 'Üye' || r.name.includes('Üye'));
    const erkekRole = roles.find((r) => r.name === 'Erkek');
    const kizRole = roles.find((r) => r.name === 'Kız');
    const waitingRole = roles.find((r) => r.name.includes('Kayıt Bekleyen') || r.name.includes('Cinsiyet Bekleyen'));

    return {
      trRole,
      enRole,
      onayliRole,
      uyeRole,
      erkekRole,
      kizRole,
      waitingRole,
    };
  }

  /**
   * Dil seçim kanalı ve kayıt kanallarının izinlerini ve hiyerarşisini kurar
   */
  public static async ensureLanguageGate(guild: Guild): Promise<void> {
    const { trRole, enRole, onayliRole, uyeRole, waitingRole } = await this.ensureRoles(guild);
    const everyoneRole = guild.roles.everyone;

    // 1. Giriş ve Kayıt Kategorisini Bul veya Oluştur
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

    // 2. '🌐・dil-secimi' Kanalını Kur / Doğrula
    // BU KANAL YENİ GELEN (@everyone) İÇİN GÖRÜNÜR OLAN TEK KANALDIR!
    let langChannel = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildText && (c.name.includes('dil-secimi') || c.name.includes('language-select'))
    ) as TextChannel | undefined;

    if (!langChannel) {
      langChannel = await guild.channels.create({
        name: '🌐・dil-secimi',
        type: ChannelType.GuildText,
        parent: category.id,
        position: 0,
        topic: '🌐 Sunucuya giriş yapmak için dilinizi seçiniz / Please select your language to enter.',
      });
      console.log(`[LanguageGateManager] '🌐・dil-secimi' kanalı oluşturuldu.`);
    }

    // Dil kanalı izinleri:
    // - @everyone: GÖRÜR, Mesaj yazamaz
    // - Onaylı / Üye: GÖREMEZ (Kayıtlı kullanıcıların kanal listesini temiz tutar)
    await langChannel.permissionOverwrites.edit(everyoneRole.id, {
      ViewChannel: true,
      SendMessages: false,
      ReadMessageHistory: true,
      AddReactions: false,
      CreatePublicThreads: false,
      CreatePrivateThreads: false,
    });

    if (onayliRole) {
      await langChannel.permissionOverwrites.edit(onayliRole.id, {
        ViewChannel: false,
      });
    }
    if (uyeRole) {
      await langChannel.permissionOverwrites.edit(uyeRole.id, {
        ViewChannel: false,
      });
    }

    // 3. '🛡️・kayit-onay' (Türkçe Kayıt Kanalı)
    // - @everyone: ASLA GÖREMEZ!
    // - 🇹🇷・Türkçe rolü alan: GÖRÜR
    // - Onaylı / Üye: ASLA GÖREMEZ!
    let kayitChannel = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildText && (c.name.includes('kayit-onay') || c.name === 'kayit-onay')
    ) as TextChannel | undefined;

    if (kayitChannel) {
      await kayitChannel.setParent(category.id).catch(() => {});
      await kayitChannel.setPosition(1).catch(() => {});

      await kayitChannel.permissionOverwrites.edit(everyoneRole.id, {
        ViewChannel: false,
        SendMessages: false,
      });

      await kayitChannel.permissionOverwrites.edit(trRole.id, {
        ViewChannel: true,
        SendMessages: false,
        ReadMessageHistory: true,
      });

      await kayitChannel.permissionOverwrites.edit(enRole.id, {
        ViewChannel: false,
      });

      if (onayliRole) {
        await kayitChannel.permissionOverwrites.edit(onayliRole.id, {
          ViewChannel: false,
        });
      }
      if (uyeRole) {
        await kayitChannel.permissionOverwrites.edit(uyeRole.id, {
          ViewChannel: false,
        });
      }
    }

    // 4. '🛡️・registration' (İngilizce Kayıt Kanalı)
    // - @everyone: ASLA GÖREMEZ!
    // - 🇬🇧・English rolü alan: GÖRÜR
    // - Onaylı / Üye: ASLA GÖREMEZ!
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

    await regChannel.permissionOverwrites.edit(everyoneRole.id, {
      ViewChannel: false,
      SendMessages: false,
    });

    await regChannel.permissionOverwrites.edit(enRole.id, {
      ViewChannel: true,
      SendMessages: false,
      ReadMessageHistory: true,
    });

    await regChannel.permissionOverwrites.edit(trRole.id, {
      ViewChannel: false,
    });

    if (onayliRole) {
      await regChannel.permissionOverwrites.edit(onayliRole.id, {
        ViewChannel: false,
      });
    }
    if (uyeRole) {
      await regChannel.permissionOverwrites.edit(uyeRole.id, {
        ViewChannel: false,
      });
    }

    // 5. '🚻・cinsiyet-secimi' (Eski yapı uyumluluğu)
    const cinsiyetChannel = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildText && c.name.includes('cinsiyet-secimi')
    ) as TextChannel | undefined;

    if (cinsiyetChannel) {
      await cinsiyetChannel.permissionOverwrites.edit(everyoneRole.id, {
        ViewChannel: false,
        SendMessages: false,
      });
      if (waitingRole) {
        await cinsiyetChannel.permissionOverwrites.edit(waitingRole.id, {
          ViewChannel: true,
          SendMessages: false,
          ReadMessageHistory: true,
        });
      }
      if (onayliRole) {
        await cinsiyetChannel.permissionOverwrites.edit(onayliRole.id, {
          ViewChannel: false,
        });
      }
    }

    // 6. SUNUCU GENELİNDE SIKI KİLİT (SERVER-WIDE ISOLATION LOCK)
    // Yeni gelen (@everyone) SADECE VE SADECE '🌐・dil-secimi' kanalını görebilir!
    await this.applyServerWideIsolationLock(guild, langChannel.id, category.id);

    // 7. Panelleri Gönder / Güncelle
    await this.sendLanguagePanel(langChannel);
    if (kayitChannel) {
      await this.sendTurkishRegistrationPanel(kayitChannel);
    }
    if (regChannel) {
      await this.sendEnglishRegistrationPanel(regChannel);
    }
  }

  /**
   * @everyone için '🌐・dil-secimi' dışındaki BÜTÜN kanalları ve kategorileri kapatır.
   * Onaylı / Üye rolü olanlar için topluluk kanallarını açık tutar.
   */
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
      // İzin verilen dil seçim kanalı veya giriş kategorisi ise atla
      if (ch.id === allowedLangChannelId || ch.id === allowedCategoryId) continue;

      const currentOverwrites = ch.permissionOverwrites.cache.get(everyoneRole.id);
      const isEveryoneAllowed = currentOverwrites?.allow.has(PermissionFlagsBits.ViewChannel);

      // Eğer kanalda @everyone açık kalmışsa, derhal KAPAT!
      if (isEveryoneAllowed || currentOverwrites?.deny.has(PermissionFlagsBits.ViewChannel) === false) {
        try {
          await ch.permissionOverwrites.edit(everyoneRole.id, {
            ViewChannel: false,
            SendMessages: false,
          });

          // Eğer onaylı rolü varsa ve kayıt kanalı değilse, kayıtlı üyelerin görebildiğinden emin ol
          if (
            onayliRole &&
            !ch.name.includes('kayit-onay') &&
            !ch.name.includes('registration') &&
            !ch.name.includes('cinsiyet-secimi') &&
            !ch.name.includes('yetkili') &&
            !ch.name.includes('log')
          ) {
            await ch.permissionOverwrites.edit(onayliRole.id, {
              ViewChannel: true,
            });
          }
        } catch (err: any) {
          // İzin düzenleme hatası olursa logla
          console.warn(`[LanguageGateManager] ${ch.name} kilitlenirken hata:`, err.message);
        }
      }
    }
  }

  /**
   * '🌐・dil-secimi' kanalına interaktif dil seçim panelini gönderir / günceller
   */
  public static async sendLanguagePanel(channel: TextChannel): Promise<void> {
    try {
      const messages = await channel.messages.fetch({ limit: 10 });
      const existingPanel = messages.find(
        (m) => m.author.id === channel.client.user?.id && m.embeds.length > 0 && m.embeds[0].title?.includes('DİL SEÇİMİ')
      );

      if (existingPanel) {
        // Panel zaten mevcut, tekrar spam yapma
        return;
      }

      // Eski bot mesajlarını temizle
      for (const [, msg] of messages) {
        if (msg.author.id === channel.client.user?.id) {
          await msg.delete().catch(() => {});
        }
      }

      const embed = new EmbedBuilder()
        .setTitle('🌐 NIGHTS TOPLULUĞU • DİL SEÇİMİ / LANGUAGE SELECTION')
        .setDescription(
          `👋 **Sunucumuza Hoş Geldiniz! / Welcome to Nights Community!**\n\n` +
          `Sunucuya erişim sağlamak ve kayıt olmak için lütfen kullanmak istediğiniz dili seçiniz.\n` +
          `Please select your preferred language below to unlock registration and access the server.\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `🇹🇷 **Türkçe İçin:**\n` +
          `Aşağıdaki **[ 🇹🇷 Türkçe ]** butonuna tıklayın. Doğrulama ve kayıt kanalınız Türkçe olarak açılacaktır.\n\n` +
          `🇬🇧 **For English:**\n` +
          `Click the **[ 🇬🇧 English ]** button below. The registration channel will be unlocked in English.\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `> ⚡ *Seçiminiz sonrasında kayıt odanız otomatik olarak belirecektir.*\n` +
          `> ⚡ *Your registration room will appear instantly after selecting.*`
        )
        .setColor('#8B5CF6')
        .setImage('https://media.giphy.com/media/26tn3334mvoVClhos/giphy.gif')
        .setFooter({ text: 'Nights Guard • Gatekeeper Engine • Made by erencix' })
        .setTimestamp();

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('btn_lang_tr')
          .setLabel('🇹🇷 Türkçe')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('btn_lang_en')
          .setLabel('🇬🇧 English')
          .setStyle(ButtonStyle.Primary)
      );

      await channel.send({ embeds: [embed], components: [row] });
      console.log(`[LanguageGateManager] Dil seçim paneli '#${channel.name}' kanalına başarıyla gönderildi.`);
    } catch (err: any) {
      console.error(`[LanguageGateManager] Dil paneli gönderim hatası:`, err.message);
    }
  }

  /**
   * '🛡️・kayit-onay' kanalına Türkçe kayıt panelini gönderir / günceller
   */
  public static async sendTurkishRegistrationPanel(channel: TextChannel): Promise<void> {
    try {
      const messages = await channel.messages.fetch({ limit: 10 });
      const existingPanel = messages.find(
        (m) => m.author.id === channel.client.user?.id && m.embeds.length > 0 && m.embeds[0].title?.includes('KAYIT & DOĞRULAMA')
      );

      if (existingPanel) return;

      // Eski bot mesajlarını temizle
      for (const [, msg] of messages) {
        if (msg.author.id === channel.client.user?.id) {
          await msg.delete().catch(() => {});
        }
      }

      const embed = new EmbedBuilder()
        .setTitle('🛡️ NIGHTS TOPLULUĞU • KAYIT & DOĞRULAMA')
        .setDescription(
          `🌙 **Aramıza Hoş Geldiniz!**\n\n` +
          `Nights ailesinin bir parçası olmak, sohbet ve ses odalarına katılabilmek için lütfen kaydınızı tamamlayın.\n\n` +
          `📌 **Nasıl Kayıt Olunur?**\n` +
          `1️⃣ Aşağıdaki butonlardan cinsiyetinize uygun olanına tıklayın.\n` +
          `2️⃣ Açılan pencereye **İsminizi** ve isteğe bağlı olarak **Yaşınızı** yazın.\n` +
          `3️⃣ Gönder butonuna bastığınız anda tüm sunucu odaları hizmetinize açılacaktır! ✨\n\n` +
          `> 🔒 *Kayıt bilgileri sunucu düzeni ve hitap amaçlı kullanılmaktadır.*`
        )
        .setColor('#2ECC71')
        .setImage('https://media.giphy.com/media/EPfV3ijMQVl60/giphy.gif')
        .setFooter({ text: 'Nights Guard • Hızlı Kayıt Sistemi • Made by erencix' })
        .setTimestamp();

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('btn_cinsiyet_erkek')
          .setLabel('👦 Erkek Kayıt')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('btn_cinsiyet_kiz')
          .setLabel('👧 Kız Kayıt')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('btn_kayit_basla')
          .setLabel('⚡ Hızlı Onay')
          .setStyle(ButtonStyle.Secondary)
      );

      await channel.send({ embeds: [embed], components: [row] });
      console.log(`[LanguageGateManager] Türkçe kayıt paneli '#${channel.name}' kanalına gönderildi.`);
    } catch (err: any) {
      console.error(`[LanguageGateManager] Türkçe kayıt paneli hatası:`, err.message);
    }
  }

  /**
   * '🛡️・registration' kanalına İngilizce kayıt panelini gönderir / günceller
   */
  public static async sendEnglishRegistrationPanel(channel: TextChannel): Promise<void> {
    try {
      const messages = await channel.messages.fetch({ limit: 10 });
      const existingPanel = messages.find(
        (m) => m.author.id === channel.client.user?.id && m.embeds.length > 0 && m.embeds[0].title?.includes('REGISTRATION & VERIFICATION')
      );

      if (existingPanel) return;

      for (const [, msg] of messages) {
        if (msg.author.id === channel.client.user?.id) {
          await msg.delete().catch(() => {});
        }
      }

      const embed = new EmbedBuilder()
        .setTitle('🛡️ NIGHTS COMMUNITY • REGISTRATION & VERIFICATION')
        .setDescription(
          `🌙 **Welcome to Nights!**\n\n` +
          `To gain access to channels, voice lobbies, and gaming hubs, please complete your registration below.\n\n` +
          `📌 **How to register?**\n` +
          `1️⃣ Click on your gender button below (**Male** or **Female**).\n` +
          `2️⃣ Enter your **Name** and optionally your **Age** in the pop-up modal.\n` +
          `3️⃣ Hit submit! All server channels will unlock for you immediately! ✨\n\n` +
          `> 🔒 *Names are formatted as \`☊ Name | Age\` for community friendliness.*`
        )
        .setColor('#8B5CF6')
        .setImage('https://media.giphy.com/media/EPfV3ijMQVl60/giphy.gif')
        .setFooter({ text: 'Nights Guard • Global Verification System • Made by erencix' })
        .setTimestamp();

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('btn_reg_male')
          .setLabel('👦 Male Registration')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('btn_reg_female')
          .setLabel('👧 Female Registration')
          .setStyle(ButtonStyle.Danger)
      );

      await channel.send({ embeds: [embed], components: [row] });
      console.log(`[LanguageGateManager] İngilizce kayıt paneli '#${channel.name}' kanalına gönderildi.`);
    } catch (err: any) {
      console.error(`[LanguageGateManager] İngilizce kayıt paneli hatası:`, err.message);
    }
  }
}
