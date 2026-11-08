import { Client, GatewayIntentBits, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildEmojisAndStickers]
});

client.once('clientReady', async () => {
  try {
    const guildId = '1568618183223414934';
    const guild = await client.guilds.fetch(guildId);
    console.log(`Sunucu: ${guild.name}`);

    // 1. SES PANELİNE (SOUNDBOARD) YÜKLE
    console.log('\n[1/3] 🎙️ Soundboard Sesi Yükleniyor...');
    const soundPath = path.resolve('assets/jiren_soundboard.mp3');
    const soundBuf = fs.readFileSync(soundPath);
    const soundDataUri = `data:audio/mp3;base64,${soundBuf.toString('base64')}`;

    try {
      const soundRes: any = await client.rest.post(Routes.guildSoundboardSounds(guildId), {
        body: {
          name: 'Jiren Dance',
          sound: soundDataUri,
          volume: 1.0,
          emoji_name: '🕺'
        }
      });
      console.log(`✅ Soundboard Sesi Başarıyla Eklendi: "${soundRes.name}" (ID: ${soundRes.sound_id})`);
    } catch (soundErr: any) {
      console.error('❌ Soundboard Hata:', soundErr.message, soundErr.rawError || '');
    }

    // 2. HAREKETLİ ANİMASYONLU EMOJİYE YÜKLE
    console.log('\n[2/3] ✨ Jiren Dance GIF Emojisi Yükleniyor...');
    const gifPath = path.resolve('assets/jiren_emoji.gif');
    try {
      const emoji = await guild.emojis.create({
        attachment: gifPath,
        name: 'Jiren_Dance'
      });
      console.log(`✅ Animasyonlu GIF Emoji Eklendi: <a:${emoji.name}:${emoji.id}>`);
    } catch (emojiErr: any) {
      console.error('❌ Emoji Hata:', emojiErr.message);
    }

    // 3. ÇIKARTMAYA (STICKER) YÜKLE
    console.log('\n[3/3] 🖼️ Jiren Dance Çıkartması (Sticker) Yükleniyor...');
    const stickerPath = path.resolve('assets/jiren_sticker.png');
    const stickers = await guild.stickers.fetch();
    console.log(`Mevcut çıkartma sayısı: ${stickers.size}/15`);

    // Eğer 15/15 doluysa yer açmak için generic birini sil
    if (stickers.size >= 15) {
      const toRemove = stickers.find(s => s.name === 'Deadly_Kirby' || s.name === 'Rigby_Gaming') || stickers.first();
      if (toRemove) {
        console.log(`⚠️ Kapasite dolu (15/15). "${toRemove.name}" silinerek Jiren için yer açılıyor...`);
        await toRemove.delete('Jiren Dance çıkartması için yer açıldı');
        console.log(`🗑️ Silindi: ${toRemove.name}`);
      }
    }

    try {
      const sticker = await guild.stickers.create({
        file: stickerPath,
        name: 'Jiren_Dance',
        tags: '🕺'
      });
      console.log(`✅ Çıkartma Başarıyla Eklendi: ${sticker.name} (ID: ${sticker.id})`);
    } catch (stickerErr: any) {
      console.error('❌ Çıkartma Hata:', stickerErr.message);
    }

    console.log('\n🎉 JİREN DANSI TÜM PLATFORMLARA (SES, ÇIKARTMA, EMOJİ) EKLENDİ!');
  } catch (err: any) {
    console.error('Genel Hata:', err);
  } finally {
    process.exit(0);
  }
});

client.login(process.env.DISCORD_TOKEN);
