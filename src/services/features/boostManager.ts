import {
  Guild,
  Client,
  ChannelType,
  PermissionFlagsBits,
  TextChannel,
  EmbedBuilder,
  AttachmentBuilder,
  GuildMember,
  Message,
  MessageType,
} from 'discord.js';
import path from 'path';
import fs from 'fs';
import { EconomyManager } from './economyManager';

export class BoostManager {
  private static ran = false;

  public static async init(client: Client): Promise<void> {
    if (this.ran) return;
    this.ran = true;

    for (const [_, guild] of client.guilds.cache) {
      try {
        await this.ensureBoostChannel(guild, client);
      } catch (err: any) {
        console.error(`[BoostManager] ${guild.name} için boost kanalı kurulum hatası:`, err.message);
      }
    }
  }

  public static async ensureBoostChannel(guild: Guild, client: Client): Promise<TextChannel | null> {
    const everyoneRole = guild.roles.everyone;

    // 1. Duyuru kanalını ve kategorisini bul
    const duyuruCh = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildText && (c.name.includes('duyuru') || c.name.includes('announcement'))
    ) as TextChannel | undefined;

    const parentCategory =
      duyuruCh?.parent ||
      guild.channels.cache.find(
        (c) =>
          c.type === ChannelType.GuildCategory &&
          (c.name.includes('BİLGİ') || c.name.includes('DUYURU') || c.name.includes('GİRİŞ'))
      );

    const targetPosition = duyuruCh ? duyuruCh.position + 1 : undefined;

    // 2. '🚀・server-boost' kanalını bul veya oluştur
    let boostChannel = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildText && (c.name.includes('server-boost') || c.name.includes('boost'))
    ) as TextChannel | undefined;

    const overwrites = [
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
      {
        id: client.user?.id || guild.members.me?.id || '',
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.EmbedLinks,
          PermissionFlagsBits.AttachFiles,
        ],
      },
    ];

    if (!boostChannel) {
      console.log(`[BoostManager] 🚀 ${guild.name} için '🚀・server-boost' kanalı oluşturuluyor...`);
      boostChannel = await guild.channels.create({
        name: '🚀・server-boost',
        type: ChannelType.GuildText,
        parent: parentCategory?.id,
        position: targetPosition,
        permissionOverwrites: overwrites,
      });
    } else {
      // Kanal varsa izinleri garantile (Kimse yazamasın!)
      await boostChannel.permissionOverwrites.set(overwrites).catch(() => {});
      if (parentCategory && boostChannel.parentId !== parentCategory.id) {
        await boostChannel.setParent(parentCategory.id).catch(() => {});
      }
    }

    // 3. Bilgilendirme ve Ayrıcalıklar Embedini Gönder
    if (boostChannel) {
      await this.sendBoostShowcase(boostChannel, guild, client);
    }

    return boostChannel;
  }

  private static async sendBoostShowcase(channel: TextChannel, guild: Guild, client: Client): Promise<void> {
    try {
      const msgs = await channel.messages.fetch({ limit: 15 }).catch(() => null);
      const alreadyHasShowcase =
        msgs && msgs.some((m) => m.author.id === client.user?.id && m.embeds.length > 0 && m.embeds[0].title?.includes('BOOSTER AYRICALIKLARI'));

      if (alreadyHasShowcase) return;

      const bannerPath = path.resolve(process.cwd(), 'assets/nights_boost_banner.png');
      const hasBanner = fs.existsSync(bannerPath);

      const embed = new EmbedBuilder()
        .setTitle('🔮 NIGHTS SERVER BOOSTER VIP AYRICALIKLARI & ÖDÜLLERİ 🚀')
        .setDescription(
          `Sunucumuza **Nitro Boost** basarak Nights topluluğuna güç katan ve seviyemizi yükselten değerli üyelerimiz için hazırlanan **özel ayrıcalıklar, roller ve hediyeler** listesidir!\n\n` +
          `### 💎 1. Server Booster Özel Rolü & Discord Rozeti\n` +
          `> Sunucu üye listesinde yetkililerin hemen altında, en üst sırada parıldayan mor **Server Booster** rolü ve Discord profilinizde sonsuza dek gelişen parıltılı **Nitro Booster Rozeti**!\n\n` +
          `### 🎨 2. Kişiye Özel Renkli Rol Hakkı\n` +
          `> İstediğiniz isimde ve dilediğiniz özel renkte (*örneğin neon mor, buz mavisi, altın sarısı vb.*) **yalnızca size ait özel bir rol** oluşturulur ve adınıza tanımlanır!\n\n` +
          `### 💰 3. +10.000 Nights Coin & 3x Günlük Kazanç Çarpanı\n` +
          `> Sunucuya boost bastığınız anda hesabınıza anında **+10.000 Nights Coin** hediye aktarılır! Ayrıca günlük para toplama (\`!gunluk\`) ödülünde **3 Kat Fazla Para** kazanırsınız.\n\n` +
          `### 🔊 4. 384 Kbps Ultra HD Ses & 1080p 60FPS Canlı Yayın\n` +
          `> Tüm ses odalarımızda stüdyo kalitesinde **384 Kbps kristal netliğinde ses** ve gecikmesiz, tam çözünürlüklü **1080p 60 FPS ekran paylaşımı & yayın** yapma özgürlüğü!\n\n` +
          `### 🎟️ 5. Çekilişlerde (Giveaway) 3x Kazanma Şansı!\n` +
          `> Sunucumuzda düzenlenen tüm Nitro, Valorant VP, Spotify ve özel ödül çekilişlerinde adınız listeye **3 Kere** yazılarak kazanma şansınız 3 katına çıkarılır!\n\n` +
          `### 📸 6. Sohbette Medya, Resim & Link Paylaşım Özgürlüğü\n` +
          `> Normal üyelere kapalı olan genel sohbet kanallarında resim, video, GIF ve bağlantı gönderme izni anında açılır.\n\n` +
          `### 👑 7. Gizli Booster Lounge VIP Odası\n` +
          `> Yalnızca sunucu yöneticileri ve boosterların erişebildiği gizli VIP sohbet odasına sınırsız erişim hakkı!\n\n` +
          `### ⚡ 8. %50 Daha Hızlı Seviye Atlama (1.5x XP Bonusu)\n` +
          `> Sohbette yazdığınız her mesajda ve seste geçirdiğiniz sürede **%50 daha fazla seviye XP'si** kazanırsınız.\n\n` +
          `──────────────────────────────────────────────\n` +
          `> 💡 **Nasıl Boost Basılır?** Sunucu ismine tıklayıp **"Sunucu Takviyesi"** seçeneğini seçerek sunucumuza takviye basabilir ve tüm bu ayrıcalıklara anında sahip olabilirsiniz!`
        )
        .setColor('#8B5CF6')
        .setThumbnail(guild.iconURL() || client.user?.displayAvatarURL() || null)
        .setFooter({ text: 'Nights Community Booster Program • Made by erencix' })
        .setTimestamp();

      if (hasBanner) {
        const attachment = new AttachmentBuilder(bannerPath, { name: 'nights_boost_banner.png' });
        embed.setImage('attachment://nights_boost_banner.png');
        await channel.send({ embeds: [embed], files: [attachment] });
      } else {
        await channel.send({ embeds: [embed] });
      }

      console.log(`[BoostManager] ✅ #${channel.name} kanalına zengin Boost Ayrıcalıkları tablosu gönderildi!`);
    } catch (e: any) {
      console.error('[BoostManager] Vitrin embedi gönderilirken hata:', e.message);
    }
  }

  /**
   * Bir üye sunucuya boost bastığında veya seviye atladığında tetiklenir
   */
  public static async handleMemberBoost(member: GuildMember | null, client: Client): Promise<void> {
    if (!member || !member.guild) return;

    const guild = member.guild;
    console.log(`[BoostManager] 🎉 YENİ BOOST ALGILANDI: ${member.user.tag} (${member.id})`);

    // 1. Üyeye 10.000 Nights Coin hediye tanımla
    try {
      EconomyManager.addCoins(member.id, 10000);
    } catch (e) {}

    // 2. '🚀・server-boost' kanalını bul
    const boostChannel = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildText && (c.name.includes('server-boost') || c.name.includes('boost'))
    ) as TextChannel | undefined;

    if (!boostChannel) return;

    const bannerPath = path.resolve(process.cwd(), 'assets/nights_boost_banner.png');
    const hasBanner = fs.existsSync(bannerPath);

    const boostCount = guild.premiumSubscriptionCount || 1;
    const boostTier = guild.premiumTier;

    const celebrationEmbed = new EmbedBuilder()
      .setTitle('🚀 BÜYÜK TEŞEKKÜRLER! YENİ SUNUCU BOOSTU! 🔮')
      .setDescription(
        `Harikasın <@${member.id}>! Sunucumuza **BOOST** basarak Nights topluluğunu bir üst kademeye taşıdın! 💖✨\n\n` +
        `🎁 **HESABINA ANINDA TANIMLANAN HEDİYELER:**\n` +
        `> 💰 **+10.000 Nights Coin** cüzdanına aktarıldı!\n` +
        `> 💎 **Server Booster** özel rolü ve rozeti aktif edildi.\n` +
        `> 🎨 **Özel Renkli Rol Hakkı** kazandın! (İstediğin rol adı ve rengini yetkililere iletebilirsin)\n` +
        `> 🎟️ Tüm çekilişlerde **3x Kazanma Şansı** tanımlandı.\n` +
        `> 📸 Sohbette resim, video ve GIF paylaşım iznin açıldı.\n` +
        `> ⚡ Seviye XP kazanımlarında **%50 Bonus (1.5x XP)** devrede!\n\n` +
        `📊 **Sunucu Durumu:** Toplam **${boostCount}** Takviye • **Seviye ${boostTier}**\n\n` +
        `*Nights ailesine verdiğin bu muhteşem destek için sonsuz teşekkür ederiz!* 👑`
      )
      .setColor('#F47FFF')
      .setThumbnail(member.user.displayAvatarURL())
      .setFooter({ text: `Nights Booster Club • ${member.user.tag}` })
      .setTimestamp();

    try {
      if (hasBanner) {
        const attachment = new AttachmentBuilder(bannerPath, { name: 'nights_boost_banner.png' });
        celebrationEmbed.setImage('attachment://nights_boost_banner.png');
        await boostChannel.send({
          content: `🎉 **TEBRİKLER & TEŞEKKÜRLER <@${member.id}>!** 🚀`,
          embeds: [celebrationEmbed],
          files: [attachment],
        });
      } else {
        await boostChannel.send({
          content: `🎉 **TEBRİKLER & TEŞEKKÜRLER <@${member.id}>!** 🚀`,
          embeds: [celebrationEmbed],
        });
      }
    } catch (e: any) {
      console.error('[BoostManager] Boost kutlama mesajı gönderilemedi:', e.message);
    }
  }

  /**
   * Discord System Boost Mesajlarını Yakalar
   */
  public static async handleSystemMessage(message: Message, client: Client): Promise<void> {
    if (!message.guild) return;

    const isBoostMsg =
      message.type === MessageType.GuildBoost ||
      message.type === MessageType.GuildBoostTier1 ||
      message.type === MessageType.GuildBoostTier2 ||
      message.type === MessageType.GuildBoostTier3;

    if (isBoostMsg) {
      const member = message.member || (await message.guild.members.fetch(message.author.id).catch(() => null));
      if (member) {
        await this.handleMemberBoost(member, client);
      }
    }
  }

  /**
   * GuildMemberUpdate Olayını Yakalar
   */
  public static async handleMemberUpdate(oldMember: GuildMember, newMember: GuildMember, client: Client): Promise<void> {
    // Üye yeni boost bastıysa
    const oldBoost = oldMember.premiumSince;
    const newBoost = newMember.premiumSince;

    if (!oldBoost && newBoost) {
      await this.handleMemberBoost(newMember, client);
    } else if (
      oldMember.premiumSinceTimestamp &&
      newMember.premiumSinceTimestamp &&
      newMember.premiumSinceTimestamp > oldMember.premiumSinceTimestamp
    ) {
      // Ekstra boost basıldıysa
      await this.handleMemberBoost(newMember, client);
    }
  }
}
