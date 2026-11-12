import {
  Client,
  Guild,
  TextChannel,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
  GuildMember,
  ChannelType,
  PermissionFlagsBits,
} from 'discord.js';
import { PersistentStore } from '../storage/persistentStore';
import path from 'path';
import fs from 'fs';

export interface GameLobby {
  id: string;
  guildId: string;
  channelId: string;
  messageId: string;
  hostId: string;
  hostTag: string;
  game: string;
  targetSlots: number;
  currentPlayers: string[]; // user IDs
  rankRequirement: string;
  note: string;
  voiceChannelId?: string;
  createdAt: number;
  status: 'active' | 'full' | 'closed';
}

// Oyunlara özel afişler, emojiler ve renkler
const GAME_CONFIGS: Record<
  string,
  { name: string; color: number; emoji: string; icon: string; banner: string }
> = {
  valorant: {
    name: 'Valorant',
    color: 0xff4655, // Valorant Kırmızısı
    emoji: '🎯',
    icon: 'https://cdn3.emoji.gg/emojis/3042-valorant.png',
    banner: 'https://media.giphy.com/media/26tn3334mvoVClhos/giphy.gif',
  },
  cs2: {
    name: 'Counter-Strike 2',
    color: 0xde9b35, // CS Turuncusu
    emoji: '💣',
    icon: 'https://cdn3.emoji.gg/emojis/137353-diamondpickaxe.gif',
    banner: 'https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif',
  },
  lol: {
    name: 'League of Legends',
    color: 0x0ac8b9, // Hextech Mavisi
    emoji: '⚔️',
    icon: 'https://cdn3.emoji.gg/emojis/25903-potion.gif',
    banner: 'https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif',
  },
  gta: {
    name: 'GTA V / FiveM',
    color: 0x2ecc71,
    emoji: '🚗',
    icon: 'https://cdn3.emoji.gg/emojis/608938-cute-ghost.gif',
    banner: 'https://media.giphy.com/media/EPfV3ijMQVl60/giphy.gif',
  },
  minecraft: {
    name: 'Minecraft',
    color: 0x55efc4,
    emoji: '⛏️',
    icon: 'https://cdn3.emoji.gg/emojis/490211-chainmailchestplate.gif',
    banner: 'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZqOHo0bTJ5eWpkaWZ1Z29reTFrMmtnOGUza2Q1bDJqZ214NnB3dyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/L1R1tvI9svkIWwpVYr/giphy.gif',
  },
  roblox: {
    name: 'Roblox',
    color: 0xe74c3c,
    emoji: '🧱',
    icon: 'https://cdn3.emoji.gg/emojis/102065-caterpillarspin.gif',
    banner: 'https://media.giphy.com/media/l41lI4bYmcsPJX9Go/giphy.gif',
  },
  tft: {
    name: 'Teamfight Tactics',
    color: 0x9b59b6,
    emoji: '♟️',
    icon: 'https://cdn3.emoji.gg/emojis/527084-milkbucket.gif',
    banner: 'https://media.giphy.com/media/26tn3334mvoVClhos/giphy.gif',
  },
  diger: {
    name: 'Diğer Oyunlar',
    color: 0x6c5ce7,
    emoji: '🎮',
    icon: 'https://cdn3.emoji.gg/emojis/698180-dbzdragonballanimelogo.gif',
    banner: 'https://media.giphy.com/media/EPfV3ijMQVl60/giphy.gif',
  },
};

export class GamerHubManager {
  private static lobbies = new Map<string, GameLobby>();
  private static initialized = false;

  public static init(client: Client): void {
    if (this.initialized) return;
    this.initialized = true;

    this.load();

    // 1 dakikada bir eski (2 saatten eski) lobileri temizle
    setInterval(() => {
      this.sweepExpiredLobbies(client);
    }, 60000);

    // Sunuculardaki #oyun-arkadasi-bul kanalına sabit vitrin panelini yerleştir
    for (const [, guild] of client.guilds.cache) {
      this.ensureHubPanel(guild, client).catch(() => {});
    }
  }

  public static load(): void {
    try {
      const dataPath = path.resolve(process.cwd(), 'data/game_lobbies.json');
      if (fs.existsSync(dataPath)) {
        const raw = fs.readFileSync(dataPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.lobbies.clear();
          for (const item of parsed) {
            this.lobbies.set(item.id, item);
          }
        }
      }
    } catch (e: any) {
      console.warn('[GamerHubManager] Veri yüklenemedi:', e.message);
    }
  }

  public static save(): void {
    try {
      const list = Array.from(this.lobbies.values());
      PersistentStore.atomicSaveJson('game_lobbies.json', list);
    } catch (e: any) {
      console.warn('[GamerHubManager] Veri kaydedilemedi:', e.message);
    }
  }

  /**
   * #oyun-arkadasi-bul kanalına tek tıkla çalışan Master Lobi Paneli kurar
   */
  public static async ensureHubPanel(guild: Guild, client: Client): Promise<void> {
    const channel = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildText && (c.name.includes('oyun-arkadasi-bul') || c.name.includes('lobi'))
    ) as TextChannel | undefined;

    if (!channel) return;

    try {
      const messages = await channel.messages.fetch({ limit: 15 });
      const hasPanel = messages.some(
        (m) =>
          m.author.id === client.user?.id &&
          m.embeds.length > 0 &&
          m.embeds[0].title?.includes('NIGHTS GAMER HUB')
      );

      if (hasPanel) return;

      const embed = new EmbedBuilder()
        .setColor(0x8b5cf6)
        .setAuthor({
          name: `${guild.name.toUpperCase()} • OYUN & TAKIM MERKEZİ`,
          iconURL: guild.iconURL() || undefined,
        })
        .setTitle('🎮  NIGHTS GAMER HUB & OYUN LOBİSİ MERKEZİ  🚀')
        .setDescription(
          `**Takım arkadaşı mı arıyorsun?**\n` +
          `Tek başınıza oynamaktan sıkıldıysanız aşağıdaki butona tıklayarak **1 saniyede oyun lobisi açabilir** veya açılmış lobilerden birine katılabilirsiniz!\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `🎯 **Desteklenen Popüler Oyunlar:**\n` +
          `> • **Valorant** (Duo, Trio, 5P Rekabetçi)\n` +
          `> • **Counter-Strike 2** (Premier, Rekabetçi, Yoldaş)\n` +
          `> • **League of Legends** (Dereceli Çift, Esnek, ARAM)\n` +
          `> • **GTA V / FiveM, Minecraft, Roblox & TFT**\n\n` +
          `⚡ **Özellikler:**\n` +
          `> • 🔊 **Ses Odası Entegrasyonu:** Lobiye katıldığınızda bot sizi otomatik olarak liderin ses kanalına taşır.\n` +
          `> • 🔔 **Otomatik Bildirim:** Lobi dolduğunda tüm takım üyeleri kanalda etiketlenir!\n` +
          `> • 📊 **Anlık Takip:** Koltuk durumu canlı güncellenir.\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `👇 *Hemen takımını toplamak için butona bas:*`
        )
        .setImage('https://media.giphy.com/media/26tn3334mvoVClhos/giphy.gif')
        .setFooter({ text: 'Nights Gamer Hub • Made by erencix' })
        .setTimestamp();

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('btn_open_lobby_modal')
          .setLabel('➕ Hızlı Lobi Oluştur / Create Lobby')
          .setEmoji('🎮')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('btn_how_it_works')
          .setLabel('Nasıl Çalışır?')
          .setEmoji('❓')
          .setStyle(ButtonStyle.Secondary)
      );

      await channel.send({ embeds: [embed], components: [row] });
      console.log(`[GamerHubManager] ✅ #${channel.name} kanalına Gamer Hub vitrini yerleştirildi!`);
    } catch (e: any) {
      console.warn('[GamerHubManager] Vitrin gönderim hatası:', e.message);
    }
  }

  /**
   * Yeni bir oyun lobisi oluşturur ve kanala kartını atar
   */
  public static async createLobby(params: {
    guild: Guild;
    channel: TextChannel;
    host: GuildMember;
    gameKey: string;
    customGameName?: string;
    targetSlots: number;
    rankReq?: string;
    note?: string;
  }): Promise<GameLobby> {
    const lobbyId = `lobby_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const cfg = GAME_CONFIGS[params.gameKey.toLowerCase()] || {
      name: params.customGameName || params.gameKey,
      color: 0x8b5cf6,
      emoji: '🎮',
      icon: 'https://cdn3.emoji.gg/emojis/3042-valorant.png',
      banner: 'https://media.giphy.com/media/26tn3334mvoVClhos/giphy.gif',
    };

    const voiceChannel = params.host.voice?.channel;

    const lobby: GameLobby = {
      id: lobbyId,
      guildId: params.guild.id,
      channelId: params.channel.id,
      messageId: '',
      hostId: params.host.id,
      hostTag: params.host.user.tag,
      game: cfg.name,
      targetSlots: params.targetSlots,
      currentPlayers: [params.host.id],
      rankRequirement: params.rankReq || 'Fark Etmez / Any Rank',
      note: params.note || 'Ses şart, keyifli oyunlar!',
      voiceChannelId: voiceChannel?.id,
      createdAt: Date.now(),
      status: 'active',
    };

    const embed = this.buildLobbyEmbed(lobby, cfg, params.guild);
    const row = this.buildLobbyRow(lobby);

    const message = await params.channel.send({
      content: `📢 **Yeni Oyun Lobisi Açıldı!** <@${params.host.id}> takım arkadaşı arıyor! 🎮`,
      embeds: [embed],
      components: [row],
    });

    lobby.messageId = message.id;
    this.lobbies.set(lobbyId, lobby);
    this.save();

    return lobby;
  }

  /**
   * Lobi Embed Kartı Üretici
   */
  public static buildLobbyEmbed(lobby: GameLobby, cfg: any, guild: Guild): EmbedBuilder {
    const filled = lobby.currentPlayers.length;
    const total = lobby.targetSlots;
    const percent = Math.min(100, Math.round((filled / total) * 100));

    // İlerleme çubuğu
    const barBlocks = 8;
    const filledBlocks = Math.round((filled / total) * barBlocks);
    const emptyBlocks = barBlocks - filledBlocks;
    const bar = '🟩'.repeat(filledBlocks) + '⬜'.repeat(Math.max(0, emptyBlocks));

    // Kadro listesi
    const playerLines = lobby.currentPlayers.map((id, index) => {
      const isLeader = id === lobby.hostId;
      return `> **${index + 1}.** <@${id}> ${isLeader ? '👑 *(Lobi Lideri)*' : '🎮'}`;
    });

    // Kalan boş koltuklar
    for (let i = filled; i < total; i++) {
      playerLines.push(`> **${i + 1}.** ⏳ *[Boş Koltuk / Available]*`);
    }

    const isFull = filled >= total;
    const isClosed = lobby.status === 'closed';

    let statusText = '🟢 **LOBİ AÇIK • OYUNCULAR BEKLENİYOR**';
    let embedColor = cfg.color;

    if (isFull) {
      statusText = '🔥 **LOBİ TAMAMLANDI • KADRO HAZIR!** 🚀';
      embedColor = 0xf1c40f; // Altın sarısı
    } else if (isClosed) {
      statusText = '🔴 **LOBİ KAPATILDI • SONLANDI**';
      embedColor = 0x64748b; // Gri
    }

    const voiceStr = lobby.voiceChannelId
      ? `<#${lobby.voiceChannelId}>`
      : '*Henüz ses odasına girilmedi*';

    return new EmbedBuilder()
      .setColor(embedColor)
      .setAuthor({
        name: `NIGHTS GAMER HUB • ${cfg.name.toUpperCase()}`,
        iconURL: guild.iconURL() || undefined,
      })
      .setTitle(`${cfg.emoji}  ${cfg.name} LOBİSİ  ┃  ${filled}/${total} OYUNCU`)
      .setDescription(
        `${statusText}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `👑 **Lobi Lideri:** <@${lobby.hostId}>\n` +
        `🎯 **Aranan Rank:** \`${lobby.rankRequirement}\`\n` +
        `🔊 **Ses Kanalı:** ${voiceStr}\n` +
        `📝 **Lider Notu:** *"${lobby.note}"*\n\n` +
        `👥 **Mevcut Kadro (${filled}/${total}):**\n` +
        playerLines.join('\n') +
        `\n\n` +
        `📊 **Doluluk:** \`[${bar}] %${percent}\`\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
      )
      .setImage(cfg.banner)
      .setFooter({
        text: `Lobi ID: ${lobby.id} • Nights Gamer Hub`,
      })
      .setTimestamp(lobby.createdAt);
  }

  /**
   * Lobi Buton Satırı
   */
  public static buildLobbyRow(lobby: GameLobby): ActionRowBuilder<ButtonBuilder> {
    const isFull = lobby.currentPlayers.length >= lobby.targetSlots;
    const isClosed = lobby.status === 'closed';

    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`lobby_join_${lobby.id}`)
        .setLabel(isFull ? 'Lobi Doldu' : '🎮 Lobiye Katıl / Join')
        .setStyle(ButtonStyle.Success)
        .setDisabled(isFull || isClosed),
      new ButtonBuilder()
        .setCustomId(`lobby_leave_${lobby.id}`)
        .setLabel('🚪 Ayrıl')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(isClosed),
      new ButtonBuilder()
        .setCustomId(`lobby_close_${lobby.id}`)
        .setLabel('❌ Lobiyi Kapat')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(isClosed)
    );
  }

  /**
   * Buton Tıklama Olaylarını Yönetir
   */
  public static async handleButton(interaction: ButtonInteraction): Promise<boolean> {
    const customId = interaction.customId;

    // 1. "Nasıl Çalışır?" Butonu
    if (customId === 'btn_how_it_works') {
      await interaction.reply({
        content:
          `🎮 **Nights Gamer Hub Nasıl Çalışır?**\n\n` +
          `1. **Lobi Aç:** \`/lobi-bul\` komutunu kullan veya **"➕ Hızlı Lobi Oluştur"** butonuna bas.\n` +
          `2. **Takımını Topla:** Oyununu ve kaç kişi aradığını seç. Kart anında bu kanala basılır.\n` +
          `3. **Otomatik Ses:** Eğer sesteysen, lobiye katılan arkadaşlarını bot otomatik senin odana taşır!\n` +
          `4. **Lobi Dolduğunda:** Tüm kadro kanalda etiketlenir ve maç başlar! 🔥`,
        ephemeral: true,
      });
      return true;
    }

    // 2. Lobi Katıl / Ayrıl / Kapat Butonları
    if (
      !customId.startsWith('lobby_join_') &&
      !customId.startsWith('lobby_leave_') &&
      !customId.startsWith('lobby_close_')
    ) {
      return false;
    }

    const lobbyId = customId.replace(/lobby_(join|leave|close)_/, '');
    const lobby = this.lobbies.get(lobbyId);

    if (!lobby) {
      await interaction.reply({
        content: '⚠️ **Bu lobi artık aktif değil veya süresi dolmuş.**',
        ephemeral: true,
      });
      return true;
    }

    const userId = interaction.user.id;
    const member = interaction.member as GuildMember;
    const guild = interaction.guild;
    if (!guild || !member) return true;

    // --- KATILMA (JOIN) ---
    if (customId.startsWith('lobby_join_')) {
      if (lobby.status === 'closed') {
        await interaction.reply({ content: '❌ Bu lobi kapatılmış.', ephemeral: true });
        return true;
      }

      if (lobby.currentPlayers.includes(userId)) {
        await interaction.reply({ content: '⚠️ Zaten bu lobidesiniz!', ephemeral: true });
        return true;
      }

      if (lobby.currentPlayers.length >= lobby.targetSlots) {
        await interaction.reply({ content: '⚠️ Üzgünüz, bu lobi doldu!', ephemeral: true });
        return true;
      }

      // Üyeyi lobiye ekle
      lobby.currentPlayers.push(userId);

      // Eğer lobi kapasiteye ulaştıysa lobi durumunu 'full' yap
      const isNowFull = lobby.currentPlayers.length >= lobby.targetSlots;
      if (isNowFull) {
        lobby.status = 'full';
      }

      this.save();

      // Mesajı güncelle
      const cfg = GAME_CONFIGS[lobby.game.toLowerCase()] || {
        name: lobby.game,
        color: 0x8b5cf6,
        emoji: '🎮',
        banner: 'https://media.giphy.com/media/26tn3334mvoVClhos/giphy.gif',
      };
      const embed = this.buildLobbyEmbed(lobby, cfg, guild);
      const row = this.buildLobbyRow(lobby);

      await interaction.update({ embeds: [embed], components: [row] });

      // Ses Kanalına Otomatik Taşıma
      let voiceNotice = '';
      if (lobby.voiceChannelId) {
        const targetVoice = guild.channels.cache.get(lobby.voiceChannelId);
        if (targetVoice && targetVoice.isVoiceBased()) {
          if (member.voice?.channel && member.voice.channel.id !== lobby.voiceChannelId) {
            try {
              await member.voice.setChannel(lobby.voiceChannelId);
              voiceNotice = `\n🔊 Otomatik olarak <#${lobby.voiceChannelId}> odasına taşındınız!`;
            } catch {}
          } else if (!member.voice?.channel) {
            voiceNotice = `\n💡 Lütfen ekiple buluşmak için <#${lobby.voiceChannelId}> odasına geçiniz.`;
          }
        }
      }

      await interaction.followUp({
        content: `🎉 **${lobby.game} lobisine başarıyla katıldınız!** (${lobby.currentPlayers.length}/${lobby.targetSlots})${voiceNotice}`,
        ephemeral: true,
      });

      // Lobi dolduysa kanala bildirim at!
      if (isNowFull && interaction.channel && 'send' in interaction.channel) {
        const mentions = lobby.currentPlayers.map((id) => `<@${id}>`).join(' ');
        await (interaction.channel as any).send({
          content: `🔥 **LOBİ DOLDU! KADRO TOPLANDI!** 🚀\n${mentions}\n> 🎮 **${lobby.game}** maçı için tüm koltuklar doldu. İyi oyunlar dileriz! 🏆`,
        });
      }

      return true;
    }

    // --- AYRILMA (LEAVE) ---
    if (customId.startsWith('lobby_leave_')) {
      if (!lobby.currentPlayers.includes(userId)) {
        await interaction.reply({ content: '⚠️ Bu lobide değilsiniz.', ephemeral: true });
        return true;
      }

      // Eğer lobi lideri ayrılmaya çalışırsa lobiyi kapatır
      if (userId === lobby.hostId) {
        lobby.status = 'closed';
        this.save();
        const cfg = GAME_CONFIGS[lobby.game.toLowerCase()] || { name: lobby.game, color: 0x64748b, emoji: '🎮', banner: '' };
        const embed = this.buildLobbyEmbed(lobby, cfg, guild);
        const row = this.buildLobbyRow(lobby);
        await interaction.update({ embeds: [embed], components: [row] });
        await interaction.followUp({ content: '❌ Lobi lideri ayrıldığı için lobi sonlandırıldı.', ephemeral: true });
        return true;
      }

      // Normal üye ayrılıyor
      lobby.currentPlayers = lobby.currentPlayers.filter((id) => id !== userId);
      if (lobby.status === 'full') {
        lobby.status = 'active'; // Tekrar açık duruma geçti
      }
      this.save();

      const cfg = GAME_CONFIGS[lobby.game.toLowerCase()] || { name: lobby.game, color: 0x8b5cf6, emoji: '🎮', banner: '' };
      const embed = this.buildLobbyEmbed(lobby, cfg, guild);
      const row = this.buildLobbyRow(lobby);

      await interaction.update({ embeds: [embed], components: [row] });
      await interaction.followUp({ content: '🚪 Lobiden ayrıldınız.', ephemeral: true });
      return true;
    }

    // --- KAPATMA (CLOSE) ---
    if (customId.startsWith('lobby_close_')) {
      // Sadece lobi lideri veya sunucu yöneticisi kapatabilir
      const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);
      if (userId !== lobby.hostId && !isAdmin) {
        await interaction.reply({
          content: '⛔ **Yalnızca lobi lideri lobiyi kapatabilir!**',
          ephemeral: true,
        });
        return true;
      }

      lobby.status = 'closed';
      this.save();

      const cfg = GAME_CONFIGS[lobby.game.toLowerCase()] || { name: lobby.game, color: 0x64748b, emoji: '🎮', banner: '' };
      const embed = this.buildLobbyEmbed(lobby, cfg, guild);
      const row = this.buildLobbyRow(lobby);

      await interaction.update({ embeds: [embed], components: [row] });
      await interaction.followUp({ content: '❌ Lobi başarıyla kapatıldı.', ephemeral: true });
      return true;
    }

    return false;
  }

  /**
   * Süresi dolan lobileri kapatır (2 saat)
   */
  private static sweepExpiredLobbies(client: Client): void {
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    let changed = false;

    for (const [id, lobby] of this.lobbies.entries()) {
      if (lobby.createdAt < twoHoursAgo && lobby.status !== 'closed') {
        lobby.status = 'closed';
        changed = true;
      }
    }

    if (changed) {
      this.save();
    }
  }
}
