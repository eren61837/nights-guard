"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_1 = require("../config");
const TARGET_GUILD_ID = '1568618183223414934'; // Prayt
async function setupGuild() {
    console.log('🚀 Prayt Sunucu Mimarisi & Çok Adımlı Kayıt Sistemi Kuruluyor...');
    const client = new discord_js_1.Client({
        intents: [discord_js_1.GatewayIntentBits.Guilds, discord_js_1.GatewayIntentBits.GuildVoiceStates],
    });
    await client.login(config_1.config.discordToken);
    const guild = await client.guilds.fetch(TARGET_GUILD_ID);
    if (!guild) {
        console.error('❌ Hedef sunucu bulunamadı!');
        process.exit(1);
    }
    console.log(`🏰 Hedef Sunucu: ${guild.name} (${guild.id})`);
    // 1. Sunucu İkonunu Güncelle
    const iconPath = path_1.default.resolve('c:/Users/dell/Desktop/prayt_guard_pp.png');
    if (fs_1.default.existsSync(iconPath)) {
        try {
            const iconBuffer = fs_1.default.readFileSync(iconPath);
            await guild.setIcon(iconBuffer);
            console.log('✅ Sunucu ikonu (Logo) başarıyla güncellendi!');
        }
        catch (iconErr) {
            console.warn('⚠️ Sunucu ikonu güncellenemedi:', iconErr.message);
        }
    }
    // 2. Mevcut Eski Kanalları Temizle
    console.log('🧹 Eski kanallar temizleniyor...');
    const existingChannels = await guild.channels.fetch();
    for (const [, ch] of existingChannels) {
        if (ch) {
            try {
                await ch.delete();
                await new Promise((r) => setTimeout(r, 200));
            }
            catch (delErr) {
                console.warn(`Kanal silinemedi (${ch.name}):`, delErr.message);
            }
        }
    }
    // 3. Rolleri Oluştur / Güncelle
    console.log('🛡️ Roller oluşturuluyor...');
    const roleDefs = [
        { name: '👑 Kurucu', color: '#FF0055', hoist: true, permissions: [discord_js_1.PermissionFlagsBits.Administrator] },
        { name: '⚔️ Yönetici', color: '#FFAA00', hoist: true, permissions: [discord_js_1.PermissionFlagsBits.ManageGuild, discord_js_1.PermissionFlagsBits.ManageChannels, discord_js_1.PermissionFlagsBits.ManageRoles, discord_js_1.PermissionFlagsBits.KickMembers, discord_js_1.PermissionFlagsBits.BanMembers] },
        { name: '🔨 Moderatör', color: '#00FFAA', hoist: true, permissions: [discord_js_1.PermissionFlagsBits.ModerateMembers, discord_js_1.PermissionFlagsBits.ManageMessages, discord_js_1.PermissionFlagsBits.KickMembers] },
        { name: '💎 VIP Üye', color: '#9900FF', hoist: true, permissions: [] },
        { name: '✅ Onaylı Üye', color: '#00EEFF', hoist: true, permissions: [] },
        { name: '👦 Erkek', color: '#00A2FF', hoist: true, permissions: [] },
        { name: '👧 Kız', color: '#FF44AA', hoist: true, permissions: [] },
        { name: '⏳ Cinsiyet Bekleyen', color: '#888888', hoist: false, permissions: [] },
        { name: '🔇 Cezalı', color: '#333333', hoist: false, permissions: [] },
    ];
    const createdRoles = {};
    for (const rDef of roleDefs) {
        let role = guild.roles.cache.find((r) => r.name === rDef.name);
        if (!role) {
            try {
                role = await guild.roles.create({
                    name: rDef.name,
                    color: rDef.color,
                    hoist: rDef.hoist,
                    permissions: rDef.permissions,
                    reason: 'Prayt Guard Sunucu Mimarisi',
                });
                await new Promise((r) => setTimeout(r, 250));
            }
            catch (err) {
                console.warn(`Rol oluşturulamadı (${rDef.name}):`, err.message);
            }
        }
        if (role) {
            createdRoles[rDef.name] = role;
        }
    }
    // Sunucu Sahibine Kurucu Rolünü Ver
    try {
        const ownerMember = await guild.members.fetch(guild.ownerId);
        if (ownerMember && createdRoles['👑 Kurucu']) {
            await ownerMember.roles.add(createdRoles['👑 Kurucu']);
            console.log(`👑 Kurucu rolü sunucu sahibine (${ownerMember.user.tag}) verildi.`);
        }
    }
    catch (ownerErr) {
        console.warn('Kurucu rolü verilemedi:', ownerErr.message);
    }
    const everyoneRole = guild.roles.everyone;
    const waitingRole = createdRoles['⏳ Cinsiyet Bekleyen'];
    const approvedRole = createdRoles['✅ Onaylı Üye'];
    const modRole = createdRoles['🔨 Moderatör'];
    const adminRole = createdRoles['⚔️ Yönetici'];
    const kurucuRole = createdRoles['👑 Kurucu'];
    // 4. Kategori & Kanal Mimarisi
    console.log('📁 Kategoriler ve kanallar inşa ediliyor...');
    // --- KATEGORİ 1: GİRİŞ & KAYIT ---
    const catRegister = await guild.channels.create({
        name: '🚪 ┃ GİRİŞ & KAYIT',
        type: discord_js_1.ChannelType.GuildCategory,
        permissionOverwrites: [
            { id: everyoneRole.id, allow: [discord_js_1.PermissionFlagsBits.ViewChannel] },
        ],
    });
    // #kayit-onay (1. Adım: Herkes görür, onay alan görmez)
    const chKayitOnay = await guild.channels.create({
        name: '🛡️・kayit-onay',
        type: discord_js_1.ChannelType.GuildText,
        parent: catRegister.id,
        topic: 'Prayt Topluluğu Kayıt Giriş Kapısı',
        permissionOverwrites: [
            { id: everyoneRole.id, allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.ReadMessageHistory], deny: [discord_js_1.PermissionFlagsBits.SendMessages] },
            ...(waitingRole ? [{ id: waitingRole.id, deny: [discord_js_1.PermissionFlagsBits.ViewChannel] }] : []),
            ...(approvedRole ? [{ id: approvedRole.id, deny: [discord_js_1.PermissionFlagsBits.ViewChannel] }] : []),
        ],
    });
    // #cinsiyet-secimi (2. Adım: Yalnızca Cinsiyet Bekleyen görür)
    const chCinsiyetSecimi = await guild.channels.create({
        name: '🚻・cinsiyet-secimi',
        type: discord_js_1.ChannelType.GuildText,
        parent: catRegister.id,
        topic: 'Cinsiyet Rolü Seçim Odası',
        permissionOverwrites: [
            { id: everyoneRole.id, deny: [discord_js_1.PermissionFlagsBits.ViewChannel] },
            ...(waitingRole ? [{ id: waitingRole.id, allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.ReadMessageHistory], deny: [discord_js_1.PermissionFlagsBits.SendMessages] }] : []),
            ...(approvedRole ? [{ id: approvedRole.id, deny: [discord_js_1.PermissionFlagsBits.ViewChannel] }] : []),
        ],
    });
    // --- KATEGORİ 2: BİLGİLENDİRME ---
    const catInfo = await guild.channels.create({
        name: '📢 ┃ BİLGİLENDİRME',
        type: discord_js_1.ChannelType.GuildCategory,
        permissionOverwrites: [
            { id: everyoneRole.id, deny: [discord_js_1.PermissionFlagsBits.ViewChannel] },
            ...(approvedRole ? [{ id: approvedRole.id, allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.ReadMessageHistory], deny: [discord_js_1.PermissionFlagsBits.SendMessages] }] : []),
        ],
    });
    const chKurallar = await guild.channels.create({
        name: '📜・kurallar',
        type: discord_js_1.ChannelType.GuildText,
        parent: catInfo.id,
    });
    const chDuyurular = await guild.channels.create({
        name: '📢・duyurular',
        type: discord_js_1.ChannelType.GuildText,
        parent: catInfo.id,
    });
    const chSeviye = await guild.channels.create({
        name: '⭐・seviye-rol-bilgi',
        type: discord_js_1.ChannelType.GuildText,
        parent: catInfo.id,
    });
    // --- KATEGORİ 3: TOPLULUK & SOHBET ---
    const catChat = await guild.channels.create({
        name: '💬 ┃ TOPLULUK & SOHBET',
        type: discord_js_1.ChannelType.GuildCategory,
        permissionOverwrites: [
            { id: everyoneRole.id, deny: [discord_js_1.PermissionFlagsBits.ViewChannel] },
            ...(approvedRole ? [{ id: approvedRole.id, allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.SendMessages, discord_js_1.PermissionFlagsBits.ReadMessageHistory, discord_js_1.PermissionFlagsBits.AttachFiles] }] : []),
        ],
    });
    const chGenel = await guild.channels.create({
        name: '💬・genel-sohbet',
        type: discord_js_1.ChannelType.GuildText,
        parent: catChat.id,
    });
    await guild.channels.create({
        name: '📸・foto-medya',
        type: discord_js_1.ChannelType.GuildText,
        parent: catChat.id,
    });
    await guild.channels.create({
        name: '🤖・bot-komut',
        type: discord_js_1.ChannelType.GuildText,
        parent: catChat.id,
    });
    await guild.channels.create({
        name: '🧩・kelime-oyunu',
        type: discord_js_1.ChannelType.GuildText,
        parent: catChat.id,
    });
    // --- KATEGORİ 4: OYUN ALANI ---
    const catGaming = await guild.channels.create({
        name: '🎮 ┃ OYUN ALANI',
        type: discord_js_1.ChannelType.GuildCategory,
        permissionOverwrites: [
            { id: everyoneRole.id, deny: [discord_js_1.PermissionFlagsBits.ViewChannel] },
            ...(approvedRole ? [{ id: approvedRole.id, allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.SendMessages, discord_js_1.PermissionFlagsBits.ReadMessageHistory] }] : []),
        ],
    });
    await guild.channels.create({
        name: '🎯・valorant',
        type: discord_js_1.ChannelType.GuildText,
        parent: catGaming.id,
    });
    await guild.channels.create({
        name: '⚔️・league-of-legends',
        type: discord_js_1.ChannelType.GuildText,
        parent: catGaming.id,
    });
    await guild.channels.create({
        name: '💣・cs2',
        type: discord_js_1.ChannelType.GuildText,
        parent: catGaming.id,
    });
    await guild.channels.create({
        name: '🤝・oyun-arkadasi-bul',
        type: discord_js_1.ChannelType.GuildText,
        parent: catGaming.id,
    });
    // --- KATEGORİ 5: SES ODALARI ---
    const catVoice = await guild.channels.create({
        name: '🔊 ┃ SES ODALARI',
        type: discord_js_1.ChannelType.GuildCategory,
        permissionOverwrites: [
            { id: everyoneRole.id, deny: [discord_js_1.PermissionFlagsBits.ViewChannel] },
            ...(approvedRole ? [{ id: approvedRole.id, allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.Connect, discord_js_1.PermissionFlagsBits.Speak] }] : []),
        ],
    });
    await guild.channels.create({
        name: '➕・Oda Oluştur',
        type: discord_js_1.ChannelType.GuildVoice,
        parent: catVoice.id,
    });
    await guild.channels.create({
        name: '🔊・Sohbet Odası 1',
        type: discord_js_1.ChannelType.GuildVoice,
        parent: catVoice.id,
    });
    await guild.channels.create({
        name: '🔊・Sohbet Odası 2',
        type: discord_js_1.ChannelType.GuildVoice,
        parent: catVoice.id,
    });
    await guild.channels.create({
        name: '🎮・Oyun Odası 1',
        type: discord_js_1.ChannelType.GuildVoice,
        parent: catVoice.id,
        userLimit: 5,
    });
    await guild.channels.create({
        name: '🎮・Oyun Odası 2',
        type: discord_js_1.ChannelType.GuildVoice,
        parent: catVoice.id,
        userLimit: 5,
    });
    await guild.channels.create({
        name: '💤・AFK & Müzik',
        type: discord_js_1.ChannelType.GuildVoice,
        parent: catVoice.id,
    });
    // --- KATEGORİ 6: YÖNETİM & LOG (Sadece Yetkililere Özel) ---
    const catStaff = await guild.channels.create({
        name: '🔒 ┃ YETKİLİ ÖZEL',
        type: discord_js_1.ChannelType.GuildCategory,
        permissionOverwrites: [
            { id: everyoneRole.id, deny: [discord_js_1.PermissionFlagsBits.ViewChannel] },
            ...(approvedRole ? [{ id: approvedRole.id, deny: [discord_js_1.PermissionFlagsBits.ViewChannel] }] : []),
            ...(modRole ? [{ id: modRole.id, allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.SendMessages, discord_js_1.PermissionFlagsBits.ReadMessageHistory] }] : []),
            ...(adminRole ? [{ id: adminRole.id, allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.SendMessages, discord_js_1.PermissionFlagsBits.ReadMessageHistory] }] : []),
            ...(kurucuRole ? [{ id: kurucuRole.id, allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.SendMessages, discord_js_1.PermissionFlagsBits.ReadMessageHistory] }] : []),
        ],
    });
    await guild.channels.create({
        name: '🛡️・yetkili-sohbet',
        type: discord_js_1.ChannelType.GuildText,
        parent: catStaff.id,
    });
    const chKayitLog = await guild.channels.create({
        name: '📋・kayit-log',
        type: discord_js_1.ChannelType.GuildText,
        parent: catStaff.id,
    });
    await guild.channels.create({
        name: '🚨・mod-log',
        type: discord_js_1.ChannelType.GuildText,
        parent: catStaff.id,
    });
    // 5. Kanallara Estetik Embed ve Butonları Gönder
    console.log('🎨 Kayıt panelleri ve embedler gönderiliyor...');
    // #kayit-onay Paneli
    const kayitOnayEmbed = new discord_js_1.EmbedBuilder()
        .setTitle('🛡️ PRAYT TOPLULUĞUNA HOŞ GELDİNİZ!')
        .setDescription('Sunucumuza katıldığınız için teşekkür ederiz! Topluluğumuzda güvenli ve samimi bir ortam sağlamak için kayıt sistemi devrededir.\n\n' +
        '### 📌 Kayıt Adımları:\n' +
        '1️⃣ Aşağıdaki **`[🛡️ Kayıt Ol & Onay Al]`** butonuna tıklayınız.\n' +
        '2️⃣ Açılacak size özel **`#cinsiyet-secimi`** kanalından cinsiyetinizi seçiniz.\n' +
        '3️⃣ İsminizi ve yaşınızı belirterek sunucuya anında giriş yapınız!\n\n' +
        '⚠️ *Her adımı tamamladığınızda bir önceki kanal otomatik olarak sizden gizlenecektir.*')
        .setImage('https://media.giphy.com/media/26tn3334mvoVClhos/giphy.gif')
        .setColor('#5865F2')
        .setFooter({ text: 'Prayt Guard • Güvenli Giriş Sistemi • Made by erencix' });
    const btnKayitOnay = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId('btn_kayit_basla')
        .setLabel('Kayıt Ol & Onay Al')
        .setStyle(discord_js_1.ButtonStyle.Success)
        .setEmoji('🛡️'));
    await chKayitOnay.send({
        embeds: [kayitOnayEmbed],
        components: [btnKayitOnay],
    });
    // #cinsiyet-secimi Paneli
    const cinsiyetEmbed = new discord_js_1.EmbedBuilder()
        .setTitle('🚻 LÜTFEN CİNSİYETİNİZİ SEÇİNİZ')
        .setDescription('Harika! İlk adımı tamamladınız.\n\n' +
        'Şimdi sunucumuzdaki rol dağılımı ve hitap düzeni için lütfen cinsiyetinizi seçiniz.\n' +
        'Butona bastığınızda **İsminizi ve Yaşınızı** girebileceğiniz hızlı bir kayıt penceresi açılacaktır.\n\n' +
        '👦 **Erkek** | 👧 **Kız**')
        .setImage('https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZqOHo0bTJ5eWpkaWZ1Z29reTFrMmtnOGUza2Q1bDJqZ214NnB3dyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/L1R1tvI9svkIWwpVYr/giphy.gif')
        .setColor('#9B59B6')
        .setFooter({ text: 'Prayt Guard • 2. Adım Cinsiyet Seçimi' });
    const btnCinsiyet = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId('btn_cinsiyet_erkek')
        .setLabel('Erkek')
        .setStyle(discord_js_1.ButtonStyle.Primary)
        .setEmoji('👦'), new discord_js_1.ButtonBuilder()
        .setCustomId('btn_cinsiyet_kiz')
        .setLabel('Kız')
        .setStyle(discord_js_1.ButtonStyle.Danger)
        .setEmoji('👧'));
    await chCinsiyetSecimi.send({
        embeds: [cinsiyetEmbed],
        components: [btnCinsiyet],
    });
    // #kurallar Paneli
    const kurallarEmbed = new discord_js_1.EmbedBuilder()
        .setTitle('📜 PRAYT SUNUCU KURALLARI')
        .setDescription('Sunucumuzda herkesin huzurlu ve keyifli vakit geçirebilmesi için kurallara uyulması zorunludur:\n\n' +
        '**1. Karşılıklı Saygı:** Küfür, hakaret, aşağılama ve nefret söylemi kesinlikle yasaktır.\n' +
        '**2. Reklam Yasağı:** Sunucu içi veya üyelerin DM kutularına izinsiz reklam/davet atmak kalıcı ban sebebidir.\n' +
        '**3. Spam & Flood:** Kanalları gereksiz yere meşgul etmek, büyük harfle bağırmak ve mention spamı yapmak yasaktır.\n' +
        '**4. Uygunsuz İçerik (NSFW):** Kanallarda ve ses odalarında +18, şiddet veya rahatsız edici içerik paylaşımı yasaktır.\n' +
        '**5. Ses Odaları:** Ses değiştirici programlar ile insanları rahatsız etmek veya müzik botlarını suistimal etmek yasaktır.\n\n' +
        '🛡️ *Kuralları ihlal eden kullanıcılar AutoMod ve yetkili kadromuz tarafından cezalandırılacaktır.*')
        .setColor('#FF0055')
        .setFooter({ text: 'Prayt Guard • Sunucu Kuralları' });
    await chKurallar.send({ embeds: [kurallarEmbed] });
    // #kayit-log Başlangıç Bildirimi
    const logBaslangic = new discord_js_1.EmbedBuilder()
        .setTitle('📋 Kayıt Log Sistemi Aktif')
        .setDescription('Yeni kayıt olan üyelerin bilgileri (İsim, Yaş, Cinsiyet, Discord ID) anlık olarak bu kanala düşecektir.')
        .setColor('#2ECC71')
        .setTimestamp();
    await chKayitLog.send({ embeds: [logBaslangic] });
    console.log('🎉 PRAYT SUNUCUSU BAŞARIYLA SIFIRDAN KURULDU!');
    client.destroy();
}
setupGuild().catch((err) => {
    console.error('Hata:', err);
    process.exit(1);
});
