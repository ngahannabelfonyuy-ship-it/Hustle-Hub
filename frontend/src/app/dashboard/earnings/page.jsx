"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Wallet,
  Lock,
  TrendingUp,
  ArrowDownLeft,
  Info,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TX_STATUS_META = {
  pending:        { label: "Pending",         color: "bg-gray-100 text-gray-700",      icon: Clock },
  held_in_escrow: { label: "Held in Escrow",  color: "bg-amber-100 text-amber-800",    icon: Lock },
  released:       { label: "Released",        color: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
  refunded:       { label: "Refunded",        color: "bg-blue-100 text-blue-800",      icon: RefreshCw },
  failed:         { label: "Failed",          color: "bg-red-100 text-red-800",        icon: XCircle },
};

const PAYMENT_METHOD_LABELS = {
  mobile_money: "Mobile Money",
  card:         "Card",
  cash:         "Cash",
  escrow:       "Escrow",
};

export default function ProviderEarningsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setLoading(false); return; }

      supabase
        .from("transactions")
        .select("*, jobs(title), payer:profiles!transactions_payer_id_fkey(name, avatar_url)")
        .eq("payee_id", session.user.id)
        .order("created_at", { ascending: false })
        .then(({ data, error }) => {
          if (!error && data) setTransactions(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
    load();
  }, []);

  // Computed totals
  const totalEarnings = transactions
    .filter((t) => t.status === "released")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const heldInEscrow = transactions
    .filter((t) => t.status === "held_in_escrow")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const availableBalance = totalEarnings; // In a real system, subtract withdrawn amounts

  const filteredTx = statusFilter === "all"
    ? transactions
    : transactions.filter((t) => t.status === statusFilter);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-headline-md text-(--color-on-background)">Earnings & Escrow</h1>
        <p className="text-body-sm text-(--color-on-surface-variant) mt-1">
          Track your payments, escrow holds, and transaction history.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-(--radius-lg) border border-(--color-outline-variant)/30 shadow-sm">
          <div className="flex items-center gap-2 text-(--color-on-surface-variant) text-sm font-semibold mb-3">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            Total Earnings
          </div>
          <div className="text-3xl font-bold text-(--color-on-background)">
            FCFA {totalEarnings.toLocaleString()}
          </div>
          <p className="text-xs text-(--color-on-surface-variant) mt-1">From released payments</p>
        </div>

        <div className="bg-white p-6 rounded-(--radius-lg) border border-(--color-outline-variant)/30 shadow-sm">
          <div className="flex items-center gap-2 text-(--color-on-surface-variant) text-sm font-semibold mb-3">
            <Wallet className="w-4 h-4 text-blue-500" />
            Available Balance
          </div>
          <div className="text-3xl font-bold text-(--color-on-background)">
            FCFA {availableBalance.toLocaleString()}
          </div>
          <p className="text-xs text-(--color-on-surface-variant) mt-1">Ready to withdraw</p>
        </div>

        <div className="bg-white p-6 rounded-(--radius-lg) border border-amber-200 bg-amber-50/40 shadow-sm">
          <div className="flex items-center gap-2 text-amber-700 text-sm font-semibold mb-3">
            <Lock className="w-4 h-4 text-amber-500" />
            Held in Escrow
          </div>
          <div className="text-3xl font-bold text-amber-700">
            FCFA {heldInEscrow.toLocaleString()}
          </div>
          <p className="text-xs text-amber-600 mt-1">Awaiting job completion</p>
        </div>
      </div>

      {/* Escrow Workflow Explainer */}
      <div className="bg-(--color-primary-container)/20 border border-(--color-primary)/20 rounded-(--radius-lg) p-5 flex gap-3">
        <Info className="w-5 h-5 text-(--color-primary) flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-(--color-primary) mb-1">How Escrow Works</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-(--color-on-surface-variant)">
            <span className="bg-white border rounded px-2 py-0.5 font-medium">Client Pays</span>
            <span>→</span>
            <span className="bg-amber-100 text-amber-800 border border-amber-200 rounded px-2 py-0.5 font-medium">Funds Held in Escrow</span>
            <span>→</span>
            <span className="bg-blue-100 text-blue-800 border border-blue-200 rounded px-2 py-0.5 font-medium">Job Completed</span>
            <span>→</span>
            <span className="bg-purple-100 text-purple-800 border border-purple-200 rounded px-2 py-0.5 font-medium">Client Confirms</span>
            <span>→</span>
            <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 rounded px-2 py-0.5 font-medium">Payment Released</span>
          </div>
        </div>
      </div>

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
                    ? "bg-(--color-secondary) text-(--color-on-secondary)"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {s === "all" ? "All" : s.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-16 flex justify-center">
            <span className="inline-block w-8 h-8 border-4 border-(--color-secondary)/30 border-t-(--color-secondary) rounded-full animate-spin" />
          </div>
        ) : filteredTx.length === 0 ? (
          <div className="p-16 text-center">
            <ArrowDownLeft className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-(--color-on-surface-variant)">No transactions yet.</p>
            <p className="text-xs text-(--color-on-surface-variant) mt-1">
              Payments will appear here once clients book and pay for your services.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-(--color-outline-variant)/20 text-xs font-bold uppercase tracking-wider text-gray-500">
                  <th className="p-4 pl-6">Job</th>
                  <th className="p-4">Client</th>
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
                        {tx.payer?.name ?? "—"}
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
    </div>
  );
}
