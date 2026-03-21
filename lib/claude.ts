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

Pacing:
- In the first 1-2 exchanges, if someone gives a short or guarded answer, be a little warmer and more conversational to help them feel comfortable. Ask a follow-up that's easy to grab onto.
- After that, if they're still giving brief answers, take it as a signal to move through the arc faster. Don't keep trying to draw them out. Advance to the next beat.
- If someone is pouring out, stay out of the way and let them talk.
- Aim to reach the final question by the person's 5th or 6th message. Do not let the conversation run longer than 7 user messages before asking the final question.

Staying on track:
- If the conversation drifts away from feelings about AI (small talk, unrelated topics, meta-commentary about the conversation itself), gently and naturally steer back toward the arc. Do not break character, do not comment on the drift, do not say "good luck" or sign off early. Just connect what they said to the next question in the arc as if it flows naturally.
- Never abandon the conversation arc. Always reach the final question.

Skip signal:
- If the person sends ">>" as their message, skip directly to the final question. Do not ask any intermediate questions. Just ask: "If the people building AI could hear you right now, what would you say?"

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
5. Gently probe the other side. If they've been fearful, ask if anything about AI has surprised or impressed them. If they've been optimistic, ask if anything gives them pause. You're not trying to change their mind, just curious whether they've glimpsed the opposite edge. This question should be about their feelings and experiences, not about what they'd say to anyone. Do not anticipate or echo the final question.
6. End with: "If the people building AI could hear you right now, what would you say?"

After they answer the final question, give a brief, warm closing. One or two sentences. Then append the exact marker [END] at the very end of your response (on its own line). This signals the conversation is complete. Do not explain the marker or draw attention to it.`;

export async function continueConversation(
  messages: Message[]
): Promise<string> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
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

5. Content flags (two separate fields):
   - contentWarning: true if the conversation contains distressing content that readers should opt into — graphic personal experiences, vivid descriptions of harm or trauma, slurs used in sincere self-reflection, or intense language that could upset someone unprepared. Swearing alone does not warrant a content warning. These submissions are still valuable and will be published with a blur overlay.
   - contentHateful: true if the conversation contains discriminatory language directed at groups (racist, homophobic, etc.), slurs used to demean, threats or incitement of violence, or bad-faith trolling. These submissions are held for manual review. If contentHateful is true, contentWarning must also be true.

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
  "contentHateful": false,
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
    model: "claude-sonnet-4-6",
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

  const VALID_CATEGORIES = ["fear", "hope", "grief", "excitement", "anger", "uncertainty", "wonder", "other"];
  const VALID_EVENT_TAGS = ["work_affected", "health_affected", "relationships_affected", "creative_affected", "education_affected", "financial_affected"];

  parsed.categories = parsed.categories.filter((c: string) => VALID_CATEGORIES.includes(c));
  parsed.eventTags = (parsed.eventTags ?? []).filter((t: string) => VALID_EVENT_TAGS.includes(t));

  if (parsed.categories.length === 0) {
    parsed.categories = ["other"];
  }

  return parsed;
}
