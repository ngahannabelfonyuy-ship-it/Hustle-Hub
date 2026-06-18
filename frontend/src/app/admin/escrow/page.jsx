"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Lock, TrendingUp, RefreshCw, CheckCircle2, XCircle, Clock,
  ArrowDownLeft, Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TX_STATUS_META = {
  pending:        { label: "Pending",        color: "bg-gray-100 text-gray-700",       icon: Clock },
  held_in_escrow: { label: "In Escrow",      color: "bg-amber-100 text-amber-800",     icon: Lock },
  released:       { label: "Released",       color: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
  refunded:       { label: "Refunded",       color: "bg-blue-100 text-blue-800",       icon: RefreshCw },
  failed:         { label: "Failed",         color: "bg-red-100 text-red-800",         icon: XCircle },
};

export default function AdminEscrowPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [message, setMessage] = useState(null);

  useEffect(() => {
    supabase
      .from("transactions")
      .select("*, jobs(title), payer:profiles!transactions_payer_id_fkey(name), payee:profiles!transactions_payee_id_fkey(name)")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setTransactions(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleUpdateStatus = async (txId, newStatus) => {
    try {
      const { error } = await supabase
        .from("transactions")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", txId);

      if (!error) {
        setTransactions((prev) => prev.map((t) => t.id === txId ? { ...t, status: newStatus } : t));
        setMessage({ type: "success", text: `Transaction status updated to "${newStatus.replace("_", " ")}".` });
      } else throw error;
      setTimeout(() => setMessage(null), 3000);
    } catch (err) { console.error(err); }
  };

  // Summary stats
  const held     = transactions.filter((t) => t.status === "held_in_escrow").reduce((s, t) => s + Number(t.amount), 0);
  const released = transactions.filter((t) => t.status === "released").reduce((s, t) => s + Number(t.amount), 0);
  const refunded = transactions.filter((t) => t.status === "refunded").reduce((s, t) => s + Number(t.amount), 0);
  const failed   = transactions.filter((t) => t.status === "failed").reduce((s, t) => s + Number(t.amount), 0);

  const filtered = statusFilter === "all" ? transactions : transactions.filter((t) => t.status === statusFilter);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-headline-md text-(--color-on-background)">Escrow Monitor</h1>
        <p className="text-body-sm text-(--color-on-surface-variant) mt-1">
          Monitor all escrow transactions, release payments, and issue refunds.
        </p>
      </div>

      {message && (
        <div className={cn("p-4 rounded-lg text-sm font-semibold border animate-in slide-in-from-top-2",
          message.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"
        )}>
          {message.text}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Held in Escrow",  value: held,     icon: Lock,        color: "text-amber-600",   bg: "border-amber-200 bg-amber-50/30" },
          { label: "Total Released",  value: released,  icon: TrendingUp,  color: "text-emerald-600", bg: "border-emerald-200 bg-emerald-50/30" },
          { label: "Total Refunded",  value: refunded,  icon: RefreshCw,   color: "text-blue-600",    bg: "border-blue-200 bg-blue-50/30" },
          { label: "Failed",          value: failed,    icon: XCircle,     color: "text-red-600",     bg: "border-red-200 bg-red-50/30" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={cn("p-5 rounded-(--radius-lg) border shadow-sm", bg)}>
            <div className={cn("flex items-center gap-2 text-sm font-semibold mb-2", color)}>
              <Icon className="w-4 h-4" />
              {label}
            </div>
            <div className={cn("text-2xl font-bold", color)}>
              FCFA {value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Transactions table */}
      <div className="bg-white rounded-(--radius-lg) border border-(--color-outline-variant)/30 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-(--color-outline-variant)/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-(--color-on-background)">All Transactions</h2>
            <p className="text-xs text-(--color-on-surface-variant) mt-0.5">{transactions.length} total</p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="w-4 h-4 text-(--color-outline)" />
            {["all", "pending", "held_in_escrow", "released", "refunded", "failed"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-semibold capitalize transition-colors",
                  statusFilter === s ? "bg-red-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {s === "all" ? "All" : s.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-16 flex justify-center">
            <span className="inline-block w-8 h-8 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <ArrowDownLeft className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-(--color-on-surface-variant)">No transactions found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-(--color-outline-variant)/20 text-xs font-bold uppercase tracking-wider text-gray-500">
                  <th className="p-4 pl-6">Job</th>
                  <th className="p-4">Client</th>
                  <th className="p-4">Provider</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--color-outline-variant)/20">
                {filtered.map((tx) => {
                  const meta = TX_STATUS_META[tx.status] ?? TX_STATUS_META.pending;
                  const StatusIcon = meta.icon;
                  return (
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors text-sm">
                      <td className="p-4 pl-6 font-medium text-(--color-on-background) max-w-[160px]">
                        <span className="truncate block">{tx.jobs?.title ?? <em className="text-gray-400 font-normal">N/A</em>}</span>
                      </td>
                      <td className="p-4 text-(--color-on-surface-variant)">{tx.payer?.name ?? "—"}</td>
                      <td className="p-4 text-(--color-on-surface-variant)">{tx.payee?.name ?? "—"}</td>
                      <td className="p-4 font-semibold text-(--color-on-background)">
                        FCFA {Number(tx.amount).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold w-fit", meta.color)}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {meta.label}
                        </span>
                      </td>
                      <td className="p-4 text-(--color-on-surface-variant) text-xs">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex gap-1.5 justify-end">
                          {tx.status === "held_in_escrow" && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(tx.id, "released")}
                                className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-xs font-bold hover:bg-emerald-100 transition-colors"
                              >
                                Release
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(tx.id, "refunded")}
                                className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-bold hover:bg-blue-100 transition-colors"
                              >
                                Refund
                              </button>
                            </>
                          )}
                          {tx.status === "pending" && (
                            <button
                              onClick={() => handleUpdateStatus(tx.id, "held_in_escrow")}
                              className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded text-xs font-bold hover:bg-amber-100 transition-colors"
                            >
                              Hold in Escrow
                            </button>
                          )}
                          {(tx.status === "released" || tx.status === "refunded" || tx.status === "failed") && (
                            <span className="text-xs text-gray-400 italic">No actions</span>
                          )}
                        </div>
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
