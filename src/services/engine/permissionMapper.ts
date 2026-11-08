import { PermissionFlagsBits, PermissionsBitField } from 'discord.js';

// Map of common lowercase or casing strings to valid PermissionFlagsBits
const PERMISSION_MAP: Record<string, bigint> = {
  // Admin & Management
  administrator: PermissionFlagsBits.Administrator,
  manageguild: PermissionFlagsBits.ManageGuild,
  manageroles: PermissionFlagsBits.ManageRoles,
  managechannels: PermissionFlagsBits.ManageChannels,
  kickmembers: PermissionFlagsBits.KickMembers,
  banmembers: PermissionFlagsBits.BanMembers,
  createinstantinvite: PermissionFlagsBits.CreateInstantInvite,
  changenickname: PermissionFlagsBits.ChangeNickname,
  managenicknames: PermissionFlagsBits.ManageNicknames,
  manageemojisandstickers: PermissionFlagsBits.ManageGuildExpressions,
  managewebhooks: PermissionFlagsBits.ManageWebhooks,
  viewauditlog: PermissionFlagsBits.ViewAuditLog,
  viewguildinsights: PermissionFlagsBits.ViewGuildInsights,

  // Text permissions
  viewchannel: PermissionFlagsBits.ViewChannel,
  sendmessages: PermissionFlagsBits.SendMessages,
  sendmessagesinthreads: PermissionFlagsBits.SendMessagesInThreads,
  createtranscripts: PermissionFlagsBits.ManageThreads,
  createpublicthreads: PermissionFlagsBits.CreatePublicThreads,
  createprivatethreads: PermissionFlagsBits.CreatePrivateThreads,
  embedlinks: PermissionFlagsBits.EmbedLinks,
  attachfiles: PermissionFlagsBits.AttachFiles,
  readmessagehistory: PermissionFlagsBits.ReadMessageHistory,
  mentioneveryone: PermissionFlagsBits.MentionEveryone,
  useexternalemojis: PermissionFlagsBits.UseExternalEmojis,
  useexternalstickers: PermissionFlagsBits.UseExternalStickers,
  addreactions: PermissionFlagsBits.AddReactions,
  managemessages: PermissionFlagsBits.ManageMessages,
  managethreads: PermissionFlagsBits.ManageThreads,

  // Voice permissions
  connect: PermissionFlagsBits.Connect,
  speak: PermissionFlagsBits.Speak,
  stream: PermissionFlagsBits.Stream,
  useembeddedactivities: PermissionFlagsBits.UseEmbeddedActivities,
  usesoundboard: PermissionFlagsBits.UseSoundboard,
  useexternalsounds: PermissionFlagsBits.UseExternalSounds,
  usevoicedetection: PermissionFlagsBits.UseVAD,
  usevad: PermissionFlagsBits.UseVAD,
  priorityspeaker: PermissionFlagsBits.PrioritySpeaker,
  mutemembers: PermissionFlagsBits.MuteMembers,
  deafenmembers: PermissionFlagsBits.DeafenMembers,
  movemembers: PermissionFlagsBits.MoveMembers,
  requesttospeak: PermissionFlagsBits.RequestToSpeak,
  sendvoicemessages: PermissionFlagsBits.SendVoiceMessages,

  // Events, Stage & Apps
  manageevents: PermissionFlagsBits.ManageEvents,
  moderateMembers: PermissionFlagsBits.ModerateMembers,
  moderatemembers: PermissionFlagsBits.ModerateMembers,
  useapplicationcommands: PermissionFlagsBits.UseApplicationCommands,
  sendttsmessages: PermissionFlagsBits.SendTTSMessages,
  viewcreatormonetizationanalytics: PermissionFlagsBits.ViewCreatorMonetizationAnalytics,
  useexternalapps: (PermissionFlagsBits as any).UseExternalApps || PermissionFlagsBits.UseApplicationCommands,
};

export function resolvePermission(name: string): bigint | null {
  if (!name) return null;
  const normalized = name.toLowerCase().replace(/[^a-z]/g, '');
  return PERMISSION_MAP[normalized] || null;
}

export function resolvePermissionList(names: string[] = []): bigint {
  let bitfield = 0n;
  for (const name of names) {
    const bit = resolvePermission(name);
    if (bit) {
      bitfield |= bit;
    }
  }
  return bitfield;
}

export function formatBitfieldToStrings(bitfield: bigint): string[] {
  const result: string[] = [];
  const permissions = new PermissionsBitField(bitfield);
  for (const [key, val] of Object.entries(PermissionFlagsBits)) {
    if (permissions.has(val)) {
      result.push(key);
    }
  }
  return result;
}
