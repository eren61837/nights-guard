import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} from 'discord.js';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { config } from '../config';
import { MusicPlayer } from '../services/features/musicPlayer';

const TARGET_GUILD_ID = '1568618183223414934'; // Prayt

function createEmojiBuffer(type: string, colorHex: string): Buffer {
  const width = 64;
  const height = 64;
  const raw = Buffer.alloc(height * (1 + width * 4));

  const hex = colorHex.replace('#', '');
  const cr = parseInt(hex.slice(0, 2), 16);
  const cg = parseInt(hex.slice(2, 4), 16);
  const cb = parseInt(hex.slice(4, 6), 16);

  let pos = 0;
  const cx = 32;
  const cy = 32;

  for (let y = 0; y < height; y++) {
    raw[pos++] = 0;
    const dy = (y - cy) / 32;
    for (let x = 0; x < width; x++) {
      const dx = (x - cx) / 32;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let r = 0, g = 0, b = 0, a = 0;

      if (dist <= 0.85) {
        // Base Circle with Gradient
        const grad = 1 - dist;
        r = Math.min(255, Math.floor(cr * (0.6 + 0.4 * grad)));
        g = Math.min(255, Math.floor(cg * (0.6 + 0.4 * grad)));
        b = Math.min(255, Math.floor(cb * (0.6 + 0.4 * grad)));
        a = 255;

        // Inner Icon Highlights based on type
        if (type === 'crown' && Math.abs(dx) < 0.5 && dy > -0.4 && dy < 0.4) {
          r = 255; g = 255; b = 255;
        } else if (type === 'fire' && Math.abs(dx) < (0.5 - dy * 0.4) && dy > -0.6 && dy < 0.5) {
          r = 255; g = 220; b = 0;
        } else if (type === 'star' && (Math.abs(dx) < 0.15 || Math.abs(dy) < 0.15 || Math.abs(dx - dy) < 0.15 || Math.abs(dx + dy) < 0.15)) {
          r = 255; g = 255; b = 255;
        } else if (type === 'heart' && ((dx * dx + (dy + 0.2) * (dy + 0.2) < 0.35) || (Math.abs(dx) < 0.4 && dy > -0.2 && dy < 0.6 - Math.abs(dx) * 1.2))) {
          r = 255; g = 255; b = 255;
        } else if (type === 'shield' && Math.abs(dx) < 0.45 && dy > -0.5 && dy < 0.55 - Math.abs(dx) * 0.8) {
          r = 255; g = 255; b = 255;
        } else if (type === 'diamond' && Math.abs(dx) + Math.abs(dy) < 0.55) {
          r = 255; g = 255; b = 255;
        } else if (dist > 0.75) {
          // Glow rim
          r = 255; g = 255; b = 255;
        }
      }

      raw[pos++] = r;
      raw[pos++] = g;
      raw[pos++] = b;
      raw[pos++] = a;
    }
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const makeChunk = (t: string, d: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(d.length, 0);
    const typeBuf = Buffer.from(t, 'ascii');
    const toCrc = Buffer.concat([typeBuf, d]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32(toCrc), 0);
    return Buffer.concat([len, typeBuf, d, crc]);
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const compressed = zlib.deflateSync(raw, { level: 9 });
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

async function runSetup() {
  console.log('🚀 Güvenlik, Yeni Canlı Logo, Müzik Paneli ve Emojiler Yükleniyor...');

  const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });
  await client.login(config.discordToken);

  const guild = await client.guilds.fetch(TARGET_GUILD_ID);
  if (!guild) {
    console.error('Sunucu bulunamadı!');
    process.exit(1);
  }

  // 1. Yeni Canlı ve İç Açıcı Logoyu Yükle
  const logoPath = path.resolve('c:/Users/dell/Desktop/prayt_guard_pp.png');
  if (fs.existsSync(logoPath)) {
    try {
      const logoBuffer = fs.readFileSync(logoPath);
      await guild.setIcon(logoBuffer);
      console.log('✨ YENİ İÇ AÇICI VİBRANT LOGO SUNUCUYA YÜKLENDİ!');
    } catch (e: any) {
      console.warn('Logo yükleme hatası:', e.message);
    }
  }

  // 2. #muzik-komut Kanalına Kilit Koy ve Anime Kızı GIF'li Paneli Güncelle
  console.log('🎵 #muzik-komut kanalı kilitleniyor ve anime kızı paneli gönderiliyor...');
  const channels = await guild.channels.fetch();
  const roles = await guild.roles.fetch();
  const everyoneRoleId = guild.id;
  const approvedRole = roles.find((r) => r.name === 'Onaylı');

  const chMuzikKomut = channels.find((c) => c && c.name.includes('muzik-komut') && c.isTextBased());
  if (chMuzikKomut && chMuzikKomut.isTextBased()) {
    try {
      // Üyelerin mesaj yazmasını kesinlikle kapat:
      await chMuzikKomut.permissionOverwrites.edit(everyoneRoleId, {
        SendMessages: false,
        ViewChannel: false,
      });

      if (approvedRole) {
        await chMuzikKomut.permissionOverwrites.edit(approvedRole.id, {
          ViewChannel: true,
          SendMessages: false, // Üyeler buraya mesaj YAZAMAZ, sadece butonlara tıklar!
          ReadMessageHistory: true,
          CreatePublicThreads: false,
          CreatePrivateThreads: false,
        });
      }

      // Eski mesajları temizle
      const oldMsgs = await (chMuzikKomut as any).messages.fetch({ limit: 10 });
      for (const [, m] of oldMsgs) await m.delete();

      // Yeni Anime Kızı Müzik Panelini Gönder
      await (chMuzikKomut as any).send({
        embeds: [MusicPlayer.getMusicPanelEmbed()],
        components: [MusicPlayer.getMusicControls()],
      });
      console.log('✅ #muzik-komut anime kızı paneli yüklendi ve mesaj yazma kilitlendi!');
    } catch (err: any) {
      console.warn('Müzik kanalı düzenleme hatası:', err.message);
    }
  }

  // 3. Sunucuya 25+ Özel Emoji Ekle
  console.log('😃 Sunucuya özel emojiler yükleniyor...');
  const currentEmojis = await guild.emojis.fetch();
  console.log(`Mevcut emoji sayısı: ${currentEmojis.size}`);

  const emojiList = [
    { name: 'prayt_crown', type: 'crown', color: '#F59E0B' },
    { name: 'prayt_fire', type: 'fire', color: '#EF4444' },
    { name: 'prayt_bluefire', type: 'fire', color: '#06B6D4' },
    { name: 'prayt_shield', type: 'shield', color: '#8B5CF6' },
    { name: 'prayt_cybershield', type: 'shield', color: '#3B82F6' },
    { name: 'prayt_heart', type: 'heart', color: '#EC4899' },
    { name: 'prayt_cyanheart', type: 'heart', color: '#10B981' },
    { name: 'prayt_star', type: 'star', color: '#FBBF24' },
    { name: 'prayt_diamond', type: 'diamond', color: '#00F0FF' },
    { name: 'prayt_gem', type: 'diamond', color: '#A855F7' },
    { name: 'val_vandal', type: 'fire', color: '#DC2626' },
    { name: 'val_phantom', type: 'shield', color: '#2563EB' },
    { name: 'cs_ak47', type: 'fire', color: '#D97706' },
    { name: 'cs_knife', type: 'diamond', color: '#6366F1' },
    { name: 'lol_challenger', type: 'crown', color: '#38BDF8' },
    { name: 'cyber_trophy', type: 'crown', color: '#EAB308' },
    { name: 'neon_verified', type: 'shield', color: '#22C55E' },
    { name: 'neon_boost', type: 'diamond', color: '#F43F5E' },
    { name: 'neon_headphone', type: 'heart', color: '#8B5CF6' },
    { name: 'pixel_potion', type: 'diamond', color: '#4ADE80' },
    { name: 'matrix_core', type: 'star', color: '#14B8A6' },
    { name: 'cyber_pulse', type: 'fire', color: '#F97316' },
    { name: 'lunar_spark', type: 'star', color: '#E2E8F0' },
    { name: 'solar_flare', type: 'fire', color: '#F59E0B' },
  ];

  for (const emo of emojiList) {
    if (!currentEmojis.some((e) => e.name === emo.name)) {
      try {
        const buf = createEmojiBuffer(emo.type, emo.color);
        await guild.emojis.create({
          attachment: buf,
          name: emo.name,
          reason: 'Prayt Topluluk Özel Emojileri',
        });
        console.log(`  -> Emoji eklendi: :${emo.name}:`);
        await new Promise((r) => setTimeout(r, 350));
      } catch (emoErr: any) {
        console.warn(`Emoji yüklenemedi (${emo.name}):`, emoErr.message);
      }
    }
  }

  console.log('🎉 TÜM İŞLEMLER BAŞARIYLA TAMAMLANDI!');
  client.destroy();
}

runSetup().catch(console.error);
