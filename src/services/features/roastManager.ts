import {
  Guild,
  GuildMember,
  ChannelType,
  TextChannel,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { LevelManager } from './levelManager';
import { EconomyManager } from './economyManager';
import { config } from '../../config';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface UserMessageQuote {
  channel: string;
  content: string;
  time: number;
}

export class RoastManager {
  private static geminiClient: any = null;

  /**
   * Kullanıcının sunucudaki tüm açık metin kanallarındaki geçmiş mesajlarını tarar
   */
  public static async fetchUserChatHistory(
    guild: Guild,
    userId: string,
    maxMessages = 40
  ): Promise<UserMessageQuote[]> {
    const userQuotes: UserMessageQuote[] = [];

    // Taranacak chat kanallarını tespit et (Log, kural, duyuru ve bilet kanallarını filtrele)
    const ignoreRegex = /(log|kural|rule|duyuru|announcement|welcome|giris|cikis|kayit|secim|panel|ticket|destek)/i;
    const candidateChannels = guild.channels.cache.filter(
      (c) =>
        c &&
        c.type === ChannelType.GuildText &&
        !ignoreRegex.test(c.name)
    ) as Map<string, TextChannel>;

    // İlk 8 aktif kanalı paralel olarak tara
    const channelList = Array.from(candidateChannels.values()).slice(0, 10);
    const fetchPromises = channelList.map(async (ch) => {
      try {
        const messages = await ch.messages.fetch({ limit: 100 });
        const filtered = messages.filter(
          (m) =>
            m.author.id === userId &&
            m.content.trim().length > 0 &&
            !m.content.startsWith('/') // Bot slash komutlarını dahil etme
        );

        for (const [, msg] of filtered) {
          userQuotes.push({
            channel: ch.name,
            content: msg.content.trim(),
            time: msg.createdTimestamp,
          });
        }
      } catch (err) {
        // İzin yoksa veya fetch başarısızsa atla
      }
    });

    await Promise.allSettled(fetchPromises);

    // En yeni mesajlara göre sırala ve maksimum limitle
    userQuotes.sort((a, b) => b.time - a.time);
    return userQuotes.slice(0, maxMessages);
  }

  /**
   * Kullanıcının mesajlarını ve sunucu profilini okuyup acımasız ve komik bir ROAST üretir
   */
  public static async generateRoast(
    guild: Guild,
    targetMember: GuildMember,
    caller: GuildMember
  ): Promise<{
    roast: string;
    quoteCount: number;
    damagePercent: number;
    sampleQuotes: string[];
  }> {
    const userId = targetMember.id;
    const displayName = targetMember.displayName;
    const username = targetMember.user.username;
    const isOwner = userId === '1138498666785677492';

    // 1. Kullanıcının sunucudaki tüm mesajlarını topla
    const quotes = await this.fetchUserChatHistory(guild, userId, 35);

    // 2. Profil ve İstatistik Verileri
    const levelData = LevelManager.getUserData(userId);
    const coins = EconomyManager.getBalance(userId);
    const voiceHours = Math.round((levelData.voiceMinutes || 0) / 60);
    const roles = targetMember.roles.cache
      .filter((r) => r.name !== '@everyone')
      .map((r) => r.name)
      .slice(0, 5)
      .join(', ');

    const sampleQuoteTexts = quotes.map((q) => q.content);

    // 3. Yapay Zekayı Çağır (Gemini -> Canlı Web LLM -> Smart Local Fallback)
    const prompt = this.buildRoastPrompt({
      displayName,
      username,
      isOwner,
      level: levelData.level,
      voiceHours,
      coins,
      roles: roles || 'Normal Üye',
      quotes: quotes.map((q) => `[#${q.channel}]: "${q.content}"`),
    });

    let roastText = await this.callAI(prompt);

    // Eğer AI boş veya hatalı dönerse derin yerel mizah motorunu devreye sok
    if (!roastText || roastText.length < 50) {
      roastText = this.synthesizeLocalRoast({
        displayName,
        username,
        isOwner,
        level: levelData.level,
        voiceHours,
        coins,
        roles,
        quotes,
      });
    }

    const damagePercent = Math.min(100, Math.max(70, Math.floor(Math.random() * 30) + 75));

    return {
      roast: roastText,
      quoteCount: quotes.length,
      damagePercent,
      sampleQuotes: sampleQuoteTexts.slice(0, 4),
    };
  }

  /**
   * Kullanıcının geçmişine ve mesajlarına göre komik Lakap & Karakter Kartı üretir
   */
  public static async generateNickname(
    guild: Guild,
    targetMember: GuildMember
  ): Promise<{
    nickname: string;
    title: string;
    story: string;
    dangerRating: number;
    superpower: string;
    weakness: string;
  }> {
    const userId = targetMember.id;
    const displayName = targetMember.displayName;
    const quotes = await this.fetchUserChatHistory(guild, userId, 30);
    const levelData = LevelManager.getUserData(userId);
    const voiceHours = Math.round((levelData.voiceMinutes || 0) / 60);

    const quoteSample = quotes.map((q) => q.content).join(' | ');

    // Anahtar kelime tarayıcısı
    const lowerQuotes = quoteSample.toLowerCase();

    let nickname = 'Gece Nöbetçisi';
    let title = 'Gizemli Chat Hayaleti';
    let story = 'Sunucuda o kadar az iz bıraktı ki kimse tam olarak ne yaptığını çözemedi.';
    let superpower = 'Görünmez olmak ve kimse fark etmeden çıkmak';
    let weakness = 'Tek kelime sohbet başlatamamak';

    if (lowerQuotes.includes('valo') || lowerQuotes.includes('marshall') || lowerQuotes.includes('reyna')) {
      nickname = 'Elo Cehennemi Mareşali';
      title = '0/10 Reyna Şampiyonu';
      story = `Chatte "marshall babayım" ve "valo gircek varmı" diye takım arayıp ilk roundda tek yemekle ünlendi.`;
      superpower = 'Her round başı flashı kendi takımına atmak';
      weakness = 'Tek kurşun yemeden önce "ben bu adamı vurdum" demek';
    } else if (lowerQuotes.includes('pc') || lowerQuotes.includes('kaldırmıyor') || lowerQuotes.includes('kasıyor')) {
      nickname = 'Tost Makinesi Şövalyesi';
      title = '25 FPS Emekçisi';
      story = `CS2 açmaya çalışırken fan sesinden tüm binayı ayağa kaldırdı. Chatte "pc kaldırmıyor" isyanıyla tarihe geçti.`;
      superpower = 'Oyun donduğu anda DC\'den düşmemeyi başarmak';
      weakness = 'Google Chrome açıldığında sistemin mavi ekran vermesi';
    } else if (lowerQuotes.includes('owo') || lowerQuotes.includes('bal') || lowerQuotes.includes('top')) {
      nickname = 'Kumar Masası Müdavimi';
      title = 'OwO Bataklığı Sakini';
      story = `Sunucuda ekonomi botlarına gece gündüz "w bal top" spamlamaktan gerçek dünyayla ilişiğini kesti.`;
      superpower = 'Saniyede 4 kez bakiye kontrolü yapmak';
      weakness = 'Yazı-tura oyununda tüm varlığını kaybetmek';
    } else if (lowerQuotes.includes('where') || lowerQuotes.includes('froom') || lowerQuotes.includes('bro')) {
      nickname = 'A1 Londra Fatihi';
      title = 'Global Dil Elçisi';
      story = `Genel sohbette "where are you froom" yazarak sunucunun uluslararası ilişkilerini tek başına yönetti.`;
      superpower = 'İki kelimeyle tüm yabancılarla anlaşabilmek';
      weakness = 'Google Translate kullanırken yakalanmak';
    } else if (voiceHours > 10) {
      nickname = 'Kulaklık Süngeri';
      title = '7/24 Ses Odası Mobilyası';
      story = `Seste ${voiceHours} saat boyunca mikrofon kapalı takılarak odanın bir parçası haline geldi.`;
      superpower = 'Seste 8 saat aralıksız sessiz durmak';
      weakness = 'Birisi "burada mısın" dediğinde panikle mikrofona üflemek';
    } else {
      nickname = `Dertli ${displayName.split(' ')[0]}`;
      title = 'Gece 3 Çaylak Filozofu';
      story = `Sunucuda ara sıra görünüp iki kelime yazdıktan sonra ortadan kaybolan gizemli şahsiyet.`;
      superpower = 'Her tartışmayı tek cümleyle bitirmek';
      weakness = 'Sabah erken uyanmak';
    }

    const dangerRating = Math.floor(Math.random() * 40) + 60; // 60-99

    return {
      nickname,
      title,
      story,
      dangerRating,
      superpower,
      weakness,
    };
  }

  /**
   * Roast Yapay Zeka İstek Metni Oluşturucu
   */
  private static buildRoastPrompt(data: {
    displayName: string;
    username: string;
    isOwner: boolean;
    level: number;
    voiceHours: number;
    coins: number;
    roles: string;
    quotes: string[];
  }): string {
    const quoteBlock =
      data.quotes.length > 0
        ? data.quotes.slice(0, 25).join('\n')
        : '(Bu kullanıcının sunucuda yazılı tek bir mesajı bile yok! Tam bir hayalet, pusuya yatmış sessizce bekliyor!)';

    return `Sen dünyanın en zeki, aşırı komik, esprili ve hazırcevap Discord roast ustasısın.
Sunucu: ☊ Nights
Hedef Kullanıcı: "${data.displayName}" (@${data.username})
Kullanıcı Rolleri: ${data.roles}
Seviyesi: Level ${data.level}
Seste Geçirdiği Süre: ${data.voiceHours} saat
Ekonomi Bakiyesi: ${data.coins} Nights Coin
${data.isOwner ? 'NOT: Bu kişi sunucunun kurucusu ve botun mimarı Erencix! Ona özel bir saygılı-esprili patron roastı yap.' : ''}

AŞAĞIDAKİLER BU KULLANICININ SUNUCUDA YAZDIĞI GERÇEK SOHBET MESAJLARIDIR:
---
${quoteBlock}
---

GÖREVİN:
Bu kullanıcının yazdığı mesajları tek tek incele, chatteki konuşma tarzını, attığı tripleri, cringe anlarını, hatalarını ve alışkanlıklarını yüzüne vurarak onu EFSANEVİ BİR ŞEKİLDE ROAST ET!

KURALLAR:
1. Yazdığı mesajlardan ve kelimelerden MUTLAKA doğrudan alıntılar yap ('Şu kanalda "... " yazmandan belli', 'Her gün şu kelimeyi spamlaman' gibi somut örnekler ver).
2. Türk Discord ve gençlik sokak mizahını kullan (Valorant tilti, CS2 ağlamaları, liseli tripleri, gece melankolisi, boş yapma sanatı).
3. Küfür, hakaret veya ailevi değerlere saldırmak KESİNLİKLE YASAKTIR. Sadece ultra zeki, kahkaha attıran, okuyanın "Ooooo felaket vurdu!" diyeceği bir stand-up performansı sergile.
4. Yaklaşık 2-3 vurucu paragraf uzunluğunda olsun.
5. En sona '🔥 Hasar Raporu: %95 Ağır Travma' gibi tek satırlık komik bir istatistik ekle.`;
  }

  /**
   * Yapay Zeka Çağrı Motoru (Gemini -> Binjie -> Pollinations)
   */
  private static async callAI(prompt: string): Promise<string | null> {
    // 1. Resmi Gemini API
    const geminiKey = config.geminiApiKey || process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        if (!this.geminiClient) {
          const genAI = new GoogleGenerativeAI(geminiKey);
          this.geminiClient = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        }
        const res = await this.geminiClient.generateContent(prompt);
        const text = res.response.text();
        if (text && text.trim().length > 40) return text.trim();
      } catch (err: any) {
        console.warn('[RoastManager] Gemini API atlandı:', err.message);
      }
    }

    // 2. Canlı ChatGPT LLM Uç Noktası (Binjie)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

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
          prompt,
          system: 'Sen Discord kullanıcılarını sohbet geçmişlerine göre zekice ve esprili şekilde roast eden profesyonel bir stand-up komedyenisin.',
          withoutContext: true,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().length > 40 && !text.includes('Error') && !text.includes('403 Forbidden')) {
          return text.trim();
        }
      }
    } catch (e: any) {
      console.warn('[RoastManager] Binjie LLM atlandı:', e.message);
    }

    return null;
  }

  /**
   * Yedek Zeka: Kullanıcının gerçek kelimelerini ayrıştırıp esprili roast sentezleyen motor
   */
  private static synthesizeLocalRoast(data: {
    displayName: string;
    username: string;
    isOwner: boolean;
    level: number;
    voiceHours: number;
    coins: number;
    roles: string;
    quotes: UserMessageQuote[];
  }): string {
    const rawQuotes = data.quotes.map((q) => q.content);
    const joined = rawQuotes.join(' ').toLowerCase();

    const parts: string[] = [];

    // Giriş
    parts.push(
      `Gelin hep birlikte **${data.displayName}** (@${data.username}) kardeşimizin sunucudaki o dillere destan "kariyerini" bir masaya yatıralım...`
    );

    // Mesaj Analiz Bölümü
    if (data.quotes.length === 0) {
      parts.push(
        `Her şeyden önce sunucuda **tek bir mesaj bile atmamışsın!** Sunucuya girdiğinden beri arkaplanda mobilya gibi dikiliyorsun. ` +
        `Seste saatlerce durup tek kelime etmemek bir süper güçse eğer tebrikler, Marvel seni arıyor! Bir selam ver be kral, klavyen mi paralı?`
      );
    } else {
      // Gerçek mesajlardan alıntılar yakala
      const valoMsg = data.quotes.find((q) => q.content.toLowerCase().includes('valo') || q.content.toLowerCase().includes('marshall'));
      const csMsg = data.quotes.find((q) => q.content.toLowerCase().includes('cs') || q.content.toLowerCase().includes('pc'));
      const owoMsg = data.quotes.find((q) => q.content.toLowerCase().includes('owo') || q.content.toLowerCase().includes('bal'));
      const engMsg = data.quotes.find((q) => q.content.toLowerCase().includes('where') || q.content.toLowerCase().includes('froom') || q.content.toLowerCase().includes('bro'));

      let analysis = `Sunucudaki mesaj geçmişine baktım da tam bir drama filmi! `;

      if (valoMsg) {
        analysis += `Bir kanalda kalkıp **"${valoMsg.content}"** diye hava atıyorsun, `;
      }
      if (csMsg) {
        analysis += `sonra başka kanala geçip **"${csMsg.content}"** diye ağlıyorsun. Kendine gel reis, bu ne hız bu ne tezat! `;
      }
      if (owoMsg) {
        analysis += `Arada ekonomi kanallarında **"${owoMsg.content}"** yazarak zengin olma hayalleri kurduğunu da görmedik sanma. `;
      }
      if (engMsg) {
        analysis += `Hele genel sohbette patlattığın **"${engMsg.content}"** cümlesi var ya... Oxford Üniversitesi rektörü görse diplomasını yırtar atardı! 😂 `;
      }

      if (!valoMsg && !csMsg && !owoMsg && !engMsg) {
        const randomQuote = data.quotes[0];
        analysis += `Daha geçen gün chatte **"${randomQuote.content}"** yazmışsın. Bunu yazarken hiç mi dönüp "ben ne yapıyorum" demedin kral? ` +
          `Sohbetteki varlığınla yokluğun arasındaki tek fark sunucu veritabanına binen 3 baytlık yük resmen!`;
      }

      parts.push(analysis);
    }

    // Seviye ve Ses Odası İncelemesi
    parts.push(
      `Level durumuna bakıyoruz: **Level ${data.level}**, ses süren ise **${data.voiceHours} saat**. ` +
      `Seste o kadar çok vakit geçirmişsin ki odadaki diğer üyeler seni kanalın sabit botu sanmaya başlamış. ` +
      `Cebindeki **${data.coins} Nights Coin** ile de ancak sunucunun çay ocağından soğuk su içersin!`
    );

    // Kapanış
    parts.push(
      `Sonuç olarak: Seni seviyoruz kral ama klavyeyi ve mikrofonu kullanırken lütfen biraz daha dikkatli ol, ortamı kırıp geçiriyorsun! 💀🔥\n\n` +
      `📊 **Hasar Raporu:** \`[██████████] %99 Ağır Hasar (Kritik Vuruş)\``
    );

    return parts.join('\n\n');
  }

  /**
   * Roast Embed Kartı
   */
  public static buildRoastEmbed(
    targetMember: GuildMember,
    caller: GuildMember,
    roastText: string,
    quoteCount: number,
    damagePercent: number
  ): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(0xe74c3c)
      .setAuthor({
        name: `🔥 NIGHTS ROAST ARENASI • STAND-UP ŞOVU`,
        iconURL: targetMember.guild.iconURL() || undefined,
      })
      .setTitle(`💀  ${targetMember.displayName.toUpperCase()} YERİN DİBİNE SOKULDU!`)
      .setDescription(
        `🎯 **Hedef:** <@${targetMember.id}> | 🎤 **İnfazı İsteyen:** <@${caller.id}>\n` +
        `📜 **Taranan Sohbet Mesajı:** \`${quoteCount} adet gerçek mesaj incelendi\`\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `${roastText}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
      )
      .setThumbnail(targetMember.displayAvatarURL())
      .setImage('https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif')
      .setFooter({
        text: `Nights AI Roast Engine • Sadece eğlence amaçlıdır, ciddiye alıp küsmeyin!`,
      })
      .setTimestamp();
  }

  /**
   * Lakap Embed Kartı
   */
  public static buildNicknameEmbed(
    targetMember: GuildMember,
    card: {
      nickname: string;
      title: string;
      story: string;
      dangerRating: number;
      superpower: string;
      weakness: string;
    }
  ): EmbedBuilder {
    const dangerBlocks = Math.round((card.dangerRating / 100) * 10);
    const dangerBar = '🟥'.repeat(dangerBlocks) + '⬛'.repeat(10 - dangerBlocks);

    return new EmbedBuilder()
      .setColor(0x8b5cf6)
      .setAuthor({
        name: `👑 NIGHTS RESMİ LAKAP & KARAKTER KARTI`,
        iconURL: targetMember.guild.iconURL() || undefined,
      })
      .setTitle(`🎭  ${targetMember.displayName} ➔ "${card.nickname}"`)
      .setDescription(
        `👤 **Üye:** <@${targetMember.id}>\n` +
        `🏷️ **Resmi Unvanı:** \`${card.title}\`\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `📜 **Lakabın Doğuş Hikayesi (Geçmiş Analizi):**\n` +
        `> *"${card.story}"*\n\n` +
        `⚡ **Özel Yeteneği:**\n` +
        `> ✨ \`${card.superpower}\`\n\n` +
        `⚠️ **En Büyük Zaafı:**\n` +
        `> 💥 \`${card.weakness}\`\n\n` +
        `📊 **Tehlike / Cringe Seviyesi:**\n` +
        `\`[${dangerBar}] %${card.dangerRating}\`\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
      )
      .setThumbnail(targetMember.displayAvatarURL())
      .setImage('https://media.giphy.com/media/26tn3334mvoVClhos/giphy.gif')
      .setFooter({
        text: `Nights Character Studio • Made by erencix`,
      })
      .setTimestamp();
  }
}
