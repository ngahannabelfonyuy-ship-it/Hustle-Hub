import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Aline T.",
    role: "Homeowner, Douala",
    avatar: "👩🏽",
    rating: 5,
    text: "I found a fantastic student to help me set up my home office. He was punctual, professional, and affordable. I've booked him twice more since then!",
  },
  {
    name: "Boris N.",
    role: "Student, Univ of Buea",
    avatar: "🧑🏼‍🎓",
    rating: 5,
    text: "HustleHub has been a game-changer for my finances. I earn FCFA 15,000–30,000 extra per week doing yard work and moving help around my class schedule.",
  },
  {
    name: "Mireille E.",
    role: "Parent of 3, Yaoundé",
    avatar: "👩🏻",
    rating: 5,
    text: "I love that every worker is a verified student. It feels so much safer than random apps. Our house helper Emma has become like part of the family.",
  },
  {
    name: "Jean-Paul M.",
    role: "Student, Univ of Dschang",
    avatar: "🧑🏾‍💼",
    rating: 5,
    text: "The freedom to set my own rates and choose which jobs I take is unmatched. I've made more here than any part-time retail job I've ever had.",
  },
];

export default function Testimonials() {
  const avatarColors = [
    "bg-indigo-100 text-indigo-700",
    "bg-emerald-100 text-emerald-700",
    "bg-rose-100 text-rose-700",
    "bg-amber-100 text-amber-700"
  ];
  return (
    <section className="py-24 px-5 md:px-12 overflow-hidden bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-50 px-4 py-2 rounded-full border border-amber-100 shadow-sm">
            Real Reviews
          </span>
          <h2 className="text-headline-lg text-(--color-primary) mt-5 mb-4">
            Loved by households & students
          </h2>
          <p className="text-body-md text-(--color-on-surface-variant) max-w-xl mx-auto leading-relaxed">
            Don&apos;t take our word for it — here&apos;s what our community says about using HustleHub.
          </p>
        </div>

        {/* Testimonial Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="bg-white border border-(--color-outline-variant)/20 rounded-(--radius-xl) p-8 shadow-level-1 hover:shadow-level-3 hover:translate-y-[-4px] transition-all duration-300 relative group"
            >
              {/* Quote Icon */}
              <div className="absolute top-8 right-8 text-(--color-outline-variant)/30 group-hover:text-indigo-400/20 transition-colors">
                <Quote className="w-10 h-10 fill-current" strokeWidth={0} />
              </div>

              {/* Stars */}
              <div className="flex gap-1 mb-5">
                {[...Array(t.rating)].map((_, si) => (
                  <Star key={si} className="w-4 h-4 fill-amber-400 text-amber-400" strokeWidth={0} />
                ))}
              </div>

              {/* Review Text */}
              <p className="text-body-sm text-(--color-on-background) leading-relaxed mb-8 font-medium text-gray-800 italic">
                &ldquo;{t.text}&rdquo;
              </p>

              {/* Reviewer */}
              <div className="flex items-center gap-3.5 pt-5 border-t border-(--color-outline-variant)/15">
                <div className={`w-11 h-11 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center font-bold text-sm select-none shadow-sm`}>
                  {t.name.split(" ")[0].charAt(0)}{t.name.split(" ").length > 1 ? t.name.split(" ")[1].charAt(0) : ""}
                </div>
                <div>
                  <div className="text-body-sm font-bold text-(--color-on-background)">{t.name}</div>
                  <div className="text-xs text-(--color-on-surface-variant) font-semibold mt-0.5">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
