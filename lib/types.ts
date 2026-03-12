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

export type Submission = {
  id: string;
  createdAt: string;
  messages: Message[];
  quote: string;
  categories: Category[];
};

export type QuoteRecord = {
  id: string;
  createdAt: string;
  quote: string;
  categories: Category[];
};
