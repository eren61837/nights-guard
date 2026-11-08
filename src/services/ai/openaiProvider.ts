import OpenAI from 'openai';
import { ServerBlueprint, BlueprintGenerationOptions } from '../../types/blueprint';
import { buildSystemPrompt, buildUserPrompt } from './promptTemplates';

export class OpenAIProvider {
  private openai: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4o-mini') {
    this.openai = new OpenAI({ apiKey });
    this.model = model;
  }

  public async generateBlueprint(options: BlueprintGenerationOptions): Promise<ServerBlueprint> {
    const response = await this.openai.chat.completions.create({
      model: this.model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: buildUserPrompt(options) },
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
    return parsed as ServerBlueprint;
  }
}
