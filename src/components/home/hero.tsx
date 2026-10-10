import Link from "next/link";
import { ArrowRight, Star, Truck, ShieldCheck, Gift } from "lucide-react";
import { formatEGP } from "@/lib/utils";
import type { ProductSummary } from "@/lib/types";
import { ProductImage } from "@/components/commerce/product-image";
import { Price } from "@/components/commerce/price";

const trust = [
  { icon: Star, label: "4.9/5 from 1,200+ orders" },
  { icon: Truck, label: "Delivered across 27 governorates" },
  { icon: ShieldCheck, label: "Cash on delivery available" },
  { icon: Gift, label: "Wrapped by hand, ready to give" },
];

export function Hero({ featured }: { featured: ProductSummary[] }) {
  const [lead, ...rest] = featured;
  const floats = rest.slice(0, 2);

  return (
    <section className="relative overflow-hidden border-b border-border">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_60%_at_85%_-10%,var(--color-primary-soft)_0%,transparent_60%),radial-gradient(60%_50%_at_0%_110%,var(--color-accent-soft)_0%,transparent_55%)]"
      />

      <div className="container-page relative grid items-center gap-10 py-14 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:py-24">
        <div>
          <p className="eyebrow inline-flex items-center gap-2 rounded-pill border border-border bg-surface px-3 py-1.5 text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary" aria-hidden />
            The gift that says what you don&apos;t know how to say
          </p>

          <h1 className="mt-6 text-display font-black tracking-tight text-foreground">
            Gifts that land
            <span className="block text-primary">the way you meant them.</span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Curated boxes, personalised keepsakes and last-minute saviours — picked by people,
            wrapped by hand, delivered anywhere in Egypt.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/shop"
              className="group inline-flex h-13 items-center gap-2 rounded-pill bg-primary px-7 text-base font-bold text-white shadow-card transition-colors hover:bg-primary-hover"
            >
              Shop all gifts
              <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
            <Link
              href="/gift-finder"
              className="inline-flex h-13 items-center gap-2 rounded-pill border border-border-strong bg-surface px-7 text-base font-bold text-foreground transition-colors hover:border-foreground/30 hover:bg-surface-muted"
            >
              <Gift className="size-5 text-primary" aria-hidden />
              Find the right gift
            </Link>
          </div>

          <dl className="mt-10 grid max-w-2xl grid-cols-2 gap-x-6 gap-y-5 border-t border-border pt-7">
            {trust.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-start gap-2.5">
                <Icon className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                <dd className="text-[13px] font-semibold leading-snug text-muted-foreground">
                  {label}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative">
          <div className="grid grid-cols-2 gap-4 sm:gap-5">
            {lead ? (
              <Link
                href={`/product/${lead.slug}`}
                className="group col-span-2 relative overflow-hidden rounded-2xl border border-border bg-surface p-3 shadow-card transition-shadow hover:shadow-pop sm:col-span-1"
              >
                <ProductImage
                  path={lead.images[0]?.storage_path ?? null}
                  alt={lead.name}
                  caption={lead.name}
                  sizes="(max-width: 1024px) 50vw, 30vw"
                  priority
                  className="aspect-[4/5] w-full rounded-xl"
                />
                <div className="mt-3 px-1 pb-1">
                  <p className="eyebrow text-primary">Best seller</p>
                  <h3 className="mt-1.5 line-clamp-2 text-sm font-bold leading-snug group-hover:text-primary">
                    {lead.name}
                  </h3>
                  <Price className="mt-2" value={lead.price} compareAt={lead.compare_at_price} size="sm" />
                </div>
              </Link>
            ) : null}

            <div className="col-span-2 grid grid-cols-2 gap-4 sm:col-span-1 sm:gap-5">
              {floats.map((product, index) => (
                <Link
                  key={product.id}
                  href={`/product/${product.slug}`}
                  className="group overflow-hidden rounded-2xl border border-border bg-surface p-2.5 shadow-hairline transition-shadow hover:shadow-card"
                >
                  <ProductImage
                    path={product.images[0]?.storage_path ?? null}
                    alt={product.name}
                    caption={product.name}
                    sizes="(max-width: 1024px) 25vw, 15vw"
                    className={index === 0 ? "aspect-square w-full rounded-xl" : "aspect-[3/4] w-full rounded-xl"}
                  />
                  <div className="mt-2.5 px-0.5">
                    <p className="line-clamp-1 text-[13px] font-bold leading-snug group-hover:text-primary">
                      {product.name}
                    </p>
                    <p className="mt-1 text-xs font-bold tabular-nums text-muted-foreground">
                      {formatEGP(product.price)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {lead ? (
            <span className="absolute -bottom-4 left-4 rotate-[-3deg] rounded-pill border border-border bg-accent px-4 py-2 text-xs font-black uppercase tracking-wider text-accent-foreground shadow-pop sm:left-8">
              From {formatEGP(Math.min(...featured.map((p) => Number(p.price))))}
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}
