import Firecrawl from "firecrawl";
import { remark } from "remark";
import strip from "strip-markdown";
import * as z from "zod";
import type { Article } from "../../types/Article.ts";
import type { NewsProvider } from "./NewsProvider.ts";

const SerpAPIResponseSchema = z.object({
	news_results: z
		.array(
			z.object({
				position: z.number(),
				title: z.string(),
				source: z.object({
					name: z.string(),
					icon: z.url().optional(),
					authors: z.array(z.string()).optional(),
				}),
				link: z.string().url(),
				thumbnail: z.string().url().optional(),
				thumbnail_small: z.string().url().optional(),
				date: z.string(),
				iso_date: z.string(),
			}),
		)
		.transform((results) => results.slice(0, 5)),
});

export class SerpApiProvider implements NewsProvider {
	private readonly key: string;
	private readonly fc: string;

	constructor(key: string, fc: string) {
		this.key = key;
		this.fc = fc;
	}

	async search(claim: string): Promise<Article[]> {
		const fc = new Firecrawl({ apiKey: this.fc });

		const BASE_URL = "https://serpapi.com/search.json";

		const params = new URLSearchParams({
			engine: "google_news",
			q: claim,
			hl: "en",
			api_key: this.key,
		});
		const url = `${BASE_URL}?${params}`;

		try {
			const response = await fetch(url);

			if (!response.ok) {
				const body = await response.text();
				throw new Error(
					`SerpAPI: HTTP ${response.status} ${response.statusText}\n${body}`,
				);
			}

			const json = await response.json();
			const result = SerpAPIResponseSchema.safeParse(json);
			if (!result.success) {
				console.log(json, result);
				throw new Error(
					`SerpAPI: Invalid response format\n${result.error.message}`,
				);
			}

			const articles = await Promise.all(
				result.data.news_results.map(async (item) => {
					try {
						const scrape = await fc.scrape(item.link, {
							formats: ["markdown"],
						});
						const text = String(
							await remark().use(strip).process(scrape.markdown),
						)
							.replace(/\n\s*\n+/g, "\n")
							.slice(0, 10_000);

						return {
							title: item.title,
							source: item.source.name,
							publishedAt: item.iso_date,
							url: item.link,
							snippet: text ?? scrape.metadata?.description ?? "",
						};
					} catch {
						return {
							title: item.title,
							source: item.source.name,
							publishedAt: item.iso_date,
							url: item.link,
							snippet: "",
						};
					}
				}),
			);

			return articles;
		} catch (e) {
			throw new Error(
				`SerpAPI: Request failed\n${
					e instanceof Error ? e.message : String(e)
				}`,
			);
		}
	}
}
