"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const discord_js_1 = require("discord.js");
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config");
const musicPlayer_1 = require("../services/features/musicPlayer");
const voicePanelManager_1 = require("../services/features/voicePanelManager");
const kelimeOyunu_1 = require("../services/features/kelimeOyunu");
const TARGET_GUILD_ID = '1568618183223414934'; // Prayt
async function main() {
    console.log('🚀 Prayt Sunucusu Kapsamlı Güncellemesi Başlatılıyor...');
    const client = new discord_js_1.Client({
        intents: [
            discord_js_1.GatewayIntentBits.Guilds,
            discord_js_1.GatewayIntentBits.GuildVoiceStates,
            discord_js_1.GatewayIntentBits.GuildMessages,
            discord_js_1.GatewayIntentBits.MessageContent,
        ],
    });
    await client.login(config_1.config.discordToken);
    const guild = await client.guilds.fetch({ guild: TARGET_GUILD_ID, force: true });
    if (!guild) {
        console.error('❌ Hedef sunucu bulunamadı!');
        process.exit(1);
    }
    console.log(`🏰 Sunucu: ${guild.name} (${guild.id})`);
    // ==========================================
    // ADIM 1: ROLLER VE İZİNLERİN SERTLEŞTİRİLMESİ
    // ==========================================
    console.log('\n🔒 1. Rol ve İsim Değiştirme / Mention İzinleri Kilitleniyor...');
    const roles = await guild.roles.fetch();
    const everyoneRole = guild.roles.everyone;
    const uyeRole = roles.find((r) => r.name === 'Üye');
    const onayliRole = roles.find((r) => r.name === 'Onaylı');
    const kayitBekleyenRole = roles.find((r) => r.name === 'Kayıt Bekleyen');
    const erkekRole = roles.find((r) => r.name === 'Erkek');
    const kizRole = roles.find((r) => r.name === 'Kız');
    const vipRole = roles.find((r) => r.name === 'VIP');
    const cezaliRole = roles.find((r) => r.name === 'Cezalı');
    // @everyone'dan ChangeNickname ve MentionEveryone kaldır
    try {
        const evPerms = everyoneRole.permissions.remove([
            discord_js_1.PermissionFlagsBits.ChangeNickname,
            discord_js_1.PermissionFlagsBits.MentionEveryone,
        ]);
        await everyoneRole.setPermissions(evPerms);
        console.log('  ✅ @everyone rolünden ChangeNickname ve MentionEveryone kaldırıldı!');
    }
    catch (err) {
        console.warn('  ⚠️ @everyone izin hatası:', err.message);
    }
    // Üye rolünden ChangeNickname ve MentionEveryone kaldır
    if (uyeRole) {
        try {
            const uyePerms = uyeRole.permissions.remove([
                discord_js_1.PermissionFlagsBits.ChangeNickname,
                discord_js_1.PermissionFlagsBits.MentionEveryone,
            ]);
            await uyeRole.setPermissions(uyePerms);
            await uyeRole.setMentionable(false);
            console.log('  ✅ Üye rolünden ChangeNickname & Mention kaldırıldı ve bahsedilemez yapıldı!');
        }
        catch (err) {
            console.warn('  ⚠️ Üye rolü izin hatası:', err.message);
        }
    }
    // Onaylı rolünden izinleri kaldır
    if (onayliRole) {
        try {
            const oPerms = onayliRole.permissions.remove([
                discord_js_1.PermissionFlagsBits.ChangeNickname,
                discord_js_1.PermissionFlagsBits.MentionEveryone,
            ]);
            await onayliRole.setPermissions(oPerms);
            await onayliRole.setMentionable(false);
            console.log('  ✅ Onaylı rolü kilitlendi!');
        }
        catch (err) {
            console.warn('  ⚠️ Onaylı rolü izin hatası:', err.message);
        }
    }
    // Diğer üye rollerini de bahsedilemez yap
    const nonStaffRoles = [kayitBekleyenRole, erkekRole, kizRole, vipRole, cezaliRole];
    for (const r of nonStaffRoles) {
        if (r) {
            try {
                await r.setMentionable(false);
                const p = r.permissions.remove([
                    discord_js_1.PermissionFlagsBits.ChangeNickname,
                    discord_js_1.PermissionFlagsBits.MentionEveryone,
                ]);
                await r.setPermissions(p);
            }
            catch (e) { }
        }
    }
    console.log('  ✅ Tüm üye rolleri bahsedilemez ve isim değiştiremez olarak kilitlendi!');
    // ==========================================
    // ADIM 2: ESKİ PROSEDÜREL EMOJİLERİ SİL
    // ==========================================
    console.log('\n🧹 2. Eski emojiler temizleniyor...');
    const currentEmojis = await guild.emojis.fetch();
    console.log(`  Mevcut silinecek emoji sayısı: ${currentEmojis.size}`);
    for (const [, emo] of currentEmojis) {
        try {
            await emo.delete('Eski yapay emojiler siliniyor');
            console.log(`    🗑️ Silindi: ${emo.name}`);
            await new Promise((r) => setTimeout(r, 200));
        }
        catch (err) {
            console.warn(`    ⚠️ Emoji silinemedi (${emo.name}):`, err.message);
        }
    }
    console.log('  ✅ Eski emojiler tamamen temizlendi!');
    // ==========================================
    // ADIM 3: İNTERNETTEN GERÇEK EMOJİLERİ BUL VE YÜKLE (60+ EMOJİ)
    // ==========================================
    console.log('\n🌐 3. İnternetten en popüler gerçek emojiler çekiliyor...');
    try {
        const apiRes = await axios_1.default.get('https://emoji.gg/api', {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 15000,
        });
        const allEmojis = apiRes.data;
        const blockedWords = ['nsfw', 'porn', 'thot', 'loli', 'lewd', 'boob', 'dick', 'sex', 'gay', 'kill', 'suicide'];
        const cleanList = allEmojis.filter((e) => {
            if (!e.title || !e.image)
                return false;
            const lower = e.title.toLowerCase();
            return !blockedWords.some((w) => lower.includes(w));
        });
        cleanList.sort((a, b) => (b.faves || 0) - (a.faves || 0));
        const staticList = cleanList.filter((e) => e.image.endsWith('.png'));
        const animatedList = cleanList.filter((e) => e.image.endsWith('.gif'));
        console.log(`  Bulunan uygun statik emoji: ${staticList.length}, hareketli: ${animatedList.length}`);
        // Hedef: 50 statik + 15 hareketli (Toplam 65 gerçek internet emojisi!)
        const targetStatic = staticList.slice(0, 50);
        const targetAnimated = animatedList.slice(0, 15);
        let uploadedCount = 0;
        // Statik Emojileri Yükle
        console.log('  📥 Statik emojiler yükleniyor (Hedef: 50)...');
        for (const item of targetStatic) {
            try {
                let cleanName = item.title.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 30);
                if (cleanName.length < 2)
                    cleanName = `e_${cleanName}`;
                const imgRes = await axios_1.default.get(item.image, {
                    responseType: 'arraybuffer',
                    timeout: 10000,
                });
                await guild.emojis.create({
                    attachment: Buffer.from(imgRes.data),
                    name: cleanName,
                    reason: 'Prayt Popüler Topluluk Emojisi',
                });
                uploadedCount++;
                console.log(`    [${uploadedCount}/65] 😃 Eklendi: :${cleanName}:`);
                await new Promise((r) => setTimeout(r, 450));
            }
            catch (uploadErr) {
                if (uploadErr.message.includes('Maximum number of emojis reached')) {
                    console.log('  ⚠️ Maksimum statik emoji limitine (50) ulaşıldı.');
                    break;
                }
                else {
                    console.warn(`    ⚠️ Emoji yükleme hatası (${item.title}):`, uploadErr.message);
                }
            }
        }
        // Hareketli Emojileri Yükle
        console.log('  📥 Hareketli (GIF) emojiler yükleniyor (Hedef: 15)...');
        for (const item of targetAnimated) {
            try {
                let cleanName = item.title.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 30);
                if (cleanName.length < 2)
                    cleanName = `e_${cleanName}`;
                const imgRes = await axios_1.default.get(item.image, {
                    responseType: 'arraybuffer',
                    timeout: 10000,
                });
                await guild.emojis.create({
                    attachment: Buffer.from(imgRes.data),
                    name: cleanName,
                    reason: 'Prayt Popüler Hareketli Emoji',
                });
                uploadedCount++;
                console.log(`    [${uploadedCount}/65] ✨ Hareketli Eklendi: :${cleanName}:`);
                await new Promise((r) => setTimeout(r, 450));
            }
            catch (uploadErr) {
                if (uploadErr.message.includes('Maximum number of emojis reached')) {
                    console.log('  ⚠️ Maksimum hareketli emoji limitine ulaşıldı.');
                    break;
                }
                else {
                    console.warn(`    ⚠️ Hareketli emoji yükleme hatası (${item.title}):`, uploadErr.message);
                }
            }
        }
        console.log(`  🎉 Toplam ${uploadedCount} adet gerçek internet emojisi sunucuya yüklendi!`);
    }
    catch (apiErr) {
        console.error('  ❌ Emojiler internetten çekilirken hata:', apiErr.message);
    }
    // ==========================================
    // ADIM 4: KANALLARIN DÜZENLENMESİ & KİLİTLENMESİ
    // ==========================================
    console.log('\n📁 4. Kanallar, Kilitler ve Yeni Kanallar Kuruluyor...');
    const channels = await guild.channels.fetch();
    // 1. #🎯・click-me kanalına mesaj yazmayı kilitler (Sadece butona basılabilir)
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
                    SendMessages: false, // Üyeler MESAJ YAZAMAZ!
                    ReadMessageHistory: true,
                    AddReactions: false,
                    CreatePublicThreads: false,
                    CreatePrivateThreads: false,
                });
            }
            console.log('  ✅ #click-me kanalına üyelerin mesaj yazması kilitlendi (Sadece buton aktif)!');
        }
        catch (e) {
            console.warn('  ⚠️ #click-me kilit hatası:', e.message);
        }
    }
    // 2. Müzik Kategorisi: #muzik-bilgi ve #muzik-komut kanallarını AYIR
    console.log('  🎵 Müzik kanalları ayrıştırılıyor (#muzik-bilgi ve #muzik-komut)...');
    const musicCategory = channels.find((c) => c && c.type === discord_js_1.ChannelType.GuildCategory && c.name.includes('MÜZİK ALANI'));
    let chMuzikBilgi = channels.find((c) => c && c.name.includes('muzik-bilgi') && c.isTextBased());
    let chMuzikKomut = channels.find((c) => c && c.name.includes('muzik-komut') && c.isTextBased());
    // Eğer #muzik-bilgi kanalı yoksa sıfırdan oluştur:
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
    // #muzik-bilgi kanalına Anime Kızı ve Bilgi Embedini Gönder
    if (chMuzikBilgi && chMuzikBilgi.isTextBased()) {
        try {
            const oldMsgs = await chMuzikBilgi.messages.fetch({ limit: 5 });
            for (const [, m] of oldMsgs)
                await m.delete();
            await chMuzikBilgi.send({
                embeds: [musicPlayer_1.MusicPlayer.getMusicInfoEmbed()],
            });
            console.log('  ✅ #muzik-bilgi rehberi ve anime kızı GIF yerleştirildi!');
        }
        catch (e) {
            console.warn('  ⚠️ #muzik-bilgi mesaj hatası:', e.message);
        }
    }
    // #muzik-komut kanalına Butonlu Kontrol Panelini Gönder ve Mesaj Yazmayı Kilitle
    if (chMuzikKomut && chMuzikKomut.isTextBased()) {
        try {
            await chMuzikKomut.permissionOverwrites.edit(everyoneRole.id, {
                ViewChannel: false,
                SendMessages: false,
            });
            if (onayliRole) {
                await chMuzikKomut.permissionOverwrites.edit(onayliRole.id, {
                    ViewChannel: true,
                    SendMessages: false, // Üyeler buraya da mesaj yazamaz, butonları kullanır!
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
            console.log('  ✅ #muzik-komut butonlu interaktif paneli yerleştirildi!');
        }
        catch (e) {
            console.warn('  ⚠️ #muzik-komut panel hatası:', e.message);
        }
    }
    // 3. Ses Kategorisine #ses-paneli Ekle
    console.log('  🎙️ Ses Odaları kategorisine #ses-paneli ekleniyor...');
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
            console.log('  ✅ #ses-paneli interaktif ses kontrolleri yüklendi!');
        }
        catch (e) {
            console.warn('  ⚠️ #ses-paneli mesaj hatası:', e.message);
        }
    }
    // 4. İki Adet OwO Gambling Kanalı (1 sn yavaş mod ile)
    console.log('  🎰 OwO Gambling kanalları oluşturuluyor...');
    const gamesCategory = channels.find((c) => c && c.type === discord_js_1.ChannelType.GuildCategory && (c.name.includes('TOPLULUK') || c.name.includes('OYUN')));
    let chOwo1 = channels.find((c) => c && c.name.includes('owo-gambling-1'));
    let chOwo2 = channels.find((c) => c && c.name.includes('owo-gambling-2'));
    if (!chOwo1 && gamesCategory) {
        chOwo1 = await guild.channels.create({
            name: '🎰・owo-gambling-1',
            type: discord_js_1.ChannelType.GuildText,
            parent: gamesCategory.id,
            rateLimitPerUser: 1, // 1 saniye yavaş mod
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
        console.log('  ✅ #🎰・owo-gambling-1 kanalı açıldı (1s slowmode)!');
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
    if (!chOwo2 && gamesCategory) {
        chOwo2 = await guild.channels.create({
            name: '🎰・owo-gambling-2',
            type: discord_js_1.ChannelType.GuildText,
            parent: gamesCategory.id,
            rateLimitPerUser: 1, // 1 saniye yavaş mod
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
        console.log('  ✅ #🎰・owo-gambling-2 kanalı açıldı (1s slowmode)!');
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
    // 5. Kelime Oyunu Kuralları Embedini Yenile
    console.log('  🧩 Kelime oyunu kanalı güncelleniyor...');
    const chKelime = channels.find((c) => c && c.name.includes('kelime-oyunu') && c.isTextBased());
    if (chKelime && chKelime.isTextBased()) {
        try {
            await chKelime.send({
                embeds: [kelimeOyunu_1.KelimeOyunuManager.getInitialEmbed()],
            });
            console.log('  ✅ Kelime oyunu kuralları embedi kanala gönderildi!');
        }
        catch (e) {
            console.warn('  ⚠️ Kelime oyunu mesaj hatası:', e.message);
        }
    }
    console.log('\n=============================================');
    console.log('🎉 TÜM SUNUCU GÜNCELLEMELERİ EKSİKSİZ TAMAMLANDI!');
    console.log('=============================================');
    client.destroy();
}
main().catch(console.error);
