import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
} from 'discord.js';
import fs from 'fs';
import path from 'path';
import { AIChatManager } from '../services/features/aiChatManager';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const data = new SlashCommandBuilder()
  .setName('ai-anahtar')
  .setDescription('Ücretsiz Google Gemini Yapay Zeka anahtarınızı bota bağlar.')
  .addStringOption((opt) =>
    opt
      .setName('anahtar')
      .setDescription('Google AI Studio\'dan aldığınız Gemini API Anahtarı (AIzaSy...)')
      .setRequired(true)
  );

const OWNER_ID = '1138498666785677492';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const guild = interaction.guild;
  if (!guild) {
    await interaction.reply({ content: 'Bu komut yalnızca sunucuda kullanılabilir.', flags: MessageFlags.Ephemeral });
    return;
  }

  // Yalnızca bot sahibi veya sunucu kurucusu
  if (interaction.user.id !== OWNER_ID && interaction.user.id !== guild.ownerId) {
    await interaction.reply({
      content: `⛔ **Erişim Engellendi:** Bu komut yalnızca <@${OWNER_ID}> (erencix) tarafından kullanılabilir.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const apiKey = interaction.options.getString('anahtar', true).trim();

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  // Anahtarı doğrula
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const testResult = await model.generateContent('ping');
    const reply = testResult.response.text();

    if (!reply) {
      throw new Error('Yanıt alınamadı.');
    }

    // .env dosyasına yaz
    const envPath = path.resolve(process.cwd(), '.env');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }

    if (envContent.includes('GEMINI_API_KEY=')) {
      envContent = envContent.replace(/GEMINI_API_KEY=.*/g, `GEMINI_API_KEY=${apiKey}`);
    } else {
      envContent += `\nGEMINI_API_KEY=${apiKey}\n`;
    }

    fs.writeFileSync(envPath, envContent, 'utf-8');
    process.env.GEMINI_API_KEY = apiKey;

    // AIChatManager motorunu doğrudan güncelle
    AIChatManager.initGemini(apiKey);

    const embed = new EmbedBuilder()
      .setTitle('✨ GOOGLE GEMINI 1.5 FLASH BAŞARIYLA BAĞLANDI!')
      .setDescription(
        `🎉 **Tebrikler Erencix!** Resmi Google Gemini API anahtarınız başarıyla doğrulandı ve sisteme kaydedildi.\n\n` +
        `> ⚡ **Model:** \`gemini-1.5-flash\`\n` +
        `> 🚀 **Kapasite:** 15 İstek/Dakika (Günde 1.500 Ücretsiz İstek)\n` +
        `> 💬 **Kanal:** <#1568644563285835826> kanalında veya botu etiketleyerek dilediğin gibi sohbet edebilirsin!`
      )
      .setColor('#2ECC71')
      .setFooter({ text: 'Nights AI Core • Powered by Google Gemini' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (err: any) {
    await interaction.editReply({
      content: `❌ **API Anahtarı Doğrulanamadı:** ${err.message}\n> Lütfen https://aistudio.google.com/app/apikey adresinden aldığınız doğru anahtarı girdiğinizden emin olun.`,
    });
  }
}
