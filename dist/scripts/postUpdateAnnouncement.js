"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const client = new discord_js_1.Client({
    intents: [discord_js_1.GatewayIntentBits.Guilds, discord_js_1.GatewayIntentBits.GuildMessages]
});
const GIF_NEON_ANNOUNCEMENT = 'https://media.giphy.com/media/26tn3334mvoVClhos/giphy.gif';
const GIF_NEON_STARS = 'https://media.giphy.com/media/l41lI4bYmcsPJX9Go/giphy.gif';
client.once('clientReady', async () => {
    try {
        const guild = await client.guilds.fetch('1568618183223414934');
        console.log(`[Duyuru] ${guild.name} sunucusuna bağlanıldı.`);
        // 1. #📢・duyurular kanalını bul
        const duyuruChannel = (await guild.channels.fetch('1568644558106001528'));
        if (duyuruChannel && duyuruChannel.isTextBased()) {
            const updateEmbed = new discord_js_1.EmbedBuilder()
                .setTitle('🚀 NIGHTS GUARD • BÜYÜK SİSTEM & SEVİYE GÜNCELLEMESİ YAYINDA!')
                .setDescription(`Değerli **Nights** Üyeleri,\n` +
                `Sunucumuzun altyapısı, aktiflik ödülleri ve güvenlik sistemleri baştan aşağı yenilendi! İşte yayına giren yeni özellikler:\n\n` +
                `### 🎙️ 1. Sesli Kanallarda Seviye & XP Sistemi (YENİ!)\n` +
                `• Artık ses odalarında sohbet ettikçe, müzik dinledikçe ve oyun oynadıkça **otomatik XP kazanacaksınız!**\n` +
                `• **Kazanç:** Ses odasında geçirdiğiniz her dakika için \`10 - 20 XP\` hesabınıza eklenir.\n` +
                `• **AFK Engeli:** Kulaklığı kapalı (sağırlaştırılmış) olanlar XP kazanamaz, aktif olanlar ödüllendirilir.\n` +
                `• **Ses Süresi Takibi:** \`/rank\` komutunu kullanarak toplam ses sürenizi ve seviyenizi görebilirsiniz.\n\n` +
                `### 👑 2. Beş Kademeli Özel Seviye Rolleri\n` +
                `Sohbet ettikçe ve seste kaldıkça aşağıdaki roller otomatik olarak profilinize tanımlanır:\n` +
                `• 🥉 <@&1568680202807156888> (\`Level 5\`)\n` +
                `• 🥈 <@&1568680215872278680> (\`Level 10\`)\n` +
                `• 🥇 <@&1568680219450155129> (\`Level 20\`)\n` +
                `• 💎 <@&1568680222495084746> (\`Level 30\`)\n` +
                `• 👑 <@&1568680226324484167> (\`Level 50\`)\n\n` +
                `### 🛡️ 3. Üst Düzey Akıllı Güvenlik & Küfür Kalkanı\n` +
                `• Tüm argo varyasyonları, gizli harfler, leetspeak ve sesli harf değişimleri anında temizlenir.\n` +
                `• Normal üyelerin ihlallerinde anında mesaj silinir ve \`1 dakika timeout\` uygulanır.\n` +
                `• Yetkililer için özel deneme/test uyarısı modu entegre edildi.\n\n` +
                `### ☊ 4. Özel Prestij Kayıt Sembolü\n` +
                `• Sunucumuza kayıt olan tüm üyelerimizin isimlerinin başına Nights'ın özel **\`☊ \`** sembolü eklendi.\n\n` +
                `### 🎬 5. Yenilenen Hareketli Paneller & 79 Yeni Emoji\n` +
                `• Kayıt, kurallar, müzik, destek ve oyun odalarının tamamı animasyonlu neon GIF bannerlar ile donatıldı.\n\n` +
                `> 💡 **Hemen Başla:** \`/rank\` yazarak seviyeni ve ses süreni öğren, \`/top\` ile sunucu liderlik tablosundaki yerini kap!`)
                .setColor('#8B5CF6')
                .setImage(GIF_NEON_ANNOUNCEMENT)
                .setThumbnail(guild.iconURL() || null)
                .setFooter({ text: 'Nights Guard • Geliştirici: erencix' })
                .setTimestamp();
            await duyuruChannel.send({
                content: '📢 @everyone **Büyük sistem ve sesli seviye güncellemesi yayınlandı!**',
                embeds: [updateEmbed],
            });
            console.log('✅ #📢・duyurular kanalına güncelleme duyurusu başarıyla gönderildi!');
        }
        // 2. #⭐・seviye-rol-bilgi kanalındaki bilgi panelini güncelle
        const infoChannel = (await guild.channels.fetch('1568644559615954964'));
        if (infoChannel && infoChannel.isTextBased()) {
            const messages = await infoChannel.messages.fetch({ limit: 10 });
            const botMsg = messages.find((m) => m.author.id === client.user?.id);
            const infoEmbed = new discord_js_1.EmbedBuilder()
                .setTitle('⭐ NIGHTS SEVİYE & ROL BİLGİLENDİRME SİSTEMİ 🏆')
                .setDescription('**Nights** sunucumuzda metin ve ses kanallarında aktif oldukça otomatik olarak **XP** kazanır, seviyenizi yükseltir ve özel rol ödüllerinin kilidini açarsınız!\n\n' +
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
                '> • 🎙️ **Sesli Kanallar:** Ses odalarında geçirdiğiniz her dakika için **10-20 XP** kazanırsınız! (Kulaklığı kapalı olanlara AFK engeli uygulanır).')
                .setColor('#6C5CE7')
                .setImage(GIF_NEON_STARS)
                .setFooter({ text: 'Nights Community Rewards • Made by erencix' })
                .setTimestamp();
            if (botMsg) {
                await botMsg.edit({ embeds: [infoEmbed] });
                console.log('✅ #⭐・seviye-rol-bilgi paneli başarıyla güncellendi!');
            }
            else {
                await infoChannel.send({ embeds: [infoEmbed] });
                console.log('✅ #⭐・seviye-rol-bilgi paneline yeni embed gönderildi!');
            }
        }
    }
    catch (error) {
        console.error('Hata:', error);
    }
    finally {
        process.exit(0);
    }
});
client.login(process.env.DISCORD_TOKEN);
