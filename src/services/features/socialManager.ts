import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  User,
  Message,
  ButtonInteraction,
  MessageFlags,
} from 'discord.js';
import { PersistentStore } from '../storage/persistentStore';

export interface MarriageRecord {
  user1: string;
  user2: string;
  marriedAt: number; // timestamp
}

export class SocialManager {
  private static marriages: MarriageRecord[] = [];
  private static pendingProposals = new Map<string, { senderId: string; targetId: string; expiresAt: number }>();
  private static loaded = false;

  public static load(): void {
    if (this.loaded) return;
    this.marriages = PersistentStore.safeReadJson<MarriageRecord[]>(
      'marriages.json',
      ['assets/marriages.json'],
      []
    );
    this.loaded = true;

    PersistentStore.registerFlushHandler('SocialManager', () => {
      this.save();
    });
  }

  private static save(): void {
    if (!this.loaded) return;
    PersistentStore.atomicSaveJson('marriages.json', this.marriages);
  }

  public static getMarriage(userId: string): { partnerId: string; marriedAt: number; days: number } | null {
    this.load();
    const record = this.marriages.find((m) => m.user1 === userId || m.user2 === userId);
    if (!record) return null;

    const partnerId = record.user1 === userId ? record.user2 : record.user1;
    const days = Math.floor((Date.now() - record.marriedAt) / (1000 * 60 * 60 * 24));
    return { partnerId, marriedAt: record.marriedAt, days };
  }

  public static async propose(
    sender: User,
    target: User,
    message: Message
  ): Promise<void> {
    this.load();

    if (sender.id === target.id) {
      await message.reply('❌ Kendinizle evlenemezsiniz!').catch(() => {});
      return;
    }

    if (target.bot) {
      await message.reply('❌ Botlarla evlenemezsiniz kral!').catch(() => {});
      return;
    }

    const senderMarriage = this.getMarriage(sender.id);
    if (senderMarriage) {
      await message.reply(`❌ Zaten <@${senderMarriage.partnerId}> ile evlisiniz! Boşanmak için: \`!bosan\``).catch(() => {});
      return;
    }

    const targetMarriage = this.getMarriage(target.id);
    if (targetMarriage) {
      await message.reply(`❌ <@${target.id}> zaten <@${targetMarriage.partnerId}> ile evli!`).catch(() => {});
      return;
    }

    const proposalKey = `${sender.id}_${target.id}`;
    this.pendingProposals.set(proposalKey, {
      senderId: sender.id,
      targetId: target.id,
      expiresAt: Date.now() + 60000,
    });

    const embed = new EmbedBuilder()
      .setTitle('💍 BİR EVLİLİK TEKLİFİ VAR!')
      .setDescription(
        `💖 <@${target.id}>, <@${sender.id}> sana bütün kalbiyle bir ömür boyu mutluluk vaat eden bir evlilik teklifinde bulundu!\n\n` +
        `Bu teklifi kabul ediyor musun?`
      )
      .setColor('#FF69B4')
      .setThumbnail('https://media.giphy.com/media/26vUxJ9rqfwuIEkTu/giphy.gif')
      .setFooter({ text: 'Teklif 60 saniye boyunca geçerlidir • Nights Social' })
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`marry_accept:${sender.id}:${target.id}`)
        .setLabel('💍 Evet, Kabul Ediyorum!')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`marry_reject:${sender.id}:${target.id}`)
        .setLabel('💔 Hayır')
        .setStyle(ButtonStyle.Danger)
    );

    await message.reply({ embeds: [embed], components: [row] }).catch(() => {});
  }

  public static async handleButton(interaction: ButtonInteraction): Promise<boolean> {
    if (!interaction.customId.startsWith('marry_')) return false;

    const parts = interaction.customId.split(':');
    const action = parts[0];
    const senderId = parts[1];
    const targetId = parts[2];

    if (interaction.user.id !== targetId) {
      await interaction.reply({
        content: '⛔ Bu teklif sizin için yapılmadı!',
        flags: MessageFlags.Ephemeral,
      });
      return true;
    }

    if (action === 'marry_reject') {
      const rejectEmbed = new EmbedBuilder()
        .setTitle('💔 Teklif Reddedildi...')
        .setDescription(`<@${targetId}>, <@${senderId}> kişisinin evlilik teklifini nazikçe geri çevirdi.`)
        .setColor('#ED4245');

      await interaction.update({ embeds: [rejectEmbed], components: [] });
      return true;
    }

    if (action === 'marry_accept') {
      this.load();
      this.marriages.push({
        user1: senderId,
        user2: targetId,
        marriedAt: Date.now(),
      });
      this.save();

      const acceptEmbed = new EmbedBuilder()
        .setTitle('🎉 MUTLULUKLAR! EVLENDİLER! 💍')
        .setDescription(
          `🎊 Tebrikler! <@${senderId}> ve <@${targetId}> artık resmen evli bir çift!\n\n` +
          `> 📅 **Evlilik Tarihi:** <t:${Math.floor(Date.now() / 1000)}:D>\n` +
          `> 📜 Evlilik cüzdanınızı görmek için: \`!evlilik\``
        )
        .setColor('#FF1493')
        .setImage('https://media.giphy.com/media/DyQrKMpqkAhNHZ1iWe/giphy.gif')
        .setFooter({ text: 'Nights Evlilik Dairesi • Made by erencix' })
        .setTimestamp();

      await interaction.update({ embeds: [acceptEmbed], components: [] });
      return true;
    }

    return false;
  }

  public static divorce(userId: string): { success: boolean; message: string } {
    this.load();
    const idx = this.marriages.findIndex((m) => m.user1 === userId || m.user2 === userId);
    if (idx === -1) {
      return { success: false, message: 'Şu anda evli değilsiniz!' };
    }

    const partnerId = this.marriages[idx].user1 === userId ? this.marriages[idx].user2 : this.marriages[idx].user1;
    this.marriages.splice(idx, 1);
    this.save();

    return {
      success: true,
      message: `💔 <@${partnerId}> ile olan evliliğinizi resmi olarak sonlandırdınız. Artık bekarsınız.`,
    };
  }

  public static getMarriageEmbed(targetUser: User): EmbedBuilder {
    const info = this.getMarriage(targetUser.id);
    if (!info) {
      return new EmbedBuilder()
        .setTitle(`📜 Evlilik Cüzdanı • ${targetUser.displayName}`)
        .setDescription(`> 💔 **Durum:** Bekar\n> Evlenmek için birine \`!evlen @kullanıcı\` yazabilirsin!`)
        .setColor('#95A5A6')
        .setThumbnail(targetUser.displayAvatarURL());
    }

    return new EmbedBuilder()
      .setTitle(`💖 RESMİ EVLİLİK CÜZDANI`)
      .setDescription(
        `> 👰🤵 **Çift:** <@${targetUser.id}> & <@${info.partnerId}>\n` +
        `> 📅 **Evlilik Tarihi:** <t:${Math.floor(info.marriedAt / 1000)}:D>\n` +
        `> ⏳ **Birlikte Geçen Süre:** **${info.days} gün** (${info.days === 0 ? 'Bugün evlendiler! 🎉' : `${info.days} gündür birlikteler ✨`})\n` +
        `> 💍 **Durum:** Sonsuza Dek Birlikte! 💕`
      )
      .setColor('#FF69B4')
      .setThumbnail('https://media.giphy.com/media/26vUxJ9rqfwuIEkTu/giphy.gif')
      .setFooter({ text: 'Nights Evlilik Sicili • Made by erencix' })
      .setTimestamp();
  }

  // GIF İfadeleri
  public static readonly GIFS = {
    hug: [
      'https://media.giphy.com/media/od5H3PmEG5EVq/giphy.gif',
      'https://media.giphy.com/media/lrr9rHuoJOE0w/giphy.gif',
      'https://media.giphy.com/media/VGACXbkf0AeGs/giphy.gif',
    ],
    slap: [
      'https://media.giphy.com/media/Gf3AUz3eBNbTW/giphy.gif',
      'https://media.giphy.com/media/jLeyZWgtwWP2U/giphy.gif',
      'https://media.giphy.com/media/Zau0yrl15jDいただ/giphy.gif',
    ],
    kiss: [
      'https://media.giphy.com/media/FqBTvSNjNzeZG/giphy.gif',
      'https://media.giphy.com/media/zkppEMFvRX5FC/giphy.gif',
      'https://media.giphy.com/media/flmwZUuJnMnWE/giphy.gif',
    ],
    coffee: [
      'https://media.giphy.com/media/13HgwGsXF0aiGY/giphy.gif',
      'https://media.giphy.com/media/hPTZgtzfRIB5Nfb5rL/giphy.gif',
    ],
  };

  public static getActionEmbed(action: 'hug' | 'slap' | 'kiss' | 'coffee', sender: User, target: User): EmbedBuilder {
    const list = this.GIFS[action] || this.GIFS.hug;
    const gif = list[Math.floor(Math.random() * list.length)];

    const configs = {
      hug: {
        title: '🤗 Sımsıkı Sarılma!',
        desc: `💖 <@${sender.id}>, <@${target.id}> kişisine sevgiyle sımsıkı sarıldı!`,
        color: '#FFB6C1',
      },
      slap: {
        title: '👋 Şlak! Okkalı Bir Tokat!',
        desc: `💥 <@${sender.id}>, <@${target.id}> suratına okkalı bir tokat patlattı!`,
        color: '#E74C3C',
      },
      kiss: {
        title: '💋 Tatlı Bir Öpücük!',
        desc: `✨ <@${sender.id}>, <@${target.id}> yanağına tatlı bir öpücük kondurdu!`,
        color: '#FF1493',
      },
      coffee: {
        title: '☕ Sıcak Bir Kahve İkramı!',
        desc: `☕ <@${sender.id}>, <@${target.id}> için sıcacık dumanı tüten bir kahve ısmarladı! Afiyet olsun!`,
        color: '#D35400',
      },
    };

    const cfg = configs[action];
    return new EmbedBuilder()
      .setTitle(cfg.title)
      .setDescription(cfg.desc)
      .setColor(cfg.color as `#${string}`)
      .setImage(gif)
      .setFooter({ text: 'Nights Sosyal İfadeler • Made by erencix' })
      .setTimestamp();
  }
}
