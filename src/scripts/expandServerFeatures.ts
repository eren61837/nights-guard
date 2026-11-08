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

async function expandFeatures() {
  console.log('🚀 Sunucu Özellikleri Genişletiliyor & Mor Logo Yükleniyor...');

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  await client.login(config.discordToken);

  const guild = await client.guilds.fetch(TARGET_GUILD_ID);
  if (!guild) {
    console.error('Sunucu bulunamadı!');
    process.exit(1);
  }

  // 1. Yeni Özgün Mor Logoyu Sunucuya Yükle
  const logoPath = path.resolve('c:/Users/dell/Desktop/prayt_guard_pp.png');
  if (fs.existsSync(logoPath)) {
    try {
      const logoBuffer = fs.readFileSync(logoPath);
      await guild.setIcon(logoBuffer);
      console.log('💜 YENİ ÖZGÜN MOR LOGO BAŞARIYLA SUNUCUYA YÜKLENDİ!');
    } catch (e: any) {
      console.warn('Logo yüklenirken hata:', e.message);
    }
  }

  const channels = await guild.channels.fetch();
  const roles = await guild.roles.fetch();
  const everyoneRoleId = guild.id;
  const approvedRole = roles.find((r) => r.name.includes('Onaylı Üye'));

  // Kategorileri Bul
  const voiceCat = channels.find((c) => c?.type === ChannelType.GuildCategory && c.name.includes('SES ODALARI'));
  const chatCat = channels.find((c) => c?.type === ChannelType.GuildCategory && c.name.includes('TOPLULUK'));

  // 2. Yeni Ses Odalarını Oluştur
  console.log('🔊 Daha fazla ses kanalı oluşturuluyor...');
  const newVoiceChannels = [
    { name: '🔊・Sohbet Odası 3', limit: 0 },
    { name: '🎮・Duo 1 (2 Kişilik)', limit: 2 },
    { name: '🎮・Duo 2 (2 Kişilik)', limit: 2 },
    { name: '🎮・Trio (3 Kişilik)', limit: 3 },
    { name: '🎮・Squad (4 Kişilik)', limit: 4 },
    { name: '🎮・Valorant 5v5', limit: 5 },
    { name: '🎮・CS2 Rekabetçi', limit: 5 },
    { name: '🎵・Müzik Dinleme', limit: 0 },
    { name: '🎬・Yayın & Dizi İzleme', limit: 15 },
  ];

  for (const vDef of newVoiceChannels) {
    const existing = channels.find((c) => c?.name === vDef.name);
    if (!existing) {
      try {
        await guild.channels.create({
          name: vDef.name,
          type: ChannelType.GuildVoice,
          parent: voiceCat ? voiceCat.id : undefined,
          userLimit: vDef.limit,
          permissionOverwrites: [
            { id: everyoneRoleId, deny: [PermissionFlagsBits.ViewChannel] },
            ...(approvedRole
              ? [
                  {
                    id: approvedRole.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
                  },
                ]
              : []),
          ],
        });
        console.log(`  -> Ses Kanalı Eklendi: ${vDef.name}`);
        await new Promise((r) => setTimeout(r, 200));
      } catch (err: any) {
        console.warn(`Ses kanalı açılamadı (${vDef.name}):`, err.message);
      }
    }
  }

  // 3. Eğlence ve Click Me Kanallarını Oluştur
  console.log('💬 Topluluk & Click Me kanalları ekleniyor...');
  const newTextChannels = [
    { name: '🎯・click-me', slowmode: 0, topic: '30 Tıklama Büyük Eventi Odası!' },
    { name: '🎲・tuttumu-tutmadi', slowmode: 5, topic: 'Tuttu mu Tutmadı mı Oyunu' },
    { name: '🔢・sayi-saymaca', slowmode: 3, topic: 'Sırayla Sayı Sayma Oyunu' },
    { name: '🎵・spotify-paylasim', slowmode: 5, topic: 'Sevdiğin şarkıları ve listeleri paylaş' },
  ];

  for (const tDef of newTextChannels) {
    let ch = channels.find((c) => c?.name === tDef.name);
    if (!ch) {
      try {
        ch = await guild.channels.create({
          name: tDef.name,
          type: ChannelType.GuildText,
          parent: chatCat ? chatCat.id : undefined,
          rateLimitPerUser: tDef.slowmode,
          topic: tDef.topic,
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
                      PermissionFlagsBits.MentionEveryone,
                    ],
                  },
                ]
              : []),
          ],
        });
        console.log(`  -> Metin Kanalı Eklendi: ${tDef.name}`);
        await new Promise((r) => setTimeout(r, 200));
      } catch (err: any) {
        console.warn(`Metin kanalı açılamadı (${tDef.name}):`, err.message);
      }
    }

    // 4. Click Me Event Panelini Gönder
    if (tDef.name.includes('click-me') && ch && ch.isTextBased()) {
      const messages = await (ch as any).messages.fetch({ limit: 5 });
      if (messages.size === 0) {
        const clickEmbed = new EmbedBuilder()
          .setTitle('🎁 30 TIKLAMA BÜYÜK EVENTİ! 🔥')
          .setDescription(
            `Hey @everyone! Sunucumuzda büyük sürpriz event için tıklama etkinliği aktif!\n\n` +
              `Aşağıdaki **[🔥 TIKLA]** butonuna basarak sayacı artırın.\n` +
              `Hedef **30 Tıklama** tamamlandığında büyük sunucu çekilişi ve VIP rol ödülü otomatik açılacaktır!\n\n` +
              `📊 **İlerleme:** \`[░░░░░░░░░░] 0 / 30 Tıklama (%0)\`\n\n` +
              `🔥 *Herkes bir kez tıklayabilir. Arkadaşlarını davet et!*`
          )
          .setImage('https://media.giphy.com/media/26tn3334mvoVClhos/giphy.gif')
          .setColor('#E67E22')
          .setFooter({ text: 'Prayt Community Event • Made by erencix' });

        const clickRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId('btn_event_click')
            .setLabel('🔥 TIKLA! (0/30)')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🔥')
        );

        await (ch as any).send({
          embeds: [clickEmbed],
          components: [clickRow],
        });
        console.log('🎯 Click Me Event Paneli başarıyla gönderildi!');
      }
    }
  }

  console.log('🎉 TÜM GELİŞMİŞ ÖZELLİKLER VE SES KANALLARI BAŞARIYLA EKLENDİ!');
  client.destroy();
}

expandFeatures().catch(console.error);
