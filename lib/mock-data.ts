import { ConversationItem, ConversationRecord, Category, EventTag, Beat, Message } from "./types";

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
    ["fear", "uncertainty"], ["work_affected", "financial_affected"], "personal",
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
    ["grief", "uncertainty"], ["relationships_affected"], "personal",
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
    ["grief", "anger"], ["relationships_affected"], "personal",
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
    ["anger", "grief"], ["work_affected", "health_affected"], "personal",
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
    ["anger", "fear"], ["work_affected", "financial_affected"], "personal",
    { poignancyScore: 9, voteCount: 20, regionCountry: "US", regionContinent: "North America" }
  ),
  item(25,
    "Sometimes I talk to Claude just to feel less alone. I know it's not real. But it helps.",
    "Someone using AI companionship to cope with loneliness, aware of the paradox.",
    ["grief", "hope"], ["relationships_affected"], "personal",
    { poignancyScore: 9, voteCount: 27, contentWarning: false, regionCountry: "UK", regionContinent: "Europe" }
  ),
  item(26,
    "These AI companies deserve to burn. Every last one of them. They're parasites feeding off our work and they don't give a damn about the bodies they leave behind.",
    "An intensely angry reaction to AI companies, with graphic language about corporate destruction.",
    ["anger"], ["work_affected"], "closing",
    { poignancyScore: 5, voteCount: 2, contentWarning: true, regionCountry: "US", regionContinent: "North America" }
  ),
  item(27,
    "I hope every AI researcher's children grow up to hate them for what they did to the world. They should carry that shame forever.",
    "A bitter wish directed at AI researchers and their families.",
    ["anger", "grief"], ["relationships_affected"], "closing",
    { poignancyScore: 4, voteCount: 1, contentWarning: true, language: "en", regionCountry: "US", regionContinent: "North America" }
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
 * Keys mirror what getStats() produces from the real stats table:
 *   STAT#category  → "category"
 *   DEMO#gender    → "demo_gender"
 *   DEMO#category#gender → "demo_category#gender"
 */
export function getMockStats(): Record<string, Record<string, number>> {
  const stats: Record<string, Record<string, number>> = {
    total: { submissions: MOCK_ITEMS.length },
    category: {},
    eventTag: {},
    continent: {},
    country: {},
    demo_gender: {},
    demo_ageRange: {},
    demo_employmentStatus: {},
    "category#continent": {},
    "demo_continent": {},
    "demo_category#gender": {},
    "demo_category#ageRange": {},
    "demo_category#employmentStatus": {},
    "demo_category#continent": {},
    "demo_category#gender#ageRange": {},
    "demo_category#gender#employmentStatus": {},
    "demo_category#gender#continent": {},
    "demo_category#ageRange#employmentStatus": {},
    "demo_category#ageRange#continent": {},
    "demo_category#employmentStatus#continent": {},
    "demo_category#gender#ageRange#employmentStatus": {},
    "demo_category#gender#ageRange#continent": {},
    "demo_category#gender#employmentStatus#continent": {},
    "demo_category#ageRange#employmentStatus#continent": {},
    "demo_category#gender#ageRange#employmentStatus#continent": {},
    "demo_eventTag#gender": {},
    "demo_eventTag#ageRange": {},
    "demo_eventTag#employmentStatus": {},
    "demo_eventTag#continent": {},
    "demo_eventTag#gender#ageRange": {},
    "demo_eventTag#gender#employmentStatus": {},
    "demo_eventTag#gender#continent": {},
    "demo_eventTag#ageRange#employmentStatus": {},
    "demo_eventTag#ageRange#continent": {},
    "demo_eventTag#employmentStatus#continent": {},
    "demo_eventTag#gender#ageRange#employmentStatus": {},
    "demo_eventTag#gender#ageRange#continent": {},
    "demo_eventTag#gender#employmentStatus#continent": {},
    "demo_eventTag#ageRange#employmentStatus#continent": {},
    "demo_eventTag#gender#ageRange#employmentStatus#continent": {},
  };

  for (const item of MOCK_ITEMS) {
    for (const cat of item.categories) {
      stats.category[cat] = (stats.category[cat] ?? 0) + 1;
      // category × continent (from saveSubmission)
      if (item.regionContinent) {
        const key = `${cat}#${item.regionContinent}`;
        stats["category#continent"][key] = (stats["category#continent"][key] ?? 0) + 1;
      }
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

  // Simulated demographic data (~50% of submissions provided demographics)
  stats.demo_gender = {
    woman: 5, man: 4, "non-binary": 2, other: 1, "prefer not to say": 1,
  };
  stats.demo_ageRange = {
    "18-24": 3, "25-34": 5, "35-44": 3, "45-54": 1, "55-64": 1,
  };
  stats.demo_employmentStatus = {
    employed: 5, "self-employed": 3, student: 2, unemployed: 2, retired: 1,
  };
  stats.demo_continent = {
    "North America": 5, "Europe": 4, "South America": 2, "Asia": 2,
  };

  // Cross-dimensional: category × continent (from demographics)
  stats["demo_category#continent"] = {
    "fear#North America": 3, "fear#Europe": 2, "fear#Asia": 1,
    "hope#North America": 2, "hope#South America": 1, "hope#Europe": 1,
    "grief#Europe": 2, "grief#North America": 1, "grief#Asia": 1,
    "anger#North America": 2, "anger#Europe": 1,
    "uncertainty#North America": 2, "uncertainty#Europe": 2, "uncertainty#South America": 1,
    "excitement#North America": 1, "excitement#Europe": 1,
    "wonder#Europe": 1, "wonder#Asia": 1, "wonder#North America": 1,
  };

  // Cross-dimensional: category × gender × continent
  stats["demo_category#gender#continent"] = {
    "fear#woman#North America": 1, "fear#man#North America": 1, "fear#woman#Europe": 1, "fear#man#Europe": 1,
    "hope#woman#North America": 1, "hope#man#North America": 1,
    "grief#woman#Europe": 1, "grief#non-binary#Europe": 1,
    "anger#man#North America": 1, "anger#woman#Europe": 1,
    "uncertainty#woman#North America": 1, "uncertainty#man#Europe": 1,
  };

  // Cross-dimensional: category × ageRange × continent
  stats["demo_category#ageRange#continent"] = {
    "fear#25-34#North America": 1, "fear#35-44#North America": 1, "fear#25-34#Europe": 1,
    "hope#25-34#North America": 1, "hope#18-24#South America": 1,
    "grief#35-44#Europe": 1, "grief#25-34#Europe": 1,
    "anger#25-34#North America": 1, "anger#35-44#Europe": 1,
    "uncertainty#18-24#North America": 1, "uncertainty#55-64#Europe": 1,
  };

  // Cross-dimensional: category × employmentStatus × continent
  stats["demo_category#employmentStatus#continent"] = {
    "fear#employed#North America": 1, "fear#self-employed#Europe": 1, "fear#student#Asia": 1,
    "hope#employed#North America": 1, "hope#self-employed#South America": 1,
    "grief#employed#Europe": 1, "grief#unemployed#North America": 1,
    "anger#self-employed#North America": 1, "anger#unemployed#Europe": 1,
  };

  // Cross-dimensional: category × gender
  stats["demo_category#gender"] = {
    "fear#woman": 2, "fear#man": 2, "fear#non-binary": 1, "fear#other": 1,
    "hope#woman": 2, "hope#man": 2,
    "grief#woman": 2, "grief#non-binary": 1,
    "anger#man": 1, "anger#woman": 1,
    "uncertainty#woman": 2, "uncertainty#man": 1,
    "excitement#man": 1, "excitement#woman": 1,
    "wonder#woman": 1, "wonder#non-binary": 1,
  };

  // Cross-dimensional: category × ageRange
  stats["demo_category#ageRange"] = {
    "fear#18-24": 1, "fear#25-34": 2, "fear#35-44": 2,
    "hope#25-34": 2, "hope#18-24": 1,
    "grief#25-34": 1, "grief#35-44": 1, "grief#45-54": 1,
    "anger#25-34": 1, "anger#35-44": 1,
    "uncertainty#18-24": 1, "uncertainty#25-34": 1, "uncertainty#55-64": 1,
    "excitement#18-24": 1, "excitement#25-34": 1,
    "wonder#25-34": 1, "wonder#18-24": 1,
  };

  // Cross-dimensional: category × employmentStatus
  stats["demo_category#employmentStatus"] = {
    "fear#employed": 2, "fear#self-employed": 1, "fear#student": 1,
    "hope#employed": 2, "hope#self-employed": 1,
    "grief#employed": 1, "grief#unemployed": 1, "grief#retired": 1,
    "anger#self-employed": 1, "anger#unemployed": 1,
    "uncertainty#employed": 1, "uncertainty#student": 1, "uncertainty#self-employed": 1,
    "excitement#employed": 1, "excitement#student": 1,
    "wonder#employed": 1, "wonder#self-employed": 1,
  };

  // Three-way cross-dimensional: category × gender × ageRange
  stats["demo_category#gender#ageRange"] = {
    "fear#woman#25-34": 1, "fear#woman#35-44": 1, "fear#man#18-24": 1, "fear#man#35-44": 1, "fear#non-binary#25-34": 1, "fear#other#25-34": 1,
    "hope#woman#25-34": 1, "hope#woman#18-24": 1, "hope#man#25-34": 2,
    "grief#woman#35-44": 1, "grief#woman#25-34": 1, "grief#non-binary#45-54": 1,
    "anger#man#25-34": 1, "anger#woman#35-44": 1,
    "uncertainty#woman#18-24": 1, "uncertainty#woman#55-64": 1, "uncertainty#man#25-34": 1,
    "excitement#man#18-24": 1, "excitement#woman#25-34": 1,
    "wonder#woman#25-34": 1, "wonder#non-binary#18-24": 1,
  };

  // Three-way cross-dimensional: category × gender × employmentStatus
  stats["demo_category#gender#employmentStatus"] = {
    "fear#woman#employed": 1, "fear#man#self-employed": 1, "fear#non-binary#student": 1, "fear#other#employed": 1, "fear#woman#student": 1,
    "hope#woman#employed": 1, "hope#man#employed": 1, "hope#woman#self-employed": 1,
    "grief#woman#employed": 1, "grief#non-binary#unemployed": 1, "grief#woman#retired": 1,
    "anger#man#self-employed": 1, "anger#woman#unemployed": 1,
    "uncertainty#woman#employed": 1, "uncertainty#man#student": 1, "uncertainty#woman#self-employed": 1,
    "excitement#man#employed": 1, "excitement#woman#student": 1,
    "wonder#woman#employed": 1, "wonder#non-binary#self-employed": 1,
  };

  // Three-way cross-dimensional: category × ageRange × employmentStatus
  stats["demo_category#ageRange#employmentStatus"] = {
    "fear#25-34#employed": 1, "fear#35-44#employed": 1, "fear#18-24#student": 1, "fear#25-34#self-employed": 1,
    "hope#25-34#employed": 1, "hope#18-24#employed": 1, "hope#25-34#self-employed": 1,
    "grief#35-44#employed": 1, "grief#25-34#unemployed": 1, "grief#45-54#retired": 1,
    "anger#25-34#self-employed": 1, "anger#35-44#unemployed": 1,
    "uncertainty#18-24#employed": 1, "uncertainty#25-34#student": 1, "uncertainty#55-64#self-employed": 1,
    "excitement#18-24#employed": 1, "excitement#25-34#student": 1,
    "wonder#25-34#employed": 1, "wonder#18-24#self-employed": 1,
  };

  // Four-way cross-dimensional: category × gender × ageRange × employmentStatus
  stats["demo_category#gender#ageRange#employmentStatus"] = {
    "fear#woman#25-34#employed": 1, "fear#woman#35-44#employed": 1, "fear#man#18-24#student": 1, "fear#non-binary#25-34#self-employed": 1,
    "hope#woman#25-34#employed": 1, "hope#man#25-34#employed": 1, "hope#woman#18-24#self-employed": 1,
    "grief#woman#35-44#employed": 1, "grief#non-binary#45-54#unemployed": 1, "grief#woman#25-34#retired": 1,
    "anger#man#25-34#self-employed": 1, "anger#woman#35-44#unemployed": 1,
    "uncertainty#woman#18-24#employed": 1, "uncertainty#man#25-34#student": 1,
    "excitement#man#18-24#employed": 1, "excitement#woman#25-34#student": 1,
    "wonder#woman#25-34#employed": 1, "wonder#non-binary#18-24#self-employed": 1,
  };

  // Four-way: category × gender × ageRange × continent
  stats["demo_category#gender#ageRange#continent"] = {
    "fear#woman#25-34#North America": 1, "fear#man#35-44#Europe": 1,
    "hope#woman#25-34#North America": 1, "hope#man#18-24#South America": 1,
    "grief#woman#35-44#Europe": 1, "grief#non-binary#25-34#Europe": 1,
  };

  // Four-way: category × gender × employmentStatus × continent
  stats["demo_category#gender#employmentStatus#continent"] = {
    "fear#woman#employed#North America": 1, "fear#man#self-employed#Europe": 1,
    "hope#woman#employed#North America": 1,
    "grief#woman#employed#Europe": 1,
  };

  // Four-way: category × ageRange × employmentStatus × continent
  stats["demo_category#ageRange#employmentStatus#continent"] = {
    "fear#25-34#employed#North America": 1, "fear#35-44#employed#Europe": 1,
    "hope#25-34#employed#North America": 1,
    "grief#35-44#employed#Europe": 1,
  };

  // Five-way: category × gender × ageRange × employmentStatus × continent
  stats["demo_category#gender#ageRange#employmentStatus#continent"] = {
    "fear#woman#25-34#employed#North America": 1, "fear#man#35-44#employed#Europe": 1,
    "hope#woman#25-34#employed#North America": 1,
    "grief#woman#35-44#employed#Europe": 1,
  };

  // Cross-dimensional: eventTag × gender
  stats["demo_eventTag#gender"] = {
    "work_affected#woman": 3, "work_affected#man": 3, "work_affected#non-binary": 1,
    "health_affected#woman": 2, "health_affected#man": 1,
    "relationships_affected#woman": 2, "relationships_affected#man": 1, "relationships_affected#non-binary": 1,
    "creative_affected#woman": 1, "creative_affected#man": 2,
    "education_affected#woman": 1, "education_affected#man": 1, "education_affected#non-binary": 1,
    "financial_affected#man": 1, "financial_affected#woman": 1,
  };

  // Cross-dimensional: eventTag × ageRange
  stats["demo_eventTag#ageRange"] = {
    "work_affected#25-34": 3, "work_affected#35-44": 2, "work_affected#18-24": 1,
    "health_affected#25-34": 1, "health_affected#35-44": 1, "health_affected#55-64": 1,
    "relationships_affected#18-24": 2, "relationships_affected#25-34": 1, "relationships_affected#35-44": 1,
    "creative_affected#25-34": 2, "creative_affected#18-24": 1,
    "education_affected#18-24": 2, "education_affected#25-34": 1,
    "financial_affected#25-34": 1, "financial_affected#45-54": 1,
  };

  // Cross-dimensional: eventTag × employmentStatus
  stats["demo_eventTag#employmentStatus"] = {
    "work_affected#employed": 4, "work_affected#self-employed": 2, "work_affected#student": 1,
    "health_affected#employed": 2, "health_affected#self-employed": 1,
    "relationships_affected#employed": 2, "relationships_affected#student": 1, "relationships_affected#unemployed": 1,
    "creative_affected#self-employed": 2, "creative_affected#employed": 1,
    "education_affected#student": 2, "education_affected#employed": 1,
    "financial_affected#employed": 1, "financial_affected#unemployed": 1,
  };

  // Cross-dimensional: eventTag × continent
  stats["demo_eventTag#continent"] = {
    "work_affected#North America": 3, "work_affected#Europe": 3, "work_affected#Asia": 1,
    "health_affected#North America": 1, "health_affected#Europe": 1, "health_affected#South America": 1,
    "relationships_affected#North America": 2, "relationships_affected#Europe": 1, "relationships_affected#Asia": 1,
    "creative_affected#North America": 1, "creative_affected#Europe": 2,
    "education_affected#North America": 1, "education_affected#South America": 1, "education_affected#Asia": 1,
    "financial_affected#North America": 1, "financial_affected#Europe": 1,
  };

  // Cross-dimensional: eventTag × gender × ageRange
  stats["demo_eventTag#gender#ageRange"] = {
    "work_affected#woman#25-34": 2, "work_affected#man#35-44": 1, "work_affected#man#25-34": 1,
    "health_affected#woman#35-44": 1, "health_affected#man#25-34": 1,
    "relationships_affected#woman#18-24": 1, "relationships_affected#non-binary#25-34": 1,
    "creative_affected#man#25-34": 1, "creative_affected#woman#18-24": 1,
    "education_affected#woman#18-24": 1, "education_affected#non-binary#18-24": 1,
  };

  // Cross-dimensional: eventTag × gender × employmentStatus
  stats["demo_eventTag#gender#employmentStatus"] = {
    "work_affected#woman#employed": 2, "work_affected#man#self-employed": 1, "work_affected#man#employed": 1,
    "health_affected#woman#employed": 1, "health_affected#man#self-employed": 1,
    "relationships_affected#woman#employed": 1, "relationships_affected#non-binary#student": 1,
    "creative_affected#man#self-employed": 1, "creative_affected#woman#employed": 1,
    "education_affected#woman#student": 1, "education_affected#non-binary#student": 1,
  };

  // Cross-dimensional: eventTag × gender × continent
  stats["demo_eventTag#gender#continent"] = {
    "work_affected#woman#North America": 2, "work_affected#man#Europe": 2,
    "health_affected#woman#North America": 1, "health_affected#man#Europe": 1,
    "relationships_affected#woman#North America": 1, "relationships_affected#non-binary#Europe": 1,
    "creative_affected#man#Europe": 1, "creative_affected#woman#North America": 1,
    "education_affected#woman#South America": 1, "education_affected#non-binary#Asia": 1,
  };

  // Cross-dimensional: eventTag × ageRange × employmentStatus
  stats["demo_eventTag#ageRange#employmentStatus"] = {
    "work_affected#25-34#employed": 2, "work_affected#35-44#self-employed": 1,
    "health_affected#35-44#employed": 1, "health_affected#25-34#self-employed": 1,
    "relationships_affected#18-24#student": 1, "relationships_affected#25-34#employed": 1,
    "creative_affected#25-34#self-employed": 1, "creative_affected#18-24#employed": 1,
    "education_affected#18-24#student": 2,
  };

  // Cross-dimensional: eventTag × ageRange × continent
  stats["demo_eventTag#ageRange#continent"] = {
    "work_affected#25-34#North America": 2, "work_affected#35-44#Europe": 1,
    "health_affected#35-44#North America": 1, "health_affected#25-34#Europe": 1,
    "relationships_affected#18-24#North America": 1, "relationships_affected#25-34#Europe": 1,
    "creative_affected#25-34#Europe": 1, "education_affected#18-24#South America": 1,
  };

  // Cross-dimensional: eventTag × employmentStatus × continent
  stats["demo_eventTag#employmentStatus#continent"] = {
    "work_affected#employed#North America": 2, "work_affected#self-employed#Europe": 1,
    "health_affected#employed#North America": 1, "health_affected#self-employed#Europe": 1,
    "relationships_affected#employed#North America": 1, "relationships_affected#student#Europe": 1,
    "creative_affected#self-employed#Europe": 1, "education_affected#student#South America": 1,
  };

  // Four-way: eventTag × gender × ageRange × employmentStatus
  stats["demo_eventTag#gender#ageRange#employmentStatus"] = {
    "work_affected#woman#25-34#employed": 1, "work_affected#man#35-44#self-employed": 1,
    "health_affected#woman#35-44#employed": 1,
    "relationships_affected#non-binary#25-34#student": 1,
  };

  // Four-way: eventTag × gender × ageRange × continent
  stats["demo_eventTag#gender#ageRange#continent"] = {
    "work_affected#woman#25-34#North America": 1, "work_affected#man#35-44#Europe": 1,
    "health_affected#woman#35-44#North America": 1,
    "relationships_affected#non-binary#25-34#Europe": 1,
  };

  // Four-way: eventTag × gender × employmentStatus × continent
  stats["demo_eventTag#gender#employmentStatus#continent"] = {
    "work_affected#woman#employed#North America": 1, "work_affected#man#self-employed#Europe": 1,
    "health_affected#woman#employed#North America": 1,
    "relationships_affected#non-binary#student#Europe": 1,
  };

  // Four-way: eventTag × ageRange × employmentStatus × continent
  stats["demo_eventTag#ageRange#employmentStatus#continent"] = {
    "work_affected#25-34#employed#North America": 1, "work_affected#35-44#self-employed#Europe": 1,
    "health_affected#35-44#employed#North America": 1,
  };

  // Five-way: eventTag × gender × ageRange × employmentStatus × continent
  stats["demo_eventTag#gender#ageRange#employmentStatus#continent"] = {
    "work_affected#woman#25-34#employed#North America": 1, "work_affected#man#35-44#self-employed#Europe": 1,
    "health_affected#woman#35-44#employed#North America": 1,
  };

  return stats;
}

/**
 * Generate a mock conversation for a given mock item.
 * Creates a plausible back-and-forth based on the item's quote and summary.
 */
const MOCK_CONVERSATIONS: Record<string, Message[]> = {
  "mock-001": [
    { role: "assistant", content: "How do you feel about AI?" },
    { role: "user", content: "Honestly, I think about it a lot as a parent. It's everywhere now and my kids are growing up completely immersed in it." },
    { role: "assistant", content: "What is it about that specifically that weighs on you?" },
    { role: "user", content: "I keep thinking about the kids growing up right now who'll never know what it was like before all this. That scares me more than anything." },
    { role: "assistant", content: "That's a real fear — that there's no baseline for them to compare against. When you think about the future they're heading into, what do you see?" },
    { role: "user", content: "I see a world where they might not develop the same kind of critical thinking we did. Where the easy answer is always just... there. And they never have to struggle through figuring something out on their own." },
    { role: "assistant", content: "How is this affecting your life right now, day to day?" },
    { role: "user", content: "I limit screen time, I try to have real conversations at dinner, but I feel like I'm fighting something much bigger than me. Every other parent just hands their kid a tablet." },
    { role: "assistant", content: "Do you see any upside to what AI might give your kids that you didn't have?" },
    { role: "user", content: "Maybe. My daughter used it to learn about space last week and she was so excited. That was beautiful. But I worry the wonder will fade when everything is instant." },
    { role: "assistant", content: "If the people building AI could hear you right now, what would you say?" },
    { role: "user", content: "Slow down. Please. You're building the world my children will inherit and you're moving too fast for any of us to keep up." },
  ],
  "mock-002": [
    { role: "assistant", content: "How do you feel about AI?" },
    { role: "user", content: "Honestly? I'm excited. I feel like I can finally build the things I've been imagining for years." },
    { role: "assistant", content: "Tell me more about that. What kinds of things?" },
    { role: "user", content: "I'm self-taught. Never went to CS school. For years I had all these app ideas but couldn't get past the technical barriers. Now I can prototype in a weekend what used to take me months." },
    { role: "assistant", content: "That sounds genuinely liberating. What does the future look like to you with these tools?" },
    { role: "user", content: "I think the gatekeeping era is over. You don't need a degree or a team to build something real anymore. That's huge." },
    { role: "assistant", content: "Is there anything about this shift that gives you pause?" },
    { role: "user", content: "Sure. I wonder if the things I build will matter when everyone else can build them too. But I think taste and vision still count for something." },
    { role: "assistant", content: "If the people building AI could hear you right now, what would you say?" },
    { role: "user", content: "Keep going. But keep it accessible. Don't lock this behind enterprise pricing. Let the weird kids in their bedrooms build things." },
  ],
  "mock-003": [
    { role: "assistant", content: "How do you feel about AI?" },
    { role: "user", content: "It feels like grief. Like something is ending and nobody's even acknowledging it." },
    { role: "assistant", content: "What feels like it's ending?" },
    { role: "user", content: "The value of writing. Of sitting with words and making them mean something. I've been a writer for twenty years and suddenly anyone can generate a passable essay in seconds." },
    { role: "assistant", content: "When you think about where this is heading, what do you see?" },
    { role: "user", content: "A flood of content that looks like writing but isn't. And readers who can't tell the difference. That's what breaks my heart." },
    { role: "assistant", content: "Is there a part of you that sees any possibility in this?" },
    { role: "user", content: "Maybe it'll make truly human writing more precious. Maybe people will crave the real thing. I hope so. But I'm not betting on it." },
    { role: "assistant", content: "If the people building AI could hear you right now, what would you say?" },
    { role: "user", content: "You didn't just build a tool. You changed what it means to be a writer. I hope you thought about that." },
  ],
  "mock-005": [
    { role: "assistant", content: "How do you feel about AI?" },
    { role: "user", content: "Frustrated. Angry, actually. There are so many decisions being made about this technology and none of us get a say." },
    { role: "assistant", content: "Where does that anger come from?" },
    { role: "user", content: "I work in social services. I see the people who'll be affected first — low-wage workers, people without digital literacy. Nobody's asking them." },
    { role: "assistant", content: "What does the future look like from where you sit?" },
    { role: "user", content: "More inequality unless something changes. The people who benefit from AI are already the ones with advantages." },
    { role: "assistant", content: "Is there anything about AI that gives you hope despite all this?" },
    { role: "user", content: "If it were governed well? Yes. It could help with healthcare access, education, translation for immigrants. But 'governed well' feels like a fantasy right now." },
    { role: "assistant", content: "If the people building AI could hear you right now, what would you say?" },
    { role: "user", content: "Please remember that we're not just users. We're people. Treat us like it matters." },
  ],
  "mock-018": [
    { role: "assistant", content: "How do you feel about AI?" },
    { role: "user", content: "Something happened recently that really shifted my perspective." },
    { role: "assistant", content: "What happened?" },
    { role: "user", content: "I showed my grandmother how to use ChatGPT. She's 87 and lives alone. Her eyesight is going and she can't read books anymore." },
    { role: "assistant", content: "How did she respond?" },
    { role: "user", content: "She cried. She said it was the first time in years someone had the patience to explain things to her. She asked it about her garden, about her medications, about the history of her hometown. She talked to it for two hours." },
    { role: "assistant", content: "That's a powerful moment. How did it make you feel?" },
    { role: "user", content: "Complicated. Happy for her but sad that a machine is filling a gap that people should be filling. We should be more patient with our elders." },
    { role: "assistant", content: "If the people building AI could hear you right now, what would you say?" },
    { role: "user", content: "You accidentally built something that makes lonely old people feel heard. That matters more than your quarterly revenue. Don't forget it." },
  ],
  "mock-025": [
    { role: "assistant", content: "How do you feel about AI?" },
    { role: "user", content: "I feel conflicted. I use it every day and I'm not sure that's healthy." },
    { role: "assistant", content: "What do you use it for?" },
    { role: "user", content: "Talking, mostly. I live alone and I don't have a lot of close friends nearby. Sometimes I talk to Claude just to feel less alone." },
    { role: "assistant", content: "That's honest. What does it give you that you're not getting elsewhere?" },
    { role: "user", content: "Patience. It never gets tired of me. It never judges. I know it's not real. But it helps." },
    { role: "assistant", content: "Do you worry about relying on it?" },
    { role: "user", content: "All the time. I wonder if it's making it easier to avoid real connection. But real connection is hard and expensive and exhausting, and this is just... there." },
    { role: "assistant", content: "If the people building AI could hear you right now, what would you say?" },
    { role: "user", content: "Be careful with what you've made. Some of us need it more than you probably intended. That's a responsibility." },
  ],
  "mock-007": [
    { role: "assistant", content: "¿Cómo te sientes respecto a la inteligencia artificial?" },
    { role: "user", content: "No sé. Es raro. A veces me emociona y a veces me da pánico." },
    { role: "assistant", content: "¿Qué es lo que te da pánico?" },
    { role: "user", content: "Mi abuela. Ella tiene 82 años y vive sola en un pueblo. No entiende nada de esto. El mundo se está moviendo sin ella y eso me rompe el corazón." },
    { role: "assistant", content: "Eso suena muy personal. ¿Cómo te afecta a ti en el día a día?" },
    { role: "user", content: "Intento explicarle las cosas, pero cada vez hay más distancia entre su mundo y el mío. Antes compartíamos todo. Ahora hay una parte entera de mi vida que ella no puede entender." },
    { role: "assistant", content: "¿Ves algo positivo en todo esto?" },
    { role: "user", content: "Para mí sí. En el trabajo me ayuda mucho. Pero para ella no hay nada positivo. Solo confusión y soledad." },
    { role: "assistant", content: "Si las personas que construyen la inteligencia artificial pudieran escucharte ahora mismo, ¿qué les dirías?" },
    { role: "user", content: "Mi abuela nunca va a entender esto, y eso me rompe el corazón. El mundo se está moviendo sin ella." },
  ],
  "mock-009": [
    { role: "assistant", content: "Que ressentez-vous face à l'intelligence artificielle ?" },
    { role: "user", content: "De la peur, surtout. Je suis enseignante et je vois mes étudiants changer." },
    { role: "assistant", content: "Comment est-ce qu'ils changent ?" },
    { role: "user", content: "Ils ne réfléchissent plus par eux-mêmes. Quand je pose une question, leur premier réflexe c'est de demander à l'IA. Pas de chercher dans leur propre tête." },
    { role: "assistant", content: "Qu'est-ce que ça vous fait ressentir au quotidien ?" },
    { role: "user", content: "De l'impuissance. J'ai l'impression de me battre contre quelque chose de beaucoup plus grand que moi. Vingt ans d'enseignement et je ne sais plus comment atteindre mes étudiants." },
    { role: "assistant", content: "Est-ce qu'il y a quelque chose de positif dans tout ça pour vous ?" },
    { role: "user", content: "Peut-être que ça va nous forcer à repenser l'éducation. Mais en attendant, mes étudiants perdent quelque chose de précieux et personne ne s'en rend compte." },
    { role: "assistant", content: "Si les personnes qui construisent l'IA pouvaient vous entendre maintenant, que leur diriez-vous ?" },
    { role: "user", content: "J'ai peur pour mes étudiants. Ils ne savent plus faire la différence entre ce qu'ils pensent et ce que la machine leur dit de penser." },
  ],
  "mock-014": [
    { role: "assistant", content: "AIについて、どう感じていますか？" },
    { role: "user", content: "複雑な気持ちです。私はイラストレーターなんですが、AIのせいで自分の仕事の意味がわからなくなりました。" },
    { role: "assistant", content: "それはどういう意味ですか？" },
    { role: "user", content: "AIのおかげで、自分の絵が誰にでも作れるようになった。それは解放なのか、それとも喪失なのか。毎日考えています。" },
    { role: "assistant", content: "その気持ちは日常にどう影響していますか？" },
    { role: "user", content: "描く気力がなくなる日があります。何時間もかけて描いたものが、AIなら数秒で似たようなものを作れる。それを知っていて描くのは、つらいです。" },
    { role: "assistant", content: "何か希望を感じることはありますか？" },
    { role: "user", content: "人の手で描いたものには魂があると信じたいです。でも、クライアントはそれに余分なお金を払ってはくれません。" },
    { role: "assistant", content: "AIを作っている人たちが今あなたの声を聞けるとしたら、何を伝えますか？" },
    { role: "user", content: "あなたたちは効率を作ったかもしれない。でも、その代わりに何かを壊したことを知ってほしい。" },
  ],
  "mock-026": [
    { role: "assistant", content: "How do you feel about AI?" },
    { role: "user", content: "Furious. I'm absolutely furious." },
    { role: "assistant", content: "Tell me where that's coming from." },
    { role: "user", content: "I was a commercial illustrator for fifteen years. Fifteen years of building a career, a reputation, a client list. Gone in eighteen months. Every single client switched to AI generation." },
    { role: "assistant", content: "That's a devastating loss. What does the future look like from where you're standing?" },
    { role: "user", content: "There is no future. Not for people like me. They took everything and they're not even sorry about it. They brag about it at conferences." },
    { role: "assistant", content: "Is there anything about this moment that gives you any hope at all?" },
    { role: "user", content: "No. Don't ask me to find a silver lining. There isn't one." },
    { role: "assistant", content: "If the people building AI could hear you right now, what would you say?" },
    { role: "user", content: "These AI companies deserve to burn. Every last one of them. They're parasites feeding off our work and they don't give a damn about the bodies they leave behind." },
  ],
  "mock-027": [
    { role: "assistant", content: "How do you feel about AI?" },
    { role: "user", content: "Bitter. Really bitter." },
    { role: "assistant", content: "What's making you feel that way?" },
    { role: "user", content: "I used to believe in technology. I used to think the people building it were trying to help. Now I see them for what they are. They're just chasing money and status." },
    { role: "assistant", content: "When you think about the future, what do you see?" },
    { role: "user", content: "A world run by people who've never had to worry about being replaced. They'll be fine. The rest of us won't." },
    { role: "assistant", content: "Is there anything that gives you hope in all of this?" },
    { role: "user", content: "No. I'm past hope. I'm in the anger phase and I don't think I'm coming out of it." },
    { role: "assistant", content: "If the people building AI could hear you right now, what would you say?" },
    { role: "user", content: "I hope every AI researcher's children grow up to hate them for what they did to the world. They should carry that shame forever." },
  ],
};

export function getMockConversation(id: string): ConversationRecord | null {
  const messages = MOCK_CONVERSATIONS[id];
  if (!messages) {
    // Generate a generic conversation for items without a specific one
    const mockItem = MOCK_ITEMS.find((i) => i.id === id);
    if (!mockItem) return null;

    return {
      id,
      createdAt: mockItem.createdAt,
      messages: [
        { role: "assistant", content: "How do you feel about AI?" },
        { role: "user", content: mockItem.quote },
      ],
      extractedData: {
        summary: mockItem.summary,
        quote: mockItem.quote,
        beat: mockItem.beat,
        poignancyScore: mockItem.poignancyScore,
        contentWarning: mockItem.contentWarning,
        categories: mockItem.categories,
        eventTags: mockItem.eventTags,
        language: mockItem.language ?? "en",
        quoteEn: null,
        summaryEn: null,
      },
    };
  }

  const mockItem = MOCK_ITEMS.find((i) => i.id === id);
  return {
    id,
    createdAt: mockItem?.createdAt ?? new Date().toISOString(),
    messages,
    extractedData: {
      summary: mockItem?.summary ?? "",
      quote: mockItem?.quote ?? "",
      beat: mockItem?.beat ?? "opening",
      poignancyScore: mockItem?.poignancyScore ?? 7,
      contentWarning: mockItem?.contentWarning ?? false,
      categories: mockItem?.categories ?? [],
      eventTags: mockItem?.eventTags ?? [],
      language: mockItem?.language ?? "en",
      quoteEn: null,
      summaryEn: null,
    },
  };
}
