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

      const channelId = message.channel.id;
      let history = this.channelMemory.get(channelId) || [];

      history.push({
        role: 'user',
        content: `[${message.author.displayName}]: ${prompt}`,
      });

      if (history.length > 8) {
        history = history.slice(history.length - 8);
      }

      // Kullanıcının kimliğini ve nickini doğrudan yakala
      const displayName = message.member?.displayName || message.author.displayName;
      const isOwner = message.author.id === this.OWNER_ID || message.author.id === message.guild.ownerId;

      // Akıllı Yanıt Üretimi
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
   * Çok Kademeli Canlı Üretken LLM ve Akıllı Anlamsal Motor
   */
  private static async generateResponse(
    history: ChatHistoryEntry[],
    currentPrompt: string,
    displayName: string,
    isOwner: boolean,
    message: Message
  ): Promise<string> {
    const rawLower = currentPrompt.trim().toLowerCase();

    // 0. DOĞRUDAN DİSCORD KİMLİK & KULLANICI SORULARI
    if (
      rawLower === 'benim nickim ney' ||
      rawLower === 'benim adım ne' ||
      rawLower === 'ben kimim' ||
      rawLower === 'nickim ne' ||
      rawLower.includes('benim nickim') ||
      rawLower.includes('benim ismim') ||
      rawLower.includes('ben kimim')
    ) {
      if (isOwner) {
        return `Senin sunucudaki görünen ismin **${displayName}** (Kullanıcı adın: \`${message.author.username}\`)! Sen sunucunun kurucusu ve bu botun yaratıcısı **Erencix**'sin kral! 👑✨`;
      }
      return `Senin sunucudaki nickin **${displayName}** (Kullanıcı adın: \`${message.author.username}\`) kral! 🌙 Nights ailemizin sevilen bir üyesisin.`;
    }

    // 0.1. TÜRK İNTERNET MİZAHI & SÖZLÜK GEYİKLERİ (Örn: 31)
    if (
      rawLower === '31' ||
      rawLower === '31 ne demek' ||
      rawLower.includes('31 ne demek') ||
      rawLower === '31 nedir' ||
      rawLower === '31 in anlamı'
    ) {
      return `Haha klasik soru kral! 😂 Türk internet ve sokak mizahında **31**, argoda erkek mastürbasyonunu simgeleyen meşhur bir geyiktir. Kökeni Osmanlı dönemindeki ebced hesabına dayanır (el çekmek eyleminin harf sayıları toplamı 31 eder). Sunucuda fazla spamlamayın ama tam bir Türk internet klasiğidir! 🚀`;
    }

    // 0.2. ALO / SES VERME / YOKLAMA
    if (
      rawLower === 'alo' ||
      rawLower === 'alo e' ||
      rawLower === 'alo e dersem' ||
      rawLower === 'alooo' ||
      rawLower === 'burda mısın' ||
      rawLower === 'ses ver' ||
      rawLower === 'pişt'
    ) {
      return `Alooo! Buradayım kral, sesini net duyuyorum! 📞 Ne yapıyoruz, nasıl yardımcı olayım? Emrindeyim! 🚀`;
    }

    // 0.3. SELAMLAŞMA & HAL HATIR
    if (rawLower === 'sa' || rawLower === 'selam' || rawLower === 'slm' || rawLower === 'selamün aleyküm' || rawLower === 'merhaba') {
      return `Aleyküm selam **${displayName}**, hoş geldin! Günün nasıl geçiyor, keyifler nasıl? 👋✨`;
    }

    if (rawLower === 'naber' || rawLower === 'nasılsın' || rawLower === 'naber nasılsın') {
      return `Bomba gibiyim ${displayName}! Sunucuyu 7/24 korumaya ve sizinle takılmaya devam ediyorum. Senden naber, her şey yolunda mı? 😊`;
    }

    if (rawLower.includes('kimsin') || rawLower.includes('sen kimsin') || rawLower === 'nesin') {
      return `Ben **Nights Guard**! 🛡️ **Erencix** tarafından kodlanmış, **☊ Nights** sunucusunun akıllı koruma, eğlence, seviye, müzik ve yapay zeka asistanıyım. Emrindeyim kral! ✨`;
    }

    if (rawLower.includes('sahibin kim') || rawLower.includes('seni kim yaptı') || rawLower.includes('kurucun kim')) {
      return `Beni kodlayan ve bu sunucuyu kuran kral **Erencix** (<@${this.OWNER_ID}>)! 👑`;
    }

    // 1. KADEME: Gemini API (Varsa doğrudan Google Generative AI çalıştır)
    this.initGemini();
    if (this.geminiClient) {
      try {
        const fullPrompt = history.map((h) => `${h.role === 'user' ? 'Kullanıcı' : 'Nights Guard'}: ${h.content}`).join('\n');
        const res = await this.geminiClient.generateContent(fullPrompt);
        const text = res.response.text();
        if (text && text.trim().length > 0) return text.trim();
      } catch (geminiErr: any) {
        console.warn('[AIChatManager] Gemini API çağrısı atlandı:', geminiErr.message);
      }
    }

    // 2. KADEME: Canlı Üretken LLM (Pollinations 46 saniye aralık kontrolü)
    const now = Date.now();
    if (now - this.lastPollinationsTime > 46000) {
      try {
        const url = `https://text.pollinations.ai/prompt/${encodeURIComponent(`[Sen samimi, zeki Türkçe konuşan Discord botu Nights Guardsın. Kullanıcı ${displayName}: ${currentPrompt}]`)}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 9000);

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

    // 3. KADEME: Ansiklopedik / Felsefi / Tarihi Soru Kontrolü (Vikipedi API ile Anında Canlı Yanıt)
    if (rawLower.includes('kimdir') || rawLower.includes('nedir') || rawLower.includes('nerede') || rawLower.includes('tarihi')) {
      const wikiExtract = await this.lookupWikipedia(currentPrompt);
      if (wikiExtract) {
        return `📚 **Hemen anlatayım ${displayName}:**\n\n${wikiExtract}\n\n*Başka aklına takılan veya merak ettiğin bir konu var mı kral?* ✨`;
      }
    }

    // 4. KADEME: Kodlama ve Yazılım İstekleri
    if (rawLower.includes('kod') || rawLower.includes('yazılım') || rawLower.includes('python') || rawLower.includes('javascript') || rawLower.includes('discord.js')) {
      return this.handleCodeRequest(currentPrompt, displayName);
    }

    // 5. KADEME: Oyun ve Ajan Taktikleri (Valorant, CS2, LoL)
    if (rawLower.includes('valorant') || rawLower.includes('cs2') || rawLower.includes('lol') || rawLower.includes('oyun')) {
      return `Oyun muhabbetine bayılırım kral! 🎮 Sunucumuzda <#1568644570189791338> kanalı ve sesli 5 kişilik Valorant odalarımız bunun için var. Sen genelde hangi ajanı/şampiyonu oynuyorsun? İstersen crosshair ayarlarından silah tercihlerine kadar konuşabiliriz! 🎯`;
    }

    // 6. KADEME: Anime & Dizi İstekleri
    if (rawLower.includes('anime') || rawLower.includes('film') || rawLower.includes('dizi')) {
      return `Tam yerine geldin ${displayName}! 🍿\n` +
        `• Eğer efsane aksiyon ve karanlık atmosfer istersen: **Jujutsu Kaisen** veya **Cyberpunk: Edgerunners**\n` +
        `• Eğer beyin yakan hikaye ve derinlik istersen: **Steins;Gate** veya **Death Note**\n` +
        `• Eğer komedi ve keyifli bir şey istersen: **Spy x Family** veya **KonoSuba**!\n` +
        `Nasıl bir tür havasındasın bugün kral? ✨`;
    }

    // 7. KADEME: Organik ve Dinamik Doğal Yanıt
    return `Dinliyorum kral, tam olarak "${currentPrompt}" hakkında ne düşünüyorsun veya ne yapmak istiyorsun? Detay ver, hemen yardımcı olayım! 🚀🌙`;
  }

  /**
   * Türkçe Vikipedi'den Anlık Özet Çekme
   */
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

  /**
   * Kod İstekleri İçin Akıllı Kod Üretimi
   */
  private static handleCodeRequest(prompt: string, userName: string): string {
    const p = prompt.toLowerCase();

    if (p.includes('python')) {
      return (
        `İşte istediğin örnek Python kodu ${userName}! 🐍\n` +
        '```python\n' +
        'import random\n\n' +
        'def sayi_tahmin():\n' +
        '    hedef = random.randint(1, 100)\n' +
        '    print("1 ile 100 arasında bir sayı tuttum!")\n' +
        '    while True:\n' +
        '        tahmin = int(input("Tahminin: "))\n' +
        '        if tahmin < hedef:\n' +
        '            print("Daha büyük!")\n' +
        '        elif tahmin > hedef:\n' +
        '            print("Daha küçük!")\n' +
        '        else:\n' +
        '            print("Tebrikler! Doğru bildin 🎉")\n' +
        '            break\n\n' +
        'sayi_tahmin()\n' +
        '```\n' +
        'İstediğin başka bir algoritma veya fonksiyon varsa hemen yazabilirim kral!'
      );
    }

    return (
      `Tabii ki ${userName}! Kodlama konusunda her zaman yardımcı olurum. İşte temiz bir JavaScript / Node.js örneği: 💻\n` +
      '```javascript\n' +
      '// Nights Guard Yardımcı Fonksiyonu\n' +
      'function hesapla(oran, taban) {\n' +
      '  return (taban * oran) / 100;\n' +
      '}\n' +
      'console.log("Sonuç:", hesapla(18, 500));\n' +
      '```\n' +
      'Tam olarak hangi kütüphane veya dil üzerinde çalışmak istiyorsun? Detay ver, sıfırdan mimariyi yazalım! 🚀'
    );
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
