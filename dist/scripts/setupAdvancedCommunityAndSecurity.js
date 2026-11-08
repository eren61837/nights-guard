"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const discord_js_1 = require("discord.js");
const config_1 = require("../config");
const levelManager_1 = require("../services/features/levelManager");
const countingGame_1 = require("../services/features/countingGame");
const ticketManager_1 = require("../services/features/ticketManager");
const serverStatsManager_1 = require("../services/features/serverStatsManager");
const TARGET_GUILD_ID = '1568618183223414934';
async function main() {
    console.log('🚀 Prayt Sunucusu Üst Düzey Güvenlik ve Topluluk Altyapısı Kuruluyor...');
    const client = new discord_js_1.Client({
        intents: [
            discord_js_1.GatewayIntentBits.Guilds,
            discord_js_1.GatewayIntentBits.GuildMembers,
            discord_js_1.GatewayIntentBits.GuildMessages,
            discord_js_1.GatewayIntentBits.MessageContent,
        ],
    });
    await client.login(config_1.config.discordToken);
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
                eventType: discord_js_1.AutoModerationRuleEventType.MessageSend,
                triggerType: discord_js_1.AutoModerationRuleTriggerType.Keyword,
                triggerMetadata: {
                    keywordFilter: ['*free-nitro*', '*steamcommunity.gift*', '*discrod.gift*', '*claim-nitro*', '*t.me/*'],
                },
                actions: [
                    {
                        type: discord_js_1.AutoModerationActionType.BlockMessage,
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
                eventType: discord_js_1.AutoModerationRuleEventType.MessageSend,
                triggerType: discord_js_1.AutoModerationRuleTriggerType.MentionSpam,
                triggerMetadata: {
                    mentionTotalLimit: 4,
                },
                actions: [
                    {
                        type: discord_js_1.AutoModerationActionType.BlockMessage,
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
    }
    catch (autoModErr) {
        console.warn('  ⚠️ AutoMod kuralı oluşturulurken uyarı:', autoModErr.message);
    }
    // 2. CANLI İSTATİSTİK KANALLARI (VOICE COUNTERS)
    console.log('📊 2. Canlı Sunucu İstatistik Panelleri Kuruluyor...');
    await serverStatsManager_1.ServerStatsManager.updateStats(guild);
    console.log('  ✅ İstatistik panelleri güncellendi!');
    // 3. YENİ TOPLULUK KANALLARI
    console.log('💬 3. Topluluk ve Eğlence Kanalları Kuruluyor...');
    const communityCategory = channels.find((c) => c && c.type === discord_js_1.ChannelType.GuildCategory && c.name.includes('TOPLULUK & SOHBET'));
    // A) #sayi-saymaca
    let chSayi = channels.find((c) => c && c.name.includes('sayi-saymaca'));
    if (!chSayi && communityCategory) {
        chSayi = await guild.channels.create({
            name: '🔢・sayi-saymaca',
            type: discord_js_1.ChannelType.GuildText,
            parent: communityCategory.id,
            permissionOverwrites: [
                { id: everyoneRole.id, deny: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.SendMessages] },
                ...(onayliRole
                    ? [
                        {
                            id: onayliRole.id,
                            allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.SendMessages, discord_js_1.PermissionFlagsBits.ReadMessageHistory],
                            deny: [discord_js_1.PermissionFlagsBits.MentionEveryone, discord_js_1.PermissionFlagsBits.CreatePublicThreads, discord_js_1.PermissionFlagsBits.CreatePrivateThreads],
                        },
                    ]
                    : []),
            ],
        });
        console.log('  ✅ #🔢・sayi-saymaca kanalı oluşturuldu!');
        await chSayi.send({ embeds: [countingGame_1.CountingGameManager.getInitialEmbed()] });
    }
    // B) #destek-talebi
    let chDestek = channels.find((c) => c && c.name.includes('destek-talebi'));
    if (!chDestek && communityCategory) {
        chDestek = await guild.channels.create({
            name: '🎫・destek-talebi',
            type: discord_js_1.ChannelType.GuildText,
            parent: communityCategory.id,
            permissionOverwrites: [
                { id: everyoneRole.id, deny: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.SendMessages] },
                ...(onayliRole
                    ? [
                        {
                            id: onayliRole.id,
                            allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.ReadMessageHistory],
                            deny: [discord_js_1.PermissionFlagsBits.SendMessages, discord_js_1.PermissionFlagsBits.CreatePublicThreads, discord_js_1.PermissionFlagsBits.CreatePrivateThreads],
                        },
                    ]
                    : []),
            ],
        });
        console.log('  ✅ #🎫・destek-talebi kanalı oluşturuldu!');
    }
    if (chDestek && chDestek.isTextBased()) {
        const old = await chDestek.messages.fetch({ limit: 5 });
        for (const [, m] of old)
            await m.delete();
        await chDestek.send({
            embeds: [ticketManager_1.TicketManager.getTicketPanelEmbed()],
            components: [ticketManager_1.TicketManager.getTicketPanelControls()],
        });
        console.log('  ✅ #destek-talebi paneli ve butonu yerleştirildi!');
    }
    // C) #hos-geldin (Bilgilendirme Kategorisinde)
    const infoCategory = channels.find((c) => c && c.type === discord_js_1.ChannelType.GuildCategory && c.name.includes('BİLGİLENDİRME'));
    let chHosGeldin = channels.find((c) => c && c.name.includes('hos-geldin'));
    if (!chHosGeldin && infoCategory) {
        chHosGeldin = await guild.channels.create({
            name: '👋・hos-geldin',
            type: discord_js_1.ChannelType.GuildText,
            parent: infoCategory.id,
            permissionOverwrites: [
                { id: everyoneRole.id, deny: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.SendMessages] },
                ...(onayliRole
                    ? [
                        {
                            id: onayliRole.id,
                            allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.ReadMessageHistory],
                            deny: [discord_js_1.PermissionFlagsBits.SendMessages],
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
        const old = await chSeviye.messages.fetch({ limit: 5 });
        for (const [, m] of old)
            await m.delete();
        await chSeviye.send({
            embeds: [levelManager_1.LevelManager.getLevelInfoEmbed()],
        });
        console.log('  ✅ #seviye-rol-bilgi ödül rehberi gönderildi!');
    }
    console.log('\n🎉 TÜM GÜVENLİK VE TOPLULUK SİSTEMLERİ KURULDU!');
    client.destroy();
}
main().catch(console.error);
