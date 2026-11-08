import { config } from '../../config';
import { ServerBlueprint, BlueprintGenerationOptions } from '../../types/blueprint';
import { GeminiProvider } from './geminiProvider';
import { OpenAIProvider } from './openaiProvider';
import { SmartBlueprintGenerator } from './smartFallback';

export class AIManager {
  private gemini?: GeminiProvider;
  private openai?: OpenAIProvider;

  constructor() {
    if (config.geminiApiKey) {
      this.gemini = new GeminiProvider(config.geminiApiKey);
    }
    if (config.openaiApiKey) {
      this.openai = new OpenAIProvider(config.openaiApiKey);
    }
  }

  public async generateBlueprint(options: BlueprintGenerationOptions): Promise<{
    blueprint: ServerBlueprint;
    source: 'gemini' | 'openai' | 'smart_fallback';
  }> {
    // 1. Check preference
    const preferred = config.aiProvider;

    if (preferred === 'gemini' && this.gemini) {
      try {
        const bp = await this.gemini.generateBlueprint(options);
        return { blueprint: this.sanitizeBlueprint(bp), source: 'gemini' };
      } catch (err) {
        console.warn('[AIManager] Gemini hatası, diğer seçenek deneniyor...', err);
      }
    }

    if (preferred === 'openai' && this.openai) {
      try {
        const bp = await this.openai.generateBlueprint(options);
        return { blueprint: this.sanitizeBlueprint(bp), source: 'openai' };
      } catch (err) {
        console.warn('[AIManager] OpenAI hatası, diğer seçenek deneniyor...', err);
      }
    }

    // Auto / fallback chain
    if (this.gemini) {
      try {
        const bp = await this.gemini.generateBlueprint(options);
        return { blueprint: this.sanitizeBlueprint(bp), source: 'gemini' };
      } catch (err) {
        console.warn('[AIManager] Otomatik Gemini başarısız oldu:', err);
      }
    }

    if (this.openai) {
      try {
        const bp = await this.openai.generateBlueprint(options);
        return { blueprint: this.sanitizeBlueprint(bp), source: 'openai' };
      } catch (err) {
        console.warn('[AIManager] Otomatik OpenAI başarısız oldu:', err);
      }
    }

    // Smart Fallback
    console.info('[AIManager] API anahtarı veya servis yanıt vermedi; Smart Blueprint Engine devrede.');
    const bp = SmartBlueprintGenerator.generate(options);
    return { blueprint: this.sanitizeBlueprint(bp), source: 'smart_fallback' };
  }

  private sanitizeBlueprint(bp: ServerBlueprint): ServerBlueprint {
    if (!bp.roles || !Array.isArray(bp.roles)) bp.roles = [];
    if (!bp.categories || !Array.isArray(bp.categories)) bp.categories = [];
    if (!bp.automodRules || !Array.isArray(bp.automodRules)) bp.automodRules = [];
    if (!bp.richEmbeds || !Array.isArray(bp.richEmbeds)) bp.richEmbeds = [];

    // Filter out @everyone from roles as Discord API rejects creating @everyone
    bp.roles = bp.roles.filter(
      (role) => role && role.name && role.name.toLowerCase() !== '@everyone' && role.name.toLowerCase() !== 'everyone'
    );

    // Ensure role names are <= 100 chars
    for (const role of bp.roles) {
      if (role.name) role.name = role.name.trim().slice(0, 100);
    }

    // Ensure channel and category names are <= 100 chars
    for (const cat of bp.categories) {
      if (cat.name) cat.name = cat.name.slice(0, 100);
      if (Array.isArray(cat.channels)) {
        for (const ch of cat.channels) {
          if (ch.name) {
            // Discord channel names: lowercase, spaces to dashes (for text)
            let name = ch.name.slice(0, 100);
            if (ch.type === 'GUILD_TEXT' || ch.type === 'GUILD_ANNOUNCEMENT') {
              name = name.toLowerCase().replace(/\s+/g, '-');
            }
            ch.name = name;
          }
        }
      }
    }

    return bp;
  }
}
