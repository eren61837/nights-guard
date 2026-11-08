import dotenv from 'dotenv';
dotenv.config();

import {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  AutoModerationRuleEventType,
  AutoModerationRuleTriggerType,
  AutoModerationActionType,
} from 'discord.js';
import { config } from '../config';
import { LevelManager } from '../services/features/levelManager';
import { CountingGameManager } from '../services/features/countingGame';
import { TicketManager } from '../services/features/ticketManager';
import { ServerStatsManager } from '../services/features/serverStatsManager';

const TARGET_GUILD_ID = '1568618183223414934';

async function main() {
  console.log('🚀 Prayt Sunucusu Üst Düzey Güvenlik ve Topluluk Altyapısı Kuruluyor...');

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  await client.login(config.discordToken);

  const guild = await client.guilds.fetch({ guild: TARGET_GUILD_ID, force: true });
  const channels = await guild.channels.fetch();
  const roles = await guild.roles.fetch();

  const everyoneRole = guild.roles.everyone;
  const onayliRole = roles.find((r) => r.name === 'Onaylı');

  // 1. DİSCORD RESMİ AUTOMOD KURALLARI
  console.log('🛡️ 1. Discord AutoMod Kalkanı Aktif Ediliyor...');
  try {
    const existingRules = await guild.autoModerationRules.fetch();
    console.log(`  Mevcut AutoMod kural sayısı: ${existingRules.size}`);

    // Kural 1: Şüpheli ve Zararlı Kelimeler / Reklam
    if (!existingRules.some((r) => r.name.includes('Prayt Phishing Engel'))) {
      await guild.autoModerationRules.create({
        name: 'Prayt Phishing Engel',
        eventType: AutoModerationRuleEventType.MessageSend,
        triggerType: AutoModerationRuleTriggerType.Keyword,
        triggerMetadata: {
          keywordFilter: ['*free-nitro*', '*steamcommunity.gift*', '*discrod.gift*', '*claim-nitro*', '*t.me/*'],
        },
        actions: [
          {
            type: AutoModerationActionType.BlockMessage,
            metadata: {
              customMessage: 'Zararlı link ve dolandırıcılık teşebbüsü Prayt AutoMod tarafından engellendi.',
            },
          },
        ],
        enabled: true,
        reason: 'Otomatik Phishing Güvenlik Kalkanı',
      });
      console.log('  ✅ AutoMod: Phishing & Zararlı Link Kuralı Oluşturuldu!');
    }

    // Kural 2: Spam Mention Koruması
    if (!existingRules.some((r) => r.name.includes('Prayt Mention Koruması'))) {
      await guild.autoModerationRules.create({
        name: 'Prayt Mention Koruması',
        eventType: AutoModerationRuleEventType.MessageSend,
        triggerType: AutoModerationRuleTriggerType.MentionSpam,
        triggerMetadata: {
          mentionTotalLimit: 4,
        },
        actions: [
          {
            type: AutoModerationActionType.BlockMessage,
            metadata: {
              customMessage: 'Aşırı etiket kullanımı Prayt AutoMod tarafından engellendi.',
            },
          },
        ],
        enabled: true,
        reason: 'Otomatik Toplu Etiket Kalkanı',
      });
      console.log('  ✅ AutoMod: Toplu Mention Kuralı Oluşturuldu!');
    }
  } catch (autoModErr: any) {
    console.warn('  ⚠️ AutoMod kuralı oluşturulurken uyarı:', autoModErr.message);
  }

  // 2. CANLI İSTATİSTİK KANALLARI (VOICE COUNTERS)
  console.log('📊 2. Canlı Sunucu İstatistik Panelleri Kuruluyor...');
  await ServerStatsManager.updateStats(guild);
  console.log('  ✅ İstatistik panelleri güncellendi!');

  // 3. YENİ TOPLULUK KANALLARI
  console.log('💬 3. Topluluk ve Eğlence Kanalları Kuruluyor...');
  const communityCategory = channels.find(
    (c) => c && c.type === ChannelType.GuildCategory && c.name.includes('TOPLULUK & SOHBET')
  );

  // A) #sayi-saymaca
  let chSayi = channels.find((c) => c && c.name.includes('sayi-saymaca'));
  if (!chSayi && communityCategory) {
    chSayi = await guild.channels.create({
      name: '🔢・sayi-saymaca',
      type: ChannelType.GuildText,
      parent: communityCategory.id,
      permissionOverwrites: [
        { id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
        ...(onayliRole
          ? [
              {
                id: onayliRole.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                deny: [PermissionFlagsBits.MentionEveryone, PermissionFlagsBits.CreatePublicThreads, PermissionFlagsBits.CreatePrivateThreads],
              },
            ]
          : []),
      ],
    });
    console.log('  ✅ #🔢・sayi-saymaca kanalı oluşturuldu!');
    await (chSayi as any).send({ embeds: [CountingGameManager.getInitialEmbed()] });
  }

  // B) #destek-talebi
  let chDestek = channels.find((c) => c && c.name.includes('destek-talebi'));
  if (!chDestek && communityCategory) {
    chDestek = await guild.channels.create({
      name: '🎫・destek-talebi',
      type: ChannelType.GuildText,
      parent: communityCategory.id,
      permissionOverwrites: [
        { id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
        ...(onayliRole
          ? [
              {
                id: onayliRole.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
                deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.CreatePublicThreads, PermissionFlagsBits.CreatePrivateThreads],
              },
            ]
          : []),
      ],
    });
    console.log('  ✅ #🎫・destek-talebi kanalı oluşturuldu!');
  }

  if (chDestek && chDestek.isTextBased()) {
    const old = await (chDestek as any).messages.fetch({ limit: 5 });
    for (const [, m] of old) await m.delete();

    await (chDestek as any).send({
      embeds: [TicketManager.getTicketPanelEmbed()],
      components: [TicketManager.getTicketPanelControls()],
    });
    console.log('  ✅ #destek-talebi paneli ve butonu yerleştirildi!');
  }

  // C) #hos-geldin (Bilgilendirme Kategorisinde)
  const infoCategory = channels.find(
    (c) => c && c.type === ChannelType.GuildCategory && c.name.includes('BİLGİLENDİRME')
  );

  let chHosGeldin = channels.find((c) => c && c.name.includes('hos-geldin'));
  if (!chHosGeldin && infoCategory) {
    chHosGeldin = await guild.channels.create({
      name: '👋・hos-geldin',
      type: ChannelType.GuildText,
      parent: infoCategory.id,
      permissionOverwrites: [
        { id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
        ...(onayliRole
          ? [
              {
                id: onayliRole.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
                deny: [PermissionFlagsBits.SendMessages],
              },
            ]
          : []),
      ],
    });
    console.log('  ✅ #👋・hos-geldin kanalı açıldı!');
  }

  // 4. #seviye-rol-bilgi KANALINI DOLDUR
  console.log('⭐ 4. Seviye ve Rol Bilgisi Paneli Güncelleniyor...');
  const chSeviye = channels.find((c) => c && c.name.includes('seviye-rol-bilgi') && c.isTextBased());
  if (chSeviye && chSeviye.isTextBased()) {
    const old = await (chSeviye as any).messages.fetch({ limit: 5 });
    for (const [, m] of old) await m.delete();

    await (chSeviye as any).send({
      embeds: [LevelManager.getLevelInfoEmbed()],
    });
    console.log('  ✅ #seviye-rol-bilgi ödül rehberi gönderildi!');
  }

  console.log('\n🎉 TÜM GÜVENLİK VE TOPLULUK SİSTEMLERİ KURULDU!');
  client.destroy();
}

main().catch(console.error);
