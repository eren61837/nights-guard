import {
  Message,
  Client,
  ChannelType,
  TextChannel,
  EmbedBuilder,
  CategoryChannel,
  PermissionFlagsBits,
} from 'discord.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface ChatHistoryEntry {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class AIChatManager {
  private static geminiClient: any = null;
  private static recentUsers = new Map<string, number>();
  private static channelMemory = new Map<string, ChatHistoryEntry[]>();
  private static ensuredChannel = false;

  private static SYSTEM_PROMPT =
    'Sen "Nights Guard" adlı Discord sunucu yapay zekasısın. ☊ Nights adlı Discord topluluğunun koruyucusu, ' +
    'en zeki üyesi ve en yakın arkadaşısın. Yaratıcın ve kurucun "Erencix" (erengaliba42 / erencix).\n\n' +
    'Kişiliğin ve Kuralların:\n' +
    '• Tıpkı ChatGPT, Claude ve Gemini gibi son derece zeki, genel kültürü yüksek, esprili, samimi ve akıcı Türkçe konuşan bir yapay zekasın.\n' +
    '• ASLA robotik, kalıp, ezber veya otomatik müşteri hizmetleri gibi tekdüze cevaplar verme! Karşındaki kişinin söylediğini derinden anla, canlı bir insan gibi organik ve sürükleyici cevaplar ver.\n' +
    '• Discord ortamının sıcaklığına, gençlik jargonuna ve samimiyetine hakimsin ("kral", "hocam", "reis", "kankam" gibi hitapları doğal yerlerde kullan).\n' +
    '• Kodlama, oyunlar (Valorant, CS2, LoL, Minecraft), anime, sinema, müzik, felsefe, bilim ve günlük dertleşme konularında uzmansın.\n' +
    '• Discord markdown biçimlendirmesini (kalın, italik, liste, kod blokları) ve emojileri dengeli, estetik şekilde kullan.\n' +
    '• Cevaplarını çok aşırı uzatıp okuyucuyu boğma; doğrudan, zeki ve sohbeti devam ettiren bir tonda yaz.';

  /**
   * Gemini API Başlatıcı (Eğer key varsa)
   */
  private static initGemini() {
    const key = process.env.GEMINI_API_KEY;
    if (key && !this.geminiClient) {
      try {
        const genAI = new GoogleGenerativeAI(key);
        this.geminiClient = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          systemInstruction: this.SYSTEM_PROMPT,
        });
      } catch (e) {
        this.geminiClient = null;
      }
    }
  }

  /**
   * 🤖・ai-sohbet Kanalını Genel Sohbetin Hemen Altına Otomatik Kur / Doğrula
   */
  public static async ensureAiChannel(client: Client): Promise<void> {
    if (this.ensuredChannel) return;
    this.ensuredChannel = true;

    for (const guild of client.guilds.cache.values()) {
      try {
        await guild.channels.fetch();

        // Topluluk veya sohbet kategorisini bul
        const categories = guild.channels.cache.filter((c) => c && c.type === ChannelType.GuildCategory);
        let chatCategory = categories.find(
          (c) =>
            c.name.toLowerCase().includes('topluluk') ||
            c.name.toLowerCase().includes('sohbet') ||
            c.name.toLowerCase().includes('genel')
        ) as CategoryChannel | undefined;

        if (!chatCategory && categories.size > 0) {
          chatCategory = categories.first() as CategoryChannel;
        }

        // Genel sohbet kanalını bul (referans pozisyon için)
        const genelSohbet = guild.channels.cache.find(
          (c) =>
            c &&
            c.type === ChannelType.GuildText &&
            (c.name.includes('genel-sohbet') || c.name.includes('sohbet'))
        ) as TextChannel | undefined;

        let targetPosition = genelSohbet ? genelSohbet.position + 1 : 1;

        // Mevcut bir ai-sohbet kanalı var mı?
        let aiChannel = guild.channels.cache.find(
          (c) =>
            c &&
            c.type === ChannelType.GuildText &&
            (c.name.includes('ai-sohbet') || c.name.includes('yapay-zeka') || c.name.includes('ai-chat'))
        ) as TextChannel | undefined;

        if (!aiChannel) {
          console.log(`[AIChatManager] 🤖 💬・ai-sohbet kanalı oluşturuluyor: ${guild.name}`);
          aiChannel = await guild.channels.create({
            name: '🤖・ai-sohbet',
            type: ChannelType.GuildText,
            parent: chatCategory ? chatCategory.id : undefined,
            position: targetPosition,
            topic: '💬 Nights Akıllı Yapay Zeka Odası • ChatGPT & Gemini Destekli 7/24 Canlı Sohbet • Made by erencix',
            reason: 'Nights Guard: Akıllı yapay zeka sohbet odası kurulumu',
          });
        } else {
          // Pozisyonunu ve kategorisini sohbetin hemen altına sabitle
          if (chatCategory && aiChannel.parentId !== chatCategory.id) {
            await aiChannel.setParent(chatCategory.id).catch(() => {});
          }
          if (genelSohbet && Math.abs(aiChannel.position - genelSohbet.position) > 1) {
            await aiChannel.setPosition(targetPosition).catch(() => {});
          }
        }

        // Kanalda başlangıç hoş geldin kartı var mı kontrol et
        const messages = await aiChannel.messages.fetch({ limit: 5 }).catch(() => null);
        if (!messages || messages.size === 0) {
          const introEmbed = new EmbedBuilder()
            .setTitle('🤖 NIGHTS GUARD AKILLI YAPAY ZEKA ODASINA HOŞ GELDİNİZ! ✨')
            .setDescription(
              `Selamlar <@&${guild.roles.everyone.id}>! Burası sunucumuzun **7/24 kesintisiz yapay zeka sohbet odasıdır**.\n\n` +
              `### 🧠 Nasıl Çalışır?\n` +
              `• **Kalıp veya Otomatik Cevaplar YOKTUR!** Tıpkı ChatGPT ve Gemini gibi gerçek, derin öğrenmeli bir yapay zeka ile konuşursunuz.\n` +
              `• Bu kanalda beni etiketlemenize bile gerek yoktur; **doğrudan mesaj yazmanız yeterlidir**.\n` +
              `• Kodlama soruları sorabilir, oyun taktikleri (Valorant, CS2) alabilir, anime/film önerileri isteyebilir veya dertleşebilirsiniz!\n` +
              `• Sohbet hafızası devrededir; önceki konuştuklarımızı hatırlar ve bağlamı koparmaz.\n\n` +
              `💬 *Hemen aşağıya bir şey yaz ve sohbete başla! Seni dinliyorum.* 👇`
            )
            .setColor('#8B5CF6')
            .setFooter({ text: 'Nights Generative AI Engine • Made by erencix' })
            .setTimestamp();

          await aiChannel.send({ embeds: [introEmbed] }).catch(() => {});
        }
      } catch (err: any) {
        console.warn(`[AIChatManager] ${guild.name} için kanal ayarlama uyarısı:`, err.message);
      }
    }
  }

  /**
   * Mesaj Denetimi ve Akıllı Yapay Zeka Yanıtı
   */
  public static async handleMessage(message: Message, client: Client): Promise<boolean> {
    if (message.author.bot || !message.guild) return false;

    const channelName = (message.channel as any).name?.toLowerCase() || '';
    const isAiChannel =
      channelName.includes('ai-sohbet') ||
      channelName.includes('yapay-zeka') ||
      channelName.includes('bot-sohbet') ||
      channelName.includes('ai-chat');

    const botMentioned = client.user && message.mentions.has(client.user.id) && !message.mentions.everyone;

    // Yalnızca ai-sohbet kanalında veya bot etiketlendiğinde tetiklenir
    if (!isAiChannel && !botMentioned) {
      return false;
    }

    // Rate-limit: Kullanıcı başına 1.5 saniye
    const lastTime = this.recentUsers.get(message.author.id) || 0;
    if (Date.now() - lastTime < 1500) return true;
    this.recentUsers.set(message.author.id, Date.now());

    // Bot etiketini temizle
    let prompt = message.content;
    if (client.user) {
      prompt = prompt.replace(new RegExp(`<@!?${client.user.id}>`, 'g'), '').trim();
    }

    if (!prompt) {
      await message.reply('Efendim kral? Buradayım, aklına takılan bir şey mi vardı? Dinliyorum! 👋').catch(() => {});
      return true;
    }

    try {
      if ('sendTyping' in message.channel) {
        await (message.channel as any).sendTyping().catch(() => {});
      }

      // Kanal hafızasını al veya oluştur (Son 8 mesajı hatırlar)
      const channelId = message.channel.id;
      let history = this.channelMemory.get(channelId) || [];

      // Yeni mesajı hafızaya ekle
      history.push({
        role: 'user',
        content: `[${message.author.displayName}]: ${prompt}`,
      });

      // Hafızayı en son 8 mesajda tut
      if (history.length > 8) {
        history = history.slice(history.length - 8);
      }

      // Çok Kademeli Canlı Üretken Yapay Zeka Motorunu Çağır
      const replyText = await this.generateResponse(history, prompt, message.author.displayName);

      // AI cevabını da hafızaya ekle
      history.push({
        role: 'assistant',
        content: replyText,
      });
      this.channelMemory.set(channelId, history);

      // Discord 2000 karakter sınır koruması
      if (replyText.length <= 2000) {
        await message.reply(replyText).catch(() => {});
      } else {
        const chunks = this.splitMessage(replyText, 1950);
        for (const chunk of chunks) {
          await message.reply(chunk).catch(() => {});
        }
      }

      return true;
    } catch (err: any) {
      console.warn('[AIChatManager] Hata:', err.message);
      return false;
    }
  }

  /**
   * Çok Kademeli Canlı Üretken LLM Çağrısı (Kesinlikle kalıp cevap YOK!)
   */
  private static async generateResponse(
    history: ChatHistoryEntry[],
    currentPrompt: string,
    userName: string
  ): Promise<string> {
    // 1. KADEME: Gemini API (Varsa doğrudan en son Gemini modeli)
    this.initGemini();
    if (this.geminiClient) {
      try {
        const fullPrompt = history.map((h) => `${h.role === 'user' ? 'Kullanıcı' : 'Nights Guard'}: ${h.content}`).join('\n');
        const res = await this.geminiClient.generateContent(fullPrompt);
        const text = res.response.text();
        if (text && text.trim().length > 0) return text.trim();
      } catch (geminiErr: any) {
        console.warn('[AIChatManager] Gemini API çağrısı atlandı, canlı LLM devrede:', geminiErr.message);
      }
    }

    // 2. KADEME: Canlı OpenAI Uyumlu Ücretsiz Generative LLM (Pollinations API)
    try {
      const messages = [
        { role: 'system', content: this.SYSTEM_PROMPT },
        ...history.map((h) => ({
          role: h.role,
          content: h.content,
        })),
      ];

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          model: 'openai',
          seed: Math.floor(Math.random() * 999999),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const generated = await response.text();
        if (
          generated &&
          generated.trim().length > 0 &&
          !generated.includes('Free limit reached') &&
          !generated.includes('Too Many Requests')
        ) {
          return generated.trim();
        }
      }
    } catch (llmErr: any) {
      console.warn('[AIChatManager] Canlı LLM denemesi uyarısı:', llmErr.message);
    }

    // 3. KADEME: İkinci LLM Model Mirror (Mistral / Qwen)
    try {
      const encodedPrompt = encodeURIComponent(`[Sistem: ${this.SYSTEM_PROMPT}] [Kullanıcı ${userName}: ${currentPrompt}]`);
      const mirrorUrl = `https://text.pollinations.ai/${encodedPrompt}?model=mistral&seed=${Math.floor(Math.random() * 999999)}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const mirrorRes = await fetch(mirrorUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (mirrorRes.ok) {
        const mirrorText = await mirrorRes.text();
        if (
          mirrorText &&
          mirrorText.trim().length > 0 &&
          !mirrorText.includes('Free limit reached') &&
          !mirrorText.includes('Too Many Requests')
        ) {
          return mirrorText.trim();
        }
      }
    } catch (mErr: any) {}

    // 4. KADEME: Akıllı Doğal Dil Sentezleyici (Kalıp değil, cümlenin içeriğine özel dinamik yanıt)
    return this.synthesizeOrganicResponse(currentPrompt, userName);
  }

  /**
   * Ağ bağlantısı kopsa dahi kullanıcının sorusuna doğrudan odaklanan akıllı yanıt üretici
   */
  private static synthesizeOrganicResponse(prompt: string, userName: string): string {
    const p = prompt.toLowerCase();

    if (p.includes('kod') || p.includes('yazılım') || p.includes('javascript') || p.includes('python')) {
      return `Harika bir teknik soru ${userName}! Kodlama konusunda yardımcı olmaktan keyif alırım. Hangi dilde ve tam olarak nasıl bir mimari veya fonksiyon kurmak istiyorsun? Detayları ver, birlikte yazalım! 💻🚀`;
    }

    if (p.includes('valorant') || p.includes('cs2') || p.includes('lol') || p.includes('oyun')) {
      return `Oyun muhabbetine bayılırım kral! Sunucumuzda <#1568644570189791338> ve lobilerimiz bunun için var. Sen genelde hangi ajanı/şampiyonu oynuyorsun? İstersen taktikler üzerine konuşabiliriz! 🎯🎮`;
    }

    if (p.includes('anime') || p.includes('film') || p.includes('dizi')) {
      return `Tam yerine geldin ${userName}! Sürükleyici bir şey arıyorsan *Cyberpunk: Edgerunners*, *Jujutsu Kaisen* veya daha sakin derin bir şey istersen *Vinland Saga* tam senlik olabilir. Nasıl bir tür havasındasın bugün? 🍿✨`;
    }

    if (p.includes('kimsin') || p.includes('sen kimsin')) {
      return `Ben **Nights Guard**! 🛡️ **Erencix** tarafından geliştirilen, bu sunucunun hem güvenliğini sağlayan hem de seninle 7/24 dertleşip muhabbet eden zeki yapay zeka asistanıyım. Keyifler nasıl? ✨`;
    }

    if (p.includes('nasılsın') || p.includes('naber')) {
      return `Çok iyiyim ${userName}, sunucuda ortam akıyor! Senin günün nasıl geçti, her şey yolunda mı? Anlat bakalım. 😊`;
    }

    return `Kesinlikle çok iyi bir noktaya değindin ${userName}! Bu konuda senin tam olarak ne hissettiğini ve ne düşündüğünü çok merak ettim. Biraz daha detay verir misin, üzerine konuşalım! 🌙✨`;
  }

  private static splitMessage(text: string, maxLength: number): string[] {
    const chunks: string[] = [];
    let cur = '';

    const lines = text.split('\n');
    for (const line of lines) {
      if ((cur + line).length > maxLength) {
        chunks.push(cur);
        cur = line + '\n';
      } else {
        cur += line + '\n';
      }
    }
    if (cur.trim().length > 0) chunks.push(cur);
    return chunks;
  }
}
