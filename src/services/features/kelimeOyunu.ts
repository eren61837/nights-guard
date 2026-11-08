import { Message, EmbedBuilder } from 'discord.js';
import { AutoSecurityGuard } from './autoSecurityGuard';

export interface KelimeGameState {
  lastWord: string;
  lastUserId: string | null;
  usedWords: Set<string>;
  streak: number;
  channelId: string | null;
}

export class KelimeOyunuManager {
  private static state: KelimeGameState = {
    lastWord: 'ELMA',
    lastUserId: null,
    usedWords: new Set<string>(['elma']),
    streak: 1,
    channelId: null,
  };

  public static getState(): KelimeGameState {
    return this.state;
  }

  public static setChannelId(channelId: string) {
    this.state.channelId = channelId;
  }

  private static async sendTempWarning(message: Message, content: string, delayMs = 3500) {
    try {
      if ('send' in message.channel) {
        const warn = await (message.channel as any).send({ content });
        setTimeout(() => {
          warn.delete().catch(() => {});
        }, delayMs);
      }
    } catch (e) {}
  }

  public static async handleMessage(message: Message): Promise<void> {
    if (message.author.bot || !message.guild) return;

    const channelName = (message.channel as any).name || '';
    if (!channelName.includes('kelime-oyunu')) return;

    const text = message.content.trim();

    // 0. Küfür & Argo Koruması
    if (AutoSecurityGuard.isProfane(text)) {
      await message.delete().catch(() => {});
      await this.sendTempWarning(
        message,
        `🚫 <@${message.author.id}>, küfür, hakaret veya argo içeren kelimeler kelime türetmece oyununda kullanılamaz!`,
        4000
      );
      return;
    }

    // 1. Geçersiz Format Kontrolü (Boşluk, sayı, özel karakter veya < 2 harf)
    const turkishWordRegex = /^[a-zA-ZçğıöşüÇĞİÖŞÜ]+$/;
    if (text.startsWith('/') || text.startsWith('!') || text.includes(' ') || text.length < 2 || !turkishWordRegex.test(text)) {
      await message.delete().catch(() => {});
      await this.sendTempWarning(
        message,
        `⚠️ <@${message.author.id}>, burası kelime türetme kanalıdır! Yalnızca tek bir geçerli kelime yazabilirsiniz.`
      );
      return;
    }

    const wordLower = text.toLocaleLowerCase('tr-TR');
    const wordUpper = text.toLocaleUpperCase('tr-TR');

    // 1. Aynı kullanıcı art arda yazamaz
    if (this.state.lastUserId === message.author.id) {
      await message.delete().catch(() => {});
      await this.sendTempWarning(
        message,
        `⚠️ <@${message.author.id}>, art arda iki kelime yazamazsınız! Lütfen başka bir üyenin kelime türetmesini bekleyin.`
      );
      return;
    }

    // 2. İlk harf, önceki kelimenin son harfiyle eşleşmelidir
    const expectedLetter = this.state.lastWord.slice(-1).toLocaleLowerCase('tr-TR');
    const currentFirstLetter = wordLower[0];

    if (currentFirstLetter !== expectedLetter) {
      await message.delete().catch(() => {});
      await this.sendTempWarning(
        message,
        `❌ <@${message.author.id}>, yazdığın kelime '**${expectedLetter.toLocaleUpperCase('tr-TR')}**' harfiyle başlamalı! (Son kelime: **${this.state.lastWord}**)`
      );
      return;
    }

    // 3. Daha önce kullanılan kelime tekrar kullanılamaz
    if (this.state.usedWords.has(wordLower)) {
      await message.delete().catch(() => {});
      await this.sendTempWarning(
        message,
        `⚠️ <@${message.author.id}>, '**${wordUpper}**' kelimesi bu oyunda daha önce kullanıldı! Lütfen başka bir kelime türetin.`
      );
      return;
    }

    // 4. Kelime Başarılı ve Onaylandı!
    this.state.usedWords.add(wordLower);
    this.state.lastWord = wordUpper;
    this.state.lastUserId = message.author.id;
    this.state.streak++;

    // Onaylanmış reaksiyon ekle
    try {
      await message.react('✅');
    } catch (e) {}

    // Streak Dönüm Noktası Duyurusu (Her 10 kelimede bir)
    if (this.state.streak % 10 === 0) {
      const nextLetter = this.state.lastWord.slice(-1).toLocaleUpperCase('tr-TR');
      const milestoneEmbed = new EmbedBuilder()
        .setTitle(`🔥 KELİME TÜRETME SERİSİ: ${this.state.streak} KELİME! 🔥`)
        .setDescription(
          `Harika gidiyorsunuz! Toplam **${this.state.streak}** kelime türetildi!\n` +
          `Son Kelime: **${this.state.lastWord}**\n` +
          `Sıradaki Kelime '**${nextLetter}**' harfiyle başlamalı!`
        )
        .setColor('#F1C40F')
        .setFooter({ text: 'Nights Kelime Oyunu • Made by erencix' });

      if ('send' in message.channel) {
        await (message.channel as any).send({ embeds: [milestoneEmbed] });
      }
    }
  }

  public static getInitialEmbed(): EmbedBuilder {
    const nextLetter = this.state.lastWord.slice(-1).toLocaleUpperCase('tr-TR');
    return new EmbedBuilder()
      .setTitle('🧩 NIGHTS KELİME TÜRETMECE OYUNU BAŞLADI!')
      .setDescription(
        'Sunucumuzun otomatik kelime türetme oyunu aktif!\n\n' +
        '### 📌 Oyun Kuralları:\n' +
        '1️⃣ Yazdığınız kelime, bir önceki kelimenin **son harfiyle** başlamalıdır.\n' +
        '2️⃣ Geçersiz, hatalı veya tekrarlanan kelimeler **otomatik silinir** ve uyarılırsınız.\n' +
        '3️⃣ Doğru kelimelere bot tarafından **✅ onay emojisi** bırakılır.\n' +
        '4️⃣ Aynı kişi art arda iki kelime yazamaz, sırayla oynanmalıdır.\n' +
        '5️⃣ Sadece tek bir kelime yazınız (sohbet veya cümle yazmayınız).\n\n' +
        `🏁 **Başlangıç Kelimesi:** **${this.state.lastWord}**\n` +
        `👉 **Sıradaki Kelime:** '**${nextLetter}**' harfiyle başlamalıdır!\n\n` +
        '🔥 *Hadi ilk kelimeyi yazarak seriyi başlatın!*'
      )
      .setColor('#38BDF8')
      .setFooter({ text: 'Nights Guard Otomatik Oyun Motoru' });
  }
}
