import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import PaymentMethodSelector from "@/components/PaymentMethodSelector";
import PayRateForm from "@/components/PayRateForm";

export default async function PaymentReviewPage({ params }) {
  const resolvedParams = await params;
  const jobId = resolvedParams?.jobId;
  
  let job = { title: "Unknown Job", budget: 0 };
  let freelancer = { name: "Unknown Worker", avatar_url: "", badge: "" };
  
  if (jobId) {
    const { data } = await supabase
      .from("jobs")
      .select("*, provider:profiles!jobs_provider_id_fkey(*)")
      .eq("id", jobId)
      .single();
      
    if (data) {
      job = data;
      freelancer = data.provider || freelancer;
    }
  }

  const payment_methods = [
    { id: "fapshi", label: "Fapshi", detail: "Pay via Mobile Money", icon: "payments" }
  ];

  const subtotal = job.budget;
  const service_fee = 0; // Or calculate if needed
  const total = subtotal + service_fee;

  return (
    <div className="bg-(--color-background) text-(--color-on-background) min-h-screen flex flex-col">
      {/* ── Top App Bar ──────────────────────────────────────────────────── */}
      <header className="bg-white shadow-sm border-b border-(--color-outline-variant)/20 flex justify-between items-center px-5 md:px-12 h-16 w-full z-50 sticky top-0">
        <div className="flex items-center gap-4">
          <Link
            href="/client-dashboard"
            aria-label="Go back to dashboard"
            className="text-(--color-primary) hover:bg-blue-50 transition-colors p-2 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="font-bold text-lg font-[family-name:--font-headline] text-(--color-primary)">
            HustleHub
          </span>
        </div>
      </header>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <main className="w-full max-w-[1280px] mx-auto px-5 md:px-12 pt-12 pb-32 flex flex-col gap-10">
        {/* ── Hero: Job Status ─────────────────────────────────────────── */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-white p-8 rounded-(--radius-xl) shadow-sm border border-(--color-outline-variant)/30">
          {/* Left copy */}
          <div className="md:col-span-8 flex flex-col items-start gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-full">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Job Completed</span>
            </div>

            <h1 className="text-headline-lg text-(--color-primary) mt-1 leading-tight">
              {job.title}
            </h1>

            <p className="text-body-md text-(--color-on-surface-variant) max-w-xl">
              <strong>{freelancer.name}</strong> successfully completed your project. Please
              review the payment breakdown below, complete the transaction via Fapshi, and rate their service.
            </p>
          </div>

          {/* Right avatar */}
          <div className="md:col-span-4 flex justify-center md:justify-end">
            <div className="relative w-32 h-32 md:w-40 md:h-40">
              <img
                src={freelancer.avatar_url}
                alt={`${freelancer.name} profile photo`}
                className="w-full h-full object-cover rounded-full border-4 border-white shadow-level-2"
              />
              {freelancer.badge && (
                <div className="absolute -bottom-2 -right-2 bg-white px-3 py-1.5 rounded-xl shadow-level-1 flex items-center gap-1.5 border border-(--color-outline-variant)/20">
                  <BadgeCheck className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-bold text-(--color-primary)">
                    {freelancer.badge}
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Two-column layout ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Left: Payment Breakdown */}
          <section className="flex flex-col gap-6">
            <div className="bg-white rounded-(--radius-xl) p-6 shadow-level-1 border border-(--color-outline-variant)/30">
              <h2 className="text-xl font-bold text-(--color-primary) mb-5">
                Payment Summary
              </h2>

              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center text-(--color-on-surface-variant)">
                  <span className="text-body-md">Subtotal</span>
                  <span className="text-body-md font-semibold text-(--color-on-background)">
                    FCFA {subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-(--color-on-surface-variant)">
                  <span className="text-body-md">Service Fee</span>
                  <span className="text-body-md font-semibold text-(--color-on-background)">
                    FCFA {service_fee.toLocaleString()}
                  </span>
                </div>

                <div className="my-2 border-t border-dashed border-(--color-outline-variant)/50" />

                <div className="flex justify-between items-center bg-gray-50 p-4 rounded-(--radius-md)">
                  <span className="text-lg font-bold text-(--color-primary)">Total due</span>
                  <span className="text-2xl font-bold text-(--color-primary)">
                    FCFA {total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment method card */}
            <div className="bg-white rounded-(--radius-xl) p-6 shadow-level-1 border border-(--color-outline-variant)/30">
              <h2 className="text-xl font-bold text-(--color-primary) mb-5">
                Select Payment Method
              </h2>
              <PaymentMethodSelector methods={payment_methods} />
            </div>
          </section>

          {/* Right: Interactive review + submit */}
          <section>
            <PayRateForm
              total={total}
              freelancerName={freelancer.name}
              paymentMethodsNode={null}
              jobId={jobId}
              freelancerId={freelancer.id}
            />
          </section>
        </div>
      </main>
    </div>
  );
}