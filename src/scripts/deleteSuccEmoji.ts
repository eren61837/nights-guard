import { Client, GatewayIntentBits } from 'discord.js';
import * as dotenv from 'dotenv';
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildEmojisAndStickers] });

client.once('clientReady', async () => {
  try {
    const guild = await client.guilds.fetch('1568618183223414934');
    const emojis = await guild.emojis.fetch();
    console.log(`Sunucuda toplam ${emojis.size} emoji bulundu.`);

    const matched = emojis.filter(e => e.name?.toLowerCase().includes('succ'));
    console.log(`"succ" içeren emoji sayısı: ${matched.size}`);

    if (matched.size === 0) {
      console.log('Tüm emojiler listeleniyor (benzer isim kontrolü için):');
      emojis.forEach(e => {
        if (e.animated) {
          console.log(`- [ANIMATED] ${e.name} (${e.id})`);
        }
      });
    }

    for (const [, emoji] of matched) {
      console.log(`Bulundu: ${emoji.name} (ID: ${emoji.id}, Animated: ${emoji.animated})`);
      await emoji.delete('Kullanıcı isteğiyle silindi');
      console.log(`✅ Başarıyla silindi: ${emoji.name}`);
    }
  } catch (err: any) {
    console.error('Hata:', err.message);
  } finally {
    process.exit(0);
  }
});

client.login(process.env.DISCORD_TOKEN);
