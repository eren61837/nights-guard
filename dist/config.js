"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.validateConfig = validateConfig;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Standart .env yüklemesi
dotenv_1.default.config();
// Otomatik env tarayıcı: '1.env', 'honto.env', '.env' veya içinde .env geçen TÜM dosyaları bulup yükle
const searchDirs = ['.', process.cwd(), '/home/container'];
for (const dir of searchDirs) {
    try {
        if (fs_1.default.existsSync(dir)) {
            const files = fs_1.default.readdirSync(dir);
            for (const file of files) {
                if (file === '.env' || file.endsWith('.env') || (file.includes('env') && !file.endsWith('.js') && !file.endsWith('.ts') && !file.endsWith('.json') && !file.endsWith('.md'))) {
                    const fullPath = path_1.default.join(dir, file);
                    try {
                        if (fs_1.default.statSync(fullPath).isFile()) {
                            dotenv_1.default.config({ path: fullPath });
                        }
                    }
                    catch (e) { }
                }
            }
        }
    }
    catch (e) { }
}
exports.config = {
    discordToken: process.env.DISCORD_TOKEN || '',
    discordClientId: process.env.DISCORD_CLIENT_ID || undefined,
    ownerId: process.env.OWNER_ID || '1138498666785677492',
    aiProvider: process.env.AI_PROVIDER || 'auto',
    geminiApiKey: process.env.GEMINI_API_KEY || undefined,
    openaiApiKey: process.env.OPENAI_API_KEY || undefined,
    imageProvider: process.env.IMAGE_PROVIDER || 'pollinations',
    defaultLocale: process.env.DEFAULT_LOCALE || 'tr',
};
function validateConfig() {
    const errors = [];
    const warnings = [];
    if (!exports.config.discordToken || exports.config.discordToken === 'BURAYA_BOT_TOKENINI_YAZIN') {
        errors.push('DISCORD_TOKEN bulunamadı veya ayarlanmamış (.env dosyasını kontrol edin)');
    }
    if (!exports.config.geminiApiKey && !exports.config.openaiApiKey) {
        warnings.push('Ne GEMINI_API_KEY ne de OPENAI_API_KEY tanımlanmış. Bot gelişmiş "Akıllı Şablon Motoru" (Smart Fallback) ile çalışacak.');
    }
    return {
        valid: errors.length === 0,
        warnings,
        errors,
    };
}
