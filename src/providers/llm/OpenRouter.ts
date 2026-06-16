import {
	type GenerateOptions,
	OpenRouterResponseSchema,
	type Prompt,
} from "../../types/LLMProvider.ts";
import type { LLMProvider } from "./LLMProvider.js";

export class OpenRouter implements LLMProvider {
	private readonly key: string;

	constructor(key: string) {
		this.key = key;
	}

	async generate(prompt: Prompt, options?: GenerateOptions): Promise<string> {
		const url = "https://openrouter.ai/api/v1/chat/completions";

		const models = options?.models ?? [
			"nvidia/nemotron-3-ultra-550b-a55b",
			// "minimax/minimax-m3",
			// "qwen/qwen3.5-flash-02-23",
			// "ibm-granite/granite-4.1-8b",
			//
			// "nex-agi/nex-n2-pro:free",
			// "openrouter/owl-alpha",
		];

		const messages = [];
		if (prompt.system) {
			messages.push({
				role: "system",
				content: prompt.system,
			});
		}
		if (prompt.user) {
			messages.push({
				role: "user",
				content: prompt.user,
			});
		}

		const payload = {
			models,
			messages,
			...(options?.maxTokens && {
				max_tokens: options.maxTokens,
			}),
		};

		try {
			const response = await fetch(url, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${this.key}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				const body = await response.text();
				throw new Error(
					`OpenRouter: HTTP ${response.status} ${response.statusText}\n${body}`,
				);
			}

			const json = await response.json();
			const result = OpenRouterResponseSchema.safeParse(json);
			if (!result.success) {
				console.log(json, result);
				throw new Error(
					`OpenRouter: Invalid response format\n${result.error.message}`,
				);
			}

			const [choice] = result.data.choices;
			if (!choice) {
				throw new Error("OpenRouter: No choices returned");
			}
			return choice.message.content;
		} catch (e) {
			throw new Error(
				`OpenRouter: Request failed\n${
					e instanceof Error ? e.message : String(e)
				}`,
			);
		}
	}
}
