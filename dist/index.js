"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrap = bootstrap;
const discord_js_1 = require("discord.js");
const config_1 = require("./config");
const aiManager_1 = require("./services/ai/aiManager");
const interactionCreate_1 = require("./events/interactionCreate");
const ready_1 = require("./events/ready");
const voiceStateUpdate_1 = require("./events/voiceStateUpdate");
const dashboardServer_1 = require("./services/web/dashboardServer");
const kelimeOyunu_1 = require("./services/features/kelimeOyunu");
const autoSecurityGuard_1 = require("./services/features/autoSecurityGuard");
const levelManager_1 = require("./services/features/levelManager");
const economyManager_1 = require("./services/features/economyManager");
const afkManager_1 = require("./services/features/afkManager");
const auditLogManager_1 = require("./services/features/auditLogManager");
const aiChatManager_1 = require("./services/features/aiChatManager");
const socialManager_1 = require("./services/features/socialManager");
const inviteTracker_1 = require("./services/features/inviteTracker");
const musicPlayer_1 = require("./services/features/musicPlayer");
const discord_js_2 = require("discord.js");
async function bootstrap() {
    console.log('🚀 Nights Guard • Made by erencix başlatılıyor...');
    const validation = (0, config_1.validateConfig)();
    if (validation.warnings.length > 0) {
        validation.warnings.forEach((w) => console.warn(`⚠️ [UYARI]: ${w}`));
    }
    // Linux ortamında ffmpeg ve yt-dlp binarylerini otomatik hazırla
    await musicPlayer_1.MusicPlayer.ensureLinuxBinaries();
    // Start companion web dashboard
    const port = parseInt(process.env.PORT || '3000', 10);
    const dashboard = new dashboardServer_1.DashboardServer(port);
    try {
        await dashboard.start();
    }
    catch (err) {
        console.warn(`[Web Dashboard] Başlatılamadı: ${err.message}`);
    }
    if (!validation.valid) {
        validation.errors.forEach((e) => console.error(`❌ [HATA]: ${e}`));
        console.error('\nLütfen .env dosyasındaki DISCORD_TOKEN bilgisini girip tekrar başlatın.');
        console.log('💡 İpucu: Kurulum sihirbazı için: npm run setup (veya kurulum.bat)');
        console.log('💡 İpucu: Token olmadan sistemi anında test etmek için: npm run demo (veya demo.bat)');
        if (process.env.NODE_ENV !== 'test') {
            process.exit(1);
        }
        return;
    }
    const client = new discord_js_1.Client({
        intents: [
            discord_js_1.GatewayIntentBits.Guilds,
            discord_js_1.GatewayIntentBits.GuildMembers,
            discord_js_1.GatewayIntentBits.GuildVoiceStates,
            discord_js_1.GatewayIntentBits.GuildMessages,
            discord_js_1.GatewayIntentBits.MessageContent,
            discord_js_1.GatewayIntentBits.GuildEmojisAndStickers,
            discord_js_1.GatewayIntentBits.GuildInvites,
        ],
        partials: [discord_js_1.Partials.Channel, discord_js_1.Partials.GuildMember, discord_js_1.Partials.Message, discord_js_1.Partials.User],
    });
    const aiManager = new aiManager_1.AIManager();
    const interactionHandler = new interactionCreate_1.InteractionHandler(aiManager);
    // Events
    client.once(discord_js_1.Events.ClientReady, async () => {
        await (0, ready_1.onReady)(client);
        await inviteTracker_1.InviteTracker.init(client);
    });
    client.on(discord_js_1.Events.InviteCreate, (invite) => inviteTracker_1.InviteTracker.onInviteCreate(invite));
    client.on(discord_js_1.Events.InviteDelete, (invite) => inviteTracker_1.InviteTracker.onInviteDelete(invite));
    client.on(discord_js_1.Events.InteractionCreate, async (interaction) => {
        await interactionHandler.handle(interaction);
    });
    client.on(discord_js_1.Events.VoiceStateUpdate, async (oldState, newState) => {
        await (0, voiceStateUpdate_1.onVoiceStateUpdate)(oldState, newState);
        await auditLogManager_1.AuditLogManager.logVoiceState(oldState, newState);
    });
    client.on(discord_js_1.Events.MessageDelete, async (message) => {
        await auditLogManager_1.AuditLogManager.logMessageDelete(message);
    });
    client.on(discord_js_1.Events.MessageUpdate, async (oldMessage, newMessage) => {
        await auditLogManager_1.AuditLogManager.logMessageUpdate(oldMessage, newMessage);
    });
    client.on(discord_js_1.Events.GuildMemberRemove, async (member) => {
        await auditLogManager_1.AuditLogManager.logMemberLeave(member);
    });
    // Gelişmiş Mesaj Olayları: Güvenlik, Oyunlar, Level XP ve Ekonomi Komutları
    client.on(discord_js_1.Events.MessageCreate, async (message) => {
        if (message.author.bot || !message.guild)
            return;
        // 1. Üst Düzey Güvenlik Filtresi (Küfür, Reklam, Phishing, Spam)
        const blocked = await autoSecurityGuard_1.AutoSecurityGuard.inspect(message);
        if (blocked)
            return;
        // 1.5. Yapay Zeka Sohbet Odası & Bot Etiketleme (#ai-sohbet veya @Nights Guard)
        const aiHandled = await aiChatManager_1.AIChatManager.handleMessage(message, client);
        if (aiHandled)
            return;
        // 2. Kelime Türetmece Oyunu
        const chName = message.channel.name || '';
        if (chName.includes('kelime-oyunu')) {
            await kelimeOyunu_1.KelimeOyunuManager.handleMessage(message);
            return;
        }
        // 3. AFK Takip ve Bildirim Sistemi
        await afkManager_1.AfkManager.handleMessage(message);
        // 4. Sohbetten Seviye & XP Kazanımı
        await levelManager_1.LevelManager.handleMessage(message);
        // 5. Eğlenceli Hızlı Metin Komutları
        const content = message.content.trim().toLowerCase();
        const args = message.content.trim().split(/\s+/);
        const cmd = args[0]?.toLowerCase();
        // 5. Müzik Komutları (!cal, !play, !durdur, !devam, !gec, !kuyruk, !ayril, !ses)
        if (cmd === '!cal' || cmd === '!play') {
            const query = args.slice(1).join(' ').trim();
            if (!query) {
                await message.reply('💡 Kullanım: `!cal <şarkı adı veya link>` (Örn: `!cal Wegh - ALO`)').catch(() => { });
                return;
            }
            await musicPlayer_1.MusicPlayer.handlePlay({ message }, query, client);
            return;
        }
        if (cmd === '!durdur' || cmd === '!duraklat' || cmd === '!pause') {
            const ok = musicPlayer_1.MusicPlayer.pause(message.guild.id);
            await message.reply(ok ? '⏸️ Müzik duraklatıldı. Devam ettirmek için: `!devam`' : '⚠️ Şu anda çalan aktif bir şarkı yok.').catch(() => { });
            return;
        }
        if (cmd === '!devam' || cmd === '!resume') {
            const ok = musicPlayer_1.MusicPlayer.resume(message.guild.id);
            await message.reply(ok ? '▶️ Müzik devam ettiriliyor.' : '⚠️ Duraklatılmış bir müzik bulunmuyor.').catch(() => { });
            return;
        }
        if (cmd === '!gec' || cmd === '!skip') {
            const ok = musicPlayer_1.MusicPlayer.skip(message.guild.id, client);
            await message.reply(ok ? '⏭️ Sıradaki şarkıya geçildi.' : '⚠️ Sırada geçilecek şarkı bulunmuyor.').catch(() => { });
            return;
        }
        if (cmd === '!kuyruk' || cmd === '!queue') {
            const q = musicPlayer_1.MusicPlayer.queues.get(message.guild.id);
            if (!q || q.songs.length === 0) {
                await message.reply('📭 Çalma listesinde bekleyen şarkı yok.').catch(() => { });
                return;
            }
            let desc = '';
            q.songs.slice(0, 10).forEach((s, idx) => {
                desc += `${idx === 0 ? '▶️' : `**#${idx + 1}**`} [${s.title}](${s.url}) (\`${s.duration}\`)\n`;
            });
            if (q.songs.length > 10)
                desc += `*...ve ${q.songs.length - 10} şarkı daha.*`;
            const embed = new discord_js_2.EmbedBuilder()
                .setTitle(`📜 Çalma Listesi (${q.songs.length} Parça)`)
                .setDescription(desc)
                .setColor('#5865F2')
                .setFooter({ text: `Ses: %${q.volume} • Döngü: ${q.loopMode}` });
            await message.reply({ embeds: [embed] }).catch(() => { });
            return;
        }
        if (cmd === '!ayril' || cmd === '!stop') {
            const ok = musicPlayer_1.MusicPlayer.stop(message.guild.id, client);
            await message.reply(ok ? '⏹️ Müzik durduruldu ve ses kanalından ayrılınarak liste temizlendi.' : '⚠️ Bot herhangi bir ses kanalında bulunmuyor.').catch(() => { });
            return;
        }
        if (cmd === '!ses' || cmd === '!volume') {
            const vol = parseInt(args[1], 10);
            if (isNaN(vol) || vol < 1 || vol > 150) {
                await message.reply('💡 Kullanım: `!ses <1-150>` (Örn: `!ses 80`)').catch(() => { });
                return;
            }
            const ok = musicPlayer_1.MusicPlayer.setVolume(message.guild.id, vol);
            await message.reply(ok ? `🔊 Ses seviyesi **%${vol}** olarak ayarlandı.` : '⚠️ Çalan bir müzik bulunmuyor.').catch(() => { });
            return;
        }
        // !rank / !seviye
        if (cmd === '!rank' || cmd === '!seviye') {
            const targetUser = message.mentions.users.first() || message.author;
            const rankEmbed = levelManager_1.LevelManager.getRankEmbed(targetUser);
            await message.reply({ embeds: [rankEmbed] }).catch(() => { });
            return;
        }
        // !top / !liderlik
        if (cmd === '!top' || cmd === '!liderlik') {
            const topList = levelManager_1.LevelManager.getLeaderboard();
            let desc = '';
            topList.forEach((u, i) => {
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**#${i + 1}**`;
                desc += `${medal} <@${u.userId}> — **Level ${u.level}** (\`${u.xp} XP\`)\n`;
            });
            const topEmbed = new discord_js_2.EmbedBuilder()
                .setTitle('🏆 NIGHTS AKTİFLİK LİDERLİK TABLOSU')
                .setDescription(desc || 'Henüz seviye atlayan üye bulunmuyor.')
                .setColor('#F1C40F')
                .setFooter({ text: 'Nights Topluluk Sıralaması • Made by erencix' });
            await message.reply({ embeds: [topEmbed] }).catch(() => { });
            return;
        }
        // !seviye-esitle (Yönetici)
        if (cmd === '!seviye-esitle') {
            const ownerId = config_1.config.ownerId || process.env.OWNER_ID || '1138498666785677492';
            if (message.author.id !== ownerId && !message.member?.permissions.has(discord_js_1.PermissionFlagsBits.Administrator)) {
                await message.reply('❌ Bu komutu yalnızca sunucu yöneticisi kullanabilir.').catch(() => { });
                return;
            }
            if (message.guild) {
                const count = await levelManager_1.LevelManager.syncAllMembers(message.guild);
                await message.reply(`✅ Seviye senkronizasyonu tamamlandı. **${count}** üyenin seviye rolleri güncellendi.`).catch(() => { });
            }
            return;
        }
        // !gunluk
        if (cmd === '!gunluk') {
            const res = economyManager_1.EconomyManager.claimDaily(message.author.id);
            if (res.success) {
                await message.reply(`🎉 Günlük ödülün olan **${res.amount} Nights Coin** hesabına aktarıldı!`).catch(() => { });
            }
            else {
                const remainingMinutes = Math.ceil(((res.nextTime || 0) - Date.now()) / (60 * 1000));
                await message.reply(`⏳ Günlük ödülünü zaten aldın! Tekrar almak için **${Math.floor(remainingMinutes / 60)}s ${remainingMinutes % 60}dk** beklemelisin.`).catch(() => { });
            }
            return;
        }
        // !bakiye / !cuzdan
        if (cmd === '!bakiye' || cmd === '!cuzdan') {
            const targetUser = message.mentions.users.first() || message.author;
            const bal = economyManager_1.EconomyManager.getBalance(targetUser.id);
            await message.reply(`💰 **${targetUser.displayName}** kullanıcısının bakiyesi: **${bal} Nights Coin**`).catch(() => { });
            return;
        }
        // !calis
        if (cmd === '!calis') {
            const res = economyManager_1.EconomyManager.work(message.author.id);
            if (res.success) {
                await message.reply(`💼 **${res.job}** ve **+${res.amount} Nights Coin** kazandın!`).catch(() => { });
            }
            else {
                const remainingMinutes = Math.ceil(((res.nextTime || 0) - Date.now()) / (60 * 1000));
                await message.reply(`😴 Biraz yoruldun! Tekrar çalışmak için **${remainingMinutes} dakika** dinlenmelisin.`).catch(() => { });
            }
            return;
        }
        // !cf <miktar> <yazi|tura>
        if (cmd === '!cf' || cmd === '!yazitura') {
            const bet = parseInt(args[1], 10);
            const choice = args[2]?.toLowerCase();
            if (isNaN(bet) || bet <= 0 || (choice !== 'yazi' && choice !== 'tura')) {
                await message.reply('💡 Kullanım: `!cf <miktar> <yazi|tura>` (Örn: `!cf 100 yazi`)').catch(() => { });
                return;
            }
            try {
                const res = economyManager_1.EconomyManager.coinflip(message.author.id, bet, choice);
                if (res.win) {
                    await message.reply(`🪙 Para atıldı: **${res.result.toUpperCase()}** geldi! 🎉 **+${bet} Nights Coin** kazandın!`).catch(() => { });
                }
                else {
                    await message.reply(`🪙 Para atıldı: **${res.result.toUpperCase()}** geldi! 😢 **-${bet} Nights Coin** kaybettin.`).catch(() => { });
                }
            }
            catch (err) {
                await message.reply(`❌ ${err.message}`).catch(() => { });
            }
            return;
        }
        // !slot <miktar>
        if (cmd === '!slot') {
            const bet = parseInt(args[1], 10);
            if (isNaN(bet) || bet <= 0) {
                await message.reply('💡 Kullanım: `!slot <miktar>` (Örn: `!slot 50`)').catch(() => { });
                return;
            }
            try {
                const res = economyManager_1.EconomyManager.slot(message.author.id, bet);
                const slotLine = `🎰 [ ${res.symbols.join(' | ')} ] 🎰`;
                if (res.win) {
                    await message.reply(`${slotLine}\n🎉 **TEBRİKLER!** (${res.multiplier}x) **+${res.change} Nights Coin** kazandın!`).catch(() => { });
                }
                else {
                    await message.reply(`${slotLine}\n😢 **KAYBETTİN!** **-${bet} Nights Coin** gitti. Şansını tekrar dene!`).catch(() => { });
                }
            }
            catch (err) {
                await message.reply(`❌ ${err.message}`).catch(() => { });
            }
            return;
        }
        // !evlen <@kullanıcı>
        if (cmd === '!evlen') {
            const targetUser = message.mentions.users.first();
            if (!targetUser) {
                await message.reply('💡 Kullanım: `!evlen @kullanıcı`').catch(() => { });
                return;
            }
            await socialManager_1.SocialManager.propose(message.author, targetUser, message);
            return;
        }
        // !bosan
        if (cmd === '!bosan') {
            const res = socialManager_1.SocialManager.divorce(message.author.id);
            await message.reply(res.message).catch(() => { });
            return;
        }
        // !evlilik / !evli
        if (cmd === '!evlilik' || cmd === '!evli') {
            const targetUser = message.mentions.users.first() || message.author;
            const embed = socialManager_1.SocialManager.getMarriageEmbed(targetUser);
            await message.reply({ embeds: [embed] }).catch(() => { });
            return;
        }
        // !saril <@kullanıcı>
        if (cmd === '!saril' || cmd === '!sarıl') {
            const targetUser = message.mentions.users.first();
            if (!targetUser) {
                await message.reply('💡 Kullanım: `!saril @kullanıcı`').catch(() => { });
                return;
            }
            const embed = socialManager_1.SocialManager.getActionEmbed('hug', message.author, targetUser);
            await message.reply({ embeds: [embed] }).catch(() => { });
            return;
        }
        // !tokat <@kullanıcı>
        if (cmd === '!tokat') {
            const targetUser = message.mentions.users.first();
            if (!targetUser) {
                await message.reply('💡 Kullanım: `!tokat @kullanıcı`').catch(() => { });
                return;
            }
            const embed = socialManager_1.SocialManager.getActionEmbed('slap', message.author, targetUser);
            await message.reply({ embeds: [embed] }).catch(() => { });
            return;
        }
        // !op <@kullanıcı> / !öp
        if (cmd === '!op' || cmd === '!öp') {
            const targetUser = message.mentions.users.first();
            if (!targetUser) {
                await message.reply('💡 Kullanım: `!op @kullanıcı`').catch(() => { });
                return;
            }
            const embed = socialManager_1.SocialManager.getActionEmbed('kiss', message.author, targetUser);
            await message.reply({ embeds: [embed] }).catch(() => { });
            return;
        }
        // !kahve <@kullanıcı>
        if (cmd === '!kahve') {
            const targetUser = message.mentions.users.first();
            if (!targetUser) {
                await message.reply('💡 Kullanım: `!kahve @kullanıcı`').catch(() => { });
                return;
            }
            const embed = socialManager_1.SocialManager.getActionEmbed('coffee', message.author, targetUser);
            await message.reply({ embeds: [embed] }).catch(() => { });
            return;
        }
        // !yardim
        if (cmd === '!yardim' || cmd === '!komutlar') {
            const helpEmbed = new discord_js_2.EmbedBuilder()
                .setTitle('🎮 NIGHTS GUARD EĞLENCE & SİSTEM KOMUTLARI')
                .setDescription('Sunucumuzda kullanabileceğiniz hızlı interaktif komutlar:\n\n' +
                '### ⚡ Level & Aktiflik:\n' +
                '• `!rank` — Kendi seviye kartınızı ve XP durumunuzu gösterir\n' +
                '• `!top` — Sunucu aktiflik liderlik tablosunu gösterir\n\n' +
                '### 💰 Ekonomi & Oyunlar:\n' +
                '• `!gunluk` — Günlük 500 Nights Coin ödülünüzü alır\n' +
                '• `!bakiye` — Mevcut paranızı görüntüler\n' +
                '• `!calis` — 30 dakikada bir çalışarak para kazandırır\n' +
                '• `!cf <miktar> <yazi|tura>` — Yazı tura bahsi oynar\n' +
                '• `!slot <miktar>` — Slot kumar makinesini çevirir\n\n' +
                '### 🎲 Sunucu İçi Oyun Kanalları:\n' +
                '• <#1568644567517896815> — Otomatik Kelime Türetmece\n' +
                '• `#owo-gambling-1 & 2` — Hızlı 1sn OwO Oyun Odaları')
                .setColor('#8B5CF6')
                .setFooter({ text: 'Nights Interactive Engine • Made by erencix' });
            await message.reply({ embeds: [helpEmbed] }).catch(() => { });
            return;
        }
        // !dm <mesaj> veya !duyuru <mesaj> (Yalnızca Sunucu Sahibi / Yönetici)
        if (cmd === '!dm' || cmd === '!duyuru' || cmd === '!mesajgonder') {
            const ownerId = config_1.config.ownerId || '1138498666785677492';
            const isOwner = message.author.id === ownerId;
            const isAdmin = message.member?.permissions.has(discord_js_1.PermissionFlagsBits.Administrator);
            if (!isOwner && !isAdmin) {
                await message.reply('⛔ **Erişim Engellendi:** Bu komut yalnızca sunucu kurucusu tarafından kullanılabilir!').catch(() => { });
                return;
            }
            const rawMsg = args.slice(1).join(' ').trim();
            if (!rawMsg) {
                await message.reply('💡 Kullanım: `!dm <duyuru metni>` veya `/mesajgönder mesaj:<metin>`').catch(() => { });
                return;
            }
            const guild = message.guild;
            if (!guild)
                return;
            const progressMsg = await message.reply('⏳ **Toplu DM Gönderimi Başlatılıyor...** Lütfen bekleyin.').catch(() => null);
            const allMembers = await guild.members.fetch();
            const candidates = Array.from(allMembers.values()).filter((m) => !m.user.bot);
            const dmEmbed = new discord_js_2.EmbedBuilder()
                .setTitle('📢 NIGHTS TOPLULUK RESMİ DUYURUSU')
                .setDescription(rawMsg)
                .setColor('#8B5CF6')
                .setThumbnail(guild.iconURL({ size: 256 }) || message.author.displayAvatarURL())
                .addFields({ name: '👑 Gönderen Yetkili', value: `<@${message.author.id}>`, inline: true }, { name: '🌐 Sunucu', value: `**${guild.name}**`, inline: true })
                .setImage('https://media.giphy.com/media/EPfV3ijMQVl60/giphy.gif')
                .setFooter({ text: 'Nights Community Broadcast Engine • Made by erencix' })
                .setTimestamp();
            let successCount = 0;
            let failedCount = 0;
            for (let i = 0; i < candidates.length; i++) {
                try {
                    await candidates[i].send({ embeds: [dmEmbed] });
                    successCount++;
                }
                catch {
                    failedCount++;
                }
                if (i < candidates.length - 1) {
                    await new Promise((r) => setTimeout(r, 1200));
                }
            }
            if (progressMsg) {
                await progressMsg.edit(`✅ **Toplu DM Tamamlandı!** Toplam: **${candidates.length}** | Ulaşan: **${successCount}** | DM Kapalı: **${failedCount}**`).catch(() => { });
            }
            return;
        }
        // 7. Otomatik Samimi Selamlaşma & Hoş Geldin Yanıtı (sa, as, merhaba, hg, hb vb.)
        const cleanContent = message.content.trim().toLowerCase();
        const isSa = /^(sa|s\.a|s\.a\.|selamun aleykum|selamun aleyküm|selamün aleyküm|sea)$/i.test(cleanContent);
        const isHello = /^(selam|merhaba|merhabalar|slm|mrb|hey)$/i.test(cleanContent);
        const isHg = /^(hg|hoş geldin|hos geldin|hoşgeldin|hosgeldin|hoşgeldiniz|hosgeldiniz)$/i.test(cleanContent);
        const isHb = /^(hb|hoş bulduk|hos bulduk|hoşbulduk|hosbulduk)$/i.test(cleanContent);
        if (isSa || isHello || isHg || isHb) {
            const now = Date.now();
            const lastGreet = client._lastGreetTime || 0;
            if (now - lastGreet > 3000) {
                client._lastGreetTime = now;
                if (isSa) {
                    const saReplies = [
                        `Aleyküm selam <@${message.author.id}>, hoş geldin! Nasılsın? 👋`,
                        `Aleyküm selam kral, hoş geldin! Günün nasıl geçiyor? ✨`,
                        `Ve aleyküm selam <@${message.author.id}>! Hoş geldin, iyi sohbetler dilerim! 😊`,
                    ];
                    const reply = saReplies[Math.floor(Math.random() * saReplies.length)];
                    await message.reply(reply).catch(() => { });
                }
                else if (isHello) {
                    const helloReplies = [
                        `Merhaba <@${message.author.id}>, hoş geldin! Nasılsın? 😊`,
                        `Selamlar <@${message.author.id}>! Aramıza hoş geldin, keyifler nasıl? ✨`,
                        `Merhaba kral! Hoş geldin, sohbete katılmana sevindik! 👋`,
                    ];
                    const reply = helloReplies[Math.floor(Math.random() * helloReplies.length)];
                    await message.reply(reply).catch(() => { });
                }
                else if (isHg) {
                    const hgReplies = [
                        `Hoş bulduk <@${message.author.id}>, teşekkürler! Nasılsın? ✨`,
                        `Hoş bulduk kral! İyi sohbetler, günün güzel geçsin! 😊`,
                        `Hoş bulduk! Keyifler nasıl, iyisindir umarım? 👋`,
                    ];
                    const reply = hgReplies[Math.floor(Math.random() * hgReplies.length)];
                    await message.reply(reply).catch(() => { });
                }
                else if (isHb) {
                    await message.reply(`Aramıza tekrar hoş geldin <@${message.author.id}>! Keyifli vakitler dileriz! 🎉`).catch(() => { });
                }
            }
        }
    });
    // Otomatik Bot Rolü Verme & Zengin Hoş Geldin Mesajı
    client.on(discord_js_1.Events.GuildMemberAdd, async (member) => {
        try {
            console.log(`[GuildMemberAdd] Yeni üye katıldı: ${member.user.tag} (${member.id})`);
            if (member.user.bot) {
                const roles = await member.guild.roles.fetch();
                const botRole = roles.find((r) => r.name.toLowerCase() === 'bot' || r.name.includes('Bot'));
                const approvedRole = roles.find((r) => r.name.toLowerCase() === 'onaylı' || r.name.includes('Onaylı') || r.name.toLowerCase().includes('onaylan'));
                const rolesToAdd = [botRole, approvedRole].filter(Boolean);
                if (rolesToAdd.length > 0) {
                    await member.roles.add(rolesToAdd).catch(() => { });
                    console.log(`🤖 Yeni bot sunucuya katıldı; Bot ve Onaylı rolleri verildi: ${member.user.tag}`);
                }
            }
            else {
                // İnsan kullanıcılar için #hos-geldin kanalına karşılama mesajı & Davetçi Tespiti
                const channels = await member.guild.channels.fetch();
                const welcomeCh = channels.find((c) => c && c.name.includes('hos-geldin') && c.isTextBased());
                if (welcomeCh) {
                    const inviteInfo = await inviteTracker_1.InviteTracker.findInviter(member);
                    let inviterStr = 'Bilinmiyor / Doğrudan Katılım 🌐';
                    let welcomeContent = `🎉 Aramıza yeni bir üye katıldı! Hoş geldin <@${member.id}> 👋`;
                    if (inviteInfo.inviter) {
                        inviterStr = `<@${inviteInfo.inviter.id}> (\`${inviteInfo.inviter.tag}\`) • **${inviteInfo.uses}.** Daveti 🎯`;
                        welcomeContent = `🎉 Aramıza yeni bir üye katıldı! Hoş geldin <@${member.id}> 👋 (Davet eden: <@${inviteInfo.inviter.id}>)`;
                    }
                    else if (inviteInfo.isVanity) {
                        inviterStr = `Özel Sunucu Linki (\`${inviteInfo.code}\`) 🔗`;
                    }
                    const avatarUrl = member.user.displayAvatarURL({ size: 256 });
                    const welcomeEmbed = new discord_js_2.EmbedBuilder()
                        .setTitle(`👋 ARAMIZA HOŞ GELDİN, ${member.displayName}!`)
                        .setDescription(`Hey <@${member.id}>, **${member.guild.name}** sunucumuza hoş geldin! 🎉\n\n` +
                        `> 📨 **Davet Eden:** ${inviterStr}\n` +
                        `> 🛡️ **Kayıt Olmak İçin:** <#1568644551797899368> kanalından kaydınızı tamamlayıp tüm odaların kilidini açabilirsiniz.\n` +
                        `> 📜 **Kurallar:** Sunucu huzurumuz için <#1568644556139008154> kanalına göz atmayı unutmayın.\n\n` +
                        `📊 **Seninle Birlikte:** Toplam **${member.guild.memberCount}** Kişi Olduk! ✨`)
                        .setColor('#2ECC71')
                        .setThumbnail(avatarUrl)
                        .setImage('https://media.giphy.com/media/26tn3334mvoVClhos/giphy.gif')
                        .setFooter({ text: 'Nights Community • Made by erencix' })
                        .setTimestamp();
                    await welcomeCh.send({
                        content: welcomeContent,
                        embeds: [welcomeEmbed],
                    }).catch((err) => console.warn('[GuildMemberAdd] Mesaj iletilemedi:', err.message));
                    console.log(`[GuildMemberAdd] #hos-geldin mesajı gönderildi: ${member.user.tag} (Davet eden: ${inviterStr})`);
                }
                else {
                    console.warn('[GuildMemberAdd] #hos-geldin kanalı bulunamadı!');
                }
            }
        }
        catch (err) {
            console.warn('[GuildMemberAdd] Hata:', err.message);
        }
    });
    // Otomatik Sunucudan Çıkma Koruması: Yalnızca sahibin sunucusunda kalır!
    client.on(discord_js_1.Events.GuildCreate, async (guild) => {
        const allowedGuildId = '1568618183223414934';
        const allowedOwnerId = config_1.config.ownerId || '1138498666785677492';
        if (guild.id !== allowedGuildId && guild.ownerId !== allowedOwnerId) {
            console.warn(`[Güvenlik] İzin verilmeyen sunucuya eklendi, derhal ayrılınıyor: ${guild.name} (${guild.id})`);
            try {
                await guild.leave();
            }
            catch (err) {
                console.error('Sunucudan ayrılırken hata:', err.message);
            }
        }
    });
    // Process error handlers
    process.on('unhandledRejection', (reason, promise) => {
        if (reason && (reason.message?.includes('Cannot perform IP discovery') ||
            reason.message?.includes('socket closed') ||
            reason.code === 10062 ||
            reason.code === 40060 ||
            reason.message?.includes('Unknown interaction') ||
            reason.message?.includes('already been acknowledged'))) {
            console.warn('[Process] Ağ / Discord etkileşim uyarısı otomatik karşılandı.');
            return;
        }
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
    process.on('uncaughtException', (err) => {
        if (err && (err.message?.includes('Cannot perform IP discovery') ||
            err.message?.includes('socket closed') ||
            err.code === 10062 ||
            err.code === 40060 ||
            err.message?.includes('Unknown interaction') ||
            err.message?.includes('already been acknowledged'))) {
            console.warn('[Process] Önemsiz Discord etkileşim istisnası toparlandı.');
            return;
        }
        console.error('Uncaught Exception:', err);
    });
    process.on('SIGINT', () => {
        console.log('\nBot kapatılıyor...');
        client.destroy();
        process.exit(0);
    });
    try {
        await client.login(config_1.config.discordToken);
    }
    catch (err) {
        console.error('Discord API Giriş Hatası:', err.message);
    }
}
if (require.main === module) {
    bootstrap();
}
