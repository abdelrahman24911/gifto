import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, PackageCheck, Sparkles, Timer, Wallet } from "lucide-react";
import { BUDGET_TIERS, BRAND } from "@/lib/constants";
import { formatEGP } from "@/lib/utils";
import { getBestSellers, getBudgetProducts, getFeaturedProducts } from "@/lib/data/products";
import { listCategories } from "@/lib/data/categories";
import { getFacetsByKind } from "@/lib/data/tags";
import { Hero } from "@/components/home/hero";
import { ProductCard, ProductGrid } from "@/components/commerce/product-card";
import { Section, SectionHeading } from "@/components/ui/section";

export const metadata: Metadata = {
  title: `${BRAND.name} — Gifts in Egypt, wrapped properly`,
  description: BRAND.tagline,
};

const pillars = [
  {
    icon: PackageCheck,
    title: "Wrapped by hand",
    text: "Kraft, ribbon, a handwritten card. Nothing arrives looking like it was thrown in a box.",
  },
  {
    icon: Timer,
    title: "Ordered today, gifted tomorrow",
    text: "Same-day Cairo and Giza, 1–3 days nationwide. Live tracking the whole way.",
  },
  {
    icon: Wallet,
    title: "Cash on delivery",
    text: "Pay when it lands. Card and wallet payments accepted too.",
  },
  {
    icon: Sparkles,
    title: "Actually personal",
    text: "Add a name, a note, an inside joke — we print it exactly as you type it.",
  },
];

const testimonials = [
  {
    quote:
      "I ordered the personalised box at 11pm the night before my best friend's birthday. It showed up looking better than the photo.",
    name: "Nour A.",
    city: "Cairo",
  },
  {
    quote:
      "Third order this year. The team messaged me on WhatsApp to double-check the gift message spelling before printing it.",
    name: "Karim H.",
    city: "Alexandria",
  },
  {
    quote:
      "My sister lives in Sohag and I'm in Dubai. She sent me a photo crying. Worth every pound.",
    name: "Mariam F.",
    city: "Dubai → Sohag",
  },
];

export default async function HomePage() {
  const [bestSellers, featured, categories, budgets, facets] = await Promise.all([
    getBestSellers(8),
    getFeaturedProducts(8),
    listCategories(),
    getBudgetProducts(),
    getFacetsByKind(),
  ]);

  const budgetRows = BUDGET_TIERS.map((tier) => ({
    ...tier,
    products: budgets[tier.slug] ?? [],
    cheapest: (budgets[tier.slug] ?? [])[0]?.price ?? null,
  }));

  return (
    <>
      <Hero featured={[...featured, ...bestSellers].slice(0, 3)} />

      <Section className="py-12 sm:py-14">
        <SectionHeading
          eyebrow="Start here"
          title="Shop by moment"
          description="Every category is edited, not endless — if it is in here, it is worth gifting."
          action={{ href: "/shop", label: "See everything" }}
        />
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => (
            <li key={category.slug}>
              <Link
                href={`/shop?category=${category.slug}`}
                className="group flex h-full flex-col justify-between gap-6 rounded-card border border-border bg-surface p-5 shadow-hairline transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card"
              >
                <div>
                  <span className="text-2xl" aria-hidden>
                    {categoryEmoji(category.slug)}
                  </span>
                  <h3 className="mt-3 text-base font-bold leading-snug transition-colors group-hover:text-primary">
                    {category.name}
                  </h3>
                  {category.description ? (
                    <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
                      {category.description}
                    </p>
                  ) : null}
                </div>
                <p className="eyebrow text-muted-foreground">
                  {category.product_count} {category.product_count === 1 ? "gift" : "gifts"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="muted">
        <SectionHeading
          eyebrow="Loved most"
          title="Best sellers this month"
          description="The gifts people keep coming back for."
          action={{ href: "/shop?sort=best-selling", label: "Shop best sellers" }}
        />
        <ProductGrid>
          {bestSellers.map((product, index) => (
            <ProductCard key={product.id} product={product} priority={index < 4} />
          ))}
        </ProductGrid>
      </Section>

      <GiftFinderBand recipients={facets.recipient.slice(0, 5)} occasions={facets.occasion.slice(0, 5)} />

      <Section>
        <SectionHeading
          eyebrow="Whatever the budget"
          title="Gifts by budget"
          description="No awkward stretching. Pick a number and we will show you the good stuff."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {budgetRows.map((tier) => (
            <Link
              key={tier.slug}
              href={`/shop?budget=${tier.slug}`}
              className="group flex flex-col justify-between gap-5 rounded-card border border-border bg-surface p-5 shadow-hairline transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-card"
            >
              <div>
                <p className="text-xl font-extrabold tracking-tight text-foreground">
                  {tier.label}
                </p>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {tier.cheapest != null
                    ? `${tier.products.length} handpicked ${tier.products.length === 1 ? "pick" : "picks"} from ${formatEGP(tier.cheapest)}`
                    : "Fresh picks added weekly"}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-primary">
                Browse
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>
          ))}
        </div>
      </Section>

      <Section tone="muted">
        <SectionHeading
          eyebrow="New & noteworthy"
          title="Just landed in the studio"
          action={{ href: "/shop?sort=newest", label: "Shop new arrivals" }}
        />
        <ProductGrid>
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </ProductGrid>
      </Section>

      <Section tone="ink">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <p className="eyebrow text-accent">Why FL Tase3</p>
            <h2 className="mt-2.5 text-title font-extrabold tracking-tight text-white">
              Gifting is stressful. We removed the stressful parts.
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-white/70">
              No minimum orders, no mystery fees, no asking you to pick a courier. Choose the
              gift, write the words, we handle the rest.
            </p>
            <Link
              href="/about"
              className="mt-7 inline-flex items-center gap-1.5 text-sm font-bold text-accent transition-colors hover:text-white"
            >
              Read our story
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>

          <dl className="grid gap-6 sm:grid-cols-2">
            {pillars.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="rounded-card border border-white/10 bg-white/[0.04] p-5 transition-colors hover:bg-white/[0.07]"
              >
                <span className="grid size-10 place-items-center rounded-pill bg-accent/15 text-accent">
                  <Icon className="size-5" aria-hidden />
                </span>
                <dt className="mt-4 text-base font-bold text-white">{title}</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-white/65">{text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Section>

      <Section>
        <SectionHeading
          eyebrow="From real orders"
          title="People who nailed the gift"
          align="center"
        />
        <ul className="grid gap-5 md:grid-cols-3">
          {testimonials.map((item) => (
            <li
              key={item.name}
              className="flex h-full flex-col justify-between gap-6 rounded-card border border-border bg-surface p-6 shadow-hairline"
            >
              <blockquote className="text-[15px] leading-relaxed text-foreground">
                &ldquo;{item.quote}&rdquo;
              </blockquote>
              <footer className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-pill bg-primary-soft text-xs font-black text-primary">
                  {item.name[0]}
                </span>
                <div>
                  <p className="text-sm font-bold text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.city}</p>
                </div>
              </footer>
            </li>
          ))}
        </ul>
      </Section>

      <section className="border-t border-border bg-primary-soft">
        <div className="container-page flex flex-col items-center gap-5 py-14 text-center">
          <p className="eyebrow text-primary">Still deciding?</p>
          <h2 className="max-w-2xl text-title font-extrabold tracking-tight text-foreground">
            Answer three questions. We will do the picking.
          </h2>
          <Link
            href="/gift-finder"
            className="inline-flex h-13 items-center gap-2 rounded-pill bg-primary px-7 text-base font-bold text-white shadow-card transition-colors hover:bg-primary-hover"
          >
            Start the gift finder
            <ArrowRight className="size-5" aria-hidden />
          </Link>
        </div>
      </section>
    </>
  );
}

function GiftFinderBand({
  recipients,
  occasions,
}: {
  recipients: { name: string; slug: string; product_count: number }[];
  occasions: { name: string; slug: string; product_count: number }[];
}) {
  const steps = [
    { n: "01", title: "Who is it for?", text: "Her, him, your best friend, your boss." },
    { n: "02", title: "What is the occasion?", text: "Birthday, graduation, or no reason at all." },
    { n: "03", title: "What is the budget?", text: "We only show you things you can actually afford." },
  ];

  return (
    <Section>
      <SectionHeading
        eyebrow="Gift finder"
        title="Three questions between you and the right gift"
        description="Answer honestly — we would rather show you six perfect options than six hundred okay ones."
        action={{ href: "/gift-finder", label: "Start now" }}
      />

      <ol className="grid gap-5 md:grid-cols-3">
        {steps.map((step) => (
          <li key={step.n} className="rounded-card border border-border bg-surface p-6 shadow-hairline">
            <span className="text-3xl font-black tracking-tighter text-primary/25" aria-hidden>
              {step.n}
            </span>
            <h3 className="mt-4 text-base font-bold">{step.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
          </li>
        ))}
      </ol>

      <div className="mt-8 flex flex-wrap gap-2">
        {[...recipients, ...occasions].slice(0, 8).map((tag) => (
          <Link
            key={`${tag.slug}-${tag.name}`}
            href={`/gift-finder?tag=${tag.slug}`}
            className="rounded-pill border border-border bg-surface px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary-soft hover:text-primary"
          >
            {tag.name}
            <span className="ml-2 text-xs text-muted-foreground/70">{tag.product_count}</span>
          </Link>
        ))}
      </div>
    </Section>
  );
}

function categoryEmoji(slug: string): string {
  const map: Record<string, string> = {
    "for-her": "\u{1F380}",
    "for-him": "\u{1F58A}",
    "your-person": "\u{1F498}",
    birthday: "\u{1F382}",
    graduation: "\u{1F393}",
    "just-because": "\u{1F31F}",
    "boxes-hampers": "\u{1F381}",
    personalized: "\u270F",
  };
  return map[slug] ?? "\u{1F381}";
}
