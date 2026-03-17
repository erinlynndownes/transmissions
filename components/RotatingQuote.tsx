"use client";

import { useState, useEffect } from "react";
import { ConversationItem } from "@/lib/types";

export function RotatingQuote({ quotes }: { quotes: ConversationItem[] }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  const ROTATION_INTERVAL_MS = 9000;
  const FADE_DURATION_MS = 600;

  useEffect(() => {
    if (quotes.length <= 1) return;

    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % quotes.length);
        setVisible(true);
      }, FADE_DURATION_MS);
    }, ROTATION_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [quotes.length]);

  if (!quotes.length) return null;

  return (
    <blockquote
      className={`text-xl md:text-2xl text-neutral-300 italic leading-relaxed transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      &ldquo;{quotes[index].quote}&rdquo;
    </blockquote>
  );
}
