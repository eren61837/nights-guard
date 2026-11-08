import { GoogleGenerativeAI } from '@google/generative-ai';
import { ServerBlueprint, BlueprintGenerationOptions } from '../../types/blueprint';
import { buildSystemPrompt, buildUserPrompt } from './promptTemplates';
import { BLUEPRINT_JSON_SCHEMA } from './blueprintSchema';

export class GeminiProvider {
  private genAI: GoogleGenerativeAI;
  private modelName: string;

  constructor(apiKey: string, modelName: string = 'gemini-1.5-flash') {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = modelName;
  }

  public async generateBlueprint(options: BlueprintGenerationOptions): Promise<ServerBlueprint> {
    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
      systemInstruction: buildSystemPrompt(),
    });

    const userPrompt = buildUserPrompt(options);
    const result = await model.generateContent(userPrompt);
    const responseText = result.response.text();

    const startIdx = responseText.indexOf('{');
    const endIdx = responseText.lastIndexOf('}');
    const jsonStr = startIdx !== -1 && endIdx !== -1 ? responseText.slice(startIdx, endIdx + 1) : responseText;

    const parsed = JSON.parse(jsonStr);
    return parsed as ServerBlueprint;
  }
}
