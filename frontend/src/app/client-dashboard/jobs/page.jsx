"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  Briefcase,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  PlusCircle,
  Users,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// Status metadata
// ─────────────────────────────────────────────
const STATUS_FILTERS = ["all", "open", "in_progress", "completed", "cancelled"];

const STATUS_META = {
  open:        { label: "Open",        color: "bg-blue-100 text-blue-800",      icon: Clock },
  in_progress: { label: "In Progress", color: "bg-amber-100 text-amber-800",    icon: Briefcase },
  completed:   { label: "Completed",   color: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
  cancelled:   { label: "Cancelled",   color: "bg-gray-100 text-gray-600",      icon: XCircle },
};

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function ClientJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setLoading(false); return; }

      supabase
        .from("jobs")
        .select("*, provider:profiles!jobs_provider_id_fkey(id, name, avatar_url, rating)")
        .eq("client_id", session.user.id)
        .order("created_at", { ascending: false })
        .then(({ data, error }) => {
          if (!error && data) setJobs(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
    load();
  }, []);

  // ── Filtering ──
  const filtered = jobs.filter((job) => {
    const matchFilter = filter === "all" || job.status === filter;
    const matchSearch =
      !search ||
      job.title?.toLowerCase().includes(search.toLowerCase()) ||
      job.category?.toLowerCase().includes(search.toLowerCase()) ||
      job.provider?.name?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = {
    all:         jobs.length,
    open:        jobs.filter((j) => j.status === "open").length,
    in_progress: jobs.filter((j) => j.status === "in_progress").length,
    completed:   jobs.filter((j) => j.status === "completed").length,
    cancelled:   jobs.filter((j) => j.status === "cancelled").length,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-md text-(--color-on-background)">My Jobs</h1>
          <p className="text-body-sm text-(--color-on-surface-variant) mt-1">
            View and manage the jobs you&apos;ve posted on the platform.
          </p>
        </div>
        <Link
          href="/post-job"
          className="flex items-center gap-2 bg-(--color-primary) text-(--color-on-primary) px-5 py-2.5 rounded-(--radius-md) text-sm font-semibold shadow-level-1 hover:opacity-95 transition-all w-fit"
        >
          <PlusCircle className="w-4 h-4" />
          Post New Job
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "p-4 rounded-(--radius-lg) border text-left transition-all",
              filter === s
                ? "bg-(--color-primary-container) border-(--color-primary) shadow-level-1"
                : "bg-white border-(--color-outline-variant)/30 hover:border-(--color-primary)/40"
            )}
          >
            <div className="text-2xl font-bold text-(--color-on-background)">{counts[s]}</div>
            <div className="text-xs font-semibold text-(--color-on-surface-variant) capitalize mt-0.5">
              {s === "all" ? "Total Jobs" : s.replace("_", " ")}
            </div>
          </button>
        ))}
      </div>

      {/* Filters bar */}
      <div className="bg-white p-4 rounded-(--radius-lg) border border-(--color-outline-variant)/30 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-outline)" />
          <input
            type="text"
            placeholder="Search by title, category, or provider..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-(--color-outline-variant)/50 rounded-md text-sm outline-none focus:border-(--color-primary) transition-all"
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
                  ? "bg-(--color-primary) text-(--color-on-primary)"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {s === "all" ? "All" : s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs list */}
      <div className="bg-white rounded-(--radius-lg) border border-(--color-outline-variant)/30 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 flex justify-center">
            <span className="inline-block w-8 h-8 border-4 border-(--color-primary)/30 border-t-(--color-primary) rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="font-semibold text-(--color-on-background)">
              {search || filter !== "all"
                ? "No jobs match your filters."
                : "You haven\u2019t posted any jobs yet."}
            </p>
            {!search && filter === "all" && (
              <Link
                href="/post-job"
                className="inline-block text-sm font-semibold text-(--color-primary) hover:underline"
              >
                Post your first job →
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-(--color-outline-variant)/20">
            {filtered.map((job) => {
              const meta = STATUS_META[job.status] || STATUS_META.open;
              const StatusIcon = meta.icon;
              return (
                <div
                  key={job.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Category badge */}
                    <div className="w-10 h-10 rounded-(--radius-md) bg-(--color-primary-container)/20 flex-shrink-0 flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-(--color-primary)" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-semibold text-(--color-on-background) truncate">
                        {job.title}
                      </h3>
                      <div className="flex items-center flex-wrap gap-2 text-xs text-(--color-on-surface-variant) mt-1.5">
                        {job.category && (
                          <>
                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">
                              {job.category}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                          </>
                        )}
                        <span className="font-semibold text-(--color-on-background)">
                          FCFA {job.budget?.toLocaleString() ?? "—"}
                        </span>
                        {job.location && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                            <span className="flex items-center gap-0.5">
                              <MapPin className="w-3 h-3" />
                              {job.location}
                            </span>
                          </>
                        )}
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                      </div>

                      {/* Assigned provider info */}
                      {job.provider && (
                        <div className="flex items-center gap-2 mt-2">
                          <Users className="w-3.5 h-3.5 text-(--color-outline)" />
                          <span className="text-xs text-(--color-on-surface-variant)">
                            Assigned to{" "}
                            <span className="font-semibold text-(--color-on-background)">
                              {job.provider.name}
                            </span>
                          </span>
                          {job.provider.rating && (
                            <span className="text-xs text-amber-600 font-semibold">
                              ★ {job.provider.rating}
                            </span>
                          )}
                        </div>
                      )}
                      {!job.provider_id && job.status === "open" && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-blue-600">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="font-medium">Awaiting applicants</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:flex-shrink-0">
                    {/* Status badge */}
                    <span
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider",
                        meta.color
                      )}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      {meta.label}
                    </span>

                    {/* Details link */}
                    <Link
                      href={`/client-dashboard/jobs/${job.id}`}
                      className="flex items-center gap-1 text-sm font-semibold text-(--color-primary) hover:underline"
                    >
                      Details
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <p className="text-center text-xs text-(--color-on-surface-variant)">
          Showing {filtered.length} of {jobs.length} jobs
        </p>
      )}
    </div>
  );
}
