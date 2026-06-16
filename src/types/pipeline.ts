import type { Article } from "./Article.ts";

export type Result = {
	articles: { article: Article; relevance: RelevanceAssessment }[];
	answer: string;
};

export type RelevanceAssessment = {
	relevance: "High" | "Medium" | "Low";
	reason: string;
};