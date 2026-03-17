"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Category } from "@/lib/types";
import { ToggleButton } from "./ToggleButton";

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

export function DemographicsSection({
  categories,
  eventTags,
  submissionId,
  regionContinent,
}: {
  categories: Category[];
  eventTags: string[];
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
        eventTags,
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
              <ToggleButton
                key={opt}
                label={opt}
                selected={gender === opt}
                onClick={() => setGender(gender === opt ? "" : opt)}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-2">
            {t("ageRange")}
          </label>
          <div className="flex flex-wrap gap-2">
            {AGE_RANGES.map((r) => (
              <ToggleButton
                key={r}
                label={r}
                selected={ageRange === r}
                onClick={() => setAgeRange(ageRange === r ? "" : r)}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-2">
            {t("employment")}
          </label>
          <div className="flex flex-wrap gap-2">
            {EMPLOYMENT_OPTIONS.map((opt) => (
              <ToggleButton
                key={opt}
                label={opt}
                selected={employmentStatus === opt}
                onClick={() => setEmploymentStatus(employmentStatus === opt ? "" : opt)}
              />
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
