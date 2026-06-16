import { SYSTEM_PROMPT } from "../prompts/judgePrompt.js";
import type { LLMProvider } from "../providers/llm/LLMProvider.js";
import type { GenerateOptions, Prompt } from "../types/LLMProvider.ts";

export class JudgeService {
	private readonly llm: LLMProvider;

	constructor(llm: LLMProvider) {
		this.llm = llm;
	}

	async evaluate(
		verdict: string,
		answer: string,
		options?: GenerateOptions,
	): Promise<string> {
		const prompt: Prompt = {
			system: SYSTEM_PROMPT.replace("{{verdict}}", verdict).replace(
				"{{answer}}",
				answer,
			),
		};

		return this.llm.generate(prompt, options);
	}
}
