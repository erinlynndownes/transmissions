import type { Metadata } from "next";
import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
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

export default async function ExplorePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

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
