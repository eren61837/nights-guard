"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const discord_js_1 = require("discord.js");
const config_1 = require("../config");
async function restorePanels() {
    console.log('Bot başlatılıyor, müzik panelleri Nights Guard sistemine geri döndürülüyor...');
    const client = new discord_js_1.Client({
        intents: [discord_js_1.GatewayIntentBits.Guilds, discord_js_1.GatewayIntentBits.GuildMessages],
    });
    await client.login(config_1.config.discordToken);
    const guild = await client.guilds.fetch('1568618183223414934');
    if (!guild) {
        console.error('Sunucu bulunamadı!');
        client.destroy();
        return;
    }
    // Helper to purge messages
    const clearChannel = async (ch) => {
        try {
            const messages = await ch.messages.fetch({ limit: 100 });
            if (messages.size > 0) {
                await ch.bulkDelete(messages, true).catch(async () => {
                    for (const [, msg] of messages) {
                        await msg.delete().catch(() => { });
                    }
                });
            }
        }
        catch (e) {
            console.warn(`Hata: ${e.message}`);
        }
    };
    // 1. #muzik-komut
    const muzikKomutCh = (await guild.channels.fetch('1568649342154182707').catch(() => null));
    if (muzikKomutCh) {
        console.log('Temizleniyor: #muzik-komut');
        await clearChannel(muzikKomutCh);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('🎵 NIGHTS GUARD HI-FI MÜZİK STÜDYOSU 🎧')
            .setDescription('**384kbps kristal netliğinde ses** ve **YouTube & SoundCloud çift motorlu kesintisiz altyapı** ile sunucumuzda müzik keyfi başladı!\n\n' +
            '### 📌 Hızlı Şarkı Başlatma:\n' +
            '• `/cal <şarkı adı veya link>` — YouTube veya parça adını yazarak anında açabilirsiniz.\n' +
            '• `!cal <şarkı>` veya `!play <şarkı>` — Hızlı metin komutu ile şarkıyı başlatır.\n\n' +
            '### 🎛️ İnteraktif Kumanda Butonları:\n' +
            'Aşağıdaki butonları kullanarak çalan parçayı tek tıkla duraklatabilir, geçebilir, döngüye alabilir veya sesini ayarlayabilirsiniz.\n\n' +
            '> 💡 *YouTube engellerine karşı otomatik SoundCloud yedek motoru devrededir; hiçbir şarkı yanıtsız kalmaz!*')
            .setImage('https://media.giphy.com/media/26tn3334mvoVClhos/giphy.gif')
            .setColor('#8B5CF6')
            .setFooter({ text: 'Nights Guard Audio Engine • Made by erencix' });
        const row1 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('btn_music_play_pause').setLabel('Oynat / Duraklat').setEmoji('⏯️').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId('btn_music_skip').setLabel('Geç').setEmoji('⏭️').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('btn_music_stop').setLabel('Durdur & Ayrıl').setEmoji('⏹️').setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder().setCustomId('btn_music_loop').setLabel('Döngü').setEmoji('🔁').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('btn_music_queue').setLabel('Sıra').setEmoji('📜').setStyle(discord_js_1.ButtonStyle.Secondary));
        const row2 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('btn_music_vol_down').setLabel('Ses -%10').setEmoji('🔉').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('btn_music_vol_up').setLabel('Ses +%10').setEmoji('🔊').setStyle(discord_js_1.ButtonStyle.Secondary));
        await muzikKomutCh.send({ embeds: [embed], components: [row1, row2] });
        console.log('✅ #muzik-komut paneli Nights Guard kumandasıyla yenilendi!');
    }
    // 2. #muzik-bilgi
    const muzikBilgiCh = (await guild.channels.fetch('1568654003481477212').catch(() => null));
    if (muzikBilgiCh) {
        console.log('Temizleniyor: #muzik-bilgi');
        await clearChannel(muzikBilgiCh);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('📖 NIGHTS GUARD MÜZİK SİSTEMİ REHBERİ')
            .setDescription('Nights Guard müzik motoru, sunucumuzda en akıcı ve yüksek kaliteli ses deneyimini sunmak üzere tasarlandı.\n\n' +
            '### ⚡ Desteklenen Komutlar:\n' +
            '• `/cal <şarkı>` veya `!cal <şarkı>` — Şarkı arar ve ses kanalında çalar.\n' +
            '• `/durdur` veya `!durdur` — Çalan müziği duraklatır.\n' +
            '• `/devam` veya `!devam` — Duraklatılan müziği sürdürür.\n' +
            '• `/gec` veya `!gec` — Sıradaki parçaya atlar.\n' +
            '• `/kuyruk` veya `!kuyruk` — Çalma sırasındaki bekleyen parçaları listeler.\n' +
            '• `/ayril` veya `!ayril` — Botu ses kanalından çıkarır ve listeyi sıfırlar.\n' +
            '• `/ses <1-150>` veya `!ses <1-150>` — Ses seviyesini hassas olarak ayarlar.\n\n' +
            '### 🛡️ Akıllı Çift Motor (YouTube + SoundCloud):\n' +
            'Herhangi bir YouTube parçasında veri merkezi kısıtlaması yaşanırsa bot anında **SoundCloud High-Fi** yedeğine geçiş yapar ve kesintisiz çalmaya devam eder.')
            .setColor('#5865F2')
            .setFooter({ text: 'Nights Guard • Made by erencix' });
        await muzikBilgiCh.send({ embeds: [embed] });
        console.log('✅ #muzik-bilgi rehberi Nights Guard olarak güncellendi!');
    }
    client.destroy();
    console.log('🎉 TÜM MÜZİK PANELLERİ BAŞARIYLA YENİLENDİ!');
}
restorePanels().catch(console.error);
