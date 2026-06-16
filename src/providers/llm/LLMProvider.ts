import type { GenerateOptions, Prompt } from "../../types/LLMProvider.ts";

export interface LLMProvider {
	generate(prompt: Prompt, options?: GenerateOptions): Promise<string>;
}
