"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  CheckCircle2, XCircle, FileText, ShieldCheck,
  User, Phone, Mail, MapPin, Briefcase, CreditCard, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const GUARANTOR_FIELDS = [
  { key: "full_name",           label: "Full Name",          icon: User },
  { key: "phone_number",        label: "Phone Number",       icon: Phone },
  { key: "email",               label: "Email",              icon: Mail },
  { key: "residential_address", label: "Address",            icon: MapPin },
  { key: "relationship",        label: "Relationship",       icon: User },
  { key: "occupation",          label: "Occupation",         icon: Briefcase },
  { key: "national_id_number",  label: "National ID Number", icon: CreditCard },
];

export default function AdminApprovalsPage() {
  const [activeTab, setActiveTab] = useState("verifications");

  // ── Verifications ──
  const [requests, setRequests] = useState([]);
  const [verLoading, setVerLoading] = useState(true);
  const [verMessage, setVerMessage] = useState(null);

  // ── Guarantors ──
  const [guarantors, setGuarantors] = useState([]);
  const [gLoading, setGLoading] = useState(true);
  const [gMessage, setGMessage] = useState(null);

  // ── Load verifications ──
  useEffect(() => {
    supabase
      .from("verifications")
      .select("*, profiles(*)")
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setRequests(data);
        setVerLoading(false);
      })
      .catch(() => setVerLoading(false));
  }, []);

  // ── Load guarantors ──
  useEffect(() => {
    supabase
      .from("guarantors")
      .select("*, profiles!guarantors_provider_id_fkey(name, email, avatar_url)")
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setGuarantors(data);
        setGLoading(false);
      })
      .catch(() => setGLoading(false));
  }, []);

  // ── Verification action ──
  const handleVerificationAction = async (requestId, userId, action) => {
    const isApproved = action === "approve";
    const status = isApproved ? "approved" : "rejected";
    try {
      await supabase.from("verifications").update({ status }).eq("id", requestId);
      if (isApproved) {
        await supabase.from("profiles").update({ is_verified: true, student_status: true }).eq("id", userId);
      }
      setRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, status } : r)));
      setVerMessage({ type: isApproved ? "success" : "error", text: `Request ${status}. User status updated.` });
      setTimeout(() => setVerMessage(null), 3000);
    } catch (err) { console.error(err); }
  };

  // ── Guarantor action ──
  const handleGuarantorAction = async (guarantorId, providerId, action) => {
    const status = action === "approve" ? "verified" : "rejected";
    try {
      await supabase.from("guarantors").update({ status }).eq("id", guarantorId);
      if (action === "approve") {
        await supabase.from("profiles").update({ is_verified: true }).eq("id", providerId);
      }
      setGuarantors((prev) => prev.map((g) => (g.id === guarantorId ? { ...g, status } : g)));
      setGMessage({ type: action === "approve" ? "success" : "error", text: `Guarantor ${status}. Provider record updated.` });
      setTimeout(() => setGMessage(null), 3000);
    } catch (err) { console.error(err); }
  };

  const pendingRequests  = requests.filter((r) => r.status === "pending");
  const historyRequests  = requests.filter((r) => r.status !== "pending");
  const pendingGuarantors = guarantors.filter((g) => g.status === "pending");
  const historyGuarantors = guarantors.filter((g) => g.status !== "pending");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-headline-md text-(--color-on-background)">Approvals Queue</h1>
        <p className="text-body-sm text-(--color-on-surface-variant) mt-1">
          Review verification documents, guarantor information, and approve platform access.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 border-b border-(--color-outline-variant)/30">
        {[
          { id: "verifications", label: "Verification Queue", count: pendingRequests.length },
          { id: "guarantors",    label: "Guarantor Reviews",  count: pendingGuarantors.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors",
              activeTab === tab.id
                ? "border-red-500 text-red-600"
                : "border-transparent text-(--color-on-surface-variant) hover:text-(--color-on-surface)"
            )}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══ VERIFICATIONS TAB ══ */}
      {activeTab === "verifications" && (
        <>
          {verMessage && (
            <div className={cn("p-4 rounded-lg text-sm font-semibold border animate-in slide-in-from-top-2",
              verMessage.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"
            )}>
              {verMessage.text}
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-(--radius-lg) border border-(--color-outline-variant)/30 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-(--color-outline-variant)/30 bg-gray-50/50">
                  <h2 className="text-lg font-semibold text-(--color-on-background)">
                    Pending Requests ({pendingRequests.length})
                  </h2>
                </div>
                {verLoading ? (
                  <div className="p-12 flex justify-center">
                    <span className="inline-block w-8 h-8 border-4 border-(--color-primary)/30 border-t-(--color-primary) rounded-full animate-spin" />
                  </div>
                ) : pendingRequests.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                    <p className="font-semibold">Queue is clear!</p>
                    <p className="text-xs text-gray-400 mt-1">No pending verification requests.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-(--color-outline-variant)/20">
                    {pendingRequests.map((req) => (
                      <div key={req.id} className="p-6 space-y-4 hover:bg-gray-50/50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center font-bold text-blue-600">
                              {req.profiles?.name?.charAt(0) ?? "?"}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{req.profiles?.name}</h3>
                              <p className="text-xs text-gray-500">{req.profiles?.email}</p>
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded">
                            {new Date(req.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-4 rounded-lg border border-(--color-outline-variant)/20">
                          {[
                            { label: "Student ID Card", url: req.id_card_url },
                            { label: "Guarantor Form",  url: req.guarantor_form_url },
                          ].map(({ label, url }) => (
                            <div key={label}>
                              <span className="block text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-1.5">{label}</span>
                              {url ? (
                                <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-semibold text-blue-600 hover:underline">
                                  <FileText className="w-4 h-4 text-blue-500" /> View File
                                </a>
                              ) : (
                                <span className="text-xs text-gray-400 italic">No file uploaded</span>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-3 justify-end pt-2">
                          <button onClick={() => handleVerificationAction(req.id, req.user_id, "reject")} className="flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 rounded-md text-xs font-bold transition-all">
                            <XCircle className="w-4 h-4" /> Reject
                          </button>
                          <button onClick={() => handleVerificationAction(req.id, req.user_id, "approve")} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition-all shadow-sm">
                            <CheckCircle2 className="w-4 h-4" /> Approve User
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* Verification History */}
            <div>
              <div className="bg-white rounded-(--radius-lg) border border-(--color-outline-variant)/30 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-(--color-outline-variant)/30">
                  <h2 className="text-md font-semibold text-(--color-on-background)">Recent Review History</h2>
                </div>
                <div className="divide-y divide-(--color-outline-variant)/20 max-h-[400px] overflow-y-auto">
                  {historyRequests.length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-400 italic">No review history.</div>
                  ) : (
                    historyRequests.map((req) => (
                      <div key={req.id} className="p-4 flex items-center justify-between text-xs hover:bg-gray-50/50">
                        <div>
                          <div className="font-semibold text-gray-800">{req.profiles?.name}</div>
                          <div className="text-[10px] text-gray-400">{req.profiles?.email}</div>
                        </div>
                        <span className={cn("px-2.5 py-1 rounded-full font-bold uppercase tracking-wider text-[9px]",
                          req.status === "approved" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                        )}>
                          {req.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══ GUARANTORS TAB ══ */}
      {activeTab === "guarantors" && (
        <>
          {gMessage && (
            <div className={cn("p-4 rounded-lg text-sm font-semibold border animate-in slide-in-from-top-2",
              gMessage.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"
            )}>
              {gMessage.text}
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-(--radius-lg) border border-(--color-outline-variant)/30 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-(--color-outline-variant)/30 bg-gray-50/50">
                  <h2 className="text-lg font-semibold text-(--color-on-background)">
                    Pending Guarantor Submissions ({pendingGuarantors.length})
                  </h2>
                </div>
                {gLoading ? (
                  <div className="p-12 flex justify-center">
                    <span className="inline-block w-8 h-8 border-4 border-(--color-primary)/30 border-t-(--color-primary) rounded-full animate-spin" />
                  </div>
                ) : pendingGuarantors.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                    <p className="font-semibold">All caught up!</p>
                    <p className="text-xs text-gray-400 mt-1">No pending guarantor submissions.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-(--color-outline-variant)/20">
                    {pendingGuarantors.map((g) => (
                      <div key={g.id} className="p-6 space-y-4 hover:bg-gray-50/50 transition-colors">
                        {/* Provider info */}
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center font-bold text-indigo-600">
                              {g.profiles?.name?.charAt(0) ?? "?"}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {g.profiles?.name}
                                <span className="ml-2 text-xs text-gray-400 font-normal">(Provider)</span>
                              </h3>
                              <p className="text-xs text-gray-500">{g.profiles?.email}</p>
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded">
                            {new Date(g.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Guarantor details grid */}
                        <div className="bg-gray-50 border border-(--color-outline-variant)/20 rounded-lg p-4">
                          <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-3">Guarantor Details</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {GUARANTOR_FIELDS.map(({ key, label, icon: Icon }) => (
                              <div key={key} className="flex items-start gap-2 text-xs">
                                <Icon className="w-3.5 h-3.5 text-(--color-outline) mt-0.5 flex-shrink-0" />
                                <div>
                                  <span className="text-gray-400 block">{label}</span>
                                  <span className="font-semibold text-gray-800">{g[key] || <em className="text-gray-400 font-normal">Not provided</em>}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          {/* ID Document */}
                          <div className="mt-3 pt-3 border-t border-(--color-outline-variant)/20">
                            <span className="block text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-1.5">ID Document</span>
                            {g.id_document_url ? (
                              <a href={g.id_document_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-semibold text-blue-600 hover:underline">
                                <FileText className="w-4 h-4 text-blue-500" /> View ID Document
                              </a>
                            ) : (
                              <span className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                                <AlertTriangle className="w-3.5 h-3.5" /> No document uploaded
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 justify-end pt-2">
                          <button
                            onClick={() => handleGuarantorAction(g.id, g.provider_id, "reject")}
                            className="flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 rounded-md text-xs font-bold transition-all"
                          >
                            <XCircle className="w-4 h-4" /> Reject
                          </button>
                          <button
                            onClick={() => handleGuarantorAction(g.id, g.provider_id, "approve")}
                            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition-all shadow-sm"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Verify Guarantor
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Guarantor history sidebar */}
            <div>
              <div className="bg-white rounded-(--radius-lg) border border-(--color-outline-variant)/30 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-(--color-outline-variant)/30">
                  <h2 className="text-md font-semibold text-(--color-on-background)">Review History</h2>
                </div>
                <div className="divide-y divide-(--color-outline-variant)/20 max-h-[400px] overflow-y-auto">
                  {historyGuarantors.length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-400 italic">No review history.</div>
                  ) : (
                    historyGuarantors.map((g) => (
                      <div key={g.id} className="p-4 flex items-center justify-between text-xs hover:bg-gray-50/50">
                        <div>
                          <div className="font-semibold text-gray-800">{g.profiles?.name}</div>
                          <div className="text-[10px] text-gray-400">Guarantor: {g.full_name}</div>
                        </div>
                        <span className={cn("px-2.5 py-1 rounded-full font-bold uppercase tracking-wider text-[9px]",
                          g.status === "verified" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                        )}>
                          {g.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
