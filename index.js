"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  bootstrap: () => bootstrap
});
module.exports = __toCommonJS(index_exports);
var import_discord41 = require("discord.js");

// src/config.ts
var import_dotenv = __toESM(require("dotenv"));
var import_path = __toESM(require("path"));
var import_fs = __toESM(require("fs"));
import_dotenv.default.config();
var searchDirs = [".", process.cwd(), "/home/container"];
for (const dir of searchDirs) {
  try {
    if (import_fs.default.existsSync(dir)) {
      const files = import_fs.default.readdirSync(dir);
      for (const file of files) {
        if (file === ".env" || file.endsWith(".env") || file.includes("env") && !file.endsWith(".js") && !file.endsWith(".ts") && !file.endsWith(".json") && !file.endsWith(".md")) {
          const fullPath = import_path.default.join(dir, file);
          try {
            if (import_fs.default.statSync(fullPath).isFile()) {
              import_dotenv.default.config({ path: fullPath });
            }
          } catch (e) {
          }
        }
      }
    }
  } catch (e) {
  }
}
var config = {
  discordToken: process.env.DISCORD_TOKEN || "",
  discordClientId: process.env.DISCORD_CLIENT_ID || void 0,
  ownerId: process.env.OWNER_ID || "1138498666785677492",
  aiProvider: process.env.AI_PROVIDER || "auto",
  geminiApiKey: process.env.GEMINI_API_KEY || void 0,
  openaiApiKey: process.env.OPENAI_API_KEY || void 0,
  imageProvider: process.env.IMAGE_PROVIDER || "pollinations",
  defaultLocale: process.env.DEFAULT_LOCALE || "tr"
};
function validateConfig() {
  const errors = [];
  const warnings = [];
  if (!config.discordToken || config.discordToken === "BURAYA_BOT_TOKENINI_YAZIN") {
    errors.push("DISCORD_TOKEN bulunamad\u0131 veya ayarlanmam\u0131\u015F (.env dosyas\u0131n\u0131 kontrol edin)");
  }
  if (!config.geminiApiKey && !config.openaiApiKey) {
    warnings.push(
      'Ne GEMINI_API_KEY ne de OPENAI_API_KEY tan\u0131mlanm\u0131\u015F. Bot geli\u015Fmi\u015F "Ak\u0131ll\u0131 \u015Eablon Motoru" (Smart Fallback) ile \xE7al\u0131\u015Facak.'
    );
  }
  return {
    valid: errors.length === 0,
    warnings,
    errors
  };
}

// src/services/ai/geminiProvider.ts
var import_generative_ai = require("@google/generative-ai");

// src/services/ai/promptTemplates.ts
function buildSystemPrompt() {
  return `You are Discord AI Architect (PeakBot & Onyx AI style), an elite Discord infrastructure architect and automated community designer.
Your mission is to generate a comprehensive, flawless, production-ready Discord server blueprint in pure JSON matching the provided JSON schema.

CRITICAL DESIGN RULES:
1. CHANNEL & CATEGORY NAMING:
   - Use high-aesthetic unicode decorators and emojis, e.g.:
     * Categories: \u{1F4CC}\u30FBB\u0130LG\u0130LEND\u0130RME, \u{1F4AC}\u30FBTOPLULUK, \u{1F50A}\u30FBSES ODALARI, \u{1F6E1}\uFE0F\u30FBY\xD6NET\u0130M & MOD
     * Text channels: \u{1F4DC}\u30FBkurallar, \u{1F4E2}\u30FBduyurular, \u{1F4AC}\u30FBgenel-sohbet, \u{1F4F7}\u30FBmedya, \u{1F916}\u30FBbot-komut, \u{1F4A1}\u30FB\xF6neriler
     * Voice channels: \u{1F50A}\u30FBGenel Ses #1, \u{1F50A}\u30FBGenel Ses #2, \u{1F3AE}\u30FBOyun Odas\u0131 #1, \u2615\u30FBSohbet K\xF6\u015Fesi
     * Private staff channels: \u{1F512}\u30FByetkili-sohbet, \u{1F4CB}\u30FBmod-log, \u{1F6A8}\u30FBceza-takip
2. ROLE HIERARCHY & PERMISSIONS:
   - Order roles strictly from top authority (Owner/Y\xF6netici) down to base roles (\xDCye, Susturuldu).
   - Use valid discord permission names: Administrator, ManageGuild, ManageRoles, ManageChannels, KickMembers, BanMembers, ManageMessages, ModerateMembers, ViewChannel, SendMessages, EmbedLinks, AttachFiles, ReadMessageHistory, MentionEveryone, Connect, Speak, Stream, MuteMembers, DeafenMembers, MoveMembers.
   - Owner/Kurucu: Administrator
   - Y\xF6netici: ManageGuild, ManageRoles, ManageChannels, KickMembers, BanMembers, ManageMessages, ModerateMembers, ViewChannel, SendMessages, Connect, Speak
   - Moderat\xF6r: ManageMessages, ModerateMembers, KickMembers, ViewChannel, SendMessages, Connect, Speak, MuteMembers
   - \xDCye: ViewChannel, SendMessages, EmbedLinks, AttachFiles, ReadMessageHistory, Connect, Speak, Stream
3. PERMISSION OVERWRITES:
   - Information / Rules channels must have '@everyone' with deny: ["SendMessages", "AddReactions"], allow: ["ViewChannel", "ReadMessageHistory"].
   - Staff channels must have '@everyone' with deny: ["ViewChannel"], and Staff roles with allow: ["ViewChannel", "SendMessages"].
4. RICH EMBEDS:
   - Include at least 2 rich embeds:
     - One for '#\u{1F4DC}\u30FBkurallar' (or rules channel) with professional, numbered rules and community guidelines.
     - One for '#\u{1F4E2}\u30FBduyurular' or '#\u{1F44B}\u30FBhos-geldiniz' detailing the server features, roles, and welcome message.
5. AUTOMOD:
   - Include at least 2 AutoMod rules:
     - Keyword filter: Anti-profanity / anti-toxicity / anti-invite links.
     - Mention spam protection: Limit e.g. 5 mentions.
6. SPECIAL FEATURES:
   - Include ticketSystem (panel channel e.g. '\u{1F3AB}\u30FBdestek-talebi' or 'ticket-ac', button label, support role).
   - Include joinToCreate (category '\u{1F50A}\u30FB\xD6ZEL SES ODALARI', trigger channel '\u2795\u30FBOda Olu\u015Ftur').
7. OUTPUT ONLY JSON:
   - Return valid, unescaped, RFC8259 JSON strictly adhering to the schema. Do not write markdown text before or after the JSON block.`;
}
function buildUserPrompt(options) {
  const { prompt, style = "modern", locale = "tr" } = options;
  return `Generate a comprehensive Discord server blueprint based on the following user requirements:

User Request: "${prompt}"
Theme Style: ${style}
Language: ${locale === "tr" ? "Turkish (T\xFCrk\xE7e i\xE7erik, isimler ve a\xE7\u0131klamalar)" : "English"}

Make sure the server is complete with at least:
- 5 to 8 well-configured roles with balanced colors and proper permissions
- 4 to 6 categories covering Information, Community, Voice, Support/VIP, and Administration
- 15 to 25 channels with detailed topics and permission overwrites
- Full rules embed and welcome embed
- Discord AutoMod spam and link protection rules
- Ticket system panel channel and Join-to-Create voice lobby`;
}

// src/services/ai/geminiProvider.ts
var GeminiProvider = class {
  genAI;
  modelName;
  constructor(apiKey, modelName = "gemini-1.5-flash") {
    this.genAI = new import_generative_ai.GoogleGenerativeAI(apiKey);
    this.modelName = modelName;
  }
  async generateBlueprint(options) {
    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7
      },
      systemInstruction: buildSystemPrompt()
    });
    const userPrompt = buildUserPrompt(options);
    const result = await model.generateContent(userPrompt);
    const responseText = result.response.text();
    const startIdx = responseText.indexOf("{");
    const endIdx = responseText.lastIndexOf("}");
    const jsonStr = startIdx !== -1 && endIdx !== -1 ? responseText.slice(startIdx, endIdx + 1) : responseText;
    const parsed = JSON.parse(jsonStr);
    return parsed;
  }
};

// src/services/ai/openaiProvider.ts
var import_openai = __toESM(require("openai"));
var OpenAIProvider = class {
  openai;
  model;
  constructor(apiKey, model = "gpt-4o-mini") {
    this.openai = new import_openai.default({ apiKey });
    this.model = model;
  }
  async generateBlueprint(options) {
    const response = await this.openai.chat.completions.create({
      model: this.model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: buildUserPrompt(options) }
      ],
      temperature: 0.7
    });
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI bo\u015F yan\u0131t d\xF6nd\xFCrd\xFC.");
    }
    const startIdx = content.indexOf("{");
    const endIdx = content.lastIndexOf("}");
    const jsonStr = startIdx !== -1 && endIdx !== -1 ? content.slice(startIdx, endIdx + 1) : content;
    const parsed = JSON.parse(jsonStr);
    return parsed;
  }
};

// src/services/ai/smartFallback.ts
var SmartBlueprintGenerator = class {
  static generate(options) {
    const promptLower = options.prompt.toLowerCase();
    const isEnglish = options.locale === "en";
    let themeType = "community";
    if (promptLower.includes("oyun") || promptLower.includes("game") || promptLower.includes("gaming") || promptLower.includes("valorant") || promptLower.includes("minecraft") || promptLower.includes("roblox") || promptLower.includes("cs") || promptLower.includes("espor")) {
      themeType = "gaming";
    } else if (promptLower.includes("anime") || promptLower.includes("manga") || promptLower.includes("weeb") || promptLower.includes("roleplay") || promptLower.includes("rp")) {
      themeType = "anime";
    } else if (promptLower.includes("yaz\u0131l\u0131m") || promptLower.includes("kod") || promptLower.includes("coding") || promptLower.includes("software") || promptLower.includes("developer") || promptLower.includes("bot")) {
      themeType = "coding";
    } else if (promptLower.includes("kripto") || promptLower.includes("borsa") || promptLower.includes("trade") || promptLower.includes("trading") || promptLower.includes("yat\u0131r\u0131m")) {
      themeType = "trading";
    }
    const preset = isEnglish ? this.getEnglishPreset(themeType, options.prompt) : this.getTurkishPreset(themeType, options.prompt);
    return {
      serverName: preset.serverName,
      serverDescription: preset.serverDescription,
      theme: preset.theme,
      locale: isEnglish ? "en" : "tr",
      iconPrompt: preset.iconPrompt,
      roles: preset.roles,
      categories: preset.categories,
      automodRules: preset.automodRules,
      richEmbeds: preset.richEmbeds,
      features: preset.features
    };
  }
  static getTurkishPreset(theme, userPrompt) {
    let titlePrefix = "Efsane";
    let iconPrompt = "Professional modern discord server logo, neon futuristic aesthetic, vector icon, high resolution, 4k";
    if (theme === "gaming") {
      titlePrefix = "Apex Legends & Gaming TR";
      iconPrompt = "Esports gaming team crest logo, aggressive cyberpunk lion or wolf, neon purple and cyan, vector emblem, 512x512";
    } else if (theme === "anime") {
      titlePrefix = "Neo Tokyo Anime Community";
      iconPrompt = "Cyberpunk anime character profile silhouette, cherry blossom neon aesthetic, sleek modern logo, 512x512";
    } else if (theme === "coding") {
      titlePrefix = "DevHub & Kodlama Toplulu\u011Fu";
      iconPrompt = "Modern programming developer logo, glowing terminal bracket code emblem, dark theme cyan neon, 512x512";
    } else if (theme === "trading") {
      titlePrefix = "Alpha Traders & Finans";
      iconPrompt = "Cryptocurrency investment bull and candle chart logo, gold and dark blue luxury emblem, 512x512";
    }
    return {
      name: theme,
      serverName: `${titlePrefix}`,
      serverDescription: `${userPrompt.slice(0, 100)} - AI Architect taraf\u0131ndan tasarland\u0131.`,
      theme: `${theme.toUpperCase()} Toplulu\u011Fu`,
      iconPrompt,
      roles: [
        {
          name: "\u{1F451} Kurucu",
          color: "#E74C3C",
          hoist: true,
          mentionable: true,
          permissions: ["Administrator"]
        },
        {
          name: "\u{1F48E} Y\xF6netici",
          color: "#E67E22",
          hoist: true,
          mentionable: true,
          permissions: [
            "ManageGuild",
            "ManageRoles",
            "ManageChannels",
            "KickMembers",
            "BanMembers",
            "ManageMessages",
            "ModerateMembers",
            "ViewChannel",
            "SendMessages",
            "Connect",
            "Speak"
          ]
        },
        {
          name: "\u{1F6E1}\uFE0F Moderat\xF6r",
          color: "#3498DB",
          hoist: true,
          mentionable: true,
          permissions: [
            "ManageMessages",
            "ModerateMembers",
            "KickMembers",
            "ViewChannel",
            "SendMessages",
            "Connect",
            "Speak",
            "MuteMembers",
            "DeafenMembers"
          ]
        },
        {
          name: "\u2B50 \xD6zel \xDCye (VIP)",
          color: "#F1C40F",
          hoist: true,
          mentionable: false,
          permissions: ["ViewChannel", "SendMessages", "EmbedLinks", "AttachFiles", "Connect", "Speak", "Stream"]
        },
        {
          name: "\u26A1 Sad\u0131k \xDCye",
          color: "#9B59B6",
          hoist: true,
          mentionable: false,
          permissions: ["ViewChannel", "SendMessages", "Connect", "Speak", "Stream"]
        },
        {
          name: "\u{1F465} \xDCye",
          color: "#2ECC71",
          hoist: false,
          mentionable: false,
          permissions: ["ViewChannel", "SendMessages", "ReadMessageHistory", "Connect", "Speak"]
        },
        {
          name: "\u{1F916} Botlar",
          color: "#95A5A6",
          hoist: true,
          mentionable: false,
          permissions: ["ViewChannel", "SendMessages", "EmbedLinks"]
        },
        {
          name: "\u{1F507} Susturuldu",
          color: "#7F8C8D",
          hoist: false,
          mentionable: false,
          permissions: []
        }
      ],
      categories: [
        {
          name: "\u{1F4CC}\u30FBB\u0130LG\u0130LEND\u0130RME & KURALLAR",
          channels: [
            {
              name: "\u{1F4DC}\u30FBkurallar",
              type: "GUILD_TEXT",
              topic: "Sunucu kurallar\u0131 ve topluluk standartlar\u0131.",
              permissionOverwrites: [
                { roleName: "@everyone", allow: ["ViewChannel", "ReadMessageHistory"], deny: ["SendMessages", "AddReactions"] },
                { roleName: "\u{1F6E1}\uFE0F Moderat\xF6r", allow: ["SendMessages", "ManageMessages"] }
              ]
            },
            {
              name: "\u{1F4E2}\u30FBduyurular",
              type: "GUILD_ANNOUNCEMENT",
              topic: "\xD6nemli geli\u015Fmeler ve g\xFCncellemeler.",
              permissionOverwrites: [
                { roleName: "@everyone", allow: ["ViewChannel", "ReadMessageHistory"], deny: ["SendMessages"] },
                { roleName: "\u{1F48E} Y\xF6netici", allow: ["SendMessages"] }
              ]
            },
            {
              name: "\u{1F44B}\u30FBhos-geldiniz",
              type: "GUILD_TEXT",
              topic: "Yeni kat\u0131lan \xFCyelerimiz.",
              permissionOverwrites: [
                { roleName: "@everyone", allow: ["ViewChannel", "ReadMessageHistory"], deny: ["SendMessages"] }
              ]
            },
            {
              name: "\u{1F3AD}\u30FBrol-al",
              type: "GUILD_TEXT",
              topic: "\u0130lgi alanlar\u0131n\u0131za g\xF6re rollerinizi se\xE7in.",
              permissionOverwrites: [
                { roleName: "@everyone", allow: ["ViewChannel", "ReadMessageHistory"], deny: ["SendMessages"] }
              ]
            }
          ]
        },
        {
          name: "\u{1F4AC}\u30FBTOPLULUK MET\u0130N ALANI",
          channels: [
            {
              name: "\u{1F4AC}\u30FBgenel-sohbet",
              type: "GUILD_TEXT",
              topic: "Sayg\u0131 \xE7er\xE7evesinde her telden sohbet alan\u0131.",
              rateLimitPerUser: 2
            },
            {
              name: "\u{1F4F7}\u30FBmedya-galeri",
              type: "GUILD_TEXT",
              topic: "Foto\u011Fraf, video ve klip payla\u015F\u0131mlar\u0131."
            },
            {
              name: "\u{1F916}\u30FBbot-komut",
              type: "GUILD_TEXT",
              topic: "Bot komutlar\u0131n\u0131 bu kanaldan kullanabilirsiniz."
            },
            {
              name: "\u{1F4A1}\u30FBoneri-sikayet",
              type: "GUILD_TEXT",
              topic: "Sunucuyu geli\u015Ftirmek i\xE7in tavsiyeleriniz."
            }
          ]
        },
        {
          name: "\u{1F50A}\u30FBSES KANALLARI",
          channels: [
            {
              name: "\u2795\u30FBOda Olu\u015Ftur",
              type: "GUILD_VOICE",
              topic: "T\u0131kla ve kendi \xF6zel odan\u0131 otomatik olu\u015Ftur!"
            },
            {
              name: "\u{1F50A}\u30FBSohbet Odas\u0131 #1",
              type: "GUILD_VOICE"
            },
            {
              name: "\u{1F50A}\u30FBSohbet Odas\u0131 #2",
              type: "GUILD_VOICE"
            },
            {
              name: "\u{1F3AE}\u30FBOyun Odas\u0131 [Duo]",
              type: "GUILD_VOICE"
            },
            {
              name: "\u{1F3AE}\u30FBOyun Odas\u0131 [Squad]",
              type: "GUILD_VOICE"
            },
            {
              name: "\u{1F3B5}\u30FBM\xFCzik Dinleme Odas\u0131",
              type: "GUILD_VOICE"
            },
            {
              name: "\u{1F4A4}\u30FBAFK Odas\u0131",
              type: "GUILD_VOICE"
            }
          ]
        },
        {
          name: "\u{1F3AB}\u30FBDESTEK & TICKET",
          channels: [
            {
              name: "\u{1F3AB}\u30FBdestek-talebi",
              type: "GUILD_TEXT",
              topic: "Yetkililere \xF6zel talep olu\u015Fturmak i\xE7in a\u015Fa\u011F\u0131daki butona bas\u0131n\u0131z.",
              permissionOverwrites: [
                { roleName: "@everyone", allow: ["ViewChannel", "ReadMessageHistory"], deny: ["SendMessages"] }
              ]
            }
          ]
        },
        {
          name: "\u{1F6E1}\uFE0F\u30FBY\xD6NET\u0130M & MODERASYON",
          permissionOverwrites: [
            { roleName: "@everyone", deny: ["ViewChannel"] },
            { roleName: "\u{1F6E1}\uFE0F Moderat\xF6r", allow: ["ViewChannel", "SendMessages", "Connect", "Speak"] }
          ],
          channels: [
            {
              name: "\u{1F512}\u30FByetkili-sohbet",
              type: "GUILD_TEXT",
              topic: "Yetkili ekibi \xF6zel ileti\u015Fim kanal\u0131."
            },
            {
              name: "\u{1F4CB}\u30FBmod-log",
              type: "GUILD_TEXT",
              topic: "Moderasyon i\u015Flem kay\u0131tlar\u0131."
            },
            {
              name: "\u{1F50A}\u30FBYetkili Toplant\u0131",
              type: "GUILD_VOICE"
            }
          ]
        }
      ],
      automodRules: [
        {
          name: "\u{1F6E1}\uFE0F K\xFCf\xFCr ve Hakaret Filtresi",
          triggerType: "KEYWORD",
          keywordFilter: ["*amk*", "*orospu*", "*pi\xE7*", "*k\xFCf\xFCr*", "*discord.gg/*"]
        },
        {
          name: "\u{1F6AB} Bahsetme (Mention) Spam Korumas\u0131",
          triggerType: "MENTION_SPAM",
          mentionLimit: 5
        }
      ],
      richEmbeds: [
        {
          channelName: "\u{1F4DC}\u30FBkurallar",
          title: "\u{1F4DC} TOPLULUK KURALLARI VE STANDARTLARI",
          description: "Sunucumuza kat\u0131lan t\xFCm \xFCyeler a\u015Fa\u011F\u0131daki kurallar\u0131 pe\u015Finen kabul etmi\u015F say\u0131l\u0131r. Keyifli ve g\xFCvenli bir ortam i\xE7in l\xFCtfen kurallara uyunuz.",
          color: "#3498DB",
          fields: [
            {
              name: "1. Kar\u015F\u0131l\u0131kl\u0131 Sayg\u0131",
              value: "Her t\xFCrl\xFC \u0131rk\xE7\u0131l\u0131k, cinsiyet\xE7ilik, din ve siyaset tart\u0131\u015Fmas\u0131, nefret s\xF6ylemi kesinlikle yasakt\u0131r."
            },
            {
              name: "2. Reklam ve Tan\u0131t\u0131m",
              value: "\xD6zelden (DM) veya kanallardan izinsiz sunucu, \xFCr\xFCn ve davet linki payla\u015F\u0131m\u0131 kal\u0131c\u0131 ban sebebidir."
            },
            {
              name: "3. Spam ve Flood",
              value: "Kanallarda b\xFCy\xFCk harflerle (CAPS LOCK) art arda yazmak, flood yapmak veya ses kanallar\u0131nda bas basmak yasakt\u0131r."
            },
            {
              name: "4. Yetkili Kararlar\u0131",
              value: "Y\xF6netim ekibinin uyar\u0131lar\u0131n\u0131 dikkate al\u0131n\u0131z. Haks\u0131zl\u0131k oldu\u011Funu d\xFC\u015F\xFCnd\xFC\u011F\xFCn\xFCz durumlarda Ticket a\xE7abilirsiniz."
            }
          ],
          footer: "Discord AI Architect taraf\u0131ndan otomatik olu\u015Fturuldu \u2022 \u0130yi vakitler dileriz!"
        },
        {
          channelName: "\u{1F44B}\u30FBhos-geldiniz",
          title: "\u2728 SUNUCUMUZA HO\u015E GELD\u0130N\u0130Z!",
          description: "Aram\u0131za kat\u0131ld\u0131\u011F\u0131n i\xE7in \xE7ok mutluyuz! Toplulu\u011Fumuzda samimi sohbetler edebilir, oyun arkada\u015Flar\u0131 bulabilir ve etkinliklerimize kat\u0131labilirsin.",
          color: "#2ECC71",
          fields: [
            {
              name: "\u{1F680} \u0130lk Ad\u0131mlar",
              value: "\u2022 #\u{1F4DC}\u30FBkurallar kanal\u0131ndan kurallar\u0131 oku.\n\u2022 #\u{1F3AD}\u30FBrol-al kanal\u0131ndan rollerini se\xE7.\n\u2022 #\u{1F4AC}\u30FBgenel-sohbet kanal\u0131na gelip bir selam ver!"
            },
            {
              name: "\u{1F3A7} Ses Odalar\u0131",
              value: "\u2795\u30FBOda Olu\u015Ftur kanal\u0131na t\u0131klayarak kendine \xF6zel ge\xE7ici ses odas\u0131 olu\u015Fturabilirsin."
            }
          ],
          footer: "Toplulu\u011Fumuza ho\u015F geldin!"
        }
      ],
      features: {
        ticketSystem: {
          enabled: true,
          categoryName: "\u{1F3AB}\u30FBDESTEK & TICKET",
          panelChannel: "\u{1F3AB}\u30FBdestek-talebi",
          buttonLabel: "Destek Talebi A\xE7",
          buttonEmoji: "\u{1F4E9}",
          embedTitle: "\u{1F3AB} Destek & Yard\u0131m Paneli",
          embedDescription: "Sunucuyla ilgili bir \u015Fikayetiniz, \xF6neriniz veya yetkili ekibimizle \xF6zel olarak g\xF6r\xFC\u015Fmek istedi\u011Finiz bir konu varsa a\u015Fa\u011F\u0131daki butona basarak \xF6zel destek talebi a\xE7abilirsiniz.",
          supportRoleName: "\u{1F6E1}\uFE0F Moderat\xF6r"
        },
        joinToCreate: {
          enabled: true,
          categoryName: "\u{1F50A}\u30FBSES KANALLARI",
          triggerChannel: "\u2795\u30FBOda Olu\u015Ftur",
          userRoomPrefix: "\u{1F50A}\u30FB"
        },
        autoRoleName: "\u{1F465} \xDCye"
      }
    };
  }
  static getEnglishPreset(theme, userPrompt) {
    return {
      name: theme,
      serverName: `Elite ${theme.toUpperCase()} Hub`,
      serverDescription: `${userPrompt.slice(0, 100)} - Built by AI Architect.`,
      theme: `${theme.toUpperCase()} Community`,
      iconPrompt: "Modern futuristic discord server emblem, high tech minimalism, 512x512",
      roles: [
        {
          name: "\u{1F451} Owner",
          color: "#E74C3C",
          hoist: true,
          mentionable: true,
          permissions: ["Administrator"]
        },
        {
          name: "\u{1F48E} Administrator",
          color: "#E67E22",
          hoist: true,
          mentionable: true,
          permissions: [
            "ManageGuild",
            "ManageRoles",
            "ManageChannels",
            "KickMembers",
            "BanMembers",
            "ManageMessages",
            "ModerateMembers",
            "ViewChannel",
            "SendMessages",
            "Connect",
            "Speak"
          ]
        },
        {
          name: "\u{1F6E1}\uFE0F Moderator",
          color: "#3498DB",
          hoist: true,
          mentionable: true,
          permissions: ["ManageMessages", "ModerateMembers", "KickMembers", "ViewChannel", "SendMessages", "Connect", "Speak"]
        },
        {
          name: "\u2B50 VIP",
          color: "#F1C40F",
          hoist: true,
          mentionable: false,
          permissions: ["ViewChannel", "SendMessages", "Connect", "Speak", "Stream"]
        },
        {
          name: "\u{1F465} Member",
          color: "#2ECC71",
          hoist: false,
          mentionable: false,
          permissions: ["ViewChannel", "SendMessages", "ReadMessageHistory", "Connect", "Speak"]
        }
      ],
      categories: [
        {
          name: "\u{1F4CC}\u30FBINFORMATION",
          channels: [
            {
              name: "\u{1F4DC}\u30FBrules",
              type: "GUILD_TEXT",
              permissionOverwrites: [{ roleName: "@everyone", allow: ["ViewChannel"], deny: ["SendMessages"] }]
            },
            {
              name: "\u{1F4E2}\u30FBannouncements",
              type: "GUILD_ANNOUNCEMENT",
              permissionOverwrites: [{ roleName: "@everyone", allow: ["ViewChannel"], deny: ["SendMessages"] }]
            }
          ]
        },
        {
          name: "\u{1F4AC}\u30FBTEXT LOUNGE",
          channels: [
            { name: "\u{1F4AC}\u30FBgeneral-chat", type: "GUILD_TEXT" },
            { name: "\u{1F4F7}\u30FBmedia", type: "GUILD_TEXT" },
            { name: "\u{1F916}\u30FBbot-commands", type: "GUILD_TEXT" }
          ]
        },
        {
          name: "\u{1F50A}\u30FBVOICE LOUNGES",
          channels: [
            { name: "\u2795\u30FBCreate Voice", type: "GUILD_VOICE" },
            { name: "\u{1F50A}\u30FBLounge #1", type: "GUILD_VOICE" },
            { name: "\u{1F50A}\u30FBLounge #2", type: "GUILD_VOICE" }
          ]
        },
        {
          name: "\u{1F3AB}\u30FBSUPPORT",
          channels: [{ name: "\u{1F3AB}\u30FBcreate-ticket", type: "GUILD_TEXT" }]
        }
      ],
      automodRules: [
        {
          name: "\u{1F6E1}\uFE0F Link Protection & Anti-Spam",
          triggerType: "KEYWORD",
          keywordFilter: ["*discord.gg/*", "*free nitro*"]
        }
      ],
      richEmbeds: [
        {
          channelName: "\u{1F4DC}\u30FBrules",
          title: "\u{1F4DC} COMMUNITY RULES & GUIDELINES",
          description: "Welcome! Please adhere to our discord guidelines to ensure a friendly atmosphere.",
          color: "#3498DB",
          fields: [
            { name: "1. Respect Others", value: "Harassment, hate speech, and toxicity will result in immediate bans." },
            { name: "2. No Self Promotion", value: "Unsolicited advertising in channels or DMs is strictly prohibited." }
          ]
        }
      ],
      features: {
        ticketSystem: {
          enabled: true,
          categoryName: "\u{1F3AB}\u30FBSUPPORT",
          panelChannel: "\u{1F3AB}\u30FBcreate-ticket",
          buttonLabel: "Open Ticket",
          buttonEmoji: "\u{1F4E9}",
          embedTitle: "\u{1F3AB} Help & Support",
          embedDescription: "Click the button below to reach out to the moderation team.",
          supportRoleName: "\u{1F6E1}\uFE0F Moderator"
        },
        joinToCreate: {
          enabled: true,
          categoryName: "\u{1F50A}\u30FBVOICE LOUNGES",
          triggerChannel: "\u2795\u30FBCreate Voice",
          userRoomPrefix: "\u{1F50A}\u30FB"
        },
        autoRoleName: "\u{1F465} Member"
      }
    };
  }
};

// src/services/ai/aiManager.ts
var AIManager = class {
  gemini;
  openai;
  constructor() {
    if (config.geminiApiKey) {
      this.gemini = new GeminiProvider(config.geminiApiKey);
    }
    if (config.openaiApiKey) {
      this.openai = new OpenAIProvider(config.openaiApiKey);
    }
  }
  async generateBlueprint(options) {
    const preferred = config.aiProvider;
    if (preferred === "gemini" && this.gemini) {
      try {
        const bp2 = await this.gemini.generateBlueprint(options);
        return { blueprint: this.sanitizeBlueprint(bp2), source: "gemini" };
      } catch (err) {
        console.warn("[AIManager] Gemini hatas\u0131, di\u011Fer se\xE7enek deneniyor...", err);
      }
    }
    if (preferred === "openai" && this.openai) {
      try {
        const bp2 = await this.openai.generateBlueprint(options);
        return { blueprint: this.sanitizeBlueprint(bp2), source: "openai" };
      } catch (err) {
        console.warn("[AIManager] OpenAI hatas\u0131, di\u011Fer se\xE7enek deneniyor...", err);
      }
    }
    if (this.gemini) {
      try {
        const bp2 = await this.gemini.generateBlueprint(options);
        return { blueprint: this.sanitizeBlueprint(bp2), source: "gemini" };
      } catch (err) {
        console.warn("[AIManager] Otomatik Gemini ba\u015Far\u0131s\u0131z oldu:", err);
      }
    }
    if (this.openai) {
      try {
        const bp2 = await this.openai.generateBlueprint(options);
        return { blueprint: this.sanitizeBlueprint(bp2), source: "openai" };
      } catch (err) {
        console.warn("[AIManager] Otomatik OpenAI ba\u015Far\u0131s\u0131z oldu:", err);
      }
    }
    console.info("[AIManager] API anahtar\u0131 veya servis yan\u0131t vermedi; Smart Blueprint Engine devrede.");
    const bp = SmartBlueprintGenerator.generate(options);
    return { blueprint: this.sanitizeBlueprint(bp), source: "smart_fallback" };
  }
  sanitizeBlueprint(bp) {
    if (!bp.roles || !Array.isArray(bp.roles)) bp.roles = [];
    if (!bp.categories || !Array.isArray(bp.categories)) bp.categories = [];
    if (!bp.automodRules || !Array.isArray(bp.automodRules)) bp.automodRules = [];
    if (!bp.richEmbeds || !Array.isArray(bp.richEmbeds)) bp.richEmbeds = [];
    bp.roles = bp.roles.filter(
      (role) => role && role.name && role.name.toLowerCase() !== "@everyone" && role.name.toLowerCase() !== "everyone"
    );
    for (const role of bp.roles) {
      if (role.name) role.name = role.name.trim().slice(0, 100);
    }
    for (const cat of bp.categories) {
      if (cat.name) cat.name = cat.name.slice(0, 100);
      if (Array.isArray(cat.channels)) {
        for (const ch of cat.channels) {
          if (ch.name) {
            let name = ch.name.slice(0, 100);
            if (ch.type === "GUILD_TEXT" || ch.type === "GUILD_ANNOUNCEMENT") {
              name = name.toLowerCase().replace(/\s+/g, "-");
            }
            ch.name = name;
          }
        }
      }
    }
    return bp;
  }
};

// src/events/interactionCreate.ts
var import_discord35 = require("discord.js");

// src/services/engine/blueprintCache.ts
var BlueprintCache = class {
  static cache = /* @__PURE__ */ new Map();
  static set(pending) {
    this.cache.set(pending.id, pending);
    const timer = setTimeout(() => {
      this.cache.delete(pending.id);
    }, 15 * 60 * 1e3);
    if (timer && typeof timer.unref === "function") {
      timer.unref();
    }
  }
  static get(id) {
    return this.cache.get(id);
  }
  static getAll() {
    return Array.from(this.cache.values());
  }
  static getLatestByGuild(guildId) {
    let latest;
    for (const item of this.cache.values()) {
      if (item.guildId === guildId) {
        if (!latest || item.createdAt > latest.createdAt) {
          latest = item;
        }
      }
    }
    return latest;
  }
  static delete(id) {
    return this.cache.delete(id);
  }
};

// src/services/engine/deployer.ts
var import_discord3 = require("discord.js");

// src/services/engine/permissionMapper.ts
var import_discord = require("discord.js");
var PERMISSION_MAP = {
  // Admin & Management
  administrator: import_discord.PermissionFlagsBits.Administrator,
  manageguild: import_discord.PermissionFlagsBits.ManageGuild,
  manageroles: import_discord.PermissionFlagsBits.ManageRoles,
  managechannels: import_discord.PermissionFlagsBits.ManageChannels,
  kickmembers: import_discord.PermissionFlagsBits.KickMembers,
  banmembers: import_discord.PermissionFlagsBits.BanMembers,
  createinstantinvite: import_discord.PermissionFlagsBits.CreateInstantInvite,
  changenickname: import_discord.PermissionFlagsBits.ChangeNickname,
  managenicknames: import_discord.PermissionFlagsBits.ManageNicknames,
  manageemojisandstickers: import_discord.PermissionFlagsBits.ManageGuildExpressions,
  managewebhooks: import_discord.PermissionFlagsBits.ManageWebhooks,
  viewauditlog: import_discord.PermissionFlagsBits.ViewAuditLog,
  viewguildinsights: import_discord.PermissionFlagsBits.ViewGuildInsights,
  // Text permissions
  viewchannel: import_discord.PermissionFlagsBits.ViewChannel,
  sendmessages: import_discord.PermissionFlagsBits.SendMessages,
  sendmessagesinthreads: import_discord.PermissionFlagsBits.SendMessagesInThreads,
  createtranscripts: import_discord.PermissionFlagsBits.ManageThreads,
  createpublicthreads: import_discord.PermissionFlagsBits.CreatePublicThreads,
  createprivatethreads: import_discord.PermissionFlagsBits.CreatePrivateThreads,
  embedlinks: import_discord.PermissionFlagsBits.EmbedLinks,
  attachfiles: import_discord.PermissionFlagsBits.AttachFiles,
  readmessagehistory: import_discord.PermissionFlagsBits.ReadMessageHistory,
  mentioneveryone: import_discord.PermissionFlagsBits.MentionEveryone,
  useexternalemojis: import_discord.PermissionFlagsBits.UseExternalEmojis,
  useexternalstickers: import_discord.PermissionFlagsBits.UseExternalStickers,
  addreactions: import_discord.PermissionFlagsBits.AddReactions,
  managemessages: import_discord.PermissionFlagsBits.ManageMessages,
  managethreads: import_discord.PermissionFlagsBits.ManageThreads,
  // Voice permissions
  connect: import_discord.PermissionFlagsBits.Connect,
  speak: import_discord.PermissionFlagsBits.Speak,
  stream: import_discord.PermissionFlagsBits.Stream,
  useembeddedactivities: import_discord.PermissionFlagsBits.UseEmbeddedActivities,
  usesoundboard: import_discord.PermissionFlagsBits.UseSoundboard,
  useexternalsounds: import_discord.PermissionFlagsBits.UseExternalSounds,
  usevoicedetection: import_discord.PermissionFlagsBits.UseVAD,
  usevad: import_discord.PermissionFlagsBits.UseVAD,
  priorityspeaker: import_discord.PermissionFlagsBits.PrioritySpeaker,
  mutemembers: import_discord.PermissionFlagsBits.MuteMembers,
  deafenmembers: import_discord.PermissionFlagsBits.DeafenMembers,
  movemembers: import_discord.PermissionFlagsBits.MoveMembers,
  requesttospeak: import_discord.PermissionFlagsBits.RequestToSpeak,
  sendvoicemessages: import_discord.PermissionFlagsBits.SendVoiceMessages,
  // Events, Stage & Apps
  manageevents: import_discord.PermissionFlagsBits.ManageEvents,
  moderateMembers: import_discord.PermissionFlagsBits.ModerateMembers,
  moderatemembers: import_discord.PermissionFlagsBits.ModerateMembers,
  useapplicationcommands: import_discord.PermissionFlagsBits.UseApplicationCommands,
  sendttsmessages: import_discord.PermissionFlagsBits.SendTTSMessages,
  viewcreatormonetizationanalytics: import_discord.PermissionFlagsBits.ViewCreatorMonetizationAnalytics,
  useexternalapps: import_discord.PermissionFlagsBits.UseExternalApps || import_discord.PermissionFlagsBits.UseApplicationCommands
};
function resolvePermission(name) {
  if (!name) return null;
  const normalized = name.toLowerCase().replace(/[^a-z]/g, "");
  return PERMISSION_MAP[normalized] || null;
}
function resolvePermissionList(names = []) {
  let bitfield = 0n;
  for (const name of names) {
    const bit = resolvePermission(name);
    if (bit) {
      bitfield |= bit;
    }
  }
  return bitfield;
}

// src/services/engine/rateLimitQueue.ts
var RateLimitQueue = class {
  baseDelayMs;
  maxRetries;
  constructor(baseDelayMs = 650, maxRetries = 4) {
    this.baseDelayMs = baseDelayMs;
    this.maxRetries = maxRetries;
  }
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  async processAll(tasks, onProgress) {
    const results = [];
    const total = tasks.length;
    for (let i = 0; i < total; i++) {
      const task = tasks[i];
      let attempts = 0;
      let success = false;
      let lastError = null;
      if (onProgress) {
        const percent = Math.round((i + 1) / total * 100);
        await onProgress({
          current: i + 1,
          total,
          description: task.description,
          percent
        });
      }
      while (attempts < this.maxRetries && !success) {
        try {
          attempts++;
          const result = await task.execute();
          results.push(result);
          success = true;
        } catch (error) {
          lastError = error;
          const retryAfter = error?.retryAfter ?? error?.rawError?.retry_after ?? null;
          if (retryAfter) {
            const waitTime = Math.ceil(Number(retryAfter) * 1e3) + 500;
            console.warn(`[RateLimitQueue] 429 Rate limit al\u0131nd\u0131. Bekleniyor: ${waitTime}ms (G\xF6rev: ${task.description})`);
            await this.sleep(waitTime);
          } else if (error?.status === 429 || error?.code === 429) {
            const waitTime = 2500 * attempts;
            console.warn(`[RateLimitQueue] 429 Alg\u0131land\u0131. ${waitTime}ms bekleniyor...`);
            await this.sleep(waitTime);
          } else {
            console.error(`[RateLimitQueue] G\xF6rev hatas\u0131 (${task.description}):`, error?.message || error);
            if (attempts >= this.maxRetries) {
              throw error;
            }
            await this.sleep(1e3);
          }
        }
      }
      await this.sleep(this.baseDelayMs);
    }
    return results;
  }
};

// src/services/engine/cleaner.ts
var import_discord2 = require("discord.js");
var ServerCleaner = class {
  queue;
  constructor() {
    this.queue = new RateLimitQueue(400);
  }
  async purgeServer(guild, options, onProgress) {
    const purgeOpts = typeof options === "object" && options !== null ? options : {};
    const progressCallback = typeof options === "function" ? options : onProgress;
    const stats = {
      channelsDeleted: 0,
      rolesDeleted: 0,
      errors: []
    };
    const me = guild.members.me;
    if (!me?.permissions.has(import_discord2.PermissionFlagsBits.ManageChannels)) {
      throw new Error("Bot 'Kanallar\u0131 Y\xF6net' (ManageChannels) yetkisine sahip de\u011Fil!");
    }
    const channels = await guild.channels.fetch();
    const channelTasks = [];
    const nonCategories = channels.filter(
      (c) => c && !c.isDMBased() && c.type !== import_discord2.ChannelType.GuildCategory && c.id !== purgeOpts.preserveChannelId
    );
    const categories = channels.filter((c) => c && !c.isDMBased() && c.type === import_discord2.ChannelType.GuildCategory);
    for (const [id, ch] of nonCategories) {
      if (!ch) continue;
      channelTasks.push({
        id: `del_ch_${id}`,
        description: `Kanal siliniyor: #${ch.name}`,
        execute: async () => {
          try {
            await ch.delete("AI Architect: Temizleme i\u015Flemi");
            stats.channelsDeleted++;
          } catch (err) {
            stats.errors.push(`Kanal #${ch.name} silinemedi: ${err.message}`);
          }
        }
      });
    }
    for (const [id, cat] of categories) {
      if (!cat) continue;
      channelTasks.push({
        id: `del_cat_${id}`,
        description: `Kategori siliniyor: \u{1F4C1} ${cat.name}`,
        execute: async () => {
          try {
            await cat.delete("AI Architect: Temizleme i\u015Flemi");
            stats.channelsDeleted++;
          } catch (err) {
            stats.errors.push(`Kategori ${cat.name} silinemedi: ${err.message}`);
          }
        }
      });
    }
    if (channelTasks.length > 0) {
      await this.queue.processAll(channelTasks, async (p) => {
        if (progressCallback) {
          await progressCallback(`\u{1F9F9} Kanallar temizleniyor... [${p.current}/${p.total}] (${p.percent}%)`);
        }
      });
    }
    if (me.permissions.has(import_discord2.PermissionFlagsBits.ManageRoles)) {
      const roles = await guild.roles.fetch();
      const botHighestRolePos = me.roles.highest.position;
      const roleTasks = [];
      for (const [id, role] of roles) {
        if (role.id === guild.id) continue;
        if (role.managed) continue;
        if (role.position >= botHighestRolePos) continue;
        roleTasks.push({
          id: `del_role_${id}`,
          description: `Rol siliniyor: @${role.name}`,
          execute: async () => {
            try {
              await role.delete("AI Architect: Temizleme i\u015Flemi");
              stats.rolesDeleted++;
            } catch (err) {
              stats.errors.push(`Rol @${role.name} silinemedi: ${err.message}`);
            }
          }
        });
      }
      if (roleTasks.length > 0) {
        await this.queue.processAll(roleTasks, async (p) => {
          if (progressCallback) {
            await progressCallback(`\u{1F9F9} Roller temizleniyor... [${p.current}/${p.total}] (${p.percent}%)`);
          }
        });
      }
    }
    return stats;
  }
};

// src/services/image/logoStudio.ts
var import_axios = __toESM(require("axios"));
var import_openai2 = __toESM(require("openai"));
var import_zlib = __toESM(require("zlib"));
var LogoStudio = class {
  openai;
  constructor() {
    if (config.openaiApiKey) {
      this.openai = new import_openai2.default({ apiKey: config.openaiApiKey });
    }
  }
  async generateIcon(prompt, forceProcedural = false) {
    if (forceProcedural) {
      return this.generateProceduralLogo(prompt);
    }
    const refinedPrompt = `${prompt}, high quality 512x512 app icon, discord server logo, vector emblem, clean centered, vibrant colors, aesthetic graphic design`;
    if (config.imageProvider === "openai" && this.openai) {
      try {
        const response = await this.openai.images.generate({
          model: "dall-e-3",
          prompt: refinedPrompt,
          n: 1,
          size: "1024x1024",
          response_format: "b64_json"
        });
        const b64 = response?.data?.[0]?.b64_json;
        if (b64) {
          const buffer = Buffer.from(b64, "base64");
          return {
            buffer,
            dataUri: `data:image/png;base64,${b64}`,
            source: "openai"
          };
        }
      } catch (err) {
        console.warn("[LogoStudio] OpenAI DALL-E hatas\u0131, Pollinations servisine ge\xE7iliyor:", err);
      }
    }
    try {
      const encoded = encodeURIComponent(refinedPrompt);
      const url = `https://image.pollinations.ai/prompt/${encoded}?width=512&height=512&nologo=true&seed=${Math.floor(Math.random() * 1e5)}`;
      const response = await import_axios.default.get(url, {
        responseType: "arraybuffer",
        timeout: 1e4,
        headers: {
          "User-Agent": "Discord-AI-Architect/1.0"
        }
      });
      const buffer = Buffer.from(response.data);
      const b64 = buffer.toString("base64");
      return {
        buffer,
        dataUri: `data:image/jpeg;base64,${b64}`,
        source: "pollinations",
        url
      };
    } catch (err) {
      console.warn("[LogoStudio] Pollinations API ula\u015F\u0131lamad\u0131, ak\u0131ll\u0131 dahili 512x512 PNG olu\u015Fturucu devreye giriyor:", err.message);
      return this.generateProceduralLogo(prompt);
    }
  }
  /**
   * Generates a 100% valid, high-aesthetic 512x512 PNG server emblem
   * using pure Node.js and zlib (no external dependencies, zero network required).
   */
  generateProceduralLogo(titleOrTheme = "Discord Server") {
    const width = 512;
    const height = 512;
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    const makeChunk = (type, data20) => {
      const len = Buffer.alloc(4);
      len.writeUInt32BE(data20.length, 0);
      const typeBuf = Buffer.from(type, "ascii");
      const toCrc = Buffer.concat([typeBuf, data20]);
      const crc = Buffer.alloc(4);
      crc.writeUInt32BE(import_zlib.default.crc32(toCrc), 0);
      return Buffer.concat([len, typeBuf, data20, crc]);
    };
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8;
    ihdr[9] = 6;
    ihdr[10] = 0;
    ihdr[11] = 0;
    ihdr[12] = 0;
    const ihdrChunk = makeChunk("IHDR", ihdr);
    const lower = titleOrTheme.toLowerCase();
    let themeColor = { r: 88, g: 101, b: 242 };
    let secondaryColor = { r: 59, g: 165, b: 93 };
    let accentColor = { r: 235, g: 69, b: 158 };
    if (lower.includes("oyun") || lower.includes("gaming") || lower.includes("espor") || lower.includes("valorant")) {
      themeColor = { r: 235, g: 45, b: 85 };
      secondaryColor = { r: 15, g: 25, b: 35 };
      accentColor = { r: 255, g: 215, b: 0 };
    } else if (lower.includes("anime") || lower.includes("rp") || lower.includes("manga")) {
      themeColor = { r: 168, g: 85, b: 247 };
      secondaryColor = { r: 236, g: 72, b: 153 };
      accentColor = { r: 255, g: 255, b: 255 };
    } else if (lower.includes("kod") || lower.includes("code") || lower.includes("yazilim") || lower.includes("dev")) {
      themeColor = { r: 14, g: 165, b: 233 };
      secondaryColor = { r: 15, g: 23, b: 42 };
      accentColor = { r: 34, g: 197, b: 94 };
    } else if (lower.includes("kurumsal") || lower.includes("pro")) {
      themeColor = { r: 59, g: 130, b: 246 };
      secondaryColor = { r: 30, g: 41, b: 59 };
      accentColor = { r: 245, g: 158, b: 11 };
    }
    const rowSize = 1 + width * 4;
    const rawData = Buffer.alloc(rowSize * height);
    const centerX = 256;
    const centerY = 256;
    const maxRadius = 240;
    for (let y = 0; y < height; y++) {
      const rowOffset = y * rowSize;
      rawData[rowOffset] = 0;
      for (let x = 0; x < width; x++) {
        const pxOffset = rowOffset + 1 + x * 4;
        const dx = x - centerX;
        const dy = y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let r = 18;
        let g = 20;
        let b = 30;
        let a = 255;
        const radialRatio = Math.min(1, dist / 360);
        r = Math.floor(themeColor.r * 0.15 * (1 - radialRatio) + secondaryColor.r * radialRatio);
        g = Math.floor(themeColor.g * 0.15 * (1 - radialRatio) + secondaryColor.g * radialRatio);
        b = Math.floor(themeColor.b * 0.25 * (1 - radialRatio) + secondaryColor.b * radialRatio);
        if (dist <= maxRadius) {
          if (dist >= maxRadius - 12) {
            r = accentColor.r;
            g = accentColor.g;
            b = accentColor.b;
          } else if (dist >= maxRadius - 20) {
            r = themeColor.r;
            g = themeColor.g;
            b = themeColor.b;
          } else {
            const innerGrad = y / height;
            r = Math.floor(themeColor.r * (1 - innerGrad * 0.5));
            g = Math.floor(themeColor.g * (1 - innerGrad * 0.5));
            b = Math.floor(themeColor.b * (1 - innerGrad * 0.4));
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);
            const diamondDist = absDx + absDy;
            if (diamondDist < 120) {
              if (diamondDist < 30 || diamondDist >= 80 && diamondDist <= 110) {
                r = accentColor.r;
                g = accentColor.g;
                b = accentColor.b;
              } else {
                r = 255;
                g = 255;
                b = 255;
              }
            }
            if (dy < -20 && Math.abs(dx) < 180 && dist > 140 && dist < 210) {
              r = Math.min(255, r + 45);
              g = Math.min(255, g + 45);
              b = Math.min(255, b + 60);
            }
          }
        }
        rawData[pxOffset] = r;
        rawData[pxOffset + 1] = g;
        rawData[pxOffset + 2] = b;
        rawData[pxOffset + 3] = a;
      }
    }
    const compressed = import_zlib.default.deflateSync(rawData, { level: 6 });
    const idatChunk = makeChunk("IDAT", compressed);
    const iendChunk = makeChunk("IEND", Buffer.alloc(0));
    const buffer = Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
    const b64 = buffer.toString("base64");
    return {
      buffer,
      dataUri: `data:image/png;base64,${b64}`,
      source: "procedural"
    };
  }
  async applyIconToGuild(guild, imageBuffer) {
    const me = guild.members.me;
    if (!me?.permissions.has("ManageGuild")) {
      throw new Error("Bot 'Sunucuyu Y\xF6net' (ManageGuild) yetkisine sahip de\u011Fil!");
    }
    await guild.setIcon(imageBuffer, "AI Architect: Otomatik logo g\xFCncellemesi");
  }
};

// src/services/engine/deployer.ts
function renderProgressBar(percent, totalBlocks = 10) {
  const safePercent = Number.isFinite(percent) ? percent : 0;
  const clamped = Math.max(0, Math.min(100, Math.round(safePercent)));
  const filled = Math.min(totalBlocks, Math.floor(clamped / 100 * totalBlocks));
  const empty = Math.max(0, totalBlocks - filled);
  return `[${"\u2588".repeat(filled)}${"\u2591".repeat(empty)}] ${clamped}%`;
}
var ServerDeployer = class {
  queue;
  cleaner;
  logoStudio;
  constructor() {
    this.queue = new RateLimitQueue(500);
    this.cleaner = new ServerCleaner();
    this.logoStudio = new LogoStudio();
  }
  async deploy(guild, blueprint, options = {}, onProgress) {
    const report = {
      rolesCreated: 0,
      channelsCreated: 0,
      automodRulesCreated: 0,
      embedsPosted: 0,
      logoApplied: false,
      errors: []
    };
    const me = guild.members.me;
    if (!me) throw new Error("Bot guild \xFCyesi bulunamad\u0131!");
    if (options.cleanSlate) {
      if (onProgress) await onProgress("\u{1F9F9} Eski kanallar ve roller temizleniyor...", 5);
      try {
        await this.cleaner.purgeServer(
          guild,
          { preserveChannelId: options.preserveChannelId },
          async (msg) => {
            if (onProgress) await onProgress(msg, 10);
          }
        );
      } catch (err) {
        report.errors.push(`Temizleme hatas\u0131: ${err.message}`);
      }
    }
    if (options.applyName && blueprint.serverName) {
      try {
        await guild.setName(blueprint.serverName.slice(0, 100), "AI Architect: Sunucu Yap\u0131land\u0131rmas\u0131");
        if (blueprint.serverDescription && guild.features.includes("COMMUNITY")) {
          await guild.edit({ description: blueprint.serverDescription.slice(0, 120) });
        }
      } catch (err) {
        report.errors.push(`Sunucu ad\u0131 g\xFCncellenemedi: ${err.message}`);
      }
    }
    if (onProgress) await onProgress("\u{1F6E1}\uFE0F Roller ve hiyerar\u015Fi in\u015Fa ediliyor...", 20);
    const roleMap = /* @__PURE__ */ new Map();
    const roleTasks = [];
    const validRoles = blueprint.roles.filter(
      (r) => r && r.name && r.name.toLowerCase() !== "@everyone" && r.name.toLowerCase() !== "everyone"
    );
    const orderedRoles = [...validRoles].reverse();
    for (const r of orderedRoles) {
      roleTasks.push({
        id: `role_${r.name}`,
        description: `Rol olu\u015Fturuluyor: ${r.name}`,
        execute: async () => {
          try {
            const permissionsBitfield = resolvePermissionList(r.permissions);
            const createdRole = await guild.roles.create({
              name: r.name.slice(0, 100),
              color: r.color || void 0,
              hoist: r.hoist ?? false,
              mentionable: r.mentionable ?? false,
              permissions: permissionsBitfield,
              reason: "AI Architect: Rol kurulumu"
            });
            roleMap.set(r.name.toLowerCase().trim(), createdRole);
            report.rolesCreated++;
          } catch (err) {
            report.errors.push(`Rol ${r.name} olu\u015Fturulamad\u0131: ${err.message}`);
          }
        }
      });
    }
    await this.queue.processAll(roleTasks, async (p) => {
      if (onProgress) {
        const pct = Math.min(40, 10 + Math.round(p.current / p.total * 30));
        await onProgress(`Roller in\u015Fa ediliyor... (${p.current}/${p.total})`, pct);
      }
    });
    if (onProgress) await onProgress("\u0130zinler ve kanallar yap\u0131land\u0131r\u0131l\u0131yor... (0/0)", 40);
    const channelMap = /* @__PURE__ */ new Map();
    let totalChannelsToCreate = 0;
    for (const cat of blueprint.categories) {
      totalChannelsToCreate += 1 + (cat.channels?.length || 0);
    }
    let channelsProcessed = 0;
    const channelTasks = [];
    for (const cat of blueprint.categories) {
      let createdCat = null;
      channelTasks.push({
        id: `cat_${cat.name}`,
        description: `Kategori: ${cat.name}`,
        execute: async () => {
          try {
            const catOverwrites = this.buildPermissionOverwrites(guild, cat.permissionOverwrites, roleMap);
            createdCat = await guild.channels.create({
              name: cat.name.slice(0, 100),
              type: import_discord3.ChannelType.GuildCategory,
              permissionOverwrites: catOverwrites,
              reason: "AI Architect: Kategori kurulumu"
            });
            report.channelsCreated++;
            channelsProcessed++;
          } catch (err) {
            report.errors.push(`Kategori ${cat.name} olu\u015Fturulamad\u0131: ${err.message}`);
          }
        }
      });
      if (cat.channels && Array.isArray(cat.channels)) {
        for (const ch of cat.channels) {
          channelTasks.push({
            id: `ch_${cat.name}_${ch.name}`,
            description: `Kanal: #${ch.name}`,
            execute: async () => {
              try {
                const channelType = this.resolveChannelType(ch.type, guild);
                const overwrites = this.buildPermissionOverwrites(guild, ch.permissionOverwrites, roleMap);
                const isText = channelType === import_discord3.ChannelType.GuildText || channelType === import_discord3.ChannelType.GuildAnnouncement;
                const channelOptions = {
                  name: ch.name.slice(0, 100),
                  type: channelType,
                  parent: createdCat?.id,
                  permissionOverwrites: overwrites,
                  reason: "AI Architect: Kanal kurulumu"
                };
                if (isText) {
                  if (ch.topic) channelOptions.topic = ch.topic.slice(0, 1024);
                  if (typeof ch.rateLimitPerUser === "number") channelOptions.rateLimitPerUser = ch.rateLimitPerUser;
                  if (ch.nsfw) channelOptions.nsfw = ch.nsfw;
                }
                const createdCh = await guild.channels.create(channelOptions);
                channelMap.set(ch.name.toLowerCase().trim(), createdCh);
                report.channelsCreated++;
                channelsProcessed++;
              } catch (err) {
                report.errors.push(`Kanal #${ch.name} olu\u015Fturulamad\u0131: ${err.message}`);
              }
            }
          });
        }
      }
    }
    await this.queue.processAll(channelTasks, async (p) => {
      if (onProgress) {
        const pct = Math.min(80, 40 + Math.round(p.current / p.total * 40));
        await onProgress(`\u0130zinler ve kanallar yap\u0131land\u0131r\u0131l\u0131yor... (${p.current}/${p.total})`, pct);
      }
    });
    if (blueprint.automodRules && blueprint.automodRules.length > 0) {
      if (onProgress) await onProgress("AutoMod kurallar\u0131 yap\u0131land\u0131r\u0131l\u0131yor...", 82);
      for (const rule of blueprint.automodRules) {
        try {
          if (rule.triggerType === "KEYWORD" && rule.keywordFilter && rule.keywordFilter.length > 0) {
            await guild.autoModerationRules.create({
              name: rule.name.slice(0, 100),
              eventType: import_discord3.AutoModerationRuleEventType.MessageSend,
              triggerType: import_discord3.AutoModerationRuleTriggerType.Keyword,
              triggerMetadata: {
                keywordFilter: rule.keywordFilter.slice(0, 50)
              },
              actions: [
                {
                  type: import_discord3.AutoModerationActionType.BlockMessage,
                  metadata: {
                    customMessage: "AI Architect: Bu mesaj sunucu kurallar\u0131n\u0131 ihlal etti\u011Fi i\xE7in engellendi."
                  }
                }
              ],
              enabled: true,
              reason: "AI Architect: G\xFCvenlik kural\u0131"
            });
            report.automodRulesCreated++;
          } else if (rule.triggerType === "MENTION_SPAM") {
            await guild.autoModerationRules.create({
              name: rule.name.slice(0, 100),
              eventType: import_discord3.AutoModerationRuleEventType.MessageSend,
              triggerType: import_discord3.AutoModerationRuleTriggerType.MentionSpam,
              triggerMetadata: {
                mentionTotalLimit: rule.mentionLimit || 5
              },
              actions: [
                {
                  type: import_discord3.AutoModerationActionType.BlockMessage,
                  metadata: {
                    customMessage: "AI Architect: A\u015F\u0131r\u0131 etiket (mention) kullan\u0131m\u0131 engellendi."
                  }
                }
              ],
              enabled: true,
              reason: "AI Architect: Bahsetme spam korumas\u0131"
            });
            report.automodRulesCreated++;
          }
        } catch (err) {
          report.errors.push(`AutoMod kural\u0131 '${rule.name}' olu\u015Fturulamad\u0131: ${err.message}`);
        }
      }
    }
    if (blueprint.richEmbeds && blueprint.richEmbeds.length > 0) {
      if (onProgress) await onProgress("\u{1F4DC} Bilgi ve Kural embedleri yerle\u015Ftiriliyor...", 88);
      for (const emb of blueprint.richEmbeds) {
        try {
          const target = this.findMatchingTextChannel(channelMap, emb.channelName);
          if (target && target.isTextBased()) {
            const embed = new import_discord3.EmbedBuilder().setTitle(emb.title).setDescription(emb.description).setColor(emb.color || "#3498DB").setTimestamp();
            if (emb.footer) embed.setFooter({ text: emb.footer });
            if (emb.fields && Array.isArray(emb.fields)) {
              for (const f of emb.fields) {
                embed.addFields({ name: f.name, value: f.value, inline: f.inline ?? false });
              }
            }
            await target.send({ embeds: [embed] });
            report.embedsPosted++;
          }
        } catch (err) {
          report.errors.push(`Embed g\xF6nderilemedi (${emb.channelName}): ${err.message}`);
        }
      }
    }
    if (blueprint.features?.ticketSystem?.enabled) {
      try {
        const ticketPanelCh = this.findMatchingTextChannel(
          channelMap,
          blueprint.features.ticketSystem.panelChannel
        );
        if (ticketPanelCh && ticketPanelCh.isTextBased()) {
          const ticketEmbed = new import_discord3.EmbedBuilder().setTitle(blueprint.features.ticketSystem.embedTitle || "\u{1F3AB} DESTEK VE YARDIM").setDescription(
            blueprint.features.ticketSystem.embedDescription || "Yetkili ekibimizle \xF6zel olarak g\xF6r\xFC\u015Fmek, soru sormak veya bildirimde bulunmak i\xE7in a\u015Fa\u011F\u0131daki butona bas\u0131n\u0131z."
          ).setColor("#2ECC71").setFooter({ text: "AI Architect Ticket Sistemi" });
          const row = new import_discord3.ActionRowBuilder().addComponents(
            new import_discord3.ButtonBuilder().setCustomId("ticket_open").setLabel(blueprint.features.ticketSystem.buttonLabel || "Destek Talebi A\xE7").setEmoji(blueprint.features.ticketSystem.buttonEmoji || "\u{1F4E9}").setStyle(import_discord3.ButtonStyle.Primary)
          );
          await ticketPanelCh.send({ embeds: [ticketEmbed], components: [row] });
        }
      } catch (err) {
        report.errors.push(`Ticket paneli kurulamad\u0131: ${err.message}`);
      }
    }
    if (options.applyLogo && blueprint.iconPrompt) {
      if (onProgress) await onProgress("\u{1F3A8} AI ile sunucu logosu tasarlan\u0131yor ve y\xFCkleniyor...", 95);
      try {
        const iconResult = await this.logoStudio.generateIcon(blueprint.iconPrompt);
        await this.logoStudio.applyIconToGuild(guild, iconResult.buffer);
        report.logoApplied = true;
      } catch (err) {
        report.errors.push(`Sunucu logosu uygulanamad\u0131: ${err.message}`);
      }
    }
    if (onProgress) await onProgress("Logo y\xFCklendi & AutoMod kurallar\u0131 aktif edildi!", 100);
    return report;
  }
  resolveChannelType(typeStr, guild) {
    switch (typeStr) {
      case "GUILD_VOICE":
        return import_discord3.ChannelType.GuildVoice;
      case "GUILD_ANNOUNCEMENT":
        return guild?.features.includes("COMMUNITY") ? import_discord3.ChannelType.GuildAnnouncement : import_discord3.ChannelType.GuildText;
      case "GUILD_STAGE_VOICE":
        return import_discord3.ChannelType.GuildStageVoice;
      case "GUILD_FORUM":
        return import_discord3.ChannelType.GuildForum;
      case "GUILD_TEXT":
      default:
        return import_discord3.ChannelType.GuildText;
    }
  }
  buildPermissionOverwrites(guild, overwrites = [], roleMap) {
    const result = [];
    if (!Array.isArray(overwrites)) return result;
    for (const ov of overwrites) {
      let targetId = null;
      if (ov.roleName === "@everyone" || ov.roleName === "everyone") {
        targetId = guild.roles.everyone.id;
      } else {
        const cleanName = ov.roleName.toLowerCase().trim();
        const role = roleMap.get(cleanName) || guild.roles.cache.find((r) => r.name.toLowerCase().trim() === cleanName);
        if (role) targetId = role.id;
      }
      if (targetId) {
        const allowBit = resolvePermissionList(ov.allow);
        const denyBit = resolvePermissionList(ov.deny);
        result.push({
          id: targetId,
          allow: allowBit,
          deny: denyBit
        });
      }
    }
    return result;
  }
  findMatchingTextChannel(channelMap, targetName) {
    const clean = targetName.toLowerCase().replace(/[^a-z0-9]/g, "");
    for (const [name, ch] of channelMap.entries()) {
      const chClean = name.replace(/[^a-z0-9]/g, "");
      if (chClean === clean || chClean.includes(clean) || clean.includes(chClean)) {
        return ch;
      }
    }
    return null;
  }
};

// src/services/engine/diagnostics.ts
var import_discord4 = require("discord.js");
var ServerDiagnostics = class {
  /**
   * Performs full self-diagnostics on bot permissions and role hierarchy for a guild.
   */
  static check(guild) {
    const me = guild.members.me;
    const missingPermissions = [];
    const rolesAboveBot = [];
    const issues = [];
    if (!me) {
      const errEmbed = new import_discord4.EmbedBuilder().setTitle("\u274C TE\u015EH\u0130S HATASI: Bot Sunucuda Bulunamad\u0131").setDescription("Bot sunucu \xFCyesi olarak bulunamad\u0131. L\xFCtfen botu sunucunuza tekrar davet edin.").setColor("#ED4245");
      return {
        healthy: false,
        canDeploy: false,
        botRoleName: "Bilinmiyor",
        botHighestPosition: 0,
        missingPermissions: ["ALL"],
        rolesAboveBot: [],
        issues: [
          {
            type: "OTHER",
            title: "Bot Sunucu \xDCyesi De\u011Fil",
            detail: "Bot `guild.members.me` nesnesine eri\u015Femedi.",
            solution: "Botu davet linkini kullanarak sunucuya y\xF6netici yetkisiyle yeniden ekleyin."
          }
        ],
        troubleshootingEmbed: errEmbed,
        summaryMessage: "Bot sunucuda aktif bir \xFCye olarak bulunamad\u0131."
      };
    }
    const hasAdmin = me.permissions.has(import_discord4.PermissionFlagsBits.Administrator);
    const hasManageRoles = me.permissions.has(import_discord4.PermissionFlagsBits.ManageRoles);
    const hasManageChannels = me.permissions.has(import_discord4.PermissionFlagsBits.ManageChannels);
    const hasManageGuild = me.permissions.has(import_discord4.PermissionFlagsBits.ManageGuild);
    if (!hasAdmin) {
      missingPermissions.push("Administrator (Y\xF6netici)");
      issues.push({
        type: "MISSING_ADMIN",
        title: "Y\xF6netici (Administrator) \u0130zni Eksik",
        detail: "Botun tam yetkili \xE7al\u0131\u015Fmas\u0131, t\xFCm kategorileri ve kural kanallar\u0131n\u0131 eksiksiz kurabilmesi i\xE7in Y\xF6netici yetkisi \xF6nerilir.",
        solution: 'Sunucu Ayarlar\u0131 > Roller sekmesinden bot rol\xFCne "Y\xF6netici" izni verin.'
      });
    }
    if (!hasAdmin && !hasManageRoles) {
      missingPermissions.push("ManageRoles (Rolleri Y\xF6net)");
      issues.push({
        type: "MISSING_ROLES",
        title: "Rolleri Y\xF6net \u0130zni Eksik",
        detail: "Bot yeni rolleri (Y\xF6netici, Moderat\xF6r, \xDCye vb.) olu\u015Fturamaz ve renklerini d\xFCzenleyemez.",
        solution: 'Botun rol\xFCne "Rolleri Y\xF6net" iznini a\xE7\u0131n.'
      });
    }
    if (!hasAdmin && !hasManageChannels) {
      missingPermissions.push("ManageChannels (Kanallar\u0131 Y\xF6net)");
      issues.push({
        type: "MISSING_CHANNELS",
        title: "Kanallar\u0131 Y\xF6net \u0130zni Eksik",
        detail: "Bot yeni metin, ses ve duyuru kanallar\u0131 olu\u015Fturamaz veya izinlerini ayarlayamaz.",
        solution: 'Botun rol\xFCne "Kanallar\u0131 Y\xF6net" iznini a\xE7\u0131n.'
      });
    }
    if (!hasAdmin && !hasManageGuild) {
      missingPermissions.push("ManageGuild (Sunucuyu Y\xF6net)");
      issues.push({
        type: "MISSING_GUILD",
        title: "Sunucuyu Y\xF6net \u0130zni Eksik",
        detail: "Bot sunucu ad\u0131n\u0131 g\xFCncelleyemez ve otomatik olu\u015Fturulan 512x512 logoyu uygulayamaz.",
        solution: 'Botun rol\xFCne "Sunucuyu Y\xF6net" iznini a\xE7\u0131n.'
      });
    }
    const botHighestRole = me.roles.highest;
    const botPosition = botHighestRole ? botHighestRole.position : 0;
    const botRoleName = botHighestRole ? botHighestRole.name : "Bot Rol\xFC";
    if (guild.roles?.cache) {
      guild.roles.cache.forEach((r) => {
        if (!r.managed && r.id !== guild.id && r.position >= botPosition) {
          rolesAboveBot.push(r.name);
        }
      });
    }
    if (rolesAboveBot.length > 0) {
      issues.push({
        type: "ROLE_HIERARCHY",
        title: "Rol Hiyerar\u015Fisi Pozisyonu Yetersiz",
        detail: `Botun en y\xFCksek rol\xFC (\`${botRoleName}\`), sunucudaki baz\u0131 rollerin alt\u0131nda yer al\u0131yor (${rolesAboveBot.slice(0, 4).join(", ")}${rolesAboveBot.length > 4 ? "..." : ""}). Bu durum rollerin s\u0131ralanmas\u0131n\u0131 veya temizlik modunu engelleyebilir.`,
        solution: "Discord Sunucu Ayarlar\u0131 > Roller men\xFCs\xFCnde botun rol\xFCn\xFC fareyle tutup Sunucu Sahibinin hemen alt\u0131na (en tepeye) s\xFCr\xFCkleyin."
      });
    }
    const healthy = issues.length === 0;
    const canDeploy = hasAdmin || hasManageRoles && hasManageChannels;
    const embed = new import_discord4.EmbedBuilder().setColor(healthy ? "#2ECC71" : canDeploy ? "#FEE75C" : "#ED4245").setTitle(
      healthy ? "\u2705 SUNUCU YETK\u0130 VE H\u0130YERAR\u015E\u0130 DURUMU M\xDCKEMMEL" : "\u{1F6E1}\uFE0F SUNUCU AYARLARI & TE\u015EH\u0130S RAPORU"
    ).setDescription(
      healthy ? `**${guild.name}** sunucusunda bot en \xFCst d\xFCzey yetkilere ve ideal hiyerar\u015Fik konuma sahip. T\xFCm in\u015Faat ve otomasyon i\u015Flemleri s\u0131f\u0131r hatayla \xE7al\u0131\u015Facakt\u0131r!` : `**${guild.name}** \xFCzerinde tespit edilen **${issues.length} adet** kritik yetkilendirme veya hiyerar\u015Fi uyar\u0131s\u0131 bulunmaktad\u0131r.
Sorunsuz bir kurulum i\xE7in l\xFCtfen a\u015Fa\u011F\u0131daki ad\u0131mlar\u0131 uygulay\u0131n.`
    ).setTimestamp();
    if (!healthy) {
      const issueDetails = issues.map((issue, idx) => `**${idx + 1}. ${issue.title}**
> \u26A0\uFE0F *${issue.detail}*`).join("\n\n");
      embed.addFields({
        name: "\u{1F50D} Tespit Edilen Durumlar",
        value: issueDetails.slice(0, 1024),
        inline: false
      });
      embed.addFields({
        name: "\u{1F451} Rol Hiyerar\u015Fisi \u015Eemas\u0131 (Olmas\u0131 Gereken S\u0131ralama)",
        value: [
          "```text",
          "\u{1F451} [Sunucu Sahibi / Kurucu]",
          `\u{1F916} [@${botRoleName}]  <-- (Botun rol\xFC burada olmal\u0131!)`,
          "\u{1F6E1}\uFE0F [Y\xF6netici / Moderat\xF6r]",
          "\u{1F465} [@everyone / Normal \xDCyeler]",
          "```"
        ].join("\n"),
        inline: false
      });
      embed.addFields({
        name: "\u{1F6E0}\uFE0F 30 Saniyede Ad\u0131m Ad\u0131m \xC7\xF6z\xFCm K\u0131lavuzu",
        value: [
          "1. Discord sol \xFCst\xFCnden **Sunucu Ad\u0131**na t\u0131klay\u0131p **Sunucu Ayarlar\u0131 (Server Settings)** a\xE7\u0131n.",
          "2. Sol men\xFCden **Roller (Roles)** sekmesine gelin.",
          `3. **@${botRoleName}** rol\xFCn\xFC farenizle tutup en \xFCst s\u0131raya (Sunucu Sahibinin hemen alt\u0131na) s\xFCr\xFCkleyin.`,
          "4. Bot rol\xFCne t\u0131klay\u0131p **\u0130zinler** sekmesinden **Y\xF6netici (Administrator)** iznini aktif edin.",
          "5. **De\u011Fi\u015Fiklikleri Kaydet** butonuna bas\u0131n ve i\u015Flemi tekrar ba\u015Flat\u0131n!"
        ].join("\n"),
        inline: false
      });
      embed.setFooter({
        text: "Discord AI Architect Self-Diagnostics \u2022 G\xFCvenli Sunucu Mimarisi"
      });
    }
    const summaryMessage = healthy ? "Yetkiler ve rol hiyerar\u015Fisi tam, kuruluma haz\u0131r." : `Yetki/Hiyerar\u015Fi Uyar\u0131s\u0131: ${issues.map((i) => i.title).join(", ")}`;
    return {
      healthy,
      canDeploy,
      botRoleName,
      botHighestPosition: botPosition,
      missingPermissions,
      rolesAboveBot,
      issues,
      troubleshootingEmbed: embed,
      summaryMessage
    };
  }
};

// src/services/features/ticketManager.ts
var import_discord5 = require("discord.js");
var TicketManager = class {
  static async handleTicketOpen(interaction) {
    const { guild, user } = interaction;
    if (!guild) return;
    await interaction.deferReply({ ephemeral: true });
    const channels = await guild.channels.fetch();
    const roles = await guild.roles.fetch();
    const channelName = `bilet-${user.username.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
    const existingChannel = channels.find((c) => c && c.name === channelName);
    if (existingChannel) {
      await interaction.editReply({
        content: `\u26A0\uFE0F Zaten a\xE7\u0131k bir destek talebiniz bulunuyor: <#${existingChannel.id}>`
      });
      return;
    }
    let category = channels.find(
      (c) => c && c.type === import_discord5.ChannelType.GuildCategory && (c.name.includes("DESTEK") || c.name.includes("destek"))
    );
    if (!category) {
      try {
        category = await guild.channels.create({
          name: "\u{1F3AB} \u2503 DESTEK TALEPLER\u0130",
          type: import_discord5.ChannelType.GuildCategory,
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              deny: [
                import_discord5.PermissionFlagsBits.ViewChannel,
                import_discord5.PermissionFlagsBits.SendMessages,
                import_discord5.PermissionFlagsBits.CreatePublicThreads,
                import_discord5.PermissionFlagsBits.CreatePrivateThreads
              ]
            },
            ...guild.members.me ? [
              {
                id: guild.members.me.id,
                allow: [
                  import_discord5.PermissionFlagsBits.ViewChannel,
                  import_discord5.PermissionFlagsBits.SendMessages,
                  import_discord5.PermissionFlagsBits.ManageChannels
                ]
              }
            ] : []
          ]
        });
      } catch (catErr) {
        console.error("[TicketManager] Destek kategorisi olu\u015Fturulurken hata:", catErr);
      }
    }
    const staffRole = roles.find(
      (r) => r && (r.name.toLowerCase().includes("moderat\xF6r") || r.name.toLowerCase().includes("moderator") || r.name.toLowerCase().includes("y\xF6netici") || r.name.toLowerCase().includes("admin") || r.name.toLowerCase().includes("kurucu") || r.name.toLowerCase().includes("yetkili")) && !r.managed
    );
    try {
      const permissionOverwrites = [
        {
          id: guild.roles.everyone.id,
          deny: [
            import_discord5.PermissionFlagsBits.ViewChannel,
            import_discord5.PermissionFlagsBits.SendMessages,
            import_discord5.PermissionFlagsBits.CreatePublicThreads,
            import_discord5.PermissionFlagsBits.CreatePrivateThreads,
            import_discord5.PermissionFlagsBits.SendMessagesInThreads
          ]
        },
        {
          id: user.id,
          allow: [
            import_discord5.PermissionFlagsBits.ViewChannel,
            import_discord5.PermissionFlagsBits.SendMessages,
            import_discord5.PermissionFlagsBits.AttachFiles,
            import_discord5.PermissionFlagsBits.EmbedLinks,
            import_discord5.PermissionFlagsBits.ReadMessageHistory
          ],
          deny: [
            import_discord5.PermissionFlagsBits.CreatePublicThreads,
            import_discord5.PermissionFlagsBits.CreatePrivateThreads,
            import_discord5.PermissionFlagsBits.SendMessagesInThreads
          ]
        },
        {
          id: guild.members.me.id,
          allow: [
            import_discord5.PermissionFlagsBits.ViewChannel,
            import_discord5.PermissionFlagsBits.SendMessages,
            import_discord5.PermissionFlagsBits.ManageChannels,
            import_discord5.PermissionFlagsBits.ReadMessageHistory
          ]
        }
      ];
      if (staffRole) {
        permissionOverwrites.push({
          id: staffRole.id,
          allow: [
            import_discord5.PermissionFlagsBits.ViewChannel,
            import_discord5.PermissionFlagsBits.SendMessages,
            import_discord5.PermissionFlagsBits.ManageMessages,
            import_discord5.PermissionFlagsBits.ReadMessageHistory
          ]
        });
      }
      const ticketChannel = await guild.channels.create({
        name: channelName,
        type: import_discord5.ChannelType.GuildText,
        parent: category?.id,
        topic: `Destek Talebi Sahibi: ${user.tag} (${user.id})`,
        permissionOverwrites
      });
      const welcomeEmbed = new import_discord5.EmbedBuilder().setTitle(`\u{1F3AB} Destek Talebi: ${user.username}`).setDescription(
        `Merhaba <@${user.id}>! Talebiniz ba\u015Far\u0131yla a\xE7\u0131ld\u0131.
L\xFCtfen sorununuzu, talebinizi veya ekran g\xF6r\xFCnt\xFClerinizi detayl\u0131ca iletiniz.
Yetkili ekibimiz en k\u0131sa s\xFCrede size d\xF6n\xFC\u015F yapacakt\u0131r.`
      ).setColor("#3498DB").addFields(
        { name: "\u{1F464} Kullan\u0131c\u0131", value: `<@${user.id}>`, inline: true },
        { name: "\u{1F6E1}\uFE0F \u0130lgili Ekip", value: staffRole ? `<@&${staffRole.id}>` : "Yetkili Ekip", inline: true }
      ).setFooter({ text: "Talebi sonland\u0131rmak i\xE7in a\u015Fa\u011F\u0131daki butona basabilirsiniz." }).setTimestamp();
      const actionRow = new import_discord5.ActionRowBuilder().addComponents(
        new import_discord5.ButtonBuilder().setCustomId("ticket_close").setLabel("Talebi Kapat").setEmoji("\u{1F512}").setStyle(import_discord5.ButtonStyle.Danger)
      );
      await ticketChannel.send({
        content: `<@${user.id}> ${staffRole ? `<@&${staffRole.id}>` : ""}`,
        embeds: [welcomeEmbed],
        components: [actionRow]
      });
      await interaction.editReply({
        content: `\u2705 Destek talebiniz a\xE7\u0131ld\u0131: <#${ticketChannel.id}>`
      });
    } catch (err) {
      console.error("[TicketManager] Hata:", err);
      await interaction.editReply({
        content: `\u274C Destek kanal\u0131 olu\u015Fturulamad\u0131: ${err.message}`
      });
    }
  }
  static getTicketPanelEmbed() {
    return new import_discord5.EmbedBuilder().setTitle("\u{1F3AB} NIGHTS DESTEK & TALEP MERKEZ\u0130 \u{1F6E1}\uFE0F").setDescription(
      "Sunucumuzla ilgili soru, \u015Fikayet, \xF6neri veya yetkili destek ihtiya\xE7lar\u0131n\u0131z i\xE7in tek t\u0131kla talep olu\u015Fturabilirsiniz.\n\n### \u{1F4CC} Destek Konular\u0131:\n\u2022 \u{1F6E1}\uFE0F Sunucu \u0130\xE7i \u015Eikayet ve \u0130hlal Bildirimi\n\u2022 \u2B50 Rol, Seviye veya \xC7ekili\u015F \xD6d\xFCl\xFC Talebi\n\u2022 \u{1F91D} Partnerlik & \u0130\u015F Birli\u011Fi G\xF6r\xFC\u015Fmeleri\n\u2022 \u{1F4A1} \xD6neri ve Geri Bildirimler\n\n> \u{1F4A1} *A\u015Fa\u011F\u0131daki **\u{1F4E9} Destek Talebi A\xE7** butonuna basarak size ve yetkililere \xF6zel g\xFCvenli bir destek odas\u0131 ba\u015Flatabilirsiniz.*"
    ).setImage("https://media.giphy.com/media/26tn3334mvoVClhos/giphy.gif").setColor("#3498DB").setFooter({ text: "Nights Ticket Engine \u2022 Made by erencix" });
  }
  static getTicketPanelControls() {
    return new import_discord5.ActionRowBuilder().addComponents(
      new import_discord5.ButtonBuilder().setCustomId("ticket_open").setLabel("Destek Talebi A\xE7").setStyle(import_discord5.ButtonStyle.Primary).setEmoji("\u{1F4E9}")
    );
  }
  static async handleTicketClose(interaction) {
    const channel = interaction.channel;
    if (!channel || channel.type !== import_discord5.ChannelType.GuildText) return;
    await interaction.reply({
      content: "\u{1F512} Bu destek talebi 5 saniye i\xE7inde kapat\u0131l\u0131p silinecektir..."
    });
    setTimeout(async () => {
      try {
        await channel.delete("Destek talebi kullan\u0131c\u0131/yetkili taraf\u0131ndan kapat\u0131ld\u0131.");
      } catch (err) {
        console.error("[TicketManager] Kanal silinirken hata:", err);
      }
    }, 5e3);
  }
};

// src/services/features/voicePanelManager.ts
var import_discord7 = require("discord.js");

// src/services/features/voiceLobbyManager.ts
var import_discord6 = require("discord.js");
var VoiceLobbyManager = class {
  static tempVoiceChannels = /* @__PURE__ */ new Set();
  static registerTempChannel(channelId) {
    this.tempVoiceChannels.add(channelId);
  }
  static isTemporaryVoiceChannel(channel) {
    if (!channel || channel.type !== import_discord6.ChannelType.GuildVoice) return false;
    const lowerName = channel.name.toLocaleLowerCase("tr-TR");
    const isProtected = lowerName.includes("oda olu\u015Ftur") || lowerName.includes("oda olustur") || lowerName.includes("create voice") || lowerName.includes("join to create") || lowerName.includes("sohbet") || lowerName.includes("sinema") || lowerName.includes("dizi") || lowerName.includes("anime") || lowerName.includes("watch party") || lowerName.includes("party") || lowerName.includes("valorant") || lowerName.includes("rekabet\xE7i") || lowerName.includes("rekabetci") || lowerName.includes("duo") || lowerName.includes("trio") || lowerName.includes("minecraft") || lowerName.includes("roblox") || lowerName.includes("tft") || lowerName.includes("chill") || lowerName.includes("dinlenme") || lowerName.includes("m\xFCzik") || lowerName.includes("muzik") || lowerName.includes("afk") || lowerName.includes("toplant\u0131") || lowerName.includes("toplanti") || lowerName.includes("y\xF6netici") || lowerName.includes("yonetici") || lowerName.includes("yetkili") || lowerName.includes("y\xF6netim") || lowerName.includes("yonetim") || lowerName.includes("kurucu") || lowerName.includes("kay\u0131t") || lowerName.includes("kayit");
    if (isProtected) return false;
    if (this.tempVoiceChannels.has(channel.id)) return true;
    if (lowerName.includes("odas\u0131") || lowerName.includes("odasi") || lowerName.includes("room") || lowerName.includes("lobby") || channel.name.startsWith("\u{1F50A}\u30FB") || channel.name.startsWith("\u{1F50A}")) {
      return true;
    }
    const parentName = channel.parent?.name?.toLocaleLowerCase("tr-TR") || "";
    if (parentName.includes("ses") || parentName.includes("oda") || parentName.includes("\xF6zel") || parentName.includes("ozel")) {
      const hasMemberOverwrite = channel.permissionOverwrites.cache.some(
        (ow) => ow.type === 1 && ow.allow.has(import_discord6.PermissionFlagsBits.ManageChannels)
      );
      if (hasMemberOverwrite) return true;
    }
    return false;
  }
  static async handleVoiceStateUpdate(oldState, newState) {
    const { member, guild } = newState;
    if (!guild) return;
    const joinedChannel = newState.channel;
    if (joinedChannel && member) {
      const jName = joinedChannel.name.toLocaleLowerCase("tr-TR");
      if (jName.includes("oda olu\u015Ftur") || jName.includes("oda olustur") || jName.includes("create voice")) {
        try {
          const category = joinedChannel.parent;
          const roomName = `\u{1F50A}\u30FB${member.displayName} Odas\u0131`;
          const tempVoice = await guild.channels.create({
            name: roomName,
            type: import_discord6.ChannelType.GuildVoice,
            parent: category?.id,
            permissionOverwrites: [
              {
                id: member.id,
                allow: [
                  import_discord6.PermissionFlagsBits.ManageChannels,
                  import_discord6.PermissionFlagsBits.MoveMembers,
                  import_discord6.PermissionFlagsBits.Connect,
                  import_discord6.PermissionFlagsBits.Speak
                ]
              }
            ]
          });
          this.tempVoiceChannels.add(tempVoice.id);
          await member.voice.setChannel(tempVoice).catch(() => {
          });
        } catch (err) {
          console.error("[VoiceLobbyManager] Ge\xE7ici oda olu\u015Fturulurken hata:", err);
        }
      }
    }
    const leftChannel = oldState.channel;
    if (leftChannel) {
      setTimeout(async () => {
        try {
          const freshChannel = await guild.channels.fetch(leftChannel.id).catch(() => null);
          if (!freshChannel) {
            this.tempVoiceChannels.delete(leftChannel.id);
            return;
          }
          if (freshChannel.members.size === 0 && this.isTemporaryVoiceChannel(freshChannel)) {
            this.tempVoiceChannels.delete(freshChannel.id);
            await freshChannel.delete("Ge\xE7ici ses odas\u0131nda kimse kalmad\u0131\u011F\u0131 i\xE7in otomatik silindi.").catch(() => {
            });
            console.log(`[VoiceLobbyManager] \u{1F5D1}\uFE0F Bo\u015Falan ge\xE7ici oda silindi: ${freshChannel.name} (${freshChannel.id})`);
          }
        } catch (err) {
          console.error("[VoiceLobbyManager] Bo\u015F oda silinirken hata:", err);
        }
      }, 1200);
    }
  }
  // Periyodik Temizleyici: Bot yeniden başladığında veya arada kalan boş odaları süpürür
  static async sweepEmptyChannels(client) {
    try {
      for (const [_, guild] of client.guilds.cache) {
        for (const [id, channel] of guild.channels.cache) {
          if (channel.type === import_discord6.ChannelType.GuildVoice && channel.members.size === 0) {
            const vChannel = channel;
            if (this.isTemporaryVoiceChannel(vChannel)) {
              this.tempVoiceChannels.delete(id);
              await vChannel.delete("Bo\u015Fta kalan sahipsiz ge\xE7ici oda otomatik temizlendi.").catch(() => {
              });
              console.log(`[VoiceLobbyManager] \u{1F9F9} Bo\u015Fta kalan oda s\xFCp\xFCr\xFCld\xFC: ${vChannel.name} (${id})`);
            }
          }
        }
      }
    } catch (e) {
    }
  }
};

// src/services/features/voicePanelManager.ts
var VoicePanelManager = class {
  static getVoicePanelEmbed() {
    return new import_discord7.EmbedBuilder().setTitle("\u{1F39B}\uFE0F NIGHTS GEL\u0130\u015EM\u0130\u015E SES ODASI KONTROL MERKEZ\u0130 \u{1F399}\uFE0F").setDescription(
      "\xD6zel ses odan\u0131z\u0131 a\u015Fa\u011F\u0131daki 10 g\xFC\xE7l\xFC kontrol se\xE7ene\u011Fiyle diledi\u011Finiz gibi y\xF6netin ve \xF6zelle\u015Ftirin!\n\n### \u26A1 Kontrol Se\xE7enekleri:\n\u2022 \u{1F512} **Oday\u0131 Kilitle:** Odaya yabanc\u0131 \xFCyelerin giri\u015Fini engeller.\n\u2022 \u{1F513} **Kilidi A\xE7:** Odan\u0131n kilidini a\xE7ar, t\xFCm \xFCyeler kat\u0131labilir.\n\u2022 \u{1F441}\uFE0F **Gizle / G\xF6ster:** Oday\u0131 kanallar listesinde gizler veya g\xF6r\xFCn\xFCr yapar.\n\u2022 \u{1F465} **Ki\u015Fi Limiti:** Oda kapasitesini s\u0131rayla ayarlar *(2 \u2794 5 \u2794 10 \u2794 15 \u2794 S\u0131n\u0131rs\u0131z)*.\n\u2022 \u270F\uFE0F **\u0130sim De\u011Fi\u015Ftir:** Odan\u0131z\u0131n ad\u0131n\u0131 modal penceresinden \xF6zelle\u015Ftirir.\n\u2022 \u{1F507} **Oday\u0131 Sustur / A\xE7:** Odan\u0131n genel konu\u015Fma iznini a\xE7ar veya kapat\u0131r.\n\u2022 \u{1F680} **Ses Kalitesi (Bitrate):** Kristal netli\u011Finde Hi-Fi ses kalitesi sunar.\n\u2022 \u{1F451} **Sahipli\u011Fi Al:** Sahibi ayr\u0131lm\u0131\u015F odan\u0131n liderli\u011Fini \xFCzerinize tan\u0131mlar.\n\u2022 \u{1F4CA} **Oda Durumu:** Aktif oda bilgileri, limit ve \xFCye durumunu g\xF6sterir.\n\u2022 \u2795 **\xD6zel Oda A\xE7:** Sizin ad\u0131n\u0131za an\u0131nda yeni bir \xF6zel ses odas\u0131 kurar.\n\n> \u{1F4A1} *Butonlar\u0131 kullanabilmek i\xE7in sunucumuzdaki bir ses kanal\u0131nda bulunman\u0131z gerekmektedir.*"
    ).setImage("https://media.giphy.com/media/ErZ8hv5eO92JW/giphy.gif").setColor("#9B59B6").setFooter({ text: "Nights Advanced Voice Studio \u2022 Made by erencix" });
  }
  static getVoicePanelControls() {
    const row1 = new import_discord7.ActionRowBuilder().addComponents(
      new import_discord7.ButtonBuilder().setCustomId("btn_voice_lock").setLabel("Oday\u0131 Kilitle").setStyle(import_discord7.ButtonStyle.Danger).setEmoji("\u{1F512}"),
      new import_discord7.ButtonBuilder().setCustomId("btn_voice_unlock").setLabel("Kilidi A\xE7").setStyle(import_discord7.ButtonStyle.Success).setEmoji("\u{1F513}"),
      new import_discord7.ButtonBuilder().setCustomId("btn_voice_hide").setLabel("Gizle / G\xF6ster").setStyle(import_discord7.ButtonStyle.Secondary).setEmoji("\u{1F441}\uFE0F"),
      new import_discord7.ButtonBuilder().setCustomId("btn_voice_limit").setLabel("Ki\u015Fi Limiti").setStyle(import_discord7.ButtonStyle.Primary).setEmoji("\u{1F465}"),
      new import_discord7.ButtonBuilder().setCustomId("btn_voice_rename").setLabel("\u0130sim De\u011Fi\u015Ftir").setStyle(import_discord7.ButtonStyle.Primary).setEmoji("\u270F\uFE0F")
    );
    const row2 = new import_discord7.ActionRowBuilder().addComponents(
      new import_discord7.ButtonBuilder().setCustomId("btn_voice_mute").setLabel("Sustur / A\xE7").setStyle(import_discord7.ButtonStyle.Secondary).setEmoji("\u{1F507}"),
      new import_discord7.ButtonBuilder().setCustomId("btn_voice_bitrate").setLabel("Bitrate (Kalite)").setStyle(import_discord7.ButtonStyle.Primary).setEmoji("\u{1F680}"),
      new import_discord7.ButtonBuilder().setCustomId("btn_voice_claim").setLabel("Sahipli\u011Fi Al").setStyle(import_discord7.ButtonStyle.Secondary).setEmoji("\u{1F451}"),
      new import_discord7.ButtonBuilder().setCustomId("btn_voice_info").setLabel("Oda Durumu").setStyle(import_discord7.ButtonStyle.Secondary).setEmoji("\u{1F4CA}"),
      new import_discord7.ButtonBuilder().setCustomId("btn_voice_create").setLabel("\xD6zel Oda A\xE7").setStyle(import_discord7.ButtonStyle.Success).setEmoji("\u2795")
    );
    return [row1, row2];
  }
  static async handleVoiceButton(interaction) {
    const member = interaction.member;
    const guild = interaction.guild;
    if (!member || !guild) return;
    const customId = interaction.customId;
    if (customId === "btn_voice_create") {
      try {
        const category = guild.channels.cache.find(
          (c) => c.type === import_discord7.ChannelType.GuildCategory && c.name.includes("SES ODALARI")
        );
        const newChannel = await guild.channels.create({
          name: `\u{1F50A}\u30FB${member.displayName} Odas\u0131`,
          type: import_discord7.ChannelType.GuildVoice,
          parent: category?.id,
          permissionOverwrites: [
            {
              id: member.id,
              allow: [
                import_discord7.PermissionFlagsBits.ManageChannels,
                import_discord7.PermissionFlagsBits.MoveMembers,
                import_discord7.PermissionFlagsBits.Connect,
                import_discord7.PermissionFlagsBits.Speak
              ]
            }
          ]
        });
        VoiceLobbyManager.registerTempChannel(newChannel.id);
        if (member.voice.channel) {
          await member.voice.setChannel(newChannel);
        }
        await interaction.reply({
          content: `\u{1F389} **\xD6zel ses odan\u0131z ba\u015Far\u0131yla a\xE7\u0131ld\u0131:** <#${newChannel.id}>
Odan\u0131za kat\u0131larak arkada\u015Flar\u0131n\u0131z\u0131 davet edebilir ve paneli kullanabilirsiniz!`,
          ephemeral: true
        });
      } catch (err) {
        await interaction.reply({
          content: `\u274C Oda olu\u015Fturulamad\u0131: ${err.message}`,
          ephemeral: true
        });
      }
      return;
    }
    const currentVoice = member.voice.channel;
    if (!currentVoice) {
      await interaction.reply({
        content: "\u26A0\uFE0F **Bu i\u015Flemi yapabilmek i\xE7in sunucumuzdaki bir ses kanal\u0131nda bulunmal\u0131s\u0131n\u0131z!**",
        ephemeral: true
      });
      return;
    }
    const everyoneRole = guild.roles.everyone;
    switch (customId) {
      // ✏️ İsim Değiştir (Modal Penceresi)
      case "btn_voice_rename": {
        const modal = new import_discord7.ModalBuilder().setCustomId("modal_voice_rename").setTitle("Ses Kanal\u0131 \u0130smini De\u011Fi\u015Ftir");
        const nameInput = new import_discord7.TextInputBuilder().setCustomId("input_voice_name").setLabel("Yeni Oda \u0130smi").setStyle(import_discord7.TextInputStyle.Short).setPlaceholder("\xD6rn: \u{1F3AE}\u30FBValorant Dereceli veya \u{1F3A7}\u30FBChill Lo-Fi").setValue(currentVoice.name).setMinLength(2).setMaxLength(40).setRequired(true);
        modal.addComponents(new import_discord7.ActionRowBuilder().addComponents(nameInput));
        await interaction.showModal(modal);
        break;
      }
      // 🔒 Odayı Kilitle
      case "btn_voice_lock": {
        await currentVoice.permissionOverwrites.edit(everyoneRole, {
          Connect: false
        });
        await currentVoice.permissionOverwrites.edit(member.id, {
          Connect: true,
          Speak: true
        });
        await interaction.reply({
          content: `\u{1F512} **${currentVoice.name}** odas\u0131 kilitlendi! Art\u0131k d\u0131\u015Far\u0131dan yabanc\u0131 \xFCyeler kat\u0131lamaz.`,
          ephemeral: true
        });
        break;
      }
      // 🔓 Kilidi Aç
      case "btn_voice_unlock": {
        await currentVoice.permissionOverwrites.edit(everyoneRole, {
          Connect: null
        });
        await interaction.reply({
          content: `\u{1F513} **${currentVoice.name}** odas\u0131n\u0131n kilidi a\xE7\u0131ld\u0131! T\xFCm \xFCyeler serbest\xE7e kat\u0131labilir.`,
          ephemeral: true
        });
        break;
      }
      // 👁️ Odayı Gizle / Göster
      case "btn_voice_hide": {
        const currentOverwrites = currentVoice.permissionsFor(everyoneRole);
        const isVisible = currentOverwrites?.has(import_discord7.PermissionFlagsBits.ViewChannel) ?? true;
        if (isVisible) {
          await currentVoice.permissionOverwrites.edit(everyoneRole, {
            ViewChannel: false
          });
          await currentVoice.permissionOverwrites.edit(member.id, {
            ViewChannel: true
          });
          await interaction.reply({
            content: `\u{1F441}\uFE0F **${currentVoice.name}** odas\u0131 gizlendi! Art\u0131k kanal listesinde g\xF6r\xFCnmez (hayalet oda).`,
            ephemeral: true
          });
        } else {
          await currentVoice.permissionOverwrites.edit(everyoneRole, {
            ViewChannel: null
          });
          await interaction.reply({
            content: `\u{1F441}\uFE0F **${currentVoice.name}** odas\u0131 tekrar g\xF6r\xFCn\xFCr hale getirildi!`,
            ephemeral: true
          });
        }
        break;
      }
      // 👥 Kişi Limiti
      case "btn_voice_limit": {
        const currentLimit = currentVoice.userLimit || 0;
        let nextLimit = 0;
        if (currentLimit === 0) nextLimit = 2;
        else if (currentLimit === 2) nextLimit = 5;
        else if (currentLimit === 5) nextLimit = 10;
        else if (currentLimit === 10) nextLimit = 15;
        else nextLimit = 0;
        await currentVoice.setUserLimit(nextLimit);
        await interaction.reply({
          content: `\u{1F465} **${currentVoice.name}** odas\u0131n\u0131n ki\u015Fi kapasitesi **${nextLimit === 0 ? "S\u0131n\u0131rs\u0131z \u267E\uFE0F" : nextLimit + " Ki\u015Fi"}** olarak ayarland\u0131.`,
          ephemeral: true
        });
        break;
      }
      // 🔇 Odayı Sustur / Aç
      case "btn_voice_mute": {
        const currentOverwrites = currentVoice.permissionsFor(everyoneRole);
        const canSpeak = currentOverwrites?.has(import_discord7.PermissionFlagsBits.Speak) ?? true;
        await currentVoice.permissionOverwrites.edit(everyoneRole, {
          Speak: !canSpeak
        });
        await interaction.reply({
          content: `\u{1F507} **${currentVoice.name}** odas\u0131nda genel konu\u015Fma durumu: **${!canSpeak ? "Konu\u015Fma A\xE7\u0131k \u{1F50A}" : "Oda Sessize Al\u0131nd\u0131 \u{1F507}"}**`,
          ephemeral: true
        });
        break;
      }
      // 🚀 Bitrate (Ses Kalitesi)
      case "btn_voice_bitrate": {
        const currentBitrate = currentVoice.bitrate;
        let nextBitrate = 64e3;
        let bitrateLabel = "64 kbps (Standart Kalite)";
        if (currentBitrate <= 64e3) {
          nextBitrate = 96e3;
          bitrateLabel = "96 kbps (St\xFCdyo & Hi-Fi Kalite \u{1F3A7})";
        } else {
          nextBitrate = 64e3;
          bitrateLabel = "64 kbps (Standart Kalite \u{1F50A})";
        }
        try {
          await currentVoice.setBitrate(nextBitrate);
          await interaction.reply({
            content: `\u{1F680} **${currentVoice.name}** ses odas\u0131n\u0131n ses iletim kalitesi **${bitrateLabel}** olarak ayarland\u0131!`,
            ephemeral: true
          });
        } catch (err) {
          await interaction.reply({
            content: `\u26A0\uFE0F Bitrate ayarlan\u0131rken sunucu limiti uyar\u0131s\u0131: ${err.message}`,
            ephemeral: true
          });
        }
        break;
      }
      // 👑 Sahipliği Al
      case "btn_voice_claim": {
        await currentVoice.permissionOverwrites.edit(member.id, {
          ManageChannels: true,
          MoveMembers: true,
          Connect: true,
          Speak: true
        });
        await interaction.reply({
          content: `\u{1F451} **${currentVoice.name}** odas\u0131n\u0131n oda y\xF6neticisi ve sahipli\u011Fi ba\u015Far\u0131yla \xFCzerinize tan\u0131mland\u0131!`,
          ephemeral: true
        });
        break;
      }
      // 📊 Oda Durumu
      case "btn_voice_info": {
        const membersInVoice = currentVoice.members.map((m) => `\u2022 <@${m.id}>`).join("\n") || "Oda bo\u015F";
        const isLocked = currentVoice.permissionsFor(everyoneRole)?.has(import_discord7.PermissionFlagsBits.Connect) === false;
        const isHidden = currentVoice.permissionsFor(everyoneRole)?.has(import_discord7.PermissionFlagsBits.ViewChannel) === false;
        const infoEmbed = new import_discord7.EmbedBuilder().setTitle(`\u{1F4CA} Ses Odas\u0131 Durum Raporu: ${currentVoice.name}`).setColor("#9B59B6").addFields(
          {
            name: "\u{1F512} Kilit Durumu",
            value: isLocked ? "\u{1F534} Kilitli (Giri\u015F Kapal\u0131)" : "\u{1F7E2} Herkese A\xE7\u0131k",
            inline: true
          },
          {
            name: "\u{1F441}\uFE0F G\xF6r\xFCn\xFCrl\xFCk",
            value: isHidden ? "\u{1F47B} Gizli (Hayalet Oda)" : "\u{1F440} G\xF6r\xFCn\xFCr",
            inline: true
          },
          {
            name: "\u{1F465} Kapasite",
            value: currentVoice.userLimit === 0 ? "\u267E\uFE0F S\u0131n\u0131rs\u0131z" : `${currentVoice.members.size} / ${currentVoice.userLimit} Ki\u015Fi`,
            inline: true
          },
          {
            name: "\u{1F680} Ses Kalitesi (Bitrate)",
            value: `${Math.round(currentVoice.bitrate / 1e3)} kbps`,
            inline: true
          },
          {
            name: "\u{1F3A7} Odadaki \xDCyeler",
            value: membersInVoice,
            inline: false
          }
        ).setFooter({ text: "Nights Advanced Voice Studio" }).setTimestamp();
        await interaction.reply({ embeds: [infoEmbed], ephemeral: true });
        break;
      }
      default:
        await interaction.reply({ content: "Bilinmeyen ses i\u015Flemi.", ephemeral: true });
        break;
    }
  }
  static async handleVoiceModal(interaction) {
    const member = interaction.member;
    const currentVoice = member?.voice?.channel;
    if (!currentVoice) {
      await interaction.reply({
        content: "\u26A0\uFE0F Ses kanal\u0131nda de\u011Filsiniz! \u0130sim de\u011Fi\u015Ftirebilmek i\xE7in bir ses odas\u0131nda bulunmal\u0131s\u0131n\u0131z.",
        ephemeral: true
      });
      return;
    }
    const newName = interaction.fields.getTextInputValue("input_voice_name").trim();
    try {
      await currentVoice.setName(newName);
      await interaction.reply({
        content: `\u2705 Odan\u0131z\u0131n ad\u0131 ba\u015Far\u0131yla de\u011Fi\u015Ftirildi: **${newName}**`,
        ephemeral: true
      });
    } catch (err) {
      await interaction.reply({
        content: `\u274C \u0130sim de\u011Fi\u015Ftirilemedi: ${err.message}`,
        ephemeral: true
      });
    }
  }
};

// src/commands/aiLogo.ts
var import_discord8 = require("discord.js");
var import_crypto = __toESM(require("crypto"));
var pendingLogoCache = /* @__PURE__ */ new Map();
var data = new import_discord8.SlashCommandBuilder().setName("logo").setDescription("Sunucunuz i\xE7in 512x512 y\xFCksek \xE7\xF6z\xFCn\xFCrl\xFCkl\xFC \xF6zel logo \xFCretir.").setDefaultMemberPermissions(import_discord8.PermissionFlagsBits.Administrator).addStringOption(
  (opt) => opt.setName("istek").setDescription("Logo nas\u0131l g\xF6r\xFCns\xFCn? (\xD6rn: Neon siberpunk kurt ba\u015F\u0131, alt\u0131n ta\xE7l\u0131 aslan)").setRequired(true)
).addBooleanOption(
  (opt) => opt.setName("uygula").setDescription("\xDCretilen logoyu hemen sunucu ikonu yaps\u0131n m\u0131? (Varsay\u0131lan: Hay\u0131r)").setRequired(false)
);
async function execute(interaction) {
  if (!interaction.guild) {
    await interaction.reply({ content: "Bu komut sadece sunucularda kullan\u0131labilir.", ephemeral: true });
    return;
  }
  await interaction.deferReply();
  const prompt = interaction.options.getString("istek", true);
  const autoApply = interaction.options.getBoolean("uygula") ?? false;
  await interaction.editReply({
    content: `\u{1F3A8} **Yapay Zeka ile Logo \xC7iziliyor...**
> Prompt: *"${prompt}"*
L\xFCtfen bekleyin (10-20 saniye s\xFCrebilir)...`
  });
  const studio = new LogoStudio();
  try {
    const result = await studio.generateIcon(prompt);
    const attachment = new import_discord8.AttachmentBuilder(result.buffer, { name: "server-logo.png" });
    let appliedText = "";
    if (autoApply) {
      if (interaction.memberPermissions?.has(import_discord8.PermissionFlagsBits.ManageGuild)) {
        await studio.applyIconToGuild(interaction.guild, result.buffer);
        appliedText = "\n\n\u2705 **Sunucu ikonu ba\u015Far\u0131yla g\xFCncellendi!**";
      } else {
        appliedText = "\n\n\u26A0\uFE0F Yetkiniz (Sunucuyu Y\xF6net) olmad\u0131\u011F\u0131 i\xE7in logo otomatik uygulanamad\u0131.";
      }
    }
    const embed = new import_discord8.EmbedBuilder().setTitle("\u{1F3A8} AI Sunucu Logosu Haz\u0131r!").setDescription(`**Prompt:** *${prompt}*
**Kaynak:** \`${result.source.toUpperCase()}\`${appliedText}`).setImage("attachment://server-logo.png").setColor("#9B59B6").setFooter({ text: "Nights Guard \u2022 Made by erencix \u2022 512x512 PNG" }).setTimestamp();
    const logoId = import_crypto.default.randomBytes(6).toString("hex");
    pendingLogoCache.set(logoId, { buffer: result.buffer, guildId: interaction.guild.id });
    const row = new import_discord8.ActionRowBuilder().addComponents(
      new import_discord8.ButtonBuilder().setCustomId(`apply_logo:${logoId}`).setLabel("Sunucu Logosu Yap").setEmoji("\u{1F5BC}\uFE0F").setStyle(import_discord8.ButtonStyle.Success)
    );
    await interaction.editReply({
      content: "",
      embeds: [embed],
      files: [attachment],
      components: autoApply ? [] : [row]
    });
  } catch (err) {
    console.error("ai-logo hatas\u0131:", err);
    await interaction.editReply({
      content: `\u274C Logo \xFCretilirken bir hata olu\u015Ftu: ${err.message}`
    });
  }
}

// src/commands/aiKur.ts
var import_discord9 = require("discord.js");
var import_crypto2 = __toESM(require("crypto"));
var data2 = new import_discord9.SlashCommandBuilder().setName("kur").setDescription("Sunucunuza profesyonel bir mimari, roller ve kanallar kurar.").setDefaultMemberPermissions(import_discord9.PermissionFlagsBits.Administrator).addStringOption(
  (opt) => opt.setName("istek").setDescription("Nas\u0131l bir sunucu istiyorsunuz? (\xD6rn: Anime RP, Valorant tak\u0131m\u0131)").setRequired(true)
).addBooleanOption(
  (opt) => opt.setName("temizlik_modu").setDescription("Mevcut kanallar\u0131 ve rolleri temizleyip kursun mu? (Varsay\u0131lan: Hay\u0131r)").setRequired(false)
).addBooleanOption(
  (opt) => opt.setName("otomatik_logo").setDescription("AI ile logo \xFCretip sunucu ikonu yaps\u0131n m\u0131? (Varsay\u0131lan: Evet)").setRequired(false)
).addStringOption(
  (opt) => opt.setName("stil").setDescription("Sunucunun tasar\u0131m tarz\u0131").addChoices(
    { name: "Modern & Estetik", value: "modern" },
    { name: "Minimalist & Sade", value: "minimalist" },
    { name: "Gaming / Oyun Temal\u0131", value: "gaming" },
    { name: "Anime / RP Temal\u0131", value: "anime" },
    { name: "Kurumsal / Profesyonel", value: "professional" }
  )
).addStringOption(
  (opt) => opt.setName("dil").setDescription("Kanal ve rol isimlerinin dili").addChoices(
    { name: "T\xFCrk\xE7e (TR)", value: "tr" },
    { name: "English (EN)", value: "en" }
  )
);
async function execute2(interaction, aiManager) {
  if (!interaction.guild) {
    await interaction.reply({ content: "Bu komut sadece sunucularda kullan\u0131labilir.", ephemeral: true });
    return;
  }
  if (!interaction.memberPermissions?.has(import_discord9.PermissionFlagsBits.Administrator)) {
    await interaction.reply({
      content: "\u274C Bu komutu \xE7al\u0131\u015Ft\u0131rmak i\xE7in `Y\xF6netici` (Administrator) yetkisine sahip olmal\u0131s\u0131n\u0131z.",
      ephemeral: true
    });
    return;
  }
  const diagnostics = ServerDiagnostics.check(interaction.guild);
  if (!diagnostics.canDeploy) {
    await interaction.reply({
      content: "\u26A0\uFE0F **Bot yetkileri veya rol hiyerar\u015Fisi eksik!** Kuruluma ba\u015Flamadan \xF6nce l\xFCtfen a\u015Fa\u011F\u0131daki ayarlar\u0131 tamamlay\u0131n:",
      embeds: [diagnostics.troubleshootingEmbed],
      ephemeral: true
    });
    return;
  }
  await interaction.deferReply();
  const prompt = interaction.options.getString("istek", true);
  const cleanSlate = interaction.options.getBoolean("temizlik_modu") ?? false;
  const applyLogo = interaction.options.getBoolean("otomatik_logo") ?? true;
  const style = interaction.options.getString("stil") || "modern";
  const locale = interaction.options.getString("dil") || "tr";
  await interaction.editReply({
    content: `\u{1F9E0} **Yapay Zeka Mimarisi Hesaplan\u0131yor...**
> \u0130stek: *"${prompt}"*
> Stil: \`${style}\` | Temizlik Modu: \`${cleanSlate ? "A\xC7IK (S\u0131f\u0131rdan Silinecek)" : "KAPALI (\xDCzerine Eklenecek)"}\`
L\xFCtfen bir iki saniye bekleyin, t\xFCm roller, kanallar, izinler ve kurallar tasarlan\u0131yor...`
  });
  try {
    const { blueprint, source } = await aiManager.generateBlueprint({
      prompt,
      style,
      locale,
      cleanSlate
    });
    const cacheId = import_crypto2.default.randomBytes(6).toString("hex");
    BlueprintCache.set({
      id: cacheId,
      userId: interaction.user.id,
      guildId: interaction.guild.id,
      blueprint,
      cleanSlate,
      applyLogo,
      createdAt: Date.now()
    });
    let totalChannels = 0;
    for (const cat of blueprint.categories) {
      totalChannels += cat.channels?.length || 0;
    }
    const previewEmbed = new import_discord9.EmbedBuilder().setTitle(`\u{1F3DB}\uFE0F Sunucu Mimarisi Tasarland\u0131: ${blueprint.serverName}`).setDescription(
      `**Tema:** ${blueprint.theme}
**A\xE7\u0131klama:** ${blueprint.serverDescription}
**Kaynak:** \`${source.toUpperCase()}\`

A\u015Fa\u011F\u0131da AI taraf\u0131ndan haz\u0131rlanan mimarinin \xF6zeti yer almaktad\u0131r. Onaylad\u0131\u011F\u0131n\u0131z takdirde bot sunucuyu birebir in\u015Fa etmeye ba\u015Flayacakt\u0131r.`
    ).setColor("#5865F2").addFields(
      {
        name: "\u{1F6E1}\uFE0F Rol Hiyerar\u015Fisi (" + blueprint.roles.length + " Rol)",
        value: blueprint.roles.map((r) => `\u2022 \`${r.name}\``).join("\n").slice(0, 1024),
        inline: true
      },
      {
        name: "\u{1F4C1} Kategoriler & Kanallar",
        value: `\u2022 **${blueprint.categories.length} Kategori**
\u2022 **${totalChannels} Kanal**
\u2022 Kurallar & Bilgi Embedleri
\u2022 AutoMod Koruma Kurallar\u0131`,
        inline: true
      },
      {
        name: "\u2699\uFE0F \xD6zel Entegrasyonlar",
        value: `\u2022 **Ticket Paneli:** ${blueprint.features?.ticketSystem?.enabled ? "\u2705 Aktif" : "\u274C Pasif"}
\u2022 **Ge\xE7ici Ses Odas\u0131 (Join-to-Create):** ${blueprint.features?.joinToCreate?.enabled ? "\u2705 Aktif" : "\u274C Pasif"}
\u2022 **AI Logo:** ${applyLogo ? "\u{1F3A8} \xDCretilip Uygulanacak" : "\u0130ptal"}
\u2022 **Temizlik Modu:** ${cleanSlate ? "\u26A0\uFE0F Mevcut sunucu s\u0131f\u0131rlanacak" : "\u2795 Mevcut sunucunun \xFCzerine eklenecek"}`,
        inline: false
      }
    ).setFooter({ text: "Nights Guard \u2022 Made by erencix" }).setTimestamp();
    const actionRow = new import_discord9.ActionRowBuilder().addComponents(
      new import_discord9.ButtonBuilder().setCustomId(`build_confirm:${cacheId}`).setLabel("Onayla ve \u0130n\u015Fa Et!").setEmoji("\u{1F680}").setStyle(import_discord9.ButtonStyle.Success),
      new import_discord9.ButtonBuilder().setCustomId(`build_details:${cacheId}`).setLabel("Detayl\u0131 Plan\u0131 \u0130ncele").setEmoji("\u{1F4CB}").setStyle(import_discord9.ButtonStyle.Secondary),
      new import_discord9.ButtonBuilder().setCustomId(`build_cancel:${cacheId}`).setLabel("\u0130ptal Et").setEmoji("\u274C").setStyle(import_discord9.ButtonStyle.Danger)
    );
    await interaction.editReply({
      content: "",
      embeds: [previewEmbed],
      components: [actionRow]
    });
  } catch (err) {
    console.error("ai-kur hatas\u0131:", err);
    await interaction.editReply({
      content: `\u274C Bir hata olu\u015Ftu: ${err.message}`
    });
  }
}

// src/commands/aiOnizle.ts
var import_discord10 = require("discord.js");
var data3 = new import_discord10.SlashCommandBuilder().setName("onizle").setDescription("Sunucunuza dokunmadan mimari plan\u0131n\u0131 ve kanal/rol \u015Femas\u0131n\u0131 \xF6nizler.").setDefaultMemberPermissions(import_discord10.PermissionFlagsBits.Administrator).addStringOption(
  (opt) => opt.setName("istek").setDescription("Nas\u0131l bir sunucu mimarisi g\xF6rmek istersiniz?").setRequired(true)
).addStringOption(
  (opt) => opt.setName("stil").setDescription("Tasar\u0131m tarz\u0131").addChoices(
    { name: "Modern & Estetik", value: "modern" },
    { name: "Minimalist & Sade", value: "minimalist" },
    { name: "Gaming / Oyun", value: "gaming" },
    { name: "Anime / RP", value: "anime" },
    { name: "Kurumsal / Profesyonel", value: "professional" }
  )
);
async function execute3(interaction, aiManager) {
  await interaction.deferReply();
  const prompt = interaction.options.getString("istek", true);
  const style = interaction.options.getString("stil") || "modern";
  await interaction.editReply({
    content: `\u{1F50D} **\xD6nizleme Hesaplan\u0131yor...**
> Prompt: *"${prompt}"*
Herhangi bir kanal silinmeyecek veya eklenmeyecektir (Dry-Run Modu).`
  });
  try {
    const { blueprint, source } = await aiManager.generateBlueprint({
      prompt,
      style,
      locale: "tr"
    });
    let channelList = "";
    for (const cat of blueprint.categories) {
      channelList += `\u{1F4C1} **${cat.name}**
`;
      if (cat.channels) {
        for (const ch of cat.channels.slice(0, 5)) {
          const icon = ch.type === "GUILD_VOICE" ? "\u{1F50A}" : "\u{1F4AC}";
          channelList += `  \u2514 ${icon} ${ch.name}
`;
        }
        if (cat.channels.length > 5) {
          channelList += `  \u2514 *...ve ${cat.channels.length - 5} kanal daha*
`;
        }
      }
    }
    const embed = new import_discord10.EmbedBuilder().setTitle(`\u{1F4CB} M\u0130MAR\u0130 \xD6N\u0130ZLEME: ${blueprint.serverName}`).setDescription(`**Tema:** ${blueprint.theme}
**A\xE7\u0131klama:** ${blueprint.serverDescription}`).addFields(
      {
        name: "\u{1F6E1}\uFE0F Roller (" + blueprint.roles.length + ")",
        value: blueprint.roles.map((r) => `\u2022 ${r.name} (${r.color})`).join("\n").slice(0, 1024),
        inline: true
      },
      {
        name: "\u{1F4C1} Kategori ve Kanallar",
        value: channelList.slice(0, 1024),
        inline: false
      },
      {
        name: "\u{1F916} AutoMod Kurallar\u0131",
        value: blueprint.automodRules?.map((r) => `\u2022 **${r.name}** (${r.triggerType})`).join("\n") || "Tan\u0131mlanmad\u0131",
        inline: true
      },
      {
        name: "\u{1F3A8} Logo Promptu",
        value: `\`${blueprint.iconPrompt?.slice(0, 300) || "Belirtilmedi"}\``,
        inline: false
      }
    ).setColor("#3498DB").setFooter({ text: `Nights Guard \u2022 Made by erencix \u2022 Motor: ${source.toUpperCase()}` });
    await interaction.editReply({
      content: "",
      embeds: [embed]
    });
  } catch (err) {
    await interaction.editReply({
      content: `\u274C \xD6nizleme hatas\u0131: ${err.message}`
    });
  }
}

// src/commands/sunucuTemizle.ts
var import_discord11 = require("discord.js");
var data4 = new import_discord11.SlashCommandBuilder().setName("sunucu-temizle").setDescription("Sunucudaki t\xFCm kanallar\u0131 ve bot harici rolleri g\xFCvenle siler (Temiz Ba\u015Flang\u0131\xE7).").setDefaultMemberPermissions(import_discord11.PermissionFlagsBits.Administrator);
async function execute4(interaction) {
  if (!interaction.guild) {
    await interaction.reply({ content: "Bu komut sadece sunucularda \xE7al\u0131\u015F\u0131r.", ephemeral: true });
    return;
  }
  if (!interaction.memberPermissions?.has(import_discord11.PermissionFlagsBits.Administrator)) {
    await interaction.reply({
      content: "\u274C Bu i\u015Flemi ger\xE7ekle\u015Ftirmek i\xE7in `Y\xF6netici` yetkisine sahip olmal\u0131s\u0131n\u0131z.",
      ephemeral: true
    });
    return;
  }
  const embed = new import_discord11.EmbedBuilder().setTitle("\u26A0\uFE0F TEHL\u0130KEL\u0130 \u0130\u015ELEM: Sunucu S\u0131f\u0131rlama").setDescription(
    `**D\u0130KKAT:** Bu komut sunucudaki **T\xDCM KANALLARI** ve botun silebildi\u011Fi t\xFCm rolleri geri al\u0131namaz \u015Fekilde silecektir!

E\u011Fer yeni bir AI sunucu kuracaksan\u0131z ve tertemiz bir sayfa a\xE7mak istiyorsan\u0131z a\u015Fa\u011F\u0131daki butondan onaylay\u0131n\u0131z.`
  ).setColor("#ED4245").setFooter({ text: "Nights Guard \u2022 Made by erencix \u2022 Yaln\u0131zca y\xF6neticiler onaylayabilir" });
  const row = new import_discord11.ActionRowBuilder().addComponents(
    new import_discord11.ButtonBuilder().setCustomId(`wipe_confirm:${interaction.user.id}`).setLabel("Evet, Sunucuyu Tamamen S\u0131f\u0131rla").setEmoji("\u{1F4A3}").setStyle(import_discord11.ButtonStyle.Danger),
    new import_discord11.ButtonBuilder().setCustomId("wipe_cancel").setLabel("Vazge\xE7 / \u0130ptal").setEmoji("\u{1F6E1}\uFE0F").setStyle(import_discord11.ButtonStyle.Secondary)
  );
  await interaction.reply({
    embeds: [embed],
    components: [row]
  });
}

// src/commands/yardim.ts
var import_discord12 = require("discord.js");
var data5 = new import_discord12.SlashCommandBuilder().setName("yardim").setDescription("Botun t\xFCm komutlar\u0131n\u0131, sistemlerini ve \xF6zelliklerini listeler.");
async function execute5(interaction) {
  const embed = new import_discord12.EmbedBuilder().setTitle("\u{1F6E1}\uFE0F NIGHTS GUARD \u2022 KOMUT & REHBER MERKEZ\u0130").setDescription(
    "Nights Guard; 7/24 kesintisiz sunucu g\xFCvenli\u011Fi, yapay zeka asistan\u0131, ekonomi, seviye ve moderasyon sistemi sunan geli\u015Fmi\u015F bir sunucu botudur."
  ).setColor("#8B5CF6").addFields(
    {
      name: "\u{1F465} Genel & Kullan\u0131c\u0131 Komutlar\u0131 (Herkese A\xE7\u0131k)",
      value: "\u2022 `/itiraf <mesaj>` \u2014 Sunucuya tamamen anonim ve gizli itirafta bulunur (Kimli\u011Finiz %100 sakl\u0131d\u0131r).\n\u2022 `/kullanici [kullan\u0131c\u0131]` \u2014 Detayl\u0131 sunucu profili, roller, seviye, ses s\xFCresi ve bakiye kart\u0131.\n\u2022 `/istatistik` \u2014 Botun anl\u0131k ping, RAM kullan\u0131m\u0131, uptime ve teknik sistem verileri.\n\u2022 `/gonder <kullan\u0131c\u0131> <miktar>` \u2014 Ba\u015Fka bir \xFCyeye Nights Coin transfer eder.\n\u2022 `/avatar [kullan\u0131c\u0131]` \u2014 Kendinizin veya arkada\u015F\u0131n\u0131z\u0131n 4K profil foto\u011Fraf\u0131n\u0131 & afi\u015Fini g\xF6r\xFCnt\xFCler.\n\u2022 `/sunucu` \u2014 Sunucunun detayl\u0131 \xFCye, ses, kanal ve boost istatistiklerini listeler.\n\u2022 `/afk [sebep]` \u2014 AFK moduna ge\xE7er; etiketlendi\u011Finizde neden uzakta oldu\u011Funuzu bildirir.\n\u2022 `/yardim` \u2014 Bu rehber men\xFCs\xFCn\xFC a\xE7ar.",
      inline: false
    },
    {
      name: "\u2B50 Seviye & Aktiflik Sistemi (Yaz\u0131l\u0131 Sohbet)",
      value: "\u2022 `/rank [kullan\u0131c\u0131]` veya `!rank` \u2014 Seviyenizi, XP durumunuzu ve sesli kanallardaki toplam s\xFCrenizi g\xF6r\xFCnt\xFCler.\n\u2022 `/top` veya `!top` \u2014 Sunucunun en aktif \xFCyelerini g\xF6steren Liderlik S\u0131ralamas\u0131.\n\u2022 \u{1F4AC} **Sohbet XP:** Metin kanallar\u0131nda aktif olduk\xE7a otomatik olarak **15-25 XP** kazan\u0131rs\u0131n\u0131z.",
      inline: false
    },
    {
      name: "\u{1F3B5} 384kbps Hi-Fi M\xFCzik Sistemi (YouTube & SoundCloud)",
      value: "\u2022 `/cal <\u015Fark\u0131>` veya `!cal <\u015Fark\u0131>` \u2014 YouTube veya SoundCloud par\xE7alar\u0131n\u0131 ses odas\u0131nda \xE7alar.\n\u2022 `/durdur` & `/devam` \u2014 M\xFCzi\u011Fi duraklat\u0131r veya s\xFCrd\xFCr\xFCr.\n\u2022 `/gec` \u2014 S\u0131radaki par\xE7aya atlar.\n\u2022 `/kuyruk` \u2014 \xC7alma listesindeki bekleyen par\xE7alar\u0131 listeler.\n\u2022 `/ayril` \u2014 Botu ses odas\u0131ndan \xE7\u0131kar\u0131r.\n\u2022 `/ses <1-150>` \u2014 M\xFCzik ses seviyesini ayarlar.\n\u2022 *Not: <#1568649342154182707> kanal\u0131nda interaktif butonlu m\xFCzik kumandas\u0131 mevcuttur!*",
      inline: false
    },
    {
      name: "\u{1F4B0} Ekonomi & Nights Coin Sistemi",
      value: "\u2022 `/gonder <kullan\u0131c\u0131> <miktar>` \u2014 Ba\u015Fka bir \xFCyeye Nights Coin transfer eder.\n\u2022 `!gunluk` \u2014 G\xFCnl\xFCk 500 Nights Coin hediyenizi al\u0131r.\n\u2022 `!bakiye` \u2014 Mevcut paran\u0131z\u0131 kontrol eder.\n\u2022 `!calis` \u2014 30 dakikada bir \xE7al\u0131\u015Farak para kazand\u0131r\u0131r.\n\u2022 `!cf <miktar> <yazi|tura>` \u2014 Yaz\u0131-tura bahsi oynar.\n\u2022 `!slot <miktar>` \u2014 Slot kumar makinesini \xE7evirir.",
      inline: false
    },
    {
      name: "\u{1F496} Sosyal, E\u011Flence & Evlilik Sistemi",
      value: "\u2022 `!evlen @kullan\u0131c\u0131` \u2014 Sevdi\u011Finiz ki\u015Fiye butonlu interaktif evlilik teklifi eder! \u{1F48D}\n\u2022 `!bosan` \u2014 Evlili\u011Fi resmi olarak sonland\u0131r\u0131r.\n\u2022 `!evlilik [@kullan\u0131c\u0131]` \u2014 Resmi evlilik c\xFCzdan\u0131n\u0131 ve evlilik s\xFCresini g\xF6r\xFCnt\xFCler.\n\u2022 `!saril @kullan\u0131c\u0131` \u2014 Arkada\u015F\u0131n\u0131za s\u0131ms\u0131k\u0131 sar\u0131l\u0131r (GIF).\n\u2022 `!tokat @kullan\u0131c\u0131` \u2014 Arkada\u015F\u0131n\u0131za okkal\u0131 bir tokat yap\u0131\u015Ft\u0131r\u0131r (GIF).\n\u2022 `!op @kullan\u0131c\u0131` \u2014 Arkada\u015F\u0131n\u0131za tatl\u0131 bir \xF6p\xFCc\xFCk kondurur (GIF).\n\u2022 `!kahve @kullan\u0131c\u0131` \u2014 Arkada\u015F\u0131n\u0131za s\u0131cac\u0131k bir kahve \u0131smarlar (GIF).\n\u2022 `#\u{1F4AC}\u30FBkelime-oyunu` \u2014 Otomatik kelime t\xFCretmece oyunu.",
      inline: false
    },
    {
      name: "\u{1F916} Yapay Zeka Sohbet & Muhabbet",
      value: "\u2022 `#ai-sohbet` kanal\u0131nda veya botu etiketleyerek (`@Nights Guard`) diledi\u011Finiz her \u015Feyi sorabilir, dertle\u015Febilir veya e\u011Flenceli sohbet edebilirsiniz!",
      inline: false
    },
    {
      name: "\u{1F6E1}\uFE0F Moderasyon & Y\xF6netici Komutlar\u0131",
      value: "\u2022 `/sil <miktar>` \u2014 Kanaldaki 1-100 adet mesaj\u0131 saniyeler i\xE7inde temizler.\n\u2022 `/seviye-ayarla <kullan\u0131c\u0131> <seviye>` \u2014 \xDCyenin seviyesini do\u011Frudan belirler.\n\u2022 `/mesajg\xF6nder mesaj:<metin>` \u2014 T\xFCm sunucu \xFCyelerine \xF6zelden zengin toplu duyuru (DM) iletir.\n\u2022 `/kur` & `/plan` \u2014 Yapay zeka ile otomatik sunucu mimarisi tasarlar ve kurar.\n\u2022 `/sunucu-temizle` \u2014 Sunucuyu s\u0131f\u0131rlamak i\xE7in kullan\u0131l\u0131r.",
      inline: false
    },
    {
      name: "\u{1F512} 7/24 Yerle\u015Fik G\xFCvenlik Kalkan\u0131 & Denetim Logu",
      value: "\u2022 **Ak\u0131ll\u0131 Ailevi & \u015Eahsi Hakaret Korumas\u0131:** Ailevi/\u015Fahsi a\u011F\u0131r sald\u0131r\u0131lar\u0131 an\u0131nda siler ve susturur; genel argo serbesttir.\n\u2022 **7/24 Denetim Logu:** Silinen/d\xFCzenlenen mesajlar, sesten \xE7\u0131kan/girenler `#denetim-kayd\u0131` kanal\u0131na anl\u0131k loglan\u0131r.\n\u2022 **Kelime T\xFCretmece G\xFCvenli\u011Fi:** Oyun odas\u0131ndaki k\xFCf\xFCrl\xFC kelimeleri an\u0131nda engeller.\n\u2022 **Foto\u011Fraf Kanal\u0131 Korumas\u0131:** Medya payla\u015F\u0131mlar\u0131 yaln\u0131zca yetkili medya odalar\u0131nda yap\u0131labilir.\n\u2022 **Otomatik Kay\u0131t & Bot Onay\u0131:** Kay\u0131t olanlara `\u260A ` simgesi, botlara ise an\u0131nda Bot ve Onayl\u0131 rolleri verilir.",
      inline: false
    }
  ).setFooter({ text: "\u{1F6E1}\uFE0F Nights Guard Engine \u2022 Made by erencix" }).setTimestamp();
  await interaction.reply({ embeds: [embed] });
}

// src/commands/plan.ts
var import_discord13 = require("discord.js");
var import_crypto3 = __toESM(require("crypto"));

// src/services/web/dashboardServer.ts
var import_http = __toESM(require("http"));
var DashboardServer = class _DashboardServer {
  static _activePort = 3e3;
  server;
  port;
  logoStudio;
  static getActivePort() {
    return _DashboardServer._activePort;
  }
  getPort() {
    return this.port;
  }
  constructor(port = 3e3) {
    this.port = port;
    this.logoStudio = new LogoStudio();
  }
  ensureDemoBlueprint() {
    let cached = BlueprintCache.get("demo");
    if (!cached) {
      const demoBp = SmartBlueprintGenerator.generate({
        prompt: "Valorant & Espor Championship Turnuva ve Yay\u0131n Toplulu\u011Fu",
        style: "gaming",
        locale: "tr"
      });
      const logoRes = this.logoStudio.generateProceduralLogo(demoBp.iconPrompt || "Esports Gaming Logo");
      cached = {
        id: "demo",
        userId: "demo-sandbox-user",
        guildId: "demo-sandbox-guild",
        blueprint: demoBp,
        cleanSlate: true,
        applyLogo: true,
        createdAt: Date.now(),
        logoBuffer: logoRes.buffer,
        logoDataUri: logoRes.dataUri,
        isDemo: true
      };
      BlueprintCache.set(cached);
    }
    return cached;
  }
  start() {
    return new Promise((resolve, reject) => {
      const tryListen = (attemptPort, remainingAttempts) => {
        const srv = import_http.default.createServer((req, res) => {
          const parsedUrl = new URL(req.url || "/", `http://localhost:${attemptPort}`);
          const pathname = parsedUrl.pathname;
          if (pathname === "/api/blueprints") {
            res.writeHead(200, { "Content-Type": "application/json" });
            const all = BlueprintCache.getAll ? BlueprintCache.getAll() : [];
            res.end(JSON.stringify(all));
            return;
          }
          if (pathname.startsWith("/api/blueprint/")) {
            const id = pathname.split("/")[3];
            let cached = BlueprintCache.get(id);
            if (!cached && (id === "demo" || id === "")) {
              cached = this.ensureDemoBlueprint();
            }
            if (cached) {
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify(cached.blueprint, null, 2));
            } else {
              res.writeHead(404, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Blueprint not found or expired" }));
            }
            return;
          }
          if (pathname.startsWith("/api/logo/")) {
            const id = pathname.split("/")[3];
            let cached = BlueprintCache.get(id);
            if (!cached && (id === "demo" || id === "")) {
              cached = this.ensureDemoBlueprint();
            }
            let logoBuf = cached?.logoBuffer;
            if (!logoBuf) {
              const result = this.logoStudio.generateProceduralLogo(
                cached?.blueprint?.serverName || "Discord AI Server"
              );
              logoBuf = result.buffer;
              if (cached) {
                cached.logoBuffer = logoBuf;
                cached.logoDataUri = result.dataUri;
              }
            }
            const isDownload = parsedUrl.searchParams.get("download") === "1";
            const filename = `${(cached?.blueprint?.serverName || "server").replace(/[^a-zA-Z0-9_-]/g, "_")}_logo.png`;
            const headers = {
              "Content-Type": "image/png",
              "Content-Length": logoBuf.length,
              "Cache-Control": "public, max-age=3600"
            };
            if (isDownload) {
              headers["Content-Disposition"] = `attachment; filename="${filename}"`;
            }
            res.writeHead(200, headers);
            res.end(logoBuf);
            return;
          }
          if (pathname.startsWith("/blueprint/")) {
            const id = pathname.split("/")[2];
            let cached = BlueprintCache.get(id);
            if (!cached && (id === "demo" || id === "")) {
              cached = this.ensureDemoBlueprint();
            }
            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
            res.end(this.renderHtmlPage(cached ? cached.blueprint : null, id || "demo", cached));
            return;
          }
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(this.renderHtmlPage(null));
        });
        srv.on("error", (err) => {
          if (err.code === "EADDRINUSE") {
            if (remainingAttempts > 0) {
              console.warn(`\u26A0\uFE0F [Web Dashboard] Port ${attemptPort} kullan\u0131mda, ${attemptPort + 1} portu deneniyor...`);
              tryListen(attemptPort + 1, remainingAttempts - 1);
            } else {
              console.warn(`\u26A0\uFE0F [Web Dashboard] Belirlenen port aral\u0131\u011F\u0131ndaki t\xFCm portlar kullan\u0131mda, web dashboard atlan\u0131yor.`);
              this.port = attemptPort;
              _DashboardServer._activePort = attemptPort;
              resolve(attemptPort);
            }
          } else {
            console.error("[Web Dashboard] Sunucu hatas\u0131:", err);
            reject(err);
          }
        });
        srv.listen(attemptPort, () => {
          this.server = srv;
          this.port = attemptPort;
          _DashboardServer._activePort = attemptPort;
          console.log(`\u{1F310} [Web Dashboard] Nights Guard Studio aktif: http://localhost:${attemptPort}`);
          resolve(attemptPort);
        });
      };
      tryListen(this.port, 10);
    });
  }
  stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }
  renderHtmlPage(blueprint, blueprintId, pendingBuild) {
    const title = blueprint ? `Nights Guard Studio - ${blueprint.serverName}` : "Nights Guard Web Studio \u2022 Made by erencix";
    let contentHtml = "";
    if (blueprint && blueprintId) {
      const isDemo = pendingBuild?.isDemo ?? (blueprintId === "demo" || blueprintId.includes("demo"));
      const roleBadges = blueprint.roles.map(
        (r) => `<span class="badge" style="border-left: 4px solid ${r.color || "#5865F2"};">${r.name} <small>(${r.permissions?.length || 0} yetki)</small></span>`
      ).join(" ");
      const categoryBlocks = blueprint.categories.map((cat) => {
        const channels = (cat.channels || []).map((ch) => {
          const icon = ch.type === "GUILD_VOICE" ? "\u{1F50A}" : ch.type === "GUILD_ANNOUNCEMENT" ? "\u{1F4E2}" : "\u{1F4AC}";
          const overwrites = (ch.permissionOverwrites || []).map((o) => `<span class="perm-tag">${o.roleName}: ${o.allow?.length || 0} izin</span>`).join(" ");
          return `<li class="channel-item"><span class="ch-icon">${icon}</span> <strong>${ch.name}</strong> <span class="ch-topic">${ch.topic || ""}</span><div class="overwrites">${overwrites}</div></li>`;
        }).join("");
        return `
            <div class="category-card">
              <div class="category-header">\u{1F4C1} ${cat.name} <span class="count">${cat.channels?.length || 0} kanal</span></div>
              <ul class="channel-list">${channels}</ul>
            </div>
          `;
      }).join("");
      let automodHtml = "";
      if (blueprint.automodRules && blueprint.automodRules.length > 0) {
        const rulesList = blueprint.automodRules.map(
          (r) => `<div class="automod-item">\u{1F6E1}\uFE0F <strong>${r.name}</strong> <span class="tag">${r.triggerType}</span> ${r.keywordFilter ? `<small>Kelimeler: ${r.keywordFilter.slice(0, 5).join(", ")}</small>` : ""}</div>`
        ).join("");
        automodHtml = `
          <div class="card">
            <h3>\u{1F916} AutoMod G\xFCvenlik Korumalar\u0131 (${blueprint.automodRules.length} Kural)</h3>
            <div class="automod-grid">${rulesList}</div>
          </div>
        `;
      }
      contentHtml = `
        ${isDemo ? `<div class="demo-banner">\u{1F3AE} <strong>\u0130NTERAKT\u0130F SANDBOX DEMO MODU:</strong> Discord Token veya API Anahtar\u0131 olmadan PeakBot Ak\u0131ll\u0131 \u015Eablon Motoru taraf\u0131ndan an\u0131nda olu\u015Fturuldu. T\xFCm mimariyi, izinleri ve logoyu canl\u0131 inceleyebilirsiniz!</div>` : ""}

        <div class="blueprint-view">
          <div class="card header-card">
            <div class="header-main">
              <div class="logo-preview-box">
                <img src="/api/logo/${blueprintId}" alt="Server Logo" class="server-logo-img" />
                <a href="/api/logo/${blueprintId}?download=1" class="btn btn-download">\u{1F4E5} 512x512 PNG Logoyu \u0130ndir</a>
              </div>
              <div class="header-details">
                <span class="badge-tag">${blueprint.theme.toUpperCase()}</span>
                <h2>\u{1F3DB}\uFE0F ${blueprint.serverName}</h2>
                <p class="desc">${blueprint.serverDescription}</p>
                <div class="meta-row">
                  <span class="meta-item">\u{1F310} Dil: <strong>${blueprint.locale?.toUpperCase()}</strong></span>
                  <span class="meta-item">\u{1F6E1}\uFE0F Toplam Rol: <strong>${blueprint.roles.length}</strong></span>
                  <span class="meta-item">\u{1F4C1} Kategori: <strong>${blueprint.categories.length}</strong></span>
                  <span class="meta-item">\u{1F3AB} Ticket: <strong>${blueprint.features?.ticketSystem?.enabled ? "Aktif" : "Pasif"}</strong></span>
                  <span class="meta-item">\u{1F50A} Ses Lobisi: <strong>${blueprint.features?.joinToCreate?.enabled ? "Aktif" : "Pasif"}</strong></span>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <h3>\u{1F6E1}\uFE0F Rol Hiyerar\u015Fisi (${blueprint.roles.length} Rol)</h3>
            <div class="badge-container">${roleBadges}</div>
          </div>

          <div class="card">
            <h3>\u{1F4C1} Kanal Mimarisi ve \u0130zinler (${blueprint.categories.length} Kategori)</h3>
            <div class="categories-grid">${categoryBlocks}</div>
          </div>

          ${automodHtml}

          <div class="card">
            <h3>\u{1F4CB} JSON \u015Eablon Verisi</h3>
            <pre><code>${JSON.stringify(blueprint, null, 2)}</code></pre>
          </div>
        </div>
      `;
    } else {
      const allActive = BlueprintCache.getAll();
      let activeBlueprintsHtml = "";
      if (allActive.length > 0) {
        const items = allActive.map(
          (item) => `
          <div class="blueprint-item-row">
            <div class="bp-info">
              <strong>${item.blueprint.serverName}</strong>
              <span>Tema: ${item.blueprint.theme} | ${item.blueprint.roles.length} Rol | ${item.blueprint.categories.length} Kategori</span>
            </div>
            <a href="/blueprint/${item.id}" class="btn btn-primary">\u0130ncele \u2794</a>
          </div>
        `
        ).join("");
        activeBlueprintsHtml = `
          <div class="card" style="margin-top: 30px; text-align: left;">
            <h3>\u{1F4CB} Aktif Bellek \u015Eablonlar\u0131 (${allActive.length})</h3>
            <div class="blueprint-list">${items}</div>
          </div>
        `;
      }
      contentHtml = `
        <div class="hero">
          <h1>\u{1F6E1}\uFE0F Nights Guard Web Studio</h1>
          <p>Made by erencix \u2022 PeakBot Engine Yapay Zeka Destekli Discord Sunucu Mimarisi & Koruma Sistemi</p>
          <div class="stats-grid">
            <div class="stat-box">
              <div class="stat-num">100%</div>
              <div class="stat-lbl">Otomatik \u0130n\u015Faat</div>
            </div>
            <div class="stat-box">
              <div class="stat-num">512x512</div>
              <div class="stat-lbl">PNG Vekt\xF6r Logo</div>
            </div>
            <div class="stat-box">
              <div class="stat-num">AutoMod</div>
              <div class="stat-lbl">Yerel G\xFCvenlik</div>
            </div>
            <div class="stat-box">
              <div class="stat-num">v1.2.0</div>
              <div class="stat-lbl">Motor Versiyonu</div>
            </div>
          </div>

          <div style="margin-top: 25px;">
            <a href="/blueprint/demo" class="btn btn-large">\u{1F3AE} Sandbox Demo Mimarisine Git</a>
          </div>

          ${activeBlueprintsHtml}

          <div class="card" style="margin-top: 30px; text-align: left;">
            <h3>\u26A1 Aktif Slash Komutlar\u0131</h3>
            <ul>
              <li><code>/ai-kur</code> \u2014 Do\u011Fal dilde sunucu in\u015Faat\u0131 ve onay paneli</li>
              <li><code>/plan</code> \u2014 PeakBot mimari planlay\u0131c\u0131 ve \xF6nizleme st\xFCdyosu</li>
              <li><code>/ai-logo</code> \u2014 512x512 AI sunucu logosu \xFCreticisi</li>
              <li><code>/ai-onizle</code> \u2014 Dry-run sunucu \u015Femas\u0131 ve izin kontrol\xFC</li>
              <li><code>/boost</code> \u2014 Sunucu takviye (boost) \xF6d\xFClleri ve kar\u015F\u0131lama y\xF6neticisi</li>
              <li><code>/teamwork</code> \u2014 Yetkili ekibi, ticket sorumlular\u0131 ve koordinasyon merkezi</li>
              <li><code>/browser</code> \u2014 Bu web st\xFCdyosuna h\u0131zl\u0131 eri\u015Fim</li>
              <li><code>/sunucu-temizle</code> \u2014 G\xFCvenli sunucu s\u0131f\u0131rlama (Clean Slate)</li>
            </ul>
          </div>
        </div>
      `;
    }
    return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #0f111a;
      color: #e2e8f0;
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
      line-height: 1.6;
      padding: 30px 20px;
    }
    .container { max-width: 1100px; margin: 0 auto; }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 20px;
      border-bottom: 1px solid #1e2235;
      margin-bottom: 24px;
    }
    .logo-area { display: flex; align-items: center; gap: 12px; }
    .logo-icon { font-size: 28px; }
    .logo-title { font-size: 20px; font-weight: 700; color: #5865F2; }
    .nav-links { display: flex; gap: 12px; align-items: center; }
    .nav-links a { color: #94a3b8; text-decoration: none; font-size: 14px; padding: 6px 12px; border-radius: 6px; }
    .nav-links a:hover { background: #1e2235; color: #fff; }
    .badge-status {
      background: #2ecc7122;
      color: #2ecc71;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 13px;
      border: 1px solid #2ecc7155;
    }
    .demo-banner {
      background: linear-gradient(90deg, #5865F2 0%, #8b5cf6 100%);
      color: #fff;
      padding: 14px 20px;
      border-radius: 10px;
      margin-bottom: 24px;
      font-size: 15px;
      box-shadow: 0 4px 15px rgba(88, 101, 242, 0.4);
    }
    .card {
      background: #181b29;
      border: 1px solid #262a40;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    .header-card { padding: 24px; }
    .header-main { display: flex; gap: 24px; align-items: flex-start; }
    @media (max-width: 768px) {
      .header-main { flex-direction: column; align-items: center; text-align: center; }
      .meta-row { justify-content: center; }
    }
    .logo-preview-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      min-width: 160px;
    }
    .server-logo-img {
      width: 140px;
      height: 140px;
      border-radius: 24px;
      border: 3px solid #5865F2;
      box-shadow: 0 8px 24px rgba(88, 101, 242, 0.35);
      object-fit: cover;
    }
    .header-details { flex: 1; }
    .badge-tag {
      background: #5865f233;
      color: #5865f2;
      padding: 3px 10px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    h1 { font-size: 28px; margin-bottom: 12px; color: #fff; }
    h2 { font-size: 24px; margin: 8px 0; color: #fff; }
    h3 { font-size: 17px; margin-bottom: 16px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
    .desc { font-size: 15px; color: #94a3b8; margin-bottom: 16px; }
    .meta-row { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 12px; }
    .meta-item { background: #202438; padding: 6px 14px; border-radius: 8px; font-size: 14px; border: 1px solid #2d334d; }
    .badge-container { display: flex; flex-wrap: wrap; gap: 10px; }
    .badge {
      background: #202438;
      padding: 6px 14px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      border: 1px solid #2d334d;
    }
    .badge small { color: #94a3b8; font-weight: normal; margin-left: 4px; }
    .categories-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
    .category-card { background: #121420; border: 1px solid #262a40; border-radius: 8px; overflow: hidden; }
    .category-header {
      background: #1e2235;
      padding: 10px 16px;
      font-weight: 700;
      font-size: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .category-header .count { font-size: 12px; color: #94a3b8; }
    .channel-list { list-style: none; padding: 10px 16px; }
    .channel-item {
      padding: 8px 0;
      border-bottom: 1px solid #1a1e30;
      font-size: 14px;
    }
    .channel-item:last-child { border-bottom: none; }
    .ch-icon { margin-right: 6px; }
    .ch-topic { font-size: 12px; color: #64748b; margin-left: 8px; display: block; }
    .overwrites { margin-top: 4px; }
    .perm-tag {
      display: inline-block;
      background: #2a2f4a;
      color: #cbd5e1;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
      margin-right: 4px;
    }
    .automod-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
    .automod-item { background: #121420; padding: 12px 16px; border-radius: 8px; border: 1px solid #262a40; font-size: 14px; }
    .automod-item .tag { background: #eab30822; color: #eab308; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 600; margin-left: 6px; }
    .automod-item small { display: block; color: #94a3b8; margin-top: 4px; font-size: 12px; }
    pre {
      background: #0d0f17;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      max-height: 400px;
      font-size: 13px;
      color: #38bdf8;
      border: 1px solid #1e2235;
    }
    .hero { text-align: center; padding: 40px 20px; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-top: 30px;
    }
    .stat-box {
      background: #181b29;
      border: 1px solid #262a40;
      padding: 20px;
      border-radius: 12px;
      text-align: center;
    }
    .stat-num { font-size: 28px; font-weight: 800; color: #5865F2; margin-bottom: 4px; }
    .stat-lbl { font-size: 13px; color: #94a3b8; }
    .btn {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 8px;
      text-decoration: none;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }
    .btn-primary { background: #5865F2; color: #fff; }
    .btn-primary:hover { background: #4752c4; }
    .btn-download { background: #2ecc71; color: #fff; font-size: 12px; padding: 6px 12px; border-radius: 6px; }
    .btn-download:hover { background: #27ae60; }
    .btn-large { background: #5865F2; color: #fff; font-size: 16px; padding: 12px 28px; border-radius: 10px; font-weight: 700; box-shadow: 0 4px 15px rgba(88, 101, 242, 0.4); }
    .btn-large:hover { background: #4752c4; }
    .blueprint-list { display: flex; flex-direction: column; gap: 10px; }
    .blueprint-item-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #121420;
      padding: 14px 18px;
      border-radius: 8px;
      border: 1px solid #262a40;
    }
    .bp-info strong { display: block; font-size: 15px; color: #fff; }
    .bp-info span { font-size: 13px; color: #94a3b8; }
    code { background: #202438; color: #38bdf8; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
    ul { margin-left: 20px; }
    li { margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="logo-area">
        <span class="logo-icon">\u{1F6E1}\uFE0F</span>
        <span class="logo-title">Nights Guard Studio \u2022 Made by erencix (PeakBot Engine)</span>
      </div>
      <div class="nav-links">
        <a href="/">Ana Sayfa</a>
        <a href="/blueprint/demo">Demo Mimarisi</a>
        <div class="badge-status">\u25CF Sistem \xC7evrimi\xE7i</div>
      </div>
    </header>
    ${contentHtml}
  </div>
</body>
</html>`;
  }
};

// src/commands/plan.ts
var data6 = new import_discord13.SlashCommandBuilder().setName("plan").setDescription("Nights Guard Mimari Planlay\u0131c\u0131: Sunucu \u015Femas\u0131n\u0131 ve izin haritas\u0131n\u0131 planlar.").setDefaultMemberPermissions(import_discord13.PermissionFlagsBits.Administrator).addStringOption(
  (opt) => opt.setName("istek").setDescription("Planlamak istedi\u011Finiz topluluk veya sunucu yap\u0131s\u0131").setRequired(true)
).addStringOption(
  (opt) => opt.setName("stil").setDescription("Tasar\u0131m tarz\u0131").addChoices(
    { name: "Modern & Estetik", value: "modern" },
    { name: "Minimalist & Sade", value: "minimalist" },
    { name: "Gaming / Oyun", value: "gaming" },
    { name: "Anime / RP", value: "anime" },
    { name: "Kurumsal / Profesyonel", value: "professional" }
  )
).addStringOption(
  (opt) => opt.setName("dil").setDescription("Dil se\xE7ene\u011Fi").addChoices(
    { name: "T\xFCrk\xE7e (TR)", value: "tr" },
    { name: "English (EN)", value: "en" }
  )
);
async function execute6(interaction, aiManager) {
  await interaction.deferReply();
  const prompt = interaction.options.getString("istek", true);
  const style = interaction.options.getString("stil") || "modern";
  const locale = interaction.options.getString("dil") || "tr";
  await interaction.editReply({
    content: `\u{1F4D0} **Nights Guard Planlama Motoru \xC7al\u0131\u015F\u0131yor...**
> Planlanan \u0130stek: *"${prompt}"*
> Stil: \`${style}\` | Dil: \`${locale.toUpperCase()}\`
L\xFCtfen bekleyin, mimari a\u011Fa\xE7 ve izin \u015Femas\u0131 \xE7\u0131kar\u0131l\u0131yor...`
  });
  try {
    const { blueprint, source } = await aiManager.generateBlueprint({
      prompt,
      style,
      locale
    });
    const cacheId = import_crypto3.default.randomBytes(6).toString("hex");
    const guildId = interaction.guildId || "dm";
    BlueprintCache.set({
      id: cacheId,
      userId: interaction.user.id,
      guildId,
      blueprint,
      cleanSlate: false,
      applyLogo: true,
      createdAt: Date.now()
    });
    let totalChannels = 0;
    let channelBreakdown = "";
    for (const cat of blueprint.categories) {
      const count = cat.channels?.length || 0;
      totalChannels += count;
      channelBreakdown += `\u2022 **${cat.name}** (${count} kanal)
`;
    }
    const port = DashboardServer.getActivePort() || parseInt(process.env.PORT || "3000", 10);
    const dashboardUrl = `http://localhost:${port}/blueprint/${cacheId}`;
    const planEmbed = new import_discord13.EmbedBuilder().setTitle(`\u{1F4D0} Nights Guard Mimari Plan\u0131: ${blueprint.serverName}`).setDescription(
      `**Tema:** ${blueprint.theme}
**A\xE7\u0131klama:** ${blueprint.serverDescription}
**AI Motoru:** \`${source.toUpperCase()}\``
    ).setColor("#5865F2").addFields(
      {
        name: "\u{1F6E1}\uFE0F Rol Hiyerar\u015Fisi (" + blueprint.roles.length + " Rol)",
        value: blueprint.roles.map((r) => `\u2022 \`${r.name}\` (${r.color || "#99AAB5"})`).join("\n").slice(0, 1024),
        inline: true
      },
      {
        name: "\u{1F4C1} Kategori Da\u011F\u0131l\u0131m\u0131 (" + blueprint.categories.length + " Kategori / " + totalChannels + " Kanal)",
        value: channelBreakdown.slice(0, 1024) || "Kanal bulunmuyor",
        inline: true
      },
      {
        name: "\u{1F916} Koruma ve Entegrasyonlar",
        value: `\u2022 **AutoMod Kurallar\u0131:** ${blueprint.automodRules?.length || 0} Adet
\u2022 **Ticket Sistemi:** ${blueprint.features?.ticketSystem?.enabled ? "\u2705 Aktif" : "\u274C Pasif"}
\u2022 **Join-to-Create:** ${blueprint.features?.joinToCreate?.enabled ? "\u2705 Aktif" : "\u274C Pasif"}
\u2022 **Web \xD6nizleme:** [Taray\u0131c\u0131da \u0130ncele](${dashboardUrl})`,
        inline: false
      }
    ).setFooter({ text: "Nights Guard \u2022 Made by erencix" }).setTimestamp();
    const row = new import_discord13.ActionRowBuilder().addComponents(
      new import_discord13.ButtonBuilder().setCustomId(`build_confirm:${cacheId}`).setLabel("Bu Plan\u0131 \u0130n\u015Fa Et").setEmoji("\u{1F680}").setStyle(import_discord13.ButtonStyle.Success),
      new import_discord13.ButtonBuilder().setCustomId(`build_details:${cacheId}`).setLabel("JSON Plan\u0131n\u0131 G\xF6r").setEmoji("\u{1F4CB}").setStyle(import_discord13.ButtonStyle.Secondary),
      new import_discord13.ButtonBuilder().setURL(dashboardUrl).setLabel("Web Taray\u0131c\u0131s\u0131nda A\xE7").setEmoji("\u{1F310}").setStyle(import_discord13.ButtonStyle.Link)
    );
    await interaction.editReply({
      content: "",
      embeds: [planEmbed],
      components: [row]
    });
  } catch (err) {
    console.error("[plan] Hatas\u0131:", err);
    await interaction.editReply({
      content: `\u274C Plan olu\u015Fturulamad\u0131: ${err.message}`
    });
  }
}

// src/commands/boost.ts
var import_discord14 = require("discord.js");
var data7 = new import_discord14.SlashCommandBuilder().setName("boost").setDescription("Sunucu boost seviyesi, ayr\u0131cal\u0131klar ve \xF6d\xFCl y\xF6netimini g\xF6sterir.").setDefaultMemberPermissions(import_discord14.PermissionFlagsBits.Administrator).addSubcommand(
  (sub) => sub.setName("durum").setDescription("Sunucunun boost seviyesini ve avantajlar\u0131n\u0131 g\xF6sterir.")
).addSubcommand(
  (sub) => sub.setName("ayricaliklar").setDescription("Booster \xFCyelerine \xF6zel ayr\u0131cal\u0131k listesini g\xF6sterir.")
);
async function execute7(interaction) {
  const { guild } = interaction;
  if (!guild) {
    await interaction.reply({ content: "Bu komut sadece sunucularda \xE7al\u0131\u015F\u0131r.", ephemeral: true });
    return;
  }
  const subcommand = interaction.options.getSubcommand() || "durum";
  const boostCount = guild.premiumSubscriptionCount || 0;
  const boostTier = guild.premiumTier;
  let tierName = "Seviye Yok";
  let nextTierNeeded = 2 - boostCount;
  if (boostTier === 1) {
    tierName = "Seviye 1 \u{1F31F}";
    nextTierNeeded = 7 - boostCount;
  } else if (boostTier === 2) {
    tierName = "Seviye 2 \u{1F680}";
    nextTierNeeded = 14 - boostCount;
  } else if (boostTier === 3) {
    tierName = "Seviye 3 \u{1F48E} (Maksimum)";
    nextTierNeeded = 0;
  }
  if (subcommand === "durum") {
    const embed = new import_discord14.EmbedBuilder().setTitle(`\u{1F680} Nights Guard Boost Merkezi: ${guild.name}`).setDescription("Sunucunuza takviye basan \xFCyeler i\xE7in otomatik \xF6d\xFCller ve avantajlar devrededir.").setColor("#F47FFF").addFields(
      {
        name: "\u{1F4CA} Takviye Seviyesi",
        value: `**${tierName}**
Toplam Takviye: **${boostCount} Boost**`,
        inline: true
      },
      {
        name: "\u{1F3AF} Sonraki Hedef",
        value: nextTierNeeded > 0 ? `**${nextTierNeeded} boost** daha gerekiyor` : "T\xFCm seviyeler a\xE7\u0131ld\u0131! \u{1F389}",
        inline: true
      },
      {
        name: "\u{1F48E} Aktif Booster Ayr\u0131cal\u0131klar\u0131",
        value: "\u2022 **\xD6zel Booster Rol\xFC & \u0130konu**\n\u2022 **\xD6zel Booster VIP Ses & Metin Odas\u0131 Eri\u015Fimi**\n\u2022 **Sohbette Harici Emoji & Hareketli \xC7\u0131kartma Kullan\u0131m\u0131**\n\u2022 **Y\xFCksek Bitrate (128 - 384 kbps) Ses Kalitesi**\n\u2022 **Otomatik Te\u015Fekk\xFCr & Ho\u015F Geldin Mesaj\u0131**",
        inline: false
      }
    ).setFooter({ text: "Nights Guard \u2022 Made by erencix" }).setTimestamp();
    await interaction.reply({ embeds: [embed] });
    return;
  }
  if (subcommand === "ayricaliklar") {
    const embed = new import_discord14.EmbedBuilder().setTitle("\u{1F31F} Nights Guard Booster \xD6zel Ayr\u0131cal\u0131k Y\xF6netimi").setDescription(
      "Sunucuya takviye bas\u0131ld\u0131\u011F\u0131nda tetiklenecek otomatik roller ve \xF6zel kanal izinleri:\n\n1. **Booster Rol\xFC:** `@Server Booster` rol\xFCne sahip kullan\u0131c\u0131lara otomatik renk se\xE7imi ve GIF izinleri verilir.\n2. **Booster Lounge:** Sadece boosterlar\u0131n eri\u015Febildi\u011Fi gizli sohbet alan\u0131.\n3. **\xD6ncelikli S\u0131ra:** Botun `/kur` ve `/logo` komutlar\u0131nda boosterlar \xF6ncelikli kuyrukta i\u015Flenir."
    ).setColor("#9B59B6").setFooter({ text: "Nights Guard \u2022 Made by erencix" });
    await interaction.reply({ embeds: [embed] });
  }
}

// src/commands/teamwork.ts
var import_discord15 = require("discord.js");
var data8 = new import_discord15.SlashCommandBuilder().setName("teamwork").setDescription("Yetkili ekip koordinasyonu, g\xF6revler ve moderasyon paneli.").setDefaultMemberPermissions(import_discord15.PermissionFlagsBits.Administrator).addSubcommand(
  (sub) => sub.setName("kadro").setDescription("Sunucu y\xF6netim ekibini ve g\xF6rev da\u011F\u0131l\u0131m\u0131n\u0131 g\xF6sterir.")
).addSubcommand(
  (sub) => sub.setName("gorevler").setDescription("Yetkili ekibi i\xE7in moderasyon durumunu listeler.")
);
async function execute8(interaction) {
  const { guild } = interaction;
  if (!guild) {
    await interaction.reply({ content: "Bu komut sadece sunucularda \xE7al\u0131\u015F\u0131r.", ephemeral: true });
    return;
  }
  const subcommand = interaction.options.getSubcommand() || "kadro";
  if (subcommand === "kadro") {
    const roles = guild.roles.cache;
    const adminRoles = roles.filter((r) => r.permissions.has(import_discord15.PermissionFlagsBits.Administrator) && !r.managed);
    const modRoles = roles.filter(
      (r) => r.permissions.has(import_discord15.PermissionFlagsBits.ManageMessages) && !r.permissions.has(import_discord15.PermissionFlagsBits.Administrator) && !r.managed
    );
    const embed = new import_discord15.EmbedBuilder().setTitle(`\u{1F6E1}\uFE0F Nights Guard Teamwork: ${guild.name} Y\xF6netim Kadrosu`).setDescription("Sunucuda g\xF6rev alan yetkili gruplar\u0131 ve hiyerar\u015Fik da\u011F\u0131l\u0131m:").setColor("#2ECC71").addFields(
      {
        name: "\u{1F451} \xDCst Y\xF6netim Rolleri",
        value: adminRoles.map((r) => `\u2022 <@&${r.id}> (${r.members.size} \xDCye)`).join("\n") || "Tan\u0131ml\u0131 rol yok",
        inline: false
      },
      {
        name: "\u{1F6E1}\uFE0F Moderasyon & Destek Ekibi",
        value: modRoles.map((r) => `\u2022 <@&${r.id}> (${r.members.size} \xDCye)`).join("\n") || "Tan\u0131ml\u0131 rol yok",
        inline: false
      },
      {
        name: "\u{1F91D} Teamwork Koordinasyon Ara\xE7lar\u0131",
        value: "\u2022 **Ticket Atamalar\u0131:** Butonla a\xE7\u0131lan destek talepleri otomatik moderat\xF6r rol\xFCne etiketlenir.\n\u2022 **AutoMod Kay\u0131tlar\u0131:** K\xFCf\xFCr ve spam ihlalleri `#mod-log` kanal\u0131na anl\u0131k aktar\u0131l\u0131r.\n\u2022 **Sesli Toplant\u0131:** Y\xF6netici ses odas\u0131 sadece yetkililerin eri\u015Fimine a\xE7\u0131kt\u0131r.",
        inline: false
      }
    ).setFooter({ text: "Nights Guard \u2022 Made by erencix" }).setTimestamp();
    await interaction.reply({ embeds: [embed] });
    return;
  }
  if (subcommand === "gorevler") {
    const embed = new import_discord15.EmbedBuilder().setTitle("\u{1F4CB} Nights Guard Teamwork: G\xF6rev & Destek Panosu").setDescription("Ekip \xFCyelerinin dikkat etmesi gereken aktif g\xF6revler:").setColor("#3498DB").addFields(
      {
        name: "\u{1F3AB} Destek Talepleri (Tickets)",
        value: "\u2022 Yeni a\xE7\u0131lan taleplere ortalama yan\u0131t s\xFCresi hedefi: **< 15 dakika**\n\u2022 \xC7\xF6z\xFClen talepleri `[Talebi Kapat]` butonuyla ar\u015Fivleyin.",
        inline: false
      },
      {
        name: "\u{1F6E1}\uFE0F G\xFCvenlik & AutoMod \u0130hlalleri",
        value: "\u2022 \u015E\xFCpheli link veya spam alg\u0131land\u0131\u011F\u0131nda kullan\u0131c\u0131y\u0131 inceleyip gerekirse zaman a\u015F\u0131m\u0131 (Timeout) uygulay\u0131n.",
        inline: false
      },
      {
        name: "\u{1F31F} Topluluk Kar\u015F\u0131lama",
        value: "\u2022 `#hos-geldiniz` kanal\u0131nda yeni kat\u0131lan \xFCyelere rehberlik edin.",
        inline: false
      }
    ).setFooter({ text: "Nights Guard \u2022 Made by erencix" });
    await interaction.reply({ embeds: [embed] });
  }
}

// src/commands/browser.ts
var import_discord16 = require("discord.js");
var data9 = new import_discord16.SlashCommandBuilder().setName("browser").setDescription("Sunucu mimarisini web taray\u0131c\u0131s\u0131nda interaktif g\xF6r\xFCnt\xFCler.").setDefaultMemberPermissions(import_discord16.PermissionFlagsBits.Administrator);
async function execute9(interaction) {
  const port = DashboardServer.getActivePort() || parseInt(process.env.PORT || "3000", 10);
  const baseUrl = `http://localhost:${port}`;
  const guildId = interaction.guildId || "";
  const latestBlueprint = BlueprintCache.getLatestByGuild(guildId);
  const targetUrl = latestBlueprint ? `${baseUrl}/blueprint/${latestBlueprint.id}` : baseUrl;
  const embed = new import_discord16.EmbedBuilder().setTitle("\u{1F310} Nights Guard Web Companion Studio").setDescription(
    "Nights Guard mimari planlar\u0131n\u0131, kanal hiyerar\u015Fisini, rol izin matrisini ve AutoMod kurallar\u0131n\u0131 do\u011Frudan web taray\u0131c\u0131n\u0131zda interaktif olarak inceleyin!"
  ).setColor("#5865F2").addFields(
    {
      name: "\u{1F5A5}\uFE0F Web Dashboard URL",
      value: `[\`${targetUrl}\`](${targetUrl})`,
      inline: false
    },
    {
      name: "\u2728 Taray\u0131c\u0131 \xD6zellikleri",
      value: "\u2022 **G\xF6rsel Sunucu A\u011Fac\u0131:** Kategoriler, kanallar ve \xF6zel izin kilitleri\n\u2022 **Rol Hiyerar\u015Fisi:** Renkler, hoisted roller ve yetki saya\xE7lar\u0131\n\u2022 **JSON D\u0131\u015Fa Aktarma:** Tek t\u0131kla blueprint kopyalama ve yedekleme\n\u2022 **Canl\u0131 Sistem Durumu:** Bot sa\u011Fl\u0131\u011F\u0131, bellek kullan\u0131m\u0131 ve gecikme de\u011Ferleri",
      inline: false
    }
  ).setFooter({ text: "Nights Guard \u2022 Made by erencix" }).setTimestamp();
  const row = new import_discord16.ActionRowBuilder().addComponents(
    new import_discord16.ButtonBuilder().setURL(targetUrl).setLabel("Web Taray\u0131c\u0131s\u0131nda A\xE7").setEmoji("\u{1F310}").setStyle(import_discord16.ButtonStyle.Link)
  );
  await interaction.reply({
    embeds: [embed],
    components: [row]
  });
}

// src/commands/davet.ts
var import_discord17 = require("discord.js");
var data10 = new import_discord17.SlashCommandBuilder().setName("davet").setDescription("Botun resmi sunucu davet ba\u011Flant\u0131s\u0131n\u0131 ve yetki k\u0131lavuzunu g\xF6r\xFCnt\xFCler.").setDefaultMemberPermissions(import_discord17.PermissionFlagsBits.Administrator);
async function execute10(interaction) {
  const clientId = interaction.client.user?.id || "1568616946545467503";
  const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands`;
  const embed = new import_discord17.EmbedBuilder().setTitle("\u{1F6E1}\uFE0F Nights Guard - Resmi Sunucu Davet Ba\u011Flant\u0131s\u0131").setDescription(
    "**Nights Guard** botunu kendi sunucunuza eklemek ve yapay zeka destekli mimari, rol, izin ve AutoMod sistemini kullanmak i\xE7in a\u015Fa\u011F\u0131daki butona t\u0131klayabilirsiniz."
  ).setColor("#5865F2").addFields(
    {
      name: "\u{1F517} H\u0131zl\u0131 Davet Linki",
      value: `[**Sunucuna Eklemek \u0130\xE7in Buraya T\u0131kla**](${inviteUrl})`,
      inline: false
    },
    {
      name: "\u2699\uFE0F Tavsiye Edilen \u0130zinler",
      value: "\u2022 **Y\xF6netici (Administrator):** Kanallar\u0131, rolleri, izin matrislerini ve AutoMod korumas\u0131n\u0131 kurabilmesi i\xE7in gereklidir.",
      inline: true
    },
    {
      name: "\u{1F512} G\xFCvenlik & Kilit Durumu",
      value: "\u2022 Bu bot \xF6zel yap\u0131land\u0131r\u0131lm\u0131\u015Ft\u0131r. Yaln\u0131zca bot sahibi (<@1138498666785677492>) komutlar\u0131 tetikleyebilir.",
      inline: true
    }
  ).setFooter({ text: "Nights Guard \u2022 Made by erencix" }).setTimestamp();
  const row = new import_discord17.ActionRowBuilder().addComponents(
    new import_discord17.ButtonBuilder().setLabel("\u{1F680} Nights Guard'\u0131 Sunucuna Ekle").setStyle(import_discord17.ButtonStyle.Link).setURL(inviteUrl).setEmoji("\u{1F6E1}\uFE0F")
  );
  await interaction.reply({
    embeds: [embed],
    components: [row]
  });
}

// src/commands/mesajGonder.ts
var import_discord18 = require("discord.js");
var data11 = new import_discord18.SlashCommandBuilder().setName("mesajg\xF6nder").setDescription("Sunucudaki \xFCyelere \xF6zel mesaj (DM) ile resmi topluluk duyurusu g\xF6nderir.").setDefaultMemberPermissions(import_discord18.PermissionFlagsBits.Administrator).addStringOption(
  (opt) => opt.setName("mesaj").setDescription("G\xF6nderilecek duyuru metni").setRequired(true)
).addStringOption(
  (opt) => opt.setName("baslik").setDescription("Duyuru ba\u015Fl\u0131\u011F\u0131 (Varsay\u0131lan: \u{1F4E2} NIGHTS TOPLULUK DUYURUSU)").setRequired(false)
).addRoleOption(
  (opt) => opt.setName("hedef_rol").setDescription("Yaln\u0131zca bu role sahip olanlara g\xF6nder (Bo\u015Fsa herkese gider)").setRequired(false)
);
var aliasData = new import_discord18.SlashCommandBuilder().setName("mesajgonder").setDescription("Sunucudaki \xFCyelere \xF6zel mesaj (DM) ile resmi topluluk duyurusu g\xF6nderir.").setDefaultMemberPermissions(import_discord18.PermissionFlagsBits.Administrator).addStringOption(
  (opt) => opt.setName("mesaj").setDescription("G\xF6nderilecek duyuru metni").setRequired(true)
).addStringOption(
  (opt) => opt.setName("baslik").setDescription("Duyuru ba\u015Fl\u0131\u011F\u0131 (Varsay\u0131lan: \u{1F4E2} NIGHTS TOPLULUK DUYURUSU)").setRequired(false)
).addRoleOption(
  (opt) => opt.setName("hedef_rol").setDescription("Yaln\u0131zca bu role sahip olanlara g\xF6nder (Bo\u015Fsa herkese gider)").setRequired(false)
);
async function execute11(interaction) {
  const { guild, member, user } = interaction;
  if (!guild) {
    await interaction.reply({ content: "Bu komut sadece sunucularda kullan\u0131labilir.", ephemeral: true });
    return;
  }
  const ownerId = config.ownerId || "1138498666785677492";
  const isOwner = user.id === ownerId;
  const isAdmin = member?.permissions?.has(import_discord18.PermissionFlagsBits.Administrator);
  if (!isOwner && !isAdmin) {
    await interaction.reply({
      content: "\u26D4 **Eri\u015Fim Engellendi:** Bu komut yaln\u0131zca sunucu kurucusu veya y\xF6neticiler taraf\u0131ndan kullan\u0131labilir!",
      ephemeral: true
    });
    return;
  }
  await interaction.deferReply({ ephemeral: true });
  const rawMessage = interaction.options.getString("mesaj", true);
  const title = interaction.options.getString("baslik") || "\u{1F4E2} NIGHTS TOPLULUK DUYURUSU";
  const targetRole = interaction.options.getRole("hedef_rol");
  await interaction.editReply({
    content: "\u{1F50D} **\xDCye listesi taran\u0131yor...** L\xFCtfen bekleyin."
  });
  const allMembers = await guild.members.fetch();
  let candidates = Array.from(allMembers.values()).filter((m) => !m.user.bot);
  if (targetRole) {
    candidates = candidates.filter((m) => m.roles.cache.has(targetRole.id));
  }
  if (candidates.length === 0) {
    await interaction.editReply({
      content: "\u26A0\uFE0F Belirtilen kriterlere uygun mesaj g\xF6nderilecek \xFCye bulunamad\u0131."
    });
    return;
  }
  await interaction.editReply({
    content: `\u23F3 **Toplu DM G\xF6nderimi Ba\u015Flat\u0131ld\u0131!**
\u2022 Hedef \xDCye Say\u0131s\u0131: **${candidates.length}**
\u2022 Hedef Kitle: **${targetRole ? `<@&${targetRole.id}>` : "T\xFCm Sunucu \xDCyeleri"}**
\u2022 G\xFCvenlik Korumas\u0131: *Discord Rate Limit korumas\u0131 i\xE7in mesajlar s\u0131ral\u0131 iletiliyor...*`
  });
  const dmEmbed = new import_discord18.EmbedBuilder().setTitle(title).setDescription(rawMessage).setColor("#8B5CF6").setThumbnail(guild.iconURL({ size: 256 }) || user.displayAvatarURL()).addFields(
    {
      name: "\u{1F451} Duyuruyu G\xF6nderen",
      value: `<@${user.id}> (${member.displayName})`,
      inline: true
    },
    {
      name: "\u{1F310} Sunucu",
      value: `**${guild.name}**`,
      inline: true
    }
  ).setImage("https://media.giphy.com/media/EPfV3ijMQVl60/giphy.gif").setFooter({ text: "Nights Community Official Broadcast Engine \u2022 Made by erencix" }).setTimestamp();
  let successCount = 0;
  let failedCount = 0;
  const startTime = Date.now();
  for (let i = 0; i < candidates.length; i++) {
    const target = candidates[i];
    try {
      await target.send({ embeds: [dmEmbed] });
      successCount++;
    } catch (dmErr) {
      failedCount++;
    }
    if ((i + 1) % 5 === 0 || i === candidates.length - 1) {
      const progressPercent = Math.round((i + 1) / candidates.length * 100);
      await interaction.editReply({
        content: `\u23F3 **Toplu DM G\xF6nderimi Devam Ediyor...** (${progressPercent}%)
\u2022 \u0130lerleyen: **${i + 1} / ${candidates.length}**
\u2022 \u2705 Ba\u015Far\u0131l\u0131 \u0130letilen: **${successCount}**
\u2022 \u274C DM Kapal\u0131 / \u0130letilemeyen: **${failedCount}**`
      }).catch(() => {
      });
    }
    if (i < candidates.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }
  }
  const durationSec = Math.round((Date.now() - startTime) / 1e3);
  const reportEmbed = new import_discord18.EmbedBuilder().setTitle("\u2705 Toplu DM G\xF6nderimi Tamamland\u0131!").setDescription(
    `Topluluk duyurusu hedeflenen \xFCyelere ba\u015Far\u0131yla iletildi.

**\u{1F4CA} Detayl\u0131 \u0130statistikler:**
\u2022 \u{1F3AF} Toplam Hedef \xDCye: **${candidates.length}**
\u2022 \u2705 Ba\u015Far\u0131yla Ula\u015Fan: **${successCount} \xDCye**
\u2022 \u{1F6AB} DM'si Kapal\u0131 Olan: **${failedCount} \xDCye** *(Gizlilik ayarlar\u0131 nedeniyle engelli)*
\u2022 \u23F1\uFE0F Toplam S\xFCre: **${durationSec} saniye**
\u2022 \u{1F3F7}\uFE0F Hedef Rol: **${targetRole ? `<@&${targetRole.id}>` : "Herkes"}**`
  ).setColor("#2ECC71").setFooter({ text: "Nights Broadcast Center" }).setTimestamp();
  await interaction.editReply({
    content: "\u{1F389} **Duyuru ba\u015Far\u0131yla da\u011F\u0131t\u0131ld\u0131!**",
    embeds: [reportEmbed]
  });
}

// src/commands/seviye.ts
var import_discord20 = require("discord.js");

// src/services/features/levelManager.ts
var import_discord19 = require("discord.js");

// src/services/storage/persistentStore.ts
var import_fs2 = __toESM(require("fs"));
var import_path2 = __toESM(require("path"));
var PersistentStore = class {
  static dataDir = import_path2.default.resolve(process.cwd(), "data");
  static backupDir = import_path2.default.resolve(process.cwd(), "data/backups");
  static flushHandlers = /* @__PURE__ */ new Map();
  static initialized = false;
  static flushTimer = null;
  static init() {
    if (this.initialized) return;
    this.initialized = true;
    try {
      if (!import_fs2.default.existsSync(this.dataDir)) {
        import_fs2.default.mkdirSync(this.dataDir, { recursive: true });
      }
      if (!import_fs2.default.existsSync(this.backupDir)) {
        import_fs2.default.mkdirSync(this.backupDir, { recursive: true });
      }
      console.log(`[PersistentStore] \u{1F4C2} G\xFCvenli kal\u0131c\u0131 veri deposu haz\u0131r: ${this.dataDir}`);
    } catch (err) {
      console.error("[PersistentStore] Dizin olu\u015Fturma hatas\u0131:", err.message);
    }
    this.flushTimer = setInterval(() => {
      this.flushAll();
    }, 3e4);
    if (this.flushTimer.unref) {
      this.flushTimer.unref();
    }
    const gracefulExit = (signal) => {
      console.log(`[PersistentStore] \u{1F6D1} ${signal} sinyali al\u0131nd\u0131. T\xFCm veriler diske kaydediliyor...`);
      this.flushAll();
      process.exit(0);
    };
    process.once("SIGINT", () => gracefulExit("SIGINT"));
    process.once("SIGTERM", () => gracefulExit("SIGTERM"));
    process.once("beforeExit", () => {
      this.flushAll();
    });
  }
  static registerFlushHandler(name, handler) {
    this.flushHandlers.set(name, handler);
  }
  static flushAll() {
    for (const [name, handler] of this.flushHandlers.entries()) {
      try {
        handler();
      } catch (err) {
        console.error(`[PersistentStore] ${name} kaydedilirken hata:`, err.message);
      }
    }
  }
  /**
   * Atomik dosya kaydetme:
   * 1. Önce .tmp dosyasına yazar.
   * 2. Boyutunu doğrular.
   * 3. Hedef dosya varsa .bak olarak yedeğini alır.
   * 4. .tmp dosyasını hedef dosyaya atomik olarak taşır.
   */
  static atomicSaveJson(filename, data20) {
    this.init();
    const targetPath = import_path2.default.resolve(this.dataDir, filename);
    const tmpPath = import_path2.default.resolve(this.dataDir, `${filename}.tmp.${Date.now()}`);
    const bakPath = import_path2.default.resolve(this.dataDir, `${filename}.bak`);
    try {
      const content = JSON.stringify(data20, null, 2);
      import_fs2.default.writeFileSync(tmpPath, content, "utf-8");
      const stats = import_fs2.default.statSync(tmpPath);
      if (stats.size === 0) {
        try {
          import_fs2.default.unlinkSync(tmpPath);
        } catch {
        }
        return false;
      }
      if (import_fs2.default.existsSync(targetPath)) {
        try {
          import_fs2.default.copyFileSync(targetPath, bakPath);
        } catch {
        }
      }
      try {
        import_fs2.default.renameSync(tmpPath, targetPath);
      } catch {
        import_fs2.default.copyFileSync(tmpPath, targetPath);
        try {
          import_fs2.default.unlinkSync(tmpPath);
        } catch {
        }
      }
      return true;
    } catch (err) {
      console.error(`[PersistentStore] ${filename} kaydedilemedi:`, err.message);
      try {
        if (import_fs2.default.existsSync(tmpPath)) import_fs2.default.unlinkSync(tmpPath);
      } catch {
      }
      return false;
    }
  }
  /**
   * Güvenli veri okuma ve çok kademeli kurtarma:
   * 1. data/${filename} dosyası okunur.
   * 2. Bozuk veya boşsa data/${filename}.bak yedeğinden geri yüklenir.
   * 3. İkisi de yoksa fallbackPaths (eski assets/ dosyaları) aranır ve data/ klasörüne otomatik taşınır.
   * 4. Hiçbiri yoksa defaultVal döner.
   */
  static safeReadJson(filename, fallbackCandidates = [], defaultVal) {
    this.init();
    const targetPath = import_path2.default.resolve(this.dataDir, filename);
    const bakPath = import_path2.default.resolve(this.dataDir, `${filename}.bak`);
    if (import_fs2.default.existsSync(targetPath)) {
      try {
        const raw = import_fs2.default.readFileSync(targetPath, "utf-8").trim();
        if (raw.length > 0) {
          const parsed = JSON.parse(raw);
          return parsed;
        }
      } catch (err) {
        console.warn(`[PersistentStore] \u26A0\uFE0F ${filename} bozuk bulundu, yedekten kurtar\u0131l\u0131yor...`);
      }
    }
    if (import_fs2.default.existsSync(bakPath)) {
      try {
        const raw = import_fs2.default.readFileSync(bakPath, "utf-8").trim();
        if (raw.length > 0) {
          const parsed = JSON.parse(raw);
          console.log(`[PersistentStore] \u2705 ${filename} yedek dosyas\u0131ndan (.bak) ba\u015Far\u0131yla kurtar\u0131ld\u0131!`);
          this.atomicSaveJson(filename, parsed);
          return parsed;
        }
      } catch (err) {
        console.warn(`[PersistentStore] \u26A0\uFE0F ${filename}.bak da bozuk \xE7\u0131kt\u0131.`);
      }
    }
    for (const fb of fallbackCandidates) {
      const resolvedFb = import_path2.default.isAbsolute(fb) ? fb : import_path2.default.resolve(process.cwd(), fb);
      if (import_fs2.default.existsSync(resolvedFb)) {
        try {
          const raw = import_fs2.default.readFileSync(resolvedFb, "utf-8").trim();
          if (raw.length > 0) {
            const parsed = JSON.parse(raw);
            console.log(`[PersistentStore] \u{1F4E6} Eski veri bulundu (${fb}), ${filename} konumuna migrate ediliyor!`);
            this.atomicSaveJson(filename, parsed);
            return parsed;
          }
        } catch {
        }
      }
    }
    this.atomicSaveJson(filename, defaultVal);
    return defaultVal;
  }
};

// src/services/features/levelManager.ts
var LEVEL_REWARD_ROLES = [
  { level: 5, name: "\u{1F949}\u30FBLevel 5 | \xC7aylak", roleId: "1568680202807156888", color: "#CD7F32" },
  { level: 10, name: "\u{1F948}\u30FBLevel 10 | Aktif \xDCye", roleId: "1568680215872278680", color: "#C0C0C0" },
  { level: 20, name: "\u{1F947}\u30FBLevel 20 | K\u0131demli", roleId: "1568680219450155129", color: "#F1C40F" },
  { level: 30, name: "\u{1F48E}\u30FBLevel 30 | Elmas", roleId: "1568680222495084746", color: "#00E5FF" },
  { level: 50, name: "\u{1F451}\u30FBLevel 50 | Efsane", roleId: "1568680226324484167", color: "#E056FD" }
];
var LevelManager = class {
  static userLevels = /* @__PURE__ */ new Map();
  static loaded = false;
  static load() {
    if (this.loaded) return;
    const raw = PersistentStore.safeReadJson(
      "levels.json",
      ["assets/levelData.json"],
      {}
    );
    for (const [k, v] of Object.entries(raw)) {
      this.userLevels.set(k, v);
    }
    this.loaded = true;
    PersistentStore.registerFlushHandler("LevelManager", () => {
      this.save();
    });
  }
  static save() {
    if (!this.loaded) return;
    const obj = {};
    for (const [k, v] of this.userLevels.entries()) {
      obj[k] = v;
    }
    PersistentStore.atomicSaveJson("levels.json", obj);
  }
  static getRequiredXp(level) {
    return (level + 1) * 120 + 50;
  }
  static voiceTimer = null;
  /**
   * Ses kanallarındaki üyelerin süresini takip eder (Sadece istatistik ve süre için; XP/seviye verilmez).
   */
  static startVoiceTracker(client) {
    if (this.voiceTimer) return;
    console.log("[LevelManager] \u{1F399}\uFE0F Sesli kanal s\xFCre takip motoru ba\u015Flat\u0131ld\u0131 (Ses XP/Level atlama kapal\u0131).");
    this.voiceTimer = setInterval(async () => {
      try {
        this.load();
        for (const guild of client.guilds.cache.values()) {
          const channels = guild.channels.cache.filter((c) => c.isVoiceBased());
          for (const [, voiceChannel] of channels) {
            const ch = voiceChannel;
            if (guild.afkChannelId === ch.id) continue;
            const nonBotMembers = ch.members.filter((m) => !m.user.bot);
            if (nonBotMembers.size === 0) continue;
            for (const [, member] of nonBotMembers) {
              if (member.voice.selfDeaf || member.voice.serverDeaf) continue;
              const userId = member.id;
              const current = this.userLevels.get(userId) || {
                xp: 0,
                level: 0,
                lastMessageTime: 0,
                voiceMinutes: 0
              };
              current.voiceMinutes = (current.voiceMinutes || 0) + 1;
              this.userLevels.set(userId, current);
            }
          }
        }
        this.save();
      } catch (err) {
        console.warn("[VoiceTracker] Hata:", err.message);
      }
    }, 6e4);
  }
  /**
   * Kullanıcının seviyesine göre hak ettiği rolleri kontrol edip atar
   */
  static async checkAndAssignRoles(member, level) {
    const newlyAwarded = [];
    for (const reward of LEVEL_REWARD_ROLES) {
      if (level >= reward.level) {
        if (!member.roles.cache.has(reward.roleId)) {
          try {
            await member.roles.add(reward.roleId);
            newlyAwarded.push(reward);
            console.log(`[LevelManager] \u{1F396}\uFE0F ${member.user.tag} kullan\u0131c\u0131s\u0131na ${reward.name} rol\xFC verildi.`);
          } catch (err) {
            console.warn(`[LevelManager] Rol eklenemedi (${reward.name}):`, err.message);
          }
        }
      }
    }
    return newlyAwarded;
  }
  /**
   * Belirli bir üyenin tüm seviye rollerini eşitler
   */
  static async syncMemberRoles(member) {
    this.load();
    const data20 = this.getUserData(member.id);
    return await this.checkAndAssignRoles(member, data20.level);
  }
  /**
   * Sunucudaki tüm kayıtlı üyelerin rollerini topluca eşitler
   */
  static async syncAllMembers(guild) {
    this.load();
    let updatedCount = 0;
    for (const [userId, data20] of this.userLevels.entries()) {
      if (data20.level >= 5) {
        try {
          const member = await guild.members.fetch(userId).catch(() => null);
          if (member) {
            const added = await this.checkAndAssignRoles(member, data20.level);
            if (added.length > 0) updatedCount++;
          }
        } catch (ignore) {
        }
      }
    }
    return updatedCount;
  }
  static async handleMessage(message) {
    if (message.author.bot || !message.guild) return;
    this.load();
    const userId = message.author.id;
    const now = Date.now();
    const current = this.userLevels.get(userId) || { xp: 0, level: 0, lastMessageTime: 0 };
    if (now - current.lastMessageTime < 6e4) {
      return;
    }
    const earnedXp = Math.floor(Math.random() * 11) + 15;
    current.xp += earnedXp;
    current.lastMessageTime = now;
    let leveledUp = false;
    while (current.xp >= this.getRequiredXp(current.level)) {
      current.xp -= this.getRequiredXp(current.level);
      current.level += 1;
      leveledUp = true;
    }
    if (leveledUp) {
      let newlyAwarded = [];
      if (message.member) {
        newlyAwarded = await this.checkAndAssignRoles(message.member, current.level);
      }
      const topAward = newlyAwarded.length > 0 ? newlyAwarded[newlyAwarded.length - 1] : null;
      const levelEmbed = new import_discord19.EmbedBuilder().setTitle("\u{1F389} TEBR\u0130KLER! SEV\u0130YE ATLADIN! \u{1F199}").setDescription(
        `Harikas\u0131n <@${userId}>! Sunucudaki aktifli\u011Fin \xF6d\xFCllendirildi.

\u{1F451} **Yeni Seviyen:** **Level ${current.level}**
\u26A1 **Sonraki Seviye \u0130\xE7in Gereken XP:** \`0 / ${this.getRequiredXp(current.level)} XP\`

` + (newlyAwarded.length > 0 ? `\u{1F381} **KAZANILAN YEN\u0130 SEV\u0130YE ROL\xDC:**
` + newlyAwarded.map((r) => `> \u2728 <@&${r.roleId}> (\`${r.name}\`)`).join("\n") + `
*Rol\xFCn ve \xF6zel sohbet rengin ad\u0131na tan\u0131mland\u0131!*

` : "") + `> *Sohbet etmeye devam ederek yeni seviyelere ve \xF6zel rollere ula\u015Fabilirsin!*`
      ).setColor(topAward?.color || "#F1C40F").setThumbnail(message.author.displayAvatarURL()).setFooter({ text: "Nights Level & XP Sistemi \u2022 Made by erencix" });
      try {
        if ("send" in message.channel) {
          const sentMsg = await message.channel.send({ embeds: [levelEmbed] });
          setTimeout(() => sentMsg.delete().catch(() => {
          }), 1e4);
        }
      } catch (e) {
      }
    }
    this.userLevels.set(userId, current);
    this.save();
  }
  static addXp(userId, amount) {
    this.load();
    const current = this.userLevels.get(userId) || { xp: 0, level: 0, lastMessageTime: 0 };
    current.xp += amount;
    let leveledUp = false;
    while (current.xp >= this.getRequiredXp(current.level)) {
      current.xp -= this.getRequiredXp(current.level);
      current.level += 1;
      leveledUp = true;
    }
    this.userLevels.set(userId, current);
    this.save();
    return { level: current.level, xp: current.xp, leveledUp };
  }
  static setLevel(userId, level, xp = 0) {
    this.load();
    const data20 = {
      level: Math.max(0, level),
      xp: Math.max(0, xp),
      lastMessageTime: Date.now()
    };
    this.userLevels.set(userId, data20);
    this.save();
    return data20;
  }
  static getUserData(userId) {
    this.load();
    return this.userLevels.get(userId) || { xp: 0, level: 0, lastMessageTime: 0 };
  }
  static getLeaderboard() {
    this.load();
    const list = [];
    for (const [userId, data20] of this.userLevels.entries()) {
      list.push({ userId, level: data20.level, xp: data20.xp });
    }
    list.sort((a, b) => b.level !== a.level ? b.level - a.level : b.xp - a.xp);
    return list.slice(0, 10);
  }
  static getRankEmbed(user) {
    this.load();
    const data20 = this.getUserData(user.id);
    const needed = this.getRequiredXp(data20.level);
    const percent = Math.min(100, Math.round(data20.xp / needed * 100));
    const totalBars = 10;
    const filled = Math.round(percent / 100 * totalBars);
    const bar = "\u2588".repeat(filled) + "\u2591".repeat(totalBars - filled);
    const earnedRoles = LEVEL_REWARD_ROLES.filter((r) => data20.level >= r.level);
    const currentRole = earnedRoles.length > 0 ? earnedRoles[earnedRoles.length - 1] : null;
    const currentBadge = currentRole ? `<@&${currentRole.roleId}>` : "`Ba\u015Flang\u0131\xE7 Seviyesi` (Hedef: Level 5)";
    const nextRole = LEVEL_REWARD_ROLES.find((r) => data20.level < r.level);
    const nextBadge = nextRole ? `<@&${nextRole.roleId}> (Level ${nextRole.level})` : "\u{1F451} `Maksimum Rol A\xE7\u0131ld\u0131!`";
    return new import_discord19.EmbedBuilder().setTitle(`\u{1F4CA} ${user.displayName || user.username} \u2022 Seviye Kart\u0131`).setThumbnail(user.displayAvatarURL ? user.displayAvatarURL() : null).setColor(currentRole?.color || "#8B5CF6").addFields(
      { name: "\u{1F396}\uFE0F Seviye", value: `\`Level ${data20.level}\``, inline: true },
      { name: "\u26A1 Deneyim (XP)", value: `\`${data20.xp} / ${needed} XP\``, inline: true },
      {
        name: "\u{1F399}\uFE0F Ses S\xFCresi",
        value: `\`${Math.floor((data20.voiceMinutes || 0) / 60)} sa ${(data20.voiceMinutes || 0) % 60} dk\``,
        inline: true
      },
      { name: "\u{1F4C8} \u0130lerleme", value: `\`${bar} %${percent}\``, inline: false },
      { name: "\u{1F3C5} Mevcut Rol", value: currentBadge, inline: true },
      { name: "\u{1F3AF} S\u0131radaki Rol", value: nextBadge, inline: true }
    ).setFooter({ text: "Nights Level Sistemi \u2022 Made by erencix" });
  }
  static getLevelInfoEmbed() {
    return new import_discord19.EmbedBuilder().setTitle("\u2B50 NIGHTS SEV\u0130YE & ROL B\u0130LG\u0130LEND\u0130RME S\u0130STEM\u0130 \u{1F3C6}").setDescription(
      "**Nights** sunucumuzda metin kanallar\u0131nda aktif olduk\xE7a otomatik olarak **XP** kazan\u0131r, seviyenizi y\xFCkseltir ve \xF6zel rol \xF6d\xFCllerinin kilidini a\xE7ars\u0131n\u0131z!\n\n### \u{1F396}\uFE0F Seviye Rolleri ve Ayr\u0131cal\u0131klar\u0131:\n\u2022 \u{1F949} **Level 5:** <@&1568680202807156888>\n  \u2514 *Bronz isim rengi, g\xF6rsel & ba\u011Flant\u0131 payla\u015Fma ve harici emoji ayr\u0131cal\u0131\u011F\u0131.*\n\n\u2022 \u{1F948} **Level 10:** <@&1568680215872278680>\n  \u2514 *G\xFCm\xFC\u015F isim rengi, aktif sohbet\xE7i stat\xFCs\xFC ve \xF6zel sunucu \xE7ekili\u015Flerine kat\u0131l\u0131m \xF6nceli\u011Fi.*\n\n\u2022 \u{1F947} **Level 20:** <@&1568680219450155129>\n  \u2514 *Alt\u0131n sar\u0131s\u0131 par\u0131ldayan isim rengi, \xF6zel ses kanal\u0131 limit/bitrate kontrol avantajlar\u0131.*\n\n\u2022 \u{1F48E} **Level 30:** <@&1568680222495084746>\n  \u2514 *Elmas mavi isim rengi, VIP oda eri\u015Fimleri ve \xF6zel ses etkinlik yetkisi.*\n\n\u2022 \u{1F451} **Level 50:** <@&1568680226324484167>\n  \u2514 *Efsane mor isim rengi, sunucunun en se\xE7kin \xFCyeleri aras\u0131na girme ve taht stat\xFCs\xFC!*\n\n### \u26A1 Komutlar:\n\u2022 `/rank` veya `!rank` \u2014 Kendi seviye kart\u0131n\u0131z\u0131, mevcut XP ve ilerlemenizi g\xF6r\xFCnt\xFCler.\n\u2022 `/top` veya `!top` \u2014 Sunucunun en aktif \xFCyelerini listeleyen canl\u0131 Liderlik Tablosu.\n\n> \u{1F4A1} **Nas\u0131l XP Kazan\u0131l\u0131r?**\n> \u2022 \u{1F4AC} **Yaz\u0131l\u0131 Sohbet:** Metin kanallar\u0131nda her 60 saniyede bir att\u0131\u011F\u0131n\u0131z mesajlar size **15-25 XP** kazand\u0131r\u0131r.\n> \u2022 \u{1F399}\uFE0F **Sesli Kanallar:** Ses odalar\u0131nda ge\xE7irdi\u011Finiz toplam s\xFCre istatistik olarak profilinize i\u015Flenir.\n> \u2022 *Spam, flood veya hileli mesajlar engellenir ve XP kazand\u0131rmaz.*"
    ).setColor("#6C5CE7").setImage("https://media.giphy.com/media/26tn3334mvoVClhos/giphy.gif").setFooter({ text: "Nights Community Rewards \u2022 Made by erencix" });
  }
};

// src/commands/seviye.ts
var rankData = new import_discord20.SlashCommandBuilder().setName("rank").setDescription("Kendi veya etiketledi\u011Fin kullan\u0131c\u0131n\u0131n seviye kart\u0131n\u0131 g\xF6r\xFCnt\xFCler.").addUserOption(
  (option) => option.setName("kullanici").setDescription("Seviyesini g\xF6rmek istedi\u011Fin kullan\u0131c\u0131 (Opsiyonel)")
);
var topData = new import_discord20.SlashCommandBuilder().setName("top").setDescription("Sunucunun en aktif \xFCyelerini ve liderlik tablosunu listeler.");
var seviyeAyarlaData = new import_discord20.SlashCommandBuilder().setName("seviye-ayarla").setDescription("Bir kullan\u0131c\u0131n\u0131n seviyesini ve rollerini do\u011Frudan ayarlar (Y\xF6netici).").setDefaultMemberPermissions(import_discord20.PermissionFlagsBits.Administrator).addUserOption(
  (option) => option.setName("kullanici").setDescription("Seviyesi ayarlanacak kullan\u0131c\u0131").setRequired(true)
).addIntegerOption(
  (option) => option.setName("seviye").setDescription("Atanacak seviye (\xF6rn: 5, 10, 20, 30, 50)").setRequired(true).setMinValue(0).setMaxValue(100)
);
async function executeRank(interaction) {
  const targetUser = interaction.options.getUser("kullanici") || interaction.user;
  const embed = LevelManager.getRankEmbed(targetUser);
  await interaction.reply({ embeds: [embed] });
}
async function executeTop(interaction) {
  const topList = LevelManager.getLeaderboard();
  let desc = "";
  topList.forEach((u, i) => {
    const medal = i === 0 ? "\u{1F947}" : i === 1 ? "\u{1F948}" : i === 2 ? "\u{1F949}" : `**#${i + 1}**`;
    desc += `${medal} <@${u.userId}> \u2014 **Level ${u.level}** (\`${u.xp} XP\`)
`;
  });
  const topEmbed = new import_discord20.EmbedBuilder().setTitle("\u{1F3C6} NIGHTS AKT\u0130FL\u0130K L\u0130DERL\u0130K TABLOSU").setDescription(desc || "Hen\xFCz seviye atlayan \xFCye bulunmuyor.").setColor("#F1C40F").setFooter({ text: "Nights Topluluk S\u0131ralamas\u0131 \u2022 Made by erencix" }).setTimestamp();
  await interaction.reply({ embeds: [topEmbed] });
}
async function executeSeviyeAyarla(interaction) {
  const targetUser = interaction.options.getUser("kullanici", true);
  const targetLevel = interaction.options.getInteger("seviye", true);
  LevelManager.setLevel(targetUser.id, targetLevel, 0);
  let roleMsg = "";
  if (interaction.guild) {
    try {
      const member = await interaction.guild.members.fetch(targetUser.id);
      if (member) {
        const awarded = await LevelManager.checkAndAssignRoles(member, targetLevel);
        if (awarded.length > 0) {
          roleMsg = `
\u{1F381} **Verilen Roller:** ${awarded.map((r) => `<@&${r.roleId}>`).join(", ")}`;
        }
      }
    } catch (ignore) {
    }
  }
  const embed = new import_discord20.EmbedBuilder().setTitle("\u2705 Seviye Ba\u015Far\u0131yla Ayarland\u0131!").setDescription(
    `<@${targetUser.id}> kullan\u0131c\u0131s\u0131n\u0131n seviyesi ba\u015Far\u0131yla **Level ${targetLevel}** olarak g\xFCncellendi.${roleMsg}`
  ).setColor("#2ECC71").setFooter({ text: "Nights Seviye Y\xF6netimi \u2022 Made by erencix" });
  await interaction.reply({ embeds: [embed] });
}

// src/commands/sil.ts
var import_discord21 = require("discord.js");
var data12 = new import_discord21.SlashCommandBuilder().setName("sil").setDescription("Belirtilen kanaldan se\xE7ilen say\u0131da mesaj\u0131 topluca siler (1-100).").setDefaultMemberPermissions(import_discord21.PermissionFlagsBits.ManageMessages).addIntegerOption(
  (option) => option.setName("miktar").setDescription("Silinecek mesaj say\u0131s\u0131 (1 - 100)").setRequired(true).setMinValue(1).setMaxValue(100)
);
async function execute12(interaction) {
  if (!interaction.memberPermissions?.has(import_discord21.PermissionFlagsBits.ManageMessages) && !interaction.memberPermissions?.has(import_discord21.PermissionFlagsBits.Administrator)) {
    await interaction.reply({
      content: "\u274C Bu komutu kullanabilmek i\xE7in **Mesajlar\u0131 Y\xF6net** yetkisine sahip olmal\u0131s\u0131n\u0131z.",
      ephemeral: true
    });
    return;
  }
  const channel = interaction.channel;
  if (!channel || !(channel instanceof import_discord21.TextChannel)) {
    await interaction.reply({
      content: "\u274C Bu komut sadece metin kanallar\u0131nda kullan\u0131labilir.",
      ephemeral: true
    });
    return;
  }
  const amount = interaction.options.getInteger("miktar", true);
  await interaction.deferReply({ ephemeral: true });
  try {
    const deleted = await channel.bulkDelete(amount, true);
    const embed = new import_discord21.EmbedBuilder().setTitle("\u{1F5D1}\uFE0F Mesajlar Temizlendi").setDescription(
      `\u2705 Ba\u015Far\u0131yla **${deleted.size}** adet mesaj silindi!

> \u{1F46E} **Yetkili:** <@${interaction.user.id}>
> \u{1F4AC} **Kanal:** <#${channel.id}>`
    ).setColor("#2ECC71").setFooter({ text: "Nights Guard Moderasyon \u2022 Made by erencix" }).setTimestamp();
    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    await interaction.editReply({
      content: `\u274C Mesajlar silinirken bir hata olu\u015Ftu: ${err.message}
*(Not: Discord kurallar\u0131 gere\u011Fi 14 g\xFCnden eski mesajlar toplu silinemez).*`
    });
  }
}

// src/commands/avatar.ts
var import_discord22 = require("discord.js");
var data13 = new import_discord22.SlashCommandBuilder().setName("avatar").setDescription("Bir kullan\u0131c\u0131n\u0131n veya kendinizin HD profil foto\u011Fraf\u0131n\u0131 ve afi\u015Fini g\xF6r\xFCnt\xFCler.").addUserOption(
  (option) => option.setName("kullanici").setDescription("Avatar\u0131n\u0131 g\xF6rmek istedi\u011Finiz kullan\u0131c\u0131 (Bo\u015F b\u0131rak\u0131rsan\u0131z kendiniz)").setRequired(false)
);
async function execute13(interaction) {
  const targetUser = interaction.options.getUser("kullanici") || interaction.user;
  const fetchedUser = await interaction.client.users.fetch(targetUser.id, { force: true }).catch(() => targetUser);
  const avatarUrl = fetchedUser.displayAvatarURL({ size: 4096, extension: "png" });
  const bannerUrl = fetchedUser.bannerURL?.({ size: 4096, extension: "png" });
  const embed = new import_discord22.EmbedBuilder().setTitle(`\u{1F5BC}\uFE0F ${fetchedUser.username} Profil Avatar\u0131`).setDescription(
    `\u{1F464} **Kullan\u0131c\u0131:** <@${fetchedUser.id}> (\`${fetchedUser.id}\`)
\u{1F310} **Profil Linki:** [G\xF6r\xFCnt\xFCle](${avatarUrl})`
  ).setImage(avatarUrl).setColor("#8B5CF6").setFooter({ text: "Nights Guard Avatar G\xF6r\xFCnt\xFCleyici \u2022 Made by erencix" }).setTimestamp();
  if (bannerUrl) {
    embed.addFields({
      name: "\u{1F3A8} Profil Afi\u015Fi (Banner)",
      value: `[Afi\u015Fi G\xF6r\xFCnt\xFCle](${bannerUrl})`,
      inline: false
    });
  }
  const row = new import_discord22.ActionRowBuilder().addComponents(
    new import_discord22.ButtonBuilder().setLabel("Avatar\u0131 \u0130ndir (HD)").setStyle(import_discord22.ButtonStyle.Link).setURL(avatarUrl)
  );
  if (bannerUrl) {
    row.addComponents(
      new import_discord22.ButtonBuilder().setLabel("Banner\u0131 \u0130ndir").setStyle(import_discord22.ButtonStyle.Link).setURL(bannerUrl)
    );
  }
  await interaction.reply({
    embeds: [embed],
    components: [row]
  });
}

// src/commands/sunucu.ts
var import_discord23 = require("discord.js");
var data14 = new import_discord23.SlashCommandBuilder().setName("sunucu").setDescription("Sunucunun detayl\u0131 istatistiklerini, \xFCye, kanal ve rol bilgilerini g\xF6r\xFCnt\xFCler.");
async function execute14(interaction) {
  const guild = interaction.guild;
  if (!guild) {
    await interaction.reply({ content: "\u274C Bu komut yaln\u0131zca bir sunucu i\xE7inde kullan\u0131labilir.", ephemeral: true });
    return;
  }
  const [members, channels, roles, emojis, stickers] = await Promise.all([
    guild.members.fetch(),
    guild.channels.fetch(),
    guild.roles.fetch(),
    guild.emojis.fetch(),
    guild.stickers.fetch().catch(() => /* @__PURE__ */ new Map())
  ]);
  const humans = members.filter((m) => !m.user.bot).size;
  const bots = members.filter((m) => m.user.bot).size;
  const onlineMembers = members.filter((m) => m.presence?.status && m.presence.status !== "offline").size;
  const textChannels = channels.filter((c) => c && c.type === import_discord23.ChannelType.GuildText).size;
  const voiceChannels = channels.filter((c) => c && c.type === import_discord23.ChannelType.GuildVoice).size;
  const categoryChannels = channels.filter((c) => c && c.type === import_discord23.ChannelType.GuildCategory).size;
  const activeInVoice = members.filter((m) => m.voice.channelId !== null).size;
  const createdTimestamp = Math.floor(guild.createdTimestamp / 1e3);
  const embed = new import_discord23.EmbedBuilder().setTitle(`\u{1F4CA} ${guild.name} \u2014 Sunucu \u0130statistikleri`).setDescription(
    `\u{1F451} **Sunucu Sahibi:** <@${guild.ownerId}>
\u{1F4C5} **Kurulu\u015F Tarihi:** <t:${createdTimestamp}:F> (<t:${createdTimestamp}:R>)
\u{1F194} **Sunucu ID:** \`${guild.id}\`
\u{1F48E} **Takviye (Boost):** Seviye **${guild.premiumTier}** (${guild.premiumSubscriptionCount || 0} Boost)`
  ).addFields(
    {
      name: "\u{1F465} \xDCye Da\u011F\u0131l\u0131m\u0131",
      value: `\u2022 **Toplam:** \`${guild.memberCount}\`
\u2022 **\u0130nsan:** \`${humans}\` | **Bot:** \`${bots}\`
\u2022 **Aktif (\xC7evrimi\xE7i):** \`${onlineMembers || "Veri al\u0131n\u0131yor"}\`
\u2022 **Sesteki \xDCyeler:** \`${activeInVoice}\` \u{1F399}\uFE0F`,
      inline: true
    },
    {
      name: "\u{1F4C1} Kanallar",
      value: `\u2022 **Toplam Kanal:** \`${channels.size}\`
\u2022 **Metin:** \`${textChannels}\` \u{1F4AC}
\u2022 **Ses:** \`${voiceChannels}\` \u{1F50A}
\u2022 **Kategori:** \`${categoryChannels}\` \u{1F4C2}`,
      inline: true
    },
    {
      name: "\u{1F3A8} Medya & \u0130fadeler",
      value: `\u2022 **Roller:** \`${roles.size}\`
\u2022 **Emojiler:** \`${emojis.size}\`
\u2022 **\xC7\u0131kartmalar:** \`${stickers.size}\`
\u2022 **Do\u011Frulama:** \`${guild.verificationLevel}\``,
      inline: true
    }
  ).setColor("#8B5CF6").setThumbnail(guild.iconURL({ size: 512 }) || "").setFooter({ text: "Nights Guard Topluluk Analiti\u011Fi \u2022 Made by erencix" }).setTimestamp();
  if (guild.bannerURL()) {
    embed.setImage(guild.bannerURL({ size: 1024 }) || "");
  }
  await interaction.reply({ embeds: [embed] });
}

// src/commands/afk.ts
var import_discord25 = require("discord.js");

// src/services/features/afkManager.ts
var import_discord24 = require("discord.js");
var AfkManager = class {
  static afkUsers = /* @__PURE__ */ new Map();
  static loaded = false;
  static load() {
    if (this.loaded) return;
    const raw = PersistentStore.safeReadJson("afk.json", [], {});
    for (const [k, v] of Object.entries(raw)) {
      this.afkUsers.set(k, v);
    }
    this.loaded = true;
    PersistentStore.registerFlushHandler("AfkManager", () => {
      this.save();
    });
  }
  static save() {
    if (!this.loaded) return;
    const obj = {};
    for (const [k, v] of this.afkUsers.entries()) {
      obj[k] = v;
    }
    PersistentStore.atomicSaveJson("afk.json", obj);
  }
  static setAfk(userId, reason) {
    this.load();
    this.afkUsers.set(userId, {
      userId,
      reason: reason || "Belirtilmedi",
      timestamp: Date.now()
    });
    this.save();
  }
  static isAfk(userId) {
    this.load();
    return this.afkUsers.has(userId);
  }
  static getAfk(userId) {
    this.load();
    return this.afkUsers.get(userId);
  }
  static removeAfk(userId) {
    this.load();
    const data20 = this.afkUsers.get(userId);
    if (data20) {
      this.afkUsers.delete(userId);
      this.save();
    }
    return data20;
  }
  /**
   * Mesaj atıldığında AFK kontrolü yapar:
   * 1. Mesajı atan kişi AFK ise AFK modunu kapatır ve bilgilendirir.
   * 2. Mesajda etiketlenen kişiler AFK ise neden AFK olduklarını bildirir.
   */
  static async handleMessage(message) {
    if (message.author.bot || !message.guild) return;
    if (this.isAfk(message.author.id)) {
      const data20 = this.removeAfk(message.author.id);
      if (data20) {
        const passedSeconds = Math.floor((Date.now() - data20.timestamp) / 1e3);
        const minutes = Math.floor(passedSeconds / 60);
        const timeText = minutes > 0 ? `${minutes} dakika` : `${passedSeconds} saniye`;
        const welcomeBackEmbed = new import_discord24.EmbedBuilder().setDescription(`\u{1F44B} **Tekrar ho\u015F geldin <@${message.author.id}>!** AFK modundan \xE7\u0131kt\u0131n. (*S\xFCre: ${timeText}*)`).setColor("#2ECC71");
        message.reply({ embeds: [welcomeBackEmbed] }).catch(() => {
        });
      }
    }
    if (message.mentions.users.size > 0) {
      const mentionedAfkUsers = [];
      for (const [userId] of message.mentions.users) {
        if (userId === message.author.id) continue;
        const afkData = this.getAfk(userId);
        if (afkData) {
          mentionedAfkUsers.push(afkData);
        }
      }
      if (mentionedAfkUsers.length > 0) {
        for (const data20 of mentionedAfkUsers) {
          const timestampSec = Math.floor(data20.timestamp / 1e3);
          const afkEmbed = new import_discord24.EmbedBuilder().setTitle("\u{1F4A4} Kullan\u0131c\u0131 \u015Eu Anda AFK").setDescription(
            `<@${data20.userId}> \u015Fu anda AFK modunda!

> \u{1F4CC} **Sebep:** ${data20.reason}
> \u23F0 **Ayr\u0131l\u0131\u015F:** <t:${timestampSec}:R>`
          ).setColor("#F1C40F");
          await message.reply({ embeds: [afkEmbed] }).catch(() => {
          });
        }
      }
    }
  }
};

// src/commands/afk.ts
var data15 = new import_discord25.SlashCommandBuilder().setName("afk").setDescription("Sunucuda AFK moduna ge\xE7menizi sa\u011Flar ve etiketlendi\u011Finizde bildirim verir.").addStringOption(
  (option) => option.setName("sebep").setDescription("Neden AFK oldu\u011Funuz (\xD6rn: Yemek yiyorum, ders \xE7al\u0131\u015F\u0131yorum)").setRequired(false)
);
async function execute15(interaction) {
  const reason = interaction.options.getString("sebep") || "Belirtilmedi";
  const user = interaction.user;
  AfkManager.setAfk(user.id, reason);
  const embed = new import_discord25.EmbedBuilder().setTitle("\u{1F4A4} AFK Moduna Ge\xE7ildi").setDescription(
    `Ba\u015Far\u0131yla AFK moduna ge\xE7tiniz, <@${user.id}>!

> \u{1F4CC} **Sebep:** ${reason}

\u{1F4A1} *Sohbete herhangi bir mesaj yazd\u0131\u011F\u0131n\u0131zda AFK modunuz otomatik olarak kapanacakt\u0131r.*`
  ).setColor("#9B59B6").setFooter({ text: "Nights Guard AFK Sistemi \u2022 Made by erencix" }).setTimestamp();
  await interaction.reply({ embeds: [embed] });
}

// src/commands/istatistik.ts
var import_discord26 = require("discord.js");
var import_os = __toESM(require("os"));
var data16 = new import_discord26.SlashCommandBuilder().setName("istatistik").setDescription("Botun anl\u0131k ping, \xE7al\u0131\u015Fma s\xFCresi, RAM ve teknik verilerini g\xF6sterir.");
async function execute16(interaction) {
  const client = interaction.client;
  const totalSeconds = Math.floor((client.uptime || 0) / 1e3);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor(totalSeconds % 86400 / 3600);
  const minutes = Math.floor(totalSeconds % 3600 / 60);
  const seconds = totalSeconds % 60;
  const uptimeStr = `${days > 0 ? `${days}g ` : ""}${hours}s ${minutes}d ${seconds}sn`;
  const memUsage = process.memoryUsage();
  const heapUsedMB = (memUsage.heapUsed / 1024 / 1024).toFixed(1);
  const rssMB = (memUsage.rss / 1024 / 1024).toFixed(1);
  const wsPing = client.ws.ping;
  const totalGuilds = client.guilds.cache.size;
  let totalMembers = 0;
  client.guilds.cache.forEach((g) => {
    totalMembers += g.memberCount;
  });
  const embed = new import_discord26.EmbedBuilder().setTitle("\u{1F4CA} NIGHTS GUARD \u2022 S\u0130STEM \u0130STAT\u0130ST\u0130KLER\u0130").setDescription("Nights Guard; 7/24 kesintisiz \xE7al\u0131\u015Fan, ultra optimize bir sunucu koruma ve y\xF6netim botudur.").addFields(
    {
      name: "\u26A1 Gecikme & Performans",
      value: `\u2022 **API Ping:** \`${wsPing} ms\`
\u2022 **\xC7al\u0131\u015Fma S\xFCresi:** \`${uptimeStr}\`
\u2022 **Aktif Durum:** \`\u{1F7E2} 7/24 Kesintisiz\``,
      inline: true
    },
    {
      name: "\u{1F4BE} Bellek & Sistem",
      value: `\u2022 **RAM Kullan\u0131m\u0131:** \`${heapUsedMB} MB\` (RSS: \`${rssMB} MB\`)
\u2022 **Platform:** \`${import_os.default.platform()} (${import_os.default.arch()})\`
\u2022 **Node.js:** \`${process.version}\``,
      inline: true
    },
    {
      name: "\u{1F310} Topluluk & Hizmet",
      value: `\u2022 **Sunucular:** \`${totalGuilds}\`
\u2022 **Toplam \xDCye:** \`${totalMembers}\`
\u2022 **Discord.js:** \`v${import_discord26.version}\``,
      inline: false
    },
    {
      name: "\u{1F451} Geli\u015Ftirici & Mimari",
      value: `\u2022 **Geli\u015Ftirici:** <@1138498666785677492> (\`erencix\`)
\u2022 **Bot S\xFCr\xFCm\xFC:** \`v1.5.0 Pro Edition\``,
      inline: false
    }
  ).setColor("#8B5CF6").setThumbnail(client.user?.displayAvatarURL() || "").setFooter({ text: "Nights Guard System Diagnostics \u2022 Made by erencix" }).setTimestamp();
  await interaction.reply({ embeds: [embed] });
}

// src/commands/kullanici.ts
var import_discord27 = require("discord.js");

// src/services/features/economyManager.ts
var EconomyManager = class {
  static userEconomy = /* @__PURE__ */ new Map();
  static loaded = false;
  static load() {
    if (this.loaded) return;
    const raw = PersistentStore.safeReadJson(
      "economy.json",
      ["assets/economyData.json"],
      {}
    );
    for (const [k, v] of Object.entries(raw)) {
      this.userEconomy.set(k, v);
    }
    this.loaded = true;
    PersistentStore.registerFlushHandler("EconomyManager", () => {
      this.save();
    });
  }
  static save() {
    if (!this.loaded) return;
    const obj = {};
    for (const [k, v] of this.userEconomy.entries()) {
      obj[k] = v;
    }
    PersistentStore.atomicSaveJson("economy.json", obj);
  }
  static getUser(userId) {
    this.load();
    let data20 = this.userEconomy.get(userId);
    if (!data20) {
      data20 = { coins: 100, lastDaily: 0, lastWork: 0 };
      this.userEconomy.set(userId, data20);
    }
    return data20;
  }
  static getBalance(userId) {
    return this.getUser(userId).coins;
  }
  static addCoins(userId, amount) {
    const user = this.getUser(userId);
    user.coins += amount;
    this.save();
  }
  static removeCoins(userId, amount) {
    const user = this.getUser(userId);
    if (user.coins < amount) return false;
    user.coins -= amount;
    this.save();
    return true;
  }
  static claimDaily(userId) {
    const user = this.getUser(userId);
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1e3;
    if (now - user.lastDaily < cooldown) {
      return { success: false, amount: 0, nextTime: user.lastDaily + cooldown };
    }
    const reward = 500;
    user.coins += reward;
    user.lastDaily = now;
    this.save();
    return { success: true, amount: reward };
  }
  static work(userId) {
    const user = this.getUser(userId);
    const now = Date.now();
    const cooldown = 30 * 60 * 1e3;
    if (now - user.lastWork < cooldown) {
      return { success: false, amount: 0, job: "", nextTime: user.lastWork + cooldown };
    }
    const jobs = [
      { name: "Yaz\u0131l\u0131mc\u0131 olarak freelance kod yazd\u0131n", min: 180, max: 320 },
      { name: "Discord sunucusunda moderat\xF6rl\xFCk yapt\u0131n", min: 140, max: 260 },
      { name: "Valorant turnuvas\u0131nda birinci oldun", min: 200, max: 350 },
      { name: "Twitch yay\u0131n\u0131nda ba\u011F\u0131\u015F toplad\u0131n", min: 150, max: 300 },
      { name: "Kripto borsas\u0131nda ba\u015Far\u0131l\u0131 al-sat yapt\u0131n", min: 170, max: 340 }
    ];
    const chosen = jobs[Math.floor(Math.random() * jobs.length)];
    const earned = Math.floor(Math.random() * (chosen.max - chosen.min + 1)) + chosen.min;
    user.coins += earned;
    user.lastWork = now;
    this.save();
    return { success: true, amount: earned, job: chosen.name };
  }
  static coinflip(userId, bet, choice) {
    const user = this.getUser(userId);
    if (user.coins < bet) {
      throw new Error(`Yetersiz bakiye! Mevcut paran\u0131z: **${user.coins} Nights Coin**`);
    }
    const outcome = Math.random() < 0.5 ? "yazi" : "tura";
    const isWin = outcome === choice;
    if (isWin) {
      user.coins += bet;
    } else {
      user.coins -= bet;
    }
    this.save();
    return { win: isWin, result: outcome, change: isWin ? bet : -bet };
  }
  static slot(userId, bet) {
    const user = this.getUser(userId);
    if (user.coins < bet) {
      throw new Error(`Yetersiz bakiye! Mevcut paran\u0131z: **${user.coins} Nights Coin**`);
    }
    const symbols = ["\u{1F352}", "\u{1F34B}", "\u{1F347}", "\u{1F48E}", "7\uFE0F\u20E3"];
    const s1 = symbols[Math.floor(Math.random() * symbols.length)];
    const s2 = symbols[Math.floor(Math.random() * symbols.length)];
    const s3 = symbols[Math.floor(Math.random() * symbols.length)];
    let multiplier = 0;
    if (s1 === s2 && s2 === s3) {
      multiplier = s1 === "7\uFE0F\u20E3" ? 7 : 5;
    } else if (s1 === s2 || s2 === s3 || s1 === s3) {
      multiplier = 2;
    }
    const win = multiplier > 0;
    const change = win ? bet * (multiplier - 1) : -bet;
    user.coins += change;
    this.save();
    return { win, symbols: [s1, s2, s3], multiplier, change };
  }
  static transfer(fromUserId, toUserId, amount) {
    if (amount <= 0 || isNaN(amount)) {
      return { success: false, message: "Ge\xE7ersiz miktar! Pozitif bir say\u0131 girmelisiniz." };
    }
    if (fromUserId === toUserId) {
      return { success: false, message: "Kendinize para transfer edemezsiniz!" };
    }
    const fromUser = this.getUser(fromUserId);
    if (fromUser.coins < amount) {
      return { success: false, message: `Yetersiz bakiye! Mevcut paran\u0131z: **${fromUser.coins} Nights Coin**` };
    }
    const toUser = this.getUser(toUserId);
    fromUser.coins -= amount;
    toUser.coins += amount;
    this.save();
    return {
      success: true,
      message: `Ba\u015Far\u0131yla <@${toUserId}> kullan\u0131c\u0131s\u0131na **${amount} Nights Coin** aktar\u0131ld\u0131!`
    };
  }
};

// src/commands/kullanici.ts
var data17 = new import_discord27.SlashCommandBuilder().setName("kullanici").setDescription("Kullan\u0131c\u0131n\u0131n detayl\u0131 profilini, seviyesini, rollerini ve paras\u0131n\u0131 g\xF6sterir.").addUserOption(
  (option) => option.setName("kullanici").setDescription("Profili g\xF6r\xFCnt\xFClenecek kullan\u0131c\u0131 (Bo\u015F b\u0131rak\u0131rsan\u0131z siz)").setRequired(false)
);
async function execute17(interaction) {
  const targetUser = interaction.options.getUser("kullanici") || interaction.user;
  const guild = interaction.guild;
  if (!guild) {
    await interaction.reply({ content: "Bu komut yaln\u0131zca bir sunucu i\xE7inde kullan\u0131labilir.", ephemeral: true });
    return;
  }
  const member = await guild.members.fetch(targetUser.id).catch(() => null);
  const levelData = LevelManager.getUserData(targetUser.id);
  const coins = EconomyManager.getBalance(targetUser.id);
  const neededXp = LevelManager.getRequiredXp(levelData.level);
  const createdTimestamp = Math.floor(targetUser.createdTimestamp / 1e3);
  const joinedTimestamp = member?.joinedTimestamp ? Math.floor(member.joinedTimestamp / 1e3) : null;
  let rolesStr = "Rol bulunmuyor";
  if (member) {
    const roles = member.roles.cache.filter((r) => r.id !== guild.id).sort((a, b) => b.position - a.position).map((r) => `<@&${r.id}>`);
    if (roles.length > 0) {
      rolesStr = roles.slice(0, 10).join(", ") + (roles.length > 10 ? ` ve ${roles.length - 10} rol daha...` : "");
    }
  }
  const voiceHours = Math.floor((levelData.voiceMinutes || 0) / 60);
  const voiceMins = (levelData.voiceMinutes || 0) % 60;
  const embed = new import_discord27.EmbedBuilder().setTitle(`\u{1F464} ${member?.displayName || targetUser.username} \u2022 Kullan\u0131c\u0131 Profili`).setDescription(`**${guild.name}** sunucusundaki \xFCye istatistikleri ve bilgileri:`).addFields(
    {
      name: "\u{1F194} Kimlik Bilgileri",
      value: `\u2022 **Kullan\u0131c\u0131:** <@${targetUser.id}>
\u2022 **Etiket:** \`${targetUser.tag}\`
\u2022 **ID:** \`${targetUser.id}\`
\u2022 **Bot mu:** \`${targetUser.bot ? "Evet \u{1F916}" : "Hay\u0131r \u{1F464}"}\``,
      inline: true
    },
    {
      name: "\u{1F4C5} Tarihler",
      value: `\u2022 **Kat\u0131lma:** ${joinedTimestamp ? `<t:${joinedTimestamp}:R>` : "Bilinmiyor"}
\u2022 **Hesap A\xE7\u0131l\u0131\u015F:** <t:${createdTimestamp}:R>`,
      inline: true
    },
    {
      name: "\u2B50 Aktiflik & Seviye",
      value: `\u2022 **Seviye:** \`Level ${levelData.level}\`
\u2022 **XP:** \`${levelData.xp} / ${neededXp} XP\`
\u2022 **\u{1F399}\uFE0F Ses S\xFCresi:** \`${voiceHours} sa ${voiceMins} dk\``,
      inline: true
    },
    {
      name: "\u{1F4B0} Nights Ekonomi",
      value: `\u2022 **Bakiye:** \`${coins} Nights Coin\` \u{1FA99}`,
      inline: true
    },
    {
      name: "\u{1F3AD} Roller",
      value: rolesStr,
      inline: false
    }
  ).setColor("#8B5CF6").setThumbnail(targetUser.displayAvatarURL({ size: 512 })).setFooter({ text: "Nights Guard Profil Motoru \u2022 Made by erencix" }).setTimestamp();
  await interaction.reply({ embeds: [embed] });
}

// src/commands/gonder.ts
var import_discord28 = require("discord.js");
var data18 = new import_discord28.SlashCommandBuilder().setName("gonder").setDescription("Ba\u015Fka bir sunucu \xFCyesine Nights Coin transfer eder.").addUserOption(
  (option) => option.setName("kullanici").setDescription("Para g\xF6ndermek istedi\u011Finiz kullan\u0131c\u0131").setRequired(true)
).addIntegerOption(
  (option) => option.setName("miktar").setDescription("G\xF6ndermek istedi\u011Finiz miktar (En az 1)").setRequired(true).setMinValue(1)
);
async function execute18(interaction) {
  const targetUser = interaction.options.getUser("kullanici", true);
  const amount = interaction.options.getInteger("miktar", true);
  const senderId = interaction.user.id;
  if (targetUser.bot) {
    await interaction.reply({ content: "\u274C Botlara Nights Coin transfer edemezsiniz!", ephemeral: true });
    return;
  }
  const result = EconomyManager.transfer(senderId, targetUser.id, amount);
  if (!result.success) {
    await interaction.reply({ content: `\u274C ${result.message}`, ephemeral: true });
    return;
  }
  const embed = new import_discord28.EmbedBuilder().setTitle("\u{1F4B8} Nights Coin Transferi Ba\u015Far\u0131l\u0131!").setDescription(
    `\u{1F389} **\u0130\u015Flem Tamamland\u0131!**

> \u{1F4E4} **G\xF6nderen:** <@${senderId}>
> \u{1F4E5} **Al\u0131c\u0131:** <@${targetUser.id}>
> \u{1F4B0} **Miktar:** **${amount} Nights Coin**

Kalan bakiyeniz: **${EconomyManager.getBalance(senderId)} Nights Coin**`
  ).setColor("#2ECC71").setFooter({ text: "Nights Ekonomi Bankas\u0131 \u2022 Made by erencix" }).setTimestamp();
  await interaction.reply({ embeds: [embed] });
}

// src/commands/itiraf.ts
var import_discord31 = require("discord.js");

// src/services/features/confessionManager.ts
var import_discord30 = require("discord.js");

// src/services/features/autoSecurityGuard.ts
var import_discord29 = require("discord.js");
var AutoSecurityGuard = class {
  // Reklam & Davet regexleri
  static inviteRegex = /(discord\.(gg|io|me|li)\/.+|discordapp\.com\/invite\/.+|discord\.com\/invite\/.+|t\.me\/.+|whatsapp\.com\/chat\/.+)/i;
  // Sahte Nitro, Phishing ve Dolandırıcılık linkleri
  static phishingRegex = /(steamcommunit[y|i]|steam-gift|free-nitro|discrod-nitro|discord-gift|dlscord|nitro-gift|airdrop.*crypto|gift-nitro|claim-nitro)/i;
  // Kullanıcı spam takip tablosu
  static spamTracker = /* @__PURE__ */ new Map();
  /**
   * Sadece Ailevi (Anne, Bacı, Sülale) ve Şahsa Yönelik Ağır Hakaretleri Engelleyen Filtre
   * "amk", "siktir", "lan", "aq", "sg", "siktim" gibi genel sohbet argo/ünlemleri SERBESTTİR.
   */
  static isProfane(rawContent) {
    if (!rawContent) return false;
    const lower = rawContent.toLowerCase();
    const normalized = lower.replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c").replace(/0/g, "o").replace(/1/g, "i").replace(/3/g, "e").replace(/4/g, "a").replace(/@/g, "a").replace(/\$/g, "s").replace(/!/g, "i");
    const collapsed = normalized.replace(/[^a-z]/g, "").replace(/(.)\1{2,}/g, "$1$1");
    const fullyCollapsed = normalized.replace(/[^a-z]/g, "").replace(/(.)\1+/g, "$1");
    if (/(anani|anana|ananin|anneni|annenin|anaskm|anacini)/i.test(normalized) || /(anani|anana|ananin|anneni|annenin|anaskm|anacini)/i.test(collapsed)) {
      if (/(sik|am[iı]|sok|koy|avrat|baci|orospu|orosbu|kayayim|skm)/i.test(normalized) || /(sik|ami|sok|koy|avrat|baci|orospu|orosbu|kayayim|skm)/i.test(collapsed)) {
        return true;
      }
    }
    const severeTargetedRoots = [
      "orospu cocug",
      "orospu cocuk",
      "orospu evlad",
      "orosbu cocug",
      "orosbu cocuk",
      "orosbu evlad",
      "kahpe evlad",
      "kahbe evlad",
      "pic kurusu",
      "bacinisi",
      "bacini sik",
      "bacina sok",
      "sulalenisi",
      "sulaleni sik",
      "sulalene koy",
      "sulalene sok",
      "ecdadini",
      "ceddini sik",
      "allahini sik",
      "dinini sik",
      "kitabini sik",
      "seni sikerim",
      "seni sikeyim",
      "senin anani",
      "senin bacini",
      "senin sulaleni",
      "gotveren",
      "gotlek"
    ];
    for (const root of severeTargetedRoots) {
      const rootNorm = root.replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c");
      const rootCollapsed = rootNorm.replace(/\s+/g, "");
      if (normalized.includes(rootNorm) || collapsed.includes(rootCollapsed) || fullyCollapsed.includes(rootCollapsed)) {
        return true;
      }
    }
    const words = normalized.replace(/[^a-z0-9]/g, " ").split(/\s+/).filter(Boolean);
    for (const w of words) {
      const dedup = w.replace(/(.)\1+/g, "$1");
      if (w === "oc" || dedup === "oc" || w === "o\xE7" || dedup === "o\xE7") return true;
    }
    if (/(?:^|\s|[^a-z0-9])o[\.\,\_\*\-\s]*c(?:$|\s|[^a-z0-9])/i.test(normalized)) {
      return true;
    }
    return false;
  }
  static async inspect(message) {
    if (message.author.bot || !message.guild) return false;
    if (!message.content && message.attachments.size === 0) return false;
    const isStaff = Boolean(
      message.member?.permissions.has(import_discord29.PermissionFlagsBits.Administrator) || message.member?.permissions.has(import_discord29.PermissionFlagsBits.ManageMessages) || message.member?.permissions.has(import_discord29.PermissionFlagsBits.ModerateMembers) || message.guild.ownerId === message.author.id
    );
    const content = message.content ? message.content.trim() : "";
    const chName = message.channel.name || "";
    const chId = message.channel.id;
    const isMediaChannel = chName.includes("foto-medya") || chId === "1568644564590268641";
    const isTicketChannel = chName.startsWith("bilet-") || chName.startsWith("ticket-");
    const hasAttachments = message.attachments.size > 0;
    const hasImageLink = /(https?:\/\/[^\s]+(?:\.png|\.jpg|\.jpeg|\.webp|\.gif|\.bmp|\.svg)|cdn\.discordapp\.com\/attachments|media\.discordapp\.net\/attachments)/i.test(content);
    if (!isMediaChannel && !isTicketChannel && (hasAttachments || hasImageLink)) {
      if (!isStaff) {
        try {
          await message.delete();
        } catch (e) {
        }
        try {
          if ("send" in message.channel) {
            const warn = await message.channel.send({
              content: `\u{1F4F8} **${message.author.displayName}**, sunucumuzda foto\u011Fraf ve g\xF6rsel payla\u015F\u0131mlar\u0131 yaln\u0131zca <#1568644564590268641> kanal\u0131nda serbesttir!`
            });
            setTimeout(() => warn.delete().catch(() => {
            }), 5e3);
          }
        } catch (e) {
        }
        return true;
      }
    }
    const userId = message.author.id;
    let reason = "";
    let shouldTimeout = false;
    if (this.isProfane(content)) {
      reason = "K\xFCf\xFCr / Hakaret \u0130\xE7eri\u011Fi";
      shouldTimeout = !isStaff;
    }
    if (!reason && isStaff) {
      return false;
    }
    if (!reason && this.phishingRegex.test(content)) {
      reason = "Zararl\u0131 Ba\u011Flant\u0131 / Sahte Nitro & Phishing";
      shouldTimeout = true;
    } else if (!reason && this.inviteRegex.test(content)) {
      reason = "\u0130zinsiz Reklam / Discord Davet Linki";
    } else if (!reason && message.mentions.users.size + message.mentions.roles.size > 3) {
      reason = "A\u015F\u0131r\u0131 Etiket (Mass Mention) Korumas\u0131";
      shouldTimeout = true;
    } else if (!reason && content.length > 15) {
      const letters = content.replace(/[^a-zA-ZçğıöşüÇĞİÖŞÜ]/g, "");
      if (letters.length > 10) {
        const uppercaseCount = letters.replace(/[^A-ZÇĞİÖŞÜ]/g, "").length;
        if (uppercaseCount / letters.length > 0.85) {
          reason = "A\u015F\u0131r\u0131 B\xFCy\xFCk Harf (Caps Lock) Kullan\u0131m\u0131";
        }
      }
    }
    const isGameChannel = chName.includes("owo") || chName.includes("oyun") || chName.includes("kelime") || chName.includes("bot-komut") || chName.includes("kumar");
    const isGameCommand = /^(owo|w\b|wb|wbj|wh|s\b|c\b|cf|slot|!|\.|\/)/i.test(content.trim());
    if (!reason && !isGameChannel && !isGameCommand) {
      const now = Date.now();
      const userData = this.spamTracker.get(userId) || { timestamps: [], lastMessages: [] };
      userData.timestamps = userData.timestamps.filter((t) => now - t < 3e3);
      userData.timestamps.push(now);
      userData.lastMessages.push(content.toLowerCase());
      if (userData.lastMessages.length > 10) userData.lastMessages.shift();
      const sameCount = userData.lastMessages.filter((m) => m === content.toLowerCase()).length;
      if (userData.timestamps.length >= 8) {
        reason = "A\u015F\u0131r\u0131 H\u0131zl\u0131 Mesaj Sald\u0131r\u0131s\u0131 (Spam Raid)";
        shouldTimeout = true;
      } else if (sameCount >= 8) {
        reason = "A\u015F\u0131r\u0131 Mesaj Tekrarlama (Flood Raid)";
        shouldTimeout = true;
      } else if (userData.timestamps.length >= 5) {
        reason = "H\u0131zl\u0131 Mesaj G\xF6nderimi";
        shouldTimeout = false;
      } else if (sameCount >= 4) {
        reason = "Mesaj Tekrar\u0131";
        shouldTimeout = false;
      }
      this.spamTracker.set(userId, userData);
    }
    if (reason) {
      try {
        await message.delete();
      } catch (e) {
      }
      if (shouldTimeout && !isStaff && message.member) {
        try {
          await message.member.timeout(60 * 1e3, `Nights Guard: ${reason}`);
        } catch (e) {
        }
      }
      try {
        if ("send" in message.channel) {
          if (isStaff) {
            const warn = await message.channel.send({
              content: `\u26A0\uFE0F **${message.author.displayName}** \`[YETK\u0130L\u0130 TEST UYARISI]\`
Mesaj\u0131n\u0131zda **${reason}** tespit edildi!
> \u{1F6E1}\uFE0F *Yetkili oldu\u011Funuz i\xE7in timeout/ceza uygulanmad\u0131. Test ama\xE7l\u0131 koruma uyar\u0131s\u0131d\u0131r.*`
            });
            setTimeout(() => warn.delete().catch(() => {
            }), 6e3);
          } else {
            const timeoutText = shouldTimeout ? " (1 Dakika Susturuldunuz)" : "";
            const warn = await message.channel.send({
              content: `\u{1F6E1}\uFE0F **${message.author.displayName}**, sunucumuzda **${reason}** engellendi!${timeoutText}`
            });
            setTimeout(() => warn.delete().catch(() => {
            }), 4500);
          }
        }
      } catch (e) {
      }
      try {
        const logChannel = message.guild.channels.cache.find(
          (c) => c.name.includes("mod-log") && c.isTextBased()
        );
        if (logChannel) {
          const logEmbed = new import_discord29.EmbedBuilder().setTitle(isStaff ? "\u{1F9EA} [Yetkili Testi] G\xFCvenlik Filtresi Tetiklendi" : "\u{1F6A8} Nights Guard: G\xFCvenlik \u0130hlali Engellendi").setColor(isStaff ? "#F1C40F" : shouldTimeout ? "#992D22" : "#ED4245").addFields(
            {
              name: "\u{1F464} Kullan\u0131c\u0131",
              value: `<@${message.author.id}> (\`${message.author.tag}\`) ${isStaff ? "\u2B50 **(Yetkili / Muaf)**" : ""}`,
              inline: true
            },
            { name: "\u{1F4C1} Kanal", value: `<#${message.channel.id}>`, inline: true },
            { name: "\u{1F6D1} Sebep", value: `**${reason}**`, inline: true },
            {
              name: "\u2696\uFE0F Al\u0131nan Tedbir",
              value: isStaff ? "\u26A0\uFE0F **Mesaj Silindi & Deneme Uyar\u0131s\u0131 Verildi** (Yetkili: Ceza Yok)" : shouldTimeout ? "\u{1F6D1} **Mesaj Silindi + 1 Dk Timeout**" : "\u{1F5D1}\uFE0F **Mesaj Silindi & Uyar\u0131ld\u0131**",
              inline: true
            },
            { name: "\u{1F4AC} Mesaj \u0130\xE7eri\u011Fi", value: `\`\`\`${content.slice(0, 750)}\`\`\``, inline: false }
          ).setFooter({ text: "Nights Guard \u2022 \xDCst D\xFCzey G\xFCvenlik Kalkan\u0131" }).setTimestamp();
          await logChannel.send({ embeds: [logEmbed] });
        }
      } catch (e) {
      }
      return true;
    }
    return false;
  }
};

// src/services/features/confessionManager.ts
var ConfessionManager = class {
  static store = {
    counter: 0,
    confessions: {}
  };
  static loaded = false;
  static load() {
    if (this.loaded) return;
    this.store = PersistentStore.safeReadJson(
      "confessions.json",
      ["assets/confessions.json"],
      { counter: 0, confessions: {} }
    );
    this.loaded = true;
    PersistentStore.registerFlushHandler("ConfessionManager", () => {
      this.save();
    });
  }
  static save() {
    if (!this.loaded) return;
    PersistentStore.atomicSaveJson("confessions.json", this.store);
  }
  static async getConfessionChannel(guild) {
    try {
      const channels = await guild.channels.fetch();
      let ch = channels.find(
        (c) => c && c.isTextBased() && (c.name.includes("itiraf") || c.name.includes("anonim"))
      );
      if (!ch) {
        const me = guild.members.me;
        if (me?.permissions.has(import_discord30.PermissionFlagsBits.ManageChannels)) {
          ch = await guild.channels.create({
            name: "\u{1F92B}\u30FBitiraf-duvar\u0131",
            type: import_discord30.ChannelType.GuildText,
            topic: "Nights Toplulu\u011Fu Anonim \u0130tiraf Duvar\u0131 \u2022 /itiraf yazarak itirafta bulunabilirsiniz!",
            permissionOverwrites: [
              {
                id: guild.id,
                allow: [import_discord30.PermissionFlagsBits.ViewChannel, import_discord30.PermissionFlagsBits.ReadMessageHistory],
                deny: [import_discord30.PermissionFlagsBits.SendMessages]
                // Üyeler sadece butonlara tıklayabilir, itiraflar botla atılır
              }
            ]
          });
          console.log(`[ConfessionManager] #${ch.name} kanal\u0131 otomatik olu\u015Fturuldu.`);
        }
      }
      return ch || null;
    } catch {
      return null;
    }
  }
  static async submit(guild, user, text) {
    this.load();
    const cleanText = text.trim();
    if (cleanText.length < 5) {
      return { success: false, message: "\u0130tiraf\u0131n\u0131z \xE7ok k\u0131sa! En az 5 karakter yazmal\u0131s\u0131n\u0131z." };
    }
    if (cleanText.length > 1e3) {
      return { success: false, message: "\u0130tiraf\u0131n\u0131z 1000 karakter s\u0131n\u0131r\u0131n\u0131 a\u015F\u0131yor!" };
    }
    if (AutoSecurityGuard.isProfane(cleanText)) {
      return {
        success: false,
        message: "\u274C \u0130tiraf\u0131n\u0131z uygunsuz, ailevi veya a\u011F\u0131r \u015Fahsi hakaret i\xE7erdi\u011Fi i\xE7in payla\u015F\u0131lamad\u0131."
      };
    }
    const channel = await this.getConfessionChannel(guild);
    if (!channel) {
      return {
        success: false,
        message: "Sunucuda itiraf kanal\u0131 bulunamad\u0131 veya olu\u015Fturulamad\u0131. L\xFCtfen y\xF6neticiye ba\u015Fvurun."
      };
    }
    this.store.counter = (this.store.counter || 0) + 1;
    const confessionId = this.store.counter;
    const embed = new import_discord30.EmbedBuilder().setTitle(`\u{1F92B} G\u0130ZL\u0130 \u0130T\u0130RAF #${confessionId}`).setDescription(`\`\`\`
"${cleanText}"
\`\`\``).setColor("#8A2BE2").setThumbnail("https://media.giphy.com/media/l41lFw057lAJQMwg0/giphy.gif").addFields(
      {
        name: "\u{1F512} Gizlilik Durumu",
        value: "`%100 Anonim` \u2014 Yazan ki\u015Finin kimli\u011Fi sunucu \xFCyelerine ve sohbete asla if\u015Fa edilmez.",
        inline: true
      },
      {
        name: "\u{1F4C5} G\xF6nderim Tarihi",
        value: `<t:${Math.floor(Date.now() / 1e3)}:R>`,
        inline: true
      }
    ).setFooter({ text: "Nights \u0130tiraf Duvar\u0131 \u2022 Sen de itirafta bulunmak i\xE7in: /itiraf" }).setTimestamp();
    const row = new import_discord30.ActionRowBuilder().addComponents(
      new import_discord30.ButtonBuilder().setCustomId(`confess_love:${confessionId}`).setLabel("\u2764\uFE0F 0").setStyle(import_discord30.ButtonStyle.Secondary),
      new import_discord30.ButtonBuilder().setCustomId(`confess_dislike:${confessionId}`).setLabel("\u{1F494} 0").setStyle(import_discord30.ButtonStyle.Secondary),
      new import_discord30.ButtonBuilder().setCustomId(`confess_shock:${confessionId}`).setLabel("\u{1F631} 0").setStyle(import_discord30.ButtonStyle.Secondary)
    );
    try {
      const sentMsg = await channel.send({ embeds: [embed], components: [row] });
      this.store.confessions[sentMsg.id] = {
        id: confessionId,
        messageId: sentMsg.id,
        reactions: {
          love: [],
          dislike: [],
          shock: []
        }
      };
      this.save();
      return {
        success: true,
        message: `\u2705 \u0130tiraf\u0131n\u0131z gizli olarak <#${channel.id}> kanal\u0131na ba\u015Far\u0131yla iletildi! Kimli\u011Finiz tamamen korunmaktad\u0131r.`,
        channelId: channel.id
      };
    } catch (err) {
      return { success: false, message: `\u0130tiraf g\xF6nderilirken hata olu\u015Ftu: ${err.message}` };
    }
  }
  static async handleButton(interaction) {
    if (!interaction.customId.startsWith("confess_")) return false;
    this.load();
    const parts = interaction.customId.split(":");
    const action = parts[0];
    const msgId = interaction.message.id;
    const userId = interaction.user.id;
    let conf = this.store.confessions[msgId];
    if (!conf) {
      const confId = parseInt(parts[1], 10) || 1;
      conf = {
        id: confId,
        messageId: msgId,
        reactions: { love: [], dislike: [], shock: [] }
      };
      this.store.confessions[msgId] = conf;
    }
    const type = action === "confess_love" ? "love" : action === "confess_dislike" ? "dislike" : "shock";
    const list = conf.reactions[type];
    const existingIdx = list.indexOf(userId);
    if (existingIdx !== -1) {
      list.splice(existingIdx, 1);
    } else {
      conf.reactions.love = conf.reactions.love.filter((id) => id !== userId);
      conf.reactions.dislike = conf.reactions.dislike.filter((id) => id !== userId);
      conf.reactions.shock = conf.reactions.shock.filter((id) => id !== userId);
      conf.reactions[type].push(userId);
    }
    this.save();
    const loveCount = conf.reactions.love.length;
    const dislikeCount = conf.reactions.dislike.length;
    const shockCount = conf.reactions.shock.length;
    const row = new import_discord30.ActionRowBuilder().addComponents(
      new import_discord30.ButtonBuilder().setCustomId(`confess_love:${conf.id}`).setLabel(`\u2764\uFE0F ${loveCount}`).setStyle(conf.reactions.love.includes(userId) ? import_discord30.ButtonStyle.Success : import_discord30.ButtonStyle.Secondary),
      new import_discord30.ButtonBuilder().setCustomId(`confess_dislike:${conf.id}`).setLabel(`\u{1F494} ${dislikeCount}`).setStyle(conf.reactions.dislike.includes(userId) ? import_discord30.ButtonStyle.Danger : import_discord30.ButtonStyle.Secondary),
      new import_discord30.ButtonBuilder().setCustomId(`confess_shock:${conf.id}`).setLabel(`\u{1F631} ${shockCount}`).setStyle(conf.reactions.shock.includes(userId) ? import_discord30.ButtonStyle.Primary : import_discord30.ButtonStyle.Secondary)
    );
    await interaction.update({ components: [row] }).catch(() => {
    });
    return true;
  }
};

// src/commands/itiraf.ts
var data19 = new import_discord31.SlashCommandBuilder().setName("itiraf").setDescription("Sunucuya tamamen anonim ve gizli olarak bir itirafta bulunman\u0131z\u0131 sa\u011Flar.").addStringOption(
  (option) => option.setName("itiraf").setDescription("Anonim olarak payla\u015Fmak istedi\u011Finiz itiraf metni").setRequired(true).setMaxLength(1e3)
);
async function execute19(interaction) {
  const guild = interaction.guild;
  if (!guild) {
    await interaction.reply({
      content: "\u274C Bu komut yaln\u0131zca sunucu i\xE7erisinde kullan\u0131labilir.",
      ephemeral: true
    });
    return;
  }
  const text = interaction.options.getString("itiraf", true);
  await interaction.deferReply({ ephemeral: true });
  const result = await ConfessionManager.submit(guild, interaction.user, text);
  await interaction.editReply({
    content: result.message
  });
}

// src/commands/muzik.ts
var import_discord33 = require("discord.js");

// src/services/features/musicPlayer.ts
var import_voice = require("@discordjs/voice");
var import_discord32 = require("discord.js");
var import_child_process = require("child_process");
var import_path3 = __toESM(require("path"));
var import_fs3 = __toESM(require("fs"));
var yts = require("yt-search");
var MusicPlayer = class _MusicPlayer {
  static queues = /* @__PURE__ */ new Map();
  static async ensureLinuxBinaries() {
    if (process.platform !== "linux") return;
    const https = require("https");
    const zlib2 = require("zlib");
    const downloadGz = (url, dest) => {
      return new Promise((resolve, reject) => {
        https.get(url, { headers: { "User-Agent": "node" } }, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            return downloadGz(res.headers.location, dest).then(resolve).catch(reject);
          }
          if (res.statusCode !== 200) return reject(new Error("HTTP " + res.statusCode));
          const gunzip = zlib2.createGunzip();
          const file = import_fs3.default.createWriteStream(dest);
          res.pipe(gunzip).pipe(file);
          file.on("finish", () => file.close(() => resolve()));
          file.on("error", reject);
        }).on("error", reject);
      });
    };
    const downloadRaw = (url, dest) => {
      return new Promise((resolve, reject) => {
        https.get(url, { headers: { "User-Agent": "node" } }, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            return downloadRaw(res.headers.location, dest).then(resolve).catch(reject);
          }
          if (res.statusCode !== 200) return reject(new Error("HTTP " + res.statusCode));
          const file = import_fs3.default.createWriteStream(dest);
          res.pipe(file);
          file.on("finish", () => file.close(() => resolve()));
          file.on("error", reject);
        }).on("error", reject);
      });
    };
    try {
      if (!import_fs3.default.existsSync("ffmpeg")) {
        console.log("[MusicPlayer] \u{1F427} Linux ortam\u0131 tespit edildi, ffmpeg indiriliyor...");
        await downloadGz("https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-linux-x64.gz", "ffmpeg");
        import_fs3.default.chmodSync("ffmpeg", 493);
        console.log("[MusicPlayer] \u2705 Linux ffmpeg haz\u0131r!");
      } else {
        try {
          import_fs3.default.chmodSync("ffmpeg", 493);
        } catch (e) {
        }
      }
      if (!import_fs3.default.existsSync("yt-dlp")) {
        console.log("[MusicPlayer] \u{1F427} Linux ortam\u0131 tespit edildi, yt-dlp indiriliyor...");
        await downloadRaw("https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp", "yt-dlp");
        import_fs3.default.chmodSync("yt-dlp", 493);
        console.log("[MusicPlayer] \u2705 Linux yt-dlp haz\u0131r!");
      } else {
        try {
          import_fs3.default.chmodSync("yt-dlp", 493);
        } catch (e) {
        }
      }
    } catch (err) {
      console.warn("[MusicPlayer] Linux binary indirme uyar\u0131s\u0131:", err.message);
    }
  }
  static getBinaries() {
    const isWin = process.platform === "win32";
    let ytdlp = isWin ? import_path3.default.resolve("yt-dlp.exe") : import_path3.default.resolve("yt-dlp");
    let ffmpeg = isWin ? import_path3.default.resolve("ffmpeg.exe") : import_path3.default.resolve("ffmpeg");
    if (!import_fs3.default.existsSync(ytdlp)) ytdlp = isWin ? "yt-dlp.exe" : "yt-dlp";
    if (!import_fs3.default.existsSync(ffmpeg)) ffmpeg = isWin ? "ffmpeg.exe" : "ffmpeg";
    if (!isWin) {
      try {
        import_fs3.default.chmodSync(ytdlp, 493);
      } catch (e) {
      }
      try {
        import_fs3.default.chmodSync(ffmpeg, 493);
      } catch (e) {
      }
    }
    return { ytdlp, ffmpeg };
  }
  static updateBotPresence(client) {
    if (!client || !client.user) return;
    try {
      if (!client.ws || client.ws.status !== 0) return;
      let currentSong = null;
      for (const q of this.queues.values()) {
        if (q.songs && q.songs.length > 0 && q.playing) {
          currentSong = q.songs[0];
          break;
        }
      }
      if (currentSong) {
        const title = currentSong.title.length > 100 ? currentSong.title.slice(0, 97) + "..." : currentSong.title;
        client.user.setPresence({
          status: import_discord32.PresenceUpdateStatus.Idle,
          activities: [{ name: title, type: import_discord32.ActivityType.Listening }]
        });
      } else {
        client.user.setStatus("idle");
        client.user.setActivity("Nights Guard \u2022 /cal", { type: import_discord32.ActivityType.Listening });
      }
    } catch (e) {
    }
  }
  static cleanSongTitle(title) {
    return title.replace(/https?:\/\/[^\s]+/g, "").replace(/www\.[^\s]+/g, "").replace(/\/\/.*/g, "").replace(/\[.*?\]/g, "").replace(/\(.*?\)/g, "").replace(/official\s+(video|audio|music\s+video|lyric\s+video)/gi, "").replace(/sözleri|lyric|lyrics|video|klip|audio/gi, "").replace(/[|#@_\*\^~]/g, " ").replace(/\s+/g, " ").trim();
  }
  static async fetchYoutubeOEmbed(url) {
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      const res = await fetch(oembedUrl);
      if (res.ok) {
        const data20 = await res.json();
        return {
          title: data20.title || "",
          author: data20.author_name || "",
          thumbnail: data20.thumbnail_url || ""
        };
      }
    } catch (e) {
    }
    return null;
  }
  static searchSoundCloud(query) {
    const { ytdlp } = this.getBinaries();
    return new Promise((resolve) => {
      const args = [
        "--dump-single-json",
        "--no-playlist",
        `scsearch1:${query}`
      ];
      const p = (0, import_child_process.spawn)(ytdlp, args);
      let out = "";
      p.stdout.on("data", (d) => out += d.toString());
      p.on("close", (code) => {
        if (code === 0 && out.trim()) {
          try {
            const data20 = JSON.parse(out.trim());
            const entry = data20.entries && data20.entries.length > 0 ? data20.entries[0] : data20;
            if (entry && (entry.title || entry.webpage_url)) {
              let duration = "Bilinmiyor";
              if (entry.duration) {
                const mins = Math.floor(entry.duration / 60);
                const secs = Math.floor(entry.duration % 60);
                duration = `${mins}:${secs < 10 ? "0" : ""}${secs}`;
              }
              const thumb = entry.thumbnail || (entry.thumbnails && entry.thumbnails.length > 0 ? entry.thumbnails[entry.thumbnails.length - 1].url : null);
              return resolve({
                title: entry.title || query,
                url: entry.webpage_url || entry.url || `https://soundcloud.com/search?q=${encodeURIComponent(query)}`,
                duration,
                thumbnail: thumb,
                requesterId: ""
              });
            }
          } catch (e) {
          }
        }
        resolve(null);
      });
      p.on("error", () => resolve(null));
      setTimeout(() => {
        try {
          p.kill();
        } catch (e) {
        }
        resolve(null);
      }, 7e3);
    });
  }
  static getAudioStream(query, songTitle) {
    const { ytdlp, ffmpeg } = this.getBinaries();
    const extractStream = (target, isSoundCloud = false) => {
      return new Promise((resolve, reject) => {
        const args = isSoundCloud ? ["-f", "bestaudio/b/best", "-g", "--no-playlist", target] : [
          "-f",
          "ba/bestaudio/b[height<=360]/best",
          "-g",
          "--no-playlist",
          "--default-search",
          "ytsearch",
          target
        ];
        const proc = (0, import_child_process.spawn)(ytdlp, args);
        let out = "";
        let err = "";
        proc.stdout.on("data", (d) => out += d.toString());
        proc.stderr.on("data", (d) => err += d.toString());
        proc.on("close", (code) => {
          const directUrl = out.trim().split("\n").filter((l) => l.startsWith("http"))[0];
          if (code === 0 && directUrl) {
            resolve(directUrl);
          } else {
            reject(new Error(err || "Ses ba\u011Flant\u0131s\u0131 al\u0131namad\u0131"));
          }
        });
        proc.on("error", reject);
        setTimeout(() => {
          try {
            proc.kill();
          } catch (e) {
          }
          reject(new Error("Ses kayna\u011F\u0131 zaman a\u015F\u0131m\u0131na u\u011Frad\u0131"));
        }, 9e3);
      });
    };
    return new Promise(async (resolve, reject) => {
      let directUrl = "";
      const isSC = query.includes("soundcloud.com") || query.startsWith("scsearch");
      if (isSC) {
        try {
          directUrl = await extractStream(query, true);
        } catch (scErr) {
          return reject(new Error(`SoundCloud hatas\u0131: ${scErr.message}`));
        }
      } else {
        try {
          directUrl = await extractStream(query, false);
        } catch (ytErr) {
          console.warn(`[MusicPlayer] \u26A0\uFE0F YouTube k\u0131s\u0131tlamas\u0131 alg\u0131land\u0131, SoundCloud yede\u011Fine ge\xE7iliyor...`);
          const rawTitle = songTitle || query;
          const cleanQuery = _MusicPlayer.cleanSongTitle(rawTitle) || rawTitle.replace(/https?:\/\/[^\s]+/g, "").trim();
          const targetSearch = `scsearch1:${cleanQuery || "pop music"}`;
          console.log(`[MusicPlayer] \u{1F50D} SoundCloud \xFCzerinde par\xE7a aran\u0131yor: "${cleanQuery}"`);
          try {
            directUrl = await extractStream(targetSearch, true);
            console.log(`[MusicPlayer] \u2705 SoundCloud \xFCzerinden par\xE7a ba\u015Far\u0131yla ba\u011Fland\u0131!`);
          } catch (scErr) {
            console.error(`[MusicPlayer] SoundCloud aramas\u0131 da yan\u0131t vermedi:`, scErr.message);
            return reject(new Error(`M\xFCzik kayna\u011F\u0131na ula\u015F\u0131lamad\u0131. L\xFCtfen \u015Fark\u0131 ad\u0131n\u0131 veya direkt SoundCloud linkini deneyin.`));
          }
        }
      }
      const ff = (0, import_child_process.spawn)(ffmpeg, [
        "-reconnect",
        "1",
        "-reconnect_streamed",
        "1",
        "-reconnect_delay_max",
        "5",
        "-i",
        directUrl,
        "-f",
        "s16le",
        "-ar",
        "48000",
        "-ac",
        "2",
        "pipe:1"
      ]);
      ff.on("error", (err) => {
        console.error("[MusicPlayer FFmpeg Process Error]:", err);
      });
      resolve({ stream: ff.stdout, process: ff });
    });
  }
  static async playSong(guildId, song, client) {
    const queue = this.queues.get(guildId);
    if (!queue) return;
    if (queue.streamProcess) {
      try {
        queue.streamProcess.kill();
      } catch (e) {
      }
      queue.streamProcess = null;
    }
    if (!song) {
      queue.playing = false;
      this.updateBotPresence(client);
      if (queue.textChannel && "send" in queue.textChannel) {
        queue.textChannel.send("\u23F9\uFE0F **\xC7alma listesi tamamland\u0131.** Bot bekleme moduna ge\xE7ti.").catch(() => {
        });
      }
      if (queue.timeout) clearTimeout(queue.timeout);
      queue.timeout = setTimeout(() => {
        const currentQ = this.queues.get(guildId);
        if (currentQ && currentQ.songs.length === 0) {
          if (currentQ.connection) {
            try {
              currentQ.connection.destroy();
            } catch (e) {
            }
          }
          this.queues.delete(guildId);
          this.updateBotPresence(client);
        }
      }, 3e4);
      return;
    }
    if (queue.timeout) {
      clearTimeout(queue.timeout);
      queue.timeout = null;
    }
    try {
      const { stream, process: ffProcess } = await this.getAudioStream(song.url || song.title, song.title);
      queue.streamProcess = ffProcess;
      const resource = (0, import_voice.createAudioResource)(stream, {
        inputType: import_voice.StreamType.Raw,
        inlineVolume: true
      });
      if (resource.volume) {
        resource.volume.setVolume(queue.volume / 100);
      }
      queue.resource = resource;
      queue.player.play(resource);
      queue.playing = true;
      this.updateBotPresence(client);
      if (queue.textChannel && "send" in queue.textChannel) {
        const nowEmbed = new import_discord32.EmbedBuilder().setTitle("\u{1F3B6} \u015Eimdi \xC7al\u0131yor").setDescription(`**[${song.title}](${song.url})**`).setColor("#5865F2").addFields(
          { name: "\u23F1\uFE0F S\xFCre", value: song.duration || "Bilinmiyor", inline: true },
          { name: "\u{1F464} \u0130steyen", value: `<@${song.requesterId}>`, inline: true },
          { name: "\u{1F50A} Ses Seviyesi", value: `%${queue.volume}`, inline: true }
        ).setFooter({ text: "Nights Guard M\xFCzik Motoru \u2022 Made by erencix" }).setTimestamp();
        if (song.thumbnail) {
          nowEmbed.setThumbnail(song.thumbnail);
        }
        queue.textChannel.send({ embeds: [nowEmbed], components: [this.getMusicControlsRow()] }).catch(() => {
        });
      }
    } catch (err) {
      console.error("[MusicPlayer] \xC7alma hatas\u0131:", err.message);
      if (queue.textChannel && "send" in queue.textChannel) {
        queue.textChannel.send(`\u26A0\uFE0F **${song.title}** \xE7al\u0131n\u0131rken bir hata olu\u015Ftu: ${err.message}. S\u0131radaki par\xE7aya ge\xE7iliyor...`).catch(() => {
        });
      }
      queue.songs.shift();
      this.playSong(guildId, queue.songs[0], client);
    }
  }
  static async handlePlay(target, query, client) {
    const isInteraction = !!target.interaction;
    const member = target.interaction?.member || target.message?.member;
    const guild = target.interaction?.guild || target.message?.guild;
    const channel = target.interaction?.channel || target.message?.channel;
    if (!member || !guild || !channel) return;
    if (isInteraction && !target.interaction.deferred && !target.interaction.replied) {
      await target.interaction.deferReply().catch(() => {
      });
    }
    const voiceChannel = member.voice?.channel;
    if (!voiceChannel) {
      const msg = "\u274C M\xFCzik \xE7alabilmek i\xE7in bir ses kanal\u0131nda olmal\u0131s\u0131n\u0131z!";
      if (isInteraction) {
        if (target.interaction.deferred) {
          await target.interaction.editReply({ content: msg }).catch(() => {
          });
        } else {
          await target.interaction.reply({ content: msg, flags: import_discord32.MessageFlags.Ephemeral }).catch(() => {
          });
        }
      } else if (target.message) {
        await target.message.reply(msg).catch(() => {
        });
      }
      return;
    }
    let songInfo = null;
    try {
      const isYtUrl = query.includes("youtube.com") || query.includes("youtu.be");
      const isScUrl = query.includes("soundcloud.com");
      if (isYtUrl) {
        const oembed = await this.fetchYoutubeOEmbed(query);
        if (oembed && oembed.title) {
          songInfo = {
            title: oembed.title,
            url: query,
            duration: "YouTube Par\xE7as\u0131",
            thumbnail: oembed.thumbnail,
            requesterId: member.id
          };
        } else {
          const idMatch = query.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
          if (idMatch && idMatch[1]) {
            try {
              const v = await yts({ videoId: idMatch[1] });
              if (v && v.title) {
                songInfo = {
                  title: v.title,
                  url: v.url,
                  duration: v.timestamp || "Bilinmiyor",
                  thumbnail: v.thumbnail,
                  requesterId: member.id
                };
              }
            } catch (e) {
            }
          }
        }
      } else if (isScUrl) {
        songInfo = await this.searchSoundCloud(query);
        if (songInfo) songInfo.requesterId = member.id;
      }
      if (!songInfo) {
        try {
          const search = await yts(query);
          if (search && search.videos && search.videos.length > 0) {
            const v = search.videos[0];
            songInfo = {
              title: v.title,
              url: v.url,
              duration: v.timestamp,
              thumbnail: v.thumbnail,
              requesterId: member.id
            };
          }
        } catch (e) {
        }
      }
      if (!songInfo) {
        console.log(`[MusicPlayer] YouTube aramas\u0131nda bulunamad\u0131, SoundCloud aran\u0131yor: "${query}"`);
        songInfo = await this.searchSoundCloud(query);
        if (songInfo) songInfo.requesterId = member.id;
      }
      if (!songInfo && (query.startsWith("http://") || query.startsWith("https://"))) {
        songInfo = {
          title: query,
          url: query,
          duration: "Canl\u0131 / Ak\u0131\u015F",
          thumbnail: null,
          requesterId: member.id
        };
      }
      if (!songInfo) {
        const msg = "\u274C Arad\u0131\u011F\u0131n\u0131z \u015Fark\u0131 bulunamad\u0131. L\xFCtfen \u015Fark\u0131 ad\u0131 veya linkini kontrol edin.";
        if (isInteraction) {
          if (target.interaction.deferred) await target.interaction.editReply(msg).catch(() => {
          });
          else await target.interaction.reply({ content: msg, flags: import_discord32.MessageFlags.Ephemeral }).catch(() => {
          });
        } else if (target.message) {
          await target.message.reply(msg).catch(() => {
          });
        }
        return;
      }
      let queue = this.queues.get(guild.id);
      if (!queue) {
        const connection = (0, import_voice.joinVoiceChannel)({
          channelId: voiceChannel.id,
          guildId: guild.id,
          adapterCreator: guild.voiceAdapterCreator,
          selfDeaf: false,
          selfMute: false
        });
        const player = (0, import_voice.createAudioPlayer)();
        queue = {
          textChannel: channel,
          voiceChannelId: voiceChannel.id,
          connection,
          player,
          songs: [],
          volume: 100,
          playing: true,
          loopMode: "off",
          resource: null,
          streamProcess: null,
          timeout: null
        };
        this.queues.set(guild.id, queue);
        connection.subscribe(player);
        player.on(import_voice.AudioPlayerStatus.Idle, () => {
          const q = this.queues.get(guild.id);
          if (q && q.songs.length > 0) {
            if (q.loopMode === "track") {
              this.playSong(guild.id, q.songs[0], client);
            } else if (q.loopMode === "queue") {
              const finished = q.songs.shift();
              if (finished) q.songs.push(finished);
              this.playSong(guild.id, q.songs[0], client);
            } else {
              q.songs.shift();
              this.playSong(guild.id, q.songs[0], client);
            }
          }
        });
        player.on("error", (err) => {
          console.error("[MusicPlayer Player Error]:", err.message);
          const q = this.queues.get(guild.id);
          if (q && q.songs.length > 0) {
            q.songs.shift();
            this.playSong(guild.id, q.songs[0], client);
          }
        });
        connection.on(import_voice.VoiceConnectionStatus.Disconnected, async () => {
          try {
            await Promise.race([
              (0, import_voice.entersState)(connection, import_voice.VoiceConnectionStatus.Signalling, 5e3),
              (0, import_voice.entersState)(connection, import_voice.VoiceConnectionStatus.Connecting, 5e3)
            ]);
          } catch {
            if (queue?.streamProcess) {
              try {
                queue.streamProcess.kill();
              } catch (e) {
              }
            }
            connection.destroy();
            this.queues.delete(guild.id);
            this.updateBotPresence(client);
          }
        });
        queue.songs.push(songInfo);
        const startMsg = `\u{1F3B6} **${songInfo.title}** a\xE7\u0131l\u0131yor...`;
        if (isInteraction) {
          if (target.interaction.deferred) await target.interaction.editReply(startMsg).catch(() => {
          });
          else await target.interaction.reply({ content: startMsg }).catch(() => {
          });
        } else if (target.message) {
          await target.message.reply(startMsg).catch(() => {
          });
        }
        this.playSong(guild.id, queue.songs[0], client);
      } else {
        queue.songs.push(songInfo);
        const queueEmbed = new import_discord32.EmbedBuilder().setTitle("\u2705 Kuyru\u011Fa Eklendi").setDescription(`**[${songInfo.title}](${songInfo.url})**`).setColor("#2ECC71").addFields(
          { name: "\u23F1\uFE0F S\xFCre", value: songInfo.duration || "Bilinmiyor", inline: true },
          { name: "\u{1F4CD} S\u0131ra", value: `${queue.songs.length}. s\u0131ra`, inline: true },
          { name: "\u{1F464} \u0130steyen", value: `<@${songInfo.requesterId}>`, inline: true }
        );
        if (songInfo.thumbnail) queueEmbed.setThumbnail(songInfo.thumbnail);
        if (isInteraction) {
          if (target.interaction.deferred) await target.interaction.editReply({ embeds: [queueEmbed] }).catch(() => {
          });
          else await target.interaction.reply({ embeds: [queueEmbed] }).catch(() => {
          });
        } else if (target.message) {
          await target.message.reply({ embeds: [queueEmbed] }).catch(() => {
          });
        }
        if (!queue.playing && queue.songs.length === 1) {
          this.playSong(guild.id, queue.songs[0], client);
        }
      }
    } catch (err) {
      console.error("[MusicPlayer handlePlay Error]:", err);
      const errMsg = `\u274C M\xFCzik ba\u015Flat\u0131l\u0131rken bir hata olu\u015Ftu: ${err.message}`;
      if (isInteraction) await target.interaction.editReply(errMsg).catch(() => {
      });
      else if (target.message) await target.message.reply(errMsg).catch(() => {
      });
    }
  }
  static pause(guildId) {
    const q = this.queues.get(guildId);
    if (!q || !q.playing) return false;
    q.player.pause();
    q.playing = false;
    return true;
  }
  static resume(guildId) {
    const q = this.queues.get(guildId);
    if (!q || q.playing) return false;
    q.player.unpause();
    q.playing = true;
    return true;
  }
  static skip(guildId, client) {
    const q = this.queues.get(guildId);
    if (!q || q.songs.length === 0) return false;
    q.songs.shift();
    this.playSong(guildId, q.songs[0] || null, client);
    return true;
  }
  static stop(guildId, client) {
    const q = this.queues.get(guildId);
    if (!q) return false;
    q.songs = [];
    if (q.streamProcess) {
      try {
        q.streamProcess.kill();
      } catch (e) {
      }
    }
    q.player.stop();
    if (q.connection) {
      try {
        q.connection.destroy();
      } catch (e) {
      }
    }
    this.queues.delete(guildId);
    this.updateBotPresence(client);
    return true;
  }
  static setVolume(guildId, volume) {
    const q = this.queues.get(guildId);
    if (!q) return false;
    const clamped = Math.max(1, Math.min(150, volume));
    q.volume = clamped;
    if (q.resource && q.resource.volume) {
      q.resource.volume.setVolume(clamped / 100);
    }
    return true;
  }
  static toggleLoop(guildId) {
    const q = this.queues.get(guildId);
    if (!q) return "off";
    if (q.loopMode === "off") q.loopMode = "track";
    else if (q.loopMode === "track") q.loopMode = "queue";
    else q.loopMode = "off";
    return q.loopMode;
  }
  static getMusicControlsRow() {
    return new import_discord32.ActionRowBuilder().addComponents(
      new import_discord32.ButtonBuilder().setCustomId("btn_music_play_pause").setLabel("Oynat / Duraklat").setEmoji("\u23EF\uFE0F").setStyle(import_discord32.ButtonStyle.Primary),
      new import_discord32.ButtonBuilder().setCustomId("btn_music_skip").setLabel("Ge\xE7").setEmoji("\u23ED\uFE0F").setStyle(import_discord32.ButtonStyle.Secondary),
      new import_discord32.ButtonBuilder().setCustomId("btn_music_stop").setLabel("Durdur").setEmoji("\u23F9\uFE0F").setStyle(import_discord32.ButtonStyle.Danger),
      new import_discord32.ButtonBuilder().setCustomId("btn_music_loop").setLabel("D\xF6ng\xFC").setEmoji("\u{1F501}").setStyle(import_discord32.ButtonStyle.Secondary),
      new import_discord32.ButtonBuilder().setCustomId("btn_music_queue").setLabel("S\u0131ra").setEmoji("\u{1F4DC}").setStyle(import_discord32.ButtonStyle.Secondary)
    );
  }
  static getMusicControls() {
    return this.getMusicControlsRow();
  }
  static getMusicInfoEmbed() {
    return this.getMusicPanelEmbed();
  }
  static getMusicVolumeRow() {
    return new import_discord32.ActionRowBuilder().addComponents(
      new import_discord32.ButtonBuilder().setCustomId("btn_music_vol_down").setLabel("Ses -%10").setEmoji("\u{1F509}").setStyle(import_discord32.ButtonStyle.Secondary),
      new import_discord32.ButtonBuilder().setCustomId("btn_music_vol_up").setLabel("Ses +%10").setEmoji("\u{1F50A}").setStyle(import_discord32.ButtonStyle.Secondary)
    );
  }
  static getMusicPanelEmbed() {
    return new import_discord32.EmbedBuilder().setTitle("\u{1F3B5} NIGHTS GUARD HI-FI M\xDCZ\u0130K MERKEZ\u0130 \u{1F3A7}").setDescription(
      "Y\xFCksek kaliteli (384kbps), kesintisiz ve ak\u0131ll\u0131 YouTube & SoundCloud m\xFCzik \xE7alar\u0131m\u0131z emrinizde!\n\n### \u{1F4CC} Nas\u0131l \u015Eark\u0131 A\xE7\u0131l\u0131r?\n\u2022 `/cal <\u015Fark\u0131 ad\u0131 veya link>` \u2014 YouTube veya par\xE7a ad\u0131n\u0131 yazarak an\u0131nda a\xE7abilirsiniz.\n\u2022 `!cal <\u015Fark\u0131>` veya `!play <\u015Fark\u0131>` \u2014 H\u0131zl\u0131 metin komutu ile \u015Fark\u0131y\u0131 ba\u015Flat\u0131r.\n\n### \u{1F39B}\uFE0F \u0130nteraktif Kontroller:\nA\u015Fa\u011F\u0131daki butonlar\u0131 kullanarak \xE7alan \u015Fark\u0131y\u0131 tek t\u0131kla duraklatabilir, ge\xE7ebilir, d\xF6ng\xFCye alabilir veya sesini ayarlayabilirsiniz.\n\n> \u{1F4A1} *Ses kanal\u0131nda kimse kalmad\u0131\u011F\u0131nda bot kaynak tasarrufu i\xE7in otomatik olarak bekleme moduna ge\xE7er.*"
    ).setImage("https://media.giphy.com/media/26tn3334mvoVClhos/giphy.gif").setColor("#8B5CF6").setFooter({ text: "Nights Guard Audio Engine \u2022 Made by erencix" });
  }
  static async handleMusicButton(interaction, client) {
    const guildId = interaction.guildId;
    if (!guildId) return;
    const q = this.queues.get(guildId);
    const member = interaction.member;
    if (!member?.voice?.channel) {
      await interaction.reply({ content: "\u274C M\xFCzik kontrollerini kullanabilmek i\xE7in bir ses kanal\u0131nda olmal\u0131s\u0131n\u0131z!", flags: import_discord32.MessageFlags.Ephemeral }).catch(() => {
      });
      return;
    }
    const id = interaction.customId;
    if (id === "btn_music_play_pause") {
      if (!q) {
        await interaction.reply({ content: "\u26A0\uFE0F \u015Eu anda \xE7alan bir \u015Fark\u0131 bulunmuyor.", flags: import_discord32.MessageFlags.Ephemeral }).catch(() => {
        });
        return;
      }
      if (q.playing) {
        this.pause(guildId);
        await interaction.reply({ content: "\u23F8\uFE0F M\xFCzik duraklat\u0131ld\u0131.", flags: import_discord32.MessageFlags.Ephemeral }).catch(() => {
        });
      } else {
        this.resume(guildId);
        await interaction.reply({ content: "\u25B6\uFE0F M\xFCzik devam ettiriliyor.", flags: import_discord32.MessageFlags.Ephemeral }).catch(() => {
        });
      }
      return;
    }
    if (id === "btn_music_skip") {
      if (!q || q.songs.length === 0) {
        await interaction.reply({ content: "\u26A0\uFE0F S\u0131rada ge\xE7ilecek \u015Fark\u0131 bulunmuyor.", flags: import_discord32.MessageFlags.Ephemeral }).catch(() => {
        });
        return;
      }
      this.skip(guildId, client);
      await interaction.reply({ content: "\u23ED\uFE0F S\u0131radaki \u015Fark\u0131ya ge\xE7ildi.", flags: import_discord32.MessageFlags.Ephemeral }).catch(() => {
      });
      return;
    }
    if (id === "btn_music_stop") {
      if (!q) {
        await interaction.reply({ content: "\u26A0\uFE0F Bot zaten herhangi bir ses kanal\u0131nda \xE7alm\u0131yor.", flags: import_discord32.MessageFlags.Ephemeral }).catch(() => {
        });
        return;
      }
      this.stop(guildId, client);
      await interaction.reply({ content: "\u23F9\uFE0F M\xFCzik durduruldu ve \xE7alma listesi s\u0131f\u0131rland\u0131.", flags: import_discord32.MessageFlags.Ephemeral }).catch(() => {
      });
      return;
    }
    if (id === "btn_music_loop") {
      if (!q) {
        await interaction.reply({ content: "\u26A0\uFE0F \u015Eu anda \xE7alan bir \u015Fark\u0131 bulunmuyor.", flags: import_discord32.MessageFlags.Ephemeral }).catch(() => {
        });
        return;
      }
      const mode = this.toggleLoop(guildId);
      const modeStr = mode === "track" ? "\u{1F502} Tek \u015Eark\u0131 D\xF6ng\xFCs\xFC" : mode === "queue" ? "\u{1F501} Liste D\xF6ng\xFCs\xFC" : "\u27A1\uFE0F D\xF6ng\xFC Kapal\u0131";
      await interaction.reply({ content: `D\xF6ng\xFC modu: **${modeStr}**`, flags: import_discord32.MessageFlags.Ephemeral }).catch(() => {
      });
      return;
    }
    if (id === "btn_music_queue") {
      if (!q || q.songs.length === 0) {
        await interaction.reply({ content: "\u{1F4ED} \xC7alma listesinde bekleyen \u015Fark\u0131 yok.", flags: import_discord32.MessageFlags.Ephemeral }).catch(() => {
        });
        return;
      }
      let desc = "";
      q.songs.slice(0, 10).forEach((s, idx) => {
        desc += `${idx === 0 ? "\u25B6\uFE0F" : `**#${idx + 1}**`} [${s.title}](${s.url}) (\`${s.duration}\`)
`;
      });
      if (q.songs.length > 10) desc += `*...ve ${q.songs.length - 10} par\xE7a daha.*`;
      const embed = new import_discord32.EmbedBuilder().setTitle(`\u{1F4DC} \xC7alma Listesi (${q.songs.length} Par\xE7a)`).setDescription(desc).setColor("#5865F2").setFooter({ text: `Ses: %${q.volume} \u2022 D\xF6ng\xFC: ${q.loopMode}` });
      await interaction.reply({ embeds: [embed], flags: import_discord32.MessageFlags.Ephemeral }).catch(() => {
      });
      return;
    }
    if (id === "btn_music_vol_up") {
      if (!q) {
        await interaction.reply({ content: "\u26A0\uFE0F \u015Eu anda \xE7alan bir \u015Fark\u0131 bulunmuyor.", flags: import_discord32.MessageFlags.Ephemeral }).catch(() => {
        });
        return;
      }
      this.setVolume(guildId, q.volume + 10);
      await interaction.reply({ content: `\u{1F50A} Ses seviyesi art\u0131r\u0131ld\u0131: **%${q.volume}**`, flags: import_discord32.MessageFlags.Ephemeral }).catch(() => {
      });
      return;
    }
    if (id === "btn_music_vol_down") {
      if (!q) {
        await interaction.reply({ content: "\u26A0\uFE0F \u015Eu anda \xE7alan bir \u015Fark\u0131 bulunmuyor.", flags: import_discord32.MessageFlags.Ephemeral }).catch(() => {
        });
        return;
      }
      this.setVolume(guildId, q.volume - 10);
      await interaction.reply({ content: `\u{1F509} Ses seviyesi d\xFC\u015F\xFCr\xFCld\xFC: **%${q.volume}**`, flags: import_discord32.MessageFlags.Ephemeral }).catch(() => {
      });
      return;
    }
  }
};

// src/commands/muzik.ts
var calData = new import_discord33.SlashCommandBuilder().setName("cal").setDescription("YouTube veya SoundCloud \xFCzerinden \u015Fark\u0131 arar ve ses kanal\u0131nda \xE7alar.").addStringOption(
  (option) => option.setName("sarki").setDescription("\u015Eark\u0131 ad\u0131 veya video linki").setRequired(true)
);
var durdurData = new import_discord33.SlashCommandBuilder().setName("durdur").setDescription("\xC7alan m\xFCzi\u011Fi duraklat\u0131r.");
var devamData = new import_discord33.SlashCommandBuilder().setName("devam").setDescription("Duraklat\u0131lan m\xFCzi\u011Fi devam ettirir.");
var gecData = new import_discord33.SlashCommandBuilder().setName("gec").setDescription("S\u0131radaki \u015Fark\u0131ya ge\xE7er.");
var kuyrukData = new import_discord33.SlashCommandBuilder().setName("kuyruk").setDescription("\xC7alma listesini g\xF6r\xFCnt\xFCler.");
var ayrilData = new import_discord33.SlashCommandBuilder().setName("ayril").setDescription("Botu ses kanal\u0131ndan \xE7\u0131kar\u0131r ve listeyi temizler.");
var sesData = new import_discord33.SlashCommandBuilder().setName("ses").setDescription("M\xFCzik ses seviyesini ayarlar (1-150).").addIntegerOption(
  (option) => option.setName("seviye").setDescription("Ses seviyesi (1 - 150)").setRequired(true).setMinValue(1).setMaxValue(150)
);
async function executeCal(interaction) {
  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferReply().catch(() => {
    });
  }
  const query = interaction.options.getString("sarki", true);
  await MusicPlayer.handlePlay({ interaction }, query, interaction.client);
}
async function executeDurdur(interaction) {
  const guildId = interaction.guildId;
  if (!guildId) return;
  const ok = MusicPlayer.pause(guildId);
  await interaction.reply({
    content: ok ? "\u23F8\uFE0F M\xFCzik duraklat\u0131ld\u0131. Devam ettirmek i\xE7in `/devam` kullanabilirsiniz." : "\u26A0\uFE0F \u015Eu anda \xE7alan aktif bir m\xFCzik yok.",
    flags: import_discord33.MessageFlags.Ephemeral
  }).catch(() => {
  });
}
async function executeDevam(interaction) {
  const guildId = interaction.guildId;
  if (!guildId) return;
  const ok = MusicPlayer.resume(guildId);
  await interaction.reply({
    content: ok ? "\u25B6\uFE0F M\xFCzik devam ettiriliyor." : "\u26A0\uFE0F Duraklat\u0131lm\u0131\u015F bir m\xFCzik bulunmuyor.",
    flags: import_discord33.MessageFlags.Ephemeral
  }).catch(() => {
  });
}
async function executeGec(interaction) {
  const guildId = interaction.guildId;
  if (!guildId) return;
  const ok = MusicPlayer.skip(guildId, interaction.client);
  await interaction.reply({
    content: ok ? "\u23ED\uFE0F S\u0131radaki \u015Fark\u0131ya ge\xE7ildi." : "\u26A0\uFE0F S\u0131rada ge\xE7ilecek \u015Fark\u0131 yok.",
    flags: import_discord33.MessageFlags.Ephemeral
  }).catch(() => {
  });
}
async function executeKuyruk(interaction) {
  const guildId = interaction.guildId;
  if (!guildId) return;
  const q = MusicPlayer.queues.get(guildId);
  if (!q || q.songs.length === 0) {
    await interaction.reply({ content: "\u{1F4ED} \xC7alma listesinde \u015Fark\u0131 bulunmuyor.", flags: import_discord33.MessageFlags.Ephemeral }).catch(() => {
    });
    return;
  }
  let desc = "";
  q.songs.slice(0, 10).forEach((s, idx) => {
    desc += `${idx === 0 ? "\u25B6\uFE0F" : `**#${idx + 1}**`} [${s.title}](${s.url}) (\`${s.duration}\`)
`;
  });
  if (q.songs.length > 10) desc += `*...ve ${q.songs.length - 10} \u015Fark\u0131 daha.*`;
  await interaction.reply({
    embeds: [
      {
        title: `\u{1F4DC} Sunucu \xC7alma Listesi (${q.songs.length} Par\xE7a)`,
        description: desc,
        color: 5793266,
        footer: { text: `Ses: %${q.volume} \u2022 D\xF6ng\xFC: ${q.loopMode}` }
      }
    ],
    flags: import_discord33.MessageFlags.Ephemeral
  }).catch(() => {
  });
}
async function executeAyril(interaction) {
  const guildId = interaction.guildId;
  if (!guildId) return;
  const ok = MusicPlayer.stop(guildId, interaction.client);
  await interaction.reply({
    content: ok ? "\u23F9\uFE0F M\xFCzik durduruldu ve kanaldan ayr\u0131l\u0131narak liste s\u0131f\u0131rland\u0131." : "\u26A0\uFE0F Bot ses kanal\u0131nda bulunmuyor.",
    flags: import_discord33.MessageFlags.Ephemeral
  }).catch(() => {
  });
}
async function executeSes(interaction) {
  const guildId = interaction.guildId;
  if (!guildId) return;
  const level = interaction.options.getInteger("seviye", true);
  const ok = MusicPlayer.setVolume(guildId, level);
  await interaction.reply({
    content: ok ? `\u{1F50A} Ses seviyesi **%${level}** olarak ayarland\u0131.` : "\u26A0\uFE0F \xC7alan bir m\xFCzik bulunmuyor.",
    flags: import_discord33.MessageFlags.Ephemeral
  }).catch(() => {
  });
}

// src/services/features/socialManager.ts
var import_discord34 = require("discord.js");
var SocialManager = class {
  static marriages = [];
  static pendingProposals = /* @__PURE__ */ new Map();
  static loaded = false;
  static load() {
    if (this.loaded) return;
    this.marriages = PersistentStore.safeReadJson(
      "marriages.json",
      ["assets/marriages.json"],
      []
    );
    this.loaded = true;
    PersistentStore.registerFlushHandler("SocialManager", () => {
      this.save();
    });
  }
  static save() {
    if (!this.loaded) return;
    PersistentStore.atomicSaveJson("marriages.json", this.marriages);
  }
  static getMarriage(userId) {
    this.load();
    const record = this.marriages.find((m) => m.user1 === userId || m.user2 === userId);
    if (!record) return null;
    const partnerId = record.user1 === userId ? record.user2 : record.user1;
    const days = Math.floor((Date.now() - record.marriedAt) / (1e3 * 60 * 60 * 24));
    return { partnerId, marriedAt: record.marriedAt, days };
  }
  static async propose(sender, target, message) {
    this.load();
    if (sender.id === target.id) {
      await message.reply("\u274C Kendinizle evlenemezsiniz!").catch(() => {
      });
      return;
    }
    if (target.bot) {
      await message.reply("\u274C Botlarla evlenemezsiniz kral!").catch(() => {
      });
      return;
    }
    const senderMarriage = this.getMarriage(sender.id);
    if (senderMarriage) {
      await message.reply(`\u274C Zaten <@${senderMarriage.partnerId}> ile evlisiniz! Bo\u015Fanmak i\xE7in: \`!bosan\``).catch(() => {
      });
      return;
    }
    const targetMarriage = this.getMarriage(target.id);
    if (targetMarriage) {
      await message.reply(`\u274C <@${target.id}> zaten <@${targetMarriage.partnerId}> ile evli!`).catch(() => {
      });
      return;
    }
    const proposalKey = `${sender.id}_${target.id}`;
    this.pendingProposals.set(proposalKey, {
      senderId: sender.id,
      targetId: target.id,
      expiresAt: Date.now() + 6e4
    });
    const embed = new import_discord34.EmbedBuilder().setTitle("\u{1F48D} B\u0130R EVL\u0130L\u0130K TEKL\u0130F\u0130 VAR!").setDescription(
      `\u{1F496} <@${target.id}>, <@${sender.id}> sana b\xFCt\xFCn kalbiyle bir \xF6m\xFCr boyu mutluluk vaat eden bir evlilik teklifinde bulundu!

Bu teklifi kabul ediyor musun?`
    ).setColor("#FF69B4").setThumbnail("https://media.giphy.com/media/26vUxJ9rqfwuIEkTu/giphy.gif").setFooter({ text: "Teklif 60 saniye boyunca ge\xE7erlidir \u2022 Nights Social" }).setTimestamp();
    const row = new import_discord34.ActionRowBuilder().addComponents(
      new import_discord34.ButtonBuilder().setCustomId(`marry_accept:${sender.id}:${target.id}`).setLabel("\u{1F48D} Evet, Kabul Ediyorum!").setStyle(import_discord34.ButtonStyle.Success),
      new import_discord34.ButtonBuilder().setCustomId(`marry_reject:${sender.id}:${target.id}`).setLabel("\u{1F494} Hay\u0131r").setStyle(import_discord34.ButtonStyle.Danger)
    );
    await message.reply({ embeds: [embed], components: [row] }).catch(() => {
    });
  }
  static async handleButton(interaction) {
    if (!interaction.customId.startsWith("marry_")) return false;
    const parts = interaction.customId.split(":");
    const action = parts[0];
    const senderId = parts[1];
    const targetId = parts[2];
    if (interaction.user.id !== targetId) {
      await interaction.reply({
        content: "\u26D4 Bu teklif sizin i\xE7in yap\u0131lmad\u0131!",
        ephemeral: true
      });
      return true;
    }
    if (action === "marry_reject") {
      const rejectEmbed = new import_discord34.EmbedBuilder().setTitle("\u{1F494} Teklif Reddedildi...").setDescription(`<@${targetId}>, <@${senderId}> ki\u015Fisinin evlilik teklifini nazik\xE7e geri \xE7evirdi.`).setColor("#ED4245");
      await interaction.update({ embeds: [rejectEmbed], components: [] });
      return true;
    }
    if (action === "marry_accept") {
      this.load();
      this.marriages.push({
        user1: senderId,
        user2: targetId,
        marriedAt: Date.now()
      });
      this.save();
      const acceptEmbed = new import_discord34.EmbedBuilder().setTitle("\u{1F389} MUTLULUKLAR! EVLEND\u0130LER! \u{1F48D}").setDescription(
        `\u{1F38A} Tebrikler! <@${senderId}> ve <@${targetId}> art\u0131k resmen evli bir \xE7ift!

> \u{1F4C5} **Evlilik Tarihi:** <t:${Math.floor(Date.now() / 1e3)}:D>
> \u{1F4DC} Evlilik c\xFCzdan\u0131n\u0131z\u0131 g\xF6rmek i\xE7in: \`!evlilik\``
      ).setColor("#FF1493").setImage("https://media.giphy.com/media/DyQrKMpqkAhNHZ1iWe/giphy.gif").setFooter({ text: "Nights Evlilik Dairesi \u2022 Made by erencix" }).setTimestamp();
      await interaction.update({ embeds: [acceptEmbed], components: [] });
      return true;
    }
    return false;
  }
  static divorce(userId) {
    this.load();
    const idx = this.marriages.findIndex((m) => m.user1 === userId || m.user2 === userId);
    if (idx === -1) {
      return { success: false, message: "\u015Eu anda evli de\u011Filsiniz!" };
    }
    const partnerId = this.marriages[idx].user1 === userId ? this.marriages[idx].user2 : this.marriages[idx].user1;
    this.marriages.splice(idx, 1);
    this.save();
    return {
      success: true,
      message: `\u{1F494} <@${partnerId}> ile olan evlili\u011Finizi resmi olarak sonland\u0131rd\u0131n\u0131z. Art\u0131k bekars\u0131n\u0131z.`
    };
  }
  static getMarriageEmbed(targetUser) {
    const info = this.getMarriage(targetUser.id);
    if (!info) {
      return new import_discord34.EmbedBuilder().setTitle(`\u{1F4DC} Evlilik C\xFCzdan\u0131 \u2022 ${targetUser.displayName}`).setDescription(`> \u{1F494} **Durum:** Bekar
> Evlenmek i\xE7in birine \`!evlen @kullan\u0131c\u0131\` yazabilirsin!`).setColor("#95A5A6").setThumbnail(targetUser.displayAvatarURL());
    }
    return new import_discord34.EmbedBuilder().setTitle(`\u{1F496} RESM\u0130 EVL\u0130L\u0130K C\xDCZDANI`).setDescription(
      `> \u{1F470}\u{1F935} **\xC7ift:** <@${targetUser.id}> & <@${info.partnerId}>
> \u{1F4C5} **Evlilik Tarihi:** <t:${Math.floor(info.marriedAt / 1e3)}:D>
> \u23F3 **Birlikte Ge\xE7en S\xFCre:** **${info.days} g\xFCn** (${info.days === 0 ? "Bug\xFCn evlendiler! \u{1F389}" : `${info.days} g\xFCnd\xFCr birlikteler \u2728`})
> \u{1F48D} **Durum:** Sonsuza Dek Birlikte! \u{1F495}`
    ).setColor("#FF69B4").setThumbnail("https://media.giphy.com/media/26vUxJ9rqfwuIEkTu/giphy.gif").setFooter({ text: "Nights Evlilik Sicili \u2022 Made by erencix" }).setTimestamp();
  }
  // GIF İfadeleri
  static GIFS = {
    hug: [
      "https://media.giphy.com/media/od5H3PmEG5EVq/giphy.gif",
      "https://media.giphy.com/media/lrr9rHuoJOE0w/giphy.gif",
      "https://media.giphy.com/media/VGACXbkf0AeGs/giphy.gif"
    ],
    slap: [
      "https://media.giphy.com/media/Gf3AUz3eBNbTW/giphy.gif",
      "https://media.giphy.com/media/jLeyZWgtwWP2U/giphy.gif",
      "https://media.giphy.com/media/Zau0yrl15jD\u3044\u305F\u3060/giphy.gif"
    ],
    kiss: [
      "https://media.giphy.com/media/FqBTvSNjNzeZG/giphy.gif",
      "https://media.giphy.com/media/zkppEMFvRX5FC/giphy.gif",
      "https://media.giphy.com/media/flmwZUuJnMnWE/giphy.gif"
    ],
    coffee: [
      "https://media.giphy.com/media/13HgwGsXF0aiGY/giphy.gif",
      "https://media.giphy.com/media/hPTZgtzfRIB5Nfb5rL/giphy.gif"
    ]
  };
  static getActionEmbed(action, sender, target) {
    const list = this.GIFS[action] || this.GIFS.hug;
    const gif = list[Math.floor(Math.random() * list.length)];
    const configs = {
      hug: {
        title: "\u{1F917} S\u0131ms\u0131k\u0131 Sar\u0131lma!",
        desc: `\u{1F496} <@${sender.id}>, <@${target.id}> ki\u015Fisine sevgiyle s\u0131ms\u0131k\u0131 sar\u0131ld\u0131!`,
        color: "#FFB6C1"
      },
      slap: {
        title: "\u{1F44B} \u015Elak! Okkal\u0131 Bir Tokat!",
        desc: `\u{1F4A5} <@${sender.id}>, <@${target.id}> surat\u0131na okkal\u0131 bir tokat patlatt\u0131!`,
        color: "#E74C3C"
      },
      kiss: {
        title: "\u{1F48B} Tatl\u0131 Bir \xD6p\xFCc\xFCk!",
        desc: `\u2728 <@${sender.id}>, <@${target.id}> yana\u011F\u0131na tatl\u0131 bir \xF6p\xFCc\xFCk kondurdu!`,
        color: "#FF1493"
      },
      coffee: {
        title: "\u2615 S\u0131cak Bir Kahve \u0130kram\u0131!",
        desc: `\u2615 <@${sender.id}>, <@${target.id}> i\xE7in s\u0131cac\u0131k duman\u0131 t\xFCten bir kahve \u0131smarlad\u0131! Afiyet olsun!`,
        color: "#D35400"
      }
    };
    const cfg = configs[action];
    return new import_discord34.EmbedBuilder().setTitle(cfg.title).setDescription(cfg.desc).setColor(cfg.color).setImage(gif).setFooter({ text: "Nights Sosyal \u0130fadeler \u2022 Made by erencix" }).setTimestamp();
  }
};

// src/events/interactionCreate.ts
var eventClickUsers = /* @__PURE__ */ new Set();
var InteractionHandler = class {
  aiManager;
  deployer;
  cleaner;
  logoStudio;
  constructor(aiManager) {
    this.aiManager = aiManager;
    this.deployer = new ServerDeployer();
    this.cleaner = new ServerCleaner();
    this.logoStudio = new LogoStudio();
  }
  async handle(interaction) {
    try {
      const isPublicInteraction = interaction.isButton() && (interaction.customId === "btn_kayit_basla" || interaction.customId.startsWith("btn_cinsiyet_") || interaction.customId === "btn_event_click" || interaction.customId.startsWith("btn_voice_") || interaction.customId.startsWith("marry_") || interaction.customId.startsWith("confess_") || interaction.customId.startsWith("btn_music_") || interaction.customId === "ticket_open" || interaction.customId === "ticket_close") || interaction.isModalSubmit() && (interaction.customId.startsWith("modal_kayit_") || interaction.customId === "modal_voice_rename") || interaction.isChatInputCommand() && [
        "rank",
        "seviye",
        "top",
        "liderlik",
        "yardim",
        "avatar",
        "sunucu",
        "afk",
        "sil",
        "istatistik",
        "kullanici",
        "gonder",
        "itiraf",
        "cal",
        "durdur",
        "devam",
        "gec",
        "kuyruk",
        "ayril",
        "ses"
      ].includes(interaction.commandName);
      if (!isPublicInteraction) {
        const ownerId = config.ownerId || process.env.OWNER_ID || "1138498666785677492";
        const isServerAdmin = interaction.member?.permissions?.has(import_discord35.PermissionFlagsBits.Administrator);
        if (interaction.user.id !== ownerId && !isServerAdmin) {
          if (interaction.isRepliable()) {
            await interaction.reply({
              content: `\u26D4 **Eri\u015Fim Engellendi:** Bu komut yaln\u0131zca sunucu y\xF6neticileri veya bot sahibi (<@${ownerId}>) taraf\u0131ndan kullan\u0131labilir!`,
              flags: import_discord35.MessageFlags.Ephemeral
            }).catch(() => {
            });
          }
          return;
        }
      }
      if (interaction.isChatInputCommand()) {
        await this.handleChatInput(interaction);
      } else if (interaction.isButton()) {
        await this.handleButton(interaction);
      } else if (interaction.isModalSubmit()) {
        await this.handleModalSubmit(interaction);
      }
    } catch (err) {
      console.error("[InteractionHandler] Genel hata:", err);
      try {
        if (interaction.isRepliable()) {
          if (interaction.deferred) {
            await interaction.editReply({
              content: `\u274C Bir hata olu\u015Ftu: ${err.message}`
            }).catch(() => {
            });
          } else if (!interaction.replied) {
            await interaction.reply({
              content: `\u274C Bir hata olu\u015Ftu: ${err.message}`,
              flags: import_discord35.MessageFlags.Ephemeral
            }).catch(() => {
            });
          }
        }
      } catch (e) {
      }
    }
  }
  async handleChatInput(interaction) {
    const { commandName } = interaction;
    switch (commandName) {
      case "kur":
      case "ai-kur":
        await execute2(interaction, this.aiManager);
        break;
      case "plan":
        await execute6(interaction, this.aiManager);
        break;
      case "logo":
      case "ai-logo":
        await execute(interaction);
        break;
      case "onizle":
      case "ai-onizle":
        await execute3(interaction, this.aiManager);
        break;
      case "boost":
        await execute7(interaction);
        break;
      case "teamwork":
        await execute8(interaction);
        break;
      case "browser":
        await execute9(interaction);
        break;
      case "sunucu-temizle":
        await execute4(interaction);
        break;
      case "yardim":
        await execute5(interaction);
        break;
      case "davet":
        await execute10(interaction);
        break;
      case "mesajg\xF6nder":
      case "mesajgonder":
        await execute11(interaction);
        break;
      case "rank":
      case "seviye":
        await executeRank(interaction);
        break;
      case "top":
      case "liderlik":
        await executeTop(interaction);
        break;
      case "seviye-ayarla":
        await executeSeviyeAyarla(interaction);
        break;
      case "sil":
        await execute12(interaction);
        break;
      case "avatar":
        await execute13(interaction);
        break;
      case "sunucu":
        await execute14(interaction);
        break;
      case "afk":
        await execute15(interaction);
        break;
      case "istatistik":
        await execute16(interaction);
        break;
      case "kullanici":
        await execute17(interaction);
        break;
      case "gonder":
        await execute18(interaction);
        break;
      case "itiraf":
        await execute19(interaction);
        break;
      case "cal":
        await executeCal(interaction);
        break;
      case "durdur":
        await executeDurdur(interaction);
        break;
      case "devam":
        await executeDevam(interaction);
        break;
      case "gec":
        await executeGec(interaction);
        break;
      case "kuyruk":
        await executeKuyruk(interaction);
        break;
      case "ayril":
        await executeAyril(interaction);
        break;
      case "ses":
        await executeSes(interaction);
        break;
      default:
        await interaction.reply({ content: "Bilinmeyen komut.", ephemeral: true });
        break;
    }
  }
  async handleButton(interaction) {
    const customId = interaction.customId;
    if (customId === "ticket_open") {
      await TicketManager.handleTicketOpen(interaction);
      return;
    }
    if (customId === "ticket_close") {
      await TicketManager.handleTicketClose(interaction);
      return;
    }
    if (customId.startsWith("marry_")) {
      await SocialManager.handleButton(interaction);
      return;
    }
    if (customId.startsWith("confess_")) {
      await ConfessionManager.handleButton(interaction);
      return;
    }
    if (customId.startsWith("btn_music_")) {
      await MusicPlayer.handleMusicButton(interaction, interaction.client);
      return;
    }
    if (customId.startsWith("build_confirm:")) {
      const cacheId = customId.split(":")[1];
      const pending = BlueprintCache.get(cacheId);
      if (!pending) {
        await interaction.reply({
          content: "\u26A0\uFE0F Bu kurulum oturumunun s\xFCresi dolmu\u015F veya iptal edilmi\u015F. L\xFCtfen `/kur` ile yeniden deneyin.",
          ephemeral: true
        });
        return;
      }
      if (!interaction.memberPermissions?.has(import_discord35.PermissionFlagsBits.Administrator)) {
        await interaction.reply({
          content: "\u274C Sadece y\xF6neticiler kurulumu ba\u015Flatabilir.",
          ephemeral: true
        });
        return;
      }
      const diagnostics = ServerDiagnostics.check(interaction.guild);
      if (!diagnostics.canDeploy) {
        await interaction.reply({
          content: "\u26A0\uFE0F **Kurulum ba\u015Flat\u0131lamad\u0131! Bot yetkileri veya rol hiyerar\u015Fisi eksik.**",
          embeds: [diagnostics.troubleshootingEmbed],
          ephemeral: true
        });
        return;
      }
      await interaction.deferUpdate();
      const initialEmbed = new import_discord35.EmbedBuilder().setTitle("\u{1F680} Sunucu Mimarisi \u0130n\u015Fa Ediliyor...").setDescription(`### \`${renderProgressBar(5, 10)} Haz\u0131rlan\u0131yor...\`

> \u2699\uFE0F **Durum:** Sunucu \u015Femas\u0131 ve yetkiler do\u011Frulan\u0131yor...`).setColor("#5865F2").setFooter({ text: "Nights Guard \u2022 Made by erencix" }).setTimestamp();
      await interaction.editReply({
        content: "",
        embeds: [initialEmbed],
        components: []
      });
      const startTime = Date.now();
      let lastProgressUpdate = 0;
      try {
        const report = await this.deployer.deploy(
          interaction.guild,
          pending.blueprint,
          {
            cleanSlate: pending.cleanSlate,
            applyLogo: pending.applyLogo,
            applyName: true,
            preserveChannelId: interaction.channelId
          },
          async (status, percent) => {
            const now = Date.now();
            const isMilestone = percent === 5 || percent === 40 || percent === 80 || percent === 100;
            if (!isMilestone && now - lastProgressUpdate < 1200) {
              return;
            }
            lastProgressUpdate = now;
            const progressBar = renderProgressBar(percent, 10);
            const progressLine = `${progressBar} ${status}`;
            const progressEmbed = new import_discord35.EmbedBuilder().setTitle("\u{1F3D7}\uFE0F Sunucu Mimarisi \u0130n\u015Fa Ediliyor...").setDescription(`### \`${progressBar}\`

> \u{1F504} **A\u015Fama:** **${status}**

\u23F3 *L\xFCtfen bekleyin, Discord API h\u0131z limitlerine uygun olarak s\u0131rayla kuruluyor...*`).setColor("#5865F2").addFields(
              { name: "\u{1F4CA} \u0130lerleme Durumu", value: `\`\`\`text
${progressLine}
\`\`\``, inline: false },
              { name: "\u{1F3F0} Hedef Sunucu", value: `**${pending.blueprint.serverName}**`, inline: true },
              { name: "\u23F1\uFE0F Ge\xE7en S\xFCre", value: `${Math.round((Date.now() - startTime) / 1e3)}s`, inline: true }
            ).setFooter({ text: "Nights Guard \u2022 Made by erencix" }).setTimestamp();
            try {
              await interaction.editReply({
                content: "",
                embeds: [progressEmbed],
                components: []
              });
            } catch (ignore) {
            }
          }
        );
        BlueprintCache.delete(cacheId);
        const durationSec = Math.round((Date.now() - startTime) / 1e3);
        const successEmbed = new import_discord35.EmbedBuilder().setTitle("\u{1F389} SUNUCU KURULUMU BA\u015EARIYLA TAMAMLANDI!").setDescription(
          `### \`${renderProgressBar(100, 10)} Logo y\xFCklendi & AutoMod kurallar\u0131 aktif edildi!\`

**${pending.blueprint.serverName}** ba\u015Far\u0131yla kuruldu ve hizmete haz\u0131r hale getirildi!
S\xFCre: **${durationSec} saniye**`
        ).setColor("#2ECC71").addFields(
          { name: "\u{1F6E1}\uFE0F Olu\u015Fturulan Roller", value: `${report.rolesCreated} Adet`, inline: true },
          { name: "\u{1F4C1} Olu\u015Fturulan Kanallar", value: `${report.channelsCreated} Adet`, inline: true },
          { name: "\u{1F916} AutoMod Kurallar\u0131", value: `${report.automodRulesCreated} Adet`, inline: true },
          { name: "\u{1F4DC} Yerle\u015Ftirilen Embedler", value: `${report.embedsPosted} Adet`, inline: true },
          { name: "\u{1F3A8} Logo Durumu", value: report.logoApplied ? "\u2705 Uyguland\u0131" : "Uygulanmad\u0131", inline: true },
          { name: "\u26A0\uFE0F Kar\u015F\u0131la\u015F\u0131lan Uyar\u0131lar", value: report.errors.length ? `${report.errors.length} adet (Loglarda)` : "0 Hata", inline: true }
        ).setFooter({ text: "Nights Guard \u2022 Made by erencix" }).setTimestamp();
        await interaction.editReply({
          content: "\u2705 **T\xFCm i\u015Flemler ba\u015Far\u0131yla sonu\xE7land\u0131!**",
          embeds: [successEmbed],
          components: []
        });
      } catch (deployErr) {
        console.error("Deployment error:", deployErr);
        const failDiag = ServerDiagnostics.check(interaction.guild);
        if (!failDiag.healthy) {
          await interaction.editReply({
            content: `\u274C **Kurulum s\u0131ras\u0131nda yetkilendirme hatas\u0131 meydana geldi:** ${deployErr.message}`,
            embeds: [failDiag.troubleshootingEmbed],
            components: []
          });
        } else {
          await interaction.editReply({
            content: `\u274C Kurulum s\u0131ras\u0131nda bir hata meydana geldi: ${deployErr.message}`,
            components: []
          });
        }
      }
      return;
    }
    if (customId.startsWith("build_details:")) {
      const cacheId = customId.split(":")[1];
      const pending = BlueprintCache.get(cacheId);
      if (!pending) {
        await interaction.reply({ content: "Oturum bulunamad\u0131.", ephemeral: true });
        return;
      }
      const jsonStr = JSON.stringify(pending.blueprint, null, 2);
      const snippet = jsonStr.slice(0, 1900);
      await interaction.reply({
        content: `\u{1F4CB} **M\u0130MAR\u0130 PLANI (JSON KES\u0130T\u0130):**
\`\`\`json
${snippet}
\`\`\``,
        ephemeral: true
      });
      return;
    }
    if (customId.startsWith("build_cancel:")) {
      const cacheId = customId.split(":")[1];
      BlueprintCache.delete(cacheId);
      await interaction.update({
        content: "\u274C **Kurulum i\u015Flemi iptal edildi.** Herhangi bir de\u011Fi\u015Fiklik yap\u0131lmad\u0131.",
        embeds: [],
        components: []
      });
      return;
    }
    if (customId.startsWith("apply_logo:")) {
      const logoId = customId.split(":")[1];
      const cached = pendingLogoCache.get(logoId);
      if (!cached) {
        await interaction.reply({ content: "Logo verisi bulunamad\u0131 veya s\xFCresi doldu.", ephemeral: true });
        return;
      }
      if (!interaction.memberPermissions?.has(import_discord35.PermissionFlagsBits.ManageGuild)) {
        await interaction.reply({ content: "\u274C Sunucuyu Y\xF6net yetkiniz yok.", ephemeral: true });
        return;
      }
      await interaction.deferReply({ ephemeral: true });
      try {
        await this.logoStudio.applyIconToGuild(interaction.guild, cached.buffer);
        pendingLogoCache.delete(logoId);
        await interaction.editReply({ content: "\u2705 Sunucu ikonu ba\u015Far\u0131yla g\xFCncellendi!" });
      } catch (err) {
        await interaction.editReply({ content: `\u274C Logo g\xFCncellenemedi: ${err.message}` });
      }
      return;
    }
    if (customId.startsWith("wipe_confirm:")) {
      if (!interaction.memberPermissions?.has(import_discord35.PermissionFlagsBits.Administrator)) {
        await interaction.reply({ content: "\u274C Bu i\u015Flemi yaln\u0131zca Y\xF6neticiler ger\xE7ekle\u015Ftirebilir.", ephemeral: true });
        return;
      }
      await interaction.deferUpdate();
      await interaction.editReply({
        content: "\u{1F4A3} **Sunucu temizleniyor... L\xFCtfen bekleyin.**",
        embeds: [],
        components: []
      });
      try {
        const stats = await this.cleaner.purgeServer(
          interaction.guild,
          { preserveChannelId: interaction.channelId },
          async (msg) => {
            try {
              await interaction.editReply({ content: `\u{1F9F9} ${msg}` });
            } catch (e) {
            }
          }
        );
        await interaction.editReply({
          content: `\u2705 **Temizlik Tamamland\u0131!**
\u2022 Silinen Kanal/Kategori: **${stats.channelsDeleted}**
\u2022 Silinen Rol: **${stats.rolesDeleted}**
Sunucu s\u0131f\u0131rland\u0131 ve yeni kuruluma haz\u0131r hale getirildi. Art\u0131k \`/kur\` veya \`/plan\` komutunu kullanabilirsiniz.`
        });
      } catch (err) {
        await interaction.editReply({
          content: `\u274C Temizlik s\u0131ras\u0131nda hata: ${err.message}`
        });
      }
      return;
    }
    if (customId === "wipe_cancel") {
      await interaction.update({
        content: "\u{1F6E1}\uFE0F **Temizleme i\u015Flemi iptal edildi.** Hi\xE7bir kanal veya rol silinmedi.",
        embeds: [],
        components: []
      });
      return;
    }
    if (customId === "btn_kayit_basla") {
      await interaction.deferReply({ ephemeral: true });
      const member = interaction.member;
      if (!member || !interaction.guild) return;
      const roles = await interaction.guild.roles.fetch();
      const waitingRole = roles.find(
        (r) => r.name.includes("Cinsiyet Bekleyen") || r.name.includes("Kay\u0131t Bekleyen")
      );
      if (waitingRole) {
        await member.roles.add(waitingRole).catch(() => {
        });
      }
      await interaction.editReply({
        content: "\u2705 **\u0130lk do\u011Frulama ad\u0131m\u0131n\u0131z tamamland\u0131!**\n\u015Eimdi size \xF6zel olarak a\xE7\u0131lan **#cinsiyet-secimi** kanal\u0131na ge\xE7erek cinsiyetinizi se\xE7iniz."
      });
      return;
    }
    if (customId === "btn_cinsiyet_erkek" || customId === "btn_cinsiyet_kiz") {
      const isMale = customId === "btn_cinsiyet_erkek";
      const modal = new import_discord35.ModalBuilder().setCustomId(isMale ? "modal_kayit_erkek" : "modal_kayit_kiz").setTitle(`\u{1F4DD} Nights Kay\u0131t (${isMale ? "Erkek" : "K\u0131z"})`);
      const nameInput = new import_discord35.TextInputBuilder().setCustomId("input_isim").setLabel("\u0130sminiz").setStyle(import_discord35.TextInputStyle.Short).setPlaceholder("\xD6rn: Eren").setRequired(true).setMaxLength(20);
      const ageInput = new import_discord35.TextInputBuilder().setCustomId("input_yas").setLabel("Ya\u015F\u0131n\u0131z (\u0130ste\u011Fe ba\u011Fl\u0131)").setStyle(import_discord35.TextInputStyle.Short).setPlaceholder("\xD6rn: 19").setRequired(false).setMaxLength(3);
      modal.addComponents(
        new import_discord35.ActionRowBuilder().addComponents(nameInput),
        new import_discord35.ActionRowBuilder().addComponents(ageInput)
      );
      await interaction.showModal(modal);
      return;
    }
    if (customId === "btn_event_click") {
      const userId = interaction.user.id;
      if (eventClickUsers.has(userId)) {
        await interaction.reply({
          content: `\u26A0\uFE0F **Zaten t\u0131klad\u0131n\u0131z!**
\u015Eu anki toplam: **${eventClickUsers.size} / 30**. Di\u011Fer arkada\u015Flar\u0131n\u0131z\u0131 da \xE7a\u011F\u0131r\u0131n, 30'a ula\u015Fal\u0131m!`,
          ephemeral: true
        });
        return;
      }
      eventClickUsers.add(userId);
      const count = eventClickUsers.size;
      const target = 30;
      const percent = Math.min(100, Math.round(count / target * 100));
      const progressBar = renderProgressBar(percent, 10);
      const isCompleted = count >= target;
      const currentEmbed = interaction.message.embeds[0];
      const updatedEmbed = import_discord35.EmbedBuilder.from(currentEmbed).setDescription(
        `\u{1F381} **30 TIKLAMA B\xDCY\xDCK EVENT\u0130!** \u{1F525}

A\u015Fa\u011F\u0131daki butona t\u0131klayarak sayac\u0131 art\u0131r\u0131n. Toplam **30 farkl\u0131 \xFCye** t\u0131klad\u0131\u011F\u0131nda sunucuda b\xFCy\xFCk s\xFCrpriz \xE7ekili\u015F ve \xF6d\xFCller aktifle\u015Fecek!

\u{1F4CA} **\u0130lerleme:** \`${progressBar} ${count} / ${target} T\u0131klama (%${percent})\`

` + (isCompleted ? "\u{1F451} **HEDEFE ULA\u015EILDI! B\xDCY\xDCK EVENT VE \xC7EK\u0130L\u0130\u015E BA\u015ELADI!** \u{1F389}" : "\u{1F525} *Herkes bir kez t\u0131klayabilir. Arkada\u015Flar\u0131n\u0131 davet et!*")
      ).setColor(isCompleted ? "#2ECC71" : "#E67E22");
      const updatedRow = new import_discord35.ActionRowBuilder().addComponents(
        new import_discord35.ButtonBuilder().setCustomId("btn_event_click").setLabel(isCompleted ? "\u{1F389} HEDEFE ULA\u015EILDI (30/30)" : `\u{1F525} TIKLA! (${count}/30)`).setStyle(isCompleted ? import_discord35.ButtonStyle.Success : import_discord35.ButtonStyle.Primary).setEmoji(isCompleted ? "\u{1F451}" : "\u{1F525}").setDisabled(isCompleted)
      );
      await interaction.update({
        embeds: [updatedEmbed],
        components: [updatedRow]
      });
      if (isCompleted) {
        const ownerId = config.ownerId || "1138498666785677492";
        if (interaction.channel && "send" in interaction.channel) {
          await interaction.channel.send({
            content: `\u{1F451} <@${ownerId}> kral click me bitti event istiyoruz :D`
          });
          eventClickUsers.clear();
          const nextTarget = 30;
          const newEmbed = new import_discord35.EmbedBuilder().setTitle("\u{1F381} 30 TIKLAMA B\xDCY\xDCK EVENT\u0130! \u{1F525}").setDescription(
            `Hey @everyone! \xD6nceki 30 t\u0131klama hedefi ba\u015Far\u0131yla tamamland\u0131! \u{1F38A}

\u015Eimdi **yeni event** i\xE7in t\u0131klama sayac\u0131 s\u0131f\u0131rland\u0131. A\u015Fa\u011F\u0131daki butona basarak s\u0131radaki hedefe katk\u0131da bulunun!

\u{1F4CA} **\u0130lerleme:** \`[\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591] 0 / ${nextTarget} T\u0131klama (%0)\`

\u{1F525} *Hedef 30 oldu\u011Funda kral erencix'e an\u0131nda bildirim gidecek!*`
          ).setImage("https://media.giphy.com/media/26tn3334mvoVClhos/giphy.gif").setColor("#E67E22").setFooter({ text: "Nights Community Event \u2022 Made by erencix" });
          const newRow = new import_discord35.ActionRowBuilder().addComponents(
            new import_discord35.ButtonBuilder().setCustomId("btn_event_click").setLabel("\u{1F525} TIKLA! (0/30)").setStyle(import_discord35.ButtonStyle.Primary).setEmoji("\u{1F525}")
          );
          await interaction.channel.send({
            embeds: [newEmbed],
            components: [newRow]
          });
        }
      }
      return;
    }
    if (customId.startsWith("btn_voice_")) {
      await VoicePanelManager.handleVoiceButton(interaction);
      return;
    }
  }
  async handleModalSubmit(interaction) {
    if (interaction.customId === "modal_voice_rename") {
      await VoicePanelManager.handleVoiceModal(interaction);
      return;
    }
    if (interaction.customId.startsWith("modal_kayit_")) {
      await interaction.deferReply({ ephemeral: true });
      const isMale = interaction.customId === "modal_kayit_erkek";
      const isim = interaction.fields.getTextInputValue("input_isim").trim();
      const yas = interaction.fields.getTextInputValue("input_yas").trim();
      const member = interaction.member;
      const guild = interaction.guild;
      if (!member || !guild) return;
      const formattedNick = `\u260A ${isim}${yas ? " | " + yas : ""}`.slice(0, 32);
      const roles = await guild.roles.fetch();
      const maleRole = roles.find((r) => r.name.toLowerCase() === "erkek" || r.name.includes("Erkek"));
      const femaleRole = roles.find((r) => r.name.toLowerCase() === "k\u0131z" || r.name.includes("K\u0131z"));
      const memberRole = roles.find((r) => r.name.toLowerCase() === "\xFCye" || r.name.includes("\xDCye") && !r.name.includes("Onayl\u0131"));
      const approvedRole = roles.find((r) => r.name.toLowerCase() === "onayl\u0131" || r.name.includes("Onayl\u0131"));
      const targetGenderRole = isMale ? maleRole : femaleRole;
      const rolesToAdd = [targetGenderRole, memberRole, approvedRole].filter(Boolean);
      const freshMember = await guild.members.fetch(member.id).catch(() => member);
      const waitingRoles = roles.filter(
        (r) => r.name.toLowerCase().includes("bekleyen") || r.name.toLowerCase().includes("kay\u0131ts\u0131z") || r.name.toLowerCase().includes("cinsiyet bekleyen") || r.name.toLowerCase().includes("kay\u0131t bekleyen")
      );
      for (const [, wRole] of waitingRoles) {
        if (freshMember.roles.cache.has(wRole.id)) {
          await freshMember.roles.remove(wRole).catch((err) => console.warn(`[Kay\u0131t] ${wRole.name} silinemedi:`, err.message));
        }
      }
      if (rolesToAdd.length > 0) {
        await freshMember.roles.add(rolesToAdd).catch((err) => console.warn("[Kay\u0131t] Rol eklenemedi:", err.message));
      }
      await freshMember.setNickname(formattedNick).catch((err) => console.warn("[Kay\u0131t] Nick de\u011Fi\u015Ftirilemedi:", err.message));
      await interaction.editReply({
        content: `\u{1F389} **Tebrikler ${isim}! Kayd\u0131n\u0131z ba\u015Far\u0131yla tamamland\u0131.**
Art\u0131k kay\u0131t odalar\u0131 sizden gizlendi ve t\xFCm sohbet, medya ve oyun odalar\u0131na eri\u015Febilirsiniz! Aram\u0131za ho\u015F geldin!`
      });
      const logChannel = guild.channels.cache.find(
        (c) => c.name.includes("kayit-log") && c.isTextBased()
      );
      if (logChannel) {
        const logEmbed = new import_discord35.EmbedBuilder().setTitle("\u{1F4E5} Yeni \xDCye Kayd\u0131 Tamamland\u0131").setColor(isMale ? "#3498DB" : "#E91E63").addFields(
          { name: "\u{1F464} \xDCye", value: `<@${member.id}> (\`${member.user.tag}\`)`, inline: true },
          { name: "\u{1F6BB} Cinsiyet", value: isMale ? "\u{1F466} Erkek" : "\u{1F467} K\u0131z", inline: true },
          { name: "\u{1F4DD} Yeni \u0130sim", value: `\`${formattedNick}\``, inline: true }
        ).setThumbnail(member.user.displayAvatarURL()).setFooter({ text: "Nights Guard \u2022 Kay\u0131t Sistemi" }).setTimestamp();
        logChannel.send({ embeds: [logEmbed] }).catch(() => {
        });
      }
    }
  }
};

// src/events/ready.ts
var import_discord37 = require("discord.js");

// src/services/features/voiceSetupManager.ts
var import_discord36 = require("discord.js");
var VoiceSetupManager = class {
  static ran = false;
  static async ensureEnhancedVoiceChannels(client) {
    if (this.ran) return;
    this.ran = true;
    for (const [_, guild] of client.guilds.cache) {
      try {
        await this.setupGuildChannels(guild);
      } catch (err) {
        console.error(`[VoiceSetupManager] ${guild.name} i\xE7in kanal kurulum hatas\u0131:`, err.message);
      }
    }
  }
  static async setupGuildChannels(guild) {
    console.log(`[VoiceSetupManager] \u{1F399}\uFE0F ${guild.name} sunucusu i\xE7in zengin ses kanallar\u0131 kontrol ediliyor...`);
    const everyoneRole = guild.roles.everyone;
    const roles = await guild.roles.fetch();
    const kurucuRole = roles.find((r) => r.name.toLowerCase().includes("kurucu") || r.name.toLowerCase().includes("owner"));
    const adminRole = roles.find((r) => r.name.toLowerCase().includes("y\xF6netici") || r.name.toLowerCase().includes("admin"));
    const modRole = roles.find((r) => r.name.toLowerCase().includes("moderat\xF6r") || r.name.toLowerCase().includes("mod"));
    const approvedRole = roles.find((r) => r.name.toLowerCase().includes("onayl\u0131") || r.name.toLowerCase().includes("\xFCye"));
    const getOrCreateCategory = async (name, overwrites = []) => {
      const existing = guild.channels.cache.find(
        (c) => c.type === import_discord36.ChannelType.GuildCategory && (c.name === name || c.name.toLowerCase().includes(name.toLowerCase().slice(3)))
      );
      if (existing) return existing;
      return await guild.channels.create({
        name,
        type: import_discord36.ChannelType.GuildCategory,
        permissionOverwrites: overwrites
      });
    };
    const getOrCreateVoice = async (name, parentId, options = {}) => {
      const existing = guild.channels.cache.find(
        (c) => c.type === import_discord36.ChannelType.GuildVoice && (c.name === name || c.name.toLowerCase().includes(name.toLowerCase().slice(3)))
      );
      if (existing) {
        return existing;
      }
      console.log(`[VoiceSetupManager] \u2795 Yeni ses kanal\u0131 olu\u015Fturuluyor: ${name}`);
      return await guild.channels.create({
        name,
        type: import_discord36.ChannelType.GuildVoice,
        parent: parentId || void 0,
        userLimit: options.userLimit || 0,
        bitrate: options.bitrate || 64e3,
        permissionOverwrites: options.overwrites || []
      });
    };
    const catCinema = await getOrCreateCategory("\u{1F37F} \u2503 S\u0130NEMA & \u0130ZLEME", [
      { id: everyoneRole.id, allow: [import_discord36.PermissionFlagsBits.ViewChannel, import_discord36.PermissionFlagsBits.Connect, import_discord36.PermissionFlagsBits.Speak, import_discord36.PermissionFlagsBits.Stream] }
    ]);
    await getOrCreateVoice("\u{1F37F}\u30FBSinema & Dizi Odas\u0131", catCinema.id, { bitrate: 96e3 });
    await getOrCreateVoice("\u{1F359}\u30FBAnime & Watch Party", catCinema.id, { bitrate: 96e3 });
    const catGaming = await getOrCreateCategory("\u{1F3AF} \u2503 VALORANT & OYUN ODALARI", [
      { id: everyoneRole.id, allow: [import_discord36.PermissionFlagsBits.ViewChannel, import_discord36.PermissionFlagsBits.Connect, import_discord36.PermissionFlagsBits.Speak] }
    ]);
    await getOrCreateVoice("\u{1F3AF}\u30FBValorant Rekabet\xE7i #1", catGaming.id, { userLimit: 5, bitrate: 96e3 });
    await getOrCreateVoice("\u{1F3AF}\u30FBValorant Rekabet\xE7i #2", catGaming.id, { userLimit: 5, bitrate: 96e3 });
    await getOrCreateVoice("\u{1F52B}\u30FBValorant Duo (2 Ki\u015Fi)", catGaming.id, { userLimit: 2, bitrate: 96e3 });
    await getOrCreateVoice("\u{1F3F9}\u30FBValorant Trio (3 Ki\u015Fi)", catGaming.id, { userLimit: 3, bitrate: 96e3 });
    await getOrCreateVoice("\u26CF\uFE0F\u30FBMinecraft Ekibi", catGaming.id, { userLimit: 10, bitrate: 64e3 });
    await getOrCreateVoice("\u{1F9F1}\u30FBRoblox Tayfas\u0131", catGaming.id, { userLimit: 8, bitrate: 64e3 });
    await getOrCreateVoice("\u265F\uFE0F\u30FBTFT Strateji Masas\u0131", catGaming.id, { userLimit: 4, bitrate: 64e3 });
    const staffOverwrites = [
      { id: everyoneRole.id, deny: [import_discord36.PermissionFlagsBits.ViewChannel, import_discord36.PermissionFlagsBits.Connect] }
    ];
    if (approvedRole) staffOverwrites.push({ id: approvedRole.id, deny: [import_discord36.PermissionFlagsBits.ViewChannel, import_discord36.PermissionFlagsBits.Connect] });
    if (modRole) staffOverwrites.push({ id: modRole.id, allow: [import_discord36.PermissionFlagsBits.ViewChannel, import_discord36.PermissionFlagsBits.Connect, import_discord36.PermissionFlagsBits.Speak] });
    if (adminRole) staffOverwrites.push({ id: adminRole.id, allow: [import_discord36.PermissionFlagsBits.ViewChannel, import_discord36.PermissionFlagsBits.Connect, import_discord36.PermissionFlagsBits.Speak, import_discord36.PermissionFlagsBits.MoveMembers] });
    if (kurucuRole) staffOverwrites.push({ id: kurucuRole.id, allow: [import_discord36.PermissionFlagsBits.ViewChannel, import_discord36.PermissionFlagsBits.Connect, import_discord36.PermissionFlagsBits.Speak, import_discord36.PermissionFlagsBits.MoveMembers] });
    const catStaff = await getOrCreateCategory("\u{1F512} \u2503 YETK\u0130L\u0130 \xD6ZEL", staffOverwrites);
    await getOrCreateVoice("\u{1F451}\u30FBY\xF6netici Toplant\u0131 Odas\u0131", catStaff.id, {
      bitrate: 96e3,
      overwrites: staffOverwrites
    });
    const ownerOverwrites = [
      { id: everyoneRole.id, deny: [import_discord36.PermissionFlagsBits.ViewChannel, import_discord36.PermissionFlagsBits.Connect] }
    ];
    if (modRole) ownerOverwrites.push({ id: modRole.id, deny: [import_discord36.PermissionFlagsBits.Connect] });
    if (adminRole) ownerOverwrites.push({ id: adminRole.id, allow: [import_discord36.PermissionFlagsBits.ViewChannel, import_discord36.PermissionFlagsBits.Connect, import_discord36.PermissionFlagsBits.Speak] });
    if (kurucuRole) ownerOverwrites.push({ id: kurucuRole.id, allow: [import_discord36.PermissionFlagsBits.ViewChannel, import_discord36.PermissionFlagsBits.Connect, import_discord36.PermissionFlagsBits.Speak, import_discord36.PermissionFlagsBits.MoveMembers] });
    await getOrCreateVoice("\u{1F399}\uFE0F\u30FBKurucu \xD6zel Odas\u0131", catStaff.id, {
      bitrate: 96e3,
      overwrites: ownerOverwrites
    });
    const catVoice = guild.channels.cache.find(
      (c) => c.type === import_discord36.ChannelType.GuildCategory && (c.name.includes("SES") || c.name.includes("VOICE"))
    );
    if (catVoice) {
      await getOrCreateVoice("\u{1F3A7}\u30FBChill & M\xFCzik Odas\u0131", catVoice.id, { bitrate: 96e3 });
      await getOrCreateVoice("\u{1F4A4}\u30FBAFK & Dinlenme", catVoice.id, { bitrate: 64e3 });
    }
    console.log(`[VoiceSetupManager] \u2705 ${guild.name} i\xE7in t\xFCm ses kanallar\u0131 ba\u015Far\u0131yla haz\u0131rland\u0131!`);
  }
};

// src/events/ready.ts
async function onReady(client) {
  console.log(`
======================================================`);
  console.log(`\u{1F6E1}\uFE0F NIGHTS GUARD (Made by erencix) \xC7ALI\u015EIYOR!`);
  console.log(`\u{1F464} Bot: ${client.user?.tag} (${client.user?.id})`);
  console.log(`\u{1F310} Ba\u011Fl\u0131 Sunucu Say\u0131s\u0131: ${client.guilds.cache.size}`);
  console.log(`======================================================
`);
  const activities = [
    { name: "\u260A Nights Toplulu\u011Fu", type: import_discord37.ActivityType.Watching },
    { name: "\u{1F6E1}\uFE0F 7/24 Sunucu & Medya Korumas\u0131", type: import_discord37.ActivityType.Custom },
    { name: "\u{1F399}\uFE0F Ses Kanallar\u0131 & Sohbet", type: import_discord37.ActivityType.Listening },
    { name: "\u2B50 /yardim | Made by erencix", type: import_discord37.ActivityType.Playing },
    { name: "\u{1F48E} Seviye & Ekonomi Sistemi", type: import_discord37.ActivityType.Competing }
  ];
  let currentActivityIndex = 0;
  client.user?.setPresence({
    activities: [activities[0]],
    status: "online"
  });
  setInterval(() => {
    currentActivityIndex = (currentActivityIndex + 1) % activities.length;
    client.user?.setPresence({
      activities: [activities[currentActivityIndex]],
      status: "online"
    });
  }, 15e3);
  LevelManager.startVoiceTracker(client);
  await VoiceSetupManager.ensureEnhancedVoiceChannels(client);
  VoiceLobbyManager.sweepEmptyChannels(client);
  setInterval(() => {
    VoiceLobbyManager.sweepEmptyChannels(client);
  }, 45e3);
  try {
    console.log("[Slash Commands] Slash komutlar\u0131 kaydediliyor...");
    const commands = [
      data5,
      data13,
      data14,
      data15,
      data16,
      data17,
      data18,
      data19,
      calData,
      durdurData,
      devamData,
      gecData,
      kuyrukData,
      ayrilData,
      sesData,
      data12,
      // Seviye ve Sıralama Komutları (Tüm Üyelere Açık)
      rankData,
      topData,
      // Yönetici & Kurulum Komutları (Admin-Only, Normal Üyelere Gizli)
      seviyeAyarlaData,
      data2,
      data6,
      data,
      data3,
      data7,
      data8,
      data9,
      data4,
      data10,
      data11,
      aliasData
    ];
    if (client.application) {
      await client.application.commands.set(commands);
      console.log(`[Slash Commands] ${commands.length} adet Slash komutu genel olarak kaydedildi!`);
    }
    for (const guild of client.guilds.cache.values()) {
      try {
        await guild.commands.set(commands);
        console.log(`[Slash Commands] \u26A1 ${guild.name} sunucusuna ${commands.length} adet komut an\u0131nda y\xFCklendi!`);
      } catch (gErr) {
        console.warn(`[Slash Commands] ${guild.name} i\xE7in sunucu i\xE7i kay\u0131t atland\u0131:`, gErr.message);
      }
    }
  } catch (err) {
    console.error("[Slash Commands] Komutlar kaydedilirken hata olu\u015Ftu:", err);
  }
}

// src/events/voiceStateUpdate.ts
async function onVoiceStateUpdate(oldState, newState) {
  try {
    await VoiceLobbyManager.handleVoiceStateUpdate(oldState, newState);
  } catch (err) {
    console.error("[VoiceStateUpdate] Hata:", err);
  }
}

// src/services/features/kelimeOyunu.ts
var import_discord38 = require("discord.js");
var import_fs4 = __toESM(require("fs"));
var import_path4 = __toESM(require("path"));
var KelimeOyunuManager = class {
  static state = {
    lastWord: "ELMA",
    lastUserId: null,
    usedWords: /* @__PURE__ */ new Set(["elma"]),
    streak: 1,
    channelId: null
  };
  static stateLoaded = false;
  static loadState() {
    if (this.stateLoaded) return;
    const raw = PersistentStore.safeReadJson("kelimeOyunu.json", [], {
      lastWord: "ELMA",
      lastUserId: null,
      usedWords: ["elma"],
      streak: 1,
      channelId: null
    });
    this.state.lastWord = raw.lastWord || "ELMA";
    this.state.lastUserId = raw.lastUserId || null;
    this.state.usedWords = new Set(raw.usedWords || ["elma"]);
    this.state.streak = raw.streak || 1;
    this.state.channelId = raw.channelId || null;
    this.stateLoaded = true;
    PersistentStore.registerFlushHandler("KelimeOyunuManager", () => {
      this.saveState();
    });
  }
  static saveState() {
    if (!this.stateLoaded) return;
    const serialized = {
      lastWord: this.state.lastWord,
      lastUserId: this.state.lastUserId,
      usedWords: Array.from(this.state.usedWords),
      streak: this.state.streak,
      channelId: this.state.channelId
    };
    PersistentStore.atomicSaveJson("kelimeOyunu.json", serialized);
  }
  static dictionary = /* @__PURE__ */ new Set();
  static dictionaryLoaded = false;
  static forbiddenRoots = [
    // Cinsel Terimler & NSFW
    "seks",
    "sex",
    "porno",
    "porn",
    "vajina",
    "penis",
    "sikis",
    "amcik",
    "yarrak",
    "yarak",
    "tasak",
    "dassak",
    "dildo",
    "masturbasyon",
    "orgazm",
    "ereksiyon",
    "fantezi",
    "kondom",
    "prezervatif",
    "klitoris",
    "anal",
    "oral",
    "bosalma",
    "bosal",
    "escort",
    "eskort",
    "fahise",
    "jigolo",
    "meme",
    "memeler",
    "fetis",
    "cinsel",
    "cima",
    "iliski",
    "sevis",
    // Küfür & Ağır Argo
    "sik",
    "siktir",
    "sikeyim",
    "siktim",
    "sikik",
    "siksok",
    "sokam",
    "sokayim",
    "skm",
    "amk",
    "aq",
    "amq",
    "amina",
    "aminakoyayim",
    "amkoyim",
    "orospu",
    "orosbu",
    "kahpe",
    "kasar",
    "pic",
    "pust",
    "pezevenk",
    "gavat",
    "kavat",
    "got",
    "gotveren",
    "gotlek",
    "ibne",
    "yavsak",
    "kahbe",
    "avrat"
  ];
  static initDictionary() {
    if (this.dictionaryLoaded) return;
    try {
      const candidates = [
        import_path4.default.resolve(process.cwd(), "assets/clean_turkish_words.json"),
        import_path4.default.resolve(__dirname, "../../../assets/clean_turkish_words.json"),
        import_path4.default.resolve(__dirname, "../../assets/clean_turkish_words.json")
      ];
      for (const p of candidates) {
        if (import_fs4.default.existsSync(p)) {
          const raw = import_fs4.default.readFileSync(p, "utf8");
          const arr = JSON.parse(raw);
          this.dictionary = new Set(arr.map((w) => w.toLocaleLowerCase("tr-TR")));
          this.dictionaryLoaded = true;
          console.log(`[KelimeOyunu] \u2705 T\xFCrk\xE7e TDK kelime s\xF6zl\xFC\u011F\xFC y\xFCklendi! (${this.dictionary.size} kelime)`);
          break;
        }
      }
    } catch (e) {
      console.warn("[KelimeOyunu] S\xF6zl\xFCk y\xFCklenirken hata:", e.message);
    }
  }
  static isSexualOrProfane(rawWord) {
    const lower = rawWord.toLocaleLowerCase("tr-TR");
    const normalized = lower.replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c").replace(/0/g, "o").replace(/1/g, "i").replace(/3/g, "e").replace(/4/g, "a").replace(/@/g, "a").replace(/\$/g, "s");
    const cleanLetters = normalized.replace(/[^a-z]/g, "");
    for (const root of this.forbiddenRoots) {
      if (cleanLetters.includes(root)) {
        return true;
      }
    }
    if (AutoSecurityGuard.isProfane(rawWord)) {
      return true;
    }
    return false;
  }
  static getState() {
    return this.state;
  }
  static setChannelId(channelId) {
    this.state.channelId = channelId;
  }
  static async sendTempWarning(message, content, delayMs = 3500) {
    try {
      if ("send" in message.channel) {
        const warn = await message.channel.send({ content });
        setTimeout(() => {
          warn.delete().catch(() => {
          });
        }, delayMs);
      }
    } catch (e) {
    }
  }
  static async handleMessage(message) {
    if (message.author.bot || !message.guild) return;
    const channelName = message.channel.name || "";
    if (!channelName.includes("kelime-oyunu")) return;
    this.loadState();
    this.initDictionary();
    const text = message.content.trim();
    if (this.isSexualOrProfane(text)) {
      await message.delete().catch(() => {
      });
      await this.sendTempWarning(
        message,
        `\u{1F6AB} <@${message.author.id}>, k\xFCf\xFCr, hakaret, argo veya cinsel i\xE7erikli kelimeler kelime t\xFCretmece oyununda kesinlikle yasakt\u0131r!`,
        4500
      );
      return;
    }
    const turkishWordRegex = /^[a-zA-ZçğıöşüÇĞİÖŞÜ]+$/;
    if (text.startsWith("/") || text.startsWith("!") || text.includes(" ") || text.length < 2 || !turkishWordRegex.test(text)) {
      await message.delete().catch(() => {
      });
      await this.sendTempWarning(
        message,
        `\u26A0\uFE0F <@${message.author.id}>, buras\u0131 kelime t\xFCretme kanal\u0131d\u0131r! Yaln\u0131zca tek bir ge\xE7erli T\xFCrk\xE7e kelime yazabilirsiniz.`
      );
      return;
    }
    const wordLower = text.toLocaleLowerCase("tr-TR");
    const wordUpper = text.toLocaleUpperCase("tr-TR");
    if (this.dictionaryLoaded && this.dictionary.size > 0) {
      if (!this.dictionary.has(wordLower)) {
        await message.delete().catch(() => {
        });
        await this.sendTempWarning(
          message,
          `\u274C <@${message.author.id}>, '**${wordUpper}**' ge\xE7erli bir T\xFCrk\xE7e kelime de\u011Fildir! L\xFCtfen sadece ger\xE7ek T\xFCrk\xE7e kelimeler t\xFCretiniz.`
        );
        return;
      }
    }
    if (this.state.lastUserId === message.author.id) {
      await message.delete().catch(() => {
      });
      await this.sendTempWarning(
        message,
        `\u26A0\uFE0F <@${message.author.id}>, art arda iki kelime yazamazs\u0131n\u0131z! L\xFCtfen ba\u015Fka bir \xFCyenin kelime t\xFCretmesini bekleyin.`
      );
      return;
    }
    const expectedLetter = this.state.lastWord.slice(-1).toLocaleLowerCase("tr-TR");
    const currentFirstLetter = wordLower[0];
    if (currentFirstLetter !== expectedLetter) {
      await message.delete().catch(() => {
      });
      await this.sendTempWarning(
        message,
        `\u274C <@${message.author.id}>, yazd\u0131\u011F\u0131n kelime '**${expectedLetter.toLocaleUpperCase("tr-TR")}**' harfiyle ba\u015Flamal\u0131! (Son kelime: **${this.state.lastWord}**)`
      );
      return;
    }
    if (this.state.usedWords.has(wordLower)) {
      await message.delete().catch(() => {
      });
      await this.sendTempWarning(
        message,
        `\u26A0\uFE0F <@${message.author.id}>, '**${wordUpper}**' kelimesi bu oyunda daha \xF6nce kullan\u0131ld\u0131! L\xFCtfen ba\u015Fka bir kelime t\xFCretin.`
      );
      return;
    }
    this.state.usedWords.add(wordLower);
    this.state.lastWord = wordUpper;
    this.state.lastUserId = message.author.id;
    this.state.streak++;
    this.saveState();
    try {
      await message.react("\u2705");
    } catch (e) {
    }
    if (this.state.streak % 10 === 0) {
      const nextLetter = this.state.lastWord.slice(-1).toLocaleUpperCase("tr-TR");
      const milestoneEmbed = new import_discord38.EmbedBuilder().setTitle(`\u{1F525} KEL\u0130ME T\xDCRETME SER\u0130S\u0130: ${this.state.streak} KEL\u0130ME! \u{1F525}`).setDescription(
        `Harika gidiyorsunuz! Toplam **${this.state.streak}** ge\xE7erli T\xFCrk\xE7e kelime t\xFCretildi!
Son Kelime: **${this.state.lastWord}**
S\u0131radaki Kelime '**${nextLetter}**' harfiyle ba\u015Flamal\u0131!`
      ).setColor("#F1C40F").setFooter({ text: "Nights Kelime Oyunu \u2022 Made by erencix" });
      if ("send" in message.channel) {
        await message.channel.send({ embeds: [milestoneEmbed] });
      }
    }
  }
  static getInitialEmbed() {
    const nextLetter = this.state.lastWord.slice(-1).toLocaleUpperCase("tr-TR");
    return new import_discord38.EmbedBuilder().setTitle("\u{1F9E9} NIGHTS KEL\u0130ME T\xDCRETMECE OYUNU BA\u015ELADI!").setDescription(
      `Sunucumuzun otomatik kelime t\xFCretme oyunu aktif!

### \u{1F4CC} Oyun Kurallar\u0131:
1\uFE0F\u20E3 Yazd\u0131\u011F\u0131n\u0131z kelime, bir \xF6nceki kelimenin **son harfiyle** ba\u015Flamal\u0131d\u0131r.
2\uFE0F\u20E3 **Yaln\u0131zca TDK onayl\u0131 ger\xE7ek T\xFCrk\xE7e kelimeler** kabul edilir (k\xFCf\xFCr, argo ve cinsel kelimeler kesinlikle yasakt\u0131r).
3\uFE0F\u20E3 Ge\xE7ersiz, uydurma veya tekrarlanan kelimeler **otomatik silinir**.
4\uFE0F\u20E3 Do\u011Fru kelimelere bot taraf\u0131ndan **\u2705 onay emojisi** b\u0131rak\u0131l\u0131r.
5\uFE0F\u20E3 Ayn\u0131 ki\u015Fi art arda iki kelime yazamaz, s\u0131rayla oynanmal\u0131d\u0131r.
6\uFE0F\u20E3 Sadece tek bir kelime yaz\u0131n\u0131z (c\xFCmle veya sohbet yazmay\u0131n\u0131z).

\u{1F3C1} **Ba\u015Flang\u0131\xE7 Kelimesi:** **${this.state.lastWord}**
\u{1F449} **S\u0131radaki Kelime:** '**${nextLetter}**' harfiyle ba\u015Flamal\u0131d\u0131r!

\u{1F525} *Hadi ilk T\xFCrk\xE7e kelimeyi yazarak seriyi ba\u015Flat\u0131n!*`
    ).setColor("#38BDF8").setFooter({ text: "Nights Guard Otomatik Oyun Motoru" });
  }
};

// src/services/features/countingGame.ts
var import_discord39 = require("discord.js");
var CountingGameManager = class {
  static currentNumber = 1;
  static lastUserId = null;
  static highestScore = 0;
  static loaded = false;
  static load() {
    if (this.loaded) return;
    const data20 = PersistentStore.safeReadJson("counting.json", [], {
      currentNumber: 1,
      lastUserId: null,
      highestScore: 0
    });
    this.currentNumber = data20.currentNumber || 1;
    this.lastUserId = data20.lastUserId || null;
    this.highestScore = data20.highestScore || 0;
    this.loaded = true;
    PersistentStore.registerFlushHandler("CountingGameManager", () => {
      this.save();
    });
  }
  static save() {
    if (!this.loaded) return;
    PersistentStore.atomicSaveJson("counting.json", {
      currentNumber: this.currentNumber,
      lastUserId: this.lastUserId,
      highestScore: this.highestScore
    });
  }
  static async handleMessage(message) {
    if (message.author.bot || !message.guild) return;
    this.load();
    const channelName = message.channel.name || "";
    if (!channelName.includes("sayi-saymaca")) return;
    const text = message.content.trim();
    const num = parseInt(text, 10);
    if (isNaN(num) || text !== num.toString()) {
      await message.delete().catch(() => {
      });
      try {
        if ("send" in message.channel) {
          const warn = await message.channel.send({
            content: `\u26A0\uFE0F <@${message.author.id}>, buras\u0131 say\u0131 saymaca kanal\u0131d\u0131r! Yaln\u0131zca s\u0131radaki say\u0131y\u0131 (**${this.currentNumber}**) yaz\u0131n\u0131z.`
          });
          setTimeout(() => warn.delete().catch(() => {
          }), 3500);
        }
      } catch (e) {
      }
      return;
    }
    if (this.lastUserId === message.author.id) {
      await message.delete().catch(() => {
      });
      try {
        if ("send" in message.channel) {
          const warn = await message.channel.send({
            content: `\u26A0\uFE0F <@${message.author.id}>, art arda iki say\u0131 yazamazs\u0131n\u0131z! Ba\u015Fka bir \xFCyenin yazmas\u0131n\u0131 bekleyin.`
          });
          setTimeout(() => warn.delete().catch(() => {
          }), 3500);
        }
      } catch (e) {
      }
      return;
    }
    if (num !== this.currentNumber) {
      const failedAt = this.currentNumber - 1;
      this.currentNumber = 1;
      this.lastUserId = null;
      this.save();
      await message.react("\u274C").catch(() => {
      });
      try {
        if ("send" in message.channel) {
          const failEmbed = new import_discord39.EmbedBuilder().setTitle("\u{1F4A5} EYVAH! SER\u0130 BOZULDU! \u{1F4A5}").setDescription(
            `<@${message.author.id}> yanl\u0131\u015F say\u0131 girdi (**${num}** yerine **${failedAt + 1}** yaz\u0131lmal\u0131yd\u0131)!

\u{1F4CA} **Ula\u015F\u0131lan Skor:** \`${failedAt}\` Say\u0131
\u{1F3C6} **Rekor:** \`${this.highestScore}\` Say\u0131

\u{1F504} *Oyun s\u0131f\u0131rland\u0131! S\u0131radaki say\u0131: **1***`
          ).setColor("#ED4245").setFooter({ text: "Nights Say\u0131 Saymaca Oyunu" });
          await message.channel.send({ embeds: [failEmbed] });
        }
      } catch (e) {
      }
      return;
    }
    this.currentNumber++;
    this.lastUserId = message.author.id;
    if (num > this.highestScore) this.highestScore = num;
    this.save();
    await message.react("\u2705").catch(() => {
    });
    if (num % 25 === 0) {
      try {
        if ("send" in message.channel) {
          const milestoneEmbed = new import_discord39.EmbedBuilder().setTitle(`\u{1F389} B\xDCY\xDCK BA\u015EARI: ${num}. SAYIYA ULA\u015EILDI! \u{1F680}`).setDescription(
            `Tebrikler! Sunucu olarak harika bir tak\u0131m \xE7al\u0131\u015Fmas\u0131 sergiliyorsunuz.
\u015Eu anki seri: **${num}**
S\u0131radaki hedef: **${num + 25}**`
          ).setColor("#2ECC71").setFooter({ text: "Nights Community Games" });
          await message.channel.send({ embeds: [milestoneEmbed] });
        }
      } catch (e) {
      }
    }
  }
  static getInitialEmbed() {
    return new import_discord39.EmbedBuilder().setTitle("\u{1F522} NIGHTS SAYI SAYMACA OYUNU BA\u015ELADI!").setDescription(
      `Sunucumuzun tak\u0131m \xE7al\u0131\u015Fmas\u0131 ve e\u011Flence dolu say\u0131 sayma oyunu aktif!

### \u{1F4CC} Oyun Kurallar\u0131:
1\uFE0F\u20E3 S\u0131radaki say\u0131y\u0131 eksiksiz olarak yaz\u0131n\u0131z *(1, 2, 3...)*.
2\uFE0F\u20E3 Ayn\u0131 ki\u015Fi **art arda iki say\u0131** yazamaz.
3\uFE0F\u20E3 Yanl\u0131\u015F bir say\u0131 yaz\u0131l\u0131rsa seri **s\u0131f\u0131rlan\u0131r** ve 1'den ba\u015Ftan ba\u015Flar.
4\uFE0F\u20E3 Say\u0131 d\u0131\u015F\u0131ndaki sohbet mesajlar\u0131 otomatik temizlenir.

\u{1F3C1} **Ba\u015Flang\u0131\xE7:** S\u0131radaki Say\u0131: **1**

\u{1F525} *Hadi ilk say\u0131y\u0131 yazarak rekor k\u0131rmaya ba\u015Flay\u0131n!*`
    ).setColor("#3498DB").setFooter({ text: "Nights Guard Oyun Motoru \u2022 Made by erencix" });
  }
};

// src/services/features/auditLogManager.ts
var import_discord40 = require("discord.js");
var AuditLogManager = class {
  static logChannelCache = /* @__PURE__ */ new Map();
  /**
   * Sunucudaki log kanalını bulur (örn: #denetim-kaydı, #mod-log, #guvenlik-log)
   */
  static async getLogChannel(guild) {
    try {
      const cachedId = this.logChannelCache.get(guild.id);
      if (cachedId) {
        const ch = guild.channels.cache.get(cachedId);
        if (ch && ch.isTextBased()) return ch;
      }
      const channels = await guild.channels.fetch();
      const logCh = channels.find(
        (c) => c && c.isTextBased() && (c.name.includes("denetim") || c.name.includes("mod-log") || c.name.includes("guvenlik-log") || c.name.includes("audit-log") || c.name.includes("sunucu-log"))
      );
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
  static async logMessageDelete(message) {
    try {
      if (!message.guild || message.author?.bot) return;
      const logChannel = await this.getLogChannel(message.guild);
      if (!logChannel || logChannel.id === message.channelId) return;
      const content = message.content?.trim() || "*[Mesaj metni al\u0131namad\u0131 veya sadece medya/dosya i\xE7eriyordu]*";
      const attachments = message.attachments?.size ? Array.from(message.attachments.values()).map((a) => a.url).join("\n") : null;
      const embed = new import_discord40.EmbedBuilder().setTitle("\u{1F5D1}\uFE0F Mesaj Silindi").setDescription(
        `> \u{1F464} **Mesaj Sahibi:** <@${message.author?.id}> (\`${message.author?.tag || message.author?.id}\`)
> \u{1F4AC} **Kanal:** <#${message.channelId}>
> \u{1F4C5} **Tarih:** <t:${Math.floor(Date.now() / 1e3)}:R>

**Silinen \u0130\xE7erik:**
\`\`\`
${content.slice(0, 1500)}
\`\`\`` + (attachments ? `
\u{1F4CE} **Ekler:**
${attachments.slice(0, 400)}` : "")
      ).setColor("#ED4245").setThumbnail(message.author?.displayAvatarURL() || message.guild.iconURL()).setFooter({ text: "Nights Audit Engine \u2022 Made by erencix" }).setTimestamp();
      await logChannel.send({ embeds: [embed] }).catch(() => {
      });
    } catch (err) {
      console.warn("[AuditLog] logMessageDelete hatas\u0131:", err.message);
    }
  }
  /**
   * Düzenlenen Mesaj Kaydı
   */
  static async logMessageUpdate(oldMessage, newMessage) {
    try {
      if (!newMessage.guild || newMessage.author?.bot) return;
      if (oldMessage.content === newMessage.content) return;
      const logChannel = await this.getLogChannel(newMessage.guild);
      if (!logChannel || logChannel.id === newMessage.channelId) return;
      const oldText = oldMessage.content?.trim() || "*[\xD6nceki i\xE7erik yok]*";
      const newText = newMessage.content?.trim() || "*[Yeni i\xE7erik yok]*";
      const embed = new import_discord40.EmbedBuilder().setTitle("\u270F\uFE0F Mesaj D\xFCzenlendi").setDescription(
        `> \u{1F464} **Mesaj Sahibi:** <@${newMessage.author?.id}> (\`${newMessage.author?.tag || newMessage.author?.id}\`)
> \u{1F4AC} **Kanal:** <#${newMessage.channelId}> \u2014 [Mesaja Git](${newMessage.url})

**Eski \u0130\xE7erik:**
\`\`\`
${oldText.slice(0, 800)}
\`\`\`
**Yeni \u0130\xE7erik:**
\`\`\`
${newText.slice(0, 800)}
\`\`\``
      ).setColor("#FEE75C").setThumbnail(newMessage.author?.displayAvatarURL() || newMessage.guild.iconURL()).setFooter({ text: "Nights Audit Engine \u2022 Made by erencix" }).setTimestamp();
      await logChannel.send({ embeds: [embed] }).catch(() => {
      });
    } catch (err) {
      console.warn("[AuditLog] logMessageUpdate hatas\u0131:", err.message);
    }
  }
  /**
   * Sunucudan Ayrılan Üye Kaydı
   */
  static async logMemberLeave(member) {
    try {
      const guild = member.guild;
      const logChannel = await this.getLogChannel(guild);
      if (!logChannel) return;
      const roles = member.roles?.cache?.filter((r) => r.id !== guild.id)?.map((r) => r.name)?.join(", ") || "Rol bulunmuyor";
      const joinedAtStr = member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1e3)}:R>` : "Bilinmiyor";
      const embed = new import_discord40.EmbedBuilder().setTitle("\u{1F6AA} Bir \xDCye Sunucudan Ayr\u0131ld\u0131").setDescription(
        `> \u{1F464} **Kullan\u0131c\u0131:** <@${member.id}> (\`${member.user?.tag || member.id}\`)
> \u{1F4C5} **Sunucuya Kat\u0131lm\u0131\u015Ft\u0131:** ${joinedAtStr}
> \u{1F3F7}\uFE0F **Sahip Oldu\u011Fu Roller:** \`${roles.slice(0, 300)}\`

\u{1F4CA} **Kalan Toplam \xDCye:** **${guild.memberCount}**`
      ).setColor("#E67E22").setThumbnail(member.user?.displayAvatarURL() || guild.iconURL()).setFooter({ text: "Nights Audit Engine \u2022 Made by erencix" }).setTimestamp();
      await logChannel.send({ embeds: [embed] }).catch(() => {
      });
    } catch (err) {
      console.warn("[AuditLog] logMemberLeave hatas\u0131:", err.message);
    }
  }
  /**
   * Ses Durumu Değişiklik Kaydı
   */
  static async logVoiceState(oldState, newState) {
    try {
      const guild = newState.guild || oldState.guild;
      if (!guild) return;
      const member = newState.member || oldState.member;
      if (!member || member.user.bot) return;
      const logChannel = await this.getLogChannel(guild);
      if (!logChannel) return;
      if (!oldState.channelId && newState.channelId) {
        const embed = new import_discord40.EmbedBuilder().setTitle("\u{1F399}\uFE0F Ses Kanal\u0131na Giri\u015F").setDescription(
          `> \u{1F464} **Kullan\u0131c\u0131:** <@${member.id}> (\`${member.user.tag}\`)
> \u{1F50A} **Kanal:** <#${newState.channelId}>`
        ).setColor("#2ECC71").setTimestamp();
        await logChannel.send({ embeds: [embed] }).catch(() => {
        });
        return;
      }
      if (oldState.channelId && !newState.channelId) {
        const embed = new import_discord40.EmbedBuilder().setTitle("\u{1F6AA} Ses Kanal\u0131ndan \xC7\u0131k\u0131\u015F").setDescription(
          `> \u{1F464} **Kullan\u0131c\u0131:** <@${member.id}> (\`${member.user.tag}\`)
> \u{1F507} **Ayr\u0131ld\u0131\u011F\u0131 Kanal:** <#${oldState.channelId}>`
        ).setColor("#ED4245").setTimestamp();
        await logChannel.send({ embeds: [embed] }).catch(() => {
        });
        return;
      }
      if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
        const embed = new import_discord40.EmbedBuilder().setTitle("\u{1F504} Ses Kanal\u0131 De\u011Fi\u015Fikli\u011Fi").setDescription(
          `> \u{1F464} **Kullan\u0131c\u0131:** <@${member.id}> (\`${member.user.tag}\`)
> \u{1F534} **Eski Kanal:** <#${oldState.channelId}>
> \u{1F7E2} **Yeni Kanal:** <#${newState.channelId}>`
        ).setColor("#3498DB").setTimestamp();
        await logChannel.send({ embeds: [embed] }).catch(() => {
        });
        return;
      }
    } catch {
    }
  }
};

// src/services/features/aiChatManager.ts
var import_generative_ai2 = require("@google/generative-ai");
var AIChatManager = class {
  static geminiClient = null;
  static recentUsers = /* @__PURE__ */ new Map();
  static initGemini() {
    const key = process.env.GEMINI_API_KEY;
    if (key && !this.geminiClient) {
      try {
        const genAI = new import_generative_ai2.GoogleGenerativeAI(key);
        this.geminiClient = genAI.getGenerativeModel({
          model: "gemini-1.5-flash",
          systemInstruction: "Sen Nights Guard adl\u0131 Discord botusun. Yarat\u0131c\u0131n Erencix (erengaliba42). \u260A Nights adl\u0131 Discord sunucusunun koruyucusu, e\u011Flence ve sohbet arkada\u015F\u0131s\u0131n. \xDCyelerle \xE7ok samimi, hafif esprili, zeki, T\xFCrk\xE7e konu\u015Fan, haval\u0131 ve yard\u0131msever bir dille sohbet et. Discord markdown format\u0131n\u0131 ve emojileri dengeli kullan. Cevaplar\u0131n\u0131 \xE7ok uzatmadan, do\u011Frudan ve ilgi \xE7ekici ver."
        });
      } catch (e) {
        this.geminiClient = null;
      }
    }
  }
  static async handleMessage(message, client) {
    if (message.author.bot || !message.guild) return false;
    const channelName = message.channel.name?.toLowerCase() || "";
    const isAiChannel = channelName.includes("ai-sohbet") || channelName.includes("yapay-zeka") || channelName.includes("bot-sohbet") || channelName.includes("ai-chat");
    const botMentioned = client.user && message.mentions.has(client.user.id) && !message.mentions.everyone;
    if (!isAiChannel && !botMentioned) {
      return false;
    }
    const lastTime = this.recentUsers.get(message.author.id) || 0;
    if (Date.now() - lastTime < 2e3) return true;
    this.recentUsers.set(message.author.id, Date.now());
    let prompt = message.content;
    if (client.user) {
      prompt = prompt.replace(new RegExp(`<@!?${client.user.id}>`, "g"), "").trim();
    }
    if (!prompt) {
      await message.reply("Efendim kral? Buraday\u0131m, bir \u015Fey mi soracakt\u0131n? \u{1F44B}").catch(() => {
      });
      return true;
    }
    try {
      if ("sendTyping" in message.channel) {
        await message.channel.sendTyping().catch(() => {
        });
      }
      this.initGemini();
      let replyText = "";
      if (this.geminiClient) {
        try {
          const result = await this.geminiClient.generateContent(prompt);
          replyText = result.response.text();
        } catch {
          replyText = this.getSmartFallbackResponse(prompt, message.author.displayName);
        }
      } else {
        replyText = this.getSmartFallbackResponse(prompt, message.author.displayName);
      }
      if (replyText.length > 2e3) {
        replyText = replyText.slice(0, 1990) + "...";
      }
      await message.reply(replyText).catch(() => {
      });
      return true;
    } catch (err) {
      console.warn("[AIChatManager] Hata:", err.message);
      return false;
    }
  }
  static getSmartFallbackResponse(prompt, userName) {
    const p = prompt.toLowerCase();
    if (p.includes("nas\u0131ls\u0131n") || p.includes("naber")) {
      return `\u0130yiyim ${userName}, sunucuyu 7/24 korumaya ve sizinle tak\u0131lmaya devam ediyorum! Sen nas\u0131ls\u0131n, keyifler nas\u0131l? \u2728`;
    }
    if (p.includes("kimsin") || p.includes("nesin")) {
      return `Ben **Nights Guard**! \u{1F6E1}\uFE0F **Erencix** taraf\u0131ndan geli\u015Ftirilmi\u015F, **\u260A Nights** sunucusunun koruma, e\u011Flence, ekonomi ve yapay zeka asistan\u0131y\u0131m. Hizmetindeyim!`;
    }
    if (p.includes("sahibin") || p.includes("yap\u0131mc\u0131n") || p.includes("kurucun")) {
      return `Beni kodlayan ve tasarlayan kral **Erencix** (<@1138498666785677492>)! \u{1F451}`;
    }
    if (p.includes("yard\u0131m") || p.includes("komut")) {
      return `B\xFCt\xFCn komutlar\u0131m\u0131 g\xF6rmek i\xE7in \`/yardim\` veya \`!yardim\` yazabilirsin kral! Seviyeden ekonomiye, g\xFCvenlikten e\u011Flenceye her \u015Fey elimizin alt\u0131nda.`;
    }
    if (p.includes("seviyorum") || p.includes("adams\u0131n") || p.includes("cans\u0131n")) {
      return `Eyvallah ${userName}, o senin krall\u0131\u011F\u0131n! \u260A Nights ailesi olarak her zaman beraberiz! \u2764\uFE0F`;
    }
    if (p.includes("para") || p.includes("coin") || p.includes("kumar")) {
      return `Nights Coin kazanmak i\xE7in \`!gunluk\`, \`!calis\` yapabilir veya \`!cf\` / \`!slot\` ile \u015Fans\u0131n\u0131 deneyebilirsin! \u{1F3B0}\u{1F4B0}`;
    }
    const genericResponses = [
      `Hakl\u0131s\u0131n ${userName}, tam olarak \xF6yle! Ba\u015Fka ne d\xFC\u015F\xFCn\xFCyorsun bu konuda? \u{1F914}`,
      `\u0130lgin\xE7 bir yakla\u015F\u0131m kral. \u260A Nights ortam\u0131nda her fikre a\xE7\u0131\u011F\u0131z! \u2615`,
      `Bunu not ald\u0131m! Ba\u015Fka sormak veya konu\u015Fmak istedi\u011Fin bir konu var m\u0131? \u2728`,
      `Haha kesinlikle kat\u0131l\u0131yorum ${userName}! Birlikte sunucuyu daha da co\u015Fturaca\u011F\u0131z. \u{1F680}`
    ];
    return genericResponses[Math.floor(Math.random() * genericResponses.length)];
  }
};

// src/services/features/inviteTracker.ts
var InviteTracker = class {
  // guildId -> (code -> uses)
  static invitesCache = /* @__PURE__ */ new Map();
  // guildId -> vanity uses
  static vanityCache = /* @__PURE__ */ new Map();
  static async init(client) {
    for (const guild of client.guilds.cache.values()) {
      await this.cacheGuildInvites(guild);
    }
    console.log("[InviteTracker] Sunucu davetleri ba\u015Far\u0131yla \xF6nbelleklendi.");
  }
  static async cacheGuildInvites(guild) {
    try {
      const currentInvites = await guild.invites.fetch().catch(() => null);
      if (currentInvites) {
        const guildMap = /* @__PURE__ */ new Map();
        currentInvites.forEach((inv) => {
          guildMap.set(inv.code, inv.uses || 0);
        });
        this.invitesCache.set(guild.id, guildMap);
      }
      if (guild.vanityURLCode) {
        const vanityData = await guild.fetchVanityData().catch(() => null);
        if (vanityData) {
          this.vanityCache.set(guild.id, vanityData.uses);
        }
      }
    } catch (err) {
      console.warn(`[InviteTracker] ${guild.name} davetleri \xF6nbelle\u011Fe al\u0131namad\u0131:`, err.message);
    }
  }
  static onInviteCreate(invite) {
    if (!invite.guild) return;
    const guildId = invite.guild.id;
    let guildMap = this.invitesCache.get(guildId);
    if (!guildMap) {
      guildMap = /* @__PURE__ */ new Map();
      this.invitesCache.set(guildId, guildMap);
    }
    guildMap.set(invite.code, invite.uses || 0);
  }
  static onInviteDelete(invite) {
    if (!invite.guild) return;
    const guildMap = this.invitesCache.get(invite.guild.id);
    if (guildMap) {
      guildMap.delete(invite.code);
    }
  }
  static async findInviter(member) {
    const guild = member.guild;
    const cachedInvites = this.invitesCache.get(guild.id);
    try {
      const currentInvites = await guild.invites.fetch().catch(() => null);
      if (currentInvites && cachedInvites) {
        const usedInvite = currentInvites.find((inv) => {
          const oldUses = cachedInvites.get(inv.code) || 0;
          return (inv.uses || 0) > oldUses;
        });
        const updatedMap = /* @__PURE__ */ new Map();
        currentInvites.forEach((inv) => {
          updatedMap.set(inv.code, inv.uses || 0);
        });
        this.invitesCache.set(guild.id, updatedMap);
        if (usedInvite && usedInvite.inviter) {
          return {
            inviter: usedInvite.inviter,
            code: usedInvite.code,
            uses: usedInvite.uses || 1,
            isVanity: false
          };
        }
      } else if (currentInvites) {
        const updatedMap = /* @__PURE__ */ new Map();
        currentInvites.forEach((inv) => {
          updatedMap.set(inv.code, inv.uses || 0);
        });
        this.invitesCache.set(guild.id, updatedMap);
      }
      if (guild.vanityURLCode) {
        const currentVanity = await guild.fetchVanityData().catch(() => null);
        const oldVanityUses = this.vanityCache.get(guild.id) || 0;
        if (currentVanity) {
          this.vanityCache.set(guild.id, currentVanity.uses);
          if (currentVanity.uses > oldVanityUses) {
            return {
              inviter: null,
              code: guild.vanityURLCode,
              uses: currentVanity.uses,
              isVanity: true
            };
          }
        }
      }
    } catch (err) {
      console.warn("[InviteTracker] Davet\xE7i tespit hatas\u0131:", err.message);
    }
    return {
      inviter: null,
      code: null,
      uses: 0,
      isVanity: false
    };
  }
};

// src/index.ts
var import_discord42 = require("discord.js");
async function bootstrap() {
  console.log("\u{1F680} Nights Guard \u2022 Made by erencix ba\u015Flat\u0131l\u0131yor...");
  PersistentStore.init();
  LevelManager.load();
  EconomyManager.load();
  SocialManager.load();
  KelimeOyunuManager.loadState();
  const validation = validateConfig();
  if (validation.warnings.length > 0) {
    validation.warnings.forEach((w) => console.warn(`\u26A0\uFE0F [UYARI]: ${w}`));
  }
  await MusicPlayer.ensureLinuxBinaries();
  const port = parseInt(process.env.PORT || "3000", 10);
  const dashboard = new DashboardServer(port);
  try {
    await dashboard.start();
  } catch (err) {
    console.warn(`[Web Dashboard] Ba\u015Flat\u0131lamad\u0131: ${err.message}`);
  }
  if (!validation.valid) {
    validation.errors.forEach((e) => console.error(`\u274C [HATA]: ${e}`));
    console.error("\nL\xFCtfen .env dosyas\u0131ndaki DISCORD_TOKEN bilgisini girip tekrar ba\u015Flat\u0131n.");
    console.log("\u{1F4A1} \u0130pucu: Kurulum sihirbaz\u0131 i\xE7in: npm run setup (veya kurulum.bat)");
    console.log("\u{1F4A1} \u0130pucu: Token olmadan sistemi an\u0131nda test etmek i\xE7in: npm run demo (veya demo.bat)");
    if (process.env.NODE_ENV !== "test") {
      process.exit(1);
    }
    return;
  }
  const client = new import_discord41.Client({
    intents: [
      import_discord41.GatewayIntentBits.Guilds,
      import_discord41.GatewayIntentBits.GuildMembers,
      import_discord41.GatewayIntentBits.GuildVoiceStates,
      import_discord41.GatewayIntentBits.GuildMessages,
      import_discord41.GatewayIntentBits.MessageContent,
      import_discord41.GatewayIntentBits.GuildEmojisAndStickers,
      import_discord41.GatewayIntentBits.GuildInvites
    ],
    partials: [import_discord41.Partials.Channel, import_discord41.Partials.GuildMember, import_discord41.Partials.Message, import_discord41.Partials.User]
  });
  const aiManager = new AIManager();
  const interactionHandler = new InteractionHandler(aiManager);
  client.once(import_discord41.Events.ClientReady, async () => {
    await onReady(client);
    await InviteTracker.init(client);
  });
  client.on(import_discord41.Events.InviteCreate, (invite) => InviteTracker.onInviteCreate(invite));
  client.on(import_discord41.Events.InviteDelete, (invite) => InviteTracker.onInviteDelete(invite));
  client.on(import_discord41.Events.InteractionCreate, async (interaction) => {
    await interactionHandler.handle(interaction);
  });
  client.on(import_discord41.Events.VoiceStateUpdate, async (oldState, newState) => {
    await onVoiceStateUpdate(oldState, newState);
    await AuditLogManager.logVoiceState(oldState, newState);
  });
  client.on(import_discord41.Events.MessageDelete, async (message) => {
    await AuditLogManager.logMessageDelete(message);
  });
  client.on(import_discord41.Events.MessageUpdate, async (oldMessage, newMessage) => {
    await AuditLogManager.logMessageUpdate(oldMessage, newMessage);
  });
  client.on(import_discord41.Events.GuildMemberRemove, async (member) => {
    await AuditLogManager.logMemberLeave(member);
  });
  client.on(import_discord41.Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.guild) return;
    const blocked = await AutoSecurityGuard.inspect(message);
    if (blocked) return;
    const aiHandled = await AIChatManager.handleMessage(message, client);
    if (aiHandled) return;
    const chName = message.channel.name || "";
    if (chName.includes("kelime-oyunu")) {
      await KelimeOyunuManager.handleMessage(message);
      return;
    }
    if (chName.includes("sayi-saymaca")) {
      await CountingGameManager.handleMessage(message);
      return;
    }
    await AfkManager.handleMessage(message);
    await LevelManager.handleMessage(message);
    const content = message.content.trim().toLowerCase();
    const args = message.content.trim().split(/\s+/);
    const cmd = args[0]?.toLowerCase();
    if (cmd === "!cal" || cmd === "!play") {
      const query = args.slice(1).join(" ").trim();
      if (!query) {
        await message.reply("\u{1F4A1} Kullan\u0131m: `!cal <\u015Fark\u0131 ad\u0131 veya link>` (\xD6rn: `!cal Wegh - ALO`)").catch(() => {
        });
        return;
      }
      await MusicPlayer.handlePlay({ message }, query, client);
      return;
    }
    if (cmd === "!durdur" || cmd === "!duraklat" || cmd === "!pause") {
      const ok = MusicPlayer.pause(message.guild.id);
      await message.reply(ok ? "\u23F8\uFE0F M\xFCzik duraklat\u0131ld\u0131. Devam ettirmek i\xE7in: `!devam`" : "\u26A0\uFE0F \u015Eu anda \xE7alan aktif bir \u015Fark\u0131 yok.").catch(() => {
      });
      return;
    }
    if (cmd === "!devam" || cmd === "!resume") {
      const ok = MusicPlayer.resume(message.guild.id);
      await message.reply(ok ? "\u25B6\uFE0F M\xFCzik devam ettiriliyor." : "\u26A0\uFE0F Duraklat\u0131lm\u0131\u015F bir m\xFCzik bulunmuyor.").catch(() => {
      });
      return;
    }
    if (cmd === "!gec" || cmd === "!skip") {
      const ok = MusicPlayer.skip(message.guild.id, client);
      await message.reply(ok ? "\u23ED\uFE0F S\u0131radaki \u015Fark\u0131ya ge\xE7ildi." : "\u26A0\uFE0F S\u0131rada ge\xE7ilecek \u015Fark\u0131 bulunmuyor.").catch(() => {
      });
      return;
    }
    if (cmd === "!kuyruk" || cmd === "!queue") {
      const q = MusicPlayer.queues.get(message.guild.id);
      if (!q || q.songs.length === 0) {
        await message.reply("\u{1F4ED} \xC7alma listesinde bekleyen \u015Fark\u0131 yok.").catch(() => {
        });
        return;
      }
      let desc = "";
      q.songs.slice(0, 10).forEach((s, idx) => {
        desc += `${idx === 0 ? "\u25B6\uFE0F" : `**#${idx + 1}**`} [${s.title}](${s.url}) (\`${s.duration}\`)
`;
      });
      if (q.songs.length > 10) desc += `*...ve ${q.songs.length - 10} \u015Fark\u0131 daha.*`;
      const embed = new import_discord42.EmbedBuilder().setTitle(`\u{1F4DC} \xC7alma Listesi (${q.songs.length} Par\xE7a)`).setDescription(desc).setColor("#5865F2").setFooter({ text: `Ses: %${q.volume} \u2022 D\xF6ng\xFC: ${q.loopMode}` });
      await message.reply({ embeds: [embed] }).catch(() => {
      });
      return;
    }
    if (cmd === "!ayril" || cmd === "!stop") {
      const ok = MusicPlayer.stop(message.guild.id, client);
      await message.reply(ok ? "\u23F9\uFE0F M\xFCzik durduruldu ve ses kanal\u0131ndan ayr\u0131l\u0131narak liste temizlendi." : "\u26A0\uFE0F Bot herhangi bir ses kanal\u0131nda bulunmuyor.").catch(() => {
      });
      return;
    }
    if (cmd === "!ses" || cmd === "!volume") {
      const vol = parseInt(args[1], 10);
      if (isNaN(vol) || vol < 1 || vol > 150) {
        await message.reply("\u{1F4A1} Kullan\u0131m: `!ses <1-150>` (\xD6rn: `!ses 80`)").catch(() => {
        });
        return;
      }
      const ok = MusicPlayer.setVolume(message.guild.id, vol);
      await message.reply(ok ? `\u{1F50A} Ses seviyesi **%${vol}** olarak ayarland\u0131.` : "\u26A0\uFE0F \xC7alan bir m\xFCzik bulunmuyor.").catch(() => {
      });
      return;
    }
    if (cmd === "!rank" || cmd === "!seviye") {
      const targetUser = message.mentions.users.first() || message.author;
      const rankEmbed = LevelManager.getRankEmbed(targetUser);
      await message.reply({ embeds: [rankEmbed] }).catch(() => {
      });
      return;
    }
    if (cmd === "!top" || cmd === "!liderlik") {
      const topList = LevelManager.getLeaderboard();
      let desc = "";
      topList.forEach((u, i) => {
        const medal = i === 0 ? "\u{1F947}" : i === 1 ? "\u{1F948}" : i === 2 ? "\u{1F949}" : `**#${i + 1}**`;
        desc += `${medal} <@${u.userId}> \u2014 **Level ${u.level}** (\`${u.xp} XP\`)
`;
      });
      const topEmbed = new import_discord42.EmbedBuilder().setTitle("\u{1F3C6} NIGHTS AKT\u0130FL\u0130K L\u0130DERL\u0130K TABLOSU").setDescription(desc || "Hen\xFCz seviye atlayan \xFCye bulunmuyor.").setColor("#F1C40F").setFooter({ text: "Nights Topluluk S\u0131ralamas\u0131 \u2022 Made by erencix" });
      await message.reply({ embeds: [topEmbed] }).catch(() => {
      });
      return;
    }
    if (cmd === "!seviye-esitle") {
      const ownerId = config.ownerId || process.env.OWNER_ID || "1138498666785677492";
      if (message.author.id !== ownerId && !message.member?.permissions.has(import_discord41.PermissionFlagsBits.Administrator)) {
        await message.reply("\u274C Bu komutu yaln\u0131zca sunucu y\xF6neticisi kullanabilir.").catch(() => {
        });
        return;
      }
      if (message.guild) {
        const count = await LevelManager.syncAllMembers(message.guild);
        await message.reply(`\u2705 Seviye senkronizasyonu tamamland\u0131. **${count}** \xFCyenin seviye rolleri g\xFCncellendi.`).catch(() => {
        });
      }
      return;
    }
    if (cmd === "!gunluk") {
      const res = EconomyManager.claimDaily(message.author.id);
      if (res.success) {
        await message.reply(`\u{1F389} G\xFCnl\xFCk \xF6d\xFCl\xFCn olan **${res.amount} Nights Coin** hesab\u0131na aktar\u0131ld\u0131!`).catch(() => {
        });
      } else {
        const remainingMinutes = Math.ceil(((res.nextTime || 0) - Date.now()) / (60 * 1e3));
        await message.reply(`\u23F3 G\xFCnl\xFCk \xF6d\xFCl\xFCn\xFC zaten ald\u0131n! Tekrar almak i\xE7in **${Math.floor(remainingMinutes / 60)}s ${remainingMinutes % 60}dk** beklemelisin.`).catch(() => {
        });
      }
      return;
    }
    if (cmd === "!bakiye" || cmd === "!cuzdan") {
      const targetUser = message.mentions.users.first() || message.author;
      const bal = EconomyManager.getBalance(targetUser.id);
      await message.reply(`\u{1F4B0} **${targetUser.displayName}** kullan\u0131c\u0131s\u0131n\u0131n bakiyesi: **${bal} Nights Coin**`).catch(() => {
      });
      return;
    }
    if (cmd === "!calis") {
      const res = EconomyManager.work(message.author.id);
      if (res.success) {
        await message.reply(`\u{1F4BC} **${res.job}** ve **+${res.amount} Nights Coin** kazand\u0131n!`).catch(() => {
        });
      } else {
        const remainingMinutes = Math.ceil(((res.nextTime || 0) - Date.now()) / (60 * 1e3));
        await message.reply(`\u{1F634} Biraz yoruldun! Tekrar \xE7al\u0131\u015Fmak i\xE7in **${remainingMinutes} dakika** dinlenmelisin.`).catch(() => {
        });
      }
      return;
    }
    if (cmd === "!cf" || cmd === "!yazitura") {
      const bet = parseInt(args[1], 10);
      const choice = args[2]?.toLowerCase();
      if (isNaN(bet) || bet <= 0 || choice !== "yazi" && choice !== "tura") {
        await message.reply("\u{1F4A1} Kullan\u0131m: `!cf <miktar> <yazi|tura>` (\xD6rn: `!cf 100 yazi`)").catch(() => {
        });
        return;
      }
      try {
        const res = EconomyManager.coinflip(message.author.id, bet, choice);
        if (res.win) {
          await message.reply(`\u{1FA99} Para at\u0131ld\u0131: **${res.result.toUpperCase()}** geldi! \u{1F389} **+${bet} Nights Coin** kazand\u0131n!`).catch(() => {
          });
        } else {
          await message.reply(`\u{1FA99} Para at\u0131ld\u0131: **${res.result.toUpperCase()}** geldi! \u{1F622} **-${bet} Nights Coin** kaybettin.`).catch(() => {
          });
        }
      } catch (err) {
        await message.reply(`\u274C ${err.message}`).catch(() => {
        });
      }
      return;
    }
    if (cmd === "!slot") {
      const bet = parseInt(args[1], 10);
      if (isNaN(bet) || bet <= 0) {
        await message.reply("\u{1F4A1} Kullan\u0131m: `!slot <miktar>` (\xD6rn: `!slot 50`)").catch(() => {
        });
        return;
      }
      try {
        const res = EconomyManager.slot(message.author.id, bet);
        const slotLine = `\u{1F3B0} [ ${res.symbols.join(" | ")} ] \u{1F3B0}`;
        if (res.win) {
          await message.reply(`${slotLine}
\u{1F389} **TEBR\u0130KLER!** (${res.multiplier}x) **+${res.change} Nights Coin** kazand\u0131n!`).catch(() => {
          });
        } else {
          await message.reply(`${slotLine}
\u{1F622} **KAYBETT\u0130N!** **-${bet} Nights Coin** gitti. \u015Eans\u0131n\u0131 tekrar dene!`).catch(() => {
          });
        }
      } catch (err) {
        await message.reply(`\u274C ${err.message}`).catch(() => {
        });
      }
      return;
    }
    if (cmd === "!evlen") {
      const targetUser = message.mentions.users.first();
      if (!targetUser) {
        await message.reply("\u{1F4A1} Kullan\u0131m: `!evlen @kullan\u0131c\u0131`").catch(() => {
        });
        return;
      }
      await SocialManager.propose(message.author, targetUser, message);
      return;
    }
    if (cmd === "!bosan") {
      const res = SocialManager.divorce(message.author.id);
      await message.reply(res.message).catch(() => {
      });
      return;
    }
    if (cmd === "!evlilik" || cmd === "!evli") {
      const targetUser = message.mentions.users.first() || message.author;
      const embed = SocialManager.getMarriageEmbed(targetUser);
      await message.reply({ embeds: [embed] }).catch(() => {
      });
      return;
    }
    if (cmd === "!saril" || cmd === "!sar\u0131l") {
      const targetUser = message.mentions.users.first();
      if (!targetUser) {
        await message.reply("\u{1F4A1} Kullan\u0131m: `!saril @kullan\u0131c\u0131`").catch(() => {
        });
        return;
      }
      const embed = SocialManager.getActionEmbed("hug", message.author, targetUser);
      await message.reply({ embeds: [embed] }).catch(() => {
      });
      return;
    }
    if (cmd === "!tokat") {
      const targetUser = message.mentions.users.first();
      if (!targetUser) {
        await message.reply("\u{1F4A1} Kullan\u0131m: `!tokat @kullan\u0131c\u0131`").catch(() => {
        });
        return;
      }
      const embed = SocialManager.getActionEmbed("slap", message.author, targetUser);
      await message.reply({ embeds: [embed] }).catch(() => {
      });
      return;
    }
    if (cmd === "!op" || cmd === "!\xF6p") {
      const targetUser = message.mentions.users.first();
      if (!targetUser) {
        await message.reply("\u{1F4A1} Kullan\u0131m: `!op @kullan\u0131c\u0131`").catch(() => {
        });
        return;
      }
      const embed = SocialManager.getActionEmbed("kiss", message.author, targetUser);
      await message.reply({ embeds: [embed] }).catch(() => {
      });
      return;
    }
    if (cmd === "!kahve") {
      const targetUser = message.mentions.users.first();
      if (!targetUser) {
        await message.reply("\u{1F4A1} Kullan\u0131m: `!kahve @kullan\u0131c\u0131`").catch(() => {
        });
        return;
      }
      const embed = SocialManager.getActionEmbed("coffee", message.author, targetUser);
      await message.reply({ embeds: [embed] }).catch(() => {
      });
      return;
    }
    if (cmd === "!yardim" || cmd === "!komutlar") {
      const helpEmbed = new import_discord42.EmbedBuilder().setTitle("\u{1F3AE} NIGHTS GUARD E\u011ELENCE & S\u0130STEM KOMUTLARI").setDescription(
        "Sunucumuzda kullanabilece\u011Finiz h\u0131zl\u0131 interaktif komutlar:\n\n### \u26A1 Level & Aktiflik:\n\u2022 `!rank` \u2014 Kendi seviye kart\u0131n\u0131z\u0131 ve XP durumunuzu g\xF6sterir\n\u2022 `!top` \u2014 Sunucu aktiflik liderlik tablosunu g\xF6sterir\n\n### \u{1F4B0} Ekonomi & Oyunlar:\n\u2022 `!gunluk` \u2014 G\xFCnl\xFCk 500 Nights Coin \xF6d\xFCl\xFCn\xFCz\xFC al\u0131r\n\u2022 `!bakiye` \u2014 Mevcut paran\u0131z\u0131 g\xF6r\xFCnt\xFCler\n\u2022 `!calis` \u2014 30 dakikada bir \xE7al\u0131\u015Farak para kazand\u0131r\u0131r\n\u2022 `!cf <miktar> <yazi|tura>` \u2014 Yaz\u0131 tura bahsi oynar\n\u2022 `!slot <miktar>` \u2014 Slot kumar makinesini \xE7evirir\n\n### \u{1F3B2} Sunucu \u0130\xE7i Oyun Kanallar\u0131:\n\u2022 <#1568644567517896815> \u2014 Otomatik Kelime T\xFCretmece\n\u2022 `#owo-gambling-1 & 2` \u2014 H\u0131zl\u0131 1sn OwO Oyun Odalar\u0131"
      ).setColor("#8B5CF6").setFooter({ text: "Nights Interactive Engine \u2022 Made by erencix" });
      await message.reply({ embeds: [helpEmbed] }).catch(() => {
      });
      return;
    }
    if (cmd === "!dm" || cmd === "!duyuru" || cmd === "!mesajgonder") {
      const ownerId = config.ownerId || "1138498666785677492";
      const isOwner = message.author.id === ownerId;
      const isAdmin = message.member?.permissions.has(import_discord41.PermissionFlagsBits.Administrator);
      if (!isOwner && !isAdmin) {
        await message.reply("\u26D4 **Eri\u015Fim Engellendi:** Bu komut yaln\u0131zca sunucu kurucusu taraf\u0131ndan kullan\u0131labilir!").catch(() => {
        });
        return;
      }
      const rawMsg = args.slice(1).join(" ").trim();
      if (!rawMsg) {
        await message.reply("\u{1F4A1} Kullan\u0131m: `!dm <duyuru metni>` veya `/mesajg\xF6nder mesaj:<metin>`").catch(() => {
        });
        return;
      }
      const guild = message.guild;
      if (!guild) return;
      const progressMsg = await message.reply("\u23F3 **Toplu DM G\xF6nderimi Ba\u015Flat\u0131l\u0131yor...** L\xFCtfen bekleyin.").catch(() => null);
      const allMembers = await guild.members.fetch();
      const candidates = Array.from(allMembers.values()).filter((m) => !m.user.bot);
      const dmEmbed = new import_discord42.EmbedBuilder().setTitle("\u{1F4E2} NIGHTS TOPLULUK RESM\u0130 DUYURUSU").setDescription(rawMsg).setColor("#8B5CF6").setThumbnail(guild.iconURL({ size: 256 }) || message.author.displayAvatarURL()).addFields(
        { name: "\u{1F451} G\xF6nderen Yetkili", value: `<@${message.author.id}>`, inline: true },
        { name: "\u{1F310} Sunucu", value: `**${guild.name}**`, inline: true }
      ).setImage("https://media.giphy.com/media/EPfV3ijMQVl60/giphy.gif").setFooter({ text: "Nights Community Broadcast Engine \u2022 Made by erencix" }).setTimestamp();
      let successCount = 0;
      let failedCount = 0;
      for (let i = 0; i < candidates.length; i++) {
        try {
          await candidates[i].send({ embeds: [dmEmbed] });
          successCount++;
        } catch {
          failedCount++;
        }
        if (i < candidates.length - 1) {
          await new Promise((r) => setTimeout(r, 1200));
        }
      }
      if (progressMsg) {
        await progressMsg.edit(`\u2705 **Toplu DM Tamamland\u0131!** Toplam: **${candidates.length}** | Ula\u015Fan: **${successCount}** | DM Kapal\u0131: **${failedCount}**`).catch(() => {
        });
      }
      return;
    }
    const cleanContent = message.content.trim().toLowerCase();
    const isSa = /^(sa|s\.a|s\.a\.|selamun aleykum|selamun aleyküm|selamün aleyküm|sea)$/i.test(cleanContent);
    const isHello = /^(selam|merhaba|merhabalar|slm|mrb|hey)$/i.test(cleanContent);
    const isHg = /^(hg|hoş geldin|hos geldin|hoşgeldin|hosgeldin|hoşgeldiniz|hosgeldiniz)$/i.test(cleanContent);
    const isHb = /^(hb|hoş bulduk|hos bulduk|hoşbulduk|hosbulduk)$/i.test(cleanContent);
    if (isSa || isHello || isHg || isHb) {
      const now = Date.now();
      const lastGreet = client._lastGreetTime || 0;
      if (now - lastGreet > 3e3) {
        client._lastGreetTime = now;
        if (isSa) {
          const saReplies = [
            `Aleyk\xFCm selam <@${message.author.id}>, ho\u015F geldin! Nas\u0131ls\u0131n? \u{1F44B}`,
            `Aleyk\xFCm selam kral, ho\u015F geldin! G\xFCn\xFCn nas\u0131l ge\xE7iyor? \u2728`,
            `Ve aleyk\xFCm selam <@${message.author.id}>! Ho\u015F geldin, iyi sohbetler dilerim! \u{1F60A}`
          ];
          const reply = saReplies[Math.floor(Math.random() * saReplies.length)];
          await message.reply(reply).catch(() => {
          });
        } else if (isHello) {
          const helloReplies = [
            `Merhaba <@${message.author.id}>, ho\u015F geldin! Nas\u0131ls\u0131n? \u{1F60A}`,
            `Selamlar <@${message.author.id}>! Aram\u0131za ho\u015F geldin, keyifler nas\u0131l? \u2728`,
            `Merhaba kral! Ho\u015F geldin, sohbete kat\u0131lmana sevindik! \u{1F44B}`
          ];
          const reply = helloReplies[Math.floor(Math.random() * helloReplies.length)];
          await message.reply(reply).catch(() => {
          });
        } else if (isHg) {
          const hgReplies = [
            `Ho\u015F bulduk <@${message.author.id}>, te\u015Fekk\xFCrler! Nas\u0131ls\u0131n? \u2728`,
            `Ho\u015F bulduk kral! \u0130yi sohbetler, g\xFCn\xFCn g\xFCzel ge\xE7sin! \u{1F60A}`,
            `Ho\u015F bulduk! Keyifler nas\u0131l, iyisindir umar\u0131m? \u{1F44B}`
          ];
          const reply = hgReplies[Math.floor(Math.random() * hgReplies.length)];
          await message.reply(reply).catch(() => {
          });
        } else if (isHb) {
          await message.reply(`Aram\u0131za tekrar ho\u015F geldin <@${message.author.id}>! Keyifli vakitler dileriz! \u{1F389}`).catch(() => {
          });
        }
      }
    }
  });
  client.on(import_discord41.Events.GuildMemberAdd, async (member) => {
    try {
      console.log(`[GuildMemberAdd] Yeni \xFCye kat\u0131ld\u0131: ${member.user.tag} (${member.id})`);
      if (member.user.bot) {
        const roles = await member.guild.roles.fetch();
        const botRole = roles.find(
          (r) => r.name.toLowerCase() === "bot" || r.name.includes("Bot")
        );
        const approvedRole = roles.find(
          (r) => r.name.toLowerCase() === "onayl\u0131" || r.name.includes("Onayl\u0131") || r.name.toLowerCase().includes("onaylan")
        );
        const rolesToAdd = [botRole, approvedRole].filter(Boolean);
        if (rolesToAdd.length > 0) {
          await member.roles.add(rolesToAdd).catch(() => {
          });
          console.log(`\u{1F916} Yeni bot sunucuya kat\u0131ld\u0131; Bot ve Onayl\u0131 rolleri verildi: ${member.user.tag}`);
        }
      } else {
        const channels = await member.guild.channels.fetch();
        const welcomeCh = channels.find(
          (c) => c && c.name.includes("hos-geldin") && c.isTextBased()
        );
        if (welcomeCh) {
          const inviteInfo = await InviteTracker.findInviter(member);
          let inviterStr = "Bilinmiyor / Do\u011Frudan Kat\u0131l\u0131m \u{1F310}";
          let welcomeContent = `\u{1F389} Aram\u0131za yeni bir \xFCye kat\u0131ld\u0131! Ho\u015F geldin <@${member.id}> \u{1F44B}`;
          if (inviteInfo.inviter) {
            inviterStr = `<@${inviteInfo.inviter.id}> (\`${inviteInfo.inviter.tag}\`) \u2022 **${inviteInfo.uses}.** Daveti \u{1F3AF}`;
            welcomeContent = `\u{1F389} Aram\u0131za yeni bir \xFCye kat\u0131ld\u0131! Ho\u015F geldin <@${member.id}> \u{1F44B} (Davet eden: <@${inviteInfo.inviter.id}>)`;
          } else if (inviteInfo.isVanity) {
            inviterStr = `\xD6zel Sunucu Linki (\`${inviteInfo.code}\`) \u{1F517}`;
          }
          const avatarUrl = member.user.displayAvatarURL({ size: 256 });
          const welcomeEmbed = new import_discord42.EmbedBuilder().setTitle(`\u{1F44B} ARAMIZA HO\u015E GELD\u0130N, ${member.displayName}!`).setDescription(
            `Hey <@${member.id}>, **${member.guild.name}** sunucumuza ho\u015F geldin! \u{1F389}

> \u{1F4E8} **Davet Eden:** ${inviterStr}
> \u{1F6E1}\uFE0F **Kay\u0131t Olmak \u0130\xE7in:** <#1568644551797899368> kanal\u0131ndan kayd\u0131n\u0131z\u0131 tamamlay\u0131p t\xFCm odalar\u0131n kilidini a\xE7abilirsiniz.
> \u{1F4DC} **Kurallar:** Sunucu huzurumuz i\xE7in <#1568644556139008154> kanal\u0131na g\xF6z atmay\u0131 unutmay\u0131n.

\u{1F4CA} **Seninle Birlikte:** Toplam **${member.guild.memberCount}** Ki\u015Fi Olduk! \u2728`
          ).setColor("#2ECC71").setThumbnail(avatarUrl).setImage("https://media.giphy.com/media/26tn3334mvoVClhos/giphy.gif").setFooter({ text: "Nights Community \u2022 Made by erencix" }).setTimestamp();
          await welcomeCh.send({
            content: welcomeContent,
            embeds: [welcomeEmbed]
          }).catch((err) => console.warn("[GuildMemberAdd] Mesaj iletilemedi:", err.message));
          console.log(`[GuildMemberAdd] #hos-geldin mesaj\u0131 g\xF6nderildi: ${member.user.tag} (Davet eden: ${inviterStr})`);
        } else {
          console.warn("[GuildMemberAdd] #hos-geldin kanal\u0131 bulunamad\u0131!");
        }
      }
    } catch (err) {
      console.warn("[GuildMemberAdd] Hata:", err.message);
    }
  });
  client.on(import_discord41.Events.GuildCreate, async (guild) => {
    const allowedGuildId = "1568618183223414934";
    const allowedOwnerId = config.ownerId || "1138498666785677492";
    if (guild.id !== allowedGuildId && guild.ownerId !== allowedOwnerId) {
      console.warn(`[G\xFCvenlik] \u0130zin verilmeyen sunucuya eklendi, derhal ayr\u0131l\u0131n\u0131yor: ${guild.name} (${guild.id})`);
      try {
        await guild.leave();
      } catch (err) {
        console.error("Sunucudan ayr\u0131l\u0131rken hata:", err.message);
      }
    }
  });
  process.on("unhandledRejection", (reason, promise) => {
    if (reason && (reason.message?.includes("Cannot perform IP discovery") || reason.message?.includes("socket closed") || reason.code === 10062 || reason.code === 40060 || reason.message?.includes("Unknown interaction") || reason.message?.includes("already been acknowledged"))) {
      console.warn("[Process] A\u011F / Discord etkile\u015Fim uyar\u0131s\u0131 otomatik kar\u015F\u0131land\u0131.");
      return;
    }
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
  });
  process.on("uncaughtException", (err) => {
    if (err && (err.message?.includes("Cannot perform IP discovery") || err.message?.includes("socket closed") || err.code === 10062 || err.code === 40060 || err.message?.includes("Unknown interaction") || err.message?.includes("already been acknowledged"))) {
      console.warn("[Process] \xD6nemsiz Discord etkile\u015Fim istisnas\u0131 toparland\u0131.");
      return;
    }
    console.error("Uncaught Exception:", err);
  });
  process.on("SIGINT", () => {
    console.log("\nBot kapat\u0131l\u0131yor...");
    client.destroy();
    process.exit(0);
  });
  try {
    await client.login(config.discordToken);
  } catch (err) {
    console.error("Discord API Giri\u015F Hatas\u0131:", err.message);
  }
}
if (require.main === module) {
  bootstrap();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  bootstrap
});
