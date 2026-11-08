import { Client, ActivityType } from 'discord.js';
import * as aiKurCmd from '../commands/aiKur';
import * as aiLogoCmd from '../commands/aiLogo';
import * as aiOnizleCmd from '../commands/aiOnizle';
import * as sunucuTemizleCmd from '../commands/sunucuTemizle';
import * as yardimCmd from '../commands/yardim';
import * as planCmd from '../commands/plan';
import * as boostCmd from '../commands/boost';
import * as teamworkCmd from '../commands/teamwork';
import * as browserCmd from '../commands/browser';
import * as davetCmd from '../commands/davet';
import * as mesajGonderCmd from '../commands/mesajGonder';
import * as silCmd from '../commands/sil';
import * as avatarCmd from '../commands/avatar';
import * as sunucuCmd from '../commands/sunucu';
import * as afkCmd from '../commands/afk';
import * as istatistikCmd from '../commands/istatistik';
import * as kullaniciCmd from '../commands/kullanici';
import * as gonderCmd from '../commands/gonder';
import * as itirafCmd from '../commands/itiraf';
import * as muzikCmd from '../commands/muzik';
import { rankData, topData, seviyeAyarlaData } from '../commands/seviye';
import { LevelManager } from '../services/features/levelManager';

export async function onReady(client: Client): Promise<void> {
  console.log(`\n======================================================`);
  console.log(`🛡️ NIGHTS GUARD (Made by erencix) ÇALIŞIYOR!`);
  console.log(`👤 Bot: ${client.user?.tag} (${client.user?.id})`);
  console.log(`🌐 Bağlı Sunucu Sayısı: ${client.guilds.cache.size}`);
  console.log(`======================================================\n`);

  // Dinamik ve zengin dönen durum (Rotating Rich Presence)
  const activities = [
    { name: '☊ Nights Topluluğu', type: ActivityType.Watching },
    { name: '🛡️ 7/24 Sunucu & Medya Koruması', type: ActivityType.Custom },
    { name: '🎙️ Ses Kanalları & Sohbet', type: ActivityType.Listening },
    { name: '⭐ /yardim | Made by erencix', type: ActivityType.Playing },
    { name: '💎 Seviye & Ekonomi Sistemi', type: ActivityType.Competing },
  ];

  let currentActivityIndex = 0;
  client.user?.setPresence({
    activities: [activities[0]],
    status: 'online',
  });

  setInterval(() => {
    currentActivityIndex = (currentActivityIndex + 1) % activities.length;
    client.user?.setPresence({
      activities: [activities[currentActivityIndex]],
      status: 'online',
    });
  }, 15000);

  // Sesli Kanallarda Seviye & XP Takip Motorunu Başlat
  LevelManager.startVoiceTracker(client);

  // Register Slash Commands Globally
  try {
    console.log('[Slash Commands] Slash komutları kaydediliyor...');
    const commands = [
      // Genel Kullanıcı Komutları (Tüm Üyelere Açık)
      yardimCmd.data,
      avatarCmd.data,
      sunucuCmd.data,
      afkCmd.data,
      istatistikCmd.data,
      kullaniciCmd.data,
      gonderCmd.data,
      itirafCmd.data,

      // Müzik Komutları (Tüm Üyelere Açık)
      muzikCmd.calData,
      muzikCmd.durdurData,
      muzikCmd.devamData,
      muzikCmd.gecData,
      muzikCmd.kuyrukData,
      muzikCmd.ayrilData,
      muzikCmd.sesData,

      // Moderasyon Komutu
      silCmd.data,

      // Seviye ve Sıralama Komutları (Tüm Üyelere Açık)
      rankData,
      topData,

      // Yönetici & Kurulum Komutları (Admin-Only, Normal Üyelere Gizli)
      seviyeAyarlaData,
      aiKurCmd.data,
      planCmd.data,
      aiLogoCmd.data,
      aiOnizleCmd.data,
      boostCmd.data,
      teamworkCmd.data,
      browserCmd.data,
      sunucuTemizleCmd.data,
      davetCmd.data,
      mesajGonderCmd.data,
      mesajGonderCmd.aliasData,
    ];

    if (client.application) {
      await client.application.commands.set(commands);
      console.log(`[Slash Commands] ${commands.length} adet Slash komutu genel olarak kaydedildi!`);
    }

    // Sunucularda anında (0 saniye gecikmeyle) görünmesi için bağlı tüm sunuculara doğrudan kaydet
    for (const guild of client.guilds.cache.values()) {
      try {
        await guild.commands.set(commands);
        console.log(`[Slash Commands] ⚡ ${guild.name} sunucusuna ${commands.length} adet komut anında yüklendi!`);
      } catch (gErr: any) {
        console.warn(`[Slash Commands] ${guild.name} için sunucu içi kayıt atlandı:`, gErr.message);
      }
    }
  } catch (err) {
    console.error('[Slash Commands] Komutlar kaydedilirken hata oluştu:', err);
  }
}
