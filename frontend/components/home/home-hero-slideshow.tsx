"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/design-system/components/button";
import { cn } from "@/lib/utils";
import type { HeroSlideViewModel } from "@/features/campaign/campaign.mappers";

interface HomeHeroSlideshowProps {
  slides: HeroSlideViewModel[];
}

/**
 * Auto-rotating homepage hero driven by HOME_HERO campaigns. Pauses on hover/
 * focus and disables autoplay under prefers-reduced-motion.
 */
export function HomeHeroSlideshow({ slides }: HomeHeroSlideshowProps) {
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const [autoplay] = useState(() =>
    Autoplay({ delay: 5000, stopOnMouseEnter: true, stopOnInteraction: false })
  );
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" }, [autoplay]);
  const [selected, setSelected] = useState(0);
  const multiple = slides.length > 1;

  const onSelect = useCallback(() => {
    if (emblaApi) setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect).on("reInit", onSelect);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      autoplay.stop();
    }
    return () => {
      emblaApi.off("select", onSelect).off("reInit", onSelect);
    };
  }, [emblaApi, onSelect, autoplay]);

  if (!slides.length) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label={t("promotionsAria")}
      className="relative"
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              className="relative flex-[0_0_100%] min-w-0 h-[420px] sm:h-[480px] lg:h-[560px] bg-surface-muted"
            >
              {slide.mobileImageUrl && (
                <Image
                  src={slide.mobileImageUrl}
                  alt={slide.name}
                  fill
                  priority={i === 0}
                  sizes="100vw"
                  className="object-cover md:hidden"
                />
              )}
              {slide.imageUrl && (
                <Image
                  src={slide.imageUrl}
                  alt={slide.name}
                  fill
                  priority={i === 0}
                  sizes="100vw"
                  className={cn("object-cover", slide.mobileImageUrl && "hidden md:block")}
                />
              )}
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"
                aria-hidden
              />
              <div className="absolute inset-0 flex items-end">
                <div className="mx-auto w-full max-w-container px-4 md:px-8 xl:px-12 pb-16 md:pb-20">
                  <div className="flex max-w-xl flex-col gap-5">
                    <h2 className="font-display text-4xl md:text-5xl font-normal text-text-inverse leading-tight">
                      {slide.name}
                    </h2>
                    <Link href={`/products?campaign=${slide.slug}`} className="w-fit">
                      <Button variant="primary" size="lg">
                        {t("heroSlideCta")}
                        <ArrowRight className="h-4 w-4 ml-1" aria-hidden />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {multiple && (
        <>
          <button
            type="button"
            onClick={() => emblaApi?.scrollPrev()}
            aria-label={tc("scrollPrev")}
            className="absolute left-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-surface text-text-primary hover:bg-surface-muted border border-border-default shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => emblaApi?.scrollNext()}
            aria-label={tc("scrollNext")}
            className="absolute right-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-surface text-text-primary hover:bg-surface-muted border border-border-default shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => emblaApi?.scrollTo(i)}
                aria-label={t("goToSlide", { index: i + 1 })}
                aria-current={i === selected}
                className={cn(
                  "relative h-2 rounded-full transition-all before:absolute before:-inset-y-3 before:-inset-x-1 before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
                  i === selected ? "w-6 bg-surface" : "w-2 bg-surface-muted hover:bg-surface"
                )}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
