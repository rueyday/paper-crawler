export interface Paper {
  title: string;
  summary: string;
  published: string;
  authors: string[];
  link: string;
  pdf_link: string;
  relevance_score: number;
  added_at?: string;
}

export interface PaperList {
  papers: Paper[];
  last_updated: string;
}

export interface RecommendedData extends PaperList {}

export interface KeywordsData {
  keywords: string[];
}
