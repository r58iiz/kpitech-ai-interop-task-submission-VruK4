import type { NewsProvider } from "../providers/news/NewsProvider.js";
import { SerpApiProvider } from "../providers/news/SerpApi.ts";
import type { AnswerService } from "../services/AnswerService.js";
import type { QueryGenerationService } from "../services/QueryGenerationService.js";
import type { RelevanceService } from "../services/RelevanceService.js";
import type { Result } from "../types/Pipeline.js";

export class Pipeline {
	private readonly queryGenerator: QueryGenerationService;
	private readonly newsProvider: NewsProvider;
	private readonly relevanceService: RelevanceService;
	private readonly answerService: AnswerService;

	constructor(
		queryGenerator: QueryGenerationService,
		newsProvider: NewsProvider,
		relevanceService: RelevanceService,
		answerService: AnswerService,
	) {
		this.queryGenerator = queryGenerator;
		this.newsProvider = newsProvider;
		this.relevanceService = relevanceService;
		this.answerService = answerService;
	}

	async run(claim: string): Promise<Result> {
		let query: string;
		if (this.newsProvider instanceof SerpApiProvider) {
			query = await this.queryGenerator.generateQuery(claim);
		} else {
			query = claim;
		}

		const articles = await this.newsProvider.search(query);

		const ratedArticles = await Promise.all(
			articles.map(async (article) => ({
				article,
				relevance: await this.relevanceService.assess(claim, article),
			})),
		);

		const answer = await this.answerService.answer(claim, articles);

		return {
			articles: ratedArticles,
			answer,
		};
	}
}
