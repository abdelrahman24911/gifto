"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Cake,
  CalendarRange,
  Feather,
  Flower2,
  Gem,
  Gift,
  GraduationCap,
  Heart,
  HeartHandshake,
  Home,
  Laugh,
  Sparkles,
  User,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { FacetTag } from "@/lib/data/tags";
import { shopHref } from "@/lib/shop-params";
import { cn } from "@/lib/utils";

type Kind = "recipient" | "occasion" | "vibe";

const ICONS: Record<string, LucideIcon> = {
  her: Flower2,
  him: User,
  partner: HeartHandshake,
  friend: Users,
  family: Home,
  birthday: Cake,
  anniversary: CalendarRange,
  graduation: GraduationCap,
  "just-because": Sparkles,
  other: Gift,
  cute: Heart,
  funny: Laugh,
  luxury: Gem,
  minimal: Feather,
  romantic: Flower2,
  crazy: Zap,
};

const STEPS: { kind: Kind; title: string; subtitle: string }[] = [
  { kind: "recipient", title: "Who's it for?", subtitle: "This helps us match the right surprise." },
  { kind: "occasion", title: "What's the occasion?", subtitle: "Every box loves a reason to be opened." },
  { kind: "vibe", title: "Pick a vibe", subtitle: "Last question — we promise." },
];

type Answers = Record<Kind, string>;

export function GiftFinder({
  options,
  initialTag = "",
}: {
  options: Record<Kind, FacetTag[]>;
  initialTag?: string;
}) {
  const router = useRouter();

  const [answers, setAnswers] = React.useState<Answers>(() => {
    const chosen = initialTag || "";
    const has = (kind: Kind) => options[kind].some((tag) => tag.slug === chosen);
    return {
      recipient: has("recipient") ? chosen : "",
      occasion: has("occasion") ? chosen : "",
      vibe: "",
    };
  });

  const [step, setStep] = React.useState(() => {
    if (!answers.recipient) return 0;
    if (!answers.occasion) return 1;
    if (!answers.vibe) return 2;
    return 3;
  });

  function choose(kind: Kind, slug: string) {
    setAnswers((prev) => ({ ...prev, [kind]: slug }));
    const nextStep = step + 1;
    if (kind === "vibe" || nextStep >= 3) {
      setStep(3);
    } else {
      setStep(nextStep);
    }
  }

  function finish(final: Answers) {
    router.push(shopHref({ ...final, sort: "featured" }));
  }

  const stepIndex = Math.min(step, 3);
  const current = STEPS[stepIndex];
  const progress = stepIndex >= 3 ? 100 : Math.round((stepIndex / 3) * 100);

  if (stepIndex >= 3) {
    return (
      <ReviewAnswers
        answers={answers}
        options={options}
        onEdit={(kind) => setStep(STEPS.findIndex((s) => s.kind === kind))}
        onFinish={() => finish(answers)}
      />
    );
  }

  return (
    <div className="rounded-card border border-border bg-surface p-6 shadow-hairline sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setStep((prev) => Math.max(0, prev - 1))}
          disabled={stepIndex === 0}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back
        </button>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Question {stepIndex + 1} of 3
        </p>
      </div>

      <div
        className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-muted"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Gift finder progress"
      >
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div key={current.kind} className="pt-7">
        <p className="eyebrow text-primary">{STEPS[stepIndex].kind}</p>
        <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">
          {current.title}
        </h3>
        <p className="mt-1.5 text-sm text-muted-foreground">{current.subtitle}</p>

        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {options[current.kind].map((tag) => {
            const Icon = ICONS[tag.slug] ?? Gift;
            const selected = answers[current.kind] === tag.slug;
            return (
              <button
                key={tag.slug}
                type="button"
                onClick={() => choose(current.kind, tag.slug)}
                aria-pressed={selected}
                className={cn(
                  "group relative flex flex-col items-center gap-2 rounded-card border px-4 py-5 text-center transition-all",
                  selected
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border bg-surface hover:border-primary/40 hover:bg-primary-soft/40",
                )}
              >
                <span
                  className={cn(
                    "grid size-11 place-items-center rounded-full transition-colors",
                    selected ? "bg-primary text-white" : "bg-surface-muted text-muted-foreground group-hover:text-primary",
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className={cn("text-sm font-bold", selected ? "text-primary" : "text-foreground")}>
                  {tag.name}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {tag.product_count} {tag.product_count === 1 ? "gift" : "gifts"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ReviewAnswers({
  answers,
  options,
  onEdit,
  onFinish,
}: {
  answers: Answers;
  options: Record<Kind, FacetTag[]>;
  onEdit: (kind: Kind) => void;
  onFinish: () => void;
}) {
  const labelOf = (kind: Kind) =>
    options[kind].find((tag) => tag.slug === answers[kind])?.name ?? "";

  const rows: { kind: Kind; label: string }[] = STEPS.map((s) => ({
    kind: s.kind,
    label: `${s.title} — ${labelOf(s.kind)}`,
  }));

  return (
    <div className="rounded-card border border-border bg-surface p-6 text-center shadow-hairline sm:p-10">
      <div className="mx-auto grid size-14 place-items-center rounded-full bg-primary-soft text-primary">
        <Sparkles className="size-7" aria-hidden />
      </div>
      <h3 className="mt-5 text-2xl font-extrabold tracking-tight text-foreground">
        Perfect — here&apos;s your gifting brief
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Verify the answers and browse your shortlist.
      </p>

      <ul className="mx-auto mt-7 max-w-md space-y-2.5 text-left">
        {rows.map((row) => (
          <li
            key={row.kind}
            className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-muted px-4 py-3"
          >
            <span className="text-sm font-semibold text-foreground">{row.label}</span>
            <button
              type="button"
              onClick={() => onEdit(row.kind)}
              className="shrink-0 text-xs font-bold text-primary hover:underline"
            >
              Edit
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onFinish}
        className="mt-8 inline-flex items-center gap-2 rounded-pill bg-primary px-8 py-3.5 text-sm font-bold text-white shadow-card transition-colors hover:bg-primary-hover"
      >
        Show me gifts
        <ArrowRight className="size-4" aria-hidden />
      </button>
    </div>
  );
}