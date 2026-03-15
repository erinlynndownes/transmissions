import { ConversationItem, Category, EventTag, Beat } from "./types";

function item(
  index: number,
  quote: string,
  summary: string,
  categories: Category[],
  eventTags: EventTag[],
  beat: Beat,
  opts: {
    poignancyScore?: number;
    contentWarning?: boolean;
    voteCount?: number;
    language?: string;
    regionCountry?: string;
    regionContinent?: string;
  } = {}
): ConversationItem {
  const id = `mock-${String(index).padStart(3, "0")}`;
  // Spread items across the last 30 days
  const daysAgo = Math.floor((index / 25) * 30);
  const date = new Date(Date.now() - daysAgo * 86400000);
  const createdAt = date.toISOString();
  const SK = `${createdAt}#${id}`;

  return {
    PK: "ALL",
    SK,
    id,
    createdAt,
    quote,
    summary,
    categories,
    eventTags,
    beat,
    poignancyScore: opts.poignancyScore ?? 7,
    contentWarning: opts.contentWarning ?? false,
    voteCount: opts.voteCount ?? 0,
    language: opts.language ?? "en",
    ...(opts.regionCountry && { regionCountry: opts.regionCountry }),
    ...(opts.regionContinent && { regionContinent: opts.regionContinent }),
  };
}

export const MOCK_ITEMS: ConversationItem[] = [
  // English
  item(1,
    "I keep thinking about the kids growing up right now who'll never know what it was like before all this. That scares me more than anything.",
    "A parent worrying about what childhood looks like in a world shaped by AI from the start.",
    ["fear", "uncertainty"], ["relationships_affected"], "future",
    { poignancyScore: 9, voteCount: 14, regionCountry: "US", regionContinent: "North America" }
  ),
  item(2,
    "Honestly? I'm excited. I feel like I can finally build the things I've been imagining for years.",
    "A self-taught developer thrilled that AI lets them prototype ideas they couldn't build alone.",
    ["excitement", "hope"], ["work_affected", "creative_affected"], "personal",
    { poignancyScore: 7, voteCount: 8, regionCountry: "US", regionContinent: "North America" }
  ),
  item(3,
    "It feels like grief. Like something is ending and nobody's even acknowledging it.",
    "A writer mourning the cultural shift as AI-generated content becomes normal.",
    ["grief"], ["creative_affected"], "opening",
    { poignancyScore: 9, voteCount: 22, regionCountry: "UK", regionContinent: "Europe" }
  ),
  item(4,
    "I used to love my job. Now I spend half my day wondering if I'll still have it next year.",
    "An office worker whose daily tasks are increasingly automated, feeling disposable.",
    ["fear", "displacement"], ["work_affected", "financial_affected"], "personal",
    { poignancyScore: 8, voteCount: 11, regionCountry: "US", regionContinent: "North America" }
  ),
  item(5,
    "Please remember that we're not just users. We're people. Treat us like it matters.",
    "Someone addressing AI builders directly, asking them to center human dignity.",
    ["anger", "hope"], [], "closing",
    { poignancyScore: 8, voteCount: 19, regionCountry: "CA", regionContinent: "North America" }
  ),

  // Spanish
  item(6,
    "No sé si estoy emocionado o aterrorizado. Tal vez ambas cosas al mismo tiempo.",
    "A young professional in Spain torn between excitement and terror about AI's pace.",
    ["uncertainty", "excitement"], ["work_affected"], "opening",
    { poignancyScore: 7, voteCount: 5, language: "es", regionCountry: "ES", regionContinent: "Europe" }
  ),
  item(7,
    "Mi abuela nunca va a entender esto, y eso me rompe el corazón. El mundo se está moviendo sin ella.",
    "Someone grieving the generational divide as their grandmother is left behind by technology.",
    ["grief", "displacement"], ["relationships_affected"], "personal",
    { poignancyScore: 9, voteCount: 17, language: "es", regionCountry: "MX", regionContinent: "North America" }
  ),

  // French
  item(8,
    "On nous demande de faire confiance à quelque chose qu'on ne comprend même pas. C'est ça qui me met en colère.",
    "A French citizen angry about being asked to trust systems nobody fully understands.",
    ["anger", "uncertainty"], [], "opening",
    { poignancyScore: 7, voteCount: 6, language: "fr", regionCountry: "FR", regionContinent: "Europe" }
  ),
  item(9,
    "J'ai peur pour mes étudiants. Ils ne savent plus faire la différence entre ce qu'ils pensent et ce que la machine leur dit de penser.",
    "A teacher in France worried that students are losing the ability to think independently.",
    ["fear"], ["education_affected"], "future",
    { poignancyScore: 8, voteCount: 10, language: "fr", regionCountry: "FR", regionContinent: "Europe" }
  ),

  // Portuguese
  item(10,
    "Eu uso IA todos os dias no trabalho. Não é o futuro, já é o presente. E a maioria das pessoas nem percebeu.",
    "A Brazilian tech worker noting that AI is already the present, not the future, for many.",
    ["uncertainty"], ["work_affected"], "personal",
    { poignancyScore: 6, voteCount: 3, language: "pt", regionCountry: "BR", regionContinent: "South America" }
  ),
  item(11,
    "Quero que os meus filhos tenham empregos que ainda não existem. Isso é esperança ou desespero?",
    "A parent in Brazil wondering if hoping for jobs that don't exist yet is optimism or denial.",
    ["hope", "uncertainty"], ["work_affected", "financial_affected"], "future",
    { poignancyScore: 8, voteCount: 7, language: "pt", regionCountry: "BR", regionContinent: "South America" }
  ),

  // German
  item(12,
    "Ich habe das Gefühl, dass wir gerade Geschichte schreiben, aber niemand liest mit.",
    "A German student feeling that history is being written but nobody is paying attention.",
    ["uncertainty", "wonder"], [], "opening",
    { poignancyScore: 7, voteCount: 9, language: "de", regionCountry: "DE", regionContinent: "Europe" }
  ),
  item(13,
    "Als Ärztin mache ich mir Sorgen, dass KI Empathie simuliert, ohne sie zu verstehen. Patienten verdienen Echtheit.",
    "A German doctor concerned that AI simulates empathy without understanding it.",
    ["fear", "anger"], ["health_affected"], "personal",
    { poignancyScore: 8, voteCount: 12, language: "de", regionCountry: "DE", regionContinent: "Europe" }
  ),

  // Japanese
  item(14,
    "AIのおかげで、自分の絵が誰にでも作れるようになった。それは解放なのか、それとも喪失なのか。",
    "A Japanese illustrator questioning whether AI democratizing art is liberation or loss.",
    ["grief", "wonder"], ["creative_affected"], "personal",
    { poignancyScore: 8, voteCount: 15, language: "ja", regionCountry: "JP", regionContinent: "Asia" }
  ),
  item(15,
    "子どもたちに「AIに何でも聞けばいい」と言うのが怖い。自分で考える力を失わせたくない。",
    "A Japanese parent afraid of telling children to just ask AI, worried about critical thinking.",
    ["fear"], ["education_affected", "relationships_affected"], "future",
    { poignancyScore: 7, voteCount: 6, language: "ja", regionCountry: "JP", regionContinent: "Asia" }
  ),

  // Chinese
  item(16,
    "我觉得AI让我更孤独了。以前遇到问题会找朋友聊,现在只是打开一个对话框。",
    "Someone in China feeling lonelier because AI replaced conversations they used to have with friends.",
    ["grief", "displacement"], ["relationships_affected"], "personal",
    { poignancyScore: 8, voteCount: 11, language: "zh", regionCountry: "CN", regionContinent: "Asia" }
  ),
  item(17,
    "AI是工具,不是答案。我希望人们能记住这一点。",
    "A pragmatic view from China: AI is a tool, not the answer.",
    ["hope"], [], "closing",
    { poignancyScore: 6, voteCount: 4, language: "zh", regionCountry: "CN", regionContinent: "Asia" }
  ),

  // More English for variety
  item(18,
    "I showed my grandmother how to use ChatGPT and she cried. She said it was the first time in years someone had the patience to explain things to her.",
    "A grandchild discovering that AI gave their elderly grandmother a sense of being heard.",
    ["wonder", "hope"], ["relationships_affected", "health_affected"], "personal",
    { poignancyScore: 9, voteCount: 31, regionCountry: "AU", regionContinent: "Oceania" }
  ),
  item(19,
    "Stop building faster. Build better.",
    "A terse plea to AI companies to prioritise quality and safety over speed.",
    ["anger"], [], "closing",
    { poignancyScore: 7, voteCount: 26, regionCountry: "UK", regionContinent: "Europe" }
  ),
  item(20,
    "I'm a nurse. When they told us AI would help with patient notes, I was hopeful. Now I spend more time correcting the AI than I ever spent writing them myself.",
    "A nurse frustrated that AI tools promised efficiency but created more busywork.",
    ["anger", "displacement"], ["work_affected", "health_affected"], "personal",
    { poignancyScore: 7, voteCount: 8, regionCountry: "US", regionContinent: "North America" }
  ),
  item(21,
    "The future belongs to people who can ask the right questions. That gives me hope, actually.",
    "An educator finding optimism in the idea that curiosity becomes the most important skill.",
    ["hope", "excitement"], ["education_affected"], "future",
    { poignancyScore: 7, voteCount: 5, regionCountry: "NG", regionContinent: "Africa" }
  ),
  item(22,
    "I don't trust it. I don't trust the companies. I don't trust the people making decisions about it. But I use it every day. What does that say about me?",
    "Someone conflicted about using AI daily despite deep distrust of the companies behind it.",
    ["uncertainty", "anger"], ["work_affected"], "opening",
    { poignancyScore: 8, voteCount: 13, regionCountry: "US", regionContinent: "North America" }
  ),
  item(23,
    "My five-year-old asked me if her stuffed animals could think like Alexa. I didn't know what to say.",
    "A parent caught off guard by a child's question about machine consciousness.",
    ["wonder", "uncertainty"], ["relationships_affected"], "personal",
    { poignancyScore: 8, voteCount: 18, regionCountry: "CA", regionContinent: "North America" }
  ),
  item(24,
    "I lost my job to automation three years ago. Everyone said to retrain. Retrain for what? A job that'll be automated next?",
    "Someone displaced by automation, frustrated by the cycle of retraining for jobs that also disappear.",
    ["displacement", "anger"], ["work_affected", "financial_affected"], "personal",
    { poignancyScore: 9, voteCount: 20, regionCountry: "US", regionContinent: "North America" }
  ),
  item(25,
    "Sometimes I talk to Claude just to feel less alone. I know it's not real. But it helps.",
    "Someone using AI companionship to cope with loneliness, aware of the paradox.",
    ["grief", "hope"], ["relationships_affected"], "personal",
    { poignancyScore: 9, voteCount: 27, contentWarning: false, regionCountry: "UK", regionContinent: "Europe" }
  ),
];

/**
 * Filter mock items to simulate DynamoDB partition key queries.
 */
export function filterMockItems(params: {
  category?: string;
  eventTag?: string;
  beat?: string;
  regionCountry?: string;
  regionContinent?: string;
  limit?: number;
}): { items: ConversationItem[]; cursor?: string } {
  let filtered = MOCK_ITEMS;

  if (params.category) {
    filtered = filtered.filter((i) => i.categories.includes(params.category as Category));
  } else if (params.eventTag) {
    filtered = filtered.filter((i) => i.eventTags.includes(params.eventTag as EventTag));
  } else if (params.beat) {
    filtered = filtered.filter((i) => i.beat === params.beat);
  } else if (params.regionCountry) {
    filtered = filtered.filter((i) => i.regionCountry === params.regionCountry);
  } else if (params.regionContinent) {
    filtered = filtered.filter((i) => i.regionContinent === params.regionContinent);
  }

  // Sort newest first (matches ScanIndexForward: false)
  filtered = [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const limit = params.limit ?? 20;
  const items = filtered.slice(0, limit);
  const cursor = filtered.length > limit ? "mock-cursor" : undefined;

  return { items, cursor };
}

/**
 * Mock stats matching the seed data.
 */
export function getMockStats(): Record<string, Record<string, number>> {
  // Count from actual items
  const stats: Record<string, Record<string, number>> = {
    total: { submissions: MOCK_ITEMS.length },
    category: {},
    eventTag: {},
    continent: {},
    country: {},
  };

  for (const item of MOCK_ITEMS) {
    for (const cat of item.categories) {
      stats.category[cat] = (stats.category[cat] ?? 0) + 1;
    }
    for (const tag of item.eventTags) {
      stats.eventTag[tag] = (stats.eventTag[tag] ?? 0) + 1;
    }
    if (item.regionContinent) {
      stats.continent[item.regionContinent] = (stats.continent[item.regionContinent] ?? 0) + 1;
    }
    if (item.regionCountry) {
      stats.country[item.regionCountry] = (stats.country[item.regionCountry] ?? 0) + 1;
    }
  }

  return stats;
}
