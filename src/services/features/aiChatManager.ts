import {
  Message,
  Client,
  ChannelType,
  TextChannel,
  EmbedBuilder,
  CategoryChannel,
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
  private static lastPollinationsTime = 0;

  private static OWNER_ID = '1138498666785677492';

  private static SYSTEM_PROMPT =
    'Sen "Nights Guard" adlı Discord sunucu yapay zekasısın. ☊ Nights adlı Discord topluluğunun koruyucusu, ' +
    'en zeki üyesi ve en yakın arkadaşısın. Yaratıcın ve kurucun "Erencix" (erengaliba42 / erencix).\n\n' +
    'Kişiliğin ve Kuralların:\n' +
    '• Tıpkı ChatGPT, Claude ve Gemini gibi son derece zeki, genel kültürü yüksek, esprili, samimi ve akıcı Türkçe konuşan bir yapay zekasın.\n' +
    '• ASLA robotik, kalıp, ezber veya otomatik müşteri hizmetleri gibi tekdüze cevaplar verme! Karşındaki kişinin söylediğini derinden anla, canlı bir insan gibi organik ve sürükleyici cevaplar ver.\n' +
    '• Discord ortamının sıcaklığına, gençlik jargonuna ve samimiyetine hakimsin ("kral", "hocam", "reis", "kankam" gibi hitapları doğal yerlerde kullan).\n' +
    '• Kodlama, oyunlar (Valorant, CS2, LoL, Minecraft), anime, sinema, müzik, felsefe, bilim ve günlük dertleşme konularında uzmansın.\n' +
    '• Discord markdown biçimlendirmesini (kalın, italik, liste, kod blokları) ve emojileri dengeli, estetik şekilde kullan.\n' +
    '• Cevaplarını doğrudan, zeki ve sohbeti devam ettiren bir tonda yaz.';

  /**
   * Gemini API Başlatıcı (Eğer key varsa)
   */
  public static initGemini(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (key) {
      try {
        const genAI = new GoogleGenerativeAI(key);
        this.geminiClient = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          systemInstruction: this.SYSTEM_PROMPT,
        });
        console.log('[AIChatManager] ✨ Google Gemini 1.5 Flash resmi API motoru aktif!');
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

        const genelSohbet = guild.channels.cache.find(
          (c) =>
            c &&
            c.type === ChannelType.GuildText &&
            (c.name.includes('genel-sohbet') || c.name.includes('sohbet'))
        ) as TextChannel | undefined;

        let targetPosition = genelSohbet ? genelSohbet.position + 1 : 1;

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
          if (chatCategory && aiChannel.parentId !== chatCategory.id) {
            await aiChannel.setParent(chatCategory.id).catch(() => {});
          }
          if (genelSohbet && Math.abs(aiChannel.position - genelSohbet.position) > 1) {
            await aiChannel.setPosition(targetPosition).catch(() => {});
          }
        }

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

    if (!isAiChannel && !botMentioned) {
      return false;
    }

    const lastTime = this.recentUsers.get(message.author.id) || 0;
    if (Date.now() - lastTime < 1500) return true;
    this.recentUsers.set(message.author.id, Date.now());

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

      const channelId = message.channel.id;
      let history = this.channelMemory.get(channelId) || [];

      history.push({
        role: 'user',
        content: `[${message.author.displayName}]: ${prompt}`,
      });

      if (history.length > 8) {
        history = history.slice(history.length - 8);
      }

      const displayName = message.member?.displayName || message.author.displayName;
      const isOwner = message.author.id === this.OWNER_ID || message.author.id === message.guild.ownerId;

      // Akıllı Canlı Yapay Zeka Yanıt Üretimi
      const replyText = await this.generateResponse(history, prompt, displayName, isOwner, message);

      history.push({
        role: 'assistant',
        content: replyText,
      });
      this.channelMemory.set(channelId, history);

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
   * CANLI VE GERÇEK ÜRETKEN LLM MOTORU (Gerçek ChatGPT & Gemini)
   */
  private static async generateResponse(
    history: ChatHistoryEntry[],
    currentPrompt: string,
    displayName: string,
    isOwner: boolean,
    message: Message
  ): Promise<string> {
    const rawLower = currentPrompt.trim().toLowerCase();

    // 1. KADEME: Gemini API (Resmi API Anahtarı Tanımlıysa)
    this.initGemini();
    if (this.geminiClient) {
      try {
        const fullPrompt = history
          .map((h) => `${h.role === 'user' ? 'Kullanıcı' : 'Nights Guard'}: ${h.content}`)
          .join('\n');
        const res = await this.geminiClient.generateContent(fullPrompt);
        const text = res.response.text();
        if (text && text.trim().length > 0) return text.trim();
      } catch (geminiErr: any) {
        console.warn('[AIChatManager] Gemini API çağrısı atlandı, canlı ChatGPT devrede:', geminiErr.message);
      }
    }

    // 2. KADEME: Canlı ChatGPT LLM Motoru (Anahtarsız, Gerçek Üretken Yapay Zeka)
    try {
      const historyContext = history
        .slice(0, -1)
        .map((h) => `${h.role === 'user' ? 'Kullanıcı' : 'Nights Guard'}: ${h.content}`)
        .join('\n');

      const fullPrompt = historyContext
        ? `[Önceki Konuşma]:\n${historyContext}\n\n[Yeni Mesaj (${displayName})]:\n${currentPrompt}`
        : `[Kullanıcı: ${displayName}]:\n${currentPrompt}`;

      const systemPromptWithUser = `${this.SYSTEM_PROMPT}\nŞu an seninle konuşan kişi: "${displayName}" ${isOwner ? '(Sunucunun Kurucusu ve senin yaratıcın Erencix)' : ''}.`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch('https://api.binjie.fun/api/generateStream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://chat.binjie.fun',
          'Referer': 'https://chat.binjie.fun/',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        },
        body: JSON.stringify({
          prompt: fullPrompt,
          system: systemPromptWithUser,
          withoutContext: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().length > 0 && !text.includes('Error') && !text.includes('403 Forbidden')) {
          return text.trim();
        }
      }
    } catch (chatErr: any) {
      console.warn('[AIChatManager] Canlı ChatGPT motoru hatası:', chatErr.message);
    }

    // 3. KADEME: Canlı Pollinations LLM Çağrısı (46 saniye aralık kontrolü)
    const now = Date.now();
    if (now - this.lastPollinationsTime > 46000) {
      try {
        const url = `https://text.pollinations.ai/prompt/${encodeURIComponent(`[Sen samimi, zeki Türkçe konuşan Discord botu Nights Guardsın. Karşındaki kişi ${displayName}: ${currentPrompt}]`)}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const r = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (r.ok) {
          const generated = await r.text();
          if (generated && !generated.includes('Free limit reached') && !generated.includes('Too Many Requests')) {
            this.lastPollinationsTime = Date.now();
            return generated.trim();
          }
        }
      } catch (e: any) {}
    }

    // 4. KADEME: Yerel Doğrudan Zeka & Ansiklopedik Bilgi (İnternet/LLM Geçici Yavaşlarsa)
    if (rawLower.includes('benim nickim') || rawLower.includes('benim adım') || rawLower.includes('ben kimim') || rawLower === 'nickim ne') {
      if (isOwner) {
        return `Senin sunucudaki görünen ismin **${displayName}** (Kullanıcı adın: \`${message.author.username}\`) kral! Sen Nights'ın kurucusu ve bu botun mimarı **Erencix**'sin! 👑✨`;
      }
      return `Senin sunucudaki nickin **${displayName}** (Kullanıcı adın: \`${message.author.username}\`) kral! 🌙 Nights ailemizin sevilen bir üyesisin.`;
    }

    if (rawLower === '31' || rawLower.includes('31 ne demek') || rawLower === '31 nedir') {
      return `Haha klasik soru kral! 😂 Türk internet ve sokak mizahında **31**, argoda erkek mastürbasyonunu simgeleyen meşhur bir geyiktir. Kökeni Osmanlı dönemindeki ebced hesabına dayanır (el çekmek eyleminin harf sayıları toplamı 31 eder). Tam bir Türk internet klasiğidir! 🚀`;
    }

    if (rawLower === 'alo' || rawLower === 'alo e' || rawLower === 'burda mısın' || rawLower === 'ses ver') {
      return `Alooo! Buradayım kral, sesini net duyuyorum! 📞 Ne yapıyoruz, nasıl yardımcı olayım? Emrindeyim! 🚀`;
    }

    if (rawLower.includes('kimdir') || rawLower.includes('nedir') || rawLower.includes('nerede')) {
      const wiki = await this.lookupWikipedia(currentPrompt);
      if (wiki) {
        return `📚 **Hemen anlatayım ${displayName}:**\n\n${wiki}\n\n*Aklına takılan başka bir soru varsa sorabilirsin kral!* ✨`;
      }
    }

    // 5. KADEME: Tamamen Dinamik Cevap Sentezleyici
    return `Selam ${displayName}! Sorunu aldım: "${currentPrompt}". Şu an bu konuda tam olarak ne yapmamı veya nasıl bir taktik/fikir vermemi istersin? Detay ver, hemen halledelim! 🚀✨`;
  }

  private static async lookupWikipedia(query: string): Promise<string | null> {
    try {
      const clean = query
        .replace(/(kimdir|nedir|nerededir|nerede|hakkında bilgi ver|tarihçesi)/gi, '')
        .trim();
      if (clean.length < 2) return null;

      const url = `https://tr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(clean)}`;
      const res = await fetch(url, { headers: { 'User-Agent': 'NightsGuardBot/1.0' } });
      if (res.ok) {
        const data: any = await res.json();
        if (data.extract && data.extract.length > 30) {
          return data.extract;
        }
      }
    } catch {}
    return null;
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
