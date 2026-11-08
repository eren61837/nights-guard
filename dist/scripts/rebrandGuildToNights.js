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
    console.log('🌙 Sunucu Mimarisi & Markası "Nights" Olarak Yenileniyor...');
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
            console.log(`🏰 Mevcut Sunucu: ${guild.name} (ID: ${guild.id})`);
            // 1. SUNUCU İSMİNİ "Nights" YAP
            console.log('\n--- 1. Sunucu İsmi Güncelleniyor ---');
            await guild.setName('Nights', 'Sunucu yeniden markalandı: Nights');
            console.log('✅ Sunucu ismi "Nights" yapıldı!');
            // 2. SUNUCU LOGOSUNU AYARLA
            console.log('\n--- 2. Sunucu Logosu Uygulanıyor ---');
            const logoPath = path_1.default.resolve('assets/nights_logo.jpg');
            if (fs_1.default.existsSync(logoPath)) {
                const logoBuffer = fs_1.default.readFileSync(logoPath);
                await guild.setIcon(logoBuffer, 'Yeni Nights 512x512 Logosu');
                console.log('✅ Sunucu logosu başarıyla 512x512 Nights ikonu olarak güncellendi!');
            }
            else {
                console.warn('⚠️ assets/nights_logo.jpg bulunamadı.');
            }
            // 3. BOT ROLÜ & TAKMA AD
            console.log('\n--- 3. Bot Rolü ve Nickname Güncelleniyor ---');
            const roles = await guild.roles.fetch();
            const botRole = roles.find((r) => r.name.toLowerCase().includes('prayt guard'));
            if (botRole) {
                try {
                    await botRole.setName('Nights Guard');
                    console.log(`✅ Bot rolü "${botRole.name}" -> "Nights Guard" olarak güncellendi!`);
                }
                catch (rErr) {
                    console.log(`ℹ️ Bot entegrasyon rolü Discord tarafından kilitli (${rErr.message}), takma ad ile devam ediliyor.`);
                }
            }
            const me = await guild.members.fetchMe().catch(() => null);
            if (me) {
                try {
                    await me.setNickname('Nights Guard');
                    console.log('✅ Bot sunucu takma adı "Nights Guard" olarak ayarlandı!');
                }
                catch (e) {
                    console.warn('Bot takma adı ayarlanamadı:', e.message);
                }
            }
            // 4. ÇIKARTMALARIN İSİMLERİNİ GÜNCELLE
            console.log('\n--- 4. Çıkartmaların (Stickers) İsimleri Güncelleniyor ---');
            const stickers = await guild.stickers.fetch();
            const stickerRenameMap = {
                prayt_party: 'Nights_Party',
                prayt_fire: 'Nights_Fire',
                prayt_cool: 'Nights_Cool',
                prayt_gaming: 'Nights_Gaming',
                prayt_trophy: 'Nights_Trophy',
            };
            for (const st of stickers.values()) {
                const lower = st.name.toLowerCase();
                if (stickerRenameMap[lower]) {
                    const newName = stickerRenameMap[lower];
                    try {
                        await st.edit({ name: newName, description: `${newName} Sticker` });
                        console.log(`✅ Çıkartma güncellendi: ${st.name} -> ${newName}`);
                    }
                    catch (err) {
                        console.warn(`Çıkartma düzenlenemedi (${st.name}):`, err.message);
                    }
                }
            }
            // 5. KANALLARI KONTROL ET
            console.log('\n--- 5. Kanal İsimleri Kontrol Ediliyor ---');
            const channels = await guild.channels.fetch();
            for (const ch of channels.values()) {
                if (ch && ch.name.toLowerCase().includes('prayt')) {
                    const newChName = ch.name.replace(/prayt/gi, 'nights');
                    await ch.setName(newChName);
                    console.log(`✅ Kanal yeniden adlandırıldı: ${ch.name} -> ${newChName}`);
                }
            }
            // 6. #⭐・seviye-rol-bilgi KANALINI GÜNCELLE
            console.log('\n--- 6. Seviye Rol Bilgi Kanalı Güncelleniyor ---');
            const levelChannel = channels.get('1568644559615954964');
            if (levelChannel && levelChannel.isTextBased()) {
                try {
                    const msgs = await levelChannel.messages.fetch({ limit: 10 });
                    for (const m of msgs.values()) {
                        if (m.author.id === client.user?.id)
                            await m.delete().catch(() => { });
                    }
                    const role5 = roles.find((r) => r.name.includes('Level 5'));
                    const role10 = roles.find((r) => r.name.includes('Level 10'));
                    const role20 = roles.find((r) => r.name.includes('Level 20'));
                    const role30 = roles.find((r) => r.name.includes('Level 30'));
                    const role50 = roles.find((r) => r.name.includes('Level 50'));
                    const levelInfoEmbed = new discord_js_1.EmbedBuilder()
                        .setTitle('⭐ NIGHTS SEVİYE & ROL BİLGİLENDİRME SİSTEMİ 🏆')
                        .setDescription('**Nights** sunucumuzda metin kanallarında sohbet ettikçe otomatik olarak **XP** kazanır, seviyenizi yükseltir ve özel unvan rollerinin kilidini açarsınız!\n\n' +
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
                        '• `/rank [kullanıcı]` veya `!rank` — Kendi seviye kartınızı, mevcut XP ve kalan deneyiminizi gösterir.\n' +
                        '• `/top` veya `!top` — Sunucunun en aktif üyelerini listeleyen canlı Liderlik Tablosu.\n\n' +
                        '> 💡 **Nasıl XP Kazanılır?**\n' +
                        '> *Metin kanallarında her 60 saniyede bir attığınız anlamlı mesajlar size 15-25 XP kazandırır.*\n' +
                        '> *Spam, alt başlık suistimali veya flood koruma sistemimiz tarafından engellenir ve XP vermez.*')
                        .setColor('#6C5CE7')
                        .setFooter({ text: 'Nights Community Rewards • Made by erencix' })
                        .setTimestamp();
                    await levelChannel.send({ embeds: [levelInfoEmbed] });
                    console.log('✅ #⭐・seviye-rol-bilgi kanalı güncellendi!');
                }
                catch (err) {
                    console.warn('Seviye kanalı güncellenemedi:', err.message);
                }
            }
            // 7. #🎛️・ses-paneli KANALINI GÜNCELLE
            console.log('\n--- 7. Ses Paneli Kanalı Güncelleniyor ---');
            const voiceChannel = channels.get('1568654013405204701');
            if (voiceChannel && voiceChannel.isTextBased()) {
                try {
                    const msgs = await voiceChannel.messages.fetch({ limit: 10 });
                    for (const m of msgs.values()) {
                        if (m.author.id === client.user?.id)
                            await m.delete().catch(() => { });
                    }
                    const voiceEmbed = new discord_js_1.EmbedBuilder()
                        .setTitle('🎛️ NIGHTS SES KONTROL STÜDYOSU 🎙️')
                        .setDescription('Aşağıdaki butonları kullanarak size ait özel dinamik ses kanalını profesyonelce yönetin.\n\n' +
                        '🔒 **Odayı Kilitle:** Kanalı siz ve odadakiler dışındaki herkese kapatır.\n' +
                        '🔓 **Kilidi Aç:** Odayı tekrar sunucu üyelerinin girişine açar.\n' +
                        '👁️ **Odayı Gizle/Göster:** Kanalı diğer üyelerden gizler veya görünür yapar.\n' +
                        '👥 **Kullanıcı Limiti:** Ses kanalına girebilecek kişi sınırını ayarlar.\n' +
                        '✏️ **Oda İsmi Değiştir:** Kanalınızın adını istediğiniz gibi özelleştirin.\n' +
                        '🔇 **Oda Susturma:** Odadaki diğer kullanıcıların mikrofonunu yönetin.\n' +
                        '⚡ **Bitrate Artır:** Ses kalitesini sunucu maksimumuna yükseltir.\n' +
                        '👑 **Odayı Sahiplen:** Sahibi çıkmış bir odanın yönetimini devralın.\n' +
                        'ℹ️ **Oda Bilgisi:** Mevcut odanın teknik ve yetki detaylarını gösterir.\n' +
                        '➕ **Yeni Oda Oluştur:** Sizin adınıza anında yeni bir geçici ses kanalı kurar.')
                        .setColor('#0984E3')
                        .setFooter({ text: 'Nights Ses Odaları • Made by erencix' })
                        .setTimestamp();
                    const row1 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('btn_voice_lock').setLabel('Kilitle').setEmoji('🔒').setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder().setCustomId('btn_voice_unlock').setLabel('Aç').setEmoji('🔓').setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder().setCustomId('btn_voice_hide').setLabel('Gizle/Göster').setEmoji('👁️').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('btn_voice_limit').setLabel('Limit').setEmoji('👥').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId('btn_voice_rename').setLabel('İsim Değiştir').setEmoji('✏️').setStyle(discord_js_1.ButtonStyle.Primary));
                    const row2 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('btn_voice_mute').setLabel('Sustur').setEmoji('🔇').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('btn_voice_bitrate').setLabel('Bitrate').setEmoji('⚡').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('btn_voice_claim').setLabel('Sahiplen').setEmoji('👑').setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder().setCustomId('btn_voice_info').setLabel('Oda Bilgisi').setEmoji('ℹ️').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('btn_voice_create').setLabel('Yeni Oda').setEmoji('➕').setStyle(discord_js_1.ButtonStyle.Success));
                    await voiceChannel.send({ embeds: [voiceEmbed], components: [row1, row2] });
                    console.log('✅ #🎛️・ses-paneli kanalı güncellendi!');
                }
                catch (err) {
                    console.warn('Ses paneli güncellenemedi:', err.message);
                }
            }
            // 8. #📜・kurallar KANALINI GÜNCELLE
            console.log('\n--- 8. Kurallar Kanalı Güncelleniyor ---');
            const rulesChannel = channels.find((c) => c?.name.includes('kural'));
            if (rulesChannel && rulesChannel.isTextBased()) {
                try {
                    const msgs = await rulesChannel.messages.fetch({ limit: 10 });
                    for (const m of msgs.values()) {
                        if (m.author.id === client.user?.id)
                            await m.delete().catch(() => { });
                    }
                    const rulesEmbed = new discord_js_1.EmbedBuilder()
                        .setTitle('📜 NIGHTS TOPLULUK KURALLARI')
                        .setDescription('**Nights** sunucumuza hoş geldiniz! Topluluğumuzda herkesin keyifli ve güvenli vakit geçirmesi için aşağıdaki kurallara uyulması zorunludur:\n\n' +
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
                        '🛡️ *Nights Guard sistemi ve yetkili kadromuz sunucu düzenini 7/24 aktif olarak denetlemektedir.*')
                        .setColor('#2C3E50')
                        .setFooter({ text: 'Nights Discord Topluluğu • Made by erencix' })
                        .setTimestamp();
                    await rulesChannel.send({ embeds: [rulesEmbed] });
                    console.log(`✅ ${rulesChannel.name} kanalı güncellendi!`);
                }
                catch (err) {
                    console.warn('Kurallar kanalı güncellenemedi:', err.message);
                }
            }
            // 9. #🎫・bilet-oluştur KANALINI GÜNCELLE
            console.log('\n--- 9. Destek (Ticket) Kanalı Güncelleniyor ---');
            const ticketChannel = channels.find((c) => c?.name.includes('bilet') || c?.name.includes('destek'));
            if (ticketChannel && ticketChannel.isTextBased()) {
                try {
                    const msgs = await ticketChannel.messages.fetch({ limit: 10 });
                    for (const m of msgs.values()) {
                        if (m.author.id === client.user?.id)
                            await m.delete().catch(() => { });
                    }
                    const ticketEmbed = new discord_js_1.EmbedBuilder()
                        .setTitle('🎫 NIGHTS DESTEK & TICKET MERKEZİ')
                        .setDescription('Sunucumuzla ilgili her türlü soru, şikayet, öneri veya yetkili başvurusu için destek talebi oluşturabilirsiniz.\n\n' +
                        '📌 **Nasıl Çalışır?**\n' +
                        'Aşağıdaki **"📩 Destek Talebi Aç"** butonuna tıkladığınızda yalnızca sizin ve yetkili ekibimizin görebileceği özel bir bilet kanalı açılır.\n\n' +
                        '> ⚠️ *Gereksiz yere bilet açmak veya yetkilileri meşgul etmek uyarılmanıza sebep olabilir.*')
                        .setColor('#5865F2')
                        .setFooter({ text: 'Nights Destek Sistemi • Made by erencix' })
                        .setTimestamp();
                    const ticketRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('ticket_open').setLabel('Destek Talebi Aç').setEmoji('📩').setStyle(discord_js_1.ButtonStyle.Primary));
                    await ticketChannel.send({ embeds: [ticketEmbed], components: [ticketRow] });
                    console.log(`✅ ${ticketChannel.name} kanalı güncellendi!`);
                }
                catch (err) {
                    console.warn('Ticket kanalı güncellenemedi:', err.message);
                }
            }
            console.log('\n🎉 SUNUCU MARKASI VE LOGOSU BAŞARIYLA "NIGHTS" OLARAK GÜNCELLENDİ!');
        }
        catch (err) {
            console.error('Hata oluştu:', err);
        }
        finally {
            await client.destroy();
            process.exit(0);
        }
    });
    await client.login(config_1.config.discordToken);
}
main().catch(console.error);
