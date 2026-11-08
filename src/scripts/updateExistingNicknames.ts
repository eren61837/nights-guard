import { Client, GatewayIntentBits } from 'discord.js';
import * as dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

client.once('clientReady', async () => {
  try {
    const guild = await client.guilds.fetch('1568618183223414934');
    const members = await guild.members.fetch();
    console.log(`Sunucuda ${members.size} üye bulundu. Takma adlar güncelleniyor...`);

    for (const [, member] of members) {
      if (member.user.bot) continue;

      const currentNick = member.nickname;
      // Eğer zaten takma adı varsa ve başında ☊ yoksa
      if (currentNick && !currentNick.startsWith('☊')) {
        const newNick = `☊ ${currentNick}`.slice(0, 32);
        try {
          await member.setNickname(newNick);
          console.log(`✅ [${member.user.tag}] Takma ad güncellendi: "${currentNick}" -> "${newNick}"`);
        } catch (err: any) {
          console.log(`⚠️ [${member.user.tag}] Takma ad değiştirilemedi (yetki yetersiz olabilir): ${err.message}`);
        }
      } else if (!currentNick) {
        // Eğer kayıtlı bir üyeyse (Onaylı veya Erkek/Kız rolü varsa) ama takma adı yoksa
        const hasApproved = member.roles.cache.some(r => r.name.includes('Onaylı') || r.name.includes('Erkek') || r.name.includes('Kız'));
        if (hasApproved && !member.permissions.has('Administrator')) {
          const newNick = `☊ ${member.user.username}`.slice(0, 32);
          try {
            await member.setNickname(newNick);
            console.log(`✅ [${member.user.tag}] Varsayılan nick güncellendi: "${newNick}"`);
          } catch (err: any) {
            console.log(`⚠️ [${member.user.tag}] Değiştirilemedi: ${err.message}`);
          }
        }
      }
    }
    console.log('🎉 Mevcut üyelerin takma ad güncellemesi tamamlandı!');
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    process.exit(0);
  }
});

client.login(process.env.DISCORD_TOKEN);
