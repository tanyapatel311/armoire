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

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-mint/60 via-blush/40 to-mint/30" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-burgundy">
              Stop guessing.
              <br />
              <span className="text-brand">Start dressing.</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-burgundy/70 max-w-xl mx-auto">
              Your AI-powered wardrobe assistant. Upload your clothes, get
              personalized outfit recommendations, and never stare at your
              closet wondering what to wear again.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-brand hover:bg-brand-light text-lg px-8 py-6 gap-2"
                >
                  Get Started Free
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-6 border-burgundy/20 text-burgundy hover:bg-burgundy/5"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-b from-white to-blush/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-burgundy">
              Everything you need to look your best
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Armoire combines your entire wardrobe with AI styling to make
              getting dressed effortless.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="relative p-6 rounded-2xl bg-blush/30 border border-blush-dark/20 hover:shadow-lg hover:bg-blush/50 transition-all"
              >
                <div className="h-12 w-12 rounded-xl bg-brand flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-mint" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-burgundy">{feature.title}</h3>
                <p className="text-sm text-burgundy/60">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-b from-blush/20 to-mint/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-burgundy">
                Why Armoire?
              </h2>
              <p className="mt-4 text-lg text-burgundy/60">
                Unlike other fashion apps that show you clothes you don&apos;t own,
                Armoire works exclusively with YOUR wardrobe.
              </p>
              <ul className="mt-8 space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand flex-shrink-0" />
                    <span className="text-burgundy/80">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-mint via-blush/60 to-mint flex items-center justify-center shadow-xl">
                <Shirt className="h-32 w-32 text-burgundy/30" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-burgundy text-white">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Ready to transform your mornings?
          </h2>
          <p className="mt-4 text-lg text-blush/80">
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
        </div>
      </section>

      <footer className="border-t border-blush-dark/20 py-8 bg-blush/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo-v2.png" alt="Armoire" width={24} height={24} className="h-6 w-6 object-contain" />
            <span className="font-semibold text-burgundy">Armoire</span>
          </div>
          <p className="text-sm text-burgundy/50">
            Built by Tanya Patel
          </p>
        </div>
      </footer>
    </div>
  );
}
