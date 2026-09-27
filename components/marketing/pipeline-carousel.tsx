"use client";

import { useEffect, useState } from "react";
import Carousel, { type CarouselItem } from "@/components/reactbits/Carousel";
import { PIPELINE_STAGES } from "@/lib/pipeline";

/**
 * PipelineCarousel — the unified production-steps carousel (react-bits).
 *
 * One elegant component replaces both the old background card ribbon and the
 * old floating step card. It cycles the seven real pipeline stages with the
 * component's spring/drag physics:
 *   - autoplay every 2s, pause on hover, endless loop, draggable
 *   - round cards, VOVO palette (cream / green icons / gold active state)
 *   - responsive baseWidth (250 desktop → 210 tablet → 170 mobile)
 *   - prefers-reduced-motion: autoplay disabled (manual drag only)
 */
export function PipelineCarousel() {
  const [baseWidth, setBaseWidth] = useState(250);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMq = () => setReduced(mq.matches);
    setReduced(mq.matches);
    mq.addEventListener("change", onMq);

    const compute = () => {
      const w = window.innerWidth;
      setBaseWidth(w >= 1024 ? 250 : w >= 640 ? 220 : 200);
    };
    compute();
    window.addEventListener("resize", compute);

    return () => {
      mq.removeEventListener("change", onMq);
      window.removeEventListener("resize", compute);
    };
  }, []);

  const items: CarouselItem[] = PIPELINE_STAGES.map((stage, i) => {
    const Icon = stage.icon;
    return {
      id: i + 1,
      title: stage.label,
      caption: `Step ${i + 1}`,
      description: stage.description,
      icon: <Icon className="carousel-icon" strokeWidth={2} />,
    };
  });

  return (
    <div className="flex justify-center">
      <Carousel
        items={items}
        baseWidth={baseWidth}
        round={false}
        autoplay={!reduced}
        autoplayDelay={2000}
        pauseOnHover={true}
        loop={true}
      />
    </div>
  );
}
