"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  User, Lock, Bell, CreditCard,
  Save, Eye, EyeOff, CheckCircle2, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "profile",       label: "Profile",        icon: User },
  { id: "password",      label: "Password",        icon: Lock },
  { id: "notifications", label: "Notifications",   icon: Bell },
  { id: "payment",       label: "Payment",         icon: CreditCard },
];

function Field({ label, children, hint }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-(--color-on-background)">{label}</label>
      {children}
      {hint && <p className="text-xs text-(--color-on-surface-variant)">{hint}</p>}
    </div>
  );
}

function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "w-full px-4 py-2.5 border border-(--color-outline-variant)/50 rounded-(--radius-md) text-sm bg-gray-50 outline-none focus:border-(--color-primary) focus:bg-white transition-all",
        className
      )}
      {...props}
    />
  );
}

function Textarea({ className, ...props }) {
  return (
    <textarea
      rows={3}
      className={cn(
        "w-full px-4 py-2.5 border border-(--color-outline-variant)/50 rounded-(--radius-md) text-sm bg-gray-50 outline-none focus:border-(--color-primary) focus:bg-white transition-all resize-none",
        className
      )}
      {...props}
    />
  );
}

function Toast({ message }) {
  if (!message) return null;
  const isError = message.type === "error";
  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-(--radius-md) text-sm font-semibold shadow-level-3 border animate-in slide-in-from-bottom-4",
        isError ? "bg-red-50 text-red-800 border-red-200" : "bg-emerald-50 text-emerald-800 border-emerald-200"
      )}
    >
      {isError ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
      {message.text}
    </div>
  );
}

export default function ClientSettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [profile, setProfile] = useState({ name: "", company_name: "", avatar_url: "", location: "" });
  const [profileSaving, setProfileSaving] = useState(false);

  const [passwords, setPasswords] = useState({ newPass: "", confirm: "" });
  const [showPass, setShowPass] = useState({ newPass: false, confirm: false });
  const [passSaving, setPassSaving] = useState(false);

  const [notifPrefs, setNotifPrefs] = useState({
    email_new_applicant: true,
    email_job_completed: true,
    email_payment:       true,
    email_messages:      true,
  });
  const [notifSaving, setNotifSaving] = useState(false);

  const [paymentPrefs, setPaymentPrefs] = useState({
    preferred_method:    "mobile_money",
    mobile_money_number: "",
    billing_name:        "",
  });
  const [paymentSaving, setPaymentSaving] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setLoading(false); return; }
      setCurrentUserId(session.user.id);

      supabase
        .from("profiles")
        .select("name, company_name, avatar_url, location, notification_prefs, payment_prefs")
        .eq("id", session.user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setProfile({
              name:         data.name         ?? "",
              company_name: data.company_name ?? "",
              avatar_url:   data.avatar_url   ?? "",
              location:     data.location     ?? "",
            });
            if (data.notification_prefs) setNotifPrefs((p) => ({ ...p, ...data.notification_prefs }));
            if (data.payment_prefs)      setPaymentPrefs((p) => ({ ...p, ...data.payment_prefs }));
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
    init();
  }, []);

  function showToast(type, text) {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  }

  async function saveProfile(e) {
    e.preventDefault();
    if (!currentUserId) return;
    setProfileSaving(true);
    const { error } = await supabase.from("profiles").update(profile).eq("id", currentUserId);
    setProfileSaving(false);
    error ? showToast("error", "Failed to save profile.") : showToast("success", "Profile updated.");
  }

  async function savePassword(e) {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirm) { showToast("error", "Passwords do not match."); return; }
    if (passwords.newPass.length < 8) { showToast("error", "Minimum 8 characters."); return; }
    setPassSaving(true);
    const { error } = await supabase.auth.updateUser({ password: passwords.newPass });
    setPassSaving(false);
    error ? showToast("error", error.message) : showToast("success", "Password updated.");
  }

  async function saveNotifications(e) {
    e.preventDefault();
    if (!currentUserId) return;
    setNotifSaving(true);
    const { error } = await supabase.from("profiles").update({ notification_prefs: notifPrefs }).eq("id", currentUserId);
    setNotifSaving(false);
    error ? showToast("error", "Failed to save.") : showToast("success", "Preferences saved.");
  }

  async function savePayment(e) {
    e.preventDefault();
    if (!currentUserId) return;
    setPaymentSaving(true);
    const { error } = await supabase.from("profiles").update({ payment_prefs: paymentPrefs }).eq("id", currentUserId);
    setPaymentSaving(false);
    error ? showToast("error", "Failed to save.") : showToast("success", "Payment info saved.");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="inline-block w-8 h-8 border-4 border-(--color-primary)/30 border-t-(--color-primary) rounded-full animate-spin" />
      </div>
    );
  }

  const SaveBtn = ({ saving, label, icon: Icon }) => (
    <button
      type="submit"
      disabled={saving}
      className="flex items-center gap-2 bg-(--color-primary) text-(--color-on-primary) px-5 py-2.5 rounded-(--radius-md) text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
    >
      <Icon className="w-4 h-4" />
      {saving ? "Saving…" : label}
    </button>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-headline-md text-(--color-on-background)">Account Settings</h1>
        <p className="text-body-sm text-(--color-on-surface-variant) mt-1">Manage your account and billing preferences.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto bg-white border border-(--color-outline-variant)/30 rounded-(--radius-lg) p-1 shadow-sm">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-(--radius-md) text-sm font-semibold transition-all whitespace-nowrap",
              activeTab === id
                ? "bg-(--color-primary) text-(--color-on-primary) shadow-sm"
                : "text-(--color-on-surface-variant) hover:bg-(--color-surface-container)"
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Profile */}
      {activeTab === "profile" && (
        <form onSubmit={saveProfile} className="bg-white rounded-(--radius-lg) border border-(--color-outline-variant)/30 shadow-sm p-6 space-y-5">
          <h2 className="text-lg font-semibold text-(--color-on-background)">Profile Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Full Name">
              <Input value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} placeholder="Your name" />
            </Field>
            <Field label="Company / Organisation (optional)">
              <Input value={profile.company_name} onChange={(e) => setProfile((p) => ({ ...p, company_name: e.target.value }))} placeholder="Your company name" />
            </Field>
            <Field label="Location">
              <Input value={profile.location} onChange={(e) => setProfile((p) => ({ ...p, location: e.target.value }))} placeholder="Yaoundé, Cameroon" />
            </Field>
            <Field label="Avatar URL">
              <Input value={profile.avatar_url} onChange={(e) => setProfile((p) => ({ ...p, avatar_url: e.target.value }))} placeholder="https://..." />
            </Field>
          </div>
          <div className="flex justify-end">
            <SaveBtn saving={profileSaving} label="Save Changes" icon={Save} />
          </div>
        </form>
      )}

      {/* Password */}
      {activeTab === "password" && (
        <form onSubmit={savePassword} className="bg-white rounded-(--radius-lg) border border-(--color-outline-variant)/30 shadow-sm p-6 space-y-5">
          <h2 className="text-lg font-semibold text-(--color-on-background)">Change Password</h2>
          {[{ key: "newPass", label: "New Password" }, { key: "confirm", label: "Confirm Password" }].map(({ key, label }) => (
            <Field key={key} label={label}>
              <div className="relative">
                <Input
                  type={showPass[key] ? "text" : "password"}
                  value={passwords[key]}
                  onChange={(e) => setPasswords((p) => ({ ...p, [key]: e.target.value }))}
                  placeholder="••••••••"
                  className="pr-12"
                />
                <button type="button" onClick={() => setShowPass((p) => ({ ...p, [key]: !p[key] }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-(--color-outline)">
                  {showPass[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>
          ))}
          <div className="flex justify-end">
            <SaveBtn saving={passSaving} label="Update Password" icon={Lock} />
          </div>
        </form>
      )}

      {/* Notifications */}
      {activeTab === "notifications" && (
        <form onSubmit={saveNotifications} className="bg-white rounded-(--radius-lg) border border-(--color-outline-variant)/30 shadow-sm p-6 space-y-5">
          <h2 className="text-lg font-semibold text-(--color-on-background)">Notification Preferences</h2>
          <div className="space-y-3">
            {[
              { key: "email_new_applicant", label: "New job applicant",    desc: "When a provider applies to one of your jobs" },
              { key: "email_job_completed", label: "Job completed",        desc: "When a provider marks a job as completed" },
              { key: "email_payment",       label: "Payment notifications", desc: "Escrow releases, refunds, and receipts" },
              { key: "email_messages",      label: "New messages",          desc: "When you receive a message from a provider" },
            ].map(({ key, label, desc }) => (
              <label key={key} className="flex items-start gap-4 p-4 rounded-(--radius-md) border border-(--color-outline-variant)/30 cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="relative mt-0.5">
                  <input type="checkbox" checked={notifPrefs[key] ?? false} onChange={(e) => setNotifPrefs((p) => ({ ...p, [key]: e.target.checked }))} className="sr-only peer" />
                  <div className="w-10 h-6 bg-gray-200 peer-checked:bg-(--color-primary) rounded-full transition-colors" />
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
            <SaveBtn saving={notifSaving} label="Save Preferences" icon={Bell} />
          </div>
        </form>
      )}

      {/* Payment */}
      {activeTab === "payment" && (
        <form onSubmit={savePayment} className="bg-white rounded-(--radius-lg) border border-(--color-outline-variant)/30 shadow-sm p-6 space-y-5">
          <h2 className="text-lg font-semibold text-(--color-on-background)">Payment Preferences</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Billing Name">
              <Input value={paymentPrefs.billing_name} onChange={(e) => setPaymentPrefs((p) => ({ ...p, billing_name: e.target.value }))} placeholder="Full billing name" />
            </Field>
            <Field label="Mobile Money Number">
              <Input type="tel" value={paymentPrefs.mobile_money_number} onChange={(e) => setPaymentPrefs((p) => ({ ...p, mobile_money_number: e.target.value }))} placeholder="+237 6XX XXX XXX" />
            </Field>
          </div>
          <Field label="Preferred Payment Method">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[{ value: "mobile_money", label: "Mobile Money" }, { value: "card", label: "Bank Card" }, { value: "cash", label: "Cash" }].map((opt) => (
                <label key={opt.value} className={cn("flex items-center gap-2 p-3 rounded-(--radius-md) border cursor-pointer transition-all", paymentPrefs.preferred_method === opt.value ? "border-(--color-primary) bg-(--color-primary-container)/10" : "border-(--color-outline-variant)/30 hover:border-(--color-primary)/40")}>
                  <input type="radio" name="preferred_method" value={opt.value} checked={paymentPrefs.preferred_method === opt.value} onChange={(e) => setPaymentPrefs((p) => ({ ...p, preferred_method: e.target.value }))} />
                  <span className="text-sm font-medium">{opt.label}</span>
                </label>
              ))}
            </div>
          </Field>
          <div className="flex justify-end">
            <SaveBtn saving={paymentSaving} label="Save Payment Info" icon={CreditCard} />
          </div>
        </form>
      )}

      <Toast message={toast} />
    </div>
  );
}
