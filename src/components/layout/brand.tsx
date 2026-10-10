import { MessageCircle, RotateCcw, Truck } from "lucide-react";
import { BRAND, FREE_DELIVERY_THRESHOLD } from "@/lib/constants";
import { formatEGP } from "@/lib/utils";

const messages = [
  { icon: Truck, text: `Free delivery over ${formatEGP(FREE_DELIVERY_THRESHOLD)}` },
  { icon: RotateCcw, text: "7-day easy returns" },
  { icon: MessageCircle, text: `Order on WhatsApp: ${BRAND.whatsappDisplay}` },
];

export function AnnouncementBar() {
  return (
    <div className="bg-foreground text-white/90">
      <div className="container-page flex h-9 items-center justify-center overflow-hidden">
        <ul className="flex items-center gap-x-6">
          {messages.map(({ icon: Icon, text }, index) => (
            <li
              key={text}
              className={
                index === 1
                  ? "hidden items-center gap-1.5 text-[11px] font-semibold tracking-wide sm:flex"
                  : "flex items-center gap-1.5 text-[11px] font-semibold tracking-wide"
              }
            >
              <Icon className="size-3.5 shrink-0 text-accent" aria-hidden />
              <span className="whitespace-nowrap">{text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function BrandMark() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-[11px] bg-primary text-[13px] font-black tracking-tight text-white shadow-hairline">
        FL
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-[17px] font-extrabold tracking-[-0.03em] text-foreground">
          Tase3
        </span>
        <span className="eyebrow mt-0.5 text-[9px] text-muted-foreground">Gift Studio</span>
      </span>
    </span>
  );
}
