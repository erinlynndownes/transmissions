"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Message, Category } from "@/lib/types";

const GENDER_OPTIONS = ["woman", "man", "non-binary", "other", "prefer not to say"];
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
  regionContinent,
}: {
  categories: Category[];
  submissionId: string | null;
  regionContinent?: string;
}) {
  const t = useTranslations("demographics");
  const tTalk = useTranslations("talk");
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
        regionContinent: regionContinent || undefined,
        categories,
      }),
    });
  }

  if (demographicsSubmitted) {
    return (
      <div className="mt-8 animate-fade-in">
        <p className="text-neutral-500 text-xs">{t("thankYou")}</p>
        {submissionId && (
          <p className="text-neutral-700 text-xs mt-4">
            {tTalk("submissionId")}: <span className="font-mono text-neutral-600">{submissionId}</span>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-12 border-t border-neutral-800 pt-8">
      <p className="text-sm text-neutral-300 mb-2 text-center">
        {t("heading")}
      </p>
      <p className="text-xs text-neutral-600 mb-6 text-center">
        {t("subheading")}
      </p>

      <div className="space-y-4 text-left">
        <div>
          <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-2">
            {t("gender")}
          </label>
          <div className="flex flex-wrap gap-2">
            {GENDER_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setGender(gender === opt ? "" : opt)}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  gender === opt
                    ? "bg-neutral-200 text-neutral-900"
                    : "bg-neutral-800/50 text-neutral-400 hover:text-neutral-200 border border-neutral-700"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-2">
            {t("ageRange")}
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
            {t("employment")}
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
          {t("share")}
        </button>
      </div>

      {submissionId && (
        <p className="text-neutral-700 text-xs mt-6 text-center">
          {tTalk("submissionId")}: <span className="font-mono text-neutral-600">{submissionId}</span>
        </p>
      )}
    </div>
  );
}

const SESSION_KEY = "transmissions-conversation";

function saveSession(data: { messages: Message[]; consented: boolean; conversationComplete: boolean }) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch {
    // sessionStorage unavailable or full
  }
}

function loadSession(): { messages: Message[]; consented: boolean; conversationComplete: boolean } | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

export function ConversationView() {
  const t = useTranslations("talk");
  const tHome = useTranslations("home");
  const [consented, setConsented] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationComplete, setConversationComplete] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [regionContinent, setRegionContinent] = useState<string | undefined>();
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [latestAssistantIndex, setLatestAssistantIndex] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [restored, setRestored] = useState(false);

  const openingMessage = tHome("question");

  useEffect(() => {
    const saved = loadSession();
    if (saved && saved.consented && saved.messages.length > 0 && !saved.conversationComplete) {
      setConsented(true);
      setMessages(saved.messages);
      setLatestAssistantIndex(-1);
    }
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) return;
    if (consented && messages.length === 0) {
      setMessages([{ role: "assistant", content: openingMessage }]);
      setLatestAssistantIndex(0);
    }
  }, [consented, restored, openingMessage]);

  useEffect(() => {
    if (restored && consented && messages.length > 0) {
      saveSession({ messages, consented, conversationComplete });
    }
  }, [messages, consented, conversationComplete, restored]);

  useEffect(() => {
    if (!consented || conversationComplete) return;

    function handleBeforeUnload() {
      const userMessageCount = messages.filter((m) => m.role === "user").length;
      if (userMessageCount === 0) return;
      navigator.sendBeacon(
        "/api/drop",
        new Blob([JSON.stringify({ userMessageCount })], { type: "application/json" })
      );
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [consented, conversationComplete, messages]);

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
        setRegionContinent(data.regionContinent);
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
        clearSession();
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
          {t("beforeWeBegin")}
        </h2>
        <div className="text-sm text-neutral-400 leading-relaxed space-y-4">
          <p>{t("consent1")}</p>
          <p className="text-neutral-500">{t("consent2")}</p>
        </div>
        <button
          onClick={() => setConsented(true)}
          className="px-8 py-3 bg-neutral-100 hover:bg-white text-neutral-900 text-sm rounded transition-colors"
        >
          {t("consentButton")}
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
              {t("transmissionReceived")}
            </p>
            <DemographicsSection categories={categories} submissionId={submissionId} regionContinent={regionContinent} />
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center text-sm">
              <a
                href="/explore"
                className="px-8 py-3 border border-[var(--foreground)]/30 hover:border-[var(--foreground)]/60 text-[var(--foreground)]/70 hover:text-[var(--foreground)] rounded transition-colors text-center"
              >
                {t("exploreOthers")}
              </a>
              <a
                href="/"
                className="px-8 py-3 border border-[var(--foreground)]/30 hover:border-[var(--foreground)]/60 text-[var(--foreground)]/70 hover:text-[var(--foreground)] rounded transition-colors text-center"
              >
                {t("backToBeginning")}
              </a>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {!conversationComplete && (
        <div className="sticky bottom-0 pb-16">
          <div className="relative border border-[var(--foreground)]/10 rounded p-3">
            <div className="input-corner-tl" />
            <div className="input-corner-br" />
            <div className="flex gap-3">
              <textarea
                className="flex-1 bg-transparent text-neutral-100 text-lg placeholder-neutral-600 resize-none focus:outline-none"
                rows={3}
                placeholder={t("placeholder")}
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
                  {t("send")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
