import dotenv from 'dotenv';
dotenv.config();
import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import { config } from '../config';

const TARGET_GUILD_ID = '1568618183223414934';

async function main() {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  });

  await client.login(config.discordToken);
  const guild = await client.guilds.fetch({ guild: TARGET_GUILD_ID, force: true });
  console.log(`Sunucu: ${guild.name} (${guild.id})`);

  // Boost kanalını tara
  const boostCh = guild.channels.cache.find((c) => c && c.name.includes('boost')) as TextChannel | undefined;
  if (boostCh) {
    console.log(`\n--- BOOST KANALI: #${boostCh.name} ---`);
    const msgs = await boostCh.messages.fetch({ limit: 10 });
    console.log(`Toplam mesaj sayısı: ${msgs.size}`);
    msgs.forEach((m) => {
      console.log(`- [${m.id}] ${m.author.tag} | Embeds: ${m.embeds.length} | Başlık: "${m.embeds[0]?.title || 'Yok'}"`);
    });
  }

  // Kayıt kanallarını tara
  for (const name of ['dil-secimi', 'kayit-onay', 'registration', 'cinsiyet-secimi']) {
    const ch = guild.channels.cache.find((c) => c && c.name.includes(name)) as TextChannel | undefined;
    if (ch) {
      console.log(`\n--- #${ch.name} ---`);
      const msgs = await ch.messages.fetch({ limit: 5 });
      console.log(`Mesaj sayısı: ${msgs.size}`);
      msgs.forEach((m) => {
        console.log(`- [${m.id}] Embeds: ${m.embeds.length} | Başlık: "${m.embeds[0]?.title || 'Yok'}" | Resim/GIF var mı: ${Boolean(m.embeds[0]?.image)} | Buton sayısı: ${m.components.length > 0 ? (m.components[0] as any).components.length : 0}`);
      });
    }
  }

  client.destroy();
  process.exit(0);
}

main().catch((err) => {
  console.error('Hata:', err);
  process.exit(1);
});
