"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIProvider = void 0;
const openai_1 = __importDefault(require("openai"));
const promptTemplates_1 = require("./promptTemplates");
class OpenAIProvider {
    openai;
    model;
    constructor(apiKey, model = 'gpt-4o-mini') {
        this.openai = new openai_1.default({ apiKey });
        this.model = model;
    }
    async generateBlueprint(options) {
        const response = await this.openai.chat.completions.create({
            model: this.model,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: (0, promptTemplates_1.buildSystemPrompt)() },
                { role: 'user', content: (0, promptTemplates_1.buildUserPrompt)(options) },
            ],
            temperature: 0.7,
        });
        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error('OpenAI boş yanıt döndürdü.');
        }
        const startIdx = content.indexOf('{');
        const endIdx = content.lastIndexOf('}');
        const jsonStr = startIdx !== -1 && endIdx !== -1 ? content.slice(startIdx, endIdx + 1) : content;
        const parsed = JSON.parse(jsonStr);
        return parsed;
    }
}
exports.OpenAIProvider = OpenAIProvider;
