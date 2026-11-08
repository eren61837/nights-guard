import {
  Client,
  GatewayIntentBits,
  PermissionFlagsBits,
  EmbedBuilder,
  TextChannel,
} from 'discord.js';
import { config } from '../config';
import fs from 'fs';
import path from 'path';

const TARGET_GUILD_ID = '1568618183223414934'; // Prayt
const LEVEL_INFO_CHANNEL_ID = '1568644559615954964'; // #⭐・seviye-rol-bilgi

export const LEVEL_REWARD_ROLES = [
  { level: 5, name: '🥉・Level 5 | Çaylak', color: '#CD7F32' as const },
  { level: 10, name: '🥈・Level 10 | Aktif Üye', color: '#C0C0C0' as const },
  { level: 20, name: '🥇・Level 20 | Kıdemli', color: '#F1C40F' as const },
  { level: 30, name: '💎・Level 30 | Elmas', color: '#00E5FF' as const },
  { level: 50, name: '👑・Level 50 | Efsane', color: '#E056FD' as const },
];

async function setupLevelRoles() {
  console.log('🚀 Seviye Rolleri Kurulumu Başlatılıyor...');

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
    ],
  });

  await client.login(config.discordToken);
  console.log(`✅ Bot giriş yaptı: ${client.user?.tag}`);

  const guild = await client.guilds.fetch(TARGET_GUILD_ID);
  if (!guild) {
    console.error('Sunucu bulunamadı!');
    process.exit(1);
  }

  // 1. Üye rolünün izinlerini alalım
  const roles = await guild.roles.fetch();
  const uyeRole = roles.find((r) => r.name === 'Üye');
  const vipRole = roles.find((r) => r.name === 'VIP');

  if (!uyeRole) {
    console.error('Üye rolü bulunamadı!');
    process.exit(1);
  }

  // Güvenli izinler (Üye izinleri kopyalanır, ancak alt başlık oluşturma/mesaj atma ve everyone kesinlikle kapalı)
  const safePermissions = [
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.EmbedLinks,
    PermissionFlagsBits.AttachFiles,
    PermissionFlagsBits.ReadMessageHistory,
    PermissionFlagsBits.AddReactions,
    PermissionFlagsBits.UseExternalEmojis,
    PermissionFlagsBits.UseExternalStickers,
    PermissionFlagsBits.Connect,
    PermissionFlagsBits.Speak,
    PermissionFlagsBits.Stream,
    PermissionFlagsBits.UseVAD,
    PermissionFlagsBits.UseApplicationCommands,
    PermissionFlagsBits.SendPolls,
    PermissionFlagsBits.UseSoundboard,
  ];

  console.log('\n--- 1. Rolleri Oluşturma / Doğrulama ---');
  const createdRolesMap = new Map<number, any>();

  for (const reward of LEVEL_REWARD_ROLES) {
    let existing = roles.find((r) => r.name === reward.name);
    if (!existing) {
      console.log(`➕ Rol oluşturuluyor: ${reward.name} (${reward.color})`);
      existing = await guild.roles.create({
        name: reward.name,
        color: reward.color,
        hoist: false, // Kenar çubuğunu kirletmez, isim rengi ve profilde havalı rozet verir
        permissions: safePermissions,
        reason: 'Prayt Seviye Rol Sistemi Kurulumu',
      });
      console.log(`✅ Oluşturuldu: ${existing.name} (ID: ${existing.id})`);
    } else {
      console.log(`ℹ️ Rol zaten mevcut: ${existing.name} (ID: ${existing.id})`);
      await existing.edit({
        color: reward.color,
        hoist: false,
        permissions: safePermissions,
      });
    }
    createdRolesMap.set(reward.level, existing);
    await new Promise((r) => setTimeout(r, 400));
  }

  // 2. Rol Hiyerarşisini Ayarlama
  // Üye rolünün hemen üstüne ve VIP rolünün hemen altına yerleştiriyoruz
  console.log('\n--- 2. Hiyerarşi Düzenleme ---');
  // Hiyerarşi sırası: VIP > Level 50 > Level 30 > Level 20 > Level 10 > Level 5 > Üye
  const uyePos = uyeRole.position;
  console.log(`Üye rolü mevcut pozisyonu: ${uyePos}`);

  const rolePositions = [
    { role: createdRolesMap.get(5)!.id, position: uyePos + 1 },
    { role: createdRolesMap.get(10)!.id, position: uyePos + 2 },
    { role: createdRolesMap.get(20)!.id, position: uyePos + 3 },
    { role: createdRolesMap.get(30)!.id, position: uyePos + 4 },
    { role: createdRolesMap.get(50)!.id, position: uyePos + 5 },
  ];

  try {
    await guild.roles.setPositions(rolePositions);
    console.log('✅ Seviye rolleri Üye rolünün üstüne başarıyla yerleştirildi!');
  } catch (err: any) {
    console.warn(`⚠️ Pozisyon ayarlama uyarısı: ${err.message}`);
  }

  // 3. Mevcut Kullanıcıların Seviyelerine Göre Rolleri Eşitle
  console.log('\n--- 3. Mevcut Kullanıcıları Eşitleme ---');
  const levelDataPath = path.resolve('assets/levelData.json');
  if (fs.existsSync(levelDataPath)) {
    try {
      const levelData: Record<string, { xp: number; level: number }> = JSON.parse(
        fs.readFileSync(levelDataPath, 'utf-8')
      );
      for (const [userId, data] of Object.entries(levelData)) {
        if (data.level >= 5) {
          try {
            const member = await guild.members.fetch(userId).catch(() => null);
            if (member) {
              for (const reward of LEVEL_REWARD_ROLES) {
                if (data.level >= reward.level) {
                  const roleObj = createdRolesMap.get(reward.level);
                  if (roleObj && !member.roles.cache.has(roleObj.id)) {
                    await member.roles.add(roleObj.id);
                    console.log(`🎖️ ${member.user.tag} kullanıcısına ${reward.name} rolü verildi.`);
                  }
                }
              }
            }
          } catch (mErr: any) {
            console.warn(`Üye güncellenemedi (${userId}):`, mErr.message);
          }
        }
      }
    } catch (e: any) {
      console.warn('levelData okunamadı:', e.message);
    }
  }

  // 4. #⭐・seviye-rol-bilgi Kanalını Güncelleme
  console.log('\n--- 4. Seviye Rol Bilgi Kanalını Güncelleme ---');
  try {
    const channel = (await guild.channels.fetch(LEVEL_INFO_CHANNEL_ID).catch(() => null)) as TextChannel;
    if (channel && channel.isTextBased()) {
      // Eski bot mesajlarını temizle
      const messages = await channel.messages.fetch({ limit: 10 });
      for (const msg of messages.values()) {
        if (msg.author.id === client.user?.id) {
          await msg.delete().catch(() => {});
        }
      }

      const role5 = createdRolesMap.get(5);
      const role10 = createdRolesMap.get(10);
      const role20 = createdRolesMap.get(20);
      const role30 = createdRolesMap.get(30);
      const role50 = createdRolesMap.get(50);

      const infoEmbed = new EmbedBuilder()
        .setTitle('⭐ PRAYT SEVİYE & ROL BİLGİLENDİRME SİSTEMİ 🏆')
        .setDescription(
          'Sunucumuzda metin kanallarında aktif oldukça otomatik olarak **XP** kazanır, seviyenizi yükseltir ve özel rol ödüllerinin kilidini açarsınız!\n\n' +
          '### 🎖️ Seviye Rolleri ve Ayrıcalıkları:\n' +
          `• 🥉 **Level 5:** <@&${role5.id}>\n` +
          '  └ *Bronz isim rengi, görsel & bağlantı paylaşma ve harici emoji ayrıcalığı.*\n\n' +
          `• 🥈 **Level 10:** <@&${role10.id}>\n` +
          '  └ *Gümüş isim rengi, aktif sohbetçi statüsü ve özel sunucu çekilişlerine katılım önceliği.*\n\n' +
          `• 🥇 **Level 20:** <@&${role20.id}>\n` +
          '  └ *Altın sarısı parıldayan isim rengi, özel ses kanalı limit/bitrate kontrol avantajları.*\n\n' +
          `• 💎 **Level 30:** <@&${role30.id}>\n` +
          '  └ *Elmas mavi isim rengi, VIP oda erişimleri ve özel ses etkinlik yetkisi.*\n\n' +
          `• 👑 **Level 50:** <@&${role50.id}>\n` +
          '  └ *Efsane mor isim rengi, sunucunun en seçkin üyeleri arasına girme ve taht statüsü!*\n\n' +
          '### ⚡ Komutlar:\n' +
          '• `/rank` veya `!rank` — Kendi seviye kartınızı, mevcut XP ve kalan deneyiminizi gösterir.\n' +
          '• `/top` veya `!top` — Sunucunun en aktif üyelerini listeleyen canlı Liderlik Tablosu.\n\n' +
          '> 💡 **Nasıl XP Kazanılır?**\n' +
          '> *Metin kanallarında her 60 saniyede bir attığınız anlamlı mesajlar size 15-25 XP kazandırır.*\n' +
          '> *Spam, alt başlık suistimali veya flood koruma sistemimiz tarafından engellenir ve XP vermez.*'
        )
        .setColor('#F1C40F')
        .setImage('https://media.giphy.com/media/26tn3334mvoVClhos/giphy.gif')
        .setFooter({ text: 'Prayt Community Rewards • Made by erencix' })
        .setTimestamp();

      await channel.send({ embeds: [infoEmbed] });
      console.log('✅ #⭐・seviye-rol-bilgi kanalına güncel embed gönderildi!');
    }
  } catch (err: any) {
    console.warn(`Kanal güncellenemedi: ${err.message}`);
  }

  console.log('\n🎉 Seviye rolleri başarıyla tamamlandı!');
  await client.destroy();
  process.exit(0);
}

setupLevelRoles().catch((err) => {
  console.error('Hata:', err);
  process.exit(1);
});
