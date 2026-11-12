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

  const ch = guild.channels.cache.find((c) => c && c.name.includes('cinsiyet-secimi')) as TextChannel | undefined;
  if (ch) {
    console.log(`\n--- #${ch.name} İZİNLERİ (Kategori: ${ch.parent?.name}) ---`);
    ch.permissionOverwrites.cache.forEach((ow) => {
      const targetRole = guild.roles.cache.get(ow.id);
      const name = targetRole ? targetRole.name : ow.id;
      console.log(`- Hedef: "${name}" | Allow: [${ow.allow.toArray().join(', ')}] | Deny: [${ow.deny.toArray().join(', ')}]`);
    });
  }

  // Ayrıca kayit-onay ve registration izinlerine de bakalım
  for (const name of ['dil-secimi', 'kayit-onay']) {
    const kCh = guild.channels.cache.find((c) => c && c.name.includes(name)) as TextChannel | undefined;
    if (kCh) {
      console.log(`\n--- #${kCh.name} İZİNLERİ ---`);
      kCh.permissionOverwrites.cache.forEach((ow) => {
        const targetRole = guild.roles.cache.get(ow.id);
        const rName = targetRole ? targetRole.name : ow.id;
        console.log(`- Hedef: "${rName}" | Allow: [${ow.allow.toArray().join(', ')}] | Deny: [${ow.deny.toArray().join(', ')}]`);
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
