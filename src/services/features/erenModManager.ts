import {
  GuildMember,
  TextBasedChannel,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  Message,
  MessageFlags,
} from 'discord.js';
import {
  joinVoiceChannel,
  createAudioPlayer,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
} from '@discordjs/voice';
import { MusicPlayer, Song, ServerQueue } from './musicPlayer';
import { PersistentStore } from '../storage/persistentStore';
import path from 'path';
import fs from 'fs';
const yts = require('yt-search');

export class ErenModManager {
  private static readonly FILE_NAME = 'eren_playlist.json';
  private static playlist: string[] = [
    'Wegh - ALO',
    'Motive - 10MG',
    'UZI - Cindy',
    'Lvbel C5 - DACIA',
    'Era7capone - Cistak',
    'Ati242 - Gringo',
    'Batuflex - Ralli',
    'cakal - İmdat',
    'BLOK3 - VUR',
    'Heijan Muti - Düşme',
  ];
  private static loaded = false;

  public static load(): void {
    if (this.loaded) return;
    this.loaded = true;

    try {
      const filePath = path.resolve(process.cwd(), 'data', this.FILE_NAME);
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.playlist = parsed;
        }
      }
    } catch (e: any) {
      console.warn('[ErenModManager] Veri yüklenemedi:', e.message);
    }
  }

  public static save(): void {
    try {
      PersistentStore.atomicSaveJson(this.FILE_NAME, this.playlist);
    } catch (e: any) {
      console.warn('[ErenModManager] Veri kaydedilemedi:', e.message);
    }
  }

  public static getPlaylist(): string[] {
    this.load();
    return [...this.playlist];
  }

  public static addSong(songName: string): boolean {
    this.load();
    const clean = songName.trim();
    if (!clean || this.playlist.includes(clean)) return false;
    this.playlist.push(clean);
    this.save();
    return true;
  }

  public static removeSong(index: number): string | null {
    this.load();
    if (index < 0 || index >= this.playlist.length) return null;
    const removed = this.playlist.splice(index, 1)[0];
    this.save();
    return removed;
  }

  /**
   * Eren'in VIP Çalma Listesini Başlatır
   */
  public static async playErenMod(
    target: { interaction?: any; message?: Message },
    client: Client,
    shuffle = false
  ): Promise<void> {
    this.load();
    const isInteraction = !!target.interaction;
    const member = (target.interaction?.member || target.message?.member) as GuildMember | null;
    const guild = target.interaction?.guild || target.message?.guild;
    const channel = (target.interaction?.channel || target.message?.channel) as TextBasedChannel;

    if (!member || !guild || !channel) return;

    const voiceChannel = member.voice?.channel;
    if (!voiceChannel) {
      const errorMsg = '❌ **Eren Modu başlatılamadı:** Lütfen önce bir ses kanalına geçin!';
      if (isInteraction) {
        if (target.interaction.deferred) await target.interaction.editReply({ content: errorMsg });
        else await target.interaction.reply({ content: errorMsg, flags: MessageFlags.Ephemeral });
      } else if (target.message) {
        await target.message.reply(errorMsg);
      }
      return;
    }

    if (isInteraction && !target.interaction.deferred && !target.interaction.replied) {
      await target.interaction.deferReply();
    }

    let songList = [...this.playlist];
    if (shuffle) {
      songList = songList.sort(() => Math.random() - 0.5);
    }

    // İlk şarkıyı hızlıca ara ve çalmaya başla
    const firstSongQuery = songList[0];
    const firstSongInfo = await this.resolveSong(firstSongQuery, member.id);

    if (!firstSongInfo) {
      const notFoundMsg = '❌ İlk şarkı bulunamadı, lütfen liste bağlantılarını kontrol edin.';
      if (isInteraction) await target.interaction.editReply({ content: notFoundMsg });
      else if (target.message) await target.message.reply(notFoundMsg);
      return;
    }

    // Mevcut kuyruğu temizle veya yeni kuyruk oluştur
    let queue = MusicPlayer.queues.get(guild.id);
    if (!queue) {
      const connection = (require('@discordjs/voice') as any).joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator as any,
        selfDeaf: false,
        selfMute: false,
      });

      const player = (require('@discordjs/voice') as any).createAudioPlayer();

      queue = {
        textChannel: channel,
        voiceChannelId: voiceChannel.id,
        connection,
        player,
        songs: [firstSongInfo],
        volume: 100,
        playing: true,
        loopMode: 'off',
        resource: null,
        streamProcess: null,
        timeout: null,
      };

      MusicPlayer.queues.set(guild.id, queue);
      connection.subscribe(player);

      player.on(AudioPlayerStatus.Idle, () => {
        const q = MusicPlayer.queues.get(guild.id);
        if (q && q.songs.length > 0) {
          if (q.loopMode === 'track') {
            MusicPlayer.playSong(guild.id, q.songs[0], client);
          } else if (q.loopMode === 'queue') {
            const finished = q.songs.shift();
            if (finished) q.songs.push(finished);
            MusicPlayer.playSong(guild.id, q.songs[0], client);
          } else {
            q.songs.shift();
            MusicPlayer.playSong(guild.id, q.songs[0], client);
          }
        }
      });

      connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
          await Promise.race([
            entersState(connection, VoiceConnectionStatus.Signalling, 5000),
            entersState(connection, VoiceConnectionStatus.Connecting, 5000),
          ]);
        } catch {
          if (queue?.streamProcess) {
            try { queue.streamProcess.kill(); } catch (e) {}
          }
          connection.destroy();
          MusicPlayer.queues.delete(guild.id);
          MusicPlayer.updateBotPresence(client);
        }
      });

      MusicPlayer.playSong(guild.id, queue.songs[0], client);
    } else {
      // Zaten çalıyorsa ilk şarkıyı hemen kuyruğa ekle
      queue.songs.push(firstSongInfo);
    }

    // Kalan tüm şarkıları asenkron olarak arka planda kuyruğa diz
    this.queueRemainingSongs(guild.id, songList.slice(1), member.id);

    // VIP Eren Modu Embed Kartı
    const trackListFormatted = songList
      .slice(0, 10)
      .map((s, i) => `> **${i + 1}.** ${i === 0 ? '▶️' : '🎵'} \`${s}\``)
      .join('\n');

    const embed = new EmbedBuilder()
      .setColor(0x8b5cf6)
      .setAuthor({
        name: `👑 ERENCİX VIP MÜZİK ODASI AKTİF!`,
        iconURL: member.displayAvatarURL(),
      })
      .setTitle(`🔥  EREN MODU DEVREDE • FAVORİ ŞARKILAR BAŞLATILDI  🎧`)
      .setDescription(
        `👑 **Müzik Sahibi:** <@1138498666785677492> (\`erencix\`)\n` +
        `🔊 **Ses Odası:** <#${voiceChannel.id}>\n` +
        `🔀 **Çalma Modu:** ${shuffle ? '🎲 **Karışık (Shuffle)**' : '📋 **Sıralı Oynatma**'}\n` +
        `📊 **Toplam Parça:** \`${songList.length} Özel Parça Yüklendi\`\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `🎶 **Çalma Listesi Sırası:**\n` +
        trackListFormatted +
        `\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `💡 *Şarkı eklemek için: \`/erenmod eylem:ekle sarki:<şarkı adı>\`*`
      )
      .setImage('https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif')
      .setFooter({ text: 'Nights VIP Audio Engine • Made by erencix' })
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('btn_erenmod_shuffle')
        .setLabel('🔀 Karıştır (Shuffle)')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('btn_music_skip')
        .setLabel('⏭️ Geç')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('btn_music_pause')
        .setLabel('⏯️ Duraklat/Sürdür')
        .setStyle(ButtonStyle.Success)
    );

    if (isInteraction) {
      await target.interaction.editReply({ embeds: [embed], components: [row] });
    } else if (target.message) {
      await target.message.reply({ embeds: [embed], components: [row] });
    }
  }

  /**
   * Kalan şarkıları arka planda çözer ve kuyruğa ekler
   */
  private static async queueRemainingSongs(
    guildId: string,
    queries: string[],
    requesterId: string
  ): Promise<void> {
    for (const q of queries) {
      try {
        const queue = MusicPlayer.queues.get(guildId);
        if (!queue) break; // Kuyruk kapandıysa dur

        const song = await this.resolveSong(q, requesterId);
        if (song) {
          queue.songs.push(song);
        }
      } catch (e) {
        // Atla ve diğer şarkıya geç
      }
    }
  }

  /**
   * Şarkı Arama ve Çözümleyici
   */
  private static async resolveSong(query: string, requesterId: string): Promise<Song | null> {
    try {
      const search = await yts(query);
      if (search && search.videos && search.videos.length > 0) {
        const v = search.videos[0];
        return {
          title: v.title,
          url: v.url,
          duration: v.timestamp || '3:00',
          thumbnail: v.thumbnail || null,
          requesterId,
        };
      }
    } catch (e) {}

    // Fallback: SoundCloud
    try {
      const sc = await MusicPlayer.searchSoundCloud(query);
      if (sc) {
        sc.requesterId = requesterId;
        return sc;
      }
    } catch (e) {}

    return null;
  }
}
