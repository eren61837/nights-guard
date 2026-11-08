import dotenv from 'dotenv';
dotenv.config();

import {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionFlagsBits,
  TextChannel,
} from 'discord.js';
import { config } from '../config';
import { TicketManager } from '../services/features/ticketManager';

const GUILD_ID = '1568618183223414934';

async function main() {
  console.log('🎫 Dedicated Destek Talepleri Kategorisi Kuruluyor...');

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMembers,
    ],
  });

  await client.login(config.discordToken);

  const guild = await client.guilds.fetch(GUILD_ID);
  if (!guild) {
    console.error('❌ Sunucu bulunamadı!');
    client.destroy();
    return;
  }

  const channels = await guild.channels.fetch();
  const roles = await guild.roles.fetch();

  const everyoneRole = guild.roles.everyone;
  const onayliRole = roles.find((r) => r.name === 'Onaylı');
  const uyeRole = roles.find((r) => r.name === 'Üye');
  const modRole = roles.find((r) => r.name === 'Moderatör');
  const yoneticiRole = roles.find((r) => r.name === 'Yönetici');
  const kurucuRole = roles.find((r) => r.name === 'Kurucu');

  // 1. Find or create Category: 🎫 ┃ DESTEK TALEPLERİ
  let ticketCategory = channels.find(
    (c) =>
      c &&
      c.type === ChannelType.GuildCategory &&
      (c.name.includes('DESTEK') || c.name.includes('BİLET'))
  );

  if (!ticketCategory) {
    console.log('  🔨 "🎫 ┃ DESTEK TALEPLERİ" kategorisi oluşturuluyor...');
    ticketCategory = await guild.channels.create({
      name: '🎫 ┃ DESTEK TALEPLERİ',
      type: ChannelType.GuildCategory,
      permissionOverwrites: [
        {
          id: everyoneRole.id,
          deny: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.CreatePublicThreads,
            PermissionFlagsBits.CreatePrivateThreads,
            PermissionFlagsBits.SendMessagesInThreads,
          ],
        },
        ...(guild.members.me
          ? [
              {
                id: guild.members.me.id,
                allow: [
                  PermissionFlagsBits.ViewChannel,
                  PermissionFlagsBits.SendMessages,
                  PermissionFlagsBits.ManageChannels,
                  PermissionFlagsBits.ReadMessageHistory,
                ],
              },
            ]
          : []),
        ...(onayliRole
          ? [
              {
                id: onayliRole.id,
                allow: [
                  PermissionFlagsBits.ViewChannel,
                  PermissionFlagsBits.ReadMessageHistory,
                ],
                deny: [
                  PermissionFlagsBits.SendMessages,
                  PermissionFlagsBits.CreatePublicThreads,
                  PermissionFlagsBits.CreatePrivateThreads,
                ],
              },
            ]
          : []),
        ...(uyeRole
          ? [
              {
                id: uyeRole.id,
                allow: [
                  PermissionFlagsBits.ViewChannel,
                  PermissionFlagsBits.ReadMessageHistory,
                ],
                deny: [
                  PermissionFlagsBits.SendMessages,
                  PermissionFlagsBits.CreatePublicThreads,
                  PermissionFlagsBits.CreatePrivateThreads,
                ],
              },
            ]
          : []),
        ...(modRole
          ? [
              {
                id: modRole.id,
                allow: [
                  PermissionFlagsBits.ViewChannel,
                  PermissionFlagsBits.SendMessages,
                  PermissionFlagsBits.ManageMessages,
                  PermissionFlagsBits.ReadMessageHistory,
                ],
              },
            ]
          : []),
        ...(yoneticiRole
          ? [
              {
                id: yoneticiRole.id,
                allow: [
                  PermissionFlagsBits.ViewChannel,
                  PermissionFlagsBits.SendMessages,
                  PermissionFlagsBits.ManageMessages,
                  PermissionFlagsBits.ReadMessageHistory,
                ],
              },
            ]
          : []),
        ...(kurucuRole
          ? [
              {
                id: kurucuRole.id,
                allow: [
                  PermissionFlagsBits.ViewChannel,
                  PermissionFlagsBits.SendMessages,
                  PermissionFlagsBits.ManageMessages,
                  PermissionFlagsBits.ReadMessageHistory,
                ],
              },
            ]
          : []),
      ],
    });
    console.log(`  ✅ Kategori oluşturuldu: ${ticketCategory.name} (${ticketCategory.id})`);
  } else {
    console.log(`  ℹ️ Kategori zaten mevcut: ${ticketCategory.name} (${ticketCategory.id})`);
  }

  // 2. Set Category Position (Right after Topluluk/Sohbet)
  const communityCat = channels.find(
    (c) => c && c.type === ChannelType.GuildCategory && c.name.includes('SOHBET')
  );
  if (communityCat && ticketCategory) {
    try {
      await ticketCategory.setPosition(communityCat.position + 1);
      console.log(`  📌 Kategori pozisyonu ayarlandı: ${ticketCategory.position}`);
    } catch (posErr) {
      console.warn('  ⚠️ Pozisyon ayarlanırken uyarı:', posErr);
    }
  }

  // 3. Find #destek-talebi channel and move it to this dedicated category
  let ticketChannel = channels.find(
    (c) => c && c.type === ChannelType.GuildText && c.name.includes('destek-talebi')
  ) as TextChannel | undefined;

  if (ticketChannel) {
    console.log(`  🚚 #destek-talebi kanalı (${ticketChannel.id}) ${ticketCategory.name} altına taşınıyor...`);
    await ticketChannel.setParent(ticketCategory.id, { lockPermissions: false });
    
    // Set permissions on #destek-talebi so all verified members see the panel
    const channelOverwrites: any[] = [
      {
        id: everyoneRole.id,
        deny: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.CreatePublicThreads,
          PermissionFlagsBits.CreatePrivateThreads,
        ],
      },
      ...(guild.members.me
        ? [
            {
              id: guild.members.me.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ManageChannels,
                PermissionFlagsBits.ReadMessageHistory,
              ],
            },
          ]
        : []),
    ];

    if (onayliRole) {
      channelOverwrites.push({
        id: onayliRole.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
        deny: [
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.CreatePublicThreads,
          PermissionFlagsBits.CreatePrivateThreads,
          PermissionFlagsBits.SendMessagesInThreads,
        ],
      });
    }

    if (uyeRole) {
      channelOverwrites.push({
        id: uyeRole.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
        deny: [
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.CreatePublicThreads,
          PermissionFlagsBits.CreatePrivateThreads,
          PermissionFlagsBits.SendMessagesInThreads,
        ],
      });
    }

    if (modRole) {
      channelOverwrites.push({
        id: modRole.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.SendMessages],
      });
    }

    await ticketChannel.permissionOverwrites.set(channelOverwrites);
    console.log('  ✅ #destek-talebi kanalı izinleri ve ebeveyn kategorisi güncellendi!');

    // Refresh Panel Message
    const oldMessages = await ticketChannel.messages.fetch({ limit: 10 });
    for (const [, msg] of oldMessages) {
      if (msg.author.id === client.user?.id) {
        await msg.delete().catch(() => {});
      }
    }

    await ticketChannel.send({
      embeds: [TicketManager.getTicketPanelEmbed()],
      components: [TicketManager.getTicketPanelControls()],
    });
    console.log('  ✅ Destek paneli ve butonu yenilendi!');
  } else {
    // Create new #destek-talebi if it didn't exist
    console.log('  🔨 Yeni #destek-talebi kanalı oluşturuluyor...');
    ticketChannel = await guild.channels.create({
      name: '🎫・destek-talebi',
      type: ChannelType.GuildText,
      parent: ticketCategory.id,
      permissionOverwrites: [
        {
          id: everyoneRole.id,
          deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
        },
        ...(onayliRole
          ? [
              {
                id: onayliRole.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
                deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.CreatePublicThreads, PermissionFlagsBits.CreatePrivateThreads],
              },
            ]
          : []),
        ...(uyeRole
          ? [
              {
                id: uyeRole.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
                deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.CreatePublicThreads, PermissionFlagsBits.CreatePrivateThreads],
              },
            ]
          : []),
      ],
    });
    await ticketChannel.send({
      embeds: [TicketManager.getTicketPanelEmbed()],
      components: [TicketManager.getTicketPanelControls()],
    });
    console.log('  ✅ Yeni #destek-talebi oluşturuldu ve panel gönderildi!');
  }

  // 4. Move any existing open tickets (bilet-*) into the dedicated category
  const openTickets = channels.filter(
    (c) => Boolean(c && c.type === ChannelType.GuildText && c.name.startsWith('bilet-'))
  );
  for (const [, ticket] of openTickets) {
    if (ticket && ticket.parentId !== ticketCategory.id) {
      await (ticket as TextChannel).setParent(ticketCategory.id, { lockPermissions: false });
      console.log(`  🚚 Açık bilet kanalı taşındı: ${ticket.name}`);
    }
  }

  console.log('\n🎉 Dedicated Destek Talepleri Kategorisi Başarıyla Kuruldu!');
  client.destroy();
}

main().catch(console.error);
