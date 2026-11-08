import {
  Guild,
  User,
  TextChannel,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
  ChannelType,
  PermissionFlagsBits,
} from 'discord.js';
import fs from 'fs';
import path from 'path';
import { AutoSecurityGuard } from './autoSecurityGuard';

interface ConfessionData {
  id: number;
  messageId: string;
  reactions: {
    love: string[]; // userIds
    dislike: string[];
    shock: string[];
  };
}

interface ConfessionStore {
  counter: number;
  confessions: Record<string, ConfessionData>; // messageId -> ConfessionData
}

export class ConfessionManager {
  private static filePath = path.resolve('assets/confessions.json');
  private static store: ConfessionStore = {
    counter: 0,
    confessions: {},
  };
  private static loaded = false;

  private static load() {
    if (this.loaded) return;
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.store = JSON.parse(raw);
      }
    } catch {
      this.store = { counter: 0, confessions: {} };
    }
    this.loaded = true;
  }

  private static save() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.filePath, JSON.stringify(this.store, null, 2), 'utf-8');
    } catch (e: any) {
      console.warn('[ConfessionManager] Kaydetme hatası:', e.message);
    }
  }

  public static async getConfessionChannel(guild: Guild): Promise<TextChannel | null> {
    try {
      const channels = await guild.channels.fetch();
      let ch = channels.find(
        (c) =>
          c &&
          c.isTextBased() &&
          (c.name.includes('itiraf') || c.name.includes('anonim'))
      ) as TextChannel | undefined;

      // Kanal bulunamazsa otomatik oluştur
      if (!ch) {
        const me = guild.members.me;
        if (me?.permissions.has(PermissionFlagsBits.ManageChannels)) {
          ch = await guild.channels.create({
            name: '🤫・itiraf-duvarı',
            type: ChannelType.GuildText,
            topic: 'Nights Topluluğu Anonim İtiraf Duvarı • /itiraf yazarak itirafta bulunabilirsiniz!',
            permissionOverwrites: [
              {
                id: guild.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
                deny: [PermissionFlagsBits.SendMessages], // Üyeler sadece butonlara tıklayabilir, itiraflar botla atılır
              },
            ],
          });
          console.log(`[ConfessionManager] #${ch.name} kanalı otomatik oluşturuldu.`);
        }
      }

      return ch || null;
    } catch {
      return null;
    }
  }

  public static async submit(
    guild: Guild,
    user: User,
    text: string
  ): Promise<{ success: boolean; message: string; channelId?: string }> {
    this.load();

    const cleanText = text.trim();
    if (cleanText.length < 5) {
      return { success: false, message: 'İtirafınız çok kısa! En az 5 karakter yazmalısınız.' };
    }
    if (cleanText.length > 1000) {
      return { success: false, message: 'İtirafınız 1000 karakter sınırını aşıyor!' };
    }

    // Küfür & Ağır Hakaret Filtresi
    if (AutoSecurityGuard.isProfane(cleanText)) {
      return {
        success: false,
        message: '❌ İtirafınız uygunsuz, ailevi veya ağır şahsi hakaret içerdiği için paylaşılamadı.',
      };
    }

    const channel = await this.getConfessionChannel(guild);
    if (!channel) {
      return {
        success: false,
        message: 'Sunucuda itiraf kanalı bulunamadı veya oluşturulamadı. Lütfen yöneticiye başvurun.',
      };
    }

    this.store.counter = (this.store.counter || 0) + 1;
    const confessionId = this.store.counter;

    const embed = new EmbedBuilder()
      .setTitle(`🤫 GİZLİ İTİRAF #${confessionId}`)
      .setDescription(`\`\`\`\n"${cleanText}"\n\`\`\``)
      .setColor('#8A2BE2')
      .setThumbnail('https://media.giphy.com/media/l41lFw057lAJQMwg0/giphy.gif')
      .addFields(
        {
          name: '🔒 Gizlilik Durumu',
          value: '`%100 Anonim` — Yazan kişinin kimliği sunucu üyelerine ve sohbete asla ifşa edilmez.',
          inline: true,
        },
        {
          name: '📅 Gönderim Tarihi',
          value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
          inline: true,
        }
      )
      .setFooter({ text: 'Nights İtiraf Duvarı • Sen de itirafta bulunmak için: /itiraf' })
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`confess_love:${confessionId}`)
        .setLabel('❤️ 0')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`confess_dislike:${confessionId}`)
        .setLabel('💔 0')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`confess_shock:${confessionId}`)
        .setLabel('😱 0')
        .setStyle(ButtonStyle.Secondary)
    );

    try {
      const sentMsg = await channel.send({ embeds: [embed], components: [row] });
      this.store.confessions[sentMsg.id] = {
        id: confessionId,
        messageId: sentMsg.id,
        reactions: {
          love: [],
          dislike: [],
          shock: [],
        },
      };
      this.save();

      return {
        success: true,
        message: `✅ İtirafınız gizli olarak <#${channel.id}> kanalına başarıyla iletildi! Kimliğiniz tamamen korunmaktadır.`,
        channelId: channel.id,
      };
    } catch (err: any) {
      return { success: false, message: `İtiraf gönderilirken hata oluştu: ${err.message}` };
    }
  }

  public static async handleButton(interaction: ButtonInteraction): Promise<boolean> {
    if (!interaction.customId.startsWith('confess_')) return false;

    this.load();
    const parts = interaction.customId.split(':');
    const action = parts[0]; // confess_love, confess_dislike, confess_shock
    const msgId = interaction.message.id;
    const userId = interaction.user.id;

    let conf = this.store.confessions[msgId];
    if (!conf) {
      // Mesaj ID bulunamadıysa yeni nesne aç
      const confId = parseInt(parts[1], 10) || 1;
      conf = {
        id: confId,
        messageId: msgId,
        reactions: { love: [], dislike: [], shock: [] },
      };
      this.store.confessions[msgId] = conf;
    }

    const type = action === 'confess_love' ? 'love' : action === 'confess_dislike' ? 'dislike' : 'shock';
    const list = conf.reactions[type];

    const existingIdx = list.indexOf(userId);
    if (existingIdx !== -1) {
      // Tepkiyi geri al (Toggle)
      list.splice(existingIdx, 1);
    } else {
      // Diğer tepkilerden sil (tek oy hakkı)
      conf.reactions.love = conf.reactions.love.filter((id) => id !== userId);
      conf.reactions.dislike = conf.reactions.dislike.filter((id) => id !== userId);
      conf.reactions.shock = conf.reactions.shock.filter((id) => id !== userId);
      conf.reactions[type].push(userId);
    }

    this.save();

    const loveCount = conf.reactions.love.length;
    const dislikeCount = conf.reactions.dislike.length;
    const shockCount = conf.reactions.shock.length;

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`confess_love:${conf.id}`)
        .setLabel(`❤️ ${loveCount}`)
        .setStyle(conf.reactions.love.includes(userId) ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`confess_dislike:${conf.id}`)
        .setLabel(`💔 ${dislikeCount}`)
        .setStyle(conf.reactions.dislike.includes(userId) ? ButtonStyle.Danger : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`confess_shock:${conf.id}`)
        .setLabel(`😱 ${shockCount}`)
        .setStyle(conf.reactions.shock.includes(userId) ? ButtonStyle.Primary : ButtonStyle.Secondary)
    );

    await interaction.update({ components: [row] }).catch(() => {});
    return true;
  }
}
