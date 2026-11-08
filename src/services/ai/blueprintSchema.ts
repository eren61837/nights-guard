export const BLUEPRINT_JSON_SCHEMA = {
  type: 'object',
  properties: {
    serverName: { type: 'string', description: 'Sunucu için önerilen isim' },
    serverDescription: { type: 'string', description: 'Sunucunun kısa açıklaması' },
    theme: { type: 'string', description: 'Sunucunun teması (örn: Cyberpunk Anime RP, E-Spor Topluluğu)' },
    locale: { type: 'string', enum: ['tr', 'en'] },
    iconPrompt: { type: 'string', description: 'Sunucu logosu için İngilizce resim üretim promptu' },
    roles: {
      type: 'array',
      description: 'Yukarıdan aşağıya rol hiyerarşisi (en yetkiliden en temele)',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          color: { type: 'string', description: 'Hex renk kodu, örn: #E74C3C' },
          hoist: { type: 'boolean', description: 'Üye listesinde ayrı gösterilsin mi' },
          mentionable: { type: 'boolean' },
          permissions: {
            type: 'array',
            items: { type: 'string' },
            description: 'Geçerli Discord yetkileri: Administrator, ManageGuild, ManageRoles, ManageChannels, KickMembers, BanMembers, ViewChannel, SendMessages, Connect, Speak, vb.'
          }
        },
        required: ['name', 'color', 'hoist']
      }
    },
    categories: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Emoji ve stil içeren kategori adı' },
          channels: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                type: {
                  type: 'string',
                  enum: ['GUILD_TEXT', 'GUILD_VOICE', 'GUILD_ANNOUNCEMENT', 'GUILD_STAGE_VOICE', 'GUILD_FORUM']
                },
                topic: { type: 'string' },
                nsfw: { type: 'boolean' },
                rateLimitPerUser: { type: 'number' },
                permissionOverwrites: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      roleName: { type: 'string', description: "Rol adı veya '@everyone'" },
                      allow: { type: 'array', items: { type: 'string' } },
                      deny: { type: 'array', items: { type: 'string' } }
                    },
                    required: ['roleName']
                  }
                }
              },
              required: ['name', 'type']
            }
          }
        },
        required: ['name', 'channels']
      }
    },
    automodRules: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          triggerType: { type: 'string', enum: ['KEYWORD', 'SPAM', 'MENTION_SPAM'] },
          keywordFilter: { type: 'array', items: { type: 'string' } },
          mentionLimit: { type: 'number' }
        },
        required: ['name', 'triggerType']
      }
    },
    richEmbeds: {
      type: 'array',
      description: 'Kurallar, duyurular ve bilgi kanallarına otomatik atılacak zengin embedler',
      items: {
        type: 'object',
        properties: {
          channelName: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          color: { type: 'string' },
          fields: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                value: { type: 'string' },
                inline: { type: 'boolean' }
              },
              required: ['name', 'value']
            }
          },
          footer: { type: 'string' }
        },
        required: ['channelName', 'title', 'description']
      }
    },
    features: {
      type: 'object',
      properties: {
        ticketSystem: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            categoryName: { type: 'string' },
            panelChannel: { type: 'string' },
            buttonLabel: { type: 'string' },
            buttonEmoji: { type: 'string' },
            embedTitle: { type: 'string' },
            embedDescription: { type: 'string' },
            supportRoleName: { type: 'string' }
          }
        },
        joinToCreate: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            categoryName: { type: 'string' },
            triggerChannel: { type: 'string' }
          }
        },
        autoRoleName: { type: 'string' }
      }
    }
  },
  required: ['serverName', 'serverDescription', 'theme', 'roles', 'categories']
};
