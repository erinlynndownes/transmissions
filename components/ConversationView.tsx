"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Message, Category } from "@/lib/types";
import { DemographicsSection } from "./DemographicsSection";

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
  const USER_MESSAGE_TRUNCATE_LENGTH = 120;
  const isTruncatable = !isLatest && content.length > USER_MESSAGE_TRUNCATE_LENGTH;

  return (
    <div className="text-neutral-400 pl-4 border-l border-neutral-700">
      <p className="text-base leading-relaxed">
        {isTruncatable && !expanded ? (
          <>
            {content.slice(0, USER_MESSAGE_TRUNCATE_LENGTH).trim()}&hellip;{" "}
            <button
              onClick={() => setExpanded(true)}
              className="text-neutral-400 hover:text-neutral-300 text-sm transition-colors"
              aria-label="Expand full message"
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
  const [shareDecision, setShareDecision] = useState<"shared" | "declined" | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [eventTags, setEventTags] = useState<string[]>([]);
  const [regionContinent, setRegionContinent] = useState<string | undefined>();
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [latestAssistantIndex, setLatestAssistantIndex] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [restored, setRestored] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);

  const openingMessage = tHome("question");

  useEffect(() => {
    const saved = loadSession();
    if (saved && saved.consented && saved.messages.length > 0 && !saved.conversationComplete) {
      setConsented(true);
      setMessages(saved.messages);
      setLatestAssistantIndex(-1);
    }
    setRestored(true);

    fetch("/api/check-limit")
      .then((res) => res.json())
      .then((data) => { if (data.limited) setRateLimited(true); })
      .catch(() => {});
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
        setEventTags(data.eventTags ?? []);
        setRegionContinent(data.regionContinent);
        setSubmissionId(data.id ?? null);
        clearSession();
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
      if (res.status === 429) {
        setMessages(updated.slice(0, -1));
        setRateLimited(true);
        setConversationComplete(true);
        clearSession();
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.reply) {
        setMessages(updated.slice(0, -1));
        return;
      }
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
      }
    } finally {
      setLoading(false);
    }
  }

  const userMessageCount = messages.filter((m) => m.role === "user").length;

  function handleShare() {
    setShareDecision("shared");
    submitConversation(messages);
  }

  function handleDecline() {
    setShareDecision("declined");
    clearSession();
  }

  async function sendSkipMessage() {
    if (loading) return;
    const userMessage: Message = { role: "user", content: ">>" };
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
      if (res.status === 429) {
        setMessages(updated.slice(0, -1));
        setRateLimited(true);
        setConversationComplete(true);
        clearSession();
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.reply) {
        setMessages(updated.slice(0, -1));
        return;
      }
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
      }
    } finally {
      setLoading(false);
    }
  }

  const lastUserIndex = messages.reduce(
    (last, m, i) => (m.role === "user" ? i : last),
    -1
  );

  const closingQuestion = tHome("closingQuestion");
  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === "assistant");
  const isOnFinalQuestion = lastAssistantMessage?.content.includes(closingQuestion) ?? false;

  if (!consented) {
    if (rateLimited) {
      return (
        <div className="max-w-lg mx-auto px-6 flex flex-col items-center justify-center text-center gap-8 min-h-screen">
          <div className="text-sm text-neutral-400 leading-relaxed space-y-4">
            <p>{t("rateLimited")}</p>
            <p>{t("rateLimited2")}</p>
            <p>{t("rateLimitedExplore")}</p>
          </div>
          <a
            href="/explore"
            className="px-8 py-3 border border-[var(--foreground)]/30 hover:border-[var(--foreground)]/60 text-[var(--foreground)]/70 hover:text-[var(--foreground)] rounded transition-colors text-center text-sm"
          >
            {t("exploreOthers")}
          </a>
        </div>
      );
    }

    return (
      <div className="max-w-lg mx-auto px-6 flex flex-col items-center justify-center text-center gap-8 min-h-screen">
        <h2 className="text-2xl font-light text-neutral-100">
          {t("beforeWeBegin")}
        </h2>
        <div className="text-sm text-neutral-400 leading-relaxed space-y-4">
          <p>{t("consent1")}</p>
          <p className="text-neutral-400">{t("consent2")}</p>
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
    <div id="main-content" className="max-w-2xl mx-auto px-6 pt-36 pb-12 flex flex-col min-h-screen">
      <div className="flex-1 space-y-6 mb-8">
        {messages.map((m, i) => {
          if (m.role === "user" && m.content === ">>") return null;
          const key = `${m.role}-${i}-${m.content.slice(0, 20)}`;
          if (m.role === "assistant") {
            return (
              <AssistantMessage
                key={key}
                content={m.content}
                fadeIn={i === latestAssistantIndex && i > 0}
              />
            );
          }
          return (
            <UserMessage
              key={key}
              content={m.content}
              isLatest={i === lastUserIndex}
            />
          );
        })}
        <div aria-live="polite">
          {loading && (
            <div className="text-neutral-500 animate-pulse text-lg" role="status">...</div>
          )}
        </div>

        {conversationComplete && rateLimited && (
          <div className="animate-fade-in mt-8 text-center space-y-6">
            <p className="text-sm text-neutral-400">{t("rateLimited")}</p>
            <div className="flex justify-center text-sm">
              <a
                href="/explore"
                className="px-8 py-3 border border-[var(--foreground)]/30 hover:border-[var(--foreground)]/60 text-[var(--foreground)]/70 hover:text-[var(--foreground)] rounded transition-colors text-center"
              >
                {t("exploreOthers")}
              </a>
            </div>
          </div>
        )}

        {conversationComplete && !rateLimited && shareDecision === null && (
          <div className="animate-fade-in mt-8 text-center space-y-4">
            <p className="text-lg text-neutral-200">{t("sharePrompt")}</p>
            <div className="flex gap-4 justify-center text-sm">
              <button
                onClick={handleShare}
                className="px-8 py-3 bg-neutral-100 hover:bg-white text-neutral-900 rounded transition-colors"
              >
                {t("shareYes")}
              </button>
              <button
                onClick={handleDecline}
                className="px-8 py-3 border border-[var(--foreground)]/30 hover:border-[var(--foreground)]/60 text-[var(--foreground)]/70 hover:text-[var(--foreground)] rounded transition-colors"
              >
                {t("shareNo")}
              </button>
            </div>
          </div>
        )}

        {conversationComplete && shareDecision === "shared" && (
          <div className="animate-fade-in">
            <p className="text-sm text-neutral-400 mt-8">
              {t("transmissionReceived")}
            </p>
            <DemographicsSection categories={categories} eventTags={eventTags} submissionId={submissionId} regionContinent={regionContinent} />
            <div className="mt-10 flex justify-center text-sm">
              <a
                href="/explore"
                className="px-8 py-3 border border-[var(--foreground)]/30 hover:border-[var(--foreground)]/60 text-[var(--foreground)]/70 hover:text-[var(--foreground)] rounded transition-colors text-center"
              >
                {t("exploreOthers")}
              </a>
            </div>
          </div>
        )}

        {conversationComplete && shareDecision === "declined" && (
          <div className="animate-fade-in mt-8 text-center space-y-6">
            <p className="text-sm text-neutral-400">{t("declinedMessage")}</p>
            <div className="flex justify-center text-sm">
              <a
                href="/explore"
                className="px-8 py-3 border border-[var(--foreground)]/30 hover:border-[var(--foreground)]/60 text-[var(--foreground)]/70 hover:text-[var(--foreground)] rounded transition-colors text-center"
              >
                {t("exploreOthers")}
              </a>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {!conversationComplete && (
        <div className="sticky bottom-0 pb-16">
          <div className="relative border border-[var(--foreground)]/10 rounded p-3">
            <div className="flex gap-3">
              <textarea
                className="flex-1 bg-transparent text-neutral-100 text-lg placeholder-neutral-500 resize-none focus:outline-none"
                rows={3}
                aria-label={t("placeholder")}
                placeholder={t("placeholder")}
                value={input}
                readOnly={loading}
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
          {userMessageCount >= 3 && !loading && !isOnFinalQuestion && (
            <div className="mt-2 text-center">
              <button
                onClick={sendSkipMessage}
                className="text-xs text-neutral-500 hover:text-neutral-400 transition-colors"
              >
                {t("skipToEnd")} &raquo;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
