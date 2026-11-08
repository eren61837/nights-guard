"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmartBlueprintGenerator = void 0;
class SmartBlueprintGenerator {
    static generate(options) {
        const promptLower = options.prompt.toLowerCase();
        const isEnglish = options.locale === 'en';
        // 1. Detect Category / Theme
        let themeType = 'community';
        if (promptLower.includes('oyun') ||
            promptLower.includes('game') ||
            promptLower.includes('gaming') ||
            promptLower.includes('valorant') ||
            promptLower.includes('minecraft') ||
            promptLower.includes('roblox') ||
            promptLower.includes('cs') ||
            promptLower.includes('espor')) {
            themeType = 'gaming';
        }
        else if (promptLower.includes('anime') ||
            promptLower.includes('manga') ||
            promptLower.includes('weeb') ||
            promptLower.includes('roleplay') ||
            promptLower.includes('rp')) {
            themeType = 'anime';
        }
        else if (promptLower.includes('yazılım') ||
            promptLower.includes('kod') ||
            promptLower.includes('coding') ||
            promptLower.includes('software') ||
            promptLower.includes('developer') ||
            promptLower.includes('bot')) {
            themeType = 'coding';
        }
        else if (promptLower.includes('kripto') ||
            promptLower.includes('borsa') ||
            promptLower.includes('trade') ||
            promptLower.includes('trading') ||
            promptLower.includes('yatırım')) {
            themeType = 'trading';
        }
        const preset = isEnglish
            ? this.getEnglishPreset(themeType, options.prompt)
            : this.getTurkishPreset(themeType, options.prompt);
        return {
            serverName: preset.serverName,
            serverDescription: preset.serverDescription,
            theme: preset.theme,
            locale: isEnglish ? 'en' : 'tr',
            iconPrompt: preset.iconPrompt,
            roles: preset.roles,
            categories: preset.categories,
            automodRules: preset.automodRules,
            richEmbeds: preset.richEmbeds,
            features: preset.features,
        };
    }
    static getTurkishPreset(theme, userPrompt) {
        let titlePrefix = 'Efsane';
        let iconPrompt = 'Professional modern discord server logo, neon futuristic aesthetic, vector icon, high resolution, 4k';
        if (theme === 'gaming') {
            titlePrefix = 'Apex Legends & Gaming TR';
            iconPrompt = 'Esports gaming team crest logo, aggressive cyberpunk lion or wolf, neon purple and cyan, vector emblem, 512x512';
        }
        else if (theme === 'anime') {
            titlePrefix = 'Neo Tokyo Anime Community';
            iconPrompt = 'Cyberpunk anime character profile silhouette, cherry blossom neon aesthetic, sleek modern logo, 512x512';
        }
        else if (theme === 'coding') {
            titlePrefix = 'DevHub & Kodlama Topluluğu';
            iconPrompt = 'Modern programming developer logo, glowing terminal bracket code emblem, dark theme cyan neon, 512x512';
        }
        else if (theme === 'trading') {
            titlePrefix = 'Alpha Traders & Finans';
            iconPrompt = 'Cryptocurrency investment bull and candle chart logo, gold and dark blue luxury emblem, 512x512';
        }
        return {
            name: theme,
            serverName: `${titlePrefix}`,
            serverDescription: `${userPrompt.slice(0, 100)} - AI Architect tarafından tasarlandı.`,
            theme: `${theme.toUpperCase()} Topluluğu`,
            iconPrompt,
            roles: [
                {
                    name: '👑 Kurucu',
                    color: '#E74C3C',
                    hoist: true,
                    mentionable: true,
                    permissions: ['Administrator'],
                },
                {
                    name: '💎 Yönetici',
                    color: '#E67E22',
                    hoist: true,
                    mentionable: true,
                    permissions: [
                        'ManageGuild',
                        'ManageRoles',
                        'ManageChannels',
                        'KickMembers',
                        'BanMembers',
                        'ManageMessages',
                        'ModerateMembers',
                        'ViewChannel',
                        'SendMessages',
                        'Connect',
                        'Speak',
                    ],
                },
                {
                    name: '🛡️ Moderatör',
                    color: '#3498DB',
                    hoist: true,
                    mentionable: true,
                    permissions: [
                        'ManageMessages',
                        'ModerateMembers',
                        'KickMembers',
                        'ViewChannel',
                        'SendMessages',
                        'Connect',
                        'Speak',
                        'MuteMembers',
                        'DeafenMembers',
                    ],
                },
                {
                    name: '⭐ Özel Üye (VIP)',
                    color: '#F1C40F',
                    hoist: true,
                    mentionable: false,
                    permissions: ['ViewChannel', 'SendMessages', 'EmbedLinks', 'AttachFiles', 'Connect', 'Speak', 'Stream'],
                },
                {
                    name: '⚡ Sadık Üye',
                    color: '#9B59B6',
                    hoist: true,
                    mentionable: false,
                    permissions: ['ViewChannel', 'SendMessages', 'Connect', 'Speak', 'Stream'],
                },
                {
                    name: '👥 Üye',
                    color: '#2ECC71',
                    hoist: false,
                    mentionable: false,
                    permissions: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'Connect', 'Speak'],
                },
                {
                    name: '🤖 Botlar',
                    color: '#95A5A6',
                    hoist: true,
                    mentionable: false,
                    permissions: ['ViewChannel', 'SendMessages', 'EmbedLinks'],
                },
                {
                    name: '🔇 Susturuldu',
                    color: '#7F8C8D',
                    hoist: false,
                    mentionable: false,
                    permissions: [],
                },
            ],
            categories: [
                {
                    name: '📌・BİLGİLENDİRME & KURALLAR',
                    channels: [
                        {
                            name: '📜・kurallar',
                            type: 'GUILD_TEXT',
                            topic: 'Sunucu kuralları ve topluluk standartları.',
                            permissionOverwrites: [
                                { roleName: '@everyone', allow: ['ViewChannel', 'ReadMessageHistory'], deny: ['SendMessages', 'AddReactions'] },
                                { roleName: '🛡️ Moderatör', allow: ['SendMessages', 'ManageMessages'] },
                            ],
                        },
                        {
                            name: '📢・duyurular',
                            type: 'GUILD_ANNOUNCEMENT',
                            topic: 'Önemli gelişmeler ve güncellemeler.',
                            permissionOverwrites: [
                                { roleName: '@everyone', allow: ['ViewChannel', 'ReadMessageHistory'], deny: ['SendMessages'] },
                                { roleName: '💎 Yönetici', allow: ['SendMessages'] },
                            ],
                        },
                        {
                            name: '👋・hos-geldiniz',
                            type: 'GUILD_TEXT',
                            topic: 'Yeni katılan üyelerimiz.',
                            permissionOverwrites: [
                                { roleName: '@everyone', allow: ['ViewChannel', 'ReadMessageHistory'], deny: ['SendMessages'] },
                            ],
                        },
                        {
                            name: '🎭・rol-al',
                            type: 'GUILD_TEXT',
                            topic: 'İlgi alanlarınıza göre rollerinizi seçin.',
                            permissionOverwrites: [
                                { roleName: '@everyone', allow: ['ViewChannel', 'ReadMessageHistory'], deny: ['SendMessages'] },
                            ],
                        },
                    ],
                },
                {
                    name: '💬・TOPLULUK METİN ALANI',
                    channels: [
                        {
                            name: '💬・genel-sohbet',
                            type: 'GUILD_TEXT',
                            topic: 'Saygı çerçevesinde her telden sohbet alanı.',
                            rateLimitPerUser: 2,
                        },
                        {
                            name: '📷・medya-galeri',
                            type: 'GUILD_TEXT',
                            topic: 'Fotoğraf, video ve klip paylaşımları.',
                        },
                        {
                            name: '🤖・bot-komut',
                            type: 'GUILD_TEXT',
                            topic: 'Bot komutlarını bu kanaldan kullanabilirsiniz.',
                        },
                        {
                            name: '💡・oneri-sikayet',
                            type: 'GUILD_TEXT',
                            topic: 'Sunucuyu geliştirmek için tavsiyeleriniz.',
                        },
                    ],
                },
                {
                    name: '🔊・SES KANALLARI',
                    channels: [
                        {
                            name: '➕・Oda Oluştur',
                            type: 'GUILD_VOICE',
                            topic: 'Tıkla ve kendi özel odanı otomatik oluştur!',
                        },
                        {
                            name: '🔊・Sohbet Odası #1',
                            type: 'GUILD_VOICE',
                        },
                        {
                            name: '🔊・Sohbet Odası #2',
                            type: 'GUILD_VOICE',
                        },
                        {
                            name: '🎮・Oyun Odası [Duo]',
                            type: 'GUILD_VOICE',
                        },
                        {
                            name: '🎮・Oyun Odası [Squad]',
                            type: 'GUILD_VOICE',
                        },
                        {
                            name: '🎵・Müzik Dinleme Odası',
                            type: 'GUILD_VOICE',
                        },
                        {
                            name: '💤・AFK Odası',
                            type: 'GUILD_VOICE',
                        },
                    ],
                },
                {
                    name: '🎫・DESTEK & TICKET',
                    channels: [
                        {
                            name: '🎫・destek-talebi',
                            type: 'GUILD_TEXT',
                            topic: 'Yetkililere özel talep oluşturmak için aşağıdaki butona basınız.',
                            permissionOverwrites: [
                                { roleName: '@everyone', allow: ['ViewChannel', 'ReadMessageHistory'], deny: ['SendMessages'] },
                            ],
                        },
                    ],
                },
                {
                    name: '🛡️・YÖNETİM & MODERASYON',
                    permissionOverwrites: [
                        { roleName: '@everyone', deny: ['ViewChannel'] },
                        { roleName: '🛡️ Moderatör', allow: ['ViewChannel', 'SendMessages', 'Connect', 'Speak'] },
                    ],
                    channels: [
                        {
                            name: '🔒・yetkili-sohbet',
                            type: 'GUILD_TEXT',
                            topic: 'Yetkili ekibi özel iletişim kanalı.',
                        },
                        {
                            name: '📋・mod-log',
                            type: 'GUILD_TEXT',
                            topic: 'Moderasyon işlem kayıtları.',
                        },
                        {
                            name: '🔊・Yetkili Toplantı',
                            type: 'GUILD_VOICE',
                        },
                    ],
                },
            ],
            automodRules: [
                {
                    name: '🛡️ Küfür ve Hakaret Filtresi',
                    triggerType: 'KEYWORD',
                    keywordFilter: ['*amk*', '*orospu*', '*piç*', '*küfür*', '*discord.gg/*'],
                },
                {
                    name: '🚫 Bahsetme (Mention) Spam Koruması',
                    triggerType: 'MENTION_SPAM',
                    mentionLimit: 5,
                },
            ],
            richEmbeds: [
                {
                    channelName: '📜・kurallar',
                    title: '📜 TOPLULUK KURALLARI VE STANDARTLARI',
                    description: 'Sunucumuza katılan tüm üyeler aşağıdaki kuralları peşinen kabul etmiş sayılır. Keyifli ve güvenli bir ortam için lütfen kurallara uyunuz.',
                    color: '#3498DB',
                    fields: [
                        {
                            name: '1. Karşılıklı Saygı',
                            value: 'Her türlü ırkçılık, cinsiyetçilik, din ve siyaset tartışması, nefret söylemi kesinlikle yasaktır.',
                        },
                        {
                            name: '2. Reklam ve Tanıtım',
                            value: 'Özelden (DM) veya kanallardan izinsiz sunucu, ürün ve davet linki paylaşımı kalıcı ban sebebidir.',
                        },
                        {
                            name: '3. Spam ve Flood',
                            value: 'Kanallarda büyük harflerle (CAPS LOCK) art arda yazmak, flood yapmak veya ses kanallarında bas basmak yasaktır.',
                        },
                        {
                            name: '4. Yetkili Kararları',
                            value: 'Yönetim ekibinin uyarılarını dikkate alınız. Haksızlık olduğunu düşündüğünüz durumlarda Ticket açabilirsiniz.',
                        },
                    ],
                    footer: 'Discord AI Architect tarafından otomatik oluşturuldu • İyi vakitler dileriz!',
                },
                {
                    channelName: '👋・hos-geldiniz',
                    title: '✨ SUNUCUMUZA HOŞ GELDİNİZ!',
                    description: 'Aramıza katıldığın için çok mutluyuz! Topluluğumuzda samimi sohbetler edebilir, oyun arkadaşları bulabilir ve etkinliklerimize katılabilirsin.',
                    color: '#2ECC71',
                    fields: [
                        {
                            name: '🚀 İlk Adımlar',
                            value: '• #📜・kurallar kanalından kuralları oku.\n• #🎭・rol-al kanalından rollerini seç.\n• #💬・genel-sohbet kanalına gelip bir selam ver!',
                        },
                        {
                            name: '🎧 Ses Odaları',
                            value: '➕・Oda Oluştur kanalına tıklayarak kendine özel geçici ses odası oluşturabilirsin.',
                        },
                    ],
                    footer: 'Topluluğumuza hoş geldin!',
                },
            ],
            features: {
                ticketSystem: {
                    enabled: true,
                    categoryName: '🎫・DESTEK & TICKET',
                    panelChannel: '🎫・destek-talebi',
                    buttonLabel: 'Destek Talebi Aç',
                    buttonEmoji: '📩',
                    embedTitle: '🎫 Destek & Yardım Paneli',
                    embedDescription: 'Sunucuyla ilgili bir şikayetiniz, öneriniz veya yetkili ekibimizle özel olarak görüşmek istediğiniz bir konu varsa aşağıdaki butona basarak özel destek talebi açabilirsiniz.',
                    supportRoleName: '🛡️ Moderatör',
                },
                joinToCreate: {
                    enabled: true,
                    categoryName: '🔊・SES KANALLARI',
                    triggerChannel: '➕・Oda Oluştur',
                    userRoomPrefix: '🔊・',
                },
                autoRoleName: '👥 Üye',
            },
        };
    }
    static getEnglishPreset(theme, userPrompt) {
        return {
            name: theme,
            serverName: `Elite ${theme.toUpperCase()} Hub`,
            serverDescription: `${userPrompt.slice(0, 100)} - Built by AI Architect.`,
            theme: `${theme.toUpperCase()} Community`,
            iconPrompt: 'Modern futuristic discord server emblem, high tech minimalism, 512x512',
            roles: [
                {
                    name: '👑 Owner',
                    color: '#E74C3C',
                    hoist: true,
                    mentionable: true,
                    permissions: ['Administrator'],
                },
                {
                    name: '💎 Administrator',
                    color: '#E67E22',
                    hoist: true,
                    mentionable: true,
                    permissions: [
                        'ManageGuild',
                        'ManageRoles',
                        'ManageChannels',
                        'KickMembers',
                        'BanMembers',
                        'ManageMessages',
                        'ModerateMembers',
                        'ViewChannel',
                        'SendMessages',
                        'Connect',
                        'Speak',
                    ],
                },
                {
                    name: '🛡️ Moderator',
                    color: '#3498DB',
                    hoist: true,
                    mentionable: true,
                    permissions: ['ManageMessages', 'ModerateMembers', 'KickMembers', 'ViewChannel', 'SendMessages', 'Connect', 'Speak'],
                },
                {
                    name: '⭐ VIP',
                    color: '#F1C40F',
                    hoist: true,
                    mentionable: false,
                    permissions: ['ViewChannel', 'SendMessages', 'Connect', 'Speak', 'Stream'],
                },
                {
                    name: '👥 Member',
                    color: '#2ECC71',
                    hoist: false,
                    mentionable: false,
                    permissions: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'Connect', 'Speak'],
                },
            ],
            categories: [
                {
                    name: '📌・INFORMATION',
                    channels: [
                        {
                            name: '📜・rules',
                            type: 'GUILD_TEXT',
                            permissionOverwrites: [{ roleName: '@everyone', allow: ['ViewChannel'], deny: ['SendMessages'] }],
                        },
                        {
                            name: '📢・announcements',
                            type: 'GUILD_ANNOUNCEMENT',
                            permissionOverwrites: [{ roleName: '@everyone', allow: ['ViewChannel'], deny: ['SendMessages'] }],
                        },
                    ],
                },
                {
                    name: '💬・TEXT LOUNGE',
                    channels: [
                        { name: '💬・general-chat', type: 'GUILD_TEXT' },
                        { name: '📷・media', type: 'GUILD_TEXT' },
                        { name: '🤖・bot-commands', type: 'GUILD_TEXT' },
                    ],
                },
                {
                    name: '🔊・VOICE LOUNGES',
                    channels: [
                        { name: '➕・Create Voice', type: 'GUILD_VOICE' },
                        { name: '🔊・Lounge #1', type: 'GUILD_VOICE' },
                        { name: '🔊・Lounge #2', type: 'GUILD_VOICE' },
                    ],
                },
                {
                    name: '🎫・SUPPORT',
                    channels: [{ name: '🎫・create-ticket', type: 'GUILD_TEXT' }],
                },
            ],
            automodRules: [
                {
                    name: '🛡️ Link Protection & Anti-Spam',
                    triggerType: 'KEYWORD',
                    keywordFilter: ['*discord.gg/*', '*free nitro*'],
                },
            ],
            richEmbeds: [
                {
                    channelName: '📜・rules',
                    title: '📜 COMMUNITY RULES & GUIDELINES',
                    description: 'Welcome! Please adhere to our discord guidelines to ensure a friendly atmosphere.',
                    color: '#3498DB',
                    fields: [
                        { name: '1. Respect Others', value: 'Harassment, hate speech, and toxicity will result in immediate bans.' },
                        { name: '2. No Self Promotion', value: 'Unsolicited advertising in channels or DMs is strictly prohibited.' },
                    ],
                },
            ],
            features: {
                ticketSystem: {
                    enabled: true,
                    categoryName: '🎫・SUPPORT',
                    panelChannel: '🎫・create-ticket',
                    buttonLabel: 'Open Ticket',
                    buttonEmoji: '📩',
                    embedTitle: '🎫 Help & Support',
                    embedDescription: 'Click the button below to reach out to the moderation team.',
                    supportRoleName: '🛡️ Moderator',
                },
                joinToCreate: {
                    enabled: true,
                    categoryName: '🔊・VOICE LOUNGES',
                    triggerChannel: '➕・Create Voice',
                    userRoomPrefix: '🔊・',
                },
                autoRoleName: '👥 Member',
            },
        };
    }
}
exports.SmartBlueprintGenerator = SmartBlueprintGenerator;
