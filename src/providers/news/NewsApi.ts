import * as z from "zod";
import type { Article } from "../../types/Article.js";
import type { NewsProvider } from "./NewsProvider.js";

const NewsAPIErrorSchema = z.object({
	status: z.literal("error"),
	code: z.string(),
	message: z.string(),
});

const NewsAPIArticleSchema = z.object({
	source: z.object({
		id: z.string().nullable(),
		name: z.string(),
	}),
	author: z.string().nullable(),
	title: z.string(),
	description: z.string(),
	url: z.url(),
	urlToImage: z.string().nullable(),
	publishedAt: z.iso.datetime(),
	content: z.string(),
});

const NewsAPIResultSchema = z.object({
	status: z.literal("ok"),
	totalResults: z.number(),
	articles: z.array(NewsAPIArticleSchema),
});

const NewsAPIResponseSchema = z.union([
	NewsAPIErrorSchema,
	NewsAPIResultSchema,
]);

export class NewsApiProvider implements NewsProvider {
	private readonly key: string;

	constructor(key: string) {
		this.key = key;
	}

	async search(claim: string): Promise<Article[]> {
		const BASE_URL = "https://newsapi.org/v2/everything";

		const params = new URLSearchParams({
			q: claim,
			// Issue:
			// None of the queries in eval doc have relevant articles
			// within 30 day period; 30 day period is limit for free
			// from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
			language: "en",
			sortBy: "relevancy",
			pageSize: "5",
		});
		const url = `${BASE_URL}?${params}`;

		try {
			const response = await fetch(url, {
				headers: {
					"X-Api-Key": this.key,
				},
			});

			if (!response.ok) {
				const body = await response.text();
				throw new Error(
					`NewsAPI: HTTP ${response.status} ${response.statusText}\n${body}`,
				);
			}

			const json = await response.json();
			const result = NewsAPIResponseSchema.safeParse(json);
			if (!result.success) {
				console.log(json, result);
				throw new Error(
					`NewsAPI: Invalid response format\n${result.error.message}`,
				);
			}

			switch (result.data.status) {
				case "error": {
					throw new Error(
						`NewsAPI (${result.data.code}): ${result.data.message}`,
					);
				}
				case "ok": {
					return result.data.articles.map((a) => {
						return {
							title: a.title,
							source: a.source.name,
							publishedAt: a.publishedAt,
							url: a.url,
							snippet: a.content,
						};
					});
				}
			}
		} catch (e) {
			throw new Error(
				`NewsAPI: Request failed\n${
					e instanceof Error ? e.message : String(e)
				}`,
			);
		}
	}
}
