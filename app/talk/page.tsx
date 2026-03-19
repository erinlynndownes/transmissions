import type { Metadata } from "next";
import { ConversationView } from "@/components/ConversationView";
import { InfoButton } from "@/components/InfoButton";

export const metadata: Metadata = {
  title: "talk — transmissions",
  description: "Have an anonymous conversation with AI about how you feel about artificial intelligence.",
  openGraph: {
    title: "talk — transmissions",
    description: "Have an anonymous conversation with AI about how you feel about artificial intelligence.",
  },
};

export default function TalkPage() {
  return (
    <div className="min-h-screen relative">
      <InfoButton />
      {/* Frame */}
      <div className="fixed inset-3 sm:inset-4 md:inset-6 border border-[var(--foreground)]/20 rounded overflow-hidden pointer-events-none z-10" />
      <div className="frame-corner-tl fixed top-3 left-3 sm:top-4 sm:left-4 md:top-6 md:left-6 z-11" />
      <div className="frame-corner-br fixed bottom-3 right-3 sm:bottom-4 sm:right-4 md:bottom-6 md:right-6 z-11" />
      <div className="fixed inset-3 sm:inset-4 md:inset-6 overflow-y-auto">
        <ConversationView />
      </div>
    </div>
  );
}
