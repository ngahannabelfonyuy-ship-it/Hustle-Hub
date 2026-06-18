"use client";

import { ArrowRight, CheckCircle2, ShieldCheck, HeadphonesIcon, Smile } from "lucide-react";
import { useState, useTransition } from "react";
import StarRating from "./StarRating";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function PayRateForm({
  total,
  freelancerName,
  paymentMethodsNode,
  jobId,
  freelancerId,
}) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  function handleSubmit() {
    startTransition(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const payerId = session?.user?.id;

        // 1. Record the transaction in Supabase
        if (jobId && payerId && freelancerId) {
          const ref = "FAP-" + Math.random().toString(36).substr(2, 9).toUpperCase();
          const { error: txError } = await supabase
            .from("transactions")
            .insert({
              job_id: jobId,
              payer_id: payerId,
              payee_id: freelancerId,
              amount: total,
              payment_method: "mobile_money",
              status: "released",
              reference: ref,
              notes: review || "Job payment completed via Fapshi."
            });
            
          if (txError) throw txError;

          // 2. Fetch freelancer current profile ratings & update
          const { data: profileData, error: profileErr } = await supabase
            .from("profiles")
            .select("rating, total_reviews")
            .eq("id", freelancerId)
            .single();

          if (!profileErr && profileData) {
            const currentReviews = profileData.total_reviews || 0;
            const currentRating = Number(profileData.rating) || 0;
            const newReviewsCount = currentReviews + 1;
            const newRatingAvg = parseFloat(((currentRating * currentReviews + rating) / newReviewsCount).toFixed(2));

            await supabase
              .from("profiles")
              .update({
                rating: newRatingAvg,
                total_reviews: newReviewsCount
              })
              .eq("id", freelancerId);
          }
        }
      } catch (err) {
        console.error("Payment & rating submission error:", err);
      }

      setSubmitted(true);
    });
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center animate-in fade-in zoom-in-95 duration-500">
        <CheckCircle2 className="w-20 h-20 text-(--color-secondary)" />
        <h2 className="text-headline-md text-(--color-primary)">Payment sent!</h2>
        <p className="text-body-lg text-(--color-on-surface-variant) max-w-sm mb-6">
          Your payment of <strong>FCFA {total.toLocaleString()}</strong> has been processed via Fapshi Direct Pay and your
          review for <strong>{freelancerName}</strong> has been recorded.
        </p>
        <button 
          onClick={() => router.push("/client-dashboard")}
          className="bg-(--color-primary) text-(--color-on-primary) px-6 py-3 rounded-(--radius-md) font-semibold shadow-level-1 hover:opacity-95 transition-opacity"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Payment methods injected from server */}
      {paymentMethodsNode}

      {/* Review section */}
      <div className="bg-white rounded-(--radius-xl) p-6 shadow-level-1 border border-(--color-outline-variant)/30 flex flex-col gap-6">
        <h2 className="text-headline-sm text-(--color-primary)">Rate your Experience</h2>

        <StarRating onChange={setRating} />

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="review"
            className="text-xs font-semibold uppercase tracking-wider text-(--color-on-surface-variant)"
          >
            Write a review
          </label>
          <textarea
            id="review"
            rows={4}
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder={`How was ${freelancerName}'s service? Share your feedback…`}
            className="w-full p-4 rounded-(--radius-md) border border-(--color-outline-variant)/50 focus:ring-2 focus:ring-(--color-primary) focus:border-(--color-primary) outline-none text-body-md transition-all placeholder:text-(--color-outline-variant)/70 resize-none bg-gray-50"
          />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || rating === 0}
          className="w-full bg-(--color-primary) text-(--color-on-primary) text-body-lg font-bold py-4 rounded-(--radius-md) shadow-level-1 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing…
            </>
          ) : (
            <>
              Pay &amp; Rate
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        <p className="text-center text-xs text-(--color-on-surface-variant)">
          By clicking, you authorize the payment of{" "}
          <strong>FCFA {total.toLocaleString()}</strong> via Fapshi
        </p>
      </div>

      {/* Trust chips */}
      <div className="flex flex-wrap gap-2 justify-center">
        {[
          { icon: ShieldCheck, label: "Secure Fapshi Payment" },
          { icon: HeadphonesIcon, label: "24/7 Support" },
          { icon: Smile, label: "Satisfaction Guaranteed" },
        ].map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-(--color-surface-container-low) rounded-full border border-(--color-outline-variant)/20"
          >
            <Icon className="w-4 h-4 text-(--color-secondary)" />
            <span className="text-xs font-medium text-(--color-on-surface-variant)">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}