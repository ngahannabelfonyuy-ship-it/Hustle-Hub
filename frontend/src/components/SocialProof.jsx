import { TrendingUp, Users, Briefcase, DollarSign } from "lucide-react";

const stats = [
  {
    label: "Verified Workers",
    value: "10,000+",
    icon: <Users className="w-5 h-5" strokeWidth={2} />,
    color: "text-(--color-primary)",
    bg: "bg-blue-50",
  },
  {
    label: "Tasks Completed",
    value: "45,000+",
    icon: <Briefcase className="w-5 h-5" strokeWidth={2} />,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
  },
  {
    label: "Avg. Hourly Rate",
    value: "FCFA 2,500",
    icon: <DollarSign className="w-5 h-5" strokeWidth={2} />,
    color: "text-indigo-700",
    bg: "bg-indigo-50",
  },
  {
    label: "5-Star Reviews",
    value: "98%",
    icon: <TrendingUp className="w-5 h-5" strokeWidth={2} />,
    color: "text-amber-700",
    bg: "bg-amber-50",
  },
];

export default function SocialProof() {
  return (
    <section className="border-y border-(--color-outline-variant)/25 bg-gradient-to-b from-(--color-surface-container-low) to-white py-12 px-5 relative overflow-hidden">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-white/60 backdrop-blur-sm border border-(--color-outline-variant)/20 rounded-(--radius-xl) p-6 flex flex-col items-center text-center gap-2 hover:shadow-level-2 hover:translate-y-[-4px] transition-all duration-300 group cursor-default"
          >
            <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color} mb-1 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
              {stat.icon}
            </div>
            <div className={`text-3xl font-extrabold tracking-tight bg-gradient-to-r from-(--color-primary) to-indigo-600 bg-clip-text text-transparent group-hover:from-indigo-600 group-hover:to-blue-500 transition-colors`}>
              {stat.value}
            </div>
            <div className="text-[10px] font-bold text-(--color-on-surface-variant) uppercase tracking-widest mt-1">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
