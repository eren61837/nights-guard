import { Client, GatewayIntentBits, EmbedBuilder, TextChannel } from 'discord.js';
import * as dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

const GIF_NEON_STARS = 'https://media.giphy.com/media/l41lI4bYmcsPJX9Go/giphy.gif';

client.once('clientReady', async () => {
  try {
    const guild = await client.guilds.fetch('1568618183223414934');
    const infoChannel = (await guild.channels.fetch('1568644559615954964')) as TextChannel;
    if (infoChannel && infoChannel.isTextBased()) {
      const messages = await infoChannel.messages.fetch({ limit: 10 });
      const botMsg = messages.find((m) => m.author.id === client.user?.id);

      const infoEmbed = new EmbedBuilder()
        .setTitle('⭐ NIGHTS SEVİYE & ROL BİLGİLENDİRME SİSTEMİ 🏆')
        .setDescription(
          '**Nights** sunucumuzda metin kanallarında sohbet ettikçe otomatik olarak **XP** kazanır, seviyenizi yükseltir ve özel rol ödüllerinin kilidini açarsınız!\n\n' +
          '### 🎖️ Seviye Rolleri ve Ayrıcalıkları:\n' +
          '• 🥉 **Level 5:** <@&1568680202807156888>\n' +
          '  └ *Bronz isim rengi, görsel & bağlantı paylaşma ve harici emoji ayrıcalığı.*\n\n' +
          '• 🥈 **Level 10:** <@&1568680215872278680>\n' +
          '  └ *Gümüş isim rengi, aktif sohbetçi statüsü ve özel sunucu çekilişlerine katılım önceliği.*\n\n' +
          '• 🥇 **Level 20:** <@&1568680219450155129>\n' +
          '  └ *Altın sarısı parıldayan isim rengi, özel ses kanalı limit/bitrate kontrol avantajları.*\n\n' +
          '• 💎 **Level 30:** <@&1568680222495084746>\n' +
          '  └ *Elmas mavi isim rengi, VIP oda erişimleri ve özel ses etkinlik yetkisi.*\n\n' +
          '• 👑 **Level 50:** <@&1568680226324484167>\n' +
          '  └ *Efsane mor isim rengi, sunucunun en seçkin üyeleri arasına girme ve taht statüsü!*\n\n' +
          '### ⚡ Komutlar:\n' +
          '• `/rank` veya `!rank` — Kendi seviye kartınızı, ses sürenizi ve XP ilerlemenizi görüntüler.\n' +
          '• `/top` veya `!top` — Sunucunun en aktif üyelerini listeleyen canlı Liderlik Tablosu.\n\n' +
          '> 💡 **Nasıl XP Kazanılır?**\n' +
          '> • 💬 **Yazılı Sohbet:** Metin kanallarında her 60 saniyede bir attığınız mesajlar size **15-25 XP** kazandırır.\n' +
          '> • 🎙️ **Ses Süresi:** Ses kanallarında geçirdiğiniz toplam süre profilinize işlenir.\n' +
          '> • *Spam, flood veya anlamsız mesajlar engellenir ve XP kazandırmaz.*'
        )
        .setColor('#6C5CE7')
        .setImage(GIF_NEON_STARS)
        .setFooter({ text: 'Nights Community Rewards • Made by erencix' })
        .setTimestamp();

      if (botMsg) {
        await botMsg.edit({ embeds: [infoEmbed] });
        console.log('✅ #⭐・seviye-rol-bilgi paneli başarıyla güncellendi!');
      } else {
        await infoChannel.send({ embeds: [infoEmbed] });
        console.log('✅ #⭐・seviye-rol-bilgi paneline yeni embed gönderildi!');
      }
    }
  } catch (err: any) {
    console.error('Hata:', err.message);
  } finally {
    client.destroy();
  }
});

client.login(process.env.DISCORD_TOKEN);
