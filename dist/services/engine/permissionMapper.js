"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePermission = resolvePermission;
exports.resolvePermissionList = resolvePermissionList;
exports.formatBitfieldToStrings = formatBitfieldToStrings;
const discord_js_1 = require("discord.js");
// Map of common lowercase or casing strings to valid PermissionFlagsBits
const PERMISSION_MAP = {
    // Admin & Management
    administrator: discord_js_1.PermissionFlagsBits.Administrator,
    manageguild: discord_js_1.PermissionFlagsBits.ManageGuild,
    manageroles: discord_js_1.PermissionFlagsBits.ManageRoles,
    managechannels: discord_js_1.PermissionFlagsBits.ManageChannels,
    kickmembers: discord_js_1.PermissionFlagsBits.KickMembers,
    banmembers: discord_js_1.PermissionFlagsBits.BanMembers,
    createinstantinvite: discord_js_1.PermissionFlagsBits.CreateInstantInvite,
    changenickname: discord_js_1.PermissionFlagsBits.ChangeNickname,
    managenicknames: discord_js_1.PermissionFlagsBits.ManageNicknames,
    manageemojisandstickers: discord_js_1.PermissionFlagsBits.ManageGuildExpressions,
    managewebhooks: discord_js_1.PermissionFlagsBits.ManageWebhooks,
    viewauditlog: discord_js_1.PermissionFlagsBits.ViewAuditLog,
    viewguildinsights: discord_js_1.PermissionFlagsBits.ViewGuildInsights,
    // Text permissions
    viewchannel: discord_js_1.PermissionFlagsBits.ViewChannel,
    sendmessages: discord_js_1.PermissionFlagsBits.SendMessages,
    sendmessagesinthreads: discord_js_1.PermissionFlagsBits.SendMessagesInThreads,
    createtranscripts: discord_js_1.PermissionFlagsBits.ManageThreads,
    createpublicthreads: discord_js_1.PermissionFlagsBits.CreatePublicThreads,
    createprivatethreads: discord_js_1.PermissionFlagsBits.CreatePrivateThreads,
    embedlinks: discord_js_1.PermissionFlagsBits.EmbedLinks,
    attachfiles: discord_js_1.PermissionFlagsBits.AttachFiles,
    readmessagehistory: discord_js_1.PermissionFlagsBits.ReadMessageHistory,
    mentioneveryone: discord_js_1.PermissionFlagsBits.MentionEveryone,
    useexternalemojis: discord_js_1.PermissionFlagsBits.UseExternalEmojis,
    useexternalstickers: discord_js_1.PermissionFlagsBits.UseExternalStickers,
    addreactions: discord_js_1.PermissionFlagsBits.AddReactions,
    managemessages: discord_js_1.PermissionFlagsBits.ManageMessages,
    managethreads: discord_js_1.PermissionFlagsBits.ManageThreads,
    // Voice permissions
    connect: discord_js_1.PermissionFlagsBits.Connect,
    speak: discord_js_1.PermissionFlagsBits.Speak,
    stream: discord_js_1.PermissionFlagsBits.Stream,
    useembeddedactivities: discord_js_1.PermissionFlagsBits.UseEmbeddedActivities,
    usesoundboard: discord_js_1.PermissionFlagsBits.UseSoundboard,
    useexternalsounds: discord_js_1.PermissionFlagsBits.UseExternalSounds,
    usevoicedetection: discord_js_1.PermissionFlagsBits.UseVAD,
    usevad: discord_js_1.PermissionFlagsBits.UseVAD,
    priorityspeaker: discord_js_1.PermissionFlagsBits.PrioritySpeaker,
    mutemembers: discord_js_1.PermissionFlagsBits.MuteMembers,
    deafenmembers: discord_js_1.PermissionFlagsBits.DeafenMembers,
    movemembers: discord_js_1.PermissionFlagsBits.MoveMembers,
    requesttospeak: discord_js_1.PermissionFlagsBits.RequestToSpeak,
    sendvoicemessages: discord_js_1.PermissionFlagsBits.SendVoiceMessages,
    // Events, Stage & Apps
    manageevents: discord_js_1.PermissionFlagsBits.ManageEvents,
    moderateMembers: discord_js_1.PermissionFlagsBits.ModerateMembers,
    moderatemembers: discord_js_1.PermissionFlagsBits.ModerateMembers,
    useapplicationcommands: discord_js_1.PermissionFlagsBits.UseApplicationCommands,
    sendttsmessages: discord_js_1.PermissionFlagsBits.SendTTSMessages,
    viewcreatormonetizationanalytics: discord_js_1.PermissionFlagsBits.ViewCreatorMonetizationAnalytics,
    useexternalapps: discord_js_1.PermissionFlagsBits.UseExternalApps || discord_js_1.PermissionFlagsBits.UseApplicationCommands,
};
function resolvePermission(name) {
    if (!name)
        return null;
    const normalized = name.toLowerCase().replace(/[^a-z]/g, '');
    return PERMISSION_MAP[normalized] || null;
}
function resolvePermissionList(names = []) {
    let bitfield = 0n;
    for (const name of names) {
        const bit = resolvePermission(name);
        if (bit) {
            bitfield |= bit;
        }
    }
    return bitfield;
}
function formatBitfieldToStrings(bitfield) {
    const result = [];
    const permissions = new discord_js_1.PermissionsBitField(bitfield);
    for (const [key, val] of Object.entries(discord_js_1.PermissionFlagsBits)) {
        if (permissions.has(val)) {
            result.push(key);
        }
    }
    return result;
}
