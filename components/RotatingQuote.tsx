"use client";

import { useState, useEffect } from "react";
import { QuoteRecord } from "@/lib/types";

export function RotatingQuote({ quotes }: { quotes: QuoteRecord[] }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (quotes.length <= 1) return;

    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % quotes.length);
        setVisible(true);
      }, 600);
    }, 6000);

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
