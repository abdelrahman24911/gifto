import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BRAND } from "@/lib/constants";
import { getProductBySlug } from "@/lib/data/products";
import { ProductCard, ProductGrid } from "@/components/commerce/product-card";
import { BuyBox } from "@/components/commerce/buy-box";
import { ProductGallery } from "@/components/commerce/product-gallery";
import { Price } from "@/components/commerce/price";
import { Rating } from "@/components/commerce/rating";
import { Section, SectionHeading } from "@/components/ui/section";

export const instant = false;

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Gift not found" };

  const description =
    product.short_description ??
    product.description.slice(0, 160) ??
    `${product.name} — wrapped and delivered across Egypt.`;

  return {
    title: product.name,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title: `${product.name} · ${BRAND.name}`,
      description,
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const breadcrumb = product.categories[0];

  return (
    <Section className="py-8 sm:py-10">
      <nav aria-label="Breadcrumb" className="eyebrow mb-6 flex flex-wrap items-center gap-2 text-muted-foreground">
        <Link href="/" className="hover:text-primary">
          Home
        </Link>
        <span aria-hidden>/</span>
        <Link href="/shop" className="hover:text-primary">
          Shop
        </Link>
        {breadcrumb ? (
          <>
            <span aria-hidden>/</span>
            <Link href={`/shop?category=${breadcrumb.slug}`} className="hover:text-primary">
              {breadcrumb.name}
            </Link>
          </>
        ) : null}
        <span aria-hidden>/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <ProductGallery images={product.images} name={product.name} />
        </div>

        <div>
          {breadcrumb ? (
            <p className="eyebrow text-primary">{breadcrumb.name}</p>
          ) : null}
          <h1 className="mt-2 text-title font-extrabold tracking-tight">{product.name}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-4">
            <Rating value={product.rating} count={product.reviews_count} />
            {product.sku ? (
              <span className="text-xs text-muted-foreground">SKU {product.sku}</span>
            ) : null}
          </div>

          <Price className="mt-5" value={product.price} compareAt={product.compare_at_price} size="lg" />

          {product.short_description ? (
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {product.short_description}
            </p>
          ) : null}

          <BuyBox
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              price: product.price,
              compare_at_price: product.compare_at_price,
              stock_quantity: product.stock_quantity,
              low_stock_threshold: product.low_stock_threshold,
              is_customizable: product.is_customizable,
              primary_image_path: product.images[0]?.storage_path ?? null,
              options: product.options,
            }}
          />
        </div>
      </div>

      <div className="mt-16 grid gap-10 border-t border-border pt-12 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">What&apos;s inside</h2>
          <p className="mt-4 max-w-prose whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">
            {product.description}
          </p>

          {product.tags.length > 0 ? (
            <div className="mt-7 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={
                    tag.kind === "recipient"
                      ? `/shop?recipient=${tag.slug}`
                      : tag.kind === "occasion"
                        ? `/shop?occasion=${tag.slug}`
                        : `/shop?vibe=${tag.slug}`
                  }
                  className="rounded-pill border border-border bg-surface px-3.5 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary-soft hover:text-primary"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          {[
            {
              title: "How it arrives",
              body: "Wrapped in our signature kraft and ribbon with a handwritten card. No prices on the parcel — we keep those off, always.",
            },
            {
              title: "Delivery",
              body: "Same-day in Cairo and Giza when you order before 4pm, 1–3 working days across the other governorates. Track it live with your order number.",
            },
            {
              title: "Changed your mind?",
              body: "Tell us within 7 days and we will sort it — as long as the gift is unopened and untouched.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-card border border-border bg-surface p-5 shadow-hairline">
              <h3 className="text-sm font-bold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </div>

      {product.related.length > 0 ? (
        <div className="mt-16 border-t border-border pt-12">
          <SectionHeading
            eyebrow="Goes well with"
            title="You may also like"
            action={{ href: "/shop", label: "Shop everything" }}
          />
          <ProductGrid>
            {product.related.map((related) => (
              <ProductCard key={related.id} product={related} />
            ))}
          </ProductGrid>
        </div>
      ) : null}
    </Section>
  );
}
