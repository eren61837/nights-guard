"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const discord_js_1 = require("discord.js");
const config_1 = require("../config");
const musicPlayer_1 = require("../services/features/musicPlayer");
const voicePanelManager_1 = require("../services/features/voicePanelManager");
const kelimeOyunu_1 = require("../services/features/kelimeOyunu");
const TARGET_GUILD_ID = '1568618183223414934'; // Prayt
async function main() {
    console.log('🚀 Acil Özellikler, Bot Rolü ve Kanallar Kuruluyor...');
    const client = new discord_js_1.Client({
        intents: [
            discord_js_1.GatewayIntentBits.Guilds,
            discord_js_1.GatewayIntentBits.GuildVoiceStates,
            discord_js_1.GatewayIntentBits.GuildMessages,
            discord_js_1.GatewayIntentBits.GuildMembers,
            discord_js_1.GatewayIntentBits.MessageContent,
        ],
    });
    await client.login(config_1.config.discordToken);
    const guild = await client.guilds.fetch({ guild: TARGET_GUILD_ID, force: true });
    if (!guild) {
        console.error('Sunucu bulunamadı!');
        process.exit(1);
    }
    const everyoneRole = guild.roles.everyone;
    const roles = await guild.roles.fetch();
    // 1. BOT ROLÜ OLUŞTUR VE TÜM BOTLARA VER
    console.log('🤖 1. Bot rolü kontrol ediliyor...');
    let botRole = roles.find((r) => r.name.toLowerCase() === 'bot');
    if (!botRole) {
        botRole = await guild.roles.create({
            name: 'Bot',
            color: '#5865F2',
            hoist: true,
            mentionable: false,
            reason: 'Otomatik Bot Yönetim Rolü',
        });
        console.log('  ✅ "Bot" rolü oluşturuldu!');
    }
    // Tüm sunucu üyelerini çek ve bot olanlara rolü ver
    const members = await guild.members.fetch();
    console.log(`  Sunucuda toplam ${members.size} üye/bot inceleniyor...`);
    for (const [, m] of members) {
        if (m.user.bot) {
            if (!m.roles.cache.has(botRole.id)) {
                try {
                    await m.roles.add(botRole);
                    console.log(`  🤖 Bot rolü verildi: ${m.user.tag}`);
                }
                catch (e) {
                    console.warn(`  ⚠️ Bot rolü verilemedi (${m.user.tag}):`, e.message);
                }
            }
            else {
                console.log(`  ℹ️ Bot zaten role sahip: ${m.user.tag}`);
            }
        }
    }
    // 2. İZİNLER: İSİM DEĞİŞTİRME VE @EVERYONE / ROL ETİKETLEME KİLİTLENİYOR
    console.log('\n🔒 2. İzinler Kilitleniyor (İsim Değiştirme & Mention Koruması)...');
    try {
        const evPerms = everyoneRole.permissions.remove([
            discord_js_1.PermissionFlagsBits.ChangeNickname,
            discord_js_1.PermissionFlagsBits.MentionEveryone,
        ]);
        await everyoneRole.setPermissions(evPerms);
        console.log('  ✅ @everyone rolünden ChangeNickname ve MentionEveryone kaldırıldı!');
    }
    catch (err) {
        console.warn('  ⚠️ @everyone hata:', err.message);
    }
    const uyeRole = roles.find((r) => r.name === 'Üye');
    const onayliRole = roles.find((r) => r.name === 'Onaylı');
    const kayitBekleyenRole = roles.find((r) => r.name === 'Kayıt Bekleyen');
    const erkekRole = roles.find((r) => r.name === 'Erkek');
    const kizRole = roles.find((r) => r.name === 'Kız');
    const vipRole = roles.find((r) => r.name === 'VIP');
    const cezaliRole = roles.find((r) => r.name === 'Cezalı');
    const regularRoles = [uyeRole, onayliRole, kayitBekleyenRole, erkekRole, kizRole, vipRole, cezaliRole];
    for (const r of regularRoles) {
        if (r) {
            try {
                await r.setMentionable(false);
                const p = r.permissions.remove([
                    discord_js_1.PermissionFlagsBits.ChangeNickname,
                    discord_js_1.PermissionFlagsBits.MentionEveryone,
                ]);
                await r.setPermissions(p);
                console.log(`  ✅ ${r.name} rolü kilitlendi!`);
            }
            catch (e) {
                console.warn(`  ⚠️ ${r.name} hata:`, e.message);
            }
        }
    }
    // 3. KANALLAR
    console.log('\n📁 3. Kanalların Yapılandırılması...');
    const channels = await guild.channels.fetch();
    // A) #🎯・click-me mesaj gönderme kilidi
    const clickMeCh = channels.find((c) => c && c.name.includes('click-me') && c.isTextBased());
    if (clickMeCh) {
        try {
            await clickMeCh.permissionOverwrites.edit(everyoneRole.id, {
                ViewChannel: false,
                SendMessages: false,
            });
            if (onayliRole) {
                await clickMeCh.permissionOverwrites.edit(onayliRole.id, {
                    ViewChannel: true,
                    SendMessages: false, // Mesaj YAZILAMAZ, sadece butona tıklanır!
                    ReadMessageHistory: true,
                    AddReactions: false,
                    CreatePublicThreads: false,
                    CreatePrivateThreads: false,
                });
            }
            console.log('  ✅ #click-me kanalında mesaj yazma kilitlendi!');
        }
        catch (e) {
            console.warn('  ⚠️ #click-me kilit hatası:', e.message);
        }
    }
    // B) Müzik Alanı: #muzik-bilgi ve #muzik-komut ayrımı
    const musicCategory = channels.find((c) => c && c.type === discord_js_1.ChannelType.GuildCategory && c.name.includes('MÜZİK ALANI'));
    let chMuzikBilgi = channels.find((c) => c && c.name.includes('muzik-bilgi') && c.isTextBased());
    let chMuzikKomut = channels.find((c) => c && c.name.includes('muzik-komut') && c.isTextBased());
    if (!chMuzikBilgi && musicCategory) {
        chMuzikBilgi = await guild.channels.create({
            name: '📖・muzik-bilgi',
            type: discord_js_1.ChannelType.GuildText,
            parent: musicCategory.id,
            permissionOverwrites: [
                {
                    id: everyoneRole.id,
                    deny: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.SendMessages],
                },
                ...(onayliRole
                    ? [
                        {
                            id: onayliRole.id,
                            allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.ReadMessageHistory],
                            deny: [
                                discord_js_1.PermissionFlagsBits.SendMessages,
                                discord_js_1.PermissionFlagsBits.CreatePublicThreads,
                                discord_js_1.PermissionFlagsBits.CreatePrivateThreads,
                            ],
                        },
                    ]
                    : []),
            ],
        });
        console.log('  ✅ #📖・muzik-bilgi kanalı oluşturuldu!');
    }
    if (chMuzikBilgi && chMuzikBilgi.isTextBased()) {
        try {
            const oldMsgs = await chMuzikBilgi.messages.fetch({ limit: 5 });
            for (const [, m] of oldMsgs)
                await m.delete();
            await chMuzikBilgi.send({
                embeds: [musicPlayer_1.MusicPlayer.getMusicInfoEmbed()],
            });
            console.log('  ✅ #muzik-bilgi anime kızı paneli yüklendi!');
        }
        catch (e) {
            console.warn('  ⚠️ #muzik-bilgi mesaj hatası:', e.message);
        }
    }
    if (chMuzikKomut && chMuzikKomut.isTextBased()) {
        try {
            await chMuzikKomut.permissionOverwrites.edit(everyoneRole.id, {
                ViewChannel: false,
                SendMessages: false,
            });
            if (onayliRole) {
                await chMuzikKomut.permissionOverwrites.edit(onayliRole.id, {
                    ViewChannel: true,
                    SendMessages: true, // Üyeler müzik komutlarını ve şarkı linklerini yazabilir!
                    ReadMessageHistory: true,
                    CreatePublicThreads: false,
                    CreatePrivateThreads: false,
                });
            }
            const oldMsgs = await chMuzikKomut.messages.fetch({ limit: 5 });
            for (const [, m] of oldMsgs)
                await m.delete();
            await chMuzikKomut.send({
                embeds: [musicPlayer_1.MusicPlayer.getMusicPanelEmbed()],
                components: [musicPlayer_1.MusicPlayer.getMusicControls()],
            });
            console.log('  ✅ #muzik-komut butonlu paneli yüklendi!');
        }
        catch (e) {
            console.warn('  ⚠️ #muzik-komut panel hatası:', e.message);
        }
    }
    // C) Ses Alanı: #🎛️・ses-paneli
    const voiceCategory = channels.find((c) => c && c.type === discord_js_1.ChannelType.GuildCategory && c.name.includes('SES ODALARI'));
    let chSesPaneli = channels.find((c) => c && c.name.includes('ses-paneli') && c.isTextBased());
    if (!chSesPaneli && voiceCategory) {
        chSesPaneli = await guild.channels.create({
            name: '🎛️・ses-paneli',
            type: discord_js_1.ChannelType.GuildText,
            parent: voiceCategory.id,
            permissionOverwrites: [
                {
                    id: everyoneRole.id,
                    deny: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.SendMessages],
                },
                ...(onayliRole
                    ? [
                        {
                            id: onayliRole.id,
                            allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.ReadMessageHistory],
                            deny: [
                                discord_js_1.PermissionFlagsBits.SendMessages,
                                discord_js_1.PermissionFlagsBits.CreatePublicThreads,
                                discord_js_1.PermissionFlagsBits.CreatePrivateThreads,
                            ],
                        },
                    ]
                    : []),
            ],
        });
        console.log('  ✅ #🎛️・ses-paneli kanalı oluşturuldu!');
    }
    if (chSesPaneli && chSesPaneli.isTextBased()) {
        try {
            const oldMsgs = await chSesPaneli.messages.fetch({ limit: 5 });
            for (const [, m] of oldMsgs)
                await m.delete();
            await chSesPaneli.send({
                embeds: [voicePanelManager_1.VoicePanelManager.getVoicePanelEmbed()],
                components: voicePanelManager_1.VoicePanelManager.getVoicePanelControls(),
            });
            console.log('  ✅ #ses-paneli butonları yüklendi!');
        }
        catch (e) {
            console.warn('  ⚠️ #ses-paneli mesaj hatası:', e.message);
        }
    }
    // D) İki Adet OwO Gambling Kanalı (1s yavaş mod ile)
    const owoCategory = channels.find((c) => c && c.type === discord_js_1.ChannelType.GuildCategory && (c.name.includes('TOPLULUK') || c.name.includes('OYUN')));
    let chOwo1 = channels.find((c) => c && c.name.includes('owo-gambling-1'));
    let chOwo2 = channels.find((c) => c && c.name.includes('owo-gambling-2'));
    if (!chOwo1 && owoCategory) {
        chOwo1 = await guild.channels.create({
            name: '🎰・owo-gambling-1',
            type: discord_js_1.ChannelType.GuildText,
            parent: owoCategory.id,
            rateLimitPerUser: 1, // 1 sn yavaş mod
            permissionOverwrites: [
                {
                    id: everyoneRole.id,
                    deny: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.SendMessages],
                },
                ...(onayliRole
                    ? [
                        {
                            id: onayliRole.id,
                            allow: [
                                discord_js_1.PermissionFlagsBits.ViewChannel,
                                discord_js_1.PermissionFlagsBits.SendMessages,
                                discord_js_1.PermissionFlagsBits.ReadMessageHistory,
                            ],
                            deny: [
                                discord_js_1.PermissionFlagsBits.MentionEveryone,
                                discord_js_1.PermissionFlagsBits.CreatePublicThreads,
                                discord_js_1.PermissionFlagsBits.CreatePrivateThreads,
                            ],
                        },
                    ]
                    : []),
            ],
        });
        console.log('  ✅ #🎰・owo-gambling-1 açıldı (1s yavaş mod)!');
        const owoEmbed1 = new discord_js_1.EmbedBuilder()
            .setTitle('🎰 OWO GAMBLING & BAHİS ALANI #1 🎲')
            .setDescription('Bu kanalda dilediğiniz gibi OwO oyunları oynayabilir, coinflip ve slot çevirebilirsiniz!\n\n' +
            '### 📌 Kurallar & Bilgi:\n' +
            '• Bu kanalda **1 saniyelik yavaş mod** etkindir.\n' +
            '• @everyone ve rol etiketlemek yasaktır.\n\n' +
            '### 🕹️ Popüler OwO Komutları:\n' +
            '• `owo cf <miktar>` — Yazı tura bahsi oynar\n' +
            '• `owo s <miktar>` — Slot makinesini çevirir\n' +
            '• `owo b` — OwO savaşını başlatır\n' +
            '• `owo h` — Hayvan avına çıkar\n' +
            '• `owo inv` — Envanterinizi gösterir')
            .setColor('#F39C12')
            .setFooter({ text: 'Prayt OwO Arena • Made by erencix' });
        await chOwo1.send({ embeds: [owoEmbed1] });
    }
    if (!chOwo2 && owoCategory) {
        chOwo2 = await guild.channels.create({
            name: '🎰・owo-gambling-2',
            type: discord_js_1.ChannelType.GuildText,
            parent: owoCategory.id,
            rateLimitPerUser: 1, // 1 sn yavaş mod
            permissionOverwrites: [
                {
                    id: everyoneRole.id,
                    deny: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.SendMessages],
                },
                ...(onayliRole
                    ? [
                        {
                            id: onayliRole.id,
                            allow: [
                                discord_js_1.PermissionFlagsBits.ViewChannel,
                                discord_js_1.PermissionFlagsBits.SendMessages,
                                discord_js_1.PermissionFlagsBits.ReadMessageHistory,
                            ],
                            deny: [
                                discord_js_1.PermissionFlagsBits.MentionEveryone,
                                discord_js_1.PermissionFlagsBits.CreatePublicThreads,
                                discord_js_1.PermissionFlagsBits.CreatePrivateThreads,
                            ],
                        },
                    ]
                    : []),
            ],
        });
        console.log('  ✅ #🎰・owo-gambling-2 açıldı (1s yavaş mod)!');
        const owoEmbed2 = new discord_js_1.EmbedBuilder()
            .setTitle('🎰 OWO GAMBLING & BAHİS ALANI #2 🎲')
            .setDescription('Bu kanalda dilediğiniz gibi OwO oyunları oynayabilir, coinflip ve slot çevirebilirsiniz!\n\n' +
            '### 📌 Kurallar & Bilgi:\n' +
            '• Bu kanalda **1 saniyelik yavaş mod** etkindir.\n' +
            '• @everyone ve rol etiketlemek yasaktır.\n\n' +
            '### 🕹️ Popüler OwO Komutları:\n' +
            '• `owo cf <miktar>` — Yazı tura bahsi oynar\n' +
            '• `owo s <miktar>` — Slot makinesini çevirir\n' +
            '• `owo b` — OwO savaşını başlatır\n' +
            '• `owo h` — Hayvan avına çıkar\n' +
            '• `owo inv` — Envanterinizi gösterir')
            .setColor('#F39C12')
            .setFooter({ text: 'Prayt OwO Arena • Made by erencix' });
        await chOwo2.send({ embeds: [owoEmbed2] });
    }
    // E) Kelime Oyunu Kuralları
    const chKelime = channels.find((c) => c && c.name.includes('kelime-oyunu') && c.isTextBased());
    if (chKelime && chKelime.isTextBased()) {
        try {
            await chKelime.send({
                embeds: [kelimeOyunu_1.KelimeOyunuManager.getInitialEmbed()],
            });
            console.log('  ✅ Kelime oyunu embedi gönderildi!');
        }
        catch (e) { }
    }
    console.log('\n=============================================');
    console.log('🎉 TÜM KANALLAR, ROLLER VE İZİNLER HAZIR!');
    console.log('=============================================');
    client.destroy();
}
main().catch(console.error);
