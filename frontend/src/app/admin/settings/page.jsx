"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Save, Globe, Mail, Shield, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminSettingsPage() {
  const [platformSettings, setPlatformSettings] = useState({
    platform_name:    "HustleHub",
    support_email:    "support@hustlehub.cm",
    min_job_budget:   500,
    escrow_fee_pct:   5,
    allow_cash_jobs:  true,
    require_guarantor: true,
    maintenance_mode: false,
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    supabase
      .from("platform_settings")
      .select("*")
      .eq("id", true)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setPlatformSettings({
            platform_name:     data.platform_name,
            support_email:     data.support_email,
            min_job_budget:    data.min_job_budget,
            escrow_fee_pct:    data.escrow_fee_pct,
            allow_cash_jobs:   data.allow_cash_jobs,
            require_guarantor: data.require_guarantor,
            maintenance_mode:  data.maintenance_mode,
          });
        }
      })
      .catch((err) => console.error("Error loading platform settings:", err));
  }, []);

  function showToast(type, text) {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from("platform_settings")
        .update({
          platform_name:     platformSettings.platform_name,
          support_email:     platformSettings.support_email,
          min_job_budget:    Number(platformSettings.min_job_budget),
          escrow_fee_pct:    Number(platformSettings.escrow_fee_pct),
          allow_cash_jobs:   platformSettings.allow_cash_jobs,
          require_guarantor: platformSettings.require_guarantor,
          maintenance_mode:  platformSettings.maintenance_mode,
          updated_at:        new Date().toISOString()
        })
        .eq("id", true);

      if (error) throw error;
      showToast("success", "Settings saved successfully to the database.");
    } catch (err) {
      console.error("Save platform settings error:", err);
      showToast("error", "Failed to save settings: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-headline-md text-(--color-on-background)">Admin Settings</h1>
        <p className="text-body-sm text-(--color-on-surface-variant) mt-1">
          Configure platform-wide settings, fees, and feature flags.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
        {/* Platform Identity */}
        <div className="bg-white rounded-(--radius-lg) border border-(--color-outline-variant)/30 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-5 h-5 text-(--color-primary)" />
            <h2 className="text-lg font-semibold text-(--color-on-background)">Platform Identity</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-(--color-on-background) mb-1.5">Platform Name</label>
              <input
                value={platformSettings.platform_name}
                onChange={(e) => setPlatformSettings((s) => ({ ...s, platform_name: e.target.value }))}
                className="w-full px-4 py-2.5 border border-(--color-outline-variant)/50 rounded-(--radius-md) text-sm bg-gray-50 outline-none focus:border-red-400 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-(--color-on-background) mb-1.5">Support Email</label>
              <input
                type="email"
                value={platformSettings.support_email}
                onChange={(e) => setPlatformSettings((s) => ({ ...s, support_email: e.target.value }))}
                className="w-full px-4 py-2.5 border border-(--color-outline-variant)/50 rounded-(--radius-md) text-sm bg-gray-50 outline-none focus:border-red-400 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        {/* Financial Settings */}
        <div className="bg-white rounded-(--radius-lg) border border-(--color-outline-variant)/30 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-(--color-on-background)">Financial Settings</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-(--color-on-background) mb-1.5">Min Job Budget (FCFA)</label>
              <input
                type="number"
                min={0}
                value={platformSettings.min_job_budget}
                onChange={(e) => setPlatformSettings((s) => ({ ...s, min_job_budget: Number(e.target.value) }))}
                className="w-full px-4 py-2.5 border border-(--color-outline-variant)/50 rounded-(--radius-md) text-sm bg-gray-50 outline-none focus:border-red-400 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-(--color-on-background) mb-1.5">Platform Fee (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={platformSettings.escrow_fee_pct}
                onChange={(e) => setPlatformSettings((s) => ({ ...s, escrow_fee_pct: Number(e.target.value) }))}
                className="w-full px-4 py-2.5 border border-(--color-outline-variant)/50 rounded-(--radius-md) text-sm bg-gray-50 outline-none focus:border-red-400 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        {/* Feature Flags */}
        <div className="bg-white rounded-(--radius-lg) border border-(--color-outline-variant)/30 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Mail className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-(--color-on-background)">Feature Flags</h2>
          </div>
          {[
            { key: "allow_cash_jobs",   label: "Allow Cash Jobs",        desc: "Permit jobs recorded as cash-only (no escrow)" },
            { key: "require_guarantor", label: "Require Guarantor",       desc: "Providers must submit guarantor info to be verified" },
            { key: "maintenance_mode",  label: "Maintenance Mode",        desc: "Temporarily disable all non-admin platform access" },
          ].map(({ key, label, desc }) => (
            <label key={key} className={cn(
              "flex items-start gap-4 p-4 rounded-(--radius-md) border cursor-pointer hover:bg-gray-50 transition-colors",
              key === "maintenance_mode" && platformSettings[key] ? "border-red-200 bg-red-50" : "border-(--color-outline-variant)/30"
            )}>
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  checked={platformSettings[key]}
                  onChange={(e) => setPlatformSettings((s) => ({ ...s, [key]: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className={cn("w-10 h-6 rounded-full transition-colors", key === "maintenance_mode" ? "bg-gray-200 peer-checked:bg-red-500" : "bg-gray-200 peer-checked:bg-emerald-500")} />
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-(--color-on-background)">{label}</p>
                <p className="text-xs text-(--color-on-surface-variant) mt-0.5">{desc}</p>
              </div>
            </label>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-red-500 text-white px-5 py-2.5 rounded-(--radius-md) text-sm font-semibold hover:bg-red-600 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </div>
      </form>

      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-(--radius-md) text-sm font-semibold shadow-level-3 border animate-in slide-in-from-bottom-4",
          toast.type === "error" ? "bg-red-50 text-red-800 border-red-200" : "bg-emerald-50 text-emerald-800 border-emerald-200"
        )}>
          {toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {toast.text}
        </div>
      )}
    </div>
  );
}
