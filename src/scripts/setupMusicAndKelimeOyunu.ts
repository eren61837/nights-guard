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
import { config } from '../config';
import { KelimeOyunuManager } from '../services/features/kelimeOyunu';
import { MusicPlayer } from '../services/features/musicPlayer';

const TARGET_GUILD_ID = '1568618183223414934'; // Prayt

async function setupMusicAndGames() {
  console.log('🚀 Müzik Kategorisi, Kelime Oyunu ve Rol Bilgi Panelleri Kuruluyor...');

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages],
  });
  await client.login(config.discordToken);

  const guild = await client.guilds.fetch(TARGET_GUILD_ID);
  if (!guild) {
    console.error('Sunucu bulunamadı!');
    process.exit(1);
  }

  const channels = await guild.channels.fetch();
  const roles = await guild.roles.fetch();
  const everyoneRoleId = guild.id;
  const approvedRole = roles.find((r) => r.name === 'Onaylı');

  // 1. Fazla oyun kanallarını sil (Sadece kelime-oyunu kalacak)
  console.log('🧹 Fazla oyun kanalları temizleniyor (Sadece kelime oyunu kalacak)...');
  const deleteChannels = ['tuttumu-tutmadi', 'sayi-saymaca', 'spotify-paylasim', 'Müzik Dinleme', 'Yayın & Dizi İzleme', 'AFK & Müzik'];
  for (const [, ch] of channels) {
    if (ch && deleteChannels.some((d) => ch.name.includes(d))) {
      try {
        await ch.delete();
        console.log(`  -> Silindi: ${ch.name}`);
        await new Promise((r) => setTimeout(r, 200));
      } catch (e: any) {
        console.warn(`Silinemedi (${ch.name}):`, e.message);
      }
    }
  }

  // 2. #seviye-rol-bilgi Kanalını Doldur
  console.log('⭐ #seviye-rol-bilgi kanalı dolduruluyor...');
  const chRolBilgi = channels.find((c) => c && c.name.includes('seviye-rol-bilgi') && c.isTextBased());
  if (chRolBilgi && chRolBilgi.isTextBased()) {
    try {
      const msgs = await (chRolBilgi as any).messages.fetch({ limit: 10 });
      for (const [, m] of msgs) await m.delete();
    } catch (e) {}

    const rolBilgiEmbed = new EmbedBuilder()
      .setTitle('⭐ PRAYT SEVİYE & ROL BİLGİLENDİRME REHBERİ 📜')
      .setDescription(
        'Sunucumuzda üyelerimize verilen roller, rütbeler ve ayrıcalıkların detaylı açıklaması aşağıda yer almaktadır:\n\n' +
        '👑 **Kurucu:** Sunucunun tek sahibi ve kurucu lideri.\n' +
        '⚔️ **Yönetici:** Sunucu ayarlarını, güvenliği ve botları denetleyen üst düzey kadro.\n' +
        '🔨 **Moderatör:** Sohbet asayişini sağlayan, kuralları uygulayan moderasyon ekibi.\n' +
        '💎 **VIP:** Sunucuya takviye (boost) basan veya büyük etkinlikleri kazanan özel üyeler.\n' +
        '🟣 **Üye:** Sunucumuza kayıt olmuş tüm onaylı kullanıcıların ana görünür rolüdür. Sağ taraftaki üye listesinde tek ve şık bir "Üye" başlığı altında görünürsünüz.\n' +
        '👦 **Erkek & 👧 Kız:** Kayıt sırasında seçtiğiniz hitap ve cinsiyet rolleridir.\n' +
        '🔑 **Onaylı:** Kanalları görmenizi ve mesaj yazmanızı sağlayan güvenlik alt rolüdür.\n' +
        '⏳ **Kayıt Bekleyen:** Sunucuya yeni girmiş ve kayıt sürecinde olan üyelerdir.\n' +
        '🔇 **Cezalı:** Kurallara uymadığı için susturulan ve kanallara erişimi kısıtlanan üyelerdir.\n\n' +
        '### 🚀 Nasıl Rol ve Seviye Atlanır?\n' +
        '• **Sohbette Aktif Ol:** Kanallarda sohbet ederek XP kazanın.\n' +
        '• **Ses Odalarında Takıl:** Arkadaşlarınızla oyun oynayıp ses odalarında süre biriktirin.\n' +
        '• **Click Me ve Çekilişlere Katıl:** `#🎯・click-me` kanalındaki 30 tıklama etkinliklerine basarak sürpriz VIP roller kazanın!'
      )
      .setImage('https://media.giphy.com/media/26tn3334mvoVClhos/giphy.gif')
      .setColor('#A855F7')
      .setFooter({ text: 'Prayt Guard • Rol ve Seviye Sistemi • Made by erencix' });

    await (chRolBilgi as any).send({ embeds: [rolBilgiEmbed] });
    console.log('✅ #seviye-rol-bilgi başarıyla dolduruldu!');
  }

  // 3. #kelime-oyunu Kanalına Başlangıç Paneli Gönder
  console.log('🧩 #kelime-oyunu kanalı başlatılıyor...');
  const chKelime = channels.find((c) => c && c.name.includes('kelime-oyunu') && c.isTextBased());
  if (chKelime && chKelime.isTextBased()) {
    try {
      const msgs = await (chKelime as any).messages.fetch({ limit: 10 });
      for (const [, m] of msgs) await m.delete();
    } catch (e) {}

    await (chKelime as any).send({ embeds: [KelimeOyunuManager.getInitialEmbed()] });
    console.log('✅ #kelime-oyunu başlangıç paneli gönderildi!');
  }

  // 4. Ayrı Müzik Kategorisi ve Odaları Oluştur
  console.log('🎵 Müzik Kategorisi ve Odaları inşa ediliyor...');
  let catMusic = channels.find((c) => c?.type === ChannelType.GuildCategory && c.name.includes('MÜZİK ALANI'));
  if (!catMusic) {
    catMusic = await guild.channels.create({
      name: '🎵 ┃ MÜZİK ALANI',
      type: ChannelType.GuildCategory,
      permissionOverwrites: [
        { id: everyoneRoleId, deny: [PermissionFlagsBits.ViewChannel] },
        ...(approvedRole
          ? [
              {
                id: approvedRole.id,
                allow: [
                  PermissionFlagsBits.ViewChannel,
                  PermissionFlagsBits.SendMessages,
                  PermissionFlagsBits.Connect,
                  PermissionFlagsBits.Speak,
                ],
              },
            ]
          : []),
      ],
    });
  }

  // Müzik Metin & Kontrol Kanalı
  const chMuzikKomut = await guild.channels.create({
    name: '🎵・muzik-komut',
    type: ChannelType.GuildText,
    parent: catMusic.id,
    topic: 'Prayt 7/24 Kesintisiz Müzik Çalar & Kontrol Paneli',
    permissionOverwrites: [
      { id: everyoneRoleId, deny: [PermissionFlagsBits.ViewChannel] },
      ...(approvedRole
        ? [
            {
              id: approvedRole.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
              ],
              deny: [
                PermissionFlagsBits.CreatePublicThreads,
                PermissionFlagsBits.CreatePrivateThreads,
                PermissionFlagsBits.SendMessagesInThreads,
              ],
            },
          ]
        : []),
    ],
  });

  // Müzik Ses Kanalları
  await guild.channels.create({
    name: '🔊・Müzik Odası 1',
    type: ChannelType.GuildVoice,
    parent: catMusic.id,
  });

  await guild.channels.create({
    name: '🔊・Müzik Odası 2',
    type: ChannelType.GuildVoice,
    parent: catMusic.id,
  });

  await guild.channels.create({
    name: '🎧・Lo-Fi & Chill 7/24',
    type: ChannelType.GuildVoice,
    parent: catMusic.id,
  });

  // Müzik Kontrol Panelini Gönder
  await chMuzikKomut.send({
    embeds: [MusicPlayer.getMusicPanelEmbed()],
    components: [MusicPlayer.getMusicControls()],
  });
  console.log('✅ Müzik paneli ve butonları başarıyla gönderildi!');

  console.log('🎉 TÜM YENİ SİSTEMLER VE KANALLAR BAŞARIYLA KURULDU!');
  client.destroy();
}

setupMusicAndGames().catch(console.error);
