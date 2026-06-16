import { SYSTEM_PROMPT } from "../prompts/answerPrompt.js";
import type { LLMProvider } from "../providers/llm/LLMProvider.js";
import type { Article } from "../types/Article.js";
import type { GenerateOptions, Prompt } from "../types/LLMProvider.ts";

export class AnswerService {
	private readonly llm: LLMProvider;

	constructor(llm: LLMProvider) {
		this.llm = llm;
	}

	async answer(
		claim: string,
		articles: Article[],
		options?: GenerateOptions,
	): Promise<string> {
		const formattedArticles = articles
			.map((article, index) =>
				`
[Article ${index + 1}]
Source: ${article.source}
Date: ${article.publishedAt}
Title: ${article.title}
Snippet: ${article.snippet}
`.trim(),
			)
			.join("\n");

		const prompt: Prompt = {
			system: SYSTEM_PROMPT,
			user: `
Claim:
${claim}

Articles:
${formattedArticles}`.trim(),
		};

		return this.llm.generate(prompt, options);
	}
}
