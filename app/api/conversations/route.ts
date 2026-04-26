import { NextRequest, NextResponse } from "next/server";
import { getConversations } from "@/lib/storage";
import { withLogging } from "@/lib/logger";
import { CATEGORIES, EVENT_TAGS, BEATS, Category, EventTag, Beat, FilterParams } from "@/lib/types";

const VALID_CATEGORIES = new Set<string>(CATEGORIES);
const VALID_EVENT_TAGS = new Set<string>(EVENT_TAGS);
const VALID_BEATS = new Set<string>(BEATS);

export const GET = withLogging("/api/conversations", async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);

  const params: FilterParams = {};

  const category = searchParams.get("category");
  if (category) {
    if (!VALID_CATEGORIES.has(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    params.category = category as Category;
  }

  const eventTag = searchParams.get("eventTag");
  if (eventTag) {
    if (!VALID_EVENT_TAGS.has(eventTag)) {
      return NextResponse.json({ error: "Invalid eventTag" }, { status: 400 });
    }
    params.eventTag = eventTag as EventTag;
  }

  const beat = searchParams.get("beat");
  if (beat) {
    if (!VALID_BEATS.has(beat)) {
      return NextResponse.json({ error: "Invalid beat" }, { status: 400 });
    }
    params.beat = beat as Beat;
  }

  const regionSubdivision = searchParams.get("regionSubdivision");
  if (regionSubdivision) params.regionSubdivision = regionSubdivision;

  const regionCountry = searchParams.get("regionCountry");
  if (regionCountry) params.regionCountry = regionCountry;

  const regionContinent = searchParams.get("regionContinent");
  if (regionContinent) params.regionContinent = regionContinent;

  const cursor = searchParams.get("cursor");
  if (cursor) params.cursor = cursor;

  const limit = searchParams.get("limit");
  if (limit) {
    const parsed = parseInt(limit, 10);
    if (isNaN(parsed) || parsed < 1 || parsed > 100) {
      return NextResponse.json({ error: "Invalid limit (1-100)" }, { status: 400 });
    }
    params.limit = parsed;
  }

  const result = await getConversations(params);
  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
  });
});
