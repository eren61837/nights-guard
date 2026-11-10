import { Client, Guild, EmbedBuilder } from 'discord.js';

export interface EmojiAsset {
  name: string;
  url: string;
}

export const CURATED_EMOJI_PACK: EmojiAsset[] = [
  { name: 'Fire_3D', url: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Fire/3D/fire_3d.png' },
  { name: 'Sparkles_3D', url: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Sparkles/3D/sparkles_3d.png' },
  { name: 'Crown_3D', url: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Crown/3D/crown_3d.png' },
  { name: 'GlowingStar_3D', url: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Glowing%20star/3D/glowing_star_3d.png' },
  { name: 'HeartOnFire_3D', url: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Heart%20on%20fire/3D/heart_on_fire_3d.png' },
  { name: 'GemStone_3D', url: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Gem%20stone/3D/gem_stone_3d.png' },
  { name: 'VideoGame_3D', url: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Video%20game/3D/video_game_3d.png' },
  { name: 'Rocket_3D', url: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Rocket/3D/rocket_3d.png' },
  { name: 'ZanyFace_3D', url: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Zany%20face/3D/zany_face_3d.png' },
  { name: 'CoolSunglasses_3D', url: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Smiling%20face%20with%20sunglasses/3D/smiling_face_with_sunglasses_3d.png' },
  { name: 'NerdFace_3D', url: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Nerd%20face/3D/nerd_face_3d.png' },
  { name: 'PartyPopper_3D', url: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Party%20popper/3D/party_popper_3d.png' },
  { name: 'MoneyBag_3D', url: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Money%20bag/3D/money_bag_3d.png' },
  { name: 'Collision_3D', url: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Collision/3D/collision_3d.png' },
  { name: 'HighVoltage_3D', url: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/High%20voltage/3D/high_voltage_3d.png' },
  { name: 'MagicWand_3D', url: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Magic%20wand/3D/magic_wand_3d.png' },
  { name: 'Hundred_3D', url: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Hundred%20points/3D/hundred_points_3d.png' },
  { name: 'Trophy_3D', url: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Trophy/3D/trophy_3d.png' },
  { name: 'Ghost_3D', url: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Ghost/3D/ghost_3d.png' },
  { name: 'Alien_3D', url: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Alien%20monster/3D/alien_monster_3d.png' },
  { name: 'Robot_3D', url: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Robot/3D/robot_3d.png' },
  { name: 'Shield_3D', url: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Shield/3D/shield_3d.png' },
];

export class EmojiPackManager {
  private static ran = false;

  /**
   * Sunucuya otomatik olarak 3D & Özel estetik emoji paketini kurar
   */
  public static async ensureCuratedEmojis(client: Client): Promise<void> {
    if (this.ran) return;
    this.ran = true;

    for (const guild of client.guilds.cache.values()) {
      try {
        await this.installToGuild(guild);
      } catch (err: any) {
        console.warn(`[EmojiPackManager] ${guild.name} için emoji yükleme hatası:`, err.message);
      }
    }
  }

  public static async installToGuild(
    guild: Guild
  ): Promise<{ installed: number; skipped: number; total: number; limitReached: boolean }> {
    console.log(`[EmojiPackManager] 🎨 ${guild.name} sunucusuna estetik emoji paketi kontrol ediliyor...`);

    await guild.emojis.fetch();
    const maxEmojis =
      guild.premiumTier === 0 ? 50 : guild.premiumTier === 1 ? 100 : guild.premiumTier === 2 ? 150 : 250;

    let installed = 0;
    let skipped = 0;
    let limitReached = false;

    for (const item of CURATED_EMOJI_PACK) {
      if (guild.emojis.cache.size >= maxEmojis) {
        console.log(`[EmojiPackManager] ℹ️ Sunucu emoji limitine ulaşıldı (${guild.emojis.cache.size}/${maxEmojis}).`);
        limitReached = true;
        break;
      }

      const existing = guild.emojis.cache.find(
        (e) => e.name?.toLowerCase() === item.name.toLowerCase()
      );

      if (existing) {
        skipped++;
        continue;
      }

      try {
        const response = await fetch(item.url);
        if (!response.ok) {
          skipped++;
          continue;
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const newEmoji = await guild.emojis.create({
          attachment: buffer,
          name: item.name,
          reason: 'Nights Guard: Estetik 3D VIP Emoji Paketi',
        });

        console.log(`[EmojiPackManager] ✨ Yeni emoji yüklendi: :${newEmoji.name}: (${guild.name})`);
        installed++;
        await new Promise((r) => setTimeout(r, 600)); // Rate limit koruması
      } catch (e: any) {
        console.warn(`[EmojiPackManager] Emoji yüklenemedi (${item.name}):`, e.message);
        if (e.message?.includes('Maximum number of emojis reached')) {
          limitReached = true;
          break;
        }
      }
    }

    console.log(`[EmojiPackManager] ✅ Tamamlandı! Yüklenen: ${installed}, Önceden var olan: ${skipped}`);
    return {
      installed,
      skipped,
      total: guild.emojis.cache.size,
      limitReached,
    };
  }
}
