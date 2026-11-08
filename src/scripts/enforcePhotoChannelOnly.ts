import { Client, GatewayIntentBits, PermissionFlagsBits, TextChannel } from 'discord.js';
import * as dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once('clientReady', async () => {
  try {
    const guild = await client.guilds.fetch('1568618183223414934');
    console.log(`Sunucu: ${guild.name}`);

    const roles = await guild.roles.fetch();
    const everyoneRole = guild.roles.everyone;
    const uyeRole = roles.find(r => r.name === 'Üye');
    const onayliRole = roles.find(r => r.name.toLowerCase() === 'onaylı' || r.name.includes('Onaylı'));

    // Seviye rolleri
    const levelRoles = roles.filter(r => r.name.includes('Level '));

    const targetRoles = [everyoneRole, uyeRole, onayliRole, ...levelRoles.values()].filter(Boolean);
    console.log(`Hedef rol sayısı: ${targetRoles.length}`);

    const channels = await guild.channels.fetch();

    for (const [, channel] of channels) {
      if (!channel || !channel.isTextBased() || channel.isThread() || channel.isVoiceBased()) continue;

      const tc = channel as TextChannel;
      const chName = tc.name.toLowerCase();

      // Fotoğraf kanalı: #foto-medya
      if (chName.includes('foto-medya')) {
        console.log(`\n📸 [FOTOĞRAF KANALI] #${tc.name} -> Fotoğraf izni AÇILIYOR.`);
        for (const role of targetRoles) {
          if (!role) continue;
          await tc.permissionOverwrites.edit(role.id, {
            AttachFiles: true,
            EmbedLinks: true,
          }, { reason: 'Fotoğraf kanalı için medya izni açıldı' }).catch(() => {});
        }
        console.log(`  ✅ #${tc.name} kanalında fotoğraf paylaşımı serbest bırakıldı.`);
      } else {
        // Fotoğraf kanalı dışındaki tüm kanallar (ticket hariç): AttachFiles KAPATILIR
        if (chName.startsWith('bilet-') || chName.startsWith('ticket-')) continue;

        console.log(`🔒 #${tc.name} -> Fotoğraf izni KAPATILIYOR.`);
        for (const role of targetRoles) {
          if (!role) continue;
          await tc.permissionOverwrites.edit(role.id, {
            AttachFiles: false,
          }, { reason: 'Fotoğraf paylaşımı sadece #foto-medya kanalına sınırlandırıldı' }).catch(() => {});
        }
        console.log(`  ✅ #${tc.name} kanalında fotoğraf atma kapatıldı.`);
      }
    }

    console.log('\n🎉 TÜM KANALLARDA FOTOĞRAF İZİNLERİ KİLİTLENDİ!');
    console.log('Artık sadece #📸・foto-medya kanalında fotoğraf atılabilir.');
  } catch (err: any) {
    console.error('Hata:', err.message);
  } finally {
    process.exit(0);
  }
});

client.login(process.env.DISCORD_TOKEN);
