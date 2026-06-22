import Image from "next/image";
import { cn } from "@/lib/utils";

interface CampaignHeroProps {
  name: string;
  shortDescription?: string | null;
  heroImageUrl?: string | null;
  endsAtLabel?: string;
  className?: string;
}

export function CampaignHero({
  name,
  shortDescription,
  heroImageUrl,
  endsAtLabel,
  className,
}: CampaignHeroProps) {
  return (
    <div className={cn("relative overflow-hidden rounded-xl bg-surface-muted", className)}>
      {heroImageUrl && (
        <Image
          src={heroImageUrl}
          alt={name}
          fill
          className="object-cover"
          priority
        />
      )}
      <div className="relative z-10 flex flex-col gap-3 bg-gradient-to-t from-black/60 to-transparent p-8 pt-32">
        {endsAtLabel && (
          <span className="inline-block rounded-full bg-warning-bg text-warning text-xs font-medium px-3 py-1 w-fit">
            {endsAtLabel}
          </span>
        )}
        <h1 className="text-3xl font-bold text-white">{name}</h1>
        {shortDescription && (
          <p className="text-white/80 text-base max-w-xl">{shortDescription}</p>
        )}
      </div>
    </div>
  );
}
