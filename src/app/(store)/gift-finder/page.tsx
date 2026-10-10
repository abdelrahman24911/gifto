import type { Metadata } from "next";
import { getFacetsByKind } from "@/lib/data/tags";
import { Section, SectionHeading } from "@/components/ui/section";
import { GiftFinder } from "@/components/shop/gift-finder";

export const instant = false;

export const metadata: Metadata = {
  title: "Gift Finder",
  description:
    "Answer three quick questions and let FL Tase3 match the perfect personalized gift for your loved one.",
};

export default async function GiftFinderPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;
  const facets = await getFacetsByKind();

  return (
    <Section className="min-h-[70vh]">
      <SectionHeading
        eyebrow="Gift finder"
        title="Three questions between you and the right gift"
        description="Tell us who it's for, the occasion, and the vibe. We'll hand you a shortlist of gifts that match."
        align="center"
      />
      <div className="mx-auto mt-10 max-w-3xl">
        <GiftFinder
          options={{
            recipient: facets.recipient,
            occasion: facets.occasion,
            vibe: facets.vibe,
          }}
          initialTag={tag ?? ""}
        />
      </div>
    </Section>
  );
}