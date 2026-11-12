import dotenv from 'dotenv';
dotenv.config();

import { Client, GatewayIntentBits, TextChannel, PermissionFlagsBits } from 'discord.js';
import { config } from '../config';

const TARGET_GUILD_ID = '1568618183223414934';

async function main() {
  console.log('🎨 [Premium Panel Upgrade] Başlatılıyor...');

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages],
  });

  await client.login(config.discordToken);

  const guild = await client.guilds.fetch({ guild: TARGET_GUILD_ID, force: true });
  console.log(`✅ Sunucuya bağlanıldı: ${guild.name}`);

  const channels = await guild.channels.fetch();

  // 1. Boost kanalındaki fazla/çift mesajları temizle
  const boostCh = channels.find((c) => c && c.isTextBased() && c.name.includes('boost')) as TextChannel | undefined;
  if (boostCh) {
    console.log(`\n🚀 #${boostCh.name} kanalındaki fazla boost vitrinleri temizleniyor...`);
    try {
      const msgs = await boostCh.messages.fetch({ limit: 20 });
      const botMsgs = Array.from(msgs.values()).filter((m) => m.author.id === client.user!.id);
      console.log(`  Bulunan bot mesajı: ${botMsgs.length}`);
      if (botMsgs.length > 1) {
        // En son atılanı bırak, eskilerini sil
        for (let i = 1; i < botMsgs.length; i++) {
          await botMsgs[i].delete().catch(() => {});
          console.log(`  🗑️ Eski çift boost mesajı silindi: ${botMsgs[i].id}`);
          await new Promise((r) => setTimeout(r, 400));
        }
      }
    } catch (e: any) {
      console.warn(`  ⚠️ Boost temizleme hatası:`, e.message);
    }
  }

  // 2. Kayıt kanallarındaki ESKİ mesajları temizle
  const targetChannelNames = ['dil-secimi', 'kayit-onay', 'registration', 'cinsiyet-secimi'];

  for (const chName of targetChannelNames) {
    const ch = channels.find((c) => c && c.isTextBased() && c.name.includes(chName)) as TextChannel | undefined;
    if (!ch) continue;

    console.log(`\n🗑️ #${ch.name} kanalındaki eski mesajlar temizleniyor...`);
    try {
      const msgs = await ch.messages.fetch({ limit: 50 });
      for (const [, msg] of msgs) {
        if (msg.author.id === client.user!.id) {
          await msg.delete().catch(() => {});
          await new Promise((r) => setTimeout(r, 300));
        }
      }
      console.log(`  ✅ #${ch.name} temizlendi.`);
    } catch (err: any) {
      console.warn(`  ⚠️ #${ch.name} temizlenirken hata:`, err.message);
    }
  }

  // 3. cinsiyet-secimi kanalını HERKESTEN gizle (Artık doğrudan kayit-onay kullanılıyor)
  const cinsiyetCh = channels.find((c) => c && c.isTextBased() && c.name.includes('cinsiyet-secimi')) as TextChannel | undefined;
  if (cinsiyetCh) {
    console.log(`\n🔒 #${cinsiyetCh.name} kanalı tamamen gizleniyor...`);
    const everyoneRole = guild.roles.everyone;
    await cinsiyetCh.permissionOverwrites.edit(everyoneRole.id, {
      ViewChannel: false,
      SendMessages: false,
    }).catch(() => {});
    console.log(`  ✅ #${cinsiyetCh.name} kanalı gizlendi!`);
  }

  // 4. Yeni tek parça lüks panelleri yükle
  console.log('\n🚀 Yeni tek parça lüks paneller yükleniyor...');

  const { LanguageGateManager } = await import('../services/features/languageGateManager');

  // Rolleri garantile
  await LanguageGateManager.ensureRoles(guild);

  // Dil Seçim Paneli
  const langCh = channels.find((c) => c && c.isTextBased() && c.name.includes('dil-secimi')) as TextChannel | undefined;
  if (langCh) {
    await LanguageGateManager.sendLanguagePanel(langCh);
    console.log('  ✅ Tek parça Dil Seçim Paneli yüklendi!');
  }

  // Türkçe Kayıt Paneli
  const kayitCh = channels.find((c) => c && c.isTextBased() && c.name.includes('kayit-onay')) as TextChannel | undefined;
  if (kayitCh) {
    await LanguageGateManager.sendTurkishRegistrationPanel(kayitCh);
    console.log('  ✅ Tek parça Türkçe Kayıt Paneli yüklendi!');
  }

  // İngilizce Kayıt Paneli
  const regCh = channels.find((c) => c && c.isTextBased() && c.name.includes('registration')) as TextChannel | undefined;
  if (regCh) {
    await LanguageGateManager.sendEnglishRegistrationPanel(regCh);
    console.log('  ✅ Tek parça İngilizce Kayıt Paneli yüklendi!');
  }

  console.log('\n🎉 TÜM PANELLER VE BOOST DÜZENLEMELERİ BAŞARIYLA TAMAMLANDI!');
  client.destroy();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Hata:', err);
  process.exit(1);
});
