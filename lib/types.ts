export type Message = {
  role: "user" | "assistant";
  content: string;
};

export const CATEGORIES = [
  "fear", "hope", "grief", "excitement", "anger",
  "uncertainty", "wonder", "other",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const EVENT_TAGS = [
  "work_affected", "health_affected", "relationships_affected",
  "creative_affected", "education_affected", "financial_affected",
] as const;
export type EventTag = (typeof EVENT_TAGS)[number];

export const BEATS = [
  "opening", "future", "personal", "closing", "other",
] as const;
export type Beat = (typeof BEATS)[number];

export type ConversationItem = {
  PK: string;
  SK: string;
  id: string;
  createdAt: string;
  summary: string;
  quote: string;
  beat: Beat;
  poignancyScore: number;
  contentWarning: boolean;
  voteCount: number;
  categories: Category[];
  eventTags: EventTag[];
  regionSubdivision?: string;
  regionCountry?: string;
  regionContinent?: string;
  language?: string;
};

export type ConversationRecord = {
  id: string;
  createdAt: string;
  messages: Message[];
  extractedData: ExtractedData;
};

export type ExtractedData = {
  summary: string;
  quote: string;
  beat: Beat;
  poignancyScore: number;
  contentWarning: boolean;
  categories: Category[];
  eventTags: EventTag[];
  language: string;
  quoteEn: string | null;
  summaryEn: string | null;
};

export type SubmissionInput = {
  messages: Message[];
  regionSubdivision?: string;
  regionCountry?: string;
  regionContinent?: string;
};

export type DemographicsInput = {
  gender?: string;
  ageRange?: string;
  employmentStatus?: string;
  regionContinent?: string;
  categories: Category[];
  eventTags: string[];
};

export type PagedResult<T> = {
  items: T[];
  cursor?: string;
};

export type FilterParams = {
  category?: Category;
  eventTag?: EventTag;
  regionSubdivision?: string;
  regionCountry?: string;
  regionContinent?: string;
  beat?: Beat;
  cursor?: string;
  limit?: number;
};
