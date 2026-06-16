import type { Article } from "../../types/Article.js";

export interface NewsProvider {
	search(claim: string): Promise<Article[]>;
}
