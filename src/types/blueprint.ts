import { ChannelType, PermissionResolvable } from 'discord.js';

export type SupportedChannelType =
  | 'GUILD_TEXT'
  | 'GUILD_VOICE'
  | 'GUILD_ANNOUNCEMENT'
  | 'GUILD_STAGE_VOICE'
  | 'GUILD_FORUM';

export interface OverwriteBlueprint {
  roleName: string; // role name or '@everyone'
  allow?: string[]; // e.g. ["ViewChannel", "SendMessages"]
  deny?: string[];  // e.g. ["SendMessages"]
}

export interface ChannelBlueprint {
  name: string;
  type: SupportedChannelType;
  topic?: string;
  nsfw?: boolean;
  rateLimitPerUser?: number; // Slowmode in seconds (0 to 21600)
  permissionOverwrites?: OverwriteBlueprint[];
}

export interface CategoryBlueprint {
  name: string;
  channels: ChannelBlueprint[];
  permissionOverwrites?: OverwriteBlueprint[];
}

export interface RoleBlueprint {
  name: string;
  color?: string; // Hex color e.g. "#FF5733" or "BLUE"
  hoist?: boolean; // Display separately in sidebar
  mentionable?: boolean;
  permissions?: string[]; // Discord PermissionFlagsBits keys
}

export interface AutoModRuleBlueprint {
  name: string;
  triggerType: 'KEYWORD' | 'SPAM' | 'MENTION_SPAM';
  keywordFilter?: string[];
  mentionLimit?: number;
  enabled?: boolean;
}

export interface EmbedFieldBlueprint {
  name: string;
  value: string;
  inline?: boolean;
}

export interface RichEmbedBlueprint {
  channelName: string;
  title: string;
  description: string;
  color?: string;
  fields?: EmbedFieldBlueprint[];
  footer?: string;
}

export interface TicketFeatureBlueprint {
  enabled: boolean;
  categoryName: string;
  panelChannel: string;
  buttonLabel?: string;
  buttonEmoji?: string;
  embedTitle?: string;
  embedDescription?: string;
  supportRoleName?: string;
}

export interface VoiceLobbyFeatureBlueprint {
  enabled: boolean;
  categoryName: string;
  triggerChannel: string; // e.g. "➕・Oda Oluştur"
  userRoomPrefix?: string; // e.g. "🔊・"
}

export interface ServerBlueprint {
  serverName: string;
  serverDescription: string;
  theme: string;
  locale: 'tr' | 'en';
  iconPrompt?: string;
  roles: RoleBlueprint[];
  categories: CategoryBlueprint[];
  automodRules?: AutoModRuleBlueprint[];
  richEmbeds?: RichEmbedBlueprint[];
  features?: {
    ticketSystem?: TicketFeatureBlueprint;
    joinToCreate?: VoiceLobbyFeatureBlueprint;
    autoRoleName?: string;
  };
}

export interface BlueprintGenerationOptions {
  prompt: string;
  style?: 'modern' | 'minimalist' | 'gaming' | 'anime' | 'professional' | 'community';
  locale?: 'tr' | 'en';
  cleanSlate?: boolean;
}
