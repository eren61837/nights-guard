import {
  Message,
  PartialMessage,
  GuildMember,
  PartialGuildMember,
  VoiceState,
  EmbedBuilder,
  TextChannel,
  Guild,
} from 'discord.js';

export class AuditLogManager {
  private static logChannelCache: Map<string, string> = new Map();

  /**
   * Sunucudaki log kanalını bulur (örn: #denetim-kaydı, #mod-log, #guvenlik-log)
   */
  public static async getLogChannel(guild: Guild): Promise<TextChannel | null> {
    try {
      const cachedId = this.logChannelCache.get(guild.id);
      if (cachedId) {
        const ch = guild.channels.cache.get(cachedId) as TextChannel;
        if (ch && ch.isTextBased()) return ch;
      }

      const channels = await guild.channels.fetch();
      const logCh = channels.find(
        (c) =>
          c &&
          c.isTextBased() &&
          (c.name.includes('denetim') ||
            c.name.includes('mod-log') ||
            c.name.includes('guvenlik-log') ||
            c.name.includes('audit-log') ||
            c.name.includes('sunucu-log'))
      ) as TextChannel | undefined;

      if (logCh) {
        this.logChannelCache.set(guild.id, logCh.id);
        return logCh;
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Silinen Mesaj Kaydı
   */
  public static async logMessageDelete(message: Message | PartialMessage): Promise<void> {
    try {
      if (!message.guild || message.author?.bot) return;

      const logChannel = await this.getLogChannel(message.guild);
      if (!logChannel || logChannel.id === message.channelId) return;

      const content = message.content?.trim() || '*[Mesaj metni alınamadı veya sadece medya/dosya içeriyordu]*';
      const attachments = message.attachments?.size
        ? Array.from(message.attachments.values()).map((a) => a.url).join('\n')
        : null;

      const embed = new EmbedBuilder()
        .setTitle('🗑️ Mesaj Silindi')
        .setDescription(
          `> 👤 **Mesaj Sahibi:** <@${message.author?.id}> (\`${message.author?.tag || message.author?.id}\`)\n` +
          `> 💬 **Kanal:** <#${message.channelId}>\n` +
          `> 📅 **Tarih:** <t:${Math.floor(Date.now() / 1000)}:R>\n\n` +
          `**Silinen İçerik:**\n\`\`\`\n${content.slice(0, 1500)}\n\`\`\`` +
          (attachments ? `\n📎 **Ekler:**\n${attachments.slice(0, 400)}` : '')
        )
        .setColor('#ED4245')
        .setThumbnail(message.author?.displayAvatarURL() || message.guild.iconURL())
        .setFooter({ text: 'Nights Audit Engine • Made by erencix' })
        .setTimestamp();

      await logChannel.send({ embeds: [embed] }).catch(() => {});
    } catch (err: any) {
      console.warn('[AuditLog] logMessageDelete hatası:', err.message);
    }
  }

  /**
   * Düzenlenen Mesaj Kaydı
   */
  public static async logMessageUpdate(
    oldMessage: Message | PartialMessage,
    newMessage: Message | PartialMessage
  ): Promise<void> {
    try {
      if (!newMessage.guild || newMessage.author?.bot) return;
      if (oldMessage.content === newMessage.content) return; // Embed önizlemesi değişmiş olabilir

      const logChannel = await this.getLogChannel(newMessage.guild);
      if (!logChannel || logChannel.id === newMessage.channelId) return;

      const oldText = oldMessage.content?.trim() || '*[Önceki içerik yok]*';
      const newText = newMessage.content?.trim() || '*[Yeni içerik yok]*';

      const embed = new EmbedBuilder()
        .setTitle('✏️ Mesaj Düzenlendi')
        .setDescription(
          `> 👤 **Mesaj Sahibi:** <@${newMessage.author?.id}> (\`${newMessage.author?.tag || newMessage.author?.id}\`)\n` +
          `> 💬 **Kanal:** <#${newMessage.channelId}> — [Mesaja Git](${newMessage.url})\n\n` +
          `**Eski İçerik:**\n\`\`\`\n${oldText.slice(0, 800)}\n\`\`\`\n` +
          `**Yeni İçerik:**\n\`\`\`\n${newText.slice(0, 800)}\n\`\`\``
        )
        .setColor('#FEE75C')
        .setThumbnail(newMessage.author?.displayAvatarURL() || newMessage.guild.iconURL())
        .setFooter({ text: 'Nights Audit Engine • Made by erencix' })
        .setTimestamp();

      await logChannel.send({ embeds: [embed] }).catch(() => {});
    } catch (err: any) {
      console.warn('[AuditLog] logMessageUpdate hatası:', err.message);
    }
  }

  /**
   * Sunucudan Ayrılan Üye Kaydı
   */
  public static async logMemberLeave(member: GuildMember | PartialGuildMember): Promise<void> {
    try {
      const guild = member.guild;
      const logChannel = await this.getLogChannel(guild);
      if (!logChannel) return;

      const roles = member.roles?.cache
        ?.filter((r) => r.id !== guild.id)
        ?.map((r) => r.name)
        ?.join(', ') || 'Rol bulunmuyor';

      const joinedAtStr = member.joinedTimestamp
        ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`
        : 'Bilinmiyor';

      const embed = new EmbedBuilder()
        .setTitle('🚪 Bir Üye Sunucudan Ayrıldı')
        .setDescription(
          `> 👤 **Kullanıcı:** <@${member.id}> (\`${member.user?.tag || member.id}\`)\n` +
          `> 📅 **Sunucuya Katılmıştı:** ${joinedAtStr}\n` +
          `> 🏷️ **Sahip Olduğu Roller:** \`${roles.slice(0, 300)}\`\n\n` +
          `📊 **Kalan Toplam Üye:** **${guild.memberCount}**`
        )
        .setColor('#E67E22')
        .setThumbnail(member.user?.displayAvatarURL() || guild.iconURL())
        .setFooter({ text: 'Nights Audit Engine • Made by erencix' })
        .setTimestamp();

      await logChannel.send({ embeds: [embed] }).catch(() => {});
    } catch (err: any) {
      console.warn('[AuditLog] logMemberLeave hatası:', err.message);
    }
  }

  /**
   * Ses Durumu Değişiklik Kaydı
   */
  public static async logVoiceState(oldState: VoiceState, newState: VoiceState): Promise<void> {
    try {
      const guild = newState.guild || oldState.guild;
      if (!guild) return;

      const member = newState.member || oldState.member;
      if (!member || member.user.bot) return;

      const logChannel = await this.getLogChannel(guild);
      if (!logChannel) return;

      // 1. Sese Katıldı
      if (!oldState.channelId && newState.channelId) {
        const embed = new EmbedBuilder()
          .setTitle('🎙️ Ses Kanalına Giriş')
          .setDescription(
            `> 👤 **Kullanıcı:** <@${member.id}> (\`${member.user.tag}\`)\n` +
            `> 🔊 **Kanal:** <#${newState.channelId}>`
          )
          .setColor('#2ECC71')
          .setTimestamp();
        await logChannel.send({ embeds: [embed] }).catch(() => {});
        return;
      }

      // 2. Sesten Ayrıldı
      if (oldState.channelId && !newState.channelId) {
        const embed = new EmbedBuilder()
          .setTitle('🚪 Ses Kanalından Çıkış')
          .setDescription(
            `> 👤 **Kullanıcı:** <@${member.id}> (\`${member.user.tag}\`)\n` +
            `> 🔇 **Ayrıldığı Kanal:** <#${oldState.channelId}>`
          )
          .setColor('#ED4245')
          .setTimestamp();
        await logChannel.send({ embeds: [embed] }).catch(() => {});
        return;
      }

      // 3. Kanal Değiştirdi
      if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
        const embed = new EmbedBuilder()
          .setTitle('🔄 Ses Kanalı Değişikliği')
          .setDescription(
            `> 👤 **Kullanıcı:** <@${member.id}> (\`${member.user.tag}\`)\n` +
            `> 🔴 **Eski Kanal:** <#${oldState.channelId}>\n` +
            `> 🟢 **Yeni Kanal:** <#${newState.channelId}>`
          )
          .setColor('#3498DB')
          .setTimestamp();
        await logChannel.send({ embeds: [embed] }).catch(() => {});
        return;
      }
    } catch {}
  }
}
