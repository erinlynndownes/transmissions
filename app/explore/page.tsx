import type { Metadata } from "next";
import { Suspense } from "react";
import { ExploreClient } from "@/components/ExploreClient";
import { ExploreLoading } from "@/components/ExploreLoading";
import { InfoButton } from "@/components/InfoButton";

export const metadata: Metadata = {
  title: "explore — transmissions",
  description: "Browse anonymous conversations about AI — what people really think and feel.",
  openGraph: {
    title: "explore — transmissions",
    description: "Browse anonymous conversations about AI — what people really think and feel.",
  },
};

export default function ExplorePage() {
  return (
    <>
      <div className="hidden md:block">
        <InfoButton />
      </div>
      <Suspense fallback={<ExploreLoading />}>
        <ExploreClient />
      </Suspense>
    </>
  );
}
