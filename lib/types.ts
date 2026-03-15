export type Message = {
  role: "user" | "assistant";
  content: string;
};

export type Category =
  | "fear"
  | "hope"
  | "grief"
  | "excitement"
  | "anger"
  | "uncertainty"
  | "displacement"
  | "wonder"
  | "other";

export type EventTag =
  | "work_affected"
  | "health_affected"
  | "relationships_affected"
  | "creative_affected"
  | "education_affected"
  | "financial_affected";

export type Beat = "opening" | "future" | "personal" | "closing" | "other";

export type ConversationItem = {
  PK: string;
  SK: string;
  id: string;
  createdAt: string;
  quote: string;
  beat: Beat;
  poignancyScore: number;
  voteCount: number;
  categories: Category[];
  eventTags: EventTag[];
  regionSubdivision?: string;
  regionCountry?: string;
  regionContinent?: string;
};

export type ConversationRecord = {
  id: string;
  createdAt: string;
  messages: Message[];
  extractedData: ExtractedData;
};

export type ExtractedData = {
  quote: string;
  beat: Beat;
  poignancyScore: number;
  categories: Category[];
  eventTags: EventTag[];
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
  categories: Category[];
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
