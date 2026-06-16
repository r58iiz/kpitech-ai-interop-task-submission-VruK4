/** biome-ignore-all lint/complexity/useLiteralKeys: Clashing with ts-lsp */

import fs from "node:fs";
import dotenv from "dotenv";
import express from "express";

import { Pipeline } from "./glue/Pipeline.js";
import { OpenRouter } from "./providers/llm/OpenRouter.js";
import { NewsApiProvider } from "./providers/news/NewsApi.js";
import { SerpApiProvider } from "./providers/news/SerpApi.ts";
import { AnswerService } from "./services/AnswerService.js";
import { JudgeService } from "./services/JudgeService.js";
import { QueryGenerationService } from "./services/QueryGenerationService.js";
import { RelevanceService } from "./services/RelevanceService.js";
import type { GroundTruthEntry } from "./types/Evaluation.ts";

dotenv.config();

// const NEWSAPI_KEY = process.env["NEWSAPI_API_KEY"];
// if (!NEWSAPI_KEY) {
// 	throw new Error("Missing NEWSAPI_KEY");
// }

const OPENROUTER_API_KEY = process.env["OPENROUTER_API_KEY"];
if (!OPENROUTER_API_KEY) {
	throw new Error("Missing OPENROUTER_API_KEY");
}

const SERPAPI_KEY = process.env["SERPAPI_API_KEY"];
const FIRECRAWL_KEY = process.env["FIRECRAWL_API_KEY"];
if (!SERPAPI_KEY || !FIRECRAWL_KEY) {
	throw new Error("Missing SERPAPI_KEY/FIRECRAWL_KEY");
}

const llmProv = new OpenRouter(OPENROUTER_API_KEY);
// const newsProv = new NewsApiProvider(NEWSAPI_KEY);
const newsProv = new SerpApiProvider(SERPAPI_KEY, FIRECRAWL_KEY);

const queryService = new QueryGenerationService(llmProv);
const relevanceService = new RelevanceService(llmProv);
const answerService = new AnswerService(llmProv);
const pipeline = new Pipeline(
	queryService,
	newsProv,
	relevanceService,
	answerService,
);

const judgeService = new JudgeService(llmProv);

const app = express();

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
	res.redirect("/result");
});

app.get("/result", (_req, res) => {
	res.render("result");
});

app.post("/result", async (req, res) => {
	const claim = req.body.claim;

	try {
		const result = await pipeline.run(claim);
		const sources = result.articles.map(({ article, relevance }, index) => ({
			index: index + 1,
			title: article.title,
			source: article.source,
			published: new Date(article.publishedAt).toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
				year: "numeric",
			}),
			url: article.url,
			relevance: relevance.relevance,
			reason: relevance.reason,
		}));

		res.render("result", {
			claim,
			sources,
			answer: result.answer,
		});
	} catch (err) {
		res.render("result", {
			claim,
			error: err instanceof Error ? err.message : String(err),
		});
	}
});

app.get("/evaluation", (_req, res) => {
	const groundTruth = JSON.parse(
		fs.readFileSync("./ground_truth.json", "utf8"),
	);
	res.render("evaluation", {
		groundTruth,
		groundTruthFile: "ground_truth.json",
	});
});

app.post("/evaluation/run", async (_req, res) => {
	const groundTruth: GroundTruthEntry[] = JSON.parse(
		fs.readFileSync("./ground_truth.json", "utf8"),
	);

	try {
		const results = await Promise.all(
			groundTruth.map(async (item) => {
				const result = await pipeline.run(item.claim);

				const evaluation = await judgeService.evaluate(
					item.expectedVerdict,
					result.answer,
				);

				return {
					claim: item.claim,
					expectedVerdict: item.expectedVerdict,
					answer: result.answer,
					sources: result.articles,
					evaluation,
				};
			}),
		);

		const match = results.filter((r) =>
			r.evaluation.startsWith("Match"),
		).length;

		const partial = results.filter((r) =>
			r.evaluation.startsWith("Partial Match"),
		).length;

		const noMatch = results.filter((r) =>
			r.evaluation.startsWith("No Match"),
		).length;

		const summary = {
			match,
			partial,
			noMatch,
			total: results.length,
			accuracy:
				results.length === 0 ? 0 : Math.round((match / results.length) * 100),
		};

		res.render("evaluation", {
			groundTruth,
			groundTruthFile: "ground_truth.json",
			results,
			summary,
		});
	} catch (err) {
		res.render("evaluation", {
			groundTruth,
			groundTruthFile: "ground_truth.json",
			error: err instanceof Error ? err.message : String(err),
		});
	}
});

app.listen(3000, () => {
	console.log("http://localhost:3000");
});
