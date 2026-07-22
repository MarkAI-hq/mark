import Link from "next/link";
import { Compass, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LearningCompassCtaSection() {
  return (
    <section className="relative overflow-hidden bg-background px-4 py-20 sm:py-24">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_70%_50%,hsl(42_75%_33%/0.05),transparent)]" />
      <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-6 rounded-3xl border border-gold/20 bg-card/60 px-6 py-14 text-center sm:px-14">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10">
          <Compass className="h-7 w-7 text-gold" />
        </div>
        <h2 className="font-[family-name:var(--font-spectral)] text-3xl font-semibold sm:text-4xl">
          Not sure where to start? Find out how you learn.
        </h2>
        <p className="max-w-xl text-muted-foreground">
          The Learning Compass is a free, two-minute assessment that gives you a personal learning
          profile and a matched toolkit — no sign-up required.
        </p>
        <Button asChild size="lg" variant="gold" className="gap-2 font-bold">
          <Link href="/learning-compass">
            Take the free Learning Compass
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
