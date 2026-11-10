import { Message, EmbedBuilder } from 'discord.js';
import { AutoSecurityGuard } from './autoSecurityGuard';
import fs from 'fs';
import path from 'path';

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

  private static dictionary: Set<string> = new Set<string>();
  private static dictionaryLoaded = false;

  private static forbiddenRoots: string[] = [
    // Cinsel Terimler & NSFW
    'seks', 'sex', 'porno', 'porn', 'vajina', 'penis', 'sikis', 'amcik', 'yarrak', 'yarak',
    'tasak', 'dassak', 'dildo', 'masturbasyon', 'orgazm', 'ereksiyon', 'fantezi', 'kondom',
    'prezervatif', 'klitoris', 'anal', 'oral', 'bosalma', 'bosal', 'escort', 'eskort',
    'fahise', 'jigolo', 'meme', 'memeler', 'fetis', 'cinsel', 'cima', 'iliski', 'sevis',
    // Küfür & Ağır Argo
    'sik', 'siktir', 'sikeyim', 'siktim', 'sikik', 'siksok', 'sokam', 'sokayim', 'skm',
    'amk', 'aq', 'amq', 'amina', 'aminakoyayim', 'amkoyim', 'orospu', 'orosbu', 'kahpe',
    'kasar', 'pic', 'pust', 'pezevenk', 'gavat', 'kavat', 'got', 'gotveren', 'gotlek',
    'ibne', 'yavsak', 'kahbe', 'avrat'
  ];

  public static initDictionary() {
    if (this.dictionaryLoaded) return;
    try {
      const candidates = [
        path.resolve(process.cwd(), 'assets/clean_turkish_words.json'),
        path.resolve(__dirname, '../../../assets/clean_turkish_words.json'),
        path.resolve(__dirname, '../../assets/clean_turkish_words.json'),
      ];

      for (const p of candidates) {
        if (fs.existsSync(p)) {
          const raw = fs.readFileSync(p, 'utf8');
          const arr = JSON.parse(raw) as string[];
          this.dictionary = new Set<string>(arr.map((w) => w.toLocaleLowerCase('tr-TR')));
          this.dictionaryLoaded = true;
          console.log(`[KelimeOyunu] ✅ Türkçe TDK kelime sözlüğü yüklendi! (${this.dictionary.size} kelime)`);
          break;
        }
      }
    } catch (e: any) {
      console.warn('[KelimeOyunu] Sözlük yüklenirken hata:', e.message);
    }
  }

  public static isSexualOrProfane(rawWord: string): boolean {
    const lower = rawWord.toLocaleLowerCase('tr-TR');

    // Leetspeak ve Türkçe karakterleri normalize et
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
      .replace(/\$/g, 's');

    const cleanLetters = normalized.replace(/[^a-z]/g, '');

    for (const root of this.forbiddenRoots) {
      if (cleanLetters.includes(root)) {
        return true;
      }
    }

    // AutoSecurityGuard kontrolü
    if (AutoSecurityGuard.isProfane(rawWord)) {
      return true;
    }

    return false;
  }

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

    this.initDictionary();

    const text = message.content.trim();

    // 0. Küfür & Cinsel İçerik Koruması
    if (this.isSexualOrProfane(text)) {
      await message.delete().catch(() => {});
      await this.sendTempWarning(
        message,
        `🚫 <@${message.author.id}>, küfür, hakaret, argo veya cinsel içerikli kelimeler kelime türetmece oyununda kesinlikle yasaktır!`,
        4500
      );
      return;
    }

    // 1. Geçersiz Karakter & Format Kontrolü (Boşluk, sayı, özel karakter veya < 2 harf)
    const turkishWordRegex = /^[a-zA-ZçğıöşüÇĞİÖŞÜ]+$/;
    if (text.startsWith('/') || text.startsWith('!') || text.includes(' ') || text.length < 2 || !turkishWordRegex.test(text)) {
      await message.delete().catch(() => {});
      await this.sendTempWarning(
        message,
        `⚠️ <@${message.author.id}>, burası kelime türetme kanalıdır! Yalnızca tek bir geçerli Türkçe kelime yazabilirsiniz.`
      );
      return;
    }

    const wordLower = text.toLocaleLowerCase('tr-TR');
    const wordUpper = text.toLocaleUpperCase('tr-TR');

    // 2. TDK / Türkçe Sözlük Doğrulama (Sadece Gerçek Türkçe Kelimeler!)
    if (this.dictionaryLoaded && this.dictionary.size > 0) {
      if (!this.dictionary.has(wordLower)) {
        await message.delete().catch(() => {});
        await this.sendTempWarning(
          message,
          `❌ <@${message.author.id}>, '**${wordUpper}**' geçerli bir Türkçe kelime değildir! Lütfen sadece gerçek Türkçe kelimeler türetiniz.`
        );
        return;
      }
    }

    // 3. Aynı kullanıcı art arda yazamaz
    if (this.state.lastUserId === message.author.id) {
      await message.delete().catch(() => {});
      await this.sendTempWarning(
        message,
        `⚠️ <@${message.author.id}>, art arda iki kelime yazamazsınız! Lütfen başka bir üyenin kelime türetmesini bekleyin.`
      );
      return;
    }

    // 4. İlk harf, önceki kelimenin son harfiyle eşleşmelidir
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

    // 5. Daha önce kullanılan kelime tekrar kullanılamaz
    if (this.state.usedWords.has(wordLower)) {
      await message.delete().catch(() => {});
      await this.sendTempWarning(
        message,
        `⚠️ <@${message.author.id}>, '**${wordUpper}**' kelimesi bu oyunda daha önce kullanıldı! Lütfen başka bir kelime türetin.`
      );
      return;
    }

    // 6. Kelime Başarılı ve Onaylandı!
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
          `Harika gidiyorsunuz! Toplam **${this.state.streak}** geçerli Türkçe kelime türetildi!\n` +
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
        '2️⃣ **Yalnızca TDK onaylı gerçek Türkçe kelimeler** kabul edilir (küfür, argo ve cinsel kelimeler kesinlikle yasaktır).\n' +
        '3️⃣ Geçersiz, uydurma veya tekrarlanan kelimeler **otomatik silinir**.\n' +
        '4️⃣ Doğru kelimelere bot tarafından **✅ onay emojisi** bırakılır.\n' +
        '5️⃣ Aynı kişi art arda iki kelime yazamaz, sırayla oynanmalıdır.\n' +
        '6️⃣ Sadece tek bir kelime yazınız (cümle veya sohbet yazmayınız).\n\n' +
        `🏁 **Başlangıç Kelimesi:** **${this.state.lastWord}**\n` +
        `👉 **Sıradaki Kelime:** '**${nextLetter}**' harfiyle başlamalıdır!\n\n` +
        '🔥 *Hadi ilk Türkçe kelimeyi yazarak seriyi başlatın!*'
      )
      .setColor('#38BDF8')
      .setFooter({ text: 'Nights Guard Otomatik Oyun Motoru' });
  }
}
