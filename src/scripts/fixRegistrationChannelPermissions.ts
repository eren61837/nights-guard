import dotenv from 'dotenv';
dotenv.config();

import { Client, GatewayIntentBits, PermissionFlagsBits } from 'discord.js';
import { config } from '../config';

const TARGET_GUILD_ID = '1568618183223414934';

async function main() {
  console.log('🔒 Kayıt kanalı izinleri güçlendiriliyor...');

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  });

  await client.login(config.discordToken);

  const guild = await client.guilds.fetch({ guild: TARGET_GUILD_ID, force: true });
  const channels = await guild.channels.fetch();
  const roles = await guild.roles.fetch();

  const everyoneRole = guild.roles.everyone;
  const waitingRole = roles.find((r) => r.name.includes('Kayıt Bekleyen'));
  const onayliRole = roles.find((r) => r.name === 'Onaylı');
  const uyeRole = roles.find((r) => r.name === 'Üye');
  const erkekRole = roles.find((r) => r.name === 'Erkek');
  const kizRole = roles.find((r) => r.name === 'Kız');

  const chCinsiyet = channels.find((c) => c && c.name.includes('cinsiyet-secimi'));
  const chKayitOnay = channels.find((c) => c && c.name.includes('kayit-onay'));

  // 1. #cinsiyet-secimi kanalı izinleri:
  // - @everyone: GÖREMEZ
  // - Kayıt Bekleyen: GÖRÜR (Butona tıklar)
  // - Onaylı, Üye, Erkek, Kız: KESİNLİKLE GÖREMEZ!
  if (chCinsiyet) {
    await chCinsiyet.permissionOverwrites.edit(everyoneRole.id, {
      ViewChannel: false,
      SendMessages: false,
    });
    if (waitingRole) {
      await chCinsiyet.permissionOverwrites.edit(waitingRole.id, {
        ViewChannel: true,
        SendMessages: false,
        ReadMessageHistory: true,
      });
    }
    const registeredRoles = [onayliRole, uyeRole, erkekRole, kizRole];
    for (const r of registeredRoles) {
      if (r) {
        await chCinsiyet.permissionOverwrites.edit(r.id, {
          ViewChannel: false, // Kayıt olanlar ASLA göremez!
          SendMessages: false,
        });
      }
    }
    console.log('  ✅ #cinsiyet-secimi izinleri kilitlendi (Kayıtlı üyelere kapatıldı)!');
  }

  // 2. #kayit-onay kanalı izinleri:
  // - @everyone: GÖRÜR (İlk gelen burayı görür)
  // - Kayıt Bekleyen: GÖREMEZ (Cinsiyet seçimine geçtiği an burası kaybolur)
  // - Onaylı, Üye, Erkek, Kız: GÖREMEZ (Kayıt bittiğinde gizlenir)
  if (chKayitOnay) {
    await chKayitOnay.permissionOverwrites.edit(everyoneRole.id, {
      ViewChannel: true,
      SendMessages: false,
      ReadMessageHistory: true,
    });
    if (waitingRole) {
      await chKayitOnay.permissionOverwrites.edit(waitingRole.id, {
        ViewChannel: false,
      });
    }
    const registeredRoles = [onayliRole, uyeRole, erkekRole, kizRole];
    for (const r of registeredRoles) {
      if (r) {
        await chKayitOnay.permissionOverwrites.edit(r.id, {
          ViewChannel: false,
          SendMessages: false,
        });
      }
    }
    console.log('  ✅ #kayit-onay izinleri kilitlendi!');
  }

  // 3. Kullanıcı erengaliba42 üzerindeki rolleri güncelle (Kayıt Bekleyen'i al, Onaylı + Üye + Erkek ver)
  const ownerMember = await guild.members.fetch('1138498666785677492');
  if (ownerMember) {
    if (waitingRole && ownerMember.roles.cache.has(waitingRole.id)) {
      await ownerMember.roles.remove(waitingRole);
      console.log('  ✅ Sahip üzerindeki "Kayıt Bekleyen" rolü kaldırıldı!');
    }
    const rolesToGive = [onayliRole, uyeRole, erkekRole].filter(Boolean) as any[];
    await ownerMember.roles.add(rolesToGive);
    console.log('  ✅ Sahip üzerine Onaylı, Üye ve Erkek rolleri verildi!');
  }

  console.log('\n🎉 Kayıt kanalı görünürlük ayarları başarıyla tamamlandı!');
  client.destroy();
}

main().catch(console.error);
