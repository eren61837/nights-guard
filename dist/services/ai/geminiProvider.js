"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiProvider = void 0;
const generative_ai_1 = require("@google/generative-ai");
const promptTemplates_1 = require("./promptTemplates");
class GeminiProvider {
    genAI;
    modelName;
    constructor(apiKey, modelName = 'gemini-1.5-flash') {
        this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        this.modelName = modelName;
    }
    async generateBlueprint(options) {
        const model = this.genAI.getGenerativeModel({
            model: this.modelName,
            generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.7,
            },
            systemInstruction: (0, promptTemplates_1.buildSystemPrompt)(),
        });
        const userPrompt = (0, promptTemplates_1.buildUserPrompt)(options);
        const result = await model.generateContent(userPrompt);
        const responseText = result.response.text();
        const startIdx = responseText.indexOf('{');
        const endIdx = responseText.lastIndexOf('}');
        const jsonStr = startIdx !== -1 && endIdx !== -1 ? responseText.slice(startIdx, endIdx + 1) : responseText;
        const parsed = JSON.parse(jsonStr);
        return parsed;
    }
}
exports.GeminiProvider = GeminiProvider;
