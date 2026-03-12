"use client";

import { useState, useEffect, useRef } from "react";
import { Message } from "@/lib/types";

const OPENING_MESSAGE =
  "How do you feel about AI?";

export function ConversationView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [quote, setQuote] = useState<string | null>(null);
  const [canSubmit, setCanSubmit] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Show opening question on mount
  useEffect(() => {
    setMessages([{ role: "assistant", content: OPENING_MESSAGE }]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Allow submission after enough exchanges
  useEffect(() => {
    const userMessages = messages.filter((m) => m.role === "user").length;
    setCanSubmit(userMessages >= 4);
  }, [messages]);

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
      setMessages([...updated, { role: "assistant", content: data.reply }]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      const data = await res.json();
      setQuote(data.quote);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 text-center">
        <p className="text-sm uppercase tracking-widest text-neutral-400 mb-8">
          received
        </p>
        {quote && (
          <blockquote className="text-xl text-neutral-200 leading-relaxed italic mb-10">
            &ldquo;{quote}&rdquo;
          </blockquote>
        )}
        <p className="text-neutral-500 text-sm">
          Your words are part of the record now.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-12 flex flex-col min-h-screen">
      <div className="flex-1 space-y-6 mb-8">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`${
              m.role === "assistant"
                ? "text-neutral-300"
                : "text-neutral-100 pl-4 border-l border-neutral-600"
            }`}
          >
            <p className="leading-relaxed">{m.content}</p>
          </div>
        ))}
        {loading && (
          <div className="text-neutral-500 text-sm animate-pulse">...</div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="sticky bottom-0 pb-6 bg-neutral-950">
        <div className="flex gap-3">
          <textarea
            className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-4 py-3 text-neutral-100 placeholder-neutral-600 resize-none focus:outline-none focus:border-neutral-500 text-sm"
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
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 text-neutral-200 text-sm rounded transition-colors"
            >
              send
            </button>
            {canSubmit && (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 bg-neutral-200 hover:bg-white disabled:opacity-30 text-neutral-900 text-sm rounded transition-colors"
              >
                submit
              </button>
            )}
          </div>
        </div>
        {canSubmit && (
          <p className="text-neutral-600 text-xs mt-2">
            Submit to add your voice to the record. Anonymous, always.
          </p>
        )}
      </div>
    </div>
  );
}
