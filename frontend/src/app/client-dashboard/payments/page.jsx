"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  CreditCard,
  Lock,
  TrendingUp,
  ArrowDownLeft,
  Info,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  AlertCircle,
  Plus,
  X,
  Smartphone,
  Banknote,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// Transaction status metadata
// ─────────────────────────────────────────────
const TX_STATUS_META = {
  pending:        { label: "Pending",        color: "bg-gray-100 text-gray-700",       icon: Clock },
  held_in_escrow: { label: "Held in Escrow", color: "bg-amber-100 text-amber-800",     icon: Lock },
  released:       { label: "Released",       color: "bg-emerald-100 text-emerald-800",  icon: CheckCircle2 },
  refunded:       { label: "Refunded",       color: "bg-blue-100 text-blue-800",        icon: RefreshCw },
  failed:         { label: "Failed",         color: "bg-red-100 text-red-800",          icon: XCircle },
};

const PAYMENT_METHOD_LABELS = {
  mobile_money: "Mobile Money",
  card:         "Card",
  cash:         "Cash",
  escrow:       "Escrow",
};

const PAYMENT_METHOD_ICONS = {
  mobile_money: Smartphone,
  card:         CreditCard,
  cash:         Banknote,
};

// ─────────────────────────────────────────────
// Toast Component
// ─────────────────────────────────────────────
function Toast({ message }) {
  if (!message) return null;
  const isError = message.type === "error";
  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-(--radius-md) text-sm font-semibold shadow-level-3 border animate-in slide-in-from-bottom-4",
        isError
          ? "bg-red-50 text-red-800 border-red-200"
          : "bg-emerald-50 text-emerald-800 border-emerald-200"
      )}
    >
      {isError ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
      {message.text}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function ClientPaymentsPage() {
  const [transactions, setTransactions] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [toast, setToast] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  // New Payment modal state
  const [showPayModal, setShowPayModal] = useState(false);
  const [payJobId, setPayJobId] = useState("");
  const [payMethod, setPayMethod] = useState("mobile_money");
  const [payReference, setPayReference] = useState("");
  const [paySubmitting, setPaySubmitting] = useState(false);

  // Confirmation states
  const [actionLoading, setActionLoading] = useState(null); // tx.id being acted on

  // ── Load data ──
  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setLoading(false); return; }
      setCurrentUserId(session.user.id);

      const [txResult, jobsResult] = await Promise.all([
        supabase
          .from("transactions")
          .select("*, jobs(title, status), payee:profiles!transactions_payee_id_fkey(name, avatar_url)")
          .eq("payer_id", session.user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("jobs")
          .select("id, title, budget, status, provider_id, profiles!jobs_provider_id_fkey(name)")
          .eq("client_id", session.user.id)
          .in("status", ["open", "in_progress", "completed"]),
      ]);

      if (txResult.data) setTransactions(txResult.data);
      if (jobsResult.data) setJobs(jobsResult.data);
      setLoading(false);
    }
    load();
  }, []);

  // ── Toast helper ──
  function showToast(type, text) {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  }

  // ── Make Payment ──
  async function handleMakePayment(e) {
    e.preventDefault();
    if (!payJobId || !currentUserId) return;
    setPaySubmitting(true);

    const selectedJob = jobs.find((j) => j.id === payJobId);
    if (!selectedJob) {
      showToast("error", "Please select a valid job.");
      setPaySubmitting(false);
      return;
    }

    const { error } = await supabase.from("transactions").insert({
      job_id: payJobId,
      payer_id: currentUserId,
      payee_id: selectedJob.provider_id,
      amount: selectedJob.budget,
      payment_method: payMethod,
      status: payMethod === "cash" ? "pending" : "held_in_escrow",
      reference: payReference || null,
      notes: payMethod === "cash" ? "Cash payment — record only" : null,
    });

    setPaySubmitting(false);
    if (error) {
      showToast("error", "Failed to create payment. " + (error.message ?? ""));
    } else {
      showToast("success", "Payment created successfully. Funds are held in escrow.");
      setShowPayModal(false);
      setPayJobId("");
      setPayMethod("mobile_money");
      setPayReference("");
      // Reload transactions
      const { data } = await supabase
        .from("transactions")
        .select("*, jobs(title, status), payee:profiles!transactions_payee_id_fkey(name, avatar_url)")
        .eq("payer_id", currentUserId)
        .order("created_at", { ascending: false });
      if (data) setTransactions(data);
    }
  }

  // ── Confirm Job Completion (release escrow) ──
  async function handleConfirmCompletion(txId) {
    setActionLoading(txId);
    const { error } = await supabase
      .from("transactions")
      .update({ status: "released", updated_at: new Date().toISOString() })
      .eq("id", txId);

    setActionLoading(null);
    if (error) {
      showToast("error", "Failed to release payment.");
    } else {
      setTransactions((prev) =>
        prev.map((t) => (t.id === txId ? { ...t, status: "released" } : t))
      );
      showToast("success", "Payment released to provider. Job marked as completed.");
    }
  }

  // ── Request Refund ──
  async function handleRequestRefund(txId) {
    setActionLoading(txId);
    const { error } = await supabase
      .from("transactions")
      .update({ status: "refunded", updated_at: new Date().toISOString() })
      .eq("id", txId);

    setActionLoading(null);
    if (error) {
      showToast("error", "Failed to request refund.");
    } else {
      setTransactions((prev) =>
        prev.map((t) => (t.id === txId ? { ...t, status: "refunded" } : t))
      );
      showToast("success", "Refund requested. Funds will be returned to your account.");
    }
  }

  // ── Computed values ──
  const totalSpent = transactions
    .filter((t) => t.status === "released")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const activeEscrow = transactions
    .filter((t) => t.status === "held_in_escrow")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalReleased = transactions
    .filter((t) => t.status === "released")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const filteredTx = statusFilter === "all"
    ? transactions
    : transactions.filter((t) => t.status === statusFilter);

  const escrowTx = transactions.filter((t) => t.status === "held_in_escrow");

  // Jobs that don't yet have an escrow payment
  const payableJobs = jobs.filter((j) => {
    const hasTx = transactions.some(
      (t) => t.job_id === j.id && (t.status === "held_in_escrow" || t.status === "released")
    );
    return !hasTx && j.provider_id;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-md text-(--color-on-background)">Payments & Escrow</h1>
          <p className="text-body-sm text-(--color-on-surface-variant) mt-1">
            Manage payments, track escrow holds, and confirm job completions.
          </p>
        </div>
        <button
          onClick={() => setShowPayModal(true)}
          className="flex items-center gap-2 bg-(--color-primary) text-(--color-on-primary) px-5 py-2.5 rounded-(--radius-md) text-sm font-semibold shadow-level-1 hover:opacity-95 transition-all w-fit"
        >
          <Plus className="w-4 h-4" />
          Make Payment
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-(--radius-lg) border border-(--color-outline-variant)/30 shadow-sm">
          <div className="flex items-center gap-2 text-(--color-on-surface-variant) text-sm font-semibold mb-3">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            Total Spent
          </div>
          <div className="text-3xl font-bold text-(--color-on-background)">
            FCFA {totalSpent.toLocaleString()}
          </div>
          <p className="text-xs text-(--color-on-surface-variant) mt-1">From released payments</p>
        </div>

        <div className="bg-white p-6 rounded-(--radius-lg) border border-amber-200 bg-amber-50/40 shadow-sm">
          <div className="flex items-center gap-2 text-amber-700 text-sm font-semibold mb-3">
            <Lock className="w-4 h-4 text-amber-500" />
            Active Escrow
          </div>
          <div className="text-3xl font-bold text-amber-700">
            FCFA {activeEscrow.toLocaleString()}
          </div>
          <p className="text-xs text-amber-600 mt-1">Funds held for active jobs</p>
        </div>

        <div className="bg-white p-6 rounded-(--radius-lg) border border-(--color-outline-variant)/30 shadow-sm">
          <div className="flex items-center gap-2 text-(--color-on-surface-variant) text-sm font-semibold mb-3">
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
            Released Payments
          </div>
          <div className="text-3xl font-bold text-(--color-on-background)">
            FCFA {totalReleased.toLocaleString()}
          </div>
          <p className="text-xs text-(--color-on-surface-variant) mt-1">Successfully paid to providers</p>
        </div>
      </div>

      {/* Escrow Workflow Explainer */}
      <div className="bg-(--color-primary-container)/20 border border-(--color-primary)/20 rounded-(--radius-lg) p-5 flex gap-3">
        <Info className="w-5 h-5 text-(--color-primary) flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-(--color-primary) mb-1">Escrow Payment Workflow</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-(--color-on-surface-variant)">
            <span className="bg-white border rounded px-2 py-0.5 font-medium">You Pay</span>
            <span>→</span>
            <span className="bg-amber-100 text-amber-800 border border-amber-200 rounded px-2 py-0.5 font-medium">Funds Held in Escrow</span>
            <span>→</span>
            <span className="bg-blue-100 text-blue-800 border border-blue-200 rounded px-2 py-0.5 font-medium">Provider Completes Job</span>
            <span>→</span>
            <span className="bg-purple-100 text-purple-800 border border-purple-200 rounded px-2 py-0.5 font-medium">You Confirm Completion</span>
            <span>→</span>
            <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 rounded px-2 py-0.5 font-medium">Payment Released</span>
          </div>
        </div>
      </div>

      {/* Active Escrow Payments */}
      {escrowTx.length > 0 && (
        <div className="bg-white rounded-(--radius-lg) border border-amber-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-amber-100 bg-amber-50/30 flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-(--color-on-background)">
              Active Escrow ({escrowTx.length})
            </h2>
          </div>
          <div className="divide-y divide-(--color-outline-variant)/20">
            {escrowTx.map((tx) => (
              <div key={tx.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-amber-50/20 transition-colors">
                <div>
                  <h3 className="font-semibold text-(--color-on-background)">
                    {tx.jobs?.title ?? <span className="italic text-gray-400">General Payment</span>}
                  </h3>
                  <div className="flex items-center flex-wrap gap-2 text-xs text-(--color-on-surface-variant) mt-1">
                    <span>Provider: {tx.payee?.name ?? "—"}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span className="font-semibold text-amber-700">FCFA {Number(tx.amount).toLocaleString()}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span>{new Date(tx.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleRequestRefund(tx.id)}
                    disabled={actionLoading === tx.id}
                    className="flex items-center gap-1.5 px-3 py-2 border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-(--radius-md) text-xs font-bold transition-all disabled:opacity-50"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Request Refund
                  </button>
                  <button
                    onClick={() => handleConfirmCompletion(tx.id)}
                    disabled={actionLoading === tx.id}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-(--radius-md) text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Confirm & Release
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="bg-white rounded-(--radius-lg) border border-(--color-outline-variant)/30 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-(--color-outline-variant)/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-(--color-on-background)">Payment History</h2>
            <p className="text-xs text-(--color-on-surface-variant) mt-0.5">{transactions.length} total transactions</p>
          </div>
          {/* Status filter */}
          <div className="flex flex-wrap gap-1.5">
            {["all", "pending", "held_in_escrow", "released", "refunded", "failed"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-semibold capitalize transition-colors",
                  statusFilter === s
                    ? "bg-(--color-primary) text-(--color-on-primary)"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {s === "all" ? "All" : s.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-16 flex justify-center">
            <span className="inline-block w-8 h-8 border-4 border-(--color-primary)/30 border-t-(--color-primary) rounded-full animate-spin" />
          </div>
        ) : filteredTx.length === 0 ? (
          <div className="p-16 text-center">
            <ArrowDownLeft className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-(--color-on-surface-variant)">No transactions yet.</p>
            <p className="text-xs text-(--color-on-surface-variant) mt-1">
              Payments will appear here once you pay for services.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-(--color-outline-variant)/20 text-xs font-bold uppercase tracking-wider text-gray-500">
                  <th className="p-4 pl-6">Job</th>
                  <th className="p-4">Provider</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Method</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--color-outline-variant)/20">
                {filteredTx.map((tx) => {
                  const meta = TX_STATUS_META[tx.status] ?? TX_STATUS_META.pending;
                  const StatusIcon = meta.icon;
                  return (
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors text-sm">
                      <td className="p-4 pl-6 font-medium text-(--color-on-background)">
                        {tx.jobs?.title ?? <span className="italic text-gray-400">General Payment</span>}
                      </td>
                      <td className="p-4 text-(--color-on-surface-variant)">
                        {tx.payee?.name ?? "—"}
                      </td>
                      <td className="p-4 font-semibold text-(--color-on-background)">
                        FCFA {Number(tx.amount).toLocaleString()}
                      </td>
                      <td className="p-4 text-(--color-on-surface-variant)">
                        {PAYMENT_METHOD_LABELS[tx.payment_method] ?? tx.payment_method}
                      </td>
                      <td className="p-4">
                        <span
                          className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold w-fit",
                            meta.color
                          )}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          {meta.label}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-(--color-on-surface-variant) text-xs">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── NEW PAYMENT MODAL ── */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-in fade-in duration-200">
          <div className="bg-white rounded-(--radius-lg) shadow-level-3 w-full max-w-md mx-4 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-(--color-outline-variant)/30 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-(--color-on-background)">Make a Payment</h2>
                <p className="text-xs text-(--color-on-surface-variant) mt-0.5">
                  Pay for a job to hold funds in escrow.
                </p>
              </div>
              <button
                onClick={() => setShowPayModal(false)}
                className="p-2 hover:bg-gray-100 rounded-(--radius-md) transition-colors"
              >
                <X className="w-5 h-5 text-(--color-on-surface-variant)" />
              </button>
            </div>

            <form onSubmit={handleMakePayment} className="p-6 space-y-5">
              {/* Job selection */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-(--color-on-background)">Select Job *</label>
                {payableJobs.length === 0 ? (
                  <div className="p-4 border border-dashed border-(--color-outline-variant)/50 rounded-(--radius-md) text-center">
                    <p className="text-xs text-(--color-on-surface-variant)">
                      No jobs available for payment. Jobs need an assigned provider first.
                    </p>
                  </div>
                ) : (
                  <select
                    required
                    value={payJobId}
                    onChange={(e) => setPayJobId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-(--color-outline-variant)/50 rounded-(--radius-md) text-sm bg-gray-50 outline-none focus:border-(--color-primary) focus:bg-white transition-all"
                  >
                    <option value="">Choose a job…</option>
                    {payableJobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.title} — FCFA {j.budget?.toLocaleString()}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Payment amount (read-only, derived from job) */}
              {payJobId && (() => {
                const job = jobs.find((j) => j.id === payJobId);
                return job ? (
                  <div className="bg-(--color-primary-container)/10 border border-(--color-primary)/15 rounded-(--radius-md) p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-(--color-on-surface-variant) font-semibold">Payment Amount</p>
                      <p className="text-xl font-bold text-(--color-on-background) mt-0.5">
                        FCFA {job.budget?.toLocaleString()}
                      </p>
                    </div>
                    <Wallet className="w-8 h-8 text-(--color-primary)/40" />
                  </div>
                ) : null;
              })()}

              {/* Payment method */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-(--color-on-background)">Payment Method *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "mobile_money", label: "Mobile Money" },
                    { value: "card",         label: "Bank Card" },
                    { value: "cash",         label: "Cash" },
                  ].map((opt) => {
                    const MethodIcon = PAYMENT_METHOD_ICONS[opt.value];
                    return (
                      <label
                        key={opt.value}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-3 rounded-(--radius-md) border cursor-pointer transition-all text-center",
                          payMethod === opt.value
                            ? "border-(--color-primary) bg-(--color-primary-container)/10 shadow-sm"
                            : "border-(--color-outline-variant)/30 hover:border-(--color-primary)/40"
                        )}
                      >
                        <input
                          type="radio"
                          name="pay_method"
                          value={opt.value}
                          checked={payMethod === opt.value}
                          onChange={(e) => setPayMethod(e.target.value)}
                          className="sr-only"
                        />
                        <MethodIcon className={cn("w-5 h-5", payMethod === opt.value ? "text-(--color-primary)" : "text-(--color-outline)")} />
                        <span className="text-xs font-medium text-(--color-on-background)">{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
                {payMethod === "cash" && (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-1.5 mt-1">
                    Cash payments are recorded for tracking purposes only — no funds are held in escrow.
                  </p>
                )}
              </div>

              {/* Reference */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-(--color-on-background)">
                  Reference / Receipt Number
                </label>
                <input
                  type="text"
                  value={payReference}
                  onChange={(e) => setPayReference(e.target.value)}
                  placeholder="e.g., MM-20250618-1234"
                  className="w-full px-4 py-2.5 border border-(--color-outline-variant)/50 rounded-(--radius-md) text-sm bg-gray-50 outline-none focus:border-(--color-primary) focus:bg-white transition-all"
                />
                <p className="text-xs text-(--color-on-surface-variant)">Optional. Add a transaction reference for your records.</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2.5 border border-(--color-outline-variant)/50 text-(--color-on-surface-variant) rounded-(--radius-md) text-sm font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paySubmitting || !payJobId || payableJobs.length === 0}
                  className="flex items-center gap-2 bg-(--color-primary) text-(--color-on-primary) px-5 py-2.5 rounded-(--radius-md) text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4" />
                  {paySubmitting ? "Processing…" : "Confirm Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Toast message={toast} />
    </div>
  );
}
