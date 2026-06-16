import { SYSTEM_PROMPT } from "../prompts/rewordPrompt.js";
import type { LLMProvider } from "../providers/llm/LLMProvider.js";
import type { GenerateOptions, Prompt } from "../types/LLMProvider.ts";

export class QueryGenerationService {
	private readonly llm: LLMProvider;

	constructor(llm: LLMProvider) {
		this.llm = llm;
	}

	async generateQuery(
		claim: string,
		options?: GenerateOptions,
	): Promise<string> {
		const prompt: Prompt = {
			system: SYSTEM_PROMPT,
			user: claim,
		};

		return this.llm.generate(prompt, options);
	}
}
