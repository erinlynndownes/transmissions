import { ConversationView } from "@/components/ConversationView";

export default function TalkPage() {
  return (
    <div className="min-h-screen relative">
      {/* Frame */}
      <div className="fixed inset-3 sm:inset-4 md:inset-6 border border-[var(--foreground)]/20 rounded overflow-hidden pointer-events-none z-10" />
      <div className="fixed inset-3 sm:inset-4 md:inset-6 overflow-y-auto">
        <ConversationView />
      </div>
    </div>
  );
}
