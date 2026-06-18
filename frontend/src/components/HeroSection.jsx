import Link from "next/link";
import { ArrowRight, BadgeCheck, Star, Zap } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden py-4">
      {/* Background Decorative Orbs */}
      <div className="absolute top-[-10%] right-[-5%] w-[600px] aspect-square rounded-full bg-gradient-to-br from-blue-200/30 to-indigo-200/30 blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: "10s" }} />
      <div className="absolute bottom-[-20%] left-[-5%] w-[500px] aspect-square rounded-full bg-gradient-to-br from-indigo-200/20 to-purple-200/20 blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: "7s" }} />

      <div className="max-w-6xl mx-auto px-5 md:px-12 pt-16 pb-8 md:pt-24 md:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left: Text Content */}
          <div className="flex flex-col items-start text-left">
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 bg-(--color-secondary-container) text-(--color-on-secondary-container) px-4 py-2 rounded-full text-xs font-bold mb-8 shadow-sm hover:scale-[1.02] transition-transform">
              <BadgeCheck className="w-4 h-4 shrink-0" strokeWidth={2.5} />
              10,000+ Verified Workers
            </div>

            {/* Headline */}
            <h1 className="text-headline-xl-mobile md:text-headline-xl text-(--color-primary) mb-6 leading-tight">
              Help when you need it.
              <br />
              <span className="bg-gradient-to-r from-(--color-primary) via-indigo-600 to-blue-500 bg-clip-text text-transparent">
                Work when you want it.
              </span>
            </h1>

            <p className="text-body-lg text-(--color-on-surface-variant) mb-10 leading-relaxed max-w-lg">
              The trusted marketplace connecting households and businesses with
              verified local workers. Safe, simple, and community-driven.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link
                href="/signup"
                id="hero-get-started"
                className="bg-gradient-to-r from-(--color-primary) to-indigo-700 text-(--color-on-primary) py-4 px-8 rounded-(--radius-md) font-bold text-body-md flex items-center justify-center gap-2 shadow-level-2 hover:shadow-level-3 hover:translate-y-[-2px] active:translate-y-[0px] transition-all"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
              </Link>
              <Link
                href="/find-help"
                id="hero-find-help"
                className="bg-white text-(--color-primary) border border-(--color-outline-variant)/50 py-4 px-8 rounded-(--radius-md) font-bold text-body-md flex items-center justify-center shadow-level-1 hover:bg-gray-50 hover:border-(--color-primary)/50 hover:translate-y-[-2px] active:translate-y-[0px] transition-all"
              >
                Browse Services
              </Link>
            </div>

            {/* Social proof row */}
            <div className="flex items-center gap-3 mt-8">
              <div className="flex -space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-200 border-2 border-white flex items-center justify-center text-xs font-bold select-none shadow-sm">👩🏽‍💼</div>
                <div className="w-8 h-8 rounded-full bg-blue-200 border-2 border-white flex items-center justify-center text-xs font-bold select-none shadow-sm">👨🏼‍💻</div>
                <div className="w-8 h-8 rounded-full bg-emerald-200 border-2 border-white flex items-center justify-center text-xs font-bold select-none shadow-sm">🙋🏾‍♂️</div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex text-amber-400 text-sm">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" strokeWidth={0} />
                  ))}
                </div>
                <span className="text-xs font-semibold text-(--color-on-surface-variant)">
                  4.9/5 from 2,000+ households
                </span>
              </div>
            </div>
          </div>

          {/* Right: Visual Card */}
          <div className="relative flex justify-center lg:justify-end">
            {/* Main Card */}
            <div className="relative w-[300px] sm:w-[340px] aspect-[4/5] bg-white rounded-(--radius-xl) shadow-level-3 flex items-end justify-center overflow-hidden border border-(--color-outline-variant)/20 hover:shadow-level-3 transition-all duration-300">
              <img 
                src="/hero_illustration.png" 
                alt="Community workers and household client connecting"
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
              {/* Inner gradient overlay */}
              <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
            </div>

            {/* Floating: Rate Badge */}
            <div className="absolute top-4 -left-4 sm:-left-8 bg-white px-4 py-2.5 rounded-xl shadow-level-3 flex items-center gap-2.5 border border-gray-100 animate-bounce" style={{ animationDuration: "4s" }}>
              <div className="bg-blue-100 p-1.5 rounded-lg text-(--color-primary)">
                <Zap className="w-4 h-4" strokeWidth={2.5} />
              </div>
              <div>
                <div className="text-[10px] font-semibold text-(--color-on-surface-variant)">Avg. Rate</div>
                <div className="text-sm font-bold text-(--color-primary)">FCFA 2,500/hr</div>
              </div>
            </div>

            {/* Floating: Job Complete Badge */}
            <div className="absolute bottom-10 -right-4 sm:-right-8 bg-(--color-secondary-fixed) text-(--color-on-secondary-fixed) p-4 rounded-2xl max-w-[190px] shadow-level-3 text-left transform rotate-2 hover:rotate-0 transition-transform duration-300">
              <div className="flex items-center gap-1.5 text-xs font-bold mb-1">
                <BadgeCheck className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
                Job Complete ✓
              </div>
              <p className="text-xs font-medium leading-normal italic opacity-90">
                &ldquo;Alex was amazing helping with my garden project!&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
