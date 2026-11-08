import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('yardim')
  .setDescription('Botun tüm komutlarını, sistemlerini ve özelliklerini listeler.');

export async function execute(interaction: ChatInputCommandInteraction) {
  const embed = new EmbedBuilder()
    .setTitle('🛡️ NIGHTS GUARD • KOMUT & REHBER MERKEZİ')
    .setDescription(
      'Nights Guard; 7/24 kesintisiz sunucu güvenliği, yapay zeka asistanı, ekonomi, seviye ve moderasyon sistemi sunan gelişmiş bir sunucu botudur.'
    )
    .setColor('#8B5CF6')
    .addFields(
      {
        name: '👥 Genel & Kullanıcı Komutları (Herkese Açık)',
        value:
          '• `/itiraf <mesaj>` — Sunucuya tamamen anonim ve gizli itirafta bulunur (Kimliğiniz %100 saklıdır).\n' +
          '• `/kullanici [kullanıcı]` — Detaylı sunucu profili, roller, seviye, ses süresi ve bakiye kartı.\n' +
          '• `/istatistik` — Botun anlık ping, RAM kullanımı, uptime ve teknik sistem verileri.\n' +
          '• `/gonder <kullanıcı> <miktar>` — Başka bir üyeye Nights Coin transfer eder.\n' +
          '• `/avatar [kullanıcı]` — Kendinizin veya arkadaşınızın 4K profil fotoğrafını & afişini görüntüler.\n' +
          '• `/sunucu` — Sunucunun detaylı üye, ses, kanal ve boost istatistiklerini listeler.\n' +
          '• `/afk [sebep]` — AFK moduna geçer; etiketlendiğinizde neden uzakta olduğunuzu bildirir.\n' +
          '• `/yardim` — Bu rehber menüsünü açar.',
        inline: false,
      },
      {
        name: '⭐ Seviye & Aktiflik Sistemi (Yazılı Sohbet)',
        value:
          '• `/rank [kullanıcı]` veya `!rank` — Seviyenizi, XP durumunuzu ve sesli kanallardaki toplam sürenizi görüntüler.\n' +
          '• `/top` veya `!top` — Sunucunun en aktif üyelerini gösteren Liderlik Sıralaması.\n' +
          '• 💬 **Sohbet XP:** Metin kanallarında aktif oldukça otomatik olarak **15-25 XP** kazanırsınız.',
        inline: false,
      },
      {
        name: '🎵 384kbps Hi-Fi Müzik Sistemi (YouTube & SoundCloud)',
        value:
          '• `/cal <şarkı>` veya `!cal <şarkı>` — YouTube veya SoundCloud parçalarını ses odasında çalar.\n' +
          '• `/durdur` & `/devam` — Müziği duraklatır veya sürdürür.\n' +
          '• `/gec` — Sıradaki parçaya atlar.\n' +
          '• `/kuyruk` — Çalma listesindeki bekleyen parçaları listeler.\n' +
          '• `/ayril` — Botu ses odasından çıkarır.\n' +
          '• `/ses <1-150>` — Müzik ses seviyesini ayarlar.\n' +
          '• *Not: <#1568649342154182707> kanalında interaktif butonlu müzik kumandası mevcuttur!*',
        inline: false,
      },
      {
        name: '💰 Ekonomi & Nights Coin Sistemi',
        value:
          '• `/gonder <kullanıcı> <miktar>` — Başka bir üyeye Nights Coin transfer eder.\n' +
          '• `!gunluk` — Günlük 500 Nights Coin hediyenizi alır.\n' +
          '• `!bakiye` — Mevcut paranızı kontrol eder.\n' +
          '• `!calis` — 30 dakikada bir çalışarak para kazandırır.\n' +
          '• `!cf <miktar> <yazi|tura>` — Yazı-tura bahsi oynar.\n' +
          '• `!slot <miktar>` — Slot kumar makinesini çevirir.',
        inline: false,
      },
      {
        name: '💖 Sosyal, Eğlence & Evlilik Sistemi',
        value:
          '• `!evlen @kullanıcı` — Sevdiğiniz kişiye butonlu interaktif evlilik teklifi eder! 💍\n' +
          '• `!bosan` — Evliliği resmi olarak sonlandırır.\n' +
          '• `!evlilik [@kullanıcı]` — Resmi evlilik cüzdanını ve evlilik süresini görüntüler.\n' +
          '• `!saril @kullanıcı` — Arkadaşınıza sımsıkı sarılır (GIF).\n' +
          '• `!tokat @kullanıcı` — Arkadaşınıza okkalı bir tokat yapıştırır (GIF).\n' +
          '• `!op @kullanıcı` — Arkadaşınıza tatlı bir öpücük kondurur (GIF).\n' +
          '• `!kahve @kullanıcı` — Arkadaşınıza sıcacık bir kahve ısmarlar (GIF).\n' +
          '• `#💬・kelime-oyunu` — Otomatik kelime türetmece oyunu.',
        inline: false,
      },
      {
        name: '🤖 Yapay Zeka Sohbet & Muhabbet',
        value:
          '• `#ai-sohbet` kanalında veya botu etiketleyerek (`@Nights Guard`) dilediğiniz her şeyi sorabilir, dertleşebilir veya eğlenceli sohbet edebilirsiniz!',
        inline: false,
      },
      {
        name: '🛡️ Moderasyon & Yönetici Komutları',
        value:
          '• `/sil <miktar>` — Kanaldaki 1-100 adet mesajı saniyeler içinde temizler.\n' +
          '• `/seviye-ayarla <kullanıcı> <seviye>` — Üyenin seviyesini doğrudan belirler.\n' +
          '• `/mesajgönder mesaj:<metin>` — Tüm sunucu üyelerine özelden zengin toplu duyuru (DM) iletir.\n' +
          '• `/kur` & `/plan` — Yapay zeka ile otomatik sunucu mimarisi tasarlar ve kurar.\n' +
          '• `/sunucu-temizle` — Sunucuyu sıfırlamak için kullanılır.',
        inline: false,
      },
      {
        name: '🔒 7/24 Yerleşik Güvenlik Kalkanı & Denetim Logu',
        value:
          '• **Akıllı Ailevi & Şahsi Hakaret Koruması:** Ailevi/şahsi ağır saldırıları anında siler ve susturur; genel argo serbesttir.\n' +
          '• **7/24 Denetim Logu:** Silinen/düzenlenen mesajlar, sesten çıkan/girenler `#denetim-kaydı` kanalına anlık loglanır.\n' +
          '• **Kelime Türetmece Güvenliği:** Oyun odasındaki küfürlü kelimeleri anında engeller.\n' +
          '• **Fotoğraf Kanalı Koruması:** Medya paylaşımları yalnızca yetkili medya odalarında yapılabilir.\n' +
          '• **Otomatik Kayıt & Bot Onayı:** Kayıt olanlara `☊ ` simgesi, botlara ise anında Bot ve Onaylı rolleri verilir.',
        inline: false,
      }
    )
    .setFooter({ text: '🛡️ Nights Guard Engine • Made by erencix' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
