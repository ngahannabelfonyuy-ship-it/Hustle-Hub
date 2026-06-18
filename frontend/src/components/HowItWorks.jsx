import Link from "next/link";
import { ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Create Your Account",
    desc: "Sign up as someone needing help or a worker looking for flexible gig opportunities. Getting set up takes just a few minutes.",
    emoji: "",
  },
  {
    number: "02",
    title: "Post a Task or Browse Gigs",
    desc: "Clients post their tasks with details and a proposed rate. Workers browse available listings that match their skills and schedule.",
    emoji: "",
  },
  {
    number: "03",
    title: "Connect & Agree",
    desc: "Workers apply to listings. Clients review profiles and ratings then choose the right person. Both parties agree on expectations upfront.",
    emoji: "",
  },
  {
    number: "04",
    title: "Get the Job Done",
    desc: "The worker completes the task, and the two parties handle payment directly between themselves. Leave a review to help the community!",
    emoji: "",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-gradient-to-b from-(--color-surface-container-low) to-(--color-background) border-t border-(--color-outline-variant)/25 py-24 px-5 md:px-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-(--color-secondary) bg-(--color-secondary-container) px-4 py-2 rounded-full border border-emerald-100 shadow-sm">
            How It Works
          </span>
          <h2 className="text-headline-lg text-(--color-primary) mt-5 mb-4">
            Simple steps to get started
          </h2>
          <p className="text-body-md text-(--color-on-surface-variant) max-w-xl mx-auto leading-relaxed">
            Whether you need a helping hand or want to offer your skills — getting started on HustleHub is quick and easy.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {steps.map((step, i) => (
            <div key={i} className="relative group">
              {/* Connector Line */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[calc(100%)] w-full h-[2px] bg-gradient-to-r from-(--color-outline-variant)/40 to-transparent z-0 translate-y-[-50%] translate-x-[-50%]" />
              )}
              <div className="bg-white border border-(--color-outline-variant)/25 rounded-(--radius-xl) p-8 shadow-level-1 hover:shadow-level-2 transition-all duration-300 h-full relative z-10 hover:translate-y-[-4px]">
                {/* Step number & Badge */}
                <div className="flex items-center justify-between mb-5">
                  <span className="text-3xl select-none">{step.emoji}</span>
                  <span className="text-xs font-bold text-(--color-primary) bg-blue-50/80 px-2.5 py-1 rounded-full border border-blue-100 tracking-widest">
                    STEP {step.number}
                  </span>
                </div>
                <h3 className="text-headline-sm font-bold text-(--color-on-background) mb-2.5">
                  {step.title}
                </h3>
                <p className="text-body-sm text-(--color-on-surface-variant) leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Split */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link
            href="/find-help"
            className="group flex items-center justify-between bg-gradient-to-br from-(--color-primary) via-(--color-primary-container) to-indigo-900 text-white rounded-(--radius-xl) p-8 md:p-10 shadow-level-2 hover:shadow-level-3 hover:scale-[1.01] transition-all duration-300 border border-white/10"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-2.5">Need Help?</p>
              <h3 className="text-headline-sm font-extrabold mb-1.5 leading-snug">Find a Local Worker</h3>
              <p className="text-sm text-blue-100/90 leading-relaxed max-w-xs">Post your task and get connected to verified help fast.</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-(--color-primary) transition-all duration-300 shadow-sm">
              <ArrowRight className="w-5 h-5 shrink-0 group-hover:translate-x-0.5 transition-transform duration-300" />
            </div>
          </Link>
          <Link
            href="/find-work"
            className="group flex items-center justify-between bg-gradient-to-br from-(--color-secondary) via-emerald-800 to-teal-900 text-white rounded-(--radius-xl) p-8 md:p-10 shadow-level-2 hover:shadow-level-3 hover:scale-[1.01] transition-all duration-300 border border-white/10"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-200 mb-2.5">Want to Work?</p>
              <h3 className="text-headline-sm font-extrabold mb-1.5 leading-snug">Offer Your Skills</h3>
              <p className="text-sm text-emerald-100/90 leading-relaxed max-w-xs">Browse gigs nearby that fit your calendar and skills.</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-(--color-secondary) transition-all duration-300 shadow-sm">
              <ArrowRight className="w-5 h-5 shrink-0 group-hover:translate-x-0.5 transition-transform duration-300" />
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
