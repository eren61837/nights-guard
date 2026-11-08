import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  TextChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import axios from 'axios';
import { config } from '../config';

const TARGET_GUILD_ID = '1568618183223414934';

const GIF_NEON_AESTHETIC = 'https://media.giphy.com/media/26tn3334mvoVClhos/giphy.gif';
const GIF_ANIME_STARS =
  'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZqOHo0bTJ5eWpkaWZ1Z29reTFrMmtnOGUza2Q1bDJqZ214NnB3dyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/L1R1tvI9svkIWwpVYr/giphy.gif';
const GIF_CYBER_STUDIO = 'https://media.giphy.com/media/ErZ8hv5eO92JW/giphy.gif';
const GIF_MUSIC_CHILL = 'https://media.giphy.com/media/EPfV3ijMQVl60/giphy.gif';

const EXTRA_GIF_EMOJIS = [
  { name: 'Loki_Appear', url: 'https://cdn3.emoji.gg/emojis/1895-lokiappeardisappear.gif' },
  { name: 'Minecraft_Sword', url: 'https://cdn3.emoji.gg/emojis/554979-coppersword.gif' },
  { name: 'Ghost_Dance', url: 'https://cdn3.emoji.gg/emojis/608938-cute-ghost.gif' },
  { name: 'Mad_Rage', url: 'https://cdn3.emoji.gg/emojis/616175-mad.gif' },
  { name: 'Caterpillar_Spin', url: 'https://cdn3.emoji.gg/emojis/102065-caterpillarspin.gif' },
  { name: 'Diamond_Armor', url: 'https://cdn3.emoji.gg/emojis/490211-chainmailchestplate.gif' },
  { name: 'Milk_Bucket', url: 'https://cdn3.emoji.gg/emojis/527084-milkbucket.gif' },
];

async function main() {
  console.log('🎬 Eski ve Yeni Tüm GIF\'ler Sunucu Panellerine & Emojilere Yükleniyor...');

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildEmojisAndStickers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMembers,
    ],
  });

  client.once('clientReady', async () => {
    try {
      const guild = await client.guilds.fetch(TARGET_GUILD_ID);
      const channels = await guild.channels.fetch();
      const roles = await guild.roles.fetch();

      const role5 = roles.find((r) => r.name.includes('Level 5'));
      const role10 = roles.find((r) => r.name.includes('Level 10'));
      const role20 = roles.find((r) => r.name.includes('Level 20'));
      const role30 = roles.find((r) => r.name.includes('Level 30'));
      const role50 = roles.find((r) => r.name.includes('Level 50'));

      // Helper function to replace bot's existing message with new embed + GIF
      const updateChannelWithGif = async (
        chIdOrName: string,
        embed: EmbedBuilder,
        components?: ActionRowBuilder<ButtonBuilder>[]
      ) => {
        let ch = channels.get(chIdOrName) as TextChannel;
        if (!ch) {
          ch = channels.find((c) => c && c.name.includes(chIdOrName) && c.isTextBased()) as TextChannel;
        }
        if (!ch || !ch.isTextBased()) return;

        try {
          const msgs = await ch.messages.fetch({ limit: 10 });
          for (const m of msgs.values()) {
            if (m.author.id === client.user?.id) await m.delete().catch(() => {});
          }
          await ch.send({ embeds: [embed], components: components || [] });
          console.log(`✅ #${ch.name} kanalı GIF banner ile güncellendi!`);
        } catch (e: any) {
          console.warn(`Hata (#${chIdOrName}):`, e.message);
        }
      };

      // 1. #🛡️・kayit-onay (Kayıt Kapısı GIF)
      const kayitEmbed = new EmbedBuilder()
        .setTitle('🛡️ NIGHTS GÜVENLİK & KAYIT SİSTEMİ')
        .setDescription(
          '**Nights** topluluğuna hoş geldiniz!\n\n' +
          'Sunucumuzun güvenliğini sağlamak ve bot hesapları engellemek amacıyla kayıt sistemi aktiftir.\n\n' +
          '📌 **Nasıl Kayıt Olunur?**\n' +
          'Aşağıdaki **"✅ Kayıt Ol"** butonuna basarak adınızı ve yaşınızı girin. Kaydınız anında onaylanacak ve sunucunun tüm kanalları erişiminize açılacaktır.\n\n' +
          '> ⚠️ *Topluluk kurallarını ihlal eden uygunsuz isimler sistem tarafından otomatik reddedilir.*'
        )
        .setImage(GIF_NEON_AESTHETIC)
        .setColor('#2ECC71')
        .setFooter({ text: 'Nights Otomatik Kayıt Sistemi • Made by erencix' })
        .setTimestamp();

      const kayitRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('btn_kayit_basla').setLabel('Kayıt Ol').setEmoji('✅').setStyle(ButtonStyle.Success)
      );
      await updateChannelWithGif('kayit-onay', kayitEmbed, [kayitRow]);

      // 2. #🚻・cinsiyet-secimi (Anime Stars GIF)
      const cinsiyetEmbed = new EmbedBuilder()
        .setTitle('🚻 NIGHTS CİNSİYET ROLÜ SEÇİMİ')
        .setDescription(
          'Aşağıdaki butonlara tıklayarak profiliniz için uygun cinsiyet rolünü anında alabilirsiniz.\n\n' +
          '👦 **Erkek Rolü:** Mavi profil rengi ve unvanı verir.\n' +
          '👧 **Kız Rolü:** Pembe profil rengi ve unvanı verir.\n\n' +
          '> 💡 *Rolünüzü dilediğiniz zaman butona tekrar basarak değiştirebilirsiniz.*'
        )
        .setImage(GIF_ANIME_STARS)
        .setColor('#9B59B6')
        .setFooter({ text: 'Nights Rol Yönetimi • Made by erencix' })
        .setTimestamp();

      const cinsiyetRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('btn_cinsiyet_erkek').setLabel('Erkek').setEmoji('👦').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('btn_cinsiyet_kiz').setLabel('Kız').setEmoji('👧').setStyle(ButtonStyle.Danger)
      );
      await updateChannelWithGif('cinsiyet-secimi', cinsiyetEmbed, [cinsiyetRow]);

      // 3. #⭐・seviye-rol-bilgi (Neon GIF)
      const levelEmbed = new EmbedBuilder()
        .setTitle('⭐ NIGHTS SEVİYE & ROL BİLGİLENDİRME SİSTEMİ 🏆')
        .setDescription(
          '**Nights** sunucumuzda metin kanallarında sohbet ettikçe otomatik olarak **XP** kazanır, seviyenizi yükseltir ve özel unvan rollerinin kilidini açarsınız!\n\n' +
          '### 🎖️ Seviye Rolleri ve Ayrıcalıkları:\n' +
          `• 🥉 **Level 5:** ${role5 ? `<@&${role5.id}>` : '`Çaylak`'}\n` +
          '  └ *Bronz isim rengi, görsel & bağlantı paylaşma ve harici emoji ayrıcalığı.*\n\n' +
          `• 🥈 **Level 10:** ${role10 ? `<@&${role10.id}>` : '`Aktif Üye`'}\n` +
          '  └ *Gümüş isim rengi, aktif sohbetçi statüsü ve özel sunucu çekilişlerine katılım önceliği.*\n\n' +
          `• 🥇 **Level 20:** ${role20 ? `<@&${role20.id}>` : '`Kıdemli`'}\n` +
          '  └ *Altın sarısı parıldayan isim rengi, özel ses kanalı limit/bitrate kontrol avantajları.*\n\n' +
          `• 💎 **Level 30:** ${role30 ? `<@&${role30.id}>` : '`Elmas`'}\n` +
          '  └ *Elmas mavi isim rengi, VIP oda erişimleri ve özel ses etkinlik yetkisi.*\n\n' +
          `• 👑 **Level 50:** ${role50 ? `<@&${role50.id}>` : '`Efsane`'}\n` +
          '  └ *Efsane mor isim rengi, Nights sunucusunun en seçkin üyeleri arasına girme ve taht statüsü!*\n\n' +
          '### ⚡ Komutlar:\n' +
          '• `/rank [kullanıcı]` veya `!rank` — Kendi seviye kartınızı, mevcut XP ve ilerlemenizi gösterir.\n' +
          '• `/top` veya `!top` — Canlı aktiflik liderlik tablosu.\n\n' +
          '> 💡 **Nasıl XP Kazanılır?**\n' +
          '> *Metin kanallarında her 60 saniyede bir attığınız anlamlı mesajlar size 15-25 XP kazandırır.*'
        )
        .setImage(GIF_NEON_AESTHETIC)
        .setColor('#6C5CE7')
        .setFooter({ text: 'Nights Community Rewards • Made by erencix' })
        .setTimestamp();
      await updateChannelWithGif('1568644559615954964', levelEmbed);

      // 4. #🎛️・ses-paneli (Cyber Studio GIF)
      const voiceEmbed = new EmbedBuilder()
        .setTitle('🎛️ NIGHTS SES KONTROL STÜDYOSU 🎙️')
        .setDescription(
          'Aşağıdaki butonları kullanarak size ait özel dinamik ses kanalını profesyonelce yönetin.\n\n' +
          '🔒 **Odayı Kilitle:** Kanalı siz ve odadakiler dışındaki herkese kapatır.\n' +
          '🔓 **Kilidi Aç:** Odayı tekrar sunucu üyelerinin girişine açar.\n' +
          '👁️ **Odayı Gizle/Göster:** Kanalı diğer üyelerden gizler veya görünür yapar.\n' +
          '👥 **Kullanıcı Limiti:** Ses kanalına girebilecek kişi sınırını ayarlar.\n' +
          '✏️ **Oda İsmi Değiştir:** Kanalınızın adını istediğiniz gibi özelleştirin.\n' +
          '🔇 **Oda Susturma:** Odadaki diğer kullanıcıların mikrofonunu yönetin.\n' +
          '⚡ **Bitrate Artır:** Ses kalitesini sunucu maksimumuna yükseltir.\n' +
          '👑 **Odayı Sahiplen:** Sahibi çıkmış bir odanın yönetimini devralın.\n' +
          'ℹ️ **Oda Bilgisi:** Mevcut odanın teknik ve yetki detaylarını gösterir.\n' +
          '➕ **Yeni Oda Oluştur:** Sizin adınıza anında yeni bir geçici ses kanalı kurar.'
        )
        .setImage(GIF_CYBER_STUDIO)
        .setColor('#0984E3')
        .setFooter({ text: 'Nights Ses Odaları • Made by erencix' })
        .setTimestamp();

      const voiceRow1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('btn_voice_lock').setLabel('Kilitle').setEmoji('🔒').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('btn_voice_unlock').setLabel('Aç').setEmoji('🔓').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('btn_voice_hide').setLabel('Gizle/Göster').setEmoji('👁️').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('btn_voice_limit').setLabel('Limit').setEmoji('👥').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('btn_voice_rename').setLabel('İsim Değiştir').setEmoji('✏️').setStyle(ButtonStyle.Primary)
      );

      const voiceRow2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('btn_voice_mute').setLabel('Sustur').setEmoji('🔇').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('btn_voice_bitrate').setLabel('Bitrate').setEmoji('⚡').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('btn_voice_claim').setLabel('Sahiplen').setEmoji('👑').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('btn_voice_info').setLabel('Oda Bilgisi').setEmoji('ℹ️').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('btn_voice_create').setLabel('Yeni Oda').setEmoji('➕').setStyle(ButtonStyle.Success)
      );
      await updateChannelWithGif('1568654013405204701', voiceEmbed, [voiceRow1, voiceRow2]);

      // 5. #📜・kurallar (Neon GIF)
      const rulesEmbed = new EmbedBuilder()
        .setTitle('📜 NIGHTS TOPLULUK KURALLARI')
        .setDescription(
          '**Nights** sunucumuza hoş geldiniz! Topluluğumuzda herkesin keyifli ve güvenli vakit geçirmesi için aşağıdaki kurallara uyulması zorunludur:\n\n' +
          '**1. Karşılıklı Saygı ve Nezaket**\n' +
          '> Üyelere ve yetkililere karşı hakaret, küfür, taciz, ırkçılık veya nefret söylemi kesinlikle yasaktır.\n\n' +
          '**2. Reklam ve Tanıtım Yasağı**\n' +
          '> Sunucu içi veya DM üzerinden izinsiz sunucu, link ya da ürün reklamı yapmak kalıcı ban sebebidir.\n\n' +
          '**3. Spam, Flood ve Alt Başlık (Thread) Suistimali**\n' +
          '> Sohbeti kilitleyecek şekilde anlamsız flood, gereksiz alt başlık açma veya toplu etiketleme (@everyone/@here) yasaktır.\n\n' +
          '**4. NSFW ve Uygunsuz İçerik**\n' +
          '> Cinsel, şiddet içeren veya yasa dışı hiçbir görsel/bağlantı paylaşılamaz.\n\n' +
          '**5. Ses Kanalları Düzeni**\n' +
          '> Ses kanallarında bas açmak, kulak tırmalayıcı sesler çıkarmak veya kullanıcıları rahatsız etmek yasaktır.\n\n' +
          '🛡️ *Nights Guard sistemi ve yetkili kadromuz sunucu düzenini 7/24 aktif olarak denetlemektedir.*'
        )
        .setImage(GIF_NEON_AESTHETIC)
        .setColor('#2C3E50')
        .setFooter({ text: 'Nights Discord Topluluğu • Made by erencix' })
        .setTimestamp();
      await updateChannelWithGif('kural', rulesEmbed);

      // 6. #🎫・destek-talebi (Neon GIF)
      const ticketEmbed = new EmbedBuilder()
        .setTitle('🎫 NIGHTS DESTEK & TICKET MERKEZİ')
        .setDescription(
          'Sunucumuzla ilgili her türlü soru, şikayet, öneri veya yetkili başvurusu için destek talebi oluşturabilirsiniz.\n\n' +
          '📌 **Nasıl Çalışır?**\n' +
          'Aşağıdaki **"📩 Destek Talebi Aç"** butonuna tıkladığınızda yalnızca sizin ve yetkili ekibimizin görebileceği özel bir bilet kanalı açılır.\n\n' +
          '> ⚠️ *Gereksiz yere bilet açmak veya yetkilileri meşgul etmek uyarılmanıza sebep olabilir.*'
        )
        .setImage(GIF_NEON_AESTHETIC)
        .setColor('#5865F2')
        .setFooter({ text: 'Nights Destek Sistemi • Made by erencix' })
        .setTimestamp();

      const ticketRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('ticket_open').setLabel('Destek Talebi Aç').setEmoji('📩').setStyle(ButtonStyle.Primary)
      );
      await updateChannelWithGif('destek-talebi', ticketEmbed, [ticketRow]);

      // 7. #📖・muzik-bilgi (Cyber Studio GIF)
      const muzikEmbed = new EmbedBuilder()
        .setTitle('📖 NIGHTS MÜZİK KILAVUZU & KOMUTLARI 🎶')
        .setDescription(
          'Ses kanallarında yüksek ses kalitesi ve YouTube entegrasyonuyla kesintisiz müzik keyfi!\n\n' +
          '### ⚡ Müzik Komutları:\n' +
          '• `/cal <şarkı>` — YouTube üzerinden şarkıyı arar ve seste çalar\n' +
          '• `/durdur` — Çalan müziği duraklatır\n' +
          '• `/devam` — Duraklatılan müziği sürdürür\n' +
          '• `/gec` — Sıradaki parçaya atlar\n' +
          '• `/kuyruk` — Mevcut çalma listesini gösterir\n' +
          '• `/ayril` — Botu ses odasından çıkarır\n\n' +
          '> 💡 *Ses kanalınızı yönetmek, kullanıcı limiti veya bitrate ayarlamak için `#🎛️・ses-paneli` kanalını kullanabilirsiniz.*'
        )
        .setImage(GIF_CYBER_STUDIO)
        .setColor('#1DB954')
        .setFooter({ text: 'Nights Müzik Sistemi • Made by erencix' })
        .setTimestamp();
      await updateChannelWithGif('muzik-bilgi', muzikEmbed);

      // 8. #🎵・muzik-komut (Music Chill GIF)
      const curMusicEmbed = new EmbedBuilder()
        .setTitle('🎵 NIGHTS MÜZİK KONTROL MERKEZİ 🎧')
        .setDescription(
          'Ses kanalında kesintisiz müzik dinlemek için aşağıdaki komutları veya hızlı butonları kullanabilirsiniz.\n\n' +
          '• `/cal <şarkı>` — YouTube şarkı çalma\n' +
          '• `/durdur` & `/devam` — Duraklat / Sürdür\n' +
          '• `/gec` — Şarkıyı atla\n' +
          '• `/kuyruk` — Çalma listesi\n' +
          '• `/ayril` — Sesten çık\n\n' +
          '> 🎶 *Nights 384kbps Hi-Fi Kristal Netliğinde Müzik Sistemi*'
        )
        .setImage(GIF_MUSIC_CHILL)
        .setColor('#8B5CF6')
        .setFooter({ text: 'Nights High-End Music Engine • Made by erencix' })
        .setTimestamp();

      const musicRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('btn_music_pause').setLabel('Durdur').setEmoji('⏸️').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('btn_music_resume').setLabel('Devam').setEmoji('▶️').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('btn_music_skip').setLabel('Geç').setEmoji('⏭️').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('btn_music_queue').setLabel('Kuyruk').setEmoji('📜').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('btn_music_stop').setLabel('Ayrıl').setEmoji('⏹️').setStyle(ButtonStyle.Danger)
      );
      await updateChannelWithGif('muzik-komut', curMusicEmbed, [musicRow]);

      // 9. #🧩・kelime-oyunu & #🎯・click-me
      const kelimeEmbed = new EmbedBuilder()
        .setTitle('🧩 NIGHTS KELİME TÜRETME OYUNU')
        .setDescription(
          'Bir önceki kelimenin son harfiyle başlayan yeni bir Türkçe kelime yazarak zinciri devam ettirin!\n\n' +
          '> 💡 *Her geçerli kelime size 5 Nights Coin kazandırır!*'
        )
        .setImage(GIF_NEON_AESTHETIC)
        .setColor('#E67E22')
        .setFooter({ text: 'Nights Eğlence & Mini Oyunlar • Made by erencix' })
        .setTimestamp();
      await updateChannelWithGif('kelime-oyunu', kelimeEmbed);

      const eventEmbed = new EmbedBuilder()
        .setTitle('🎯 NIGHTS 30 TIKLAMA BÜYÜK EVENTİ!')
        .setDescription(
          'Aşağıdaki butona **ilk tıklayan 30 üye** sunucunun özel rolünü ve Nights Coin ödüllerini kazanıyor!\n\n' +
          '> ⚡ *Her üye yalnızca 1 kez tıklayabilir. Acele et, kontenjan dolmadan yerini kap!*'
        )
        .setImage(GIF_NEON_AESTHETIC)
        .setColor('#E74C3C')
        .setFooter({ text: 'Nights Topluluk Etkinlikleri • Made by erencix' })
        .setTimestamp();

      const eventRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('btn_event_click').setLabel('Tıkla ve Kazan!').setEmoji('🎯').setStyle(ButtonStyle.Success)
      );
      await updateChannelWithGif('click-me', eventEmbed, [eventRow]);

      // 10. EXTRA ANIMATED GIF EMOJIS YÜKLE
      console.log('\n--- Ekstra Animasyonlu GIF Emojileri Yükleniyor ---');
      const emojis = await guild.emojis.fetch();
      const existingEmojiNames = new Set(emojis.map((e) => e.name?.toLowerCase()));

      let gifEmojisAdded = 0;
      for (const ge of EXTRA_GIF_EMOJIS) {
        if (existingEmojiNames.has(ge.name.toLowerCase())) {
          console.log(`⏩ GIF emoji zaten mevcut: ${ge.name}`);
          continue;
        }

        try {
          const res = await axios.get(ge.url, {
            responseType: 'arraybuffer',
            timeout: 10000,
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
          });
          const created = await guild.emojis.create({
            attachment: Buffer.from(res.data),
            name: ge.name,
            reason: 'Nights Ekstra Animasyonlu GIF Emojileri',
          });
          gifEmojisAdded++;
          console.log(`[${gifEmojisAdded}] ✅ Yeni GIF Emoji Eklendi: <a:${created.name}:${created.id}>`);
          existingEmojiNames.add(ge.name.toLowerCase());
          await new Promise((r) => setTimeout(r, 1200));
        } catch (err: any) {
          console.warn(`GIF emoji eklenemedi (${ge.name}):`, err.message);
        }
      }

      console.log('\n🎉 TÜM GIF BANNERLAR VE ANİMASYONLU EMOJİLER BAŞARIYLA YENİLENDİ!');
    } catch (err) {
      console.error(err);
    } finally {
      await client.destroy();
      process.exit(0);
    }
  });

  await client.login(config.discordToken);
}

main().catch(console.error);
