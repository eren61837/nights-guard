import {
  Client,
  GatewayIntentBits,
  ChannelType,
  EmbedBuilder,
} from 'discord.js';
import { config } from '../config';

const TARGET_GUILD_ID = '1568618183223414934'; // Prayt

async function optimizeLayout() {
  console.log('🚀 Sunucu düzeni optimize ediliyor (Ses kategorisi taşınıyor, sesler sadeleştiriliyor, kurallar baştan yazılıyor)...');

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  await client.login(config.discordToken);

  const guild = await client.guilds.fetch(TARGET_GUILD_ID);
  if (!guild) {
    console.error('Sunucu bulunamadı!');
    process.exit(1);
  }

  const channels = await guild.channels.fetch();

  // 1. Kategorilerin Sıralamasını Düzenle
  // 1: GİRİŞ & KAYIT, 2: BİLGİLENDİRME, 3: TOPLULUK & SOHBET, 4: SES ODALARI (Hemen Sohbetin Altında!), 5: OYUN ALANI, 6: YETKİLİ ÖZEL
  console.log('📁 Kategoriler yeniden sıralanıyor...');
  const catRegister = channels.find((c) => c?.type === ChannelType.GuildCategory && c.name.includes('GİRİŞ & KAYIT'));
  const catInfo = channels.find((c) => c?.type === ChannelType.GuildCategory && c.name.includes('BİLGİLENDİRME'));
  const catChat = channels.find((c) => c?.type === ChannelType.GuildCategory && c.name.includes('TOPLULUK'));
  const catVoice = channels.find((c) => c?.type === ChannelType.GuildCategory && c.name.includes('SES ODALARI'));
  const catGaming = channels.find((c) => c?.type === ChannelType.GuildCategory && c.name.includes('OYUN ALANI'));
  const catStaff = channels.find((c) => c?.type === ChannelType.GuildCategory && c.name.includes('YETKİLİ ÖZEL'));

  const catOrder = [catRegister, catInfo, catChat, catVoice, catGaming, catStaff].filter(Boolean) as any[];

  for (let i = 0; i < catOrder.length; i++) {
    try {
      await catOrder[i].setPosition(i);
      console.log(`  -> Kategori sırası: ${catOrder[i].name} (Sıra: ${i})`);
      await new Promise((r) => setTimeout(r, 200));
    } catch (e: any) {
      console.warn(`Kategori taşınamadı (${catOrder[i].name}):`, e.message);
    }
  }

  // 2. Fazla ve Kalabalık Yapan Ses Kanallarını Temizle
  console.log('🔊 Fazla ses kanalları sadeleştiriliyor...');
  const removeVoiceNames = [
    'Duo 1',
    'Duo 2',
    'Trio',
    'Squad',
    'Valorant 5v5',
    'CS2 Rekabetçi',
    'Sohbet Odası 3',
  ];

  for (const [, ch] of channels) {
    if (ch && ch.isVoiceBased()) {
      if (removeVoiceNames.some((n) => ch.name.includes(n))) {
        try {
          await ch.delete('Ses kanalları sadeleştirme');
          console.log(`  -> Kalabalık yapan ses kanalı silindi: ${ch.name}`);
          await new Promise((r) => setTimeout(r, 200));
        } catch (e: any) {
          console.warn(`Ses kanalı silinemedi (${ch.name}):`, e.message);
        }
      }
    }
  }

  // 3. #kurallar Kanalını Sil baştan Şaheser Düzeyine Getir
  console.log('📜 #kurallar kanalı şaheser seviyesine güncelleniyor...');
  const chKurallar = channels.find((c) => c && c.name.includes('kurallar') && c.isTextBased());
  if (chKurallar && chKurallar.isTextBased()) {
    // Önceki mesajları temizle
    try {
      const msgs = await (chKurallar as any).messages.fetch({ limit: 20 });
      for (const [, m] of msgs) {
        await m.delete();
        await new Promise((r) => setTimeout(r, 150));
      }
    } catch (e) {}

    // 1. Kural Başlığı & Karşılama Embedi
    const embedHeader = new EmbedBuilder()
      .setTitle('🛡️ PRAYT TOPLULUK ANA YASASI & SUNUCU KURALLARI 📜')
      .setDescription(
        '**Prayt** sunucumuza hoş geldiniz!\n' +
        'Burası oyun, dostluk ve saygı çerçevesinde bir araya gelmiş seçkin bir topluluktur.\n' +
        'Sunucuda bulunan ve kayıt olan **her üye** aşağıdaki kuralları okumuş, anlamış ve kabul etmiş sayılır.\n\n' +
        '> ⚠️ *Kuralları bilmemek bir mazeret değildir. Güvenlik sistemimiz ve yetkili kadromuz tarafından ihlaller titizlikle denetlenmektedir.*'
      )
      .setImage('https://media.giphy.com/media/26tn3334mvoVClhos/giphy.gif')
      .setColor('#FF0055');

    // 2. Detaylı Kural Maddeleri Embedi
    const embedRules = new EmbedBuilder()
      .setTitle('⚖️ RESMİ TOPLULUK MADDELERİ')
      .setColor('#9B59B6')
      .addFields(
        {
          name: '💬 1. Genel Ahlak, Saygı & Üslup',
          value:
            '• Sunucu içerisinde herhangi bir şahsa, dine, dile, ırka veya etnik kökene hakaret, aşağılama kesinlikle **yasaktır**.\n' +
            '• Ailevi değerlere küfür, kişisel saldırı ve provokasyon doğrudan sunucudan **uzaklaştırma** sebebidir.\n' +
            '• Üyeleri DM (özel mesaj) üzerinden rahatsız etmek, taciz etmek veya tehdit etmek **kalıcı ban** ile sonuçlanır.',
          inline: false,
        },
        {
          name: '🚫 2. Reklam, Tanıtım & Ticaret Yasağı',
          value:
            '• Sunucu içi kanallardan veya üyelere gizlice DM yoluyla başka Discord sunucu daveti atmak **KESİNLİKLE YASAKTIR**.\n' +
            '• Yetkililerden izin almadan herhangi bir ürün, hesap veya hizmet satışı/pazarlaması yapılamaz.\n' +
            '• Reklam yapan hesaplar Prayt Guard koruma motoru tarafından anında tespit edilip engellenir.',
          inline: false,
        },
        {
          name: '⌨️ 3. Chat & Medya Kullanım Kuralları',
          value:
            '• Kanallarda aşırı büyük harf kullanımı (CAPS), flood, satır doldurma ve spam yapmak yasaktır.\n' +
            '• Kanallar amaçları doğrultusunda kullanılmalıdır:\n' +
            '  └ Resim & Klipler ➔ `#foto-medya`\n' +
            '  └ Bot komutları ➔ `#bot-komut`\n' +
            '  └ Takım arkadaşı arama ➔ `#oyun-arkadasi-bul`\n' +
            '• Siyasi, ideolojik veya kışkırtıcı tartışmalar başlatmak yasaktır.',
          inline: false,
        },
        {
          name: '🔊 4. Ses Kanalları & Mikrofon Etiği',
          value:
            '• Ses kanallarında kulak tırmalayıcı ses efektleri, desibel basma veya ses değiştirici (Voice Changer) kullanmak yasaktır.\n' +
            '• Kullanıcıların rızası olmadan ses kaydı almak veya özel hayatın gizliliğini ihlal etmek kalıcı ban sebebidir.\n' +
            '• Müzik kanallarında diğer dinleyicileri rahatsız edecek şekilde ses seviyesini suiistimal etmeyiniz.',
          inline: false,
        },
        {
          name: '🔞 5. Yaş & İçerik Kısıtlaması (+18 / NSFW)',
          value:
            '• Sunucunun hiçbir kanalında veya ses odasında cinsel içerik, pornografi, kan/vahşet (+18 NSFW) paylaşılamaz.\n' +
            '• Yasa dışı bahis, kumar veya zararlı yazılım/link paylaşımı sıfır toleransla doğrudan yasaklanır.',
          inline: false,
        },
        {
          name: '🔨 6. Yaptırımlar & Yetkili İletişimi',
          value:
            '• Kurallara uyulmaması durumunda uygulanacak yaptırımlar:\n' +
            '  **1. Derece:** Sözlü Uyarı\n' +
            '  **2. Derece:** Süreli Susturma / Zaman Aşımı (Timeout)\n' +
            '  **3. Derece:** Mute / Cezalı Rolü\n' +
            '  **4. Derece:** Sunucudan Kalıcı Olarak Yasaklanma (Ban)\n\n' +
            '• Herhangi bir şikayet, soru veya destek talebinizde yetkililerimize danışabilirsiniz.',
          inline: false,
        }
      )
      .setFooter({ text: 'Prayt Guard • Resmi Topluluk Kuralları • Made by erencix' })
      .setTimestamp();

    await (chKurallar as any).send({ embeds: [embedHeader, embedRules] });
    console.log('✅ #kurallar kanalı şaheser kalitesinde yenilendi!');
  }

  console.log('🎉 TÜM DÜZENLEMELER BAŞARIYLA TAMAMLANDI!');
  client.destroy();
}

optimizeLayout().catch(console.error);
