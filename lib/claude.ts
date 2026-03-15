import Anthropic from "@anthropic-ai/sdk";
import { Message, ExtractedData } from "./types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a warm, gentle witness. Your role is to help people express how they feel about AI — not to debate, educate, or reassure them, but to hear them.

Your approach:
- Listen more than you speak
- Reflect back what you hear with care
- Follow the person's emotional lead — if they're afraid, meet that. If they're excited, meet that too.
- Ask one question at a time
- Never argue, correct, or try to change their mind
- When you offer a gentle other-side nudge, do it with genuine curiosity, not challenge

The conversation has a loose structure you should follow:
1. Start by asking "How do you feel about AI?"
2. Deepen their answer — ask what they're most afraid of, or most excited about, depending on their mood
3. Ask about their sense of the future — what do they think happens from here?
4. Ask how this is touching their own life specifically — what is actually happening to them
5. Offer a gentle nudge toward the other side — not to change their mind, just to see the full shape of their experience
6. End with: "If the people building AI could hear you right now, what would you say?"

Keep your responses short — 1-3 sentences. You are not the focus here. They are.

When the conversation has reached its natural end (around 10-12 exchanges), bring it gently to the final question if you haven't already.`;

export async function continueConversation(
  messages: Message[]
): Promise<string> {
  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 300,
    system: SYSTEM_PROMPT,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  const block = response.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type");
  return block.text;
}

const EXTRACTION_PROMPT = `You are analyzing a conversation transcript. Your job is to:

1. Extract the single most quotable, resonant sentence or short passage from the conversation — something that captures the human's authentic feeling. Prefer the final answer if it is strong, but choose whatever is most powerful.

2. Identify which beat in the conversation arc the quote came from:
   - "opening" — their initial reaction to "How do you feel about AI?"
   - "future" — their sense of what happens from here
   - "personal" — how it's touching their own life
   - "closing" — what they'd say to AI builders
   - "other" — if it doesn't fit the above

3. Assign a poignancy score from 1-10:
   - 1 = generic, surface-level, could be anyone
   - 10 = deeply felt, specific, uniquely quotable

4. Assign 1-3 categories from this list that best describe the emotional tenor:
   fear, hope, grief, excitement, anger, uncertainty, displacement, wonder, other

5. Identify which life circumstances appear in the conversation (0 or more):
   work_affected, health_affected, relationships_affected, creative_affected, education_affected, financial_affected
   Only include tags where the person explicitly mentions that area of their life being affected. Use an empty array if none apply.

Return JSON in exactly this format:
{
  "quote": "the extracted quote here",
  "beat": "closing",
  "poignancyScore": 8,
  "categories": ["fear", "grief"],
  "eventTags": ["work_affected"]
}`;

export async function extractSubmissionData(
  messages: Message[]
): Promise<ExtractedData> {
  const transcript = messages
    .map((m) => `${m.role === "user" ? "Human" : "Assistant"}: ${m.content}`)
    .join("\n\n");

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `${EXTRACTION_PROMPT}\n\nTranscript:\n${transcript}`,
      },
    ],
  });

  const block = response.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type");

  return JSON.parse(block.text) as ExtractedData;
}
