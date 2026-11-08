import dotenv from 'dotenv';
dotenv.config();

import { Client, GatewayIntentBits } from 'discord.js';
import { config } from '../config';
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
import * as seviyeCmd from '../commands/seviye';
import * as gonderCmd from '../commands/gonder';
import * as itirafCmd from '../commands/itiraf';
import * as muzikCmd from '../commands/muzik';

async function main() {
  console.log('🔄 Slash komutları güncelleniyor (Müzik komutları dahil)...');

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  await client.login(config.discordToken);

  const commands = [
    // Topluluk & Eğlence Komutları
    seviyeCmd.rankData,
    seviyeCmd.topData,
    seviyeCmd.seviyeAyarlaData,
    yardimCmd.data,
    avatarCmd.data,
    sunucuCmd.data,
    afkCmd.data,
    silCmd.data,
    istatistikCmd.data,
    kullaniciCmd.data,
    gonderCmd.data,
    itirafCmd.data,

    // Müzik Komutları
    muzikCmd.calData,
    muzikCmd.durdurData,
    muzikCmd.devamData,
    muzikCmd.gecData,
    muzikCmd.kuyrukData,
    muzikCmd.ayrilData,
    muzikCmd.sesData,

    // Yönetici & Kurulum Komutları
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
    console.log(`✅ ${commands.length} adet Slash komutu Discord API'ye başarıyla kaydedildi (Müzik komutları tamamen temizlendi)!`);
  }

  client.destroy();
}

main().catch(console.error);
