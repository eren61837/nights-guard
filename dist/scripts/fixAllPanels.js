"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_1 = require("../config");
const TARGET_GUILD_ID = '1568618183223414934';
async function main() {
    console.log('🔍 Nights Olmayan Tüm Discord Varlıkları Temizleniyor...');
    const client = new discord_js_1.Client({
        intents: [
            discord_js_1.GatewayIntentBits.Guilds,
            discord_js_1.GatewayIntentBits.GuildEmojisAndStickers,
            discord_js_1.GatewayIntentBits.GuildMessages,
            discord_js_1.GatewayIntentBits.GuildMembers,
        ],
    });
    client.once('clientReady', async () => {
        try {
            const guild = await client.guilds.fetch(TARGET_GUILD_ID);
            // 1. BOT KULLANICI ADI VE AVATARI GÜNCELLEME
            console.log('\n--- 1. Bot Profil Bilgileri Güncelleniyor ---');
            try {
                if (client.user?.username !== 'Nights Guard') {
                    await client.user?.setUsername('Nights Guard');
                    console.log('✅ Bot kullanıcı adı "Nights Guard" yapıldı!');
                }
            }
            catch (uErr) {
                console.warn('Bot kullanıcı adı değiştirilemedi (Discord hız sınırı olabilir):', uErr.message);
            }
            try {
                const logoPath = path_1.default.resolve('assets/nights_logo.jpg');
                if (fs_1.default.existsSync(logoPath)) {
                    const logoBuf = fs_1.default.readFileSync(logoPath);
                    await client.user?.setAvatar(logoBuf);
                    console.log('✅ Bot avatarı Nights logosu olarak güncellendi!');
                }
            }
            catch (aErr) {
                console.warn('Bot avatarı değiştirilemedi (Discord hız sınırı olabilir):', aErr.message);
            }
            // 2. KANAL KONULARI (TOPICS) GÜNCELLEME
            console.log('\n--- 2. Kanal Konuları (Topics) Güncelleniyor ---');
            const channels = await guild.channels.fetch();
            for (const ch of channels.values()) {
                if (!ch)
                    continue;
                if ('topic' in ch && ch.topic && ch.topic.toLowerCase().includes('prayt')) {
                    const newTopic = ch.topic.replace(/prayt/gi, 'Nights');
                    try {
                        await ch.setTopic(newTopic);
                        console.log(`✅ Kanal konusu güncellendi: #${ch.name} -> "${newTopic}"`);
                    }
                    catch (tErr) {
                        console.warn(`Konu güncellenemedi (#${ch.name}):`, tErr.message);
                    }
                }
            }
            // 3. #🛡️・kayit-onay PANELİ GÜNCELLEME
            console.log('\n--- 3. Kayıt Onay Paneli Güncelleniyor ---');
            const kayitChannel = channels.find((c) => c?.name.includes('kayit-onay'));
            if (kayitChannel && kayitChannel.isTextBased()) {
                try {
                    const msgs = await kayitChannel.messages.fetch({ limit: 10 });
                    for (const m of msgs.values()) {
                        if (m.author.id === client.user?.id)
                            await m.delete().catch(() => { });
                    }
                    const kayitEmbed = new discord_js_1.EmbedBuilder()
                        .setTitle('🛡️ NIGHTS GÜVENLİK & KAYIT SİSTEMİ')
                        .setDescription('**Nights** topluluğuna hoş geldiniz!\n\n' +
                        'Sunucumuzun güvenliğini sağlamak ve bot hesapları engellemek amacıyla kayıt sistemi aktiftir.\n\n' +
                        '📌 **Nasıl Kayıt Olunur?**\n' +
                        'Aşağıdaki **"✅ Kayıt Ol"** butonuna basarak adınızı ve yaşınızı girin. Kaydınız anında onaylanacak ve sunucunun tüm kanalları erişiminize açılacaktır.\n\n' +
                        '> ⚠️ *Topluluk kurallarını ihlal eden uygunsuz isimler sistem tarafından otomatik reddedilir.*')
                        .setColor('#2ECC71')
                        .setFooter({ text: 'Nights Otomatik Kayıt Sistemi • Made by erencix' })
                        .setTimestamp();
                    const kayitRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('btn_kayit_basla').setLabel('Kayıt Ol').setEmoji('✅').setStyle(discord_js_1.ButtonStyle.Success));
                    await kayitChannel.send({ embeds: [kayitEmbed], components: [kayitRow] });
                    console.log('✅ #🛡️・kayit-onay paneli Nights olarak güncellendi!');
                }
                catch (err) {
                    console.warn('Kayıt kanalı güncellenemedi:', err.message);
                }
            }
            // 4. #🚻・cinsiyet-secimi PANELİ GÜNCELLEME
            console.log('\n--- 4. Cinsiyet Seçimi Paneli Güncelleniyor ---');
            const cinsiyetChannel = channels.find((c) => c?.name.includes('cinsiyet'));
            if (cinsiyetChannel && cinsiyetChannel.isTextBased()) {
                try {
                    const msgs = await cinsiyetChannel.messages.fetch({ limit: 10 });
                    for (const m of msgs.values()) {
                        if (m.author.id === client.user?.id)
                            await m.delete().catch(() => { });
                    }
                    const cinsiyetEmbed = new discord_js_1.EmbedBuilder()
                        .setTitle('🚻 NIGHTS CİNSİYET ROLÜ SEÇİMİ')
                        .setDescription('Aşağıdaki butonlara tıklayarak profiliniz için uygun cinsiyet rolünü anında alabilirsiniz.\n\n' +
                        '👦 **Erkek Rolü:** Mavi profil rengi ve unvanı verir.\n' +
                        '👧 **Kız Rolü:** Pembe profil rengi ve unvanı verir.\n\n' +
                        '> 💡 *Rolünüzü dilediğiniz zaman butona tekrar basarak değiştirebilirsiniz.*')
                        .setColor('#9B59B6')
                        .setFooter({ text: 'Nights Rol Yönetimi • Made by erencix' })
                        .setTimestamp();
                    const cinsiyetRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('btn_cinsiyet_erkek').setLabel('Erkek').setEmoji('👦').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId('btn_cinsiyet_kiz').setLabel('Kız').setEmoji('👧').setStyle(discord_js_1.ButtonStyle.Danger));
                    await cinsiyetChannel.send({ embeds: [cinsiyetEmbed], components: [cinsiyetRow] });
                    console.log('✅ #🚻・cinsiyet-secimi paneli Nights olarak güncellendi!');
                }
                catch (err) {
                    console.warn('Cinsiyet kanalı güncellenemedi:', err.message);
                }
            }
            // 5. #🧩・kelime-oyunu GÜNCELLEME
            console.log('\n--- 5. Kelime Oyunu Kanalı Güncelleniyor ---');
            const kelimeChannel = channels.find((c) => c?.name.includes('kelime'));
            if (kelimeChannel && kelimeChannel.isTextBased()) {
                try {
                    const msgs = await kelimeChannel.messages.fetch({ limit: 10 });
                    for (const m of msgs.values()) {
                        if (m.author.id === client.user?.id)
                            await m.delete().catch(() => { });
                    }
                    const kelimeEmbed = new discord_js_1.EmbedBuilder()
                        .setTitle('🧩 NIGHTS KELİME TÜRETME OYUNU')
                        .setDescription('Bir önceki kelimenin son harfiyle başlayan yeni ve anlamlı bir Türkçe kelime yazarak zinciri devam ettirin!\n\n' +
                        '📌 **Kurallar:**\n' +
                        '• Aynı kelime üst üste tekrarlanamaz.\n' +
                        '• Bir kişi ardı ardına iki kelime yazamaz.\n' +
                        '• Her doğru kelime size **5 Nights Coin** kazandırır!\n\n' +
                        '> 🏁 *İlk kelimeyi yazarak oyunu başlatabilirsiniz!*')
                        .setColor('#E67E22')
                        .setFooter({ text: 'Nights Eğlence & Mini Oyunlar • Made by erencix' })
                        .setTimestamp();
                    await kelimeChannel.send({ embeds: [kelimeEmbed] });
                    console.log('✅ #🧩・kelime-oyunu paneli Nights olarak güncellendi!');
                }
                catch (err) {
                    console.warn('Kelime kanalı güncellenemedi:', err.message);
                }
            }
            // 6. #🎯・click-me GÜNCELLEME
            console.log('\n--- 6. Click Me Etkinlik Kanalı Güncelleniyor ---');
            const clickChannel = channels.find((c) => c?.name.includes('click-me'));
            if (clickChannel && clickChannel.isTextBased()) {
                try {
                    const msgs = await clickChannel.messages.fetch({ limit: 10 });
                    for (const m of msgs.values()) {
                        if (m.author.id === client.user?.id)
                            await m.delete().catch(() => { });
                    }
                    const eventEmbed = new discord_js_1.EmbedBuilder()
                        .setTitle('🎯 NIGHTS 30 TIKLAMA BÜYÜK EVENTİ!')
                        .setDescription('Aşağıdaki butona **ilk tıklayan 30 üye** sunucunun özel rolünü ve Nights Coin ödüllerini kazanıyor!\n\n' +
                        '> ⚡ *Her üye yalnızca 1 kez tıklayabilir. Acele et, kontenjan dolmadan yerini kap!*')
                        .setColor('#E74C3C')
                        .setFooter({ text: 'Nights Topluluk Etkinlikleri • Made by erencix' })
                        .setTimestamp();
                    const eventRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('btn_event_click').setLabel('Tıkla ve Kazan!').setEmoji('🎯').setStyle(discord_js_1.ButtonStyle.Success));
                    await clickChannel.send({ embeds: [eventEmbed], components: [eventRow] });
                    console.log('✅ #🎯・click-me paneli Nights olarak güncellendi!');
                }
                catch (err) {
                    console.warn('Click-me kanalı güncellenemedi:', err.message);
                }
            }
            // 7. #📖・muzik-bilgi GÜNCELLEME
            console.log('\n--- 7. Müzik Bilgi Kanalı Güncelleniyor ---');
            const muzikBilgiChannel = channels.find((c) => c?.name.includes('muzik-bilgi'));
            if (muzikBilgiChannel && muzikBilgiChannel.isTextBased()) {
                try {
                    const msgs = await muzikBilgiChannel.messages.fetch({ limit: 10 });
                    for (const m of msgs.values()) {
                        if (m.author.id === client.user?.id)
                            await m.delete().catch(() => { });
                    }
                    const muzikEmbed = new discord_js_1.EmbedBuilder()
                        .setTitle('📖 NIGHTS MÜZİK KILAVUZU & KOMUTLARI 🎶')
                        .setDescription('Ses kanallarında yüksek ses kalitesi ve YouTube entegrasyonuyla kesintisiz müzik keyfi!\n\n' +
                        '### ⚡ Müzik Komutları:\n' +
                        '• `/cal <şarkı>` — YouTube üzerinden şarkıyı arar ve seste çalar\n' +
                        '• `/durdur` — Çalan müziği duraklatır\n' +
                        '• `/devam` — Duraklatılan müziği sürdürür\n' +
                        '• `/gec` — Sıradaki parçaya atlar\n' +
                        '• `/kuyruk` — Mevcut çalma listesini gösterir\n' +
                        '• `/ayril` — Botu ses odasından çıkarır\n\n' +
                        '> 💡 *Ses kanalınızı yönetmek, kullanıcı limiti veya bitrate ayarlamak için \`#🎛️・ses-paneli\` kanalını kullanabilirsiniz.*')
                        .setColor('#1DB954')
                        .setFooter({ text: 'Nights Müzik Sistemi • Made by erencix' })
                        .setTimestamp();
                    await muzikBilgiChannel.send({ embeds: [muzikEmbed] });
                    console.log('✅ #📖・muzik-bilgi kanalı Nights olarak güncellendi!');
                }
                catch (err) {
                    console.warn('Müzik bilgi kanalı güncellenemedi:', err.message);
                }
            }
            // 8. #🎰・owo-gambling-2 GÜNCELLEME
            console.log('\n--- 8. OwO Gambling Kanalı Güncelleniyor ---');
            const owoChannel = channels.find((c) => c?.name.includes('owo-gambling-2'));
            if (owoChannel && owoChannel.isTextBased()) {
                try {
                    const msgs = await owoChannel.messages.fetch({ limit: 10 });
                    for (const m of msgs.values()) {
                        if (m.author.id === client.user?.id)
                            await m.delete().catch(() => { });
                    }
                    const owoEmbed = new discord_js_1.EmbedBuilder()
                        .setTitle('🎰 NIGHTS OWO & OYUN ODASI')
                        .setDescription('Bu kanal OwO ve mini oyun komutları için ayrılmıştır.\nDiğer genel sohbet kanallarında flood oluşmaması için lütfen oyun komutlarını burada kullanın.')
                        .setColor('#F39C12')
                        .setFooter({ text: 'Nights Oyun Alanı • Made by erencix' })
                        .setTimestamp();
                    await owoChannel.send({ embeds: [owoEmbed] });
                    console.log('✅ #🎰・owo-gambling-2 kanalı Nights olarak güncellendi!');
                }
                catch (err) {
                    console.warn('OwO kanalı güncellenemedi:', err.message);
                }
            }
            console.log('\n🎉 TÜM PANELLER, KONULAR VE EMBEDLER NIGHTS OLARAK GÜNCELLENDİ!');
        }
        catch (err) {
            console.error('Hata:', err);
        }
        finally {
            await client.destroy();
            process.exit(0);
        }
    });
    await client.login(config_1.config.discordToken);
}
main().catch(console.error);
