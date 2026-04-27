"use client";

import { useRef, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import {
  Shirt,
  Sparkles,
  CalendarDays,
  Layers,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";

const features = [
  {
    icon: Shirt,
    title: "Digital Closet",
    description:
      "Upload photos of your clothes and organize them by category, season, and color. Finally see everything you own in one place.",
  },
  {
    icon: Sparkles,
    title: "AI Outfit Generator",
    description:
      "Get personalized outfit recommendations based on the occasion, weather, and your style preferences — using only your clothes.",
  },
  {
    icon: Layers,
    title: "Save & Organize",
    description:
      "Save your favorite AI-generated outfits and build a collection of go-to looks for any occasion.",
  },
  {
    icon: CalendarDays,
    title: "Outfit Calendar",
    description:
      "Track what you wear each day. Discover patterns, find favorites, and make sure your whole wardrobe gets love.",
  },
];

const benefits = [
  "Stop wearing the same 5 outfits on repeat",
  "Get dressed in minutes, not hours",
  "Rediscover clothes you forgot you owned",
  "AI suggestions based on YOUR actual closet",
  "Weather and occasion-aware recommendations",
  "100% free to use",
];

const HERO_SPARKLES: { id: string; top: string; left: string; size: string; delay: number; gold?: boolean }[] = [
  { id: "s1", top: "14%", left: "10%", size: "4px", delay: 0, gold: true },
  { id: "s2", top: "22%", left: "78%", size: "3px", delay: 0.4 },
  { id: "s3", top: "38%", left: "16%", size: "2px", delay: 0.8 },
  { id: "s4", top: "52%", left: "88%", size: "3px", delay: 1.1, gold: true },
  { id: "s5", top: "68%", left: "12%", size: "2px", delay: 0.2 },
  { id: "s6", top: "72%", left: "42%", size: "3px", delay: 1.6 },
  { id: "s7", top: "18%", left: "52%", size: "2px", delay: 0.6 },
  { id: "s8", top: "84%", left: "68%", size: "4px", delay: 1.2 },
  { id: "s9", top: "30%", left: "92%", size: "2px", delay: 0.9 },
  { id: "s10", top: "58%", left: "28%", size: "3px", delay: 1.4 },
  { id: "s11", top: "8%", left: "36%", size: "2px", delay: 0.3 },
  { id: "s12", top: "44%", left: "6%", size: "3px", delay: 1.0 },
  { id: "s13", top: "76%", left: "92%", size: "2px", delay: 0.5 },
  { id: "s14", top: "62%", left: "58%", size: "2px", delay: 1.3 },
  { id: "s15", top: "12%", left: "64%", size: "2px", delay: 0.7 },
];

const HERO_STARS: { id: string; top: string; left: string; w: number; delay: number }[] = [
  { id: "t1", top: "20%", left: "22%", w: 14, delay: 0.2 },
  { id: "t2", top: "36%", left: "84%", w: 10, delay: 0.9 },
  { id: "t3", top: "70%", left: "18%", w: 12, delay: 0.5 },
  { id: "t4", top: "78%", left: "76%", w: 11, delay: 1.1 },
  { id: "t5", top: "48%", left: "48%", w: 8, delay: 0.0 },
];

function useInView() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          obs.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, inView };
}

function FadeIn({
  children,
  delay = 0,
  className = "",
  direction = "up",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  direction?: "up" | "down" | "left" | "right";
}) {
  const { ref, inView } = useInView();
  const transforms: Record<string, string> = {
    up: "translateY(40px)",
    down: "translateY(-40px)",
    left: "translateX(40px)",
    right: "translateX(-40px)",
  };
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translate(0)" : transforms[direction],
        transition: `opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.documentElement.style.scrollSnapType = "y proximity";
    return () => {
      document.documentElement.style.scrollSnapType = "";
    };
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* ───── Hero (sticky — covered by next section as you scroll) ───── */}
      <div className="snap-start min-h-[180vh] sm:min-h-0 sm:h-[180vh]">
        <section className="sticky top-0 z-10 flex min-h-screen min-h-[100dvh] w-full items-center justify-center overflow-x-hidden px-0 pt-16 pb-10 sm:pt-0 sm:pb-0 sm:min-h-0 sm:h-screen">
          <div className="absolute inset-0 z-0 bg-ivory" />
          <div className="absolute inset-0 z-0 animated-gradient" aria-hidden />
          <div
            className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-b from-[#E8D4C0]/25 via-teal-600/[0.05] to-[#3B0A14]/[0.1]"
            aria-hidden
          />

          <div className="hero-sparkles" aria-hidden>
            {HERO_SPARKLES.map((s) => (
              <span
                key={s.id}
                className={`hero-sparkle ${s.gold ? "hero-sparkle--gold" : ""}`}
                style={{
                  top: s.top,
                  left: s.left,
                  width: s.size,
                  height: s.size,
                  animationDelay: `${s.delay}s, ${(s.delay * 0.3).toFixed(1)}s`,
                }}
              />
            ))}
            {HERO_STARS.map((st) => (
              <svg
                key={st.id}
                className="hero-star"
                style={{
                  top: st.top,
                  left: st.left,
                  width: st.w,
                  height: st.w,
                  animationDelay: `${st.delay}s`,
                }}
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M12 1l2.2 6.8H21l-5.5 4 2.1 6.5L12 15.8l-5.6 3.5 2.1-6.5L3 7.8h6.8L12 1z" />
              </svg>
            ))}
          </div>

          <div className="relative z-10 mx-auto w-full max-w-2xl text-center px-4 sm:px-5">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight [text-shadow:0_1px_1px_rgba(255,255,255,0.5)] break-words">
              {["Stop", "guessing."].map((word, i) => (
                <span
                  key={`line1-${i}`}
                  className={`inline-block text-burgundy ${mounted ? "animate-word-up" : "opacity-0"}`}
                  style={{ animationDelay: `${0.3 + i * 0.15}s` }}
                >
                  {word}&nbsp;
                </span>
              ))}
              <br />
              {["Start", "dressing."].map((word, i) => (
                <span
                  key={`line2-${i}`}
                  className={`inline-block text-brand ${mounted ? "animate-word-up" : "opacity-0"}`}
                  style={{ animationDelay: `${0.65 + i * 0.15}s` }}
                >
                  {word}&nbsp;
                </span>
              ))}
            </h1>

            <p
              className={`mt-6 text-lg sm:text-xl text-burgundy/70 max-w-xl mx-auto transition-all duration-1000 ease-out ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
              style={{ transitionDelay: "1.1s" }}
            >
              Your AI-powered wardrobe assistant. Upload your clothes, get
              personalized outfit recommendations, and never stare at your
              closet wondering what to wear again.
            </p>

            <div
              className={`mt-8 sm:mt-10 flex w-full max-w-md sm:max-w-none mx-auto flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 transition-all duration-1000 ease-out ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
              style={{ transitionDelay: "1.4s" }}
            >
              <Link href="/signup" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-burgundy hover:bg-burgundy-light text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 gap-2 rounded-xl shadow-lg"
                >
                  Get Started Free
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/closet" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 border-burgundy/20 text-burgundy hover:bg-burgundy/5 rounded-xl"
                >
                  Try Without Account
                </Button>
              </Link>
            </div>
          </div>

          {/* Scroll indicator */}
          <div
            className={`absolute bottom-[max(1.25rem,env(safe-area-inset-bottom,0px))] left-1/2 z-20 -translate-x-1/2 flex flex-col items-center gap-1 transition-opacity duration-1000 ${
              mounted ? "opacity-100" : "opacity-0"
            }`}
            style={{ transitionDelay: "2s" }}
          >
            <span className="text-xs text-taupe/50 tracking-widest uppercase">
              Scroll
            </span>
            <ChevronDown className="h-5 w-5 text-taupe/40 animate-bounce" />
          </div>
        </section>
      </div>

      {/* ───── Features (slides over the hero) ───── */}
      <section className="relative z-20 bg-ivory rounded-t-[2.5rem] shadow-[0_-20px_60px_rgba(0,0,0,0.08)] py-24 snap-start">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-burgundy">
              Everything you need to look your best
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Armoire combines your entire wardrobe with AI styling to make
              getting dressed effortless.
            </p>
          </FadeIn>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, i) => (
              <FadeIn key={feature.title} delay={i * 0.12}>
                <div className="relative rounded-2xl p-7 bg-cream/60 border border-taupe/20 hover:shadow-lg hover:bg-cream hover:-translate-y-1 transition-all group">
                  <div className="h-12 w-12 rounded-xl bg-burgundy flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="h-6 w-6 text-blush" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg mb-2 text-burgundy">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-taupe">
                    {feature.description}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Benefits ───── */}
      <section className="relative z-20 py-24 bg-gradient-to-b from-ivory to-cream/40 snap-start">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <FadeIn direction="right">
                <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-burgundy">
                  Why Armoire?
                </h2>
                <p className="mt-4 text-lg text-taupe">
                  Unlike other fashion apps that show you clothes you
                  don&apos;t own, Armoire works exclusively with YOUR wardrobe.
                </p>
              </FadeIn>
              <FadeIn direction="right" delay={0.2}>
                <ul className="mt-8 space-y-4">
                  {benefits.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-brand flex-shrink-0" />
                      <span className="text-burgundy/70">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </FadeIn>
            </div>

            <FadeIn direction="left" delay={0.2}>
              <div className="relative">
                <div className="aspect-square rounded-2xl bg-gradient-to-br from-mint via-cream to-mint flex items-center justify-center shadow-xl">
                  <Shirt className="h-32 w-32 text-burgundy/30" />
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ───── CTA ───── */}
      <section className="relative z-20 py-24 bg-burgundy text-white snap-start">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <FadeIn>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight">
              Ready to transform your mornings?
            </h2>
            <p className="mt-4 text-lg text-blush/70">
              Join Armoire and let AI help you make the most of your wardrobe.
            </p>
            <div className="mt-10">
              <Link href="/signup">
                <button className="bg-brand hover:bg-brand-light text-white text-lg px-8 py-4 rounded-lg font-medium gap-2 inline-flex items-center transition-colors">
                  Create Your Free Account
                  <ArrowRight className="h-5 w-5" />
                </button>
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ───── Footer ───── */}
      <footer className="relative z-20 border-t border-taupe/20 py-8 bg-cream/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <Image
              src="/logo-v2.png"
              alt="Armoire"
              width={24}
              height={24}
              className="h-6 w-6 object-contain"
            />
            <span className="font-heading font-semibold text-burgundy">Armoire</span>
          </div>
          <p className="text-sm text-taupe/70 text-center sm:text-right">Built by Tanya Patel</p>
        </div>
      </footer>
    </div>
  );
}
