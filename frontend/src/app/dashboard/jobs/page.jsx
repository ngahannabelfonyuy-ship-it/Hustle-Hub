"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Briefcase, Clock, CheckCircle2, XCircle, Search, Filter } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = ["all", "pending", "accepted", "rejected"];

const STATUS_META = {
  pending:  { label: "Pending",  color: "bg-amber-100 text-amber-800",   icon: Clock },
  accepted: { label: "Accepted", color: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800",       icon: XCircle },
};

export default function ProviderApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setLoading(false); return; }

      supabase
        .from("applications")
        .select("*, jobs(id, title, budget, status, category, created_at, client_id, profiles!jobs_client_id_fkey(name, avatar_url))")
        .eq("provider_id", session.user.id)
        .order("created_at", { ascending: false })
        .then(({ data, error }) => {
          if (!error && data) setApplications(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
    load();
  }, []);

  const filtered = applications.filter((app) => {
    const matchFilter = filter === "all" || app.status === filter;
    const matchSearch =
      !search ||
      app.jobs?.title?.toLowerCase().includes(search.toLowerCase()) ||
      app.jobs?.profiles?.name?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = {
    all: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    accepted: applications.filter((a) => a.status === "accepted").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-headline-md text-(--color-on-background)">My Applications</h1>
        <p className="text-body-sm text-(--color-on-surface-variant) mt-1">
          Track the status of every job you've applied for.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "p-4 rounded-(--radius-lg) border text-left transition-all",
              filter === s
                ? "bg-(--color-secondary-container) border-(--color-secondary) shadow-level-1"
                : "bg-white border-(--color-outline-variant)/30 hover:border-(--color-secondary)/40"
            )}
          >
            <div className="text-2xl font-bold text-(--color-on-background)">{counts[s]}</div>
            <div className="text-xs font-semibold text-(--color-on-surface-variant) capitalize mt-0.5">{s === "all" ? "Total Applied" : s}</div>
          </button>
        ))}
      </div>

      {/* Filters bar */}
      <div className="bg-white p-4 rounded-(--radius-lg) border border-(--color-outline-variant)/30 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-outline)" />
          <input
            type="text"
            placeholder="Search by job title or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-(--color-outline-variant)/50 rounded-md text-sm outline-none focus:border-(--color-secondary) transition-all"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-(--color-outline)" />
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors",
                filter === s
                  ? "bg-(--color-secondary) text-(--color-on-secondary)"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
      </div>

      {/* Applications list */}
      <div className="bg-white rounded-(--radius-lg) border border-(--color-outline-variant)/30 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 flex justify-center">
            <span className="inline-block w-8 h-8 border-4 border-(--color-secondary)/30 border-t-(--color-secondary) rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="font-semibold text-(--color-on-background)">
              {search || filter !== "all" ? "No applications match your filters." : "You haven't applied to any jobs yet."}
            </p>
            {!search && filter === "all" && (
              <Link
                href="/find-work"
                className="inline-block text-sm font-semibold text-(--color-secondary) hover:underline"
              >
                Browse available jobs →
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-(--color-outline-variant)/20">
            {filtered.map((app) => {
              const meta = STATUS_META[app.status] || STATUS_META.pending;
              const StatusIcon = meta.icon;
              return (
                <div
                  key={app.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Client avatar */}
                    <div className="w-10 h-10 rounded-full bg-(--color-primary-container) flex-shrink-0 flex items-center justify-center font-bold text-(--color-on-primary-container) text-sm">
                      {app.jobs?.profiles?.name?.charAt(0)?.toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <h3 className="font-semibold text-(--color-on-background)">{app.jobs?.title ?? "Unknown Job"}</h3>
                      <div className="flex items-center flex-wrap gap-2 text-xs text-(--color-on-surface-variant) mt-1">
                        <span>Client: {app.jobs?.profiles?.name ?? "Unknown"}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        <span>FCFA {app.jobs?.budget?.toLocaleString() ?? "—"}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        <span>Applied {new Date(app.created_at).toLocaleDateString()}</span>
                      </div>
                      {app.cover_note && (
                        <p className="text-xs text-(--color-on-surface-variant) mt-1.5 italic line-clamp-1">
                          "{app.cover_note}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:flex-shrink-0">
                    <span
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider",
                        meta.color
                      )}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      {meta.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <p className="text-center text-xs text-(--color-on-surface-variant)">
          Showing {filtered.length} of {applications.length} applications
        </p>
      )}
    </div>
  );
}
