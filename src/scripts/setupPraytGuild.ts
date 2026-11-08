import {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import fs from 'fs';
import path from 'path';
import { config } from '../config';

const TARGET_GUILD_ID = '1568618183223414934'; // Prayt

async function setupGuild() {
  console.log('🚀 Prayt Sunucu Mimarisi & Çok Adımlı Kayıt Sistemi Kuruluyor...');

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
  });

  await client.login(config.discordToken);

  const guild = await client.guilds.fetch(TARGET_GUILD_ID);
  if (!guild) {
    console.error('❌ Hedef sunucu bulunamadı!');
    process.exit(1);
  }

  console.log(`🏰 Hedef Sunucu: ${guild.name} (${guild.id})`);

  // 1. Sunucu İkonunu Güncelle
  const iconPath = path.resolve('c:/Users/dell/Desktop/prayt_guard_pp.png');
  if (fs.existsSync(iconPath)) {
    try {
      const iconBuffer = fs.readFileSync(iconPath);
      await guild.setIcon(iconBuffer);
      console.log('✅ Sunucu ikonu (Logo) başarıyla güncellendi!');
    } catch (iconErr: any) {
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
      } catch (delErr: any) {
        console.warn(`Kanal silinemedi (${ch.name}):`, delErr.message);
      }
    }
  }

  // 3. Rolleri Oluştur / Güncelle
  console.log('🛡️ Roller oluşturuluyor...');
  const roleDefs = [
    { name: '👑 Kurucu', color: '#FF0055', hoist: true, permissions: [PermissionFlagsBits.Administrator] },
    { name: '⚔️ Yönetici', color: '#FFAA00', hoist: true, permissions: [PermissionFlagsBits.ManageGuild, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageRoles, PermissionFlagsBits.KickMembers, PermissionFlagsBits.BanMembers] },
    { name: '🔨 Moderatör', color: '#00FFAA', hoist: true, permissions: [PermissionFlagsBits.ModerateMembers, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.KickMembers] },
    { name: '💎 VIP Üye', color: '#9900FF', hoist: true, permissions: [] },
    { name: '✅ Onaylı Üye', color: '#00EEFF', hoist: true, permissions: [] },
    { name: '👦 Erkek', color: '#00A2FF', hoist: true, permissions: [] },
    { name: '👧 Kız', color: '#FF44AA', hoist: true, permissions: [] },
    { name: '⏳ Cinsiyet Bekleyen', color: '#888888', hoist: false, permissions: [] },
    { name: '🔇 Cezalı', color: '#333333', hoist: false, permissions: [] },
  ];

  const createdRoles: Record<string, any> = {};

  for (const rDef of roleDefs) {
    let role = guild.roles.cache.find((r) => r.name === rDef.name);
    if (!role) {
      try {
        role = await guild.roles.create({
          name: rDef.name,
          color: rDef.color as any,
          hoist: rDef.hoist,
          permissions: rDef.permissions as any,
          reason: 'Prayt Guard Sunucu Mimarisi',
        });
        await new Promise((r) => setTimeout(r, 250));
      } catch (err: any) {
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
  } catch (ownerErr: any) {
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
    type: ChannelType.GuildCategory,
    permissionOverwrites: [
      { id: everyoneRole.id, allow: [PermissionFlagsBits.ViewChannel] },
    ],
  });

  // #kayit-onay (1. Adım: Herkes görür, onay alan görmez)
  const chKayitOnay = await guild.channels.create({
    name: '🛡️・kayit-onay',
    type: ChannelType.GuildText,
    parent: catRegister.id,
    topic: 'Prayt Topluluğu Kayıt Giriş Kapısı',
    permissionOverwrites: [
      { id: everyoneRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory], deny: [PermissionFlagsBits.SendMessages] },
      ...(waitingRole ? [{ id: waitingRole.id, deny: [PermissionFlagsBits.ViewChannel] }] : []),
      ...(approvedRole ? [{ id: approvedRole.id, deny: [PermissionFlagsBits.ViewChannel] }] : []),
    ],
  });

  // #cinsiyet-secimi (2. Adım: Yalnızca Cinsiyet Bekleyen görür)
  const chCinsiyetSecimi = await guild.channels.create({
    name: '🚻・cinsiyet-secimi',
    type: ChannelType.GuildText,
    parent: catRegister.id,
    topic: 'Cinsiyet Rolü Seçim Odası',
    permissionOverwrites: [
      { id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel] },
      ...(waitingRole ? [{ id: waitingRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory], deny: [PermissionFlagsBits.SendMessages] }] : []),
      ...(approvedRole ? [{ id: approvedRole.id, deny: [PermissionFlagsBits.ViewChannel] }] : []),
    ],
  });

  // --- KATEGORİ 2: BİLGİLENDİRME ---
  const catInfo = await guild.channels.create({
    name: '📢 ┃ BİLGİLENDİRME',
    type: ChannelType.GuildCategory,
    permissionOverwrites: [
      { id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel] },
      ...(approvedRole ? [{ id: approvedRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory], deny: [PermissionFlagsBits.SendMessages] }] : []),
    ],
  });

  const chKurallar = await guild.channels.create({
    name: '📜・kurallar',
    type: ChannelType.GuildText,
    parent: catInfo.id,
  });

  const chDuyurular = await guild.channels.create({
    name: '📢・duyurular',
    type: ChannelType.GuildText,
    parent: catInfo.id,
  });

  const chSeviye = await guild.channels.create({
    name: '⭐・seviye-rol-bilgi',
    type: ChannelType.GuildText,
    parent: catInfo.id,
  });

  // --- KATEGORİ 3: TOPLULUK & SOHBET ---
  const catChat = await guild.channels.create({
    name: '💬 ┃ TOPLULUK & SOHBET',
    type: ChannelType.GuildCategory,
    permissionOverwrites: [
      { id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel] },
      ...(approvedRole ? [{ id: approvedRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] }] : []),
    ],
  });

  const chGenel = await guild.channels.create({
    name: '💬・genel-sohbet',
    type: ChannelType.GuildText,
    parent: catChat.id,
  });

  await guild.channels.create({
    name: '📸・foto-medya',
    type: ChannelType.GuildText,
    parent: catChat.id,
  });

  await guild.channels.create({
    name: '🤖・bot-komut',
    type: ChannelType.GuildText,
    parent: catChat.id,
  });

  await guild.channels.create({
    name: '🧩・kelime-oyunu',
    type: ChannelType.GuildText,
    parent: catChat.id,
  });

  // --- KATEGORİ 4: OYUN ALANI ---
  const catGaming = await guild.channels.create({
    name: '🎮 ┃ OYUN ALANI',
    type: ChannelType.GuildCategory,
    permissionOverwrites: [
      { id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel] },
      ...(approvedRole ? [{ id: approvedRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }] : []),
    ],
  });

  await guild.channels.create({
    name: '🎯・valorant',
    type: ChannelType.GuildText,
    parent: catGaming.id,
  });

  await guild.channels.create({
    name: '⚔️・league-of-legends',
    type: ChannelType.GuildText,
    parent: catGaming.id,
  });

  await guild.channels.create({
    name: '💣・cs2',
    type: ChannelType.GuildText,
    parent: catGaming.id,
  });

  await guild.channels.create({
    name: '🤝・oyun-arkadasi-bul',
    type: ChannelType.GuildText,
    parent: catGaming.id,
  });

  // --- KATEGORİ 5: SES ODALARI ---
  const catVoice = await guild.channels.create({
    name: '🔊 ┃ SES ODALARI',
    type: ChannelType.GuildCategory,
    permissionOverwrites: [
      { id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel] },
      ...(approvedRole ? [{ id: approvedRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak] }] : []),
    ],
  });

  await guild.channels.create({
    name: '➕・Oda Oluştur',
    type: ChannelType.GuildVoice,
    parent: catVoice.id,
  });

  await guild.channels.create({
    name: '🔊・Sohbet Odası 1',
    type: ChannelType.GuildVoice,
    parent: catVoice.id,
  });

  await guild.channels.create({
    name: '🔊・Sohbet Odası 2',
    type: ChannelType.GuildVoice,
    parent: catVoice.id,
  });

  await guild.channels.create({
    name: '🎮・Oyun Odası 1',
    type: ChannelType.GuildVoice,
    parent: catVoice.id,
    userLimit: 5,
  });

  await guild.channels.create({
    name: '🎮・Oyun Odası 2',
    type: ChannelType.GuildVoice,
    parent: catVoice.id,
    userLimit: 5,
  });

  await guild.channels.create({
    name: '💤・AFK & Müzik',
    type: ChannelType.GuildVoice,
    parent: catVoice.id,
  });

  // --- KATEGORİ 6: YÖNETİM & LOG (Sadece Yetkililere Özel) ---
  const catStaff = await guild.channels.create({
    name: '🔒 ┃ YETKİLİ ÖZEL',
    type: ChannelType.GuildCategory,
    permissionOverwrites: [
      { id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel] },
      ...(approvedRole ? [{ id: approvedRole.id, deny: [PermissionFlagsBits.ViewChannel] }] : []),
      ...(modRole ? [{ id: modRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }] : []),
      ...(adminRole ? [{ id: adminRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }] : []),
      ...(kurucuRole ? [{ id: kurucuRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }] : []),
    ],
  });

  await guild.channels.create({
    name: '🛡️・yetkili-sohbet',
    type: ChannelType.GuildText,
    parent: catStaff.id,
  });

  const chKayitLog = await guild.channels.create({
    name: '📋・kayit-log',
    type: ChannelType.GuildText,
    parent: catStaff.id,
  });

  await guild.channels.create({
    name: '🚨・mod-log',
    type: ChannelType.GuildText,
    parent: catStaff.id,
  });

  // 5. Kanallara Estetik Embed ve Butonları Gönder
  console.log('🎨 Kayıt panelleri ve embedler gönderiliyor...');

  // #kayit-onay Paneli
  const kayitOnayEmbed = new EmbedBuilder()
    .setTitle('🛡️ PRAYT TOPLULUĞUNA HOŞ GELDİNİZ!')
    .setDescription(
      'Sunucumuza katıldığınız için teşekkür ederiz! Topluluğumuzda güvenli ve samimi bir ortam sağlamak için kayıt sistemi devrededir.\n\n' +
      '### 📌 Kayıt Adımları:\n' +
      '1️⃣ Aşağıdaki **`[🛡️ Kayıt Ol & Onay Al]`** butonuna tıklayınız.\n' +
      '2️⃣ Açılacak size özel **`#cinsiyet-secimi`** kanalından cinsiyetinizi seçiniz.\n' +
      '3️⃣ İsminizi ve yaşınızı belirterek sunucuya anında giriş yapınız!\n\n' +
      '⚠️ *Her adımı tamamladığınızda bir önceki kanal otomatik olarak sizden gizlenecektir.*'
    )
    .setImage('https://media.giphy.com/media/26tn3334mvoVClhos/giphy.gif')
    .setColor('#5865F2')
    .setFooter({ text: 'Prayt Guard • Güvenli Giriş Sistemi • Made by erencix' });

  const btnKayitOnay = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_kayit_basla')
      .setLabel('Kayıt Ol & Onay Al')
      .setStyle(ButtonStyle.Success)
      .setEmoji('🛡️')
  );

  await chKayitOnay.send({
    embeds: [kayitOnayEmbed],
    components: [btnKayitOnay],
  });

  // #cinsiyet-secimi Paneli
  const cinsiyetEmbed = new EmbedBuilder()
    .setTitle('🚻 LÜTFEN CİNSİYETİNİZİ SEÇİNİZ')
    .setDescription(
      'Harika! İlk adımı tamamladınız.\n\n' +
      'Şimdi sunucumuzdaki rol dağılımı ve hitap düzeni için lütfen cinsiyetinizi seçiniz.\n' +
      'Butona bastığınızda **İsminizi ve Yaşınızı** girebileceğiniz hızlı bir kayıt penceresi açılacaktır.\n\n' +
      '👦 **Erkek** | 👧 **Kız**'
    )
    .setImage('https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZqOHo0bTJ5eWpkaWZ1Z29reTFrMmtnOGUza2Q1bDJqZ214NnB3dyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/L1R1tvI9svkIWwpVYr/giphy.gif')
    .setColor('#9B59B6')
    .setFooter({ text: 'Prayt Guard • 2. Adım Cinsiyet Seçimi' });

  const btnCinsiyet = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_cinsiyet_erkek')
      .setLabel('Erkek')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('👦'),
    new ButtonBuilder()
      .setCustomId('btn_cinsiyet_kiz')
      .setLabel('Kız')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('👧')
  );

  await chCinsiyetSecimi.send({
    embeds: [cinsiyetEmbed],
    components: [btnCinsiyet],
  });

  // #kurallar Paneli
  const kurallarEmbed = new EmbedBuilder()
    .setTitle('📜 PRAYT SUNUCU KURALLARI')
    .setDescription(
      'Sunucumuzda herkesin huzurlu ve keyifli vakit geçirebilmesi için kurallara uyulması zorunludur:\n\n' +
      '**1. Karşılıklı Saygı:** Küfür, hakaret, aşağılama ve nefret söylemi kesinlikle yasaktır.\n' +
      '**2. Reklam Yasağı:** Sunucu içi veya üyelerin DM kutularına izinsiz reklam/davet atmak kalıcı ban sebebidir.\n' +
      '**3. Spam & Flood:** Kanalları gereksiz yere meşgul etmek, büyük harfle bağırmak ve mention spamı yapmak yasaktır.\n' +
      '**4. Uygunsuz İçerik (NSFW):** Kanallarda ve ses odalarında +18, şiddet veya rahatsız edici içerik paylaşımı yasaktır.\n' +
      '**5. Ses Odaları:** Ses değiştirici programlar ile insanları rahatsız etmek veya müzik botlarını suistimal etmek yasaktır.\n\n' +
      '🛡️ *Kuralları ihlal eden kullanıcılar AutoMod ve yetkili kadromuz tarafından cezalandırılacaktır.*'
    )
    .setColor('#FF0055')
    .setFooter({ text: 'Prayt Guard • Sunucu Kuralları' });

  await chKurallar.send({ embeds: [kurallarEmbed] });

  // #kayit-log Başlangıç Bildirimi
  const logBaslangic = new EmbedBuilder()
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
