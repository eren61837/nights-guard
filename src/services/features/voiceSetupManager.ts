import {
  Client,
  ChannelType,
  PermissionFlagsBits,
  Guild,
  CategoryChannel,
  VoiceChannel,
  TextChannel,
  EmbedBuilder,
  Role,
} from 'discord.js';

export class VoiceSetupManager {
  private static ran = false;

  public static async ensureEnhancedVoiceChannels(client: Client): Promise<void> {
    if (this.ran) return;
    this.ran = true;

    for (const [_, guild] of client.guilds.cache) {
      try {
        await this.setupGuildChannels(guild, client);
      } catch (err: any) {
        console.error(`[VoiceSetupManager] ${guild.name} için kanal kurulum hatası:`, err.message);
      }
    }
  }

  private static async setupGuildChannels(guild: Guild, client: Client): Promise<void> {
    console.log(`[VoiceSetupManager] 🎙️ ${guild.name} sunucusu için ses ve yetki ayarları kontrol ediliyor...`);

    const everyoneRole = guild.roles.everyone;
    const roles = await guild.roles.fetch();

    const kurucuRole = roles.find((r) => r.name.toLowerCase().includes('kurucu') || r.name.toLowerCase().includes('owner'));
    const adminRole = roles.find((r) => r.name.toLowerCase().includes('yönetici') || r.name.toLowerCase().includes('admin'));
    const modRole = roles.find((r) => r.name.toLowerCase().includes('moderatör') || r.name.toLowerCase().includes('mod'));
    const approvedRole = roles.find((r) => r.name.toLowerCase().includes('onaylı') || r.name.toLowerCase().includes('üye'));

    // 0. MÜZİK KANALLARINI SİL (Kullanıcı İsteği)
    for (const [, ch] of guild.channels.cache) {
      if (!ch) continue;
      const lower = ch.name.toLocaleLowerCase('tr-TR');
      if (lower.includes('müzik') || lower.includes('muzik') || lower.includes('music')) {
        try {
          await ch.delete('Kullanıcı isteğiyle müzik kanalları kaldırıldı.');
          console.log(`[VoiceSetupManager] 🗑️ Müzik kanalı silindi: ${ch.name}`);
        } catch (e: any) {
          console.warn(`[VoiceSetupManager] Müzik kanalı silinemedi (${ch.name}):`, e.message);
        }
      }
    }

    // Helper: Find or create Category
    const getOrCreateCategory = async (name: string, overwrites: any[] = []): Promise<CategoryChannel> => {
      const existing = guild.channels.cache.find(
        (c) => c.type === ChannelType.GuildCategory && (c.name === name || c.name.toLowerCase().includes(name.toLowerCase().slice(3)))
      ) as CategoryChannel | undefined;

      if (existing) {
        if (overwrites.length > 0) {
          await existing.permissionOverwrites.set(overwrites).catch(() => {});
        }
        return existing;
      }

      return await guild.channels.create({
        name,
        type: ChannelType.GuildCategory,
        permissionOverwrites: overwrites,
      });
    };

    // Helper: Find or create Voice Channel (ve izinleri güncelle)
    const getOrCreateVoice = async (
      name: string,
      parentId: string | null,
      options: { userLimit?: number; bitrate?: number; overwrites?: any[] } = {}
    ): Promise<VoiceChannel> => {
      const existing = guild.channels.cache.find(
        (c) => c.type === ChannelType.GuildVoice && (c.name === name || c.name.toLowerCase().includes(name.toLowerCase().slice(3)))
      ) as VoiceChannel | undefined;

      if (existing) {
        if (options.overwrites && options.overwrites.length > 0) {
          await existing.permissionOverwrites.set(options.overwrites).catch(() => {});
        }
        return existing;
      }

      console.log(`[VoiceSetupManager] ➕ Yeni ses kanalı oluşturuluyor: ${name}`);
      return await guild.channels.create({
        name,
        type: ChannelType.GuildVoice,
        parent: parentId || undefined,
        userLimit: options.userLimit || 0,
        bitrate: options.bitrate || 64000,
        permissionOverwrites: options.overwrites || [],
      });
    };

    // 1. SİNEMA, ANİME & İZLEME ODALARI
    const catCinema = await getOrCreateCategory('🍿 ┃ SİNEMA & İZLEME', [
      { id: everyoneRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.Stream] },
    ]);

    await getOrCreateVoice('🍿・Sinema & Dizi Odası', catCinema.id, { bitrate: 96000 });
    await getOrCreateVoice('🍙・Anime & Watch Party', catCinema.id, { bitrate: 96000 });

    // 2. VALORANT & OYUN ODALARI (5 Kişilik Rekabetçi + Sabit Oyun Odası 1 & 2)
    const catGaming = await getOrCreateCategory('🎯 ┃ VALORANT & OYUN ODALARI', [
      { id: everyoneRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak] },
    ]);

    // Sabit Oyun Odaları (#1 ve #2) - Asla silinmeyecek şekilde geri yüklendi
    await getOrCreateVoice('🎮・Oyun Odası 1', catGaming.id, { bitrate: 96000 });
    await getOrCreateVoice('🎮・Oyun Odası 2', catGaming.id, { bitrate: 96000 });

    await getOrCreateVoice('🎯・Valorant Rekabetçi #1', catGaming.id, { userLimit: 5, bitrate: 96000 });
    await getOrCreateVoice('🎯・Valorant Rekabetçi #2', catGaming.id, { userLimit: 5, bitrate: 96000 });
    await getOrCreateVoice('🔫・Valorant Duo (2 Kişi)', catGaming.id, { userLimit: 2, bitrate: 96000 });
    await getOrCreateVoice('🏹・Valorant Trio (3 Kişi)', catGaming.id, { userLimit: 3, bitrate: 96000 });
    await getOrCreateVoice('⛏️・Minecraft Ekibi', catGaming.id, { userLimit: 10, bitrate: 64000 });
    await getOrCreateVoice('🧱・Roblox Tayfası', catGaming.id, { userLimit: 8, bitrate: 64000 });
    await getOrCreateVoice('♟️・TFT Strateji Masası', catGaming.id, { userLimit: 4, bitrate: 64000 });

    // 3. YÖNETİCİ & YETKİLİ ÖZEL SES ODALARI (HERKES GÖREBİLİR, AMA KATILAMAZ!)
    const staffCategoryOverwrites: any[] = [
      {
        id: everyoneRole.id,
        allow: [PermissionFlagsBits.ViewChannel],
        deny: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
      },
    ];
    if (approvedRole) {
      staffCategoryOverwrites.push({
        id: approvedRole.id,
        allow: [PermissionFlagsBits.ViewChannel],
        deny: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
      });
    }
    if (modRole) staffCategoryOverwrites.push({ id: modRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak] });
    if (adminRole) staffCategoryOverwrites.push({ id: adminRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.MoveMembers] });
    if (kurucuRole) staffCategoryOverwrites.push({ id: kurucuRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.MoveMembers] });

    const catStaff = await getOrCreateCategory('🔒 ┃ YETKİLİ ÖZEL', staffCategoryOverwrites);
    if (catStaff) {
      await catStaff.permissionOverwrites.set(staffCategoryOverwrites).catch(() => {});
    }

    // Toplantı Odası (Tüm üyeler görebilir ama katılamaz; Mod/Admin/Kurucu katılabilir)
    const meetingOverwrites: any[] = [
      {
        id: everyoneRole.id,
        allow: [PermissionFlagsBits.ViewChannel],
        deny: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
      },
    ];
    if (approvedRole) meetingOverwrites.push({ id: approvedRole.id, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak] });
    if (modRole) meetingOverwrites.push({ id: modRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak] });
    if (adminRole) meetingOverwrites.push({ id: adminRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.MoveMembers] });
    if (kurucuRole) meetingOverwrites.push({ id: kurucuRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.MoveMembers] });

    await getOrCreateVoice('👑・Yönetici Toplantı Odası', catStaff.id, {
      bitrate: 96000,
      overwrites: meetingOverwrites,
    });

    // Kurucu Özel (Tüm üyeler ve modlar görebilir ama katılamaz; Sadece Kurucu ve Admin katılabilir)
    const ownerOverwrites: any[] = [
      {
        id: everyoneRole.id,
        allow: [PermissionFlagsBits.ViewChannel],
        deny: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
      },
    ];
    if (approvedRole) ownerOverwrites.push({ id: approvedRole.id, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak] });
    if (modRole) ownerOverwrites.push({ id: modRole.id, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak] });
    if (adminRole) ownerOverwrites.push({ id: adminRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak] });
    if (kurucuRole) ownerOverwrites.push({ id: kurucuRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.MoveMembers] });

    await getOrCreateVoice('🎙️・Kurucu Özel Odası', catStaff.id, {
      bitrate: 96000,
      overwrites: ownerOverwrites,
    });

    // 4. GENEL SES ODALARI (AFK Odası)
    const catVoice = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildCategory && (c.name.includes('SES') || c.name.includes('VOICE'))
    ) as CategoryChannel | undefined;

    if (catVoice) {
      await getOrCreateVoice('💤・AFK & Dinlenme', catVoice.id, { bitrate: 64000 });
    }

    // 5. SES BİLGİLENDİRME KANALI (Ses Odaları Bölümünde)
    const targetVoiceCat = catVoice || catCinema || catGaming;
    if (targetVoiceCat) {
      let infoChannel = guild.channels.cache.find(
        (c) => c.type === ChannelType.GuildText && (c.name.includes('ses-bilgilendirme') || c.name.includes('ses-bilgi'))
      ) as TextChannel | undefined;

      if (!infoChannel) {
        infoChannel = await guild.channels.create({
          name: '📌・ses-bilgilendirme',
          type: ChannelType.GuildText,
          parent: targetVoiceCat.id,
          permissionOverwrites: [
            {
              id: everyoneRole.id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
              deny: [
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.AddReactions,
                PermissionFlagsBits.CreatePublicThreads,
                PermissionFlagsBits.CreatePrivateThreads,
              ],
            },
          ],
        });
      }

      if (infoChannel) {
        const msgs = await infoChannel.messages.fetch({ limit: 10 }).catch(() => null);
        const hasBotMsg = msgs && msgs.some((m) => m.author.id === client.user?.id);

        if (!hasBotMsg) {
          const guideEmbed = new EmbedBuilder()
            .setTitle('🎙️ NIGHTS SES ODALARI & SİSTEM REHBERİ 📌')
            .setDescription(
              'Sunucumuzdaki ses odalarını rahatça kullanabilmeniz ve odalarınızı yönetebilmeniz için hazırlanan rehberdir.\n\n' +
              '### ➕ 1. Özel Geçici Ses Odası Nasıl Açılır?\n' +
              '> **`➕︱Oda Oluştur`** ses kanalına tıkladığınız anda sistem adınıza özel bir oda açar ve sizi otomatik olarak odaya aktarır.\n\n' +
              '### ⚙️ 2. Odanızı Nasıl Yönetirsiniz?\n' +
              '> Açılan odanın yöneticisi siz olursunuz! **`#ses-kontrol`** paneli üzerinden:\n' +
              '> 🔒 **Odayı Kilitleyebilir:** İstemediğiniz kişilerin girişini engelleyebilirsiniz.\n' +
              '> 👥 **Kişi Sınırı Koyabilir:** Odanıza kaç kişinin girebileceğini ayarlayabilirsiniz.\n' +
              '> ✏️ **İsim Değiştirebilir:** Odanıza dilediğiniz ismi verebilirsiniz.\n\n' +
              '### 🗑️ 3. Boşalan Odalar Ne Zaman Silinir?\n' +
              '> Özel açılan geçici odadan son kişi ayrıldığında sunucu kirliliği olmaması için oda **otomatik silinir**.\n\n' +
              '### 🎯 4. Sabit Sunucu Odaları (Asla Silinmez)\n' +
              '> 🎮 **Oyun Odası 1 & 2:** Kesintisiz sabit genel oyun sohbet alanları.\n' +
              '> 🎯 **Valorant Rekabetçi:** 5 kişilik rekabetçi takım lobileri, Duo ve Trio odaları.\n' +
              '> 🍿 **Sinema & Anime:** Yüksek kaliteli yayın açık izleme ve watch party odaları.\n' +
              '> 👑 **Yönetici & Kurucu Odaları:** Yetkililere özel kilitli toplantı odaları.\n' +
              '> 💤 **AFK Odası:** Masada olmadığınızda taşındığınız dinlenme kanalı.\n\n' +
              '### 📜 5. Ses Odası Kuralları\n' +
              '> 🚫 Yüksek ses, kulak tırmalayıcı ses efektleri veya soundboard spamı yasaktır.\n' +
              '> 🚫 Yayın açan üyelerin yayınını kasten sabote etmek ceza sebebidir.\n' +
              '> 🤝 Tüm üyelerimize karşı seviyeli ve samimi bir ortam korunmalıdır.'
            )
            .setColor('#5865F2')
            .setThumbnail(guild.iconURL() || client.user?.displayAvatarURL() || null)
            .setFooter({ text: 'Nights Community Voice Engine • Made by erencix' })
            .setTimestamp();

          await infoChannel.send({ embeds: [guideEmbed] }).catch(() => {});
          console.log(`[VoiceSetupManager] 📌 Ses bilgilendirme mesajı gönderildi: #${infoChannel.name}`);
        }
      }
    }

    console.log(`[VoiceSetupManager] ✅ ${guild.name} için tüm ses kanalları ve izinler başarıyla güncellendi!`);
  }
}
