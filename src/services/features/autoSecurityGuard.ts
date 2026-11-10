import {
  Message,
  EmbedBuilder,
  PermissionFlagsBits,
  TextChannel,
  GuildMember,
  Client,
  AttachmentBuilder,
  AuditLogEvent,
  Guild,
  User,
  PartialGuildMember,
} from 'discord.js';
import path from 'path';
import fs from 'fs';

interface UserSpamData {
  timestamps: number[];
  lastMessages: string[];
}

interface ModActionRecord {
  targetId: string;
  type: 'ban' | 'kick';
  timestamp: number;
}

export class AutoSecurityGuard {
  // Reklam & Davet regexleri
  private static inviteRegex =
    /(discord\.(gg|io|me|li)\/.+|discordapp\.com\/invite\/.+|discord\.com\/invite\/.+|t\.me\/.+|whatsapp\.com\/chat\/.+|chat\.whatsapp\.com\/.+)/i;

  // Sahte Nitro, Phishing ve Dolandırıcılık linkleri
  private static phishingRegex =
    /(steamcommunit[y|i]|steam-gift|free-nitro|discrod-nitro|discord-gift|dlscord|nitro-gift|airdrop.*crypto|gift-nitro|claim-nitro|giftcard|roblox-gift)/i;

  // Genel URL regexi
  private static generalUrlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/i;

  // Kullanıcı spam takip tablosu
  private static spamTracker = new Map<string, UserSpamData>();

  // Raid Takip Sistemi (Anti-Raid Shield)
  private static recentJoins: { userId: string; timestamp: number }[] = [];
  private static isRaidActive = false;
  private static raidEndTime = 0;

  // Anti-Mass Ban & Anti-Mass Kick Takip Tablosu (10 Dakikalık Kayan Pencere)
  private static modActionTracker = new Map<string, ModActionRecord[]>();
  private static OWNER_ID = '1138498666785677492';

  /**
   * Kapsamlı ve Akıllı Türkçe Küfür / Hakaret Filtresi
   * Harf uzatmaları, araya nokta/boşluk koyma ve leetspeak varyasyonlarını yakalar.
   * Masum kelimeler (tamam, selam, kapıcı, ekran vb.) filtreden zarar görmez.
   */
  public static isProfane(rawContent: string): boolean {
    if (!rawContent) return false;

    const lower = rawContent.toLowerCase();

    // 1. Türkçe karakter ve Leetspeak normalizasyonu
    const normalized = lower
      .replace(/ı/g, 'i')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/0/g, 'o')
      .replace(/1/g, 'i')
      .replace(/3/g, 'e')
      .replace(/4/g, 'a')
      .replace(/@/g, 'a')
      .replace(/\$/g, 's')
      .replace(/!/g, 'i')
      .replace(/vv/g, 'w')
      .replace(/v/g, 'u');

    // Harf uzatmalarını temizle (siiiiiktir -> siktir)
    const collapsed = normalized.replace(/[^a-z]/g, '').replace(/(.)\1{2,}/g, '$1$1');
    const fullyCollapsed = normalized.replace(/[^a-z]/g, '').replace(/(.)\1+/g, '$1');

    // 2. Ailevi / Dini / Ağır Şahsi Mutlak Kökler (Bitişik veya Ayrık)
    const severeRoots = [
      'orospucocug',
      'orospucocuk',
      'orospuevlad',
      'orosbucocug',
      'orosbuevlad',
      'kahpeevlad',
      'kahbeevlad',
      'pickurusu',
      'bacinisi',
      'bacinisik',
      'bacinasok',
      'sulalenisi',
      'sulalenisik',
      'sulalenekoy',
      'ecdadini',
      'ceddinisik',
      'allahinisik',
      'dininisik',
      'kitabinisik',
      'senisikerim',
      'senisikeyim',
      'seninanani',
      'seninbacini',
      'seninsulaleni',
      'gotveren',
      'gotlek',
      'pezevenk',
      'gavat',
      'kavat',
      'dassak',
      'tasak',
      'amcik',
      'amcigi',
      'yarrrak',
      'yarrak',
      'yarak',
      'yarragina',
      'siktir',
      'siktirgit',
      'sikeyim',
      'siktim',
      'sikik',
      'siksok',
      'aminakoy',
      'amkoy',
      'amkoyim',
      'sikis',
      'sakso',
      'escort',
      'eskort',
      'fahise',
      'jigolo',
      'masturbasyon',
      'porno',
      'yavsak',
      'kahpe',
      'kahbe',
      'kasar',
    ];

    for (const root of severeRoots) {
      if (collapsed.includes(root) || fullyCollapsed.includes(root) || normalized.includes(root)) {
        return true;
      }
    }

    // 3. Kelime Sınırlarıyla Kontrol Edilen Kısaltma ve Küfürler (Masum kelimelere çarpmaz)
    const boundedWordRegexes = [
      /(?:^|\s|[^a-z0-9])amk(?:$|\s|[^a-z0-9])/i,
      /(?:^|\s|[^a-z0-9])aq(?:$|\s|[^a-z0-9])/i,
      /(?:^|\s|[^a-z0-9])amq(?:$|\s|[^a-z0-9])/i,
      /(?:^|\s|[^a-z0-9])sg(?:$|\s|[^a-z0-9])/i,
      /(?:^|\s|[^a-z0-9])skm(?:$|\s|[^a-z0-9])/i,
      /(?:^|\s|[^a-z0-9])sik(?:$|\s|[^a-z0-9])/i,
      /(?:^|\s|[^a-z0-9])pic(?:$|\s|[^a-z0-9])/i,
      /(?:^|\s|[^a-z0-9])pust(?:$|\s|[^a-z0-9])/i,
      /(?:^|\s|[^a-z0-9])ibne(?:$|\s|[^a-z0-9])/i,
      /(?:^|\s|[^a-z0-9])orospu(?:$|\s|[^a-z0-9])/i,
      /(?:^|\s|[^a-z0-9])orosbu(?:$|\s|[^a-z0-9])/i,
      /(?:^|\s|[^a-z0-9])dildo(?:$|\s|[^a-z0-9])/i,
      /(?:^|\s|[^a-z0-9])vajina(?:$|\s|[^a-z0-9])/i,
      /(?:^|\s|[^a-z0-9])penis(?:$|\s|[^a-z0-9])/i,
      /(?:^|\s|[^a-z0-9])o[\.\,\_\*\-\s]*c(?:$|\s|[^a-z0-9])/i,
    ];

    for (const rx of boundedWordRegexes) {
      if (rx.test(normalized)) {
        return true;
      }
    }

    // 4. Anne / Bacı Küfür Kombinasyonları
    if (/(anani|anana|ananin|anneni|annenin|anaskm|anacini|bacini|sulaleni)/i.test(normalized) || /(anani|anana|ananin|anneni|annenin|anaskm|anacini|bacini|sulaleni)/i.test(collapsed)) {
      if (/(sik|am[i]|sok|koy|avrat|baci|orospu|orosbu|kayayim|skm)/i.test(normalized) || /(sik|ami|sok|koy|avrat|baci|orospu|orosbu|kayayim|skm)/i.test(collapsed)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Mesaj Denetimi: Küfür, Spam, Link, Capslock, Medya İhlali
   */
  public static async inspect(message: Message): Promise<boolean> {
    if (message.author.bot || !message.guild) return false;
    if (!message.content && message.attachments.size === 0) return false;

    // Yetkili Kontrolü
    const isStaff = Boolean(
      message.member?.permissions.has(PermissionFlagsBits.Administrator) ||
      message.member?.permissions.has(PermissionFlagsBits.ManageMessages) ||
      message.member?.permissions.has(PermissionFlagsBits.ModerateMembers) ||
      message.guild.ownerId === message.author.id
    );

    const isBooster = Boolean(message.member?.premiumSince);

    const content = message.content ? message.content.trim() : '';
    const chName = (message.channel as any).name || '';
    const chId = message.channel.id;

    const isMediaChannel = chName.includes('foto-medya') || chName.includes('medya') || chId === '1568644564590268641';
    const isTicketChannel = chName.startsWith('bilet-') || chName.startsWith('ticket-');
    const isGameChannel =
      chName.includes('owo') ||
      chName.includes('oyun') ||
      chName.includes('kelime') ||
      chName.includes('sayi') ||
      chName.includes('bot-komut') ||
      chName.includes('kumar');

    const isGameCommand = /^(owo|w\b|wb|wbj|wh|s\b|c\b|cf|slot|!|\.|\/)/i.test(content.trim());

    // 0. Fotoğraf & Medya İhlali Koruması
    const hasAttachments = message.attachments.size > 0;
    const hasImageLink =
      /(https?:\/\/[^\s]+(?:\.png|\.jpg|\.jpeg|\.webp|\.gif|\.bmp|\.svg)|cdn\.discordapp\.com\/attachments|media\.discordapp\.net\/attachments)/i.test(
        content
      );

    if (!isMediaChannel && !isTicketChannel && !isStaff && !isBooster && (hasAttachments || hasImageLink)) {
      try { await message.delete(); } catch (e) {}
      try {
        if ('send' in message.channel) {
          const warn = await (message.channel as any).send({
            content: `📸 **${message.author.displayName}**, sunucumuzda görsel ve medya paylaşımları yalnızca medya kanallarında veya Booster/Yetkili üyelerimize açıktır!`,
          });
          setTimeout(() => warn.delete().catch(() => {}), 4500);
        }
      } catch (e) {}
      return true;
    }

    const userId = message.author.id;
    let reason = '';
    let shouldTimeout = false;
    let timeoutSeconds = 60;

    // 1. KÜFÜR VE HAKARET KORUMASI
    if (this.isProfane(content)) {
      reason = 'Küfür / Hakaret İçeriği';
      shouldTimeout = !isStaff;
      timeoutSeconds = 120; // 2 Dakika
    }

    // Yetkililer küfür testi haricindeki rutin kontrollerden muaftır
    if (!reason && isStaff) {
      return false;
    }

    // 2. PHISHING & SAHTE NITRO / DOLANDIRICILIK KORUMASI
    if (!reason && this.phishingRegex.test(content)) {
      reason = 'Zararlı Bağlantı / Sahte Nitro & Phishing';
      shouldTimeout = true;
      timeoutSeconds = 600; // 10 Dakika
    }

    // 3. REKLAM & DISCORD DAVET LİNKİ KORUMASI
    else if (!reason && this.inviteRegex.test(content)) {
      reason = 'İzinsiz Reklam / Discord Davet Linki';
      shouldTimeout = true;
      timeoutSeconds = 300; // 5 Dakika
    }

    // 4. GENEL LİNK ENGELİ (Yetkili veya Booster olmayan normal üyelerin genel sohbete link atması yasaktır)
    else if (!reason && !isMediaChannel && !isTicketChannel && !isBooster && this.generalUrlRegex.test(content)) {
      reason = 'İzinsiz Harici Bağlantı (Link) Paylaşımı';
      shouldTimeout = false;
    }

    // 5. AŞIRI TOPLU ETİKET (MASS MENTION) KORUMASI (> 3 etiket)
    else if (!reason && message.mentions.users.size + message.mentions.roles.size > 3) {
      reason = 'Aşırı Etiketleme (Mass Mention)';
      shouldTimeout = true;
      timeoutSeconds = 300;
    }

    // 6. EMOJI SPAM KORUMASI (> 8 emoji)
    else if (!reason && !isGameChannel) {
      const emojiCount = (content.match(/<a?:[a-zA-Z0-9_]+:[0-9]+>|[\u{1F300}-\u{1F9FF}]/gu) || []).length;
      if (emojiCount >= 8) {
        reason = 'Aşırı Emoji Kullanımı (Emoji Spam)';
        shouldTimeout = false;
      }
    }

    // 7. AŞIRI BÜYÜK HARF (CAPS LOCK) KORUMASI (> 12 harf ve %75+ büyük)
    if (!reason && content.length > 12) {
      const letters = content.replace(/[^a-zA-ZçğıöşüÇĞİÖŞÜ]/g, '');
      if (letters.length >= 10) {
        const uppercaseCount = letters.replace(/[^A-ZÇĞİÖŞÜ]/g, '').length;
        if (uppercaseCount / letters.length >= 0.75) {
          reason = 'Aşırı Büyük Harf (Caps Lock) Kullanımı';
        }
      }
    }

    // 8. HIZLI MESAJ SPAM & FLOOD KORUMASI
    if (!reason && !isGameChannel && !isGameCommand) {
      const now = Date.now();
      const userData = this.spamTracker.get(userId) || { timestamps: [], lastMessages: [] };

      // 3 saniye içindeki mesajlar
      userData.timestamps = userData.timestamps.filter((t) => now - t < 3000);
      userData.timestamps.push(now);

      userData.lastMessages.push(content.toLowerCase());
      if (userData.lastMessages.length > 8) userData.lastMessages.shift();

      const sameCount = userData.lastMessages.filter((m) => m === content.toLowerCase()).length;

      if (userData.timestamps.length >= 6) {
        reason = 'Aşırı Hızlı Mesaj Gönderimi (Spam Saldırısı)';
        shouldTimeout = true;
        timeoutSeconds = 180;
      } else if (sameCount >= 4) {
        reason = 'Mesaj Tekrarlama (Flood Saldırısı)';
        shouldTimeout = true;
        timeoutSeconds = 120;
      } else if (userData.timestamps.length >= 4) {
        reason = 'Hızlı Mesaj Gönderimi (Spam)';
        shouldTimeout = false;
      } else if (sameCount >= 3) {
        reason = 'Mesaj Tekrarı (Flood)';
        shouldTimeout = false;
      }

      this.spamTracker.set(userId, userData);
    }

    // Ceza & Engelleme Uygula
    if (reason) {
      try {
        await message.delete();
      } catch (e) {}

      if (shouldTimeout && !isStaff && message.member) {
        try {
          await message.member.timeout(timeoutSeconds * 1000, `Nights Guard Güvenlik: ${reason}`);
        } catch (e) {}
      }

      // Kullanıcıya Uyarı Gönder
      try {
        if ('send' in message.channel) {
          if (isStaff) {
            const warn = await (message.channel as any).send({
              content: `⚠️ **${message.author.displayName}** \`[YETKİLİ TEST UYARISI]\`\nMesajınızda **${reason}** tespit edildi!\n> 🛡️ *Yetkili olduğunuz için ceza uygulanmadı.*`,
            });
            setTimeout(() => warn.delete().catch(() => {}), 5000);
          } else {
            const timeoutStr = shouldTimeout ? ` (${Math.ceil(timeoutSeconds / 60)} Dakika Susturuldunuz)` : '';
            const warn = await (message.channel as any).send({
              content: `🛡️ **${message.author.displayName}**, sunucumuzda **${reason}** engellendi!${timeoutStr}`,
            });
            setTimeout(() => warn.delete().catch(() => {}), 4500);
          }
        }
      } catch (e) {}

      // Mod-Log Raporu İlet
      try {
        const logChannel = message.guild.channels.cache.find(
          (c: any) => c.name.includes('mod-log') && c.isTextBased()
        ) as TextChannel | undefined;

        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setTitle(isStaff ? '🧪 [Yetkili Testi] Güvenlik Filtresi' : '🚨 Nights Guard: Güvenlik İhlali Engellendi')
            .setColor(isStaff ? '#F1C40F' : shouldTimeout ? '#992D22' : '#ED4245')
            .addFields(
              {
                name: '👤 Kullanıcı',
                value: `<@${message.author.id}> (\`${message.author.tag}\`) ${isStaff ? '⭐ **(Yetkili / Muaf)**' : ''}`,
                inline: true,
              },
              { name: '📁 Kanal', value: `<#${message.channel.id}>`, inline: true },
              { name: '🛑 Sebep', value: `**${reason}**`, inline: true },
              {
                name: '⚖️ Alınan Tedbir',
                value: isStaff
                  ? '⚠️ **Mesaj Silindi & Deneme Uyarısı Verildi**'
                  : shouldTimeout
                  ? `🛑 **Mesaj Silindi + ${Math.ceil(timeoutSeconds / 60)} Dk Timeout**`
                  : '🗑️ **Mesaj Silindi & Uyarıldı**',
                inline: true,
              },
              { name: '💬 Mesaj İçeriği', value: `\`\`\`${content.slice(0, 750)}\`\`\``, inline: false }
            )
            .setFooter({ text: 'Nights Guard • Akıllı Güvenlik Kalkanı' })
            .setTimestamp();

          await logChannel.send({ embeds: [logEmbed] });
        }
      } catch (e) {}

      return true;
    }

    return false;
  }

  /**
   * RAID KORUMASI: Ani toplu hesap girişlerini takip eder ve kalkan açar
   */
  public static async handleMemberJoinSecurity(member: GuildMember): Promise<boolean> {
    const guild = member.guild;
    const now = Date.now();

    // Son 10 saniye içindeki katılımları filtrele
    this.recentJoins = this.recentJoins.filter((j) => now - j.timestamp < 10000);
    this.recentJoins.push({ userId: member.id, timestamp: now });

    // 10 saniyede 5 veya daha fazla hesap katıldıysa RAID MODU tetiklenir!
    if (this.recentJoins.length >= 5 && !this.isRaidActive) {
      this.isRaidActive = true;
      this.raidEndTime = now + 60000; // 60 saniye kalkan devrede

      console.warn(`[AntiRaid] 🚨🚨 RAID SALDIRISI TESPİT EDİLDİ! Sunucu kalkanı aktif! (${guild.name})`);

      const logChannel = guild.channels.cache.find(
        (c: any) => c.name.includes('mod-log') || c.name.includes('yetkili')
      ) as TextChannel | undefined;

      if (logChannel) {
        const raidEmbed = new EmbedBuilder()
          .setTitle('🚨🚨 ACİL: RAID SALDIRISI ALGILANDI! 🛡️')
          .setDescription(
            `Son 10 saniyede **${this.recentJoins.length}** hesap peş peşe sunucuya katıldı!\n\n` +
            `🔒 **ALINAN ACİL KORUMA ÖNLEMLERİ:**\n` +
            `> • **Anti-Raid Koruma Kalkanı 60 saniye boyunca devrede.**\n` +
            `> • Yeni oluşturulan (< 3 günlük) sahte bot hesapları otomatik atılacaktır (Auto-Kick).\n` +
            `> • Yetkililer lütfen sunucuyu kontrol etsin!`
          )
          .setColor('#ED4245')
          .setFooter({ text: 'Nights Guard • Anti-Raid Savunma Sistemi' })
          .setTimestamp();

        await logChannel.send({
          content: '🚨 @here **DİKKAT: Sunucuya toplu raid girişi tespit edildi!**',
          embeds: [raidEmbed],
        }).catch(() => {});
      }
    }

    // Kalkan aktifken katılan yeni ve şüpheli hesapları kontrol et
    if (this.isRaidActive) {
      if (now > this.raidEndTime) {
        this.isRaidActive = false;
      } else {
        const accountAgeDays = (now - member.user.createdTimestamp) / (1000 * 60 * 60 * 24);
        if (accountAgeDays < 3) {
          // 3 günden yeni şüpheli raid hesabı -> Anında At!
          try {
            await member.kick('Nights Guard: Raid saldırısı sırasında şüpheli yeni bot hesabı tespiti.');
            console.log(`[AntiRaid] 🥾 Şüpheli hesap atıldı: ${member.user.tag} (Hesap yaşı: ${accountAgeDays.toFixed(1)} gün)`);
            return true; // Raid botu atıldı
          } catch (e) {}
        }
      }
    }

    return false;
  }

  /**
   * YENİ ÜYEYE DM'DEN HARİKA BİR HOŞ GELDİN KARTI GÖNDERME
   */
  public static async sendWelcomeDM(member: GuildMember): Promise<void> {
    try {
      const guild = member.guild;
      const channels = await guild.channels.fetch();

      const kurallar = channels.find((c: any) => c && c.name.includes('kural'));
      const genelSohbet = channels.find((c: any) => c && c.name.includes('genel-sohbet') || c?.name.includes('sohbet'));
      const kayitOnay = channels.find((c: any) => c && c.name.includes('kayit'));
      const boostKanal = channels.find((c: any) => c && c.name.includes('server-boost') || c?.name.includes('boost'));
      const sesBilgi = channels.find((c: any) => c && c.name.includes('ses-bilgi'));

      const kurallarLink = kurallar ? `<#${kurallar.id}>` : '#kurallar';
      const sohbetLink = genelSohbet ? `<#${genelSohbet.id}>` : '#genel-sohbet';
      const kayitLink = kayitOnay ? `<#${kayitOnay.id}>` : '#kayıt-onay';
      const boostLink = boostKanal ? `<#${boostKanal.id}>` : '#server-boost';
      const sesLink = sesBilgi ? `<#${sesBilgi.id}>` : '`➕︱Oda Oluştur`';

      const welcomeEmbed = new EmbedBuilder()
        .setTitle(`🌙 ${guild.name.toUpperCase()} AİLESİNE HOŞ GELDİN! ✨`)
        .setDescription(
          `Selam <@${member.id}> (**${member.user.username}**)! Aramıza katıldığın için çok mutluyuz. 🎉\n\n` +
          `Nights; kaliteli sohbetlerin, gece muhabbetlerinin, anime izleme gecelerinin ve rekabetçi oyun lobilerinin buluşma noktasıdır.\n\n` +
          `### 🗺️ Sunucuda İlk Adımların:\n` +
          `• 📜 **Kurallar:** Sunucu huzurumuz için lütfen ${kurallarLink} kanalına göz at.\n` +
          `• 🛡️ **Kayıt:** ${kayitLink} kanalından kaydını tamamlayıp sunucudaki tüm odaların kilidini açabilirsin.\n` +
          `• 💬 **Sohbet:** Hemen ${sohbetLink} kanalında bir "selam" ver, sıcak topluluğumuzla tanış!\n` +
          `• 🎙️ **Özel Ses Odaları:** ${sesLink} ile kendine özel 384 Kbps stüdyo ses odanı açabilir veya sinema/oyun lobilerine katılabilirsin.\n` +
          `• 💎 **Server Boost:** ${boostLink} kanalını inceleyerek sunucumuza takviye basabilir, özel renkli rol, 10.000 Coin ve 3x çekiliş hakkı kazanabilirsin!\n` +
          `• 🎮 **Eğlence & Oyunlar:** \`#kelime-oyunu\` ve \`#sayi-saymaca\` kanallarında rekorlar kır, Nights Coin kazan!\n\n` +
          `👑 *Keyifli ve unutulmaz anlar geçirmeni dileriz!*`
        )
        .setColor('#8B5CF6')
        .setThumbnail(guild.iconURL() || member.user.displayAvatarURL())
        .setFooter({ text: `${guild.name} Topluluğu • Made by erencix` })
        .setTimestamp();

      const bannerPath = path.resolve(process.cwd(), 'assets/nights_boost_banner.png');
      if (fs.existsSync(bannerPath)) {
        const attachment = new AttachmentBuilder(bannerPath, { name: 'welcome_banner.png' });
        welcomeEmbed.setImage('attachment://welcome_banner.png');
        await member.send({ embeds: [welcomeEmbed], files: [attachment] });
      } else {
        await member.send({ embeds: [welcomeEmbed] });
      }

      console.log(`[WelcomeDM] 📨 ${member.user.tag} kullanıcısına özel karşılama DM'si başarıyla iletildi!`);
    } catch (err: any) {
      // Üyenin DM'leri kapalıysa DiscordAPIError[50007] döner, sessizce geçilir
      console.log(`[WelcomeDM] ℹ️ ${member.user.tag} kullanıcısının DM kutusu kapalı olduğu için mesaj gönderilemedi.`);
    }
  }

  /**
   * ANTİ-MASS BAN KORUMASI:
   * Bir yönetici 10 dakika içinde 2'den fazla kişiyi banlarsa, 3. işlemde tüm yetkileri alınır!
   * "3. de atılırsınız erencix den izin alın"
   */
  public static async handleBanSecurity(guild: Guild, bannedUser: User): Promise<void> {
    try {
      // Audit logların Discord tarafında işlenmesi için kısa bir bekleme
      await new Promise((resolve) => setTimeout(resolve, 800));

      const logs = await guild.fetchAuditLogs({
        type: AuditLogEvent.MemberBanAdd,
        limit: 5,
      });

      const entry = logs.entries.find(
        (e) => e.target?.id === bannedUser.id && Date.now() - e.createdTimestamp < 15000
      );

      if (!entry || !entry.executor) return;
      const executor = entry.executor;

      // Botun kendisi veya erencix veya sunucu kurucusu muaf
      if (executor.id === guild.client.user?.id) return;
      if (executor.id === this.OWNER_ID || executor.id === guild.ownerId) return;

      const now = Date.now();
      const records = (this.modActionTracker.get(executor.id) || []).filter(
        (r) => now - r.timestamp < 10 * 60 * 1000
      );

      records.push({ targetId: bannedUser.id, type: 'ban', timestamp: now });
      this.modActionTracker.set(executor.id, records);

      const count = records.length;
      console.log(`[AntiMassBan] 🚨 ${executor.tag} ban işlemi uyguladı (${bannedUser.tag}) - 10 Dk içindeki sayı: ${count}/2`);

      const logChannel = guild.channels.cache.find(
        (c: any) => c && c.name.includes('mod-log') && c.isTextBased()
      ) as TextChannel | undefined;

      if (count === 1) {
        if (logChannel) {
          await logChannel.send({
            content: `🛡️ **[Yetkili Denetimi]** <@${executor.id}> bir üyeyi banladı (${bannedUser.tag}).\n> 📊 *10 dakikalık güvenlik limiti: 1/2*`,
          }).catch(() => {});
        }
      } else if (count === 2) {
        if (logChannel) {
          await logChannel.send({
            content: `⚠️ **[DİKKAT - YETKİLİ LİMİT SINIRINDA]** <@${executor.id}> 10 dakika içinde 2. kişiyi banladı!\n> 🚨 **UYARI:** 1 kişi daha banlarsanız veya atarsanız **3. işlemde tüm yetkileriniz anında alınacaktır!** (erencix'ten izin almalısınız)`,
          }).catch(() => {});
        }
      } else if (count >= 3) {
        // 3. İŞLEM! YETKİLERİ AL VE ENGELLE!
        console.warn(`[AntiMassBan] ⛔ LIMIT AŞIMI! ${executor.tag} 3. ban işlemini gerçekleştirdi. Yetkileri alınıyor!`);

        // 1. Yetkilinin rollerini al
        let modMember: GuildMember | null = null;
        try {
          modMember = await guild.members.fetch(executor.id);
        } catch {}

        if (modMember) {
          const botHighest = guild.members.me?.roles.highest.position || 0;
          const dangerousRoles = modMember.roles.cache.filter(
            (r) => r.id !== guild.id && !r.managed && r.position < botHighest
          );

          if (dangerousRoles.size > 0) {
            await modMember.roles.remove(dangerousRoles, 'Nights Guard: Limit aşımı (3. işlem) - erencix izni gerekiyor').catch(() => {});
          }
          await modMember.timeout(60 * 60 * 1000, 'Nights Guard: 2+ Ban Limit Aşımı').catch(() => {});
        }

        // 2. Mağdurun banını geri aç (Unban)
        try {
          await guild.members.unban(bannedUser.id, 'Nights Guard: Seri ban engeli - mağdur affedildi.');
          console.log(`[AntiMassBan] 🔓 Mağdurun banı geri açıldı: ${bannedUser.tag}`);
        } catch (unbanErr: any) {
          console.warn('[AntiMassBan] Unban başarısız:', unbanErr.message);
        }

        // 3. Sunucuya ve Mod Log'a Özel Alarm Mesajı Gönder
        const alertEmbed = new EmbedBuilder()
          .setTitle('🚨🚨 ACİL GÜVENLİK ALARMI: YÖNETİCİ LİMİT AŞIMI! 🛡️')
          .setDescription(
            `⛔ <@${executor.id}> (**${executor.tag}**), 10 dakika içinde **2'den fazla kişiyi banladı / attı!**\n\n` +
            `👉 **3. de atılırsınız, erencix'ten izin alın!** 👈\n\n` +
            `🔒 **UYGULANAN KORUMA ÖNLEMLERİ:**\n` +
            `> • Yetkilinin tüm rolleri ve yetkileri güvenlik kalkanı tarafından **sıfırlandı**.\n` +
            `> • Yetkili 1 saat boyunca susturuldu (Timeout).\n` +
            `> • Banlanan üyenin (<@${bannedUser.id}>) banı **otomatik olarak kaldırıldı**.\n` +
            `> • Yetkilerin iadesi için sunucu kurucusu <@${this.OWNER_ID}> (erencix) ile görüşülmelidir.`
          )
          .setColor('#ED4245')
          .setFooter({ text: 'Nights Guard • Anti-Raid & Mass-Ban Shield' })
          .setTimestamp();

        if (logChannel) {
          await logChannel.send({
            content: `🚨 @here **GÜVENLİK MÜDAHALESİ: <@${executor.id}> yetki limitini aştı!**`,
            embeds: [alertEmbed],
          }).catch(() => {});
        }

        // Genel sohbete de kısa uyarı at
        const generalCh = guild.channels.cache.find(
          (c: any) => c && c.name.includes('genel-sohbet') && c.isTextBased()
        ) as TextChannel | undefined;
        if (generalCh) {
          await generalCh.send({
            content: `⛔ **GÜVENLİK UYARISI:** <@${executor.id}> 2'den fazla kişiyi banladığı için yetkileri alındı! **3. de atılırsınız erencix den izin alın!**`,
          }).catch(() => {});
        }

        // Yetkiliye DM ile bildir
        await executor.send({
          content: `⛔ **Nights Guard Güvenlik Uyarısı:**\nSunucuda 10 dakika içinde 2'den fazla kişiyi banladığınız veya attığınız tespit edildi!\n\n👉 **3. de atılırsınız erencix den izin alın!**\n\nTüm yetkileriniz geri alınmış olup sunucu korumaya alınmıştır.`,
        }).catch(() => {});
      }
    } catch (err: any) {
      console.error('[AntiMassBan] Hata:', err.message);
    }
  }

  /**
   * ANTİ-MASS KICK KORUMASI:
   * Bir yönetici 10 dakika içinde 2'den fazla kişiyi atarsa, 3. işlemde tüm yetkileri alınır!
   */
  public static async handleKickSecurity(
    guild: Guild,
    kickedMember: GuildMember | PartialGuildMember
  ): Promise<void> {
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const logs = await guild.fetchAuditLogs({
        type: AuditLogEvent.MemberKick,
        limit: 5,
      });

      const entry = logs.entries.find(
        (e) => e.target?.id === kickedMember.id && Date.now() - e.createdTimestamp < 15000
      );

      if (!entry || !entry.executor) return; // Kick değil, gönüllü ayrılma
      const executor = entry.executor;

      if (executor.id === guild.client.user?.id) return;
      if (executor.id === this.OWNER_ID || executor.id === guild.ownerId) return;

      const now = Date.now();
      const records = (this.modActionTracker.get(executor.id) || []).filter(
        (r) => now - r.timestamp < 10 * 60 * 1000
      );

      records.push({ targetId: kickedMember.id, type: 'kick', timestamp: now });
      this.modActionTracker.set(executor.id, records);

      const count = records.length;
      console.log(`[AntiMassKick] 🚨 ${executor.tag} kick işlemi uyguladı (${kickedMember.id}) - 10 Dk içindeki sayı: ${count}/2`);

      const logChannel = guild.channels.cache.find(
        (c: any) => c && c.name.includes('mod-log') && c.isTextBased()
      ) as TextChannel | undefined;

      if (count === 1) {
        if (logChannel) {
          await logChannel.send({
            content: `🛡️ **[Yetkili Denetimi]** <@${executor.id}> bir üyeyi attı (Kick).\n> 📊 *10 dakikalık güvenlik limiti: 1/2*`,
          }).catch(() => {});
        }
      } else if (count === 2) {
        if (logChannel) {
          await logChannel.send({
            content: `⚠️ **[DİKKAT - YETKİLİ LİMİT SINIRINDA]** <@${executor.id}> 10 dakika içinde 2. kişiyi attı (Kick)!\n> 🚨 **UYARI:** 1 kişi daha banlarsanız veya atarsanız **3. işlemde tüm yetkileriniz anında alınacaktır!** (erencix'ten izin almalısınız)`,
          }).catch(() => {});
        }
      } else if (count >= 3) {
        console.warn(`[AntiMassKick] ⛔ LIMIT AŞIMI! ${executor.tag} 3. kick işlemini gerçekleştirdi. Yetkileri alınıyor!`);

        let modMember: GuildMember | null = null;
        try {
          modMember = await guild.members.fetch(executor.id);
        } catch {}

        if (modMember) {
          const botHighest = guild.members.me?.roles.highest.position || 0;
          const dangerousRoles = modMember.roles.cache.filter(
            (r) => r.id !== guild.id && !r.managed && r.position < botHighest
          );

          if (dangerousRoles.size > 0) {
            await modMember.roles.remove(dangerousRoles, 'Nights Guard: Limit aşımı (3. kick) - erencix izni gerekiyor').catch(() => {});
          }
          await modMember.timeout(60 * 60 * 1000, 'Nights Guard: 2+ Kick Limit Aşımı').catch(() => {});
        }

        const alertEmbed = new EmbedBuilder()
          .setTitle('🚨🚨 ACİL GÜVENLİK ALARMI: YÖNETİCİ KICK LİMİT AŞIMI! 🛡️')
          .setDescription(
            `⛔ <@${executor.id}> (**${executor.tag}**), 10 dakika içinde **2'den fazla kişiyi attı / banladı!**\n\n` +
            `👉 **3. de atılırsınız, erencix'ten izin alın!** 👈\n\n` +
            `🔒 **UYGULANAN KORUMA ÖNLEMLERİ:**\n` +
            `> • Yetkilinin tüm rolleri ve yetkileri güvenlik kalkanı tarafından **sıfırlandı**.\n` +
            `> • Yetkili 1 saat boyunca susturuldu (Timeout).\n` +
            `> • Yetkilerin iadesi için sunucu kurucusu <@${this.OWNER_ID}> (erencix) ile görüşülmelidir.`
          )
          .setColor('#ED4245')
          .setFooter({ text: 'Nights Guard • Anti-Raid & Mass-Kick Shield' })
          .setTimestamp();

        if (logChannel) {
          await logChannel.send({
            content: `🚨 @here **GÜVENLİK MÜDAHALESİ: <@${executor.id}> kick limitini aştı!**`,
            embeds: [alertEmbed],
          }).catch(() => {});
        }

        const generalCh = guild.channels.cache.find(
          (c: any) => c && c.name.includes('genel-sohbet') && c.isTextBased()
        ) as TextChannel | undefined;
        if (generalCh) {
          await generalCh.send({
            content: `⛔ **GÜVENLİK UYARISI:** <@${executor.id}> 2'den fazla kişiyi attığı için yetkileri alındı! **3. de atılırsınız erencix den izin alın!**`,
          }).catch(() => {});
        }

        await executor.send({
          content: `⛔ **Nights Guard Güvenlik Uyarısı:**\nSunucuda 10 dakika içinde 2'den fazla kişiyi banladığınız veya attığınız tespit edildi!\n\n👉 **3. de atılırsınız erencix den izin alın!**\n\nTüm yetkileriniz geri alınmış olup sunucu korumaya alınmıştır.`,
        }).catch(() => {});
      }
    } catch (err: any) {
      console.error('[AntiMassKick] Hata:', err.message);
    }
  }
}
