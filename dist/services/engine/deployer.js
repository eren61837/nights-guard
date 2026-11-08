"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerDeployer = void 0;
exports.renderProgressBar = renderProgressBar;
exports.formatProgressStatus = formatProgressStatus;
const discord_js_1 = require("discord.js");
const permissionMapper_1 = require("./permissionMapper");
const rateLimitQueue_1 = require("./rateLimitQueue");
const cleaner_1 = require("./cleaner");
const logoStudio_1 = require("../image/logoStudio");
function renderProgressBar(percent, totalBlocks = 10) {
    const safePercent = Number.isFinite(percent) ? percent : 0;
    const clamped = Math.max(0, Math.min(100, Math.round(safePercent)));
    const filled = Math.min(totalBlocks, Math.floor((clamped / 100) * totalBlocks));
    const empty = Math.max(0, totalBlocks - filled);
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${clamped}%`;
}
function formatProgressStatus(percent, status, totalBlocks = 10) {
    return `${renderProgressBar(percent, totalBlocks)} ${status}`;
}
class ServerDeployer {
    queue;
    cleaner;
    logoStudio;
    constructor() {
        this.queue = new rateLimitQueue_1.RateLimitQueue(500); // 500ms safe spacing between creations
        this.cleaner = new cleaner_1.ServerCleaner();
        this.logoStudio = new logoStudio_1.LogoStudio();
    }
    async deploy(guild, blueprint, options = {}, onProgress) {
        const report = {
            rolesCreated: 0,
            channelsCreated: 0,
            automodRulesCreated: 0,
            embedsPosted: 0,
            logoApplied: false,
            errors: [],
        };
        const me = guild.members.me;
        if (!me)
            throw new Error('Bot guild üyesi bulunamadı!');
        // 1. Clean Slate (if requested)
        if (options.cleanSlate) {
            if (onProgress)
                await onProgress('🧹 Eski kanallar ve roller temizleniyor...', 5);
            try {
                await this.cleaner.purgeServer(guild, { preserveChannelId: options.preserveChannelId }, async (msg) => {
                    if (onProgress)
                        await onProgress(msg, 10);
                });
            }
            catch (err) {
                report.errors.push(`Temizleme hatası: ${err.message}`);
            }
        }
        // Update Guild Name if enabled
        if (options.applyName && blueprint.serverName) {
            try {
                await guild.setName(blueprint.serverName.slice(0, 100), 'AI Architect: Sunucu Yapılandırması');
                if (blueprint.serverDescription && guild.features.includes('COMMUNITY')) {
                    await guild.edit({ description: blueprint.serverDescription.slice(0, 120) });
                }
            }
            catch (err) {
                report.errors.push(`Sunucu adı güncellenemedi: ${err.message}`);
            }
        }
        // 2. Deploy Roles
        if (onProgress)
            await onProgress('🛡️ Roller ve hiyerarşi inşa ediliyor...', 20);
        const roleMap = new Map();
        const roleTasks = [];
        // Filter out @everyone if present in blueprint roles to prevent DiscordAPIError
        const validRoles = blueprint.roles.filter((r) => r && r.name && r.name.toLowerCase() !== '@everyone' && r.name.toLowerCase() !== 'everyone');
        // Reverse so lower roles are created first, then higher roles get stacked on top
        const orderedRoles = [...validRoles].reverse();
        for (const r of orderedRoles) {
            roleTasks.push({
                id: `role_${r.name}`,
                description: `Rol oluşturuluyor: ${r.name}`,
                execute: async () => {
                    try {
                        const permissionsBitfield = (0, permissionMapper_1.resolvePermissionList)(r.permissions);
                        const createdRole = await guild.roles.create({
                            name: r.name.slice(0, 100),
                            color: r.color || undefined,
                            hoist: r.hoist ?? false,
                            mentionable: r.mentionable ?? false,
                            permissions: permissionsBitfield,
                            reason: 'AI Architect: Rol kurulumu',
                        });
                        roleMap.set(r.name.toLowerCase().trim(), createdRole);
                        report.rolesCreated++;
                    }
                    catch (err) {
                        report.errors.push(`Rol ${r.name} oluşturulamadı: ${err.message}`);
                    }
                },
            });
        }
        await this.queue.processAll(roleTasks, async (p) => {
            if (onProgress) {
                const pct = Math.min(40, 10 + Math.round((p.current / p.total) * 30));
                await onProgress(`Roller inşa ediliyor... (${p.current}/${p.total})`, pct);
            }
        });
        // 3. Deploy Categories & Channels
        if (onProgress)
            await onProgress('İzinler ve kanallar yapılandırılıyor... (0/0)', 40);
        const channelMap = new Map();
        let totalChannelsToCreate = 0;
        for (const cat of blueprint.categories) {
            totalChannelsToCreate += 1 + (cat.channels?.length || 0);
        }
        let channelsProcessed = 0;
        const channelTasks = [];
        for (const cat of blueprint.categories) {
            let createdCat = null;
            // Category task
            channelTasks.push({
                id: `cat_${cat.name}`,
                description: `Kategori: ${cat.name}`,
                execute: async () => {
                    try {
                        const catOverwrites = this.buildPermissionOverwrites(guild, cat.permissionOverwrites, roleMap);
                        createdCat = await guild.channels.create({
                            name: cat.name.slice(0, 100),
                            type: discord_js_1.ChannelType.GuildCategory,
                            permissionOverwrites: catOverwrites,
                            reason: 'AI Architect: Kategori kurulumu',
                        });
                        report.channelsCreated++;
                        channelsProcessed++;
                    }
                    catch (err) {
                        report.errors.push(`Kategori ${cat.name} oluşturulamadı: ${err.message}`);
                    }
                },
            });
            // Child channels tasks
            if (cat.channels && Array.isArray(cat.channels)) {
                for (const ch of cat.channels) {
                    channelTasks.push({
                        id: `ch_${cat.name}_${ch.name}`,
                        description: `Kanal: #${ch.name}`,
                        execute: async () => {
                            try {
                                const channelType = this.resolveChannelType(ch.type, guild);
                                const overwrites = this.buildPermissionOverwrites(guild, ch.permissionOverwrites, roleMap);
                                const isText = channelType === discord_js_1.ChannelType.GuildText || channelType === discord_js_1.ChannelType.GuildAnnouncement;
                                const channelOptions = {
                                    name: ch.name.slice(0, 100),
                                    type: channelType,
                                    parent: createdCat?.id,
                                    permissionOverwrites: overwrites,
                                    reason: 'AI Architect: Kanal kurulumu',
                                };
                                if (isText) {
                                    if (ch.topic)
                                        channelOptions.topic = ch.topic.slice(0, 1024);
                                    if (typeof ch.rateLimitPerUser === 'number')
                                        channelOptions.rateLimitPerUser = ch.rateLimitPerUser;
                                    if (ch.nsfw)
                                        channelOptions.nsfw = ch.nsfw;
                                }
                                const createdCh = await guild.channels.create(channelOptions);
                                channelMap.set(ch.name.toLowerCase().trim(), createdCh);
                                report.channelsCreated++;
                                channelsProcessed++;
                            }
                            catch (err) {
                                report.errors.push(`Kanal #${ch.name} oluşturulamadı: ${err.message}`);
                            }
                        },
                    });
                }
            }
        }
        await this.queue.processAll(channelTasks, async (p) => {
            if (onProgress) {
                const pct = Math.min(80, 40 + Math.round((p.current / p.total) * 40));
                await onProgress(`İzinler ve kanallar yapılandırılıyor... (${p.current}/${p.total})`, pct);
            }
        });
        // 4. AutoMod Kuralları
        if (blueprint.automodRules && blueprint.automodRules.length > 0) {
            if (onProgress)
                await onProgress('AutoMod kuralları yapılandırılıyor...', 82);
            for (const rule of blueprint.automodRules) {
                try {
                    if (rule.triggerType === 'KEYWORD' && rule.keywordFilter && rule.keywordFilter.length > 0) {
                        await guild.autoModerationRules.create({
                            name: rule.name.slice(0, 100),
                            eventType: discord_js_1.AutoModerationRuleEventType.MessageSend,
                            triggerType: discord_js_1.AutoModerationRuleTriggerType.Keyword,
                            triggerMetadata: {
                                keywordFilter: rule.keywordFilter.slice(0, 50),
                            },
                            actions: [
                                {
                                    type: discord_js_1.AutoModerationActionType.BlockMessage,
                                    metadata: {
                                        customMessage: 'AI Architect: Bu mesaj sunucu kurallarını ihlal ettiği için engellendi.',
                                    },
                                },
                            ],
                            enabled: true,
                            reason: 'AI Architect: Güvenlik kuralı',
                        });
                        report.automodRulesCreated++;
                    }
                    else if (rule.triggerType === 'MENTION_SPAM') {
                        await guild.autoModerationRules.create({
                            name: rule.name.slice(0, 100),
                            eventType: discord_js_1.AutoModerationRuleEventType.MessageSend,
                            triggerType: discord_js_1.AutoModerationRuleTriggerType.MentionSpam,
                            triggerMetadata: {
                                mentionTotalLimit: rule.mentionLimit || 5,
                            },
                            actions: [
                                {
                                    type: discord_js_1.AutoModerationActionType.BlockMessage,
                                    metadata: {
                                        customMessage: 'AI Architect: Aşırı etiket (mention) kullanımı engellendi.',
                                    },
                                },
                            ],
                            enabled: true,
                            reason: 'AI Architect: Bahsetme spam koruması',
                        });
                        report.automodRulesCreated++;
                    }
                }
                catch (err) {
                    report.errors.push(`AutoMod kuralı '${rule.name}' oluşturulamadı: ${err.message}`);
                }
            }
        }
        // 5. Rich Embed Mesajlarını Gönder
        if (blueprint.richEmbeds && blueprint.richEmbeds.length > 0) {
            if (onProgress)
                await onProgress('📜 Bilgi ve Kural embedleri yerleştiriliyor...', 88);
            for (const emb of blueprint.richEmbeds) {
                try {
                    const target = this.findMatchingTextChannel(channelMap, emb.channelName);
                    if (target && target.isTextBased()) {
                        const embed = new discord_js_1.EmbedBuilder()
                            .setTitle(emb.title)
                            .setDescription(emb.description)
                            .setColor(emb.color || '#3498DB')
                            .setTimestamp();
                        if (emb.footer)
                            embed.setFooter({ text: emb.footer });
                        if (emb.fields && Array.isArray(emb.fields)) {
                            for (const f of emb.fields) {
                                embed.addFields({ name: f.name, value: f.value, inline: f.inline ?? false });
                            }
                        }
                        await target.send({ embeds: [embed] });
                        report.embedsPosted++;
                    }
                }
                catch (err) {
                    report.errors.push(`Embed gönderilemedi (${emb.channelName}): ${err.message}`);
                }
            }
        }
        // 6. Ticket Panel Kurulumu
        if (blueprint.features?.ticketSystem?.enabled) {
            try {
                const ticketPanelCh = this.findMatchingTextChannel(channelMap, blueprint.features.ticketSystem.panelChannel);
                if (ticketPanelCh && ticketPanelCh.isTextBased()) {
                    const ticketEmbed = new discord_js_1.EmbedBuilder()
                        .setTitle(blueprint.features.ticketSystem.embedTitle || '🎫 DESTEK VE YARDIM')
                        .setDescription(blueprint.features.ticketSystem.embedDescription ||
                        'Yetkili ekibimizle özel olarak görüşmek, soru sormak veya bildirimde bulunmak için aşağıdaki butona basınız.')
                        .setColor('#2ECC71')
                        .setFooter({ text: 'AI Architect Ticket Sistemi' });
                    const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                        .setCustomId('ticket_open')
                        .setLabel(blueprint.features.ticketSystem.buttonLabel || 'Destek Talebi Aç')
                        .setEmoji(blueprint.features.ticketSystem.buttonEmoji || '📩')
                        .setStyle(discord_js_1.ButtonStyle.Primary));
                    await ticketPanelCh.send({ embeds: [ticketEmbed], components: [row] });
                }
            }
            catch (err) {
                report.errors.push(`Ticket paneli kurulamadı: ${err.message}`);
            }
        }
        // 7. Logo Oluştur & Uygula (if requested)
        if (options.applyLogo && blueprint.iconPrompt) {
            if (onProgress)
                await onProgress('🎨 AI ile sunucu logosu tasarlanıyor ve yükleniyor...', 95);
            try {
                const iconResult = await this.logoStudio.generateIcon(blueprint.iconPrompt);
                await this.logoStudio.applyIconToGuild(guild, iconResult.buffer);
                report.logoApplied = true;
            }
            catch (err) {
                report.errors.push(`Sunucu logosu uygulanamadı: ${err.message}`);
            }
        }
        if (onProgress)
            await onProgress('Logo yüklendi & AutoMod kuralları aktif edildi!', 100);
        return report;
    }
    resolveChannelType(typeStr, guild) {
        switch (typeStr) {
            case 'GUILD_VOICE':
                return discord_js_1.ChannelType.GuildVoice;
            case 'GUILD_ANNOUNCEMENT':
                // Discord requires COMMUNITY feature for announcement channels; fallback to GuildText if missing
                return guild?.features.includes('COMMUNITY')
                    ? discord_js_1.ChannelType.GuildAnnouncement
                    : discord_js_1.ChannelType.GuildText;
            case 'GUILD_STAGE_VOICE':
                return discord_js_1.ChannelType.GuildStageVoice;
            case 'GUILD_FORUM':
                return discord_js_1.ChannelType.GuildForum;
            case 'GUILD_TEXT':
            default:
                return discord_js_1.ChannelType.GuildText;
        }
    }
    buildPermissionOverwrites(guild, overwrites = [], roleMap) {
        const result = [];
        if (!Array.isArray(overwrites))
            return result;
        for (const ov of overwrites) {
            let targetId = null;
            if (ov.roleName === '@everyone' || ov.roleName === 'everyone') {
                targetId = guild.roles.everyone.id;
            }
            else {
                const cleanName = ov.roleName.toLowerCase().trim();
                const role = roleMap.get(cleanName) ||
                    guild.roles.cache.find((r) => r.name.toLowerCase().trim() === cleanName);
                if (role)
                    targetId = role.id;
            }
            if (targetId) {
                const allowBit = (0, permissionMapper_1.resolvePermissionList)(ov.allow);
                const denyBit = (0, permissionMapper_1.resolvePermissionList)(ov.deny);
                result.push({
                    id: targetId,
                    allow: allowBit,
                    deny: denyBit,
                });
            }
        }
        return result;
    }
    findMatchingTextChannel(channelMap, targetName) {
        const clean = targetName.toLowerCase().replace(/[^a-z0-9]/g, '');
        for (const [name, ch] of channelMap.entries()) {
            const chClean = name.replace(/[^a-z0-9]/g, '');
            if (chClean === clean || chClean.includes(clean) || clean.includes(chClean)) {
                return ch;
            }
        }
        return null;
    }
}
exports.ServerDeployer = ServerDeployer;
