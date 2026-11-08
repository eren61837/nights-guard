"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const discord_js_1 = require("discord.js");
const TARGET_GUILD_ID = '1568618183223414934';
async function main() {
    const client = new discord_js_1.Client({
        intents: [discord_js_1.GatewayIntentBits.Guilds, discord_js_1.GatewayIntentBits.GuildMessages, discord_js_1.GatewayIntentBits.MessageContent],
    });
    await client.login(process.env.DISCORD_TOKEN);
    console.log('Bot bağlandı, kanallar temizlenip yeni paneller yerleştiriliyor...');
    const guild = await client.guilds.fetch(TARGET_GUILD_ID);
    const channels = await guild.channels.fetch();
    // Helper to purge messages in a channel
    async function clearChannel(ch) {
        try {
            let fetched;
            do {
                fetched = await ch.messages.fetch({ limit: 100 });
                if (fetched.size > 0) {
                    try {
                        await ch.bulkDelete(fetched, true);
                    }
                    catch (_) {
                        for (const [, msg] of fetched) {
                            await msg.delete().catch(() => { });
                        }
                    }
                }
            } while (fetched.size > 0);
        }
        catch (e) {
            console.warn(`[Clear] ${ch.name} temizlenirken uyarı:`, e.message);
        }
    }
    // 1. #muzik-komut & #muzik-bilgi (Müzik Botu Önerisi & Kurulum Rehberi)
    const chMuzikKomut = channels.get('1568649342154182707');
    const chMuzikBilgi = channels.get('1568654003481477212');
    const musicEmbed = new discord_js_1.EmbedBuilder()
        .setTitle('🎵 NIGHTS MÜZİK ALANI & EN İYİ MÜZİK BOTU ÖNERİLERİ')
        .setDescription(`Sunucumuzda ses kalitesinin en üst düzeyde olması, donma/takılma yaşamadan **Spotify, YouTube, SoundCloud ve Apple Music** parçalarını 7/24 çalabilmeniz için Discord'un onaylı ve en stabil müzik botları önerilmektedir.\n\n` +
        `### 👑 1. Öneri: Jockie Music (En Çok Tercih Edilen)\n` +
        `• **Özellikler:** Aynı anda 4 farklı ses odasında çalabilen 4 bota sahiptir. Reklamsız, donmasız ve %100 ücretsizdir.\n` +
        `• **Desteklenen Platformlar:** Spotify, YouTube, SoundCloud, Apple Music, Deezer.\n` +
        `• **Varsayılan Ön-Ek (Prefix):** \`m!play <şarkı>\` veya \`/play\`\n\n` +
        `### 🚢 2. Öneri: FredBoat\n` +
        `• **Özellikler:** Discord'un en köklü ve stabil açık kaynaklı müzik botu.\n` +
        `• **Varsayılan Ön-Ek:** \`;;play <şarkı>\`\n\n` +
        `### 🌿 3. Öneri: Green-bot\n` +
        `• **Özellikler:** Yüksek kaliteli 384kbps Hi-Fi ses motoru ve 7/24 kesintisiz radyo modu.\n\n` +
        `> 💡 **Nasıl Kullanılır?**\n` +
        `> 1. Aşağıdaki butonlardan botu sunucuya ekleyin.\n` +
        `> 2. Bir ses odasına (örn: <#1568649343466995873>) katılın.\n` +
        `> 3. Bu kanalda \`m!play şarkı adı\` veya \`/play\` yazarak müziğin tadını çıkarın!`)
        .setColor('#8B5CF6')
        .setImage('https://media.giphy.com/media/EPfV3ijMQVl60/giphy.gif')
        .setFooter({ text: 'Nights Müzik & Ses Odaları • Made by erencix' })
        .setTimestamp();
    const musicButtons = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setLabel('Jockie Music Davet Et')
        .setURL('https://jockiemusic.com/')
        .setStyle(discord_js_1.ButtonStyle.Link)
        .setEmoji('👑'), new discord_js_1.ButtonBuilder()
        .setLabel('FredBoat Davet Et')
        .setURL('https://fredboat.com/')
        .setStyle(discord_js_1.ButtonStyle.Link)
        .setEmoji('🚢'), new discord_js_1.ButtonBuilder()
        .setLabel('Green-bot Davet Et')
        .setURL('https://green-bot.app/')
        .setStyle(discord_js_1.ButtonStyle.Link)
        .setEmoji('🌿'));
    if (chMuzikKomut) {
        console.log(`Temizleniyor: #${chMuzikKomut.name}`);
        await clearChannel(chMuzikKomut);
        await chMuzikKomut.send({ embeds: [musicEmbed], components: [musicButtons] });
        console.log(`✅ #${chMuzikKomut.name} güncellendi!`);
    }
    if (chMuzikBilgi) {
        console.log(`Temizleniyor: #${chMuzikBilgi.name}`);
        await clearChannel(chMuzikBilgi);
        await chMuzikBilgi.send({ embeds: [musicEmbed], components: [musicButtons] });
        console.log(`✅ #${chMuzikBilgi.name} güncellendi!`);
    }
    // 2. #bot-komut (Tüm Güncel Komutlar ve Özellikler Rehberi)
    const chBotKomut = channels.get('1568644566242955325');
    if (chBotKomut) {
        console.log(`Temizleniyor: #${chBotKomut.name}`);
        await clearChannel(chBotKomut);
        const helpEmbed1 = new discord_js_1.EmbedBuilder()
            .setTitle('🛡️ NIGHTS GUARD RESMİ KOMUT KILAVUZU (1/2)')
            .setDescription('Sunucumuzda kullanabileceğiniz tüm interaktif, eğlence, ekonomi ve seviye komutları aşağıda listelenmiştir:\n\n' +
            '### ⚡ 1. Seviye & Aktiflik Sıralaması:\n' +
            '• `/rank` veya `!rank [@üye]` — Kendi veya etiketlediğiniz üyenin seviye kartını, XP durumunu ve sıralamasını gösterir.\n' +
            '• `/top` veya `!top` — Sunucunun en aktif üyelerini ve liderlik tablosunu listeler.\n' +
            '• *Sohbet kanallarında mesaj yazarak ve ses odalarında vakit geçirerek otomatik XP kazanırsınız! Her 5 seviyede yeni özel rol verilir.*\n\n' +
            '### 💰 2. Nights Ekonomi & Eğlence Oyunları:\n' +
            '• `!gunluk` — Günlük 500 Nights Coin hediyenizi hesabınıza aktarır.\n' +
            '• `!bakiye` veya `!cuzdan` — Mevcut cüzdan bakiyenizi görüntüler.\n' +
            '• `!calis` — 30 dakikada bir çalışarak rastgele 150-450 coin kazandırır.\n' +
            '• `!cf <miktar> <yazi|tura>` — Yazı-tura bahsi oynar (örn: `!cf 100 yazi`).\n' +
            '• `!slot <miktar>` — Slot kumar makinesini çevirir (3 sembol eşleşirse devasa kazanç!).\n\n' +
            '### 🤫 3. Anonim İtiraf Sistemi:\n' +
            '• `/itiraf` — Sunucu üyelerine tamamen anonim (kimliğiniz gizli) veya isminizle itiraf mesajı gönderir. İtiraflar <#1568993069364281474> kanalında yayınlanır ve üyeler kalp/tepki butonlarıyla oylar!')
            .setColor('#8B5CF6');
        const helpEmbed2 = new discord_js_1.EmbedBuilder()
            .setTitle('🛡️ NIGHTS GUARD RESMİ KOMUT KILAVUZU (2/2)')
            .setDescription('### 💍 4. Sosyal & Evlilik Sistemi:\n' +
            '• `!evlen @üye` — Seçtiğiniz kullanıcıya evlenme teklifi eder (onay butonludur!).\n' +
            '• `!bosan` — Mevcut evliliğinizi sonlandırır.\n' +
            '• `!evli` veya `!evlilik` — Evlilik cüzdanınızı ve evlilik sürenizi görüntüler.\n' +
            '• `!saril @üye` — Bir üyeye içtenlikle sarılır.\n' +
            '• `!op @üye` — Bir üyeyi öper.\n' +
            '• `!tokat @üye` — Bir üyeye şaka amaçlı tokat atar.\n' +
            '• `!kahve @üye` — Bir üyeye sıcacık kahve ikram eder.\n\n' +
            '### 🛠️ 5. Genel & Moderasyon Komutları:\n' +
            '• `/yardim` — Yardım panelini görüntüler.\n' +
            '• `/kullanici [@üye]` — Detaylı kullanıcı profilini, rollerini ve sunucuya katılım tarihini görüntüler.\n' +
            '• `/istatistik` — Sunucu üye sayısı, çevrim içi durumu ve kanal istatistiklerini görüntüler.\n' +
            '• `/avatar [@üye]` — Kullanıcının profil resmini HD olarak büyütür.\n' +
            '• `/afk <sebep>` — AFK moduna geçer. Biri sizi etiketlediğinde bot otomatik bilgilendirir.\n' +
            '• `/sil <miktar>` — Kanaldan belirtilen sayıda mesajı toplu siler (Yetkili).\n\n' +
            '### 🎮 6. Otomatik Mini Oyun Kanalları:\n' +
            '• <#1568644567517896815> — Otomatik Kelime Türetmece (Bot son harfe göre puan tutar).\n' +
            '• <#1568654018149093376> & <#1568654021395226725> — Hızlı 1 saniyelik OwO Gambling odaları.\n' +
            '• <#1568646148468768779> — Topluluk "Click Me" ortak tıklama etkinliği odası.')
            .setColor('#2ECC71')
            .setFooter({ text: 'Nights Community Engine • Made by erencix' })
            .setTimestamp();
        await chBotKomut.send({ embeds: [helpEmbed1, helpEmbed2] });
        console.log(`✅ #${chBotKomut.name} güncellendi!`);
    }
    // 3. #seviye-rol-bilgi kanalını da tazeleyelim
    const chSeviyeBilgi = channels.get('1568644559615954964');
    if (chSeviyeBilgi) {
        console.log(`Temizleniyor: #${chSeviyeBilgi.name}`);
        await clearChannel(chSeviyeBilgi);
        const levelInfoEmbed = new discord_js_1.EmbedBuilder()
            .setTitle('⭐ NIGHTS SEVİYE SİSTEMİ & ÖZEL KAZANIM ROLLERİ')
            .setDescription('Sunucumuzda aktif kalarak mesaj yazdıkça ve ses odalarında vakit geçirdikçe otomatik olarak **XP** kazanırsınız!\n\n' +
            '### 🎖️ Otomatik Verilen Seviye Rolleri:\n' +
            '• 🥉 **Level 5:** `@Bronz Üye`\n' +
            '• 🥈 **Level 10:** `@Gümüş Üye`\n' +
            '• 🥇 **Level 20:** `@Altın Üye`\n' +
            '• 💎 **Level 30:** `@Platin Üye`\n' +
            '• 👑 **Level 50:** `@Elmas Üye`\n\n' +
            '### 📊 Komutlar:\n' +
            '• Kendi seviyenizi görmek için: `/rank` veya `!rank`\n' +
            '• Sunucunun en aktif üyelerini görmek için: `/top` veya `!top`\n\n' +
            '> ⚡ *Seviye atladığınızda bot sizi otomatik olarak kutlar ve yeni rolünüzü anında hesabınıza tanımlar!*')
            .setColor('#F1C40F')
            .setImage('https://media.giphy.com/media/26tn3334mvoVClhos/giphy.gif')
            .setFooter({ text: 'Nights Seviye Sistemi • Made by erencix' });
        await chSeviyeBilgi.send({ embeds: [levelInfoEmbed] });
        console.log(`✅ #${chSeviyeBilgi.name} güncellendi!`);
    }
    console.log('\n🎉 TÜM PANELLER BAŞARIYLA GÜNCELLENDİ VE TEMİZLENDİ!');
    client.destroy();
}
main().catch(console.error);
