import { Guild, PermissionFlagsBits, EmbedBuilder, Role } from 'discord.js';

export interface DiagnosticIssue {
  type: 'MISSING_ADMIN' | 'MISSING_ROLES' | 'MISSING_CHANNELS' | 'MISSING_GUILD' | 'ROLE_HIERARCHY' | 'OTHER';
  title: string;
  detail: string;
  solution: string;
}

export interface DiagnosticReport {
  healthy: boolean;
  canDeploy: boolean;
  botRoleName: string;
  botHighestPosition: number;
  missingPermissions: string[];
  rolesAboveBot: string[];
  issues: DiagnosticIssue[];
  troubleshootingEmbed: EmbedBuilder;
  summaryMessage: string;
}

export class ServerDiagnostics {
  /**
   * Performs full self-diagnostics on bot permissions and role hierarchy for a guild.
   */
  public static check(guild: Guild): DiagnosticReport {
    const me = guild.members.me;
    const missingPermissions: string[] = [];
    const rolesAboveBot: string[] = [];
    const issues: DiagnosticIssue[] = [];

    if (!me) {
      const errEmbed = new EmbedBuilder()
        .setTitle('❌ TEŞHİS HATASI: Bot Sunucuda Bulunamadı')
        .setDescription('Bot sunucu üyesi olarak bulunamadı. Lütfen botu sunucunuza tekrar davet edin.')
        .setColor('#ED4245');

      return {
        healthy: false,
        canDeploy: false,
        botRoleName: 'Bilinmiyor',
        botHighestPosition: 0,
        missingPermissions: ['ALL'],
        rolesAboveBot: [],
        issues: [
          {
            type: 'OTHER',
            title: 'Bot Sunucu Üyesi Değil',
            detail: 'Bot `guild.members.me` nesnesine erişemedi.',
            solution: 'Botu davet linkini kullanarak sunucuya yönetici yetkisiyle yeniden ekleyin.',
          },
        ],
        troubleshootingEmbed: errEmbed,
        summaryMessage: 'Bot sunucuda aktif bir üye olarak bulunamadı.',
      };
    }

    const hasAdmin = me.permissions.has(PermissionFlagsBits.Administrator);
    const hasManageRoles = me.permissions.has(PermissionFlagsBits.ManageRoles);
    const hasManageChannels = me.permissions.has(PermissionFlagsBits.ManageChannels);
    const hasManageGuild = me.permissions.has(PermissionFlagsBits.ManageGuild);

    if (!hasAdmin) {
      missingPermissions.push('Administrator (Yönetici)');
      issues.push({
        type: 'MISSING_ADMIN',
        title: 'Yönetici (Administrator) İzni Eksik',
        detail: 'Botun tam yetkili çalışması, tüm kategorileri ve kural kanallarını eksiksiz kurabilmesi için Yönetici yetkisi önerilir.',
        solution: 'Sunucu Ayarları > Roller sekmesinden bot rolüne "Yönetici" izni verin.',
      });
    }

    if (!hasAdmin && !hasManageRoles) {
      missingPermissions.push('ManageRoles (Rolleri Yönet)');
      issues.push({
        type: 'MISSING_ROLES',
        title: 'Rolleri Yönet İzni Eksik',
        detail: 'Bot yeni rolleri (Yönetici, Moderatör, Üye vb.) oluşturamaz ve renklerini düzenleyemez.',
        solution: 'Botun rolüne "Rolleri Yönet" iznini açın.',
      });
    }

    if (!hasAdmin && !hasManageChannels) {
      missingPermissions.push('ManageChannels (Kanalları Yönet)');
      issues.push({
        type: 'MISSING_CHANNELS',
        title: 'Kanalları Yönet İzni Eksik',
        detail: 'Bot yeni metin, ses ve duyuru kanalları oluşturamaz veya izinlerini ayarlayamaz.',
        solution: 'Botun rolüne "Kanalları Yönet" iznini açın.',
      });
    }

    if (!hasAdmin && !hasManageGuild) {
      missingPermissions.push('ManageGuild (Sunucuyu Yönet)');
      issues.push({
        type: 'MISSING_GUILD',
        title: 'Sunucuyu Yönet İzni Eksik',
        detail: 'Bot sunucu adını güncelleyemez ve otomatik oluşturulan 512x512 logoyu uygulayamaz.',
        solution: 'Botun rolüne "Sunucuyu Yönet" iznini açın.',
      });
    }

    // Role Hierarchy Check
    const botHighestRole = me.roles.highest;
    const botPosition = botHighestRole ? botHighestRole.position : 0;
    const botRoleName = botHighestRole ? botHighestRole.name : 'Bot Rolü';

    // Discord prevents a bot from editing, ordering or deleting roles equal to or higher than its own highest role
    if (guild.roles?.cache) {
      guild.roles.cache.forEach((r: Role) => {
        if (!r.managed && r.id !== guild.id && r.position >= botPosition) {
          rolesAboveBot.push(r.name);
        }
      });
    }

    if (rolesAboveBot.length > 0) {
      issues.push({
        type: 'ROLE_HIERARCHY',
        title: 'Rol Hiyerarşisi Pozisyonu Yetersiz',
        detail: `Botun en yüksek rolü (\`${botRoleName}\`), sunucudaki bazı rollerin altında yer alıyor (${rolesAboveBot.slice(0, 4).join(', ')}${rolesAboveBot.length > 4 ? '...' : ''}). Bu durum rollerin sıralanmasını veya temizlik modunu engelleyebilir.`,
        solution: 'Discord Sunucu Ayarları > Roller menüsünde botun rolünü fareyle tutup Sunucu Sahibinin hemen altına (en tepeye) sürükleyin.',
      });
    }

    const healthy = issues.length === 0;
    // canDeploy: can proceed if hasAdmin OR (hasManageRoles AND hasManageChannels)
    const canDeploy = hasAdmin || (hasManageRoles && hasManageChannels);

    // Build the troubleshooting embed
    const embed = new EmbedBuilder()
      .setColor(healthy ? '#2ECC71' : canDeploy ? '#FEE75C' : '#ED4245')
      .setTitle(
        healthy
          ? '✅ SUNUCU YETKİ VE HİYERARŞİ DURUMU MÜKEMMEL'
          : '🛡️ SUNUCU AYARLARI & TEŞHİS RAPORU'
      )
      .setDescription(
        healthy
          ? `**${guild.name}** sunucusunda bot en üst düzey yetkilere ve ideal hiyerarşik konuma sahip. Tüm inşaat ve otomasyon işlemleri sıfır hatayla çalışacaktır!`
          : `**${guild.name}** üzerinde tespit edilen **${issues.length} adet** kritik yetkilendirme veya hiyerarşi uyarısı bulunmaktadır.\nSorunsuz bir kurulum için lütfen aşağıdaki adımları uygulayın.`
      )
      .setTimestamp();

    if (!healthy) {
      const issueDetails = issues
        .map((issue, idx) => `**${idx + 1}. ${issue.title}**\n> ⚠️ *${issue.detail}*`)
        .join('\n\n');
      embed.addFields({
        name: '🔍 Tespit Edilen Durumlar',
        value: issueDetails.slice(0, 1024),
        inline: false,
      });

      embed.addFields({
        name: '👑 Rol Hiyerarşisi Şeması (Olması Gereken Sıralama)',
        value: [
          '```text',
          '👑 [Sunucu Sahibi / Kurucu]',
          `🤖 [@${botRoleName}]  <-- (Botun rolü burada olmalı!)`,
          '🛡️ [Yönetici / Moderatör]',
          '👥 [@everyone / Normal Üyeler]',
          '```',
        ].join('\n'),
        inline: false,
      });

      embed.addFields({
        name: '🛠️ 30 Saniyede Adım Adım Çözüm Kılavuzu',
        value: [
          '1. Discord sol üstünden **Sunucu Adı**na tıklayıp **Sunucu Ayarları (Server Settings)** açın.',
          '2. Sol menüden **Roller (Roles)** sekmesine gelin.',
          `3. **@${botRoleName}** rolünü farenizle tutup en üst sıraya (Sunucu Sahibinin hemen altına) sürükleyin.`,
          '4. Bot rolüne tıklayıp **İzinler** sekmesinden **Yönetici (Administrator)** iznini aktif edin.',
          '5. **Değişiklikleri Kaydet** butonuna basın ve işlemi tekrar başlatın!',
        ].join('\n'),
        inline: false,
      });

      embed.setFooter({
        text: 'Discord AI Architect Self-Diagnostics • Güvenli Sunucu Mimarisi',
      });
    }

    const summaryMessage = healthy
      ? 'Yetkiler ve rol hiyerarşisi tam, kuruluma hazır.'
      : `Yetki/Hiyerarşi Uyarısı: ${issues.map((i) => i.title).join(', ')}`;

    return {
      healthy,
      canDeploy,
      botRoleName,
      botHighestPosition: botPosition,
      missingPermissions,
      rolesAboveBot,
      issues,
      troubleshootingEmbed: embed,
      summaryMessage,
    };
  }
}
