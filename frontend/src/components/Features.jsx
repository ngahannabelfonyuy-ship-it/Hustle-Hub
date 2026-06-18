import Link from "next/link";
import { ShieldCheck, UserCheck, Heart, Headphones, ArrowRight } from "lucide-react";

const features = [
  {
    title: "Identity Verified",
    desc: "Every worker on HustleHub passes our rigorous identity verification before they can connect with clients.",
    icon: <UserCheck className="w-6 h-6" strokeWidth={2} />,
    color: "text-(--color-primary)",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  {
    title: "Safe Connections",
    desc: "We vet every profile so you can connect with confidence. Both workers and clients are reviewed before joining.",
    icon: <ShieldCheck className="w-6 h-6" strokeWidth={2} />,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
  },
  {
    title: "Local Community",
    desc: "All workers are from your local area — helping build stronger community bonds and faster response times.",
    icon: <Heart className="w-6 h-6" strokeWidth={2} />,
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-100",
  },
  {
    title: "24/7 Support",
    desc: "Our dedicated support team is always available to resolve issues and ensure every connection goes smoothly.",
    icon: <Headphones className="w-6 h-6" strokeWidth={2} />,
    color: "text-indigo-700",
    bg: "bg-indigo-50",
    border: "border-indigo-100",
  },
];

export default function Features() {
  return (
    <section className="py-24 px-5 md:px-12 bg-white relative">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-(--color-primary) bg-blue-50 px-4 py-2 rounded-full border border-blue-100 shadow-sm">
            Why HustleHub
          </span>
          <h2 className="text-headline-lg text-(--color-primary) mt-5 mb-4">
            Built for trust & community
          </h2>
          <p className="text-body-md text-(--color-on-surface-variant) max-w-xl mx-auto leading-relaxed">
            We&apos;ve built every feature with the safety and satisfaction of both clients and workers in mind.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feat, i) => (
            <div
              key={i}
              className={`bg-white border ${feat.border} rounded-(--radius-xl) p-8 shadow-level-1 hover:shadow-level-3 hover:translate-y-[-6px] transition-all duration-300 group flex flex-col items-start`}
            >
              <div className={`w-14 h-14 ${feat.bg} rounded-2xl flex items-center justify-center ${feat.color} mb-6 group-hover:rotate-[6deg] group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                {feat.icon}
              </div>
              <h3 className="text-headline-sm font-bold text-(--color-on-background) mb-3">
                {feat.title}
              </h3>
              <p className="text-body-sm text-(--color-on-surface-variant) leading-relaxed">
                {feat.desc}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Row */}
        <div className="text-center">
          <Link
            href="/trust-safety"
            className="inline-flex items-center gap-2 text-body-md font-bold text-(--color-primary) hover:gap-3 transition-all duration-200 group bg-blue-50/50 hover:bg-blue-50 px-6 py-3 rounded-full border border-blue-100/30"
          >
            Learn more about our safety standards
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
        </div>
      </div>
    </section>
  );
}
