import {
  Guild,
  GuildMember,
  ChannelType,
  TextChannel,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
  Client,
  Role,
  PermissionFlagsBits,
} from 'discord.js';
import { PersistentStore } from '../storage/persistentStore';
import { EconomyManager } from './economyManager';
import path from 'path';
import fs from 'fs';

export interface UserInviteData {
  regular: number;
  left: number;
  fake: number;
  bonus: number;
  rejoins: number;
  inviterId?: string;
  claimedMilestones: number[];
}

export interface MemberJoinHistory {
  inviterId: string;
  firstJoinedAt: number;
  hasLeft: boolean;
  joinCount: number;
}

export interface InviteMilestone {
  required: number;
  roleName: string;
  roleColor: `#${string}`;
  coins: number;
}

export const INVITE_MILESTONES: InviteMilestone[] = [
  { required: 3, roleName: '🥉・Bronz Davetçi', roleColor: '#CD7F32', coins: 1000 },
  { required: 5, roleName: '🥈・Gümüş Davetçi', roleColor: '#C0C0C0', coins: 2500 },
  { required: 10, roleName: '🥇・Altın Davetçi', roleColor: '#F1C40F', coins: 5000 },
  { required: 20, roleName: '💎・Elmas Davetçi (VIP)', roleColor: '#00E5FF', coins: 15000 },
];

export class InviteRewardManager {
  private static userInvites = new Map<string, UserInviteData>();
  private static memberHistory = new Map<string, MemberJoinHistory>();
  private static loaded = false;
  private static initialized = false;

  public static init(client: Client): void {
    if (this.initialized) return;
    this.initialized = true;

    this.load();

    for (const guild of client.guilds.cache.values()) {
      this.ensureRoles(guild).catch(() => {});
      this.ensureShowcasePanel(guild, client).catch(() => {});
      this.ensureLogChannel(guild).catch(() => {});
    }
  }

  public static load(): void {
    if (this.loaded) return;
    this.loaded = true;

    try {
      const dataPath = path.resolve(process.cwd(), 'data/invites.json');
      if (fs.existsSync(dataPath)) {
        const raw = fs.readFileSync(dataPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'object' && parsed !== null) {
          this.userInvites.clear();
          for (const [k, v] of Object.entries(parsed)) {
            this.userInvites.set(k, v as UserInviteData);
          }
        }
      }

      const historyPath = path.resolve(process.cwd(), 'data/invite_history.json');
      if (fs.existsSync(historyPath)) {
        const rawH = fs.readFileSync(historyPath, 'utf-8');
        const parsedH = JSON.parse(rawH);
        if (typeof parsedH === 'object' && parsedH !== null) {
          this.memberHistory.clear();
          for (const [k, v] of Object.entries(parsedH)) {
            this.memberHistory.set(k, v as MemberJoinHistory);
          }
        }
      }
    } catch (e: any) {
      console.warn('[InviteRewardManager] Veri yüklenemedi:', e.message);
    }
  }

  public static save(): void {
    try {
      const obj: Record<string, UserInviteData> = {};
      for (const [k, v] of this.userInvites.entries()) {
        obj[k] = v;
      }
      PersistentStore.atomicSaveJson('invites.json', obj);

      const histObj: Record<string, MemberJoinHistory> = {};
      for (const [k, v] of this.memberHistory.entries()) {
        histObj[k] = v;
      }
      PersistentStore.atomicSaveJson('invite_history.json', histObj);
    } catch (e: any) {
      console.warn('[InviteRewardManager] Veri kaydedilemedi:', e.message);
    }
  }

  public static getUserData(userId: string): UserInviteData {
    this.load();
    let data = this.userInvites.get(userId);
    if (!data) {
      data = {
        regular: 0,
        left: 0,
        fake: 0,
        bonus: 0,
        rejoins: 0,
        claimedMilestones: [],
      };
      this.userInvites.set(userId, data);
    }
    if (!data.claimedMilestones) data.claimedMilestones = [];
    return data;
  }

  public static getNetInvites(data: UserInviteData): number {
    return Math.max(0, (data.regular || 0) - (data.left || 0) + (data.bonus || 0));
  }

  /**
   * Rolleri sunucuda otomatik oluşturur
   */
  public static async ensureRoles(guild: Guild): Promise<Map<number, Role>> {
    const roleMap = new Map<number, Role>();
    const roles = await guild.roles.fetch();

    for (const m of INVITE_MILESTONES) {
      let role = roles.find((r) => r.name.toLowerCase() === m.roleName.toLowerCase() || r.name.includes(m.roleName));
      if (!role) {
        try {
          role = await guild.roles.create({
            name: m.roleName,
            color: m.roleColor,
            reason: `Nights Guard Otomatik Davet Ödülü (${m.required} Davet)`,
          });
        } catch {}
      }
      if (role) {
        roleMap.set(m.required, role);
      }
    }

    return roleMap;
  }

  /**
   * Özel #📋・davet-log Kanalını Otomatik Kurar / Bulur
   */
  public static async ensureLogChannel(guild: Guild): Promise<TextChannel | undefined> {
    let logCh = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildText && (c.name.includes('davet-log') || c.name.includes('invite-log'))
    ) as TextChannel | undefined;

    if (!logCh) {
      const categories = guild.channels.cache.filter((c) => c.type === ChannelType.GuildCategory);
      const modCat = categories.find((c) => c.name.toLowerCase().includes('yetkili') || c.name.toLowerCase().includes('özel'));

      try {
        logCh = await guild.channels.create({
          name: '📋・davet-log',
          type: ChannelType.GuildText,
          parent: modCat?.id,
          topic: '7/24 Canlı Sunucu Davet, Katılım, Ayrılma, Rejoin ve Sahte Hesap Denetim Kayıtları',
        });
      } catch {}
    }

    return logCh;
  }

  /**
   * Yeni üye katıldığında tetiklenir (Rejoin & Fake & Abuse Koruması)
   */
  public static async onMemberJoin(
    member: GuildMember,
    inviterId?: string | null
  ): Promise<{
    rewardGiven: boolean;
    rewardRole?: string;
    coinsGiven?: number;
    inviterData?: UserInviteData;
    netInvites?: number;
    isRejoin?: boolean;
    isFake?: boolean;
  } | null> {
    this.load();
    const guild = member.guild;
    const logCh = await this.ensureLogChannel(guild);

    // Kendi verisini güncelle
    const memberData = this.getUserData(member.id);
    if (inviterId) {
      memberData.inviterId = inviterId;
    }

    // ═══════════════════════════════════════════════════════════
    // 🛡️ REJOIN (TEKRAR GİRİŞ) & MÜKERRER PUAN KORUMASI
    // ═══════════════════════════════════════════════════════════
    const history = this.memberHistory.get(member.id);

    if (history) {
      history.joinCount++;
      const wasLeft = history.hasLeft;
      history.hasLeft = false;
      this.save();

      if (inviterId && inviterId !== member.id) {
        const inviterData = this.getUserData(inviterId);
        inviterData.rejoins = (inviterData.rejoins || 0) + 1;

        // Eğer AYNI davetçi ise ve kişi daha önce ayrılmışsa, left sayısını telafi et
        if (history.inviterId === inviterId && wasLeft && (inviterData.left || 0) > 0) {
          inviterData.left--;
          this.save();
        }
      }

      // Rejoin Logu Gönder
      if (logCh) {
        const rejoinEmbed = new EmbedBuilder()
          .setColor(0xe67e22)
          .setTitle('⚠️ [REJOIN TESPİTİ] Tekrar Katılım Engellendi')
          .setDescription(
            `👤 **Üye:** <@${member.id}> (\`${member.user.tag}\`)\n` +
            `📨 **Kullandığı Davet:** ${inviterId ? `<@${inviterId}>` : 'Bilinmiyor'}\n` +
            `🔍 **Orijinal İlk Davetçisi:** ${history.inviterId ? `<@${history.inviterId}>` : 'Bilinmiyor'}\n` +
            `🔢 **Giriş Sayısı:** ${history.joinCount}. kez katıldı\n\n` +
            `🛡️ *Bu kullanıcı daha önce sunucuya katıldığı için davetçiye mükerrer puan verilmedi.*`
          )
          .setTimestamp();
        logCh.send({ embeds: [rejoinEmbed] }).catch(() => {});
      }

      return {
        rewardGiven: false,
        isRejoin: true,
        inviterData: inviterId ? this.getUserData(inviterId) : undefined,
        netInvites: inviterId ? this.getNetInvites(this.getUserData(inviterId)) : 0,
      };
    }

    // İlk kez katılan kullanıcı: Geçmişe kaydet
    this.memberHistory.set(member.id, {
      inviterId: inviterId || '',
      firstJoinedAt: Date.now(),
      hasLeft: false,
      joinCount: 1,
    });
    this.save();

    if (!inviterId || inviterId === member.id) {
      if (logCh) {
        const selfEmbed = new EmbedBuilder()
          .setColor(0x95a5a6)
          .setTitle('ℹ️ Doğrudan veya Kendi Linkiyle Katılım')
          .setDescription(`👤 <@${member.id}> (\`${member.user.tag}\`) sunucuya katıldı. Davetçi: ${inviterId === member.id ? 'Kendi linki (Puan verilmedi)' : 'Özel URL / Doğrudan'}`)
          .setTimestamp();
        logCh.send({ embeds: [selfEmbed] }).catch(() => {});
      }
      return null;
    }

    const inviterData = this.getUserData(inviterId);

    // ═══════════════════════════════════════════════════════════
    // 🛡️ SAHTE HESAP / BOT KORUMASI (ANTI-FAKE)
    // ═══════════════════════════════════════════════════════════
    const accountAgeDays = (Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24);
    const isFake = accountAgeDays < 3; // 3 günden genç hesaplar fake sayılır

    if (isFake) {
      inviterData.fake = (inviterData.fake || 0) + 1;
      this.save();

      if (logCh) {
        const fakeEmbed = new EmbedBuilder()
          .setColor(0xe74c3c)
          .setTitle('🚫 [SAHTE HESAP] Şüpheli Yeni Hesap')
          .setDescription(
            `👤 **Üye:** <@${member.id}> (\`${member.user.tag}\`)\n` +
            `📨 **Davet Eden:** <@${inviterId}>\n` +
            `⏱️ **Hesap Yaşı:** \`${Math.round(accountAgeDays * 24)} saat\` (3 günden genç!)\n\n` +
            `⚠️ *Bu hesap bot veya sahte alt-hesap olabileceğinden <@${inviterId}> davet puanına eklenmedi.*`
          )
          .setTimestamp();
        logCh.send({ embeds: [fakeEmbed] }).catch(() => {});
      }

      return { rewardGiven: false, isFake: true, inviterData, netInvites: this.getNetInvites(inviterData) };
    }

    // Geçerli Gerçek Davet
    inviterData.regular = (inviterData.regular || 0) + 1;
    const net = this.getNetInvites(inviterData);

    // Milestones kontrolü
    let rewardGiven = false;
    let rewardRole: string | undefined;
    let coinsGiven: number | undefined;

    const roleMap = await this.ensureRoles(guild);
    const inviterMember = await guild.members.fetch(inviterId).catch(() => null);

    for (const milestone of INVITE_MILESTONES) {
      if (net >= milestone.required && !inviterData.claimedMilestones.includes(milestone.required)) {
        inviterData.claimedMilestones.push(milestone.required);
        rewardGiven = true;
        rewardRole = milestone.roleName;
        coinsGiven = milestone.coins;

        // Rol ver
        const targetRole = roleMap.get(milestone.required);
        if (targetRole && inviterMember) {
          await inviterMember.roles.add(targetRole).catch(() => {});
        }

        // Para ver
        EconomyManager.addCoins(inviterId, milestone.coins);
      }
    }

    this.save();

    // Log kanalına başarı raporu at
    if (logCh) {
      const joinEmbed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle('✅ [GEÇERLİ DAVET] Yeni Üye Katıldı')
        .setDescription(
          `👤 **Yeni Üye:** <@${member.id}> (\`${member.user.tag}\`)\n` +
          `📨 **Davet Eden:** <@${inviterId}>\n` +
          `📊 **Davetçi Durumu:** \`${net}\` Net Davet (Toplam: ${inviterData.regular}, Ayrılan: ${inviterData.left}, Fake: ${inviterData.fake})\n` +
          (rewardGiven ? `\n🎉 **YENİ ÖDÜL KAZANILDI:** \`${rewardRole}\` (+${coinsGiven} Coin) 🎁` : '')
        )
        .setTimestamp();
      logCh.send({ embeds: [joinEmbed] }).catch(() => {});
    }

    return {
      rewardGiven,
      rewardRole,
      coinsGiven,
      inviterData,
      netInvites: net,
    };
  }

  /**
   * Üye sunucudan çıktığında tetiklenir (Left Invite & Rol Geri Alma)
   */
  public static async onMemberLeave(member: GuildMember): Promise<void> {
    this.load();
    const guild = member.guild;
    const logCh = await this.ensureLogChannel(guild);

    const history = this.memberHistory.get(member.id);
    const memberData = this.userInvites.get(member.id);
    const inviterId = history?.inviterId || memberData?.inviterId;

    if (history) {
      history.hasLeft = true;
      this.save();
    }

    if (!inviterId) return;

    const inviterData = this.userInvites.get(inviterId);
    if (!inviterData) return;

    inviterData.left = (inviterData.left || 0) + 1;
    const net = this.getNetInvites(inviterData);

    // ═══════════════════════════════════════════════════════════
    // 📉 ROL GERİ ALMA (Eğer net davet ödül eşiğinin altına düşerse)
    // ═══════════════════════════════════════════════════════════
    const roleMap = await this.ensureRoles(guild);
    const inviterMember = await guild.members.fetch(inviterId).catch(() => null);
    const revokedRoles: string[] = [];

    for (const milestone of INVITE_MILESTONES) {
      if (net < milestone.required && inviterData.claimedMilestones.includes(milestone.required)) {
        inviterData.claimedMilestones = inviterData.claimedMilestones.filter((r) => r !== milestone.required);
        const role = roleMap.get(milestone.required);
        if (role && inviterMember) {
          await inviterMember.roles.remove(role).catch(() => {});
          revokedRoles.push(milestone.roleName);
        }
      }
    }

    this.save();

    // Log kanalına ayrılma ve rol düşüş raporu at
    if (logCh) {
      const leaveEmbed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle('🚪 [AYRILMA] Üye Sunucudan Çıktı')
        .setDescription(
          `👤 **Ayrılan:** <@${member.id}> (\`${member.user.tag}\`)\n` +
          `📨 **Davet Eden:** <@${inviterId}>\n` +
          `📊 **Yeni Net Davet:** \`${net}\` (Ayrılan toplam: ${inviterData.left})\n` +
          (revokedRoles.length > 0 ? `\n⚠️ **ÖDÜL GERİ ALINDI:** Davet sayısı düştüğü için **${revokedRoles.join(', ')}** rolü geri alındı!` : '')
        )
        .setTimestamp();
      logCh.send({ embeds: [leaveEmbed] }).catch(() => {});
    }
  }

  /**
   * #🎁・davet-ödülleri Vitrin Panelini Otomatik Kurar / Doğrular
   */
  public static async ensureShowcasePanel(guild: Guild, client: Client): Promise<void> {
    let channel = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildText && (c.name.includes('davet-odul') || c.name.includes('davet-ödül'))
    ) as TextChannel | undefined;

    if (!channel) {
      const categories = guild.channels.cache.filter((c) => c.type === ChannelType.GuildCategory);
      const infoCat = categories.find(
        (c) => c.name.toLowerCase().includes('bilgi') || c.name.toLowerCase().includes('duyuru')
      );

      try {
        channel = await guild.channels.create({
          name: '🎁・davet-ödülleri',
          type: ChannelType.GuildText,
          parent: infoCat?.id,
          topic: 'Arkadaşlarını sunucuya davet et, efsanevi roller ve binlerce Nights Coin kazan!',
        });
        console.log(`[InviteRewardManager] ✅ #${channel.name} kanalı oluşturuldu.`);
      } catch (err: any) {
        console.warn('[InviteRewardManager] Kanal oluşturma hatası:', err.message);
        return;
      }
    }

    try {
      const messages = await channel.messages.fetch({ limit: 15 });
      const hasPanel = messages.some(
        (m) =>
          m.author.id === client.user?.id &&
          m.embeds.length > 0 &&
          m.embeds[0].title?.includes('DAVET ÖDÜLLERİ')
      );

      if (hasPanel) return;

      const embed = new EmbedBuilder()
        .setColor(0x8b5cf6)
        .setAuthor({
          name: `${guild.name.toUpperCase()} • VİRAL BÜYÜME MERKEZİ`,
          iconURL: guild.iconURL() || undefined,
        })
        .setTitle('🎁  ARKADAŞINI DAVET ET • EFSANE ÖDÜLLERİ KAP!  🚀')
        .setDescription(
          `**Sunucumuzu büyütmeye var mısın?**\n` +
          `Aşağıdaki butona basarak **kendi kalıcı davet linkini** alabilir, arkadaşlarını çağırarak **özel VIP roller** ve **on binlerce Nights Coin** kazanabilirsin!\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `🏆 **KAZANABİLECEĞİN ÖDÜL KADEMELERİ:**\n` +
          `> • **3 Davet:** 🥉 \`Bronz Davetçi\` Rolü + **1,000 Nights Coin** 🪙\n` +
          `> • **5 Davet:** 🥈 \`Gümüş Davetçi\` Rolü + **2,500 Nights Coin** 🪙\n` +
          `> • **10 Davet:** 🥇 \`Altın Davetçi\` Rolü + **5,000 Nights Coin** 🪙\n` +
          `> • **20 Davet:** 💎 \`Elmas Davetçi (VIP)\` Rolü + **15,000 Nights Coin** 👑\n\n` +
          `⚡ **Gelişmiş Güvenlik & Anti-Abuse Kuralları:**\n` +
          `> • 🛡️ **Anti-Fake Koruması:** 3 günden genç veya bot hesaplar geçersiz sayılır.\n` +
          `> • 🚪 **Ayrılan Takibi:** Sunucudan çıkan hesaplar net davetinden düşülür; gerekiyorsa ödül rolün geri alınır!\n` +
          `> • 🚫 **Rejoin Engeli:** Çıkıp tekrar giren üyelere mükerrer davet puanı verilmez!\n` +
          `> • 📊 **Anlık Takip:** \`/davetler\` komutu ile durumunu 7/24 izleyebilirsin.\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `👇 *Hemen davet linkini almak veya sıralamaya bakmak için butona tıkla:*`
        )
        .setImage('https://media.giphy.com/media/26tn3334mvoVClhos/giphy.gif')
        .setFooter({ text: 'Nights Growth Engine • Made by erencix' })
        .setTimestamp();

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('btn_invite_get_link')
          .setLabel('🔗 Özel Davet Linkimi Al')
          .setEmoji('🚀')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('btn_invite_my_stats')
          .setLabel('📊 Davetlerimi Gör')
          .setEmoji('📈')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('btn_invite_top')
          .setLabel('🏆 Liderlik Tablosu')
          .setEmoji('👑')
          .setStyle(ButtonStyle.Secondary)
      );

      await channel.send({ embeds: [embed], components: [row] });
      console.log(`[InviteRewardManager] ✅ #${channel.name} kanalına vitrin paneli asıldı!`);
    } catch (e: any) {
      console.warn('[InviteRewardManager] Vitrin gönderme hatası:', e.message);
    }
  }

  /**
   * Buton Yönetimi
   */
  public static async handleButton(interaction: ButtonInteraction): Promise<boolean> {
    const customId = interaction.customId;
    const member = interaction.member as GuildMember;
    const guild = interaction.guild;
    if (!guild || !member) return false;

    // 1. ÖZEL DAVET LİNKİ AL
    if (customId === 'btn_invite_get_link') {
      await interaction.deferReply({ ephemeral: true });

      let targetChannel = guild.channels.cache.find(
        (c) => c.type === ChannelType.GuildText && (c.name.includes('hos-geldin') || c.name.includes('sohbet'))
      ) as TextChannel | undefined;

      if (!targetChannel) targetChannel = interaction.channel as TextChannel;

      try {
        const invite = await targetChannel.createInvite({
          maxAge: 0, // Sınırsız süre
          maxUses: 0, // Sınırsız kullanım
          unique: false,
          reason: `${member.user.tag} kişisel davet bağlantısı`,
        });

        const inviteEmbed = new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle('🚀 İŞTE SENİN KALICI DAVET BAĞLANTIN!')
          .setDescription(
            `Arkadaşlarını aşağıdaki link ile davet ederek ödülleri toplamaya başlayabilirsin:\n\n` +
            `👉 **Link:** \`${invite.url}\`\n\n` +
            `📋 **Kopyala & Arkadaşlarına Gönder:**\n` +
            `\`\`\`text\nHey! ☊ Nights topluluğuna davet edildin. 7/24 aktif oyun odaları, müzik, çekilişler ve muhabbet için sen de bize katıl:\n${invite.url}\n\`\`\`\n` +
            `💡 *Her katılan arkadaşın için Nights Coin ve VIP roller kazanırsın!*`
          )
          .setFooter({ text: 'Nights Invite Engine • Made by erencix' })
          .setTimestamp();

        await interaction.editReply({ embeds: [inviteEmbed] });
      } catch (err: any) {
        await interaction.editReply({ content: `❌ Davet linki oluşturulamadı: ${err.message}` });
      }
      return true;
    }

    // 2. DAVETLERİMİ GÖR
    if (customId === 'btn_invite_my_stats') {
      await interaction.deferReply({ ephemeral: true });
      const embed = this.buildUserStatsEmbed(guild, member);
      await interaction.editReply({ embeds: [embed] });
      return true;
    }

    // 3. LİDERLİK TABLOSU
    if (customId === 'btn_invite_top') {
      await interaction.deferReply({ ephemeral: true });
      const embed = this.buildLeaderboardEmbed(guild);
      await interaction.editReply({ embeds: [embed] });
      return true;
    }

    return false;
  }

  /**
   * Kullanıcı Davet İstatistik Kartı
   */
  public static buildUserStatsEmbed(guild: Guild, targetMember: GuildMember): EmbedBuilder {
    const data = this.getUserData(targetMember.id);
    const net = this.getNetInvites(data);

    const nextMilestone = INVITE_MILESTONES.find((m) => net < m.required);
    let nextStr = '👑 **Tüm davet ödülleri tamamlandı! Sen tam bir efsanesin!**';

    if (nextMilestone) {
      const remaining = nextMilestone.required - net;
      const percent = Math.min(100, Math.round((net / nextMilestone.required) * 100));
      const blocks = Math.round((percent / 100) * 10);
      const bar = '🟩'.repeat(blocks) + '⬜'.repeat(10 - blocks);
      nextStr =
        `🎯 **Sıradaki Ödül:** \`${nextMilestone.roleName}\` (+${nextMilestone.coins} Coin)\n` +
        `📊 **İlerleme:** \`[${bar}] %${percent}\` (Kalan: **${remaining}** davet)`;
    }

    return new EmbedBuilder()
      .setColor(0x8b5cf6)
      .setAuthor({
        name: `${targetMember.displayName.toUpperCase()} • DAVET PROFİLİ`,
        iconURL: targetMember.displayAvatarURL(),
      })
      .setTitle(`📈  TOPLAM DAVET DURUMU: ${net} NET DAVET`)
      .setDescription(
        `👤 **Kullanıcı:** <@${targetMember.id}>\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `🟢 **Başarılı Davetler:** \`${data.regular || 0} Kişi\`\n` +
        `🔴 **Ayrılanlar (Left):** \`${data.left || 0} Kişi\`\n` +
        `⚠️ **Sahte / Fake Hesaplar:** \`${data.fake || 0} Kişi\`\n` +
        `🔁 **Engellenen Rejoinler:** \`${data.rejoins || 0} Kez\`\n` +
        `⭐ **Bonus Davetler:** \`+${data.bonus || 0}\`\n\n` +
        `✨ **NET GEÇERLİ DAVET SAYIN:** **\`${net}\` Adet**\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        nextStr +
        `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
      )
      .setThumbnail(targetMember.displayAvatarURL())
      .setFooter({ text: 'Nights Invite Engine • Made by erencix' })
      .setTimestamp();
  }

  /**
   * Liderlik Tablosu
   */
  public static buildLeaderboardEmbed(guild: Guild): EmbedBuilder {
    this.load();
    const sorted = Array.from(this.userInvites.entries())
      .map(([userId, data]) => ({ userId, net: this.getNetInvites(data) }))
      .filter((u) => u.net > 0)
      .sort((a, b) => b.net - a.net)
      .slice(0, 10);

    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

    let lines = sorted.map((u, i) => {
      const medal = medals[i] || `**${i + 1}.**`;
      return `> ${medal} <@${u.userId}> ➔ **${u.net}** Net Davet ✨`;
    });

    if (lines.length === 0) {
      lines = ['> *Henüz geçerli davet yapan kimse yok. İlk daveti sen yap!*'];
    }

    return new EmbedBuilder()
      .setColor(0xf1c40f)
      .setAuthor({
        name: `${guild.name.toUpperCase()} • EN ÇOK ÜYE ÇEKENLER`,
        iconURL: guild.iconURL() || undefined,
      })
      .setTitle('🏆  NIGHTS EN İYİ DAVETÇİLER SIRALAMASI')
      .setDescription(
        `Sunucumuza en çok arkadaşını çağırarak topluluğumuzu büyüten kahramanlar:\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        lines.join('\n') +
        `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `💡 *Sen de davet linkini alarak bu listede yerini kap!*`
      )
      .setImage('https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif')
      .setFooter({ text: 'Nights Growth Leaderboard • Made by erencix' })
      .setTimestamp();
  }
}
