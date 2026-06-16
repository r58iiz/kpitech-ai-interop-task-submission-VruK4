import * as z from "zod";

export type Prompt = {
	system?: string;
	user?: string;
};

export type GenerateOptions = {
	models?: string[];
	maxTokens?: number;
};

export const OpenRouterResponseSchema = z.object({
	choices: z
		.array(
			z.object({
				message: z.object({
					content: z.string(),
				}),
			}),
		)
		.min(1),
});

/*
{
	"id": "...",
	"object": "chat.completion",
	"created": 1781533240,
	"model": "nex-agi/nex-n2-pro:free",
	"provider": "Nex AGI",
	"system_fingerprint": null,
	"service_tier": null,
	"choices": [
		{
			"index": 0,
			"logprobs": null,
			"finish_reason": "stop",
			"native_finish_reason": "stop",
			"message": {
				"role": "assistant",
				"content": "There are **3** r’s in **strawberry**.",
				"refusal": null,
				"reasoning": "\nWe need answer user asks \"How many r`s are in the word `strawberry?`\" Need count r's in word strawberry. Need be careful maybe word includes backtick? \"strawberry?\" includes question mark? They ask word `strawberry?` maybe typo punctuation outside? Count r's in \"strawberry\": s t r a w b e r r y = 3 r's. If include question mark no effect. Need answer concise.\n",
				"reasoning_details": [
					{
						"type": "reasoning.text",
						"text": "\nWe need answer user asks \"How many r`s are in the word `strawberry?`\" Need count r's in word strawberry. Need be careful maybe word includes backtick? \"strawberry?\" includes question mark? They ask word `strawberry?` maybe typo punctuation outside? Count r's in \"strawberry\": s t r a w b e r r y = 3 r's. If include question mark no effect. Need answer concise.\n",
						"format": "unknown",
						"index": 0
					}
				]
			}
		}
	],
	"usage": {
		"prompt_tokens": 23,
		"completion_tokens": 115,
		"total_tokens": 138,
		"cost": 0,
		"is_byok": false,
		"prompt_tokens_details": {
			"cached_tokens": 0,
			"cache_write_tokens": 0,
			"audio_tokens": 0,
			"video_tokens": 0
		},
		"cost_details": {
			"upstream_inference_cost": 0,
			"upstream_inference_prompt_cost": 0,
			"upstream_inference_completions_cost": 0
		},
		"completion_tokens_details": {
			"reasoning_tokens": 93,
			"image_tokens": 0,
			"audio_tokens": 0
		}
	}
}
*/
