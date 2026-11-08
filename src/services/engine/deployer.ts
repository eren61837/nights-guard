import {
  Guild,
  ChannelType,
  ColorResolvable,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AutoModerationRuleTriggerType,
  AutoModerationActionType,
  AutoModerationRuleEventType,
  Role,
  GuildChannel,
} from 'discord.js';
import { ServerBlueprint, ChannelBlueprint, CategoryBlueprint } from '../../types/blueprint';
import { resolvePermissionList } from './permissionMapper';
import { RateLimitQueue, QueueTask } from './rateLimitQueue';
import { ServerCleaner } from './cleaner';
import { LogoStudio } from '../image/logoStudio';

export interface DeploymentOptions {
  cleanSlate?: boolean;
  applyName?: boolean;
  applyLogo?: boolean;
  preserveChannelId?: string;
}

export interface DeploymentReport {
  rolesCreated: number;
  channelsCreated: number;
  automodRulesCreated: number;
  embedsPosted: number;
  logoApplied: boolean;
  errors: string[];
}

export function renderProgressBar(percent: number, totalBlocks: number = 10): string {
  const safePercent = Number.isFinite(percent) ? percent : 0;
  const clamped = Math.max(0, Math.min(100, Math.round(safePercent)));
  const filled = Math.min(totalBlocks, Math.floor((clamped / 100) * totalBlocks));
  const empty = Math.max(0, totalBlocks - filled);
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${clamped}%`;
}

export function formatProgressStatus(percent: number, status: string, totalBlocks: number = 10): string {
  return `${renderProgressBar(percent, totalBlocks)} ${status}`;
}

export class ServerDeployer {
  private queue: RateLimitQueue;
  private cleaner: ServerCleaner;
  private logoStudio: LogoStudio;

  constructor() {
    this.queue = new RateLimitQueue(500); // 500ms safe spacing between creations
    this.cleaner = new ServerCleaner();
    this.logoStudio = new LogoStudio();
  }

  public async deploy(
    guild: Guild,
    blueprint: ServerBlueprint,
    options: DeploymentOptions = {},
    onProgress?: (status: string, percent: number) => Promise<void> | void
  ): Promise<DeploymentReport> {
    const report: DeploymentReport = {
      rolesCreated: 0,
      channelsCreated: 0,
      automodRulesCreated: 0,
      embedsPosted: 0,
      logoApplied: false,
      errors: [],
    };

    const me = guild.members.me;
    if (!me) throw new Error('Bot guild üyesi bulunamadı!');

    // 1. Clean Slate (if requested)
    if (options.cleanSlate) {
      if (onProgress) await onProgress('🧹 Eski kanallar ve roller temizleniyor...', 5);
      try {
        await this.cleaner.purgeServer(
          guild,
          { preserveChannelId: options.preserveChannelId },
          async (msg) => {
            if (onProgress) await onProgress(msg, 10);
          }
        );
      } catch (err: any) {
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
      } catch (err: any) {
        report.errors.push(`Sunucu adı güncellenemedi: ${err.message}`);
      }
    }

    // 2. Deploy Roles
    if (onProgress) await onProgress('🛡️ Roller ve hiyerarşi inşa ediliyor...', 20);
    const roleMap = new Map<string, Role>();
    const roleTasks: QueueTask<void>[] = [];

    // Filter out @everyone if present in blueprint roles to prevent DiscordAPIError
    const validRoles = blueprint.roles.filter(
      (r) => r && r.name && r.name.toLowerCase() !== '@everyone' && r.name.toLowerCase() !== 'everyone'
    );
    // Reverse so lower roles are created first, then higher roles get stacked on top
    const orderedRoles = [...validRoles].reverse();

    for (const r of orderedRoles) {
      roleTasks.push({
        id: `role_${r.name}`,
        description: `Rol oluşturuluyor: ${r.name}`,
        execute: async () => {
          try {
            const permissionsBitfield = resolvePermissionList(r.permissions);
            const createdRole = await guild.roles.create({
              name: r.name.slice(0, 100),
              color: (r.color as ColorResolvable) || undefined,
              hoist: r.hoist ?? false,
              mentionable: r.mentionable ?? false,
              permissions: permissionsBitfield,
              reason: 'AI Architect: Rol kurulumu',
            });
            roleMap.set(r.name.toLowerCase().trim(), createdRole);
            report.rolesCreated++;
          } catch (err: any) {
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
    if (onProgress) await onProgress('İzinler ve kanallar yapılandırılıyor... (0/0)', 40);
    const channelMap = new Map<string, GuildChannel>();

    let totalChannelsToCreate = 0;
    for (const cat of blueprint.categories) {
      totalChannelsToCreate += 1 + (cat.channels?.length || 0);
    }
    let channelsProcessed = 0;

    const channelTasks: QueueTask<void>[] = [];

    for (const cat of blueprint.categories) {
      let createdCat: any = null;

      // Category task
      channelTasks.push({
        id: `cat_${cat.name}`,
        description: `Kategori: ${cat.name}`,
        execute: async () => {
          try {
            const catOverwrites = this.buildPermissionOverwrites(guild, cat.permissionOverwrites, roleMap);
            createdCat = await guild.channels.create({
              name: cat.name.slice(0, 100),
              type: ChannelType.GuildCategory,
              permissionOverwrites: catOverwrites,
              reason: 'AI Architect: Kategori kurulumu',
            });
            report.channelsCreated++;
            channelsProcessed++;
          } catch (err: any) {
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

                const isText = channelType === ChannelType.GuildText || channelType === ChannelType.GuildAnnouncement;
                const channelOptions: any = {
                  name: ch.name.slice(0, 100),
                  type: channelType,
                  parent: createdCat?.id,
                  permissionOverwrites: overwrites,
                  reason: 'AI Architect: Kanal kurulumu',
                };

                if (isText) {
                  if (ch.topic) channelOptions.topic = ch.topic.slice(0, 1024);
                  if (typeof ch.rateLimitPerUser === 'number') channelOptions.rateLimitPerUser = ch.rateLimitPerUser;
                  if (ch.nsfw) channelOptions.nsfw = ch.nsfw;
                }

                const createdCh = await guild.channels.create(channelOptions);
                channelMap.set(ch.name.toLowerCase().trim(), createdCh as GuildChannel);
                report.channelsCreated++;
                channelsProcessed++;
              } catch (err: any) {
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
      if (onProgress) await onProgress('AutoMod kuralları yapılandırılıyor...', 82);
      for (const rule of blueprint.automodRules) {
        try {
          if (rule.triggerType === 'KEYWORD' && rule.keywordFilter && rule.keywordFilter.length > 0) {
            await guild.autoModerationRules.create({
              name: rule.name.slice(0, 100),
              eventType: AutoModerationRuleEventType.MessageSend,
              triggerType: AutoModerationRuleTriggerType.Keyword,
              triggerMetadata: {
                keywordFilter: rule.keywordFilter.slice(0, 50),
              },
              actions: [
                {
                  type: AutoModerationActionType.BlockMessage,
                  metadata: {
                    customMessage: 'AI Architect: Bu mesaj sunucu kurallarını ihlal ettiği için engellendi.',
                  },
                },
              ],
              enabled: true,
              reason: 'AI Architect: Güvenlik kuralı',
            });
            report.automodRulesCreated++;
          } else if (rule.triggerType === 'MENTION_SPAM') {
            await guild.autoModerationRules.create({
              name: rule.name.slice(0, 100),
              eventType: AutoModerationRuleEventType.MessageSend,
              triggerType: AutoModerationRuleTriggerType.MentionSpam,
              triggerMetadata: {
                mentionTotalLimit: rule.mentionLimit || 5,
              },
              actions: [
                {
                  type: AutoModerationActionType.BlockMessage,
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
        } catch (err: any) {
          report.errors.push(`AutoMod kuralı '${rule.name}' oluşturulamadı: ${err.message}`);
        }
      }
    }

    // 5. Rich Embed Mesajlarını Gönder
    if (blueprint.richEmbeds && blueprint.richEmbeds.length > 0) {
      if (onProgress) await onProgress('📜 Bilgi ve Kural embedleri yerleştiriliyor...', 88);
      for (const emb of blueprint.richEmbeds) {
        try {
          const target = this.findMatchingTextChannel(channelMap, emb.channelName);
          if (target && target.isTextBased()) {
            const embed = new EmbedBuilder()
              .setTitle(emb.title)
              .setDescription(emb.description)
              .setColor((emb.color as ColorResolvable) || '#3498DB')
              .setTimestamp();

            if (emb.footer) embed.setFooter({ text: emb.footer });
            if (emb.fields && Array.isArray(emb.fields)) {
              for (const f of emb.fields) {
                embed.addFields({ name: f.name, value: f.value, inline: f.inline ?? false });
              }
            }

            await target.send({ embeds: [embed] });
            report.embedsPosted++;
          }
        } catch (err: any) {
          report.errors.push(`Embed gönderilemedi (${emb.channelName}): ${err.message}`);
        }
      }
    }

    // 6. Ticket Panel Kurulumu
    if (blueprint.features?.ticketSystem?.enabled) {
      try {
        const ticketPanelCh = this.findMatchingTextChannel(
          channelMap,
          blueprint.features.ticketSystem.panelChannel
        );
        if (ticketPanelCh && ticketPanelCh.isTextBased()) {
          const ticketEmbed = new EmbedBuilder()
            .setTitle(blueprint.features.ticketSystem.embedTitle || '🎫 DESTEK VE YARDIM')
            .setDescription(
              blueprint.features.ticketSystem.embedDescription ||
                'Yetkili ekibimizle özel olarak görüşmek, soru sormak veya bildirimde bulunmak için aşağıdaki butona basınız.'
            )
            .setColor('#2ECC71')
            .setFooter({ text: 'AI Architect Ticket Sistemi' });

          const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId('ticket_open')
              .setLabel(blueprint.features.ticketSystem.buttonLabel || 'Destek Talebi Aç')
              .setEmoji(blueprint.features.ticketSystem.buttonEmoji || '📩')
              .setStyle(ButtonStyle.Primary)
          );

          await ticketPanelCh.send({ embeds: [ticketEmbed], components: [row] });
        }
      } catch (err: any) {
        report.errors.push(`Ticket paneli kurulamadı: ${err.message}`);
      }
    }

    // 7. Logo Oluştur & Uygula (if requested)
    if (options.applyLogo && blueprint.iconPrompt) {
      if (onProgress) await onProgress('🎨 AI ile sunucu logosu tasarlanıyor ve yükleniyor...', 95);
      try {
        const iconResult = await this.logoStudio.generateIcon(blueprint.iconPrompt);
        await this.logoStudio.applyIconToGuild(guild, iconResult.buffer);
        report.logoApplied = true;
      } catch (err: any) {
        report.errors.push(`Sunucu logosu uygulanamadı: ${err.message}`);
      }
    }

    if (onProgress) await onProgress('Logo yüklendi & AutoMod kuralları aktif edildi!', 100);
    return report;
  }

  private resolveChannelType(
    typeStr: string,
    guild?: Guild
  ):
    | ChannelType.GuildText
    | ChannelType.GuildVoice
    | ChannelType.GuildAnnouncement
    | ChannelType.GuildStageVoice
    | ChannelType.GuildForum {
    switch (typeStr) {
      case 'GUILD_VOICE':
        return ChannelType.GuildVoice;
      case 'GUILD_ANNOUNCEMENT':
        // Discord requires COMMUNITY feature for announcement channels; fallback to GuildText if missing
        return guild?.features.includes('COMMUNITY')
          ? ChannelType.GuildAnnouncement
          : ChannelType.GuildText;
      case 'GUILD_STAGE_VOICE':
        return ChannelType.GuildStageVoice;
      case 'GUILD_FORUM':
        return ChannelType.GuildForum;
      case 'GUILD_TEXT':
      default:
        return ChannelType.GuildText;
    }
  }

  private buildPermissionOverwrites(
    guild: Guild,
    overwrites: any[] = [],
    roleMap: Map<string, Role>
  ): any[] {
    const result: any[] = [];
    if (!Array.isArray(overwrites)) return result;

    for (const ov of overwrites) {
      let targetId: string | null = null;
      if (ov.roleName === '@everyone' || ov.roleName === 'everyone') {
        targetId = guild.roles.everyone.id;
      } else {
        const cleanName = ov.roleName.toLowerCase().trim();
        const role =
          roleMap.get(cleanName) ||
          guild.roles.cache.find((r) => r.name.toLowerCase().trim() === cleanName);
        if (role) targetId = role.id;
      }

      if (targetId) {
        const allowBit = resolvePermissionList(ov.allow);
        const denyBit = resolvePermissionList(ov.deny);

        result.push({
          id: targetId,
          allow: allowBit,
          deny: denyBit,
        });
      }
    }

    return result;
  }

  private findMatchingTextChannel(
    channelMap: Map<string, GuildChannel>,
    targetName: string
  ): any {
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
