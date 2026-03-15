"use client";

import { useState, useEffect, useRef } from "react";
import { Message, Category } from "@/lib/types";

const OPENING_MESSAGE = "How do you feel about AI?";

const AGE_RANGES = ["13-17", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"];
const EMPLOYMENT_OPTIONS = [
  "employed",
  "self-employed",
  "unemployed",
  "student",
  "retired",
  "other",
];

function AssistantMessage({ content, fadeIn }: { content: string; fadeIn: boolean }) {
  const sentences = content.match(/[^.!?]+[.!?]+/g) || [content];
  const hasQuestion = sentences.length > 1 && sentences[sentences.length - 1].includes("?");

  if (hasQuestion) {
    const feedback = sentences.slice(0, -1).join("").trim();
    const question = sentences[sentences.length - 1].trim();
    return (
      <div className={`text-neutral-300 ${fadeIn ? "animate-fade-in" : ""}`}>
        {feedback && (
          <p className="text-base leading-relaxed mb-4 text-neutral-400">{feedback}</p>
        )}
        <p className="text-lg font-semibold leading-relaxed">{question}</p>
      </div>
    );
  }

  return (
    <div className={`text-neutral-300 ${fadeIn ? "animate-fade-in" : ""}`}>
      <p className="text-lg font-semibold leading-relaxed">{content}</p>
    </div>
  );
}

function UserMessage({ content, isLatest }: { content: string; isLatest: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const isTruncatable = !isLatest && content.length > 120;

  return (
    <div className="text-neutral-400 pl-4 border-l border-neutral-700">
      <p className="text-base leading-relaxed">
        {isTruncatable && !expanded ? (
          <>
            {content.slice(0, 120).trim()}&hellip;{" "}
            <button
              onClick={() => setExpanded(true)}
              className="text-neutral-500 hover:text-neutral-300 text-sm transition-colors"
            >
              more
            </button>
          </>
        ) : (
          content
        )}
      </p>
    </div>
  );
}

function DemographicsSection({
  categories,
  submissionId,
}: {
  categories: Category[];
  submissionId: string | null;
}) {
  const [gender, setGender] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [employmentStatus, setEmploymentStatus] = useState("");
  const [demographicsSubmitted, setDemographicsSubmitted] = useState(false);

  async function handleDemographicsSubmit() {
    setDemographicsSubmitted(true);
    await fetch("/api/demographics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gender: gender || undefined,
        ageRange: ageRange || undefined,
        employmentStatus: employmentStatus || undefined,
        categories,
      }),
    });
  }

  if (demographicsSubmitted) {
    return (
      <div className="mt-8 animate-fade-in">
        <p className="text-neutral-500 text-xs">Thank you.</p>
        {submissionId && (
          <p className="text-neutral-700 text-xs mt-4">
            Submission ID: <span className="font-mono text-neutral-600">{submissionId}</span>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-12 border-t border-neutral-800 pt-8">
      <p className="text-sm text-neutral-300 mb-2 text-center">
        Help us understand who&apos;s feeling this.
      </p>
      <p className="text-xs text-neutral-600 mb-6 text-center">
        Completely optional. Nothing here is ever attached to your conversation.
      </p>

      <div className="space-y-4 text-left">
        <div>
          <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-1">
            Gender
          </label>
          <input
            type="text"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            placeholder="However you describe yourself"
            className="w-full bg-neutral-800/50 border border-neutral-700 rounded px-3 py-2 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
          />
        </div>

        <div>
          <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-2">
            Age range
          </label>
          <div className="flex flex-wrap gap-2">
            {AGE_RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setAgeRange(ageRange === r ? "" : r)}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  ageRange === r
                    ? "bg-neutral-200 text-neutral-900"
                    : "bg-neutral-800/50 text-neutral-400 hover:text-neutral-200 border border-neutral-700"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-2">
            Employment
          </label>
          <div className="flex flex-wrap gap-2">
            {EMPLOYMENT_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() =>
                  setEmploymentStatus(employmentStatus === opt ? "" : opt)
                }
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  employmentStatus === opt
                    ? "bg-neutral-200 text-neutral-900"
                    : "bg-neutral-800/50 text-neutral-400 hover:text-neutral-200 border border-neutral-700"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

      </div>

      <div className="text-center mt-6">
        <button
          onClick={handleDemographicsSubmit}
          className="px-6 py-2 bg-neutral-100 hover:bg-white text-neutral-900 text-sm rounded transition-colors"
        >
          share
        </button>
      </div>

      {submissionId && (
        <p className="text-neutral-700 text-xs mt-6 text-center">
          Submission ID: <span className="font-mono text-neutral-600">{submissionId}</span>
        </p>
      )}
    </div>
  );
}

export function ConversationView() {
  const [consented, setConsented] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationComplete, setConversationComplete] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [latestAssistantIndex, setLatestAssistantIndex] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (consented) {
      setMessages([{ role: "assistant", content: OPENING_MESSAGE }]);
      setLatestAssistantIndex(0);
    }
  }, [consented]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function submitConversation(allMessages: Message[]) {
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: allMessages }),
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories ?? []);
        setSubmissionId(data.id ?? null);
      }
    } catch {
      // Submission failed silently — conversation is still shown
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const updated = [...messages, userMessage];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated }),
      });
      const data = await res.json();
      let reply: string = data.reply;

      let isComplete = false;
      if (reply.includes("[END]")) {
        reply = reply.replace(/\s*\[END\]\s*/g, "").trim();
        isComplete = true;
      }

      const newMessages = [
        ...updated,
        { role: "assistant" as const, content: reply },
      ];
      setMessages(newMessages);
      setLatestAssistantIndex(newMessages.length - 1);

      if (isComplete) {
        setConversationComplete(true);
        // Auto-submit in the background
        submitConversation(newMessages);
      }
    } finally {
      setLoading(false);
    }
  }

  const lastUserIndex = messages.reduce(
    (last, m, i) => (m.role === "user" ? i : last),
    -1
  );

  if (!consented) {
    return (
      <div className="max-w-lg mx-auto px-6 flex flex-col items-center justify-center text-center gap-8 min-h-screen">
        <h2 className="text-2xl font-light text-neutral-100">
          Before we begin
        </h2>
        <div className="text-sm text-neutral-400 leading-relaxed space-y-4">
          <p>
            This is a short conversation about how you feel about AI. With your
            permission, your words will be stored anonymously and displayed
            publicly for others to read.
          </p>
          <p className="text-neutral-500">
            Please don&apos;t include anything personal you wouldn&apos;t want
            shown. No names, locations, or identifying details. You can&apos;t
            edit it after the fact.
          </p>
        </div>
        <button
          onClick={() => setConsented(true)}
          className="px-8 py-3 bg-neutral-100 hover:bg-white text-neutral-900 text-sm rounded transition-colors"
        >
          I understand, let&apos;s talk
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 pt-36 pb-12 flex flex-col min-h-screen">
      <div className="flex-1 space-y-6 mb-8">
        {messages.map((m, i) => {
          if (m.role === "assistant") {
            return (
              <AssistantMessage
                key={i}
                content={m.content}
                fadeIn={i === latestAssistantIndex && i > 0}
              />
            );
          }
          return (
            <UserMessage
              key={i}
              content={m.content}
              isLatest={i === lastUserIndex}
            />
          );
        })}
        {loading && (
          <div className="text-neutral-600 animate-pulse text-lg">...</div>
        )}

        {conversationComplete && (
          <div className="animate-fade-in">
            <p className="text-sm text-neutral-500 mt-8">
              Transmission received. Your words are part of the record now.
            </p>
            <DemographicsSection categories={categories} submissionId={submissionId} />
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center text-sm">
              <a
                href="/explore"
                className="px-8 py-3 border border-[var(--foreground)]/30 hover:border-[var(--foreground)]/60 text-[var(--foreground)]/70 hover:text-[var(--foreground)] rounded transition-colors text-center"
              >
                explore what others said
              </a>
              <a
                href="/"
                className="px-8 py-3 border border-[var(--foreground)]/30 hover:border-[var(--foreground)]/60 text-[var(--foreground)]/70 hover:text-[var(--foreground)] rounded transition-colors text-center"
              >
                back to the beginning
              </a>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {!conversationComplete && (
        <div className="sticky bottom-0 pb-16">
          <div className="flex gap-3">
            <textarea
              className="flex-1 bg-neutral-800/50 border border-neutral-700 rounded px-4 py-3 text-neutral-100 text-lg placeholder-neutral-600 resize-none focus:outline-none focus:border-neutral-500"
              rows={3}
              placeholder="Say what you need to say..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <div className="flex flex-col gap-2 justify-end">
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 disabled:opacity-30 text-neutral-200 text-sm rounded transition-colors"
              >
                send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
