import readline from 'readline/promises';
import fs from 'fs';
import path from 'path';
import { Client, GatewayIntentBits } from 'discord.js';
import axios from 'axios';

function parseEnvFile(filePath: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!fs.existsSync(filePath)) return result;

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      result[key] = val;
    }
  }
  return result;
}

function mask(str: string): string {
  if (!str) return 'tanımlanmamış';
  if (str.length <= 8) return '********';
  return str.slice(0, 4) + '...' + str.slice(-4);
}

export function validateDiscordToken(token: string): { valid: boolean; reason?: string; isExit?: boolean; isDemo?: boolean } {
  const t = token.trim();
  if (t.toLowerCase() === 'q' || t.toLowerCase() === 'exit' || t.toLowerCase() === 'iptal') {
    return { valid: false, reason: 'Kullanıcı çıkış yaptı.', isExit: true };
  }
  if (t.toLowerCase() === 'demo') {
    return { valid: false, reason: 'Sandbox demo modu seçildi.', isDemo: true };
  }
  if (!t) return { valid: false, reason: 'Token boş bırakılamaz.' };
  if (t === 'BURAYA_BOT_TOKENINI_YAZIN') return { valid: false, reason: 'Örnek şablon tokenı girdiniz.' };
  if (t.length < 25) return { valid: false, reason: 'Token çok kısa görünüyor (en az 25+ karakter olmalı).' };
  return { valid: true };
}

export function validateClientId(clientId: string): { valid: boolean; reason?: string } {
  const id = clientId.trim();
  if (!id) return { valid: true }; // optional
  if (!/^\d{16,21}$/.test(id)) {
    return { valid: false, reason: 'Client ID 17-20 haneli sayısal bir Snowflake ID olmalıdır.' };
  }
  return { valid: true };
}

async function runSetup() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const envPath = fs.existsSync(path.resolve(process.cwd(), '.env'))
    ? path.resolve(process.cwd(), '.env')
    : path.resolve(__dirname, '..', '.env');
  const existing = parseEnvFile(envPath);

  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║   🤖  DISCORD AI ARCHITECT - İNTERAKTİF KURULUM SİHİRBAZI        ║');
  console.log('║       PeakBot & Onyx AI Engine Hızlı Yapılandırma ve Testi       ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');
  console.log('Bu sihirbaz .env ayarlarınızı yapılandıracak ve tek tıkla test edecektir.');
  console.log('Mevcut değeri korumak için [Enter], çıkmak için "q", demo modu için "demo" yazabilirsiniz.\n');

  try {
    // 1. DISCORD_TOKEN
    console.log('🔑 [Adım 1/7] Discord Bot Token:');
    console.log('   (Discord Developer Portal > Applications > Bot > Token > Reset Token)');
    let discordToken = existing['DISCORD_TOKEN'] || '';
    while (true) {
      const input = await rl.question(`   DISCORD_TOKEN [Mevcut: ${mask(discordToken)}] (Çıkış: q / Demo: demo): `);
      const chosen = input.trim() || discordToken;
      const validation = validateDiscordToken(chosen);
      if (validation.isExit) {
        console.log('\n👋 Kurulum sihirbazı sonlandırıldı.');
        return;
      }
      if (validation.isDemo) {
        console.log('\n🎮 Sandbox Demo modu başlatılıyor...');
        rl.close();
        const { runDemo } = await import('./demo');
        await runDemo();
        return;
      }
      if (validation.valid) {
        discordToken = chosen;
        break;
      }
      console.log(`   ❌ Hata: ${validation.reason}. Tekrar deneyin.`);
    }

    // 2. DISCORD_CLIENT_ID
    console.log('\n🆔 [Adım 2/7] Discord Application (Client) ID:');
    console.log('   (Discord Developer Portal > General Information > Application ID)');
    let clientId = existing['DISCORD_CLIENT_ID'] || '';
    while (true) {
      const input = await rl.question(`   DISCORD_CLIENT_ID [Mevcut: ${clientId || 'boş'}]: `);
      const chosen = input.trim() || clientId;
      const validation = validateClientId(chosen);
      if (validation.valid) {
        clientId = chosen;
        break;
      }
      console.log(`   ❌ Hata: ${validation.reason}. Tekrar deneyin.`);
    }

    // 3. AI_PROVIDER
    console.log('\n🧠 [Adım 3/7] AI Şablon Üretici Tercihi:');
    console.log('   1: auto (Google Gemini veya OpenAI varsa kullanır, yoksa Akıllı Dahili Motor)');
    console.log('   2: gemini (Google Gemini 1.5/2.0 Flash - Ücretsiz API)');
    console.log('   3: openai (GPT-4o / GPT-4o-mini)');
    let aiProvider = existing['AI_PROVIDER'] || 'auto';
    const providerInput = await rl.question(`   AI_PROVIDER (1: auto, 2: gemini, 3: openai) [Mevcut: ${aiProvider}]: `);
    const pTrim = providerInput.trim();
    if (pTrim === '1') aiProvider = 'auto';
    else if (pTrim === '2') aiProvider = 'gemini';
    else if (pTrim === '3') aiProvider = 'openai';
    else if (pTrim) aiProvider = pTrim;

    // 4. GEMINI_API_KEY
    console.log('\n✨ [Adım 4/7] Google Gemini API Key (İsteğe Bağlı, Ücretsiz):');
    console.log('   (https://aistudio.google.com/ adresinden anında ücretsiz alınabilir)');
    let geminiKey = existing['GEMINI_API_KEY'] || '';
    const geminiInput = await rl.question(`   GEMINI_API_KEY [Mevcut: ${mask(geminiKey)}]: `);
    if (geminiInput.trim()) geminiKey = geminiInput.trim();

    // 5. OPENAI_API_KEY
    console.log('\n⚡ [Adım 5/7] OpenAI API Key (İsteğe Bağlı):');
    console.log('   (https://platform.openai.com/ adresinden temin edilebilir)');
    let openaiKey = existing['OPENAI_API_KEY'] || '';
    const openaiInput = await rl.question(`   OPENAI_API_KEY [Mevcut: ${mask(openaiKey)}]: `);
    if (openaiInput.trim()) openaiKey = openaiInput.trim();

    // 6. IMAGE_PROVIDER
    console.log('\n🎨 [Adım 6/7] AI Logo Sağlayıcısı:');
    console.log('   1: pollinations (Ücretsiz, limitsiz, sıfır kurulum, yüksek kalite SDXL/Flux)');
    console.log('   2: openai (OpenAI DALL-E 3 - API key gerektirir)');
    let imgProvider = existing['IMAGE_PROVIDER'] || 'pollinations';
    const imgInput = await rl.question(`   IMAGE_PROVIDER (1: pollinations, 2: openai) [Mevcut: ${imgProvider}]: `);
    const imgTrim = imgInput.trim();
    if (imgTrim === '1') imgProvider = 'pollinations';
    else if (imgTrim === '2') imgProvider = 'openai';
    else if (imgTrim) imgProvider = imgTrim;

    // 7. DEFAULT_LOCALE
    console.log('\n🌐 [Adım 7/7] Varsayılan Dil:');
    console.log('   tr: Türkçe');
    console.log('   en: English');
    let locale = existing['DEFAULT_LOCALE'] || 'tr';
    const locInput = await rl.question(`   DEFAULT_LOCALE (tr / en) [Mevcut: ${locale}]: `);
    if (locInput.trim().toLowerCase() === 'en') locale = 'en';
    else if (locInput.trim().toLowerCase() === 'tr') locale = 'tr';

    // Save .env file
    const envOutput = `# ========================================================
# 🤖 DISCORD AI ARCHITECT - ÇEVRESEL DEĞİŞKENLER (.ENV)
# PeakBot & Onyx AI Engine Yapılandırması
# ========================================================

# Discord Bot Token
DISCORD_TOKEN=${discordToken}

# Discord Bot Client ID
DISCORD_CLIENT_ID=${clientId}

# AI Blueprint Sağlayıcıları (auto, gemini, openai)
AI_PROVIDER=${aiProvider}

# Google Gemini API Anahtarı
GEMINI_API_KEY=${geminiKey}

# OpenAI API Anahtarı
OPENAI_API_KEY=${openaiKey}

# AI Logo Oluşturucu Sağlayıcısı (pollinations, openai)
IMAGE_PROVIDER=${imgProvider}

# Varsayılan Sunucu Dili (tr veya en)
DEFAULT_LOCALE=${locale}

# Web Companion Studio Portu
PORT=3000
`;

    fs.writeFileSync(envPath, envOutput, 'utf-8');
    console.log('\n💾 .env dosyası başarıyla kaydedildi!');

    // 8. 1-Click Test Connection
    console.log('\n================================================================');
    const testAns = await rl.question('⚡ Discord bot bağlantısı ve API anahtarları hemen test edilsin mi? (E/h): ');
    if (testAns.trim().toLowerCase() !== 'h' && testAns.trim().toLowerCase() !== 'hayır' && testAns.trim().toLowerCase() !== 'n') {
      console.log('\n🔍 Bağlantılar test ediliyor, lütfen bekleyin...');

      // Test Discord Token
      const testClient = new Client({
        intents: [GatewayIntentBits.Guilds],
      });

      try {
        const loginPromise = testClient.login(discordToken);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Discord API yanıt vermedi (10 saniye zaman aşımı)')), 10000)
        );
        await Promise.race([loginPromise, timeoutPromise]);
        const tag = testClient.user?.tag || testClient.user?.username || 'Bilinmiyor';
        const guildCount = testClient.guilds.cache.size;
        console.log(`  ✅ Discord API Bağlantısı Başarılı!`);
        console.log(`     • Bot Kullanıcı Adı : ${tag}`);
        console.log(`     • Bağlı Olduğu Sunucu: ${guildCount} sunucu`);
        console.log(`     • Bot Ping          : ${testClient.ws.ping}ms`);
      } catch (err: any) {
        console.error(`  ❌ Discord API Bağlantı Hatası: ${err.message}`);
        console.log('     > Tavsiye: Developer Portal\'da token\'ı sıfırlayıp Gateway Intent\'lerin açık olduğunu kontrol edin.');
      } finally {
        testClient.destroy();
      }

      // Test Gemini if provided
      if (geminiKey) {
        try {
          const res = await axios.get(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`,
            { timeout: 5000 }
          );
          if (res.status === 200) {
            console.log('  ✅ Google Gemini API Bağlantısı Doğrulandı! (Modeller erişilebilir)');
          }
        } catch (err: any) {
          console.warn(`  ⚠️ Google Gemini API Uyarısı: ${err.message}`);
        }
      }

      // Test OpenAI if provided
      if (openaiKey) {
        try {
          const res = await axios.get('https://api.openai.com/v1/models', {
            headers: { Authorization: `Bearer ${openaiKey}` },
            timeout: 5000,
          });
          if (res.status === 200) {
            console.log('  ✅ OpenAI API Bağlantısı Doğrulandı!');
          }
        } catch (err: any) {
          console.warn(`  ⚠️ OpenAI API Uyarısı: ${err.message}`);
        }
      }
    }

    console.log('\n================================================================');
    console.log('🎉 KURULUM TAMAMLANDI!');
    console.log('Botunuzu hemen başlatmak için:');
    console.log('  • npm start            (veya)');
    console.log('  • baslat.bat           (Konsol Başlatıcı)');
    console.log('  • npm run demo         (veya demo.bat - Sandbox Modu)');
    console.log('================================================================\n');
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  runSetup().catch((err) => {
    console.error('Kurulum hatası:', err);
    process.exit(1);
  });
}

export { runSetup };
