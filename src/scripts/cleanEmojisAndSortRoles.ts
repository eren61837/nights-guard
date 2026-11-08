import { Client, GatewayIntentBits, PermissionFlagsBits } from 'discord.js';
import { config } from '../config';

const TARGET_GUILD_ID = '1568618183223414934'; // Prayt

async function cleanRoles() {
  console.log('🛡️ Roller sadeleştiriliyor, emojiler siliniyor ve hiyerarşi ayarlanıyor...');

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  await client.login(config.discordToken);

  const guild = await client.guilds.fetch(TARGET_GUILD_ID);
  if (!guild) {
    console.error('Sunucu bulunamadı!');
    process.exit(1);
  }

  const roles = await guild.roles.fetch();

  // 1. Emojileri temizle ve isimleri güncelle
  const renameMap: Record<string, { newName: string; hoist: boolean; color?: string }> = {
    '👑 Kurucu': { newName: 'Kurucu', hoist: true, color: '#FF0055' },
    '⚔️ Yönetici': { newName: 'Yönetici', hoist: true, color: '#FFAA00' },
    '🔨 Moderatör': { newName: 'Moderatör', hoist: true, color: '#00FFAA' },
    '💎 VIP Üye': { newName: 'VIP', hoist: true, color: '#9900FF' },
    '👦 Erkek': { newName: 'Erkek', hoist: false, color: '#00A2FF' },
    '👧 Kız': { newName: 'Kız', hoist: false, color: '#FF44AA' },
    '⏳ Cinsiyet Bekleyen': { newName: 'Kayıt Bekleyen', hoist: false, color: '#64748B' },
    '🔇 Cezalı': { newName: 'Cezalı', hoist: false, color: '#334155' },
  };

  for (const [oldName, cfg] of Object.entries(renameMap)) {
    const role = roles.find((r) => r.name === oldName || r.name === cfg.newName);
    if (role) {
      try {
        await role.edit({
          name: cfg.newName,
          hoist: cfg.hoist,
          color: cfg.color as any,
          reason: 'Sadeleştirilmiş Rol Mimarisi',
        });
        console.log(`✅ Rol güncellendi: ${oldName} -> ${cfg.newName} (hoist: ${cfg.hoist})`);
      } catch (err: any) {
        console.warn(`Rol düzenlenemedi (${oldName}):`, err.message);
      }
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  // 2. 'Üye' ve 'Onaylı' Rollerini Ayrıştır
  // '✅ Onaylı Üye' rolünü 'Onaylı' yapıyoruz (hoist: false, kanalları görme yetkisi)
  let onayliRole = roles.find((r) => r.name.includes('Onaylı') || r.name === 'Onaylı');
  if (onayliRole) {
    try {
      await onayliRole.edit({
        name: 'Onaylı',
        hoist: false,
        color: '#64748B',
      });
      console.log('✅ Onaylı rolü ayarlandı (hoist: false).');
    } catch (e: any) {
      console.warn('Onaylı rolü güncellenemedi:', e.message);
    }
  } else {
    onayliRole = await guild.roles.create({
      name: 'Onaylı',
      hoist: false,
      color: '#64748B',
      reason: 'Kanal erişim alt rolü',
    });
    console.log('✅ Onaylı rolü oluşturuldu.');
  }

  // 'Üye' rolünü oluştur / ayarla (hoist: true -> Üyeler sağ tarafta 'Üye' başlığı altında görünür!)
  let uyeRole = roles.find((r) => r.name === 'Üye');
  if (!uyeRole) {
    uyeRole = await guild.roles.create({
      name: 'Üye',
      hoist: true,
      color: '#A855F7', // Şık Asil Mor
      reason: 'Ana Üye Görünür Rolü',
    });
    console.log('✅ Üye rolü oluşturuldu (hoist: true).');
  } else {
    await uyeRole.edit({
      name: 'Üye',
      hoist: true,
      color: '#A855F7',
    });
    console.log('✅ Üye rolü güncellendi (hoist: true).');
  }

  // 3. Hiyerarşik Sıralama (Position)
  // Kurucu > Yönetici > Moderatör > VIP > Üye > Erkek > Kız > Onaylı > Kayıt Bekleyen > Cezalı
  const freshRoles = await guild.roles.fetch();

  const kurucu = freshRoles.find((r) => r.name === 'Kurucu');
  const yonetici = freshRoles.find((r) => r.name === 'Yönetici');
  const moderator = freshRoles.find((r) => r.name === 'Moderatör');
  const vip = freshRoles.find((r) => r.name === 'VIP');
  const uye = freshRoles.find((r) => r.name === 'Üye');
  const erkek = freshRoles.find((r) => r.name === 'Erkek');
  const kiz = freshRoles.find((r) => r.name === 'Kız');
  const onayli = freshRoles.find((r) => r.name === 'Onaylı');
  const kayitBekleyen = freshRoles.find((r) => r.name === 'Kayıt Bekleyen');
  const cezali = freshRoles.find((r) => r.name === 'Cezalı');

  const orderedList = [
    cezali,
    kayitBekleyen,
    onayli,
    kiz,
    erkek,
    uye,
    vip,
    moderator,
    yonetici,
    kurucu,
  ].filter(Boolean) as any[];

  console.log('Hiyerarşi sıralaması uygulanıyor...');
  const positionsPayload = orderedList.map((r, idx) => ({
    role: r.id,
    position: idx + 1,
  }));

  try {
    await guild.roles.setPositions(positionsPayload);
    console.log('✅ Rol pozisyonları ve hiyerarşi başarıyla hizalandı!');
  } catch (posErr: any) {
    console.warn('Pozisyonlar sıralanırken hata (hiyerarşi sınırları):', posErr.message);
  }

  // 4. Kanal İzinlerinde Onaylı Rolünün Tanımlı Olduğundan Emin Ol
  if (onayli) {
    const channels = await guild.channels.fetch();
    for (const [, ch] of channels) {
      if (!ch || ch.isThread()) continue;
      const isLocked = ['kurallar', 'duyurular', 'seviye-rol-bilgi', 'kayit-onay', 'cinsiyet-secimi', 'yetkili', 'mod-log', 'kayit-log'].some(
        (n) => ch.name.includes(n)
      );

      if (!isLocked) {
        try {
          await ch.permissionOverwrites.edit(onayli.id, {
            ViewChannel: true,
            SendMessages: ch.isTextBased(),
            Connect: ch.isVoiceBased(),
            Speak: ch.isVoiceBased(),
          });
        } catch (e) {}
      }
    }
  }

  // 5. Sunucu Sahibine 'Kurucu' Rolünü Tekrar Doğrula
  try {
    const ownerMember = await guild.members.fetch(guild.ownerId);
    if (ownerMember && kurucu) {
      await ownerMember.roles.add(kurucu);
      console.log(`👑 Kurucu rolü (${ownerMember.user.tag}) doğrulandı.`);
    }
  } catch (e) {}

  console.log('🎉 TÜM ROLLERDEN EMOJİLER SİLİNDİ VE ÜYE HİYERARŞİSİ KUSURSUZ AYARLANDI!');
  client.destroy();
}

cleanRoles().catch(console.error);
