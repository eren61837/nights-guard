import { Client, GatewayIntentBits, PermissionFlagsBits } from 'discord.js';
import { config } from '../config';

async function applySecurity() {
  console.log('🔒 Sunucu güvenlik kilitleri ve yavaş mod uygulanıyor...');

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  await client.login(config.discordToken);

  const guild = await client.guilds.fetch('1568618183223414934');
  if (!guild) {
    console.error('Sunucu bulunamadı!');
    process.exit(1);
  }

  const roles = await guild.roles.fetch();
  const everyoneRoleId = guild.id;
  const approvedRole = roles.find((r) => r.name.includes('Onaylı Üye'));

  console.log(`Roles loaded. Everyone ID: ${everyoneRoleId}, Approved Role ID: ${approvedRole?.id}`);

  const channels = await guild.channels.fetch();

  for (const [, ch] of channels) {
    if (!ch || !ch.isTextBased() || ch.isThread()) continue;

    const isLockedChannel = ['kurallar', 'duyurular', 'seviye-rol-bilgi', 'kayit-onay', 'cinsiyet-secimi'].some((name) =>
      ch.name.includes(name)
    );

    // Yavaş mod süreleri (saniye)
    let slowmode = 0;
    if (ch.name.includes('genel-sohbet')) slowmode = 3;
    else if (ch.name.includes('foto-medya')) slowmode = 10;
    else if (ch.name.includes('oyun-arkadasi-bul')) slowmode = 15;
    else if (ch.name.includes('bot-komut')) slowmode = 5;
    else if (ch.name.includes('kelime-oyunu')) slowmode = 5;
    else if (ch.name.includes('valorant') || ch.name.includes('cs2') || ch.name.includes('league-of-legends')) slowmode = 5;

    try {
      // 1. Yavaş modu ayarla
      await ch.edit({
        rateLimitPerUser: slowmode,
      });

      // 2. Kilitli Bilgilendirme Kanalları (Yazma + Thread + Reaksiyon + Mention Engelli)
      if (isLockedChannel) {
        await ch.permissionOverwrites.edit(everyoneRoleId, {
          SendMessages: false,
          CreatePublicThreads: false,
          CreatePrivateThreads: false,
          SendMessagesInThreads: false,
          MentionEveryone: false,
        });

        if (approvedRole) {
          await ch.permissionOverwrites.edit(approvedRole.id, {
            SendMessages: false,
            CreatePublicThreads: false,
            CreatePrivateThreads: false,
            SendMessagesInThreads: false,
            MentionEveryone: false,
            ViewChannel: !ch.name.includes('kayit-onay') && !ch.name.includes('cinsiyet-secimi'),
          });
        }
      } else {
        // 3. Sohbet / Oyun Kanalları (Mesaj yazabilir, ama ALT BAŞLIK (THREAD) ve EVERYONE PING KESİNLİKLE KAPALI)
        await ch.permissionOverwrites.edit(everyoneRoleId, {
          CreatePublicThreads: false,
          CreatePrivateThreads: false,
          SendMessagesInThreads: false,
          MentionEveryone: false,
        });

        if (approvedRole) {
          await ch.permissionOverwrites.edit(approvedRole.id, {
            CreatePublicThreads: false,
            CreatePrivateThreads: false,
            SendMessagesInThreads: false,
            MentionEveryone: false,
          });
        }
      }
      console.log(`✅ [${ch.name}] Kilitler ve Yavaş Mod (${slowmode}s) uygulandı.`);
    } catch (err: any) {
      console.warn(`⚠️ [${ch.name}] Hata:`, err.message);
    }

    await new Promise((r) => setTimeout(r, 200));
  }

  console.log('🎉 TÜM KANALLARIN GÜVENLİK KİLİTLERİ VE YAVAŞ MODLARI BAŞARIYLA AYARLANDI!');
  client.destroy();
}

applySecurity().catch(console.error);
