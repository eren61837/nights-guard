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
          '• `/roast [kullanıcı]` — Kişinin sunucudaki tüm mesajlarını okuyup onu acımasızca ve komikçe roast eder! 🔥\n' +
          '• `/lakap [kullanıcı]` — Mesaj geçmişine ve tarzına göre kişiye özel komik gece/mafya lakabı takar! 🎭\n' +
          '• `/lobi-bul` — Valorant, CS2, LoL veya istediğin oyunda anında takım arkadaşı arama lobisi açar! 🎮\n' +
          '• `/oyuncu` — Valorant, CS2 veya LoL oyuncu istatistiklerini ve canlı Tracker kartını görüntüler.\n' +
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
          '• `/erenmod` veya `!erenmod` — Erencix\'in favori VIP parçalarını anında ses odasında başlatır! 👑🔥\n' +
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
        name: '🤖 7/24 Akıllı Yapay Zeka Sohbeti (ChatGPT & Gemini Destekli)',
        value:
          '• <#1568644563285835826> veya `#ai-sohbet` — Botu etiketlemenize gerek kalmadan doğrudan mesaj yazarak canlı sohbet edebilirsiniz!\n' +
          '• 🧠 **Gerçek Üretken AI:** Kalıp veya otomatik robotik cevaplar yoktur; kodlama, oyunlar (Valorant, CS2), anime, dertleşme ve her konuda derin hafızalı zeki cevaplar verir.\n' +
          '• 💬 Diğer kanallarda botu etiketleyerek (`@Nights Guard`) dilediğiniz her yerde konuşabilirsiniz.',
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
        name: '💾 Tam Sunucu Yedekleme & Geri Yükleme (Yalnızca erencix)',
        value:
          '• `/yedek-al` veya `!yedek-al` — Sunucunun tüm rollerini, kanallarını, yetkilerini ve üyelerin sahip olduğu rolleri A\'dan Z\'ye eksiksiz yedekler.\n' +
          '• `/yedekgetir` veya `!yedekgetir` — Alınan son tam yedeği geri yükleyerek sunucuyu eski haline getirir.\n' +
          '• 🔐 **Özel Yetkilendirme:** Bu komutlar kritik olduğundan yalnızca erencix (`1138498666785677492`) tarafından çalıştırılabilir.',
        inline: false,
      },
      {
        name: '🔒 7/24 Gelişmiş Güvenlik Kalkanı & Anti-Mass Guard',
        value:
          '• **Anti-Mass Ban & Kick Koruması:** Bir yönetici 10 dakika içinde 2\'den fazla kişiyi banlar veya atarsa, 3. işlemde tüm yetkileri derhal geri alınır ve son işlem iptal edilir ("3. de atılırsınız erencix den izin alın").\n' +
          '• **Akıllı Küfür & Hakaret Koruması:** Ailevi/dini/şahsi ağır saldırıları anında siler ve susturur.\n' +
          '• **Anti-Spam & Anti-Raid Shield:** Hızlı mesaj spamı veya ani toplu bot girişlerinde sunucuyu otomatik kalkan altına alır.\n' +
          '• **Link & Reklam Engeli:** Yetkisiz Discord davet ve harici bağlantıları engeller.\n' +
          '• **7/24 Denetim Logu:** Silinen/düzenlenen mesajlar ve ses hareketleri `#mod-log` kanalına anlık raporlanır.',
        inline: false,
      }
    )
    .setFooter({ text: '🛡️ Nights Guard Engine • Made by erencix' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
