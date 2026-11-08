"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIManager = void 0;
const config_1 = require("../../config");
const geminiProvider_1 = require("./geminiProvider");
const openaiProvider_1 = require("./openaiProvider");
const smartFallback_1 = require("./smartFallback");
class AIManager {
    gemini;
    openai;
    constructor() {
        if (config_1.config.geminiApiKey) {
            this.gemini = new geminiProvider_1.GeminiProvider(config_1.config.geminiApiKey);
        }
        if (config_1.config.openaiApiKey) {
            this.openai = new openaiProvider_1.OpenAIProvider(config_1.config.openaiApiKey);
        }
    }
    async generateBlueprint(options) {
        // 1. Check preference
        const preferred = config_1.config.aiProvider;
        if (preferred === 'gemini' && this.gemini) {
            try {
                const bp = await this.gemini.generateBlueprint(options);
                return { blueprint: this.sanitizeBlueprint(bp), source: 'gemini' };
            }
            catch (err) {
                console.warn('[AIManager] Gemini hatası, diğer seçenek deneniyor...', err);
            }
        }
        if (preferred === 'openai' && this.openai) {
            try {
                const bp = await this.openai.generateBlueprint(options);
                return { blueprint: this.sanitizeBlueprint(bp), source: 'openai' };
            }
            catch (err) {
                console.warn('[AIManager] OpenAI hatası, diğer seçenek deneniyor...', err);
            }
        }
        // Auto / fallback chain
        if (this.gemini) {
            try {
                const bp = await this.gemini.generateBlueprint(options);
                return { blueprint: this.sanitizeBlueprint(bp), source: 'gemini' };
            }
            catch (err) {
                console.warn('[AIManager] Otomatik Gemini başarısız oldu:', err);
            }
        }
        if (this.openai) {
            try {
                const bp = await this.openai.generateBlueprint(options);
                return { blueprint: this.sanitizeBlueprint(bp), source: 'openai' };
            }
            catch (err) {
                console.warn('[AIManager] Otomatik OpenAI başarısız oldu:', err);
            }
        }
        // Smart Fallback
        console.info('[AIManager] API anahtarı veya servis yanıt vermedi; Smart Blueprint Engine devrede.');
        const bp = smartFallback_1.SmartBlueprintGenerator.generate(options);
        return { blueprint: this.sanitizeBlueprint(bp), source: 'smart_fallback' };
    }
    sanitizeBlueprint(bp) {
        if (!bp.roles || !Array.isArray(bp.roles))
            bp.roles = [];
        if (!bp.categories || !Array.isArray(bp.categories))
            bp.categories = [];
        if (!bp.automodRules || !Array.isArray(bp.automodRules))
            bp.automodRules = [];
        if (!bp.richEmbeds || !Array.isArray(bp.richEmbeds))
            bp.richEmbeds = [];
        // Filter out @everyone from roles as Discord API rejects creating @everyone
        bp.roles = bp.roles.filter((role) => role && role.name && role.name.toLowerCase() !== '@everyone' && role.name.toLowerCase() !== 'everyone');
        // Ensure role names are <= 100 chars
        for (const role of bp.roles) {
            if (role.name)
                role.name = role.name.trim().slice(0, 100);
        }
        // Ensure channel and category names are <= 100 chars
        for (const cat of bp.categories) {
            if (cat.name)
                cat.name = cat.name.slice(0, 100);
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
exports.AIManager = AIManager;
