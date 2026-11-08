import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Standart .env yüklemesi
dotenv.config();

// honto.env veya farklı isimlendirilmiş env dosyalarını otomatik tara ve yükle
const possibleEnvFiles = [
  'honto.env',
  '.env',
  path.join(process.cwd(), 'honto.env'),
  path.join(process.cwd(), '.env'),
  '/home/container/honto.env',
  '/home/container/.env',
];

for (const envPath of possibleEnvFiles) {
  try {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
    }
  } catch (e) {}
}

export interface BotConfig {
  discordToken: string;
  discordClientId?: string;
  ownerId: string;
  aiProvider: 'gemini' | 'openai' | 'auto';
  geminiApiKey?: string;
  openaiApiKey?: string;
  imageProvider: 'pollinations' | 'openai';
  defaultLocale: 'tr' | 'en';
}

export const config: BotConfig = {
  discordToken: process.env.DISCORD_TOKEN || '',
  discordClientId: process.env.DISCORD_CLIENT_ID || undefined,
  ownerId: process.env.OWNER_ID || '1138498666785677492',
  aiProvider: (process.env.AI_PROVIDER as 'gemini' | 'openai' | 'auto') || 'auto',
  geminiApiKey: process.env.GEMINI_API_KEY || undefined,
  openaiApiKey: process.env.OPENAI_API_KEY || undefined,
  imageProvider: (process.env.IMAGE_PROVIDER as 'pollinations' | 'openai') || 'pollinations',
  defaultLocale: (process.env.DEFAULT_LOCALE as 'tr' | 'en') || 'tr',
};

export function validateConfig(): { valid: boolean; warnings: string[]; errors: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!config.discordToken || config.discordToken === 'BURAYA_BOT_TOKENINI_YAZIN') {
    errors.push('DISCORD_TOKEN bulunamadı veya ayarlanmamış (.env dosyasını kontrol edin)');
  }

  if (!config.geminiApiKey && !config.openaiApiKey) {
    warnings.push(
      'Ne GEMINI_API_KEY ne de OPENAI_API_KEY tanımlanmış. Bot gelişmiş "Akıllı Şablon Motoru" (Smart Fallback) ile çalışacak.'
    );
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}
