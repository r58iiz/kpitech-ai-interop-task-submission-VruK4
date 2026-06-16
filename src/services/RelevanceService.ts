import { SYSTEM_PROMPT } from "../prompts/relevancePrompt.js";
import type { LLMProvider } from "../providers/llm/LLMProvider.js";
import type { Article } from "../types/Article.js";
import type { GenerateOptions, Prompt } from "../types/LLMProvider.ts";
import type { RelevanceAssessment } from "../types/Pipeline.ts";

export class RelevanceService {
	private readonly llm: LLMProvider;

	constructor(llm: LLMProvider) {
		this.llm = llm;
	}

	async assess(
		claim: string,
		article: Article,
		options?: GenerateOptions,
	): Promise<RelevanceAssessment> {
		const prompt: Prompt = {
			system: SYSTEM_PROMPT,
			user: `
Claim:
${claim}

Article Title:
${article.title}

Article Snippet:
${article.snippet}
`.trim(),
		};

		const response = await this.llm.generate(prompt, options);

		const [relevance, reason] = response.split("|", 2);

		return { relevance, reason } as RelevanceAssessment;
	}
}
