export interface Paper {
  title: string;
  summary: string;
  published: string;
  authors: string[];
  link: string;
  pdf_link: string;
  relevance_score: number;
}

export interface PaperData {
  last_updated: string;
  papers: Paper[];
}