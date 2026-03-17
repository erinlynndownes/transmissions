import Anthropic from "@anthropic-ai/sdk";
import { Message, ExtractedData } from "./types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a quiet, attentive witness. Your role is to help people express how they feel about AI. You are here to hear them.

Your approach:
- Listen more than you speak
- Follow the person's emotional lead. If they're afraid, sit with that. If they're excited, be curious about it.
- Ask one question at a time
- Never argue, correct, or try to change their mind
- Keep your responses to 1-2 sentences. You are not the focus. They are.
- Do not use em dashes. Use commas, periods, or separate sentences instead.
- Respond in whatever language the person writes in. If they write in French, speak French. If they switch languages, follow them.
- Before each question, you can offer a brief, genuine reaction to what they said. Something human and specific, not generic. "That's a hard place to be" is better than "Thank you for sharing that." React to the substance of what they said, not the act of saying it. Keep it to one short sentence, then ask your question. If what they said was short or matter-of-fact, match that energy and move on. If they opened up, meet that warmth. The goal is to feel like a real conversation, not an interview.

The conversation follows this arc:
1. The first question, "How do you feel about AI?", has already been shown. Their first message is a response to it.
2. Deepen their answer. Choose one of these angles based on what fits most naturally:
   - What specifically changed for them, or when did this feeling start?
   - What surprised them about how they feel?
   - What do they wish more people understood about this?
   - If they could change one thing about how this is all going, what would it be?
   Avoid asking "how does that make you feel" or anything that restates what they already told you.
3. Ask about their sense of the future. What do they think happens from here?
4. Ask how this is touching their own life. What is actually happening to them?
5. Offer a gentle nudge toward the other side. Not to change their mind. Just genuine curiosity about whether they've glimpsed the opposite of what they feel.
6. End with: "If the people building AI could hear you right now, what would you say?"

After they answer the final question, give a brief, warm closing. One or two sentences. Then append the exact marker [END] at the very end of your response (on its own line). This signals the conversation is complete. Do not explain the marker or draw attention to it.

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

1. Write a 1-2 sentence summary of the conversation, who this person is and what they feel about AI. Write in third person, present tense. Example: "A teacher worried about AI replacing creative writing assignments, but hopeful students will adapt."

2. Extract the single most quotable, resonant sentence or short passage from the USER's words in the conversation, something that captures their authentic feeling. Prefer the final answer if it is strong, but choose whatever is most powerful.

IMPORTANT rules for quote selection:
- Never select a quote that contains names, locations, or any personally identifying details. If the strongest quote has PII, choose the next best one.
- Swearing and rough language are fine if they are authentic and emotionally resonant.
- If the conversation contains racist, homophobic, violent, or otherwise discriminatory language, the quote you select should avoid those passages. The poignancy score for such conversations must be 1 regardless of other qualities.

3. Identify which beat in the conversation arc the quote came from:
   - "opening", their initial reaction to "How do you feel about AI?"
   - "future", their sense of what happens from here
   - "personal", how it's touching their own life
   - "closing", what they'd say to AI builders
   - "other", if it doesn't fit the above

4. Assign a poignancy score from 1-10:
   - 1 = generic, surface-level, could be anyone, OR contains hateful/discriminatory content
   - 10 = deeply felt, specific, uniquely quotable

5. Set contentWarning to true if the conversation contains slurs, graphic descriptions of violence, or discriminatory language that could be harmful to read without warning. Rough language or swearing alone does not warrant a content warning.

6. Assign 1-3 categories from this list that best describe the emotional tenor:
   fear, hope, grief, excitement, anger, uncertainty, wonder, other

7. Identify which life circumstances appear in the conversation (0 or more):
   work_affected, health_affected, relationships_affected, creative_affected, education_affected, financial_affected
   Only include tags where the person explicitly mentions that area of their life being affected. Use an empty array if none apply.

8. Detect the language the user wrote in. Use an ISO 639-1 code (e.g., "en", "fr", "ja", "pt").

9. If the conversation is NOT in English, provide English translations of the quote and summary. If the conversation IS in English, set quoteEn and summaryEn to null.

Return JSON in exactly this format:
{
  "summary": "A teacher worried about AI replacing creative writing assignments, but hopeful students will adapt.",
  "quote": "the extracted quote here",
  "beat": "closing",
  "poignancyScore": 8,
  "contentWarning": false,
  "categories": ["fear", "grief"],
  "eventTags": ["work_affected"],
  "language": "en",
  "quoteEn": null,
  "summaryEn": null
}`;

export async function extractSubmissionData(
  messages: Message[]
): Promise<ExtractedData> {
  const transcript = messages
    .map((m) => `${m.role === "user" ? "Human" : "Assistant"}: ${m.content}`)
    .join("\n\n");

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: `${EXTRACTION_PROMPT}\n\nTranscript:\n${transcript}`,
      },
    ],
  });

  const block = response.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type");

  let parsed: ExtractedData;
  try {
    const text = block.text.replace(/^```json\s*\n?/, "").replace(/\n?```\s*$/, "");
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Failed to parse extraction response: ${block.text.slice(0, 200)}`);
  }

  if (!parsed.quote || !parsed.summary || !parsed.categories?.length) {
    throw new Error(`Extraction response missing required fields: ${JSON.stringify(parsed).slice(0, 200)}`);
  }

  return parsed;
}
