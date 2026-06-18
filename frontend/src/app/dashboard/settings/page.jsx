"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  User,
  Lock,
  Bell,
  CreditCard,
  ShieldCheck,
  Save,
  Eye,
  EyeOff,
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// Tab definitions
// ─────────────────────────────────────────────
const TABS = [
  { id: "profile",      label: "Profile",       icon: User },
  { id: "password",     label: "Password",       icon: Lock },
  { id: "notifications",label: "Notifications",  icon: Bell },
  { id: "payment",      label: "Payment",        icon: CreditCard },
  { id: "verification", label: "Verification",   icon: ShieldCheck },
];

const GUARANTOR_STATUS_META = {
  pending:  { label: "Pending Review",  color: "bg-amber-100 text-amber-800 border-amber-200",   icon: Clock },
  verified: { label: "Verified",        color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: CheckCircle2 },
  rejected: { label: "Rejected",        color: "bg-red-100 text-red-800 border-red-200",          icon: XCircle },
};

// ─────────────────────────────────────────────
// Reusable Field Component
// ─────────────────────────────────────────────
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
        "w-full px-4 py-2.5 border border-(--color-outline-variant)/50 rounded-(--radius-md) text-sm bg-gray-50 outline-none focus:border-(--color-secondary) focus:bg-white transition-all",
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
        "w-full px-4 py-2.5 border border-(--color-outline-variant)/50 rounded-(--radius-md) text-sm bg-gray-50 outline-none focus:border-(--color-secondary) focus:bg-white transition-all resize-none",
        className
      )}
      {...props}
    />
  );
}

// ─────────────────────────────────────────────
// Toast
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
export default function ProviderSettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [toast, setToast] = useState(null);

  // Profile state
  const [profile, setProfile] = useState({ name: "", bio: "", avatar_url: "", skills: "", location: "" });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);

  // Password state
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [showPass, setShowPass] = useState({ current: false, newPass: false, confirm: false });
  const [passSaving, setPassSaving] = useState(false);

  // Notification preferences state
  const [notifPrefs, setNotifPrefs] = useState({
    email_applications: true,
    email_messages:     true,
    email_payments:     true,
    email_job_updates:  false,
    push_enabled:       false,
  });
  const [notifSaving, setNotifSaving] = useState(false);

  // Payment preferences state
  const [paymentPrefs, setPaymentPrefs] = useState({
    mobile_money_number:   "",
    mobile_money_provider: "mtn",
    preferred_method:      "mobile_money",
  });
  const [paymentSaving, setPaymentSaving] = useState(false);

  // Guarantor state
  const [guarantor, setGuarantor] = useState({
    full_name: "", phone_number: "", email: "", residential_address: "",
    relationship: "", occupation: "", national_id_number: "", id_document_url: "",
  });
  const [guarantorStatus, setGuarantorStatus] = useState(null); // null = not submitted
  const [guarantorLoading, setGuarantorLoading] = useState(false);
  const [guarantorSaving, setGuarantorSaving] = useState(false);
  const [docFile, setDocFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  // ── Load profile & guarantor ──
  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setProfileLoading(false); return; }
      setCurrentUserId(session.user.id);

      // Profile
      supabase
        .from("profiles")
        .select("name, bio, avatar_url, skills, location, notification_prefs, payment_prefs")
        .eq("id", session.user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setProfile({
              name:       data.name       ?? "",
              bio:        data.bio        ?? "",
              avatar_url: data.avatar_url ?? "",
              skills:     Array.isArray(data.skills) ? data.skills.join(", ") : (data.skills ?? ""),
              location:   data.location   ?? "",
            });
            if (data.notification_prefs && Object.keys(data.notification_prefs).length) {
              setNotifPrefs((prev) => ({ ...prev, ...data.notification_prefs }));
            }
            if (data.payment_prefs && Object.keys(data.payment_prefs).length) {
              setPaymentPrefs((prev) => ({ ...prev, ...data.payment_prefs }));
            }
          }
          setProfileLoading(false);
        })
        .catch(() => setProfileLoading(false));

      // Guarantor
      setGuarantorLoading(true);
      supabase
        .from("guarantors")
        .select("*")
        .eq("provider_id", session.user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setGuarantor({
              full_name:          data.full_name          ?? "",
              phone_number:       data.phone_number       ?? "",
              email:              data.email              ?? "",
              residential_address:data.residential_address?? "",
              relationship:       data.relationship       ?? "",
              occupation:         data.occupation         ?? "",
              national_id_number: data.national_id_number ?? "",
              id_document_url:    data.id_document_url    ?? "",
            });
            setGuarantorStatus(data.status);
          }
          setGuarantorLoading(false);
        })
        .catch(() => setGuarantorLoading(false));
    }
    init();
  }, []);

  // ── Shared toast helper ──
  function showToast(type, text) {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  }

  // ── Save Profile ──
  async function saveProfile(e) {
    e.preventDefault();
    if (!currentUserId) return;
    setProfileSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        name:       profile.name,
        bio:        profile.bio,
        avatar_url: profile.avatar_url,
        skills:     profile.skills.split(",").map((s) => s.trim()).filter(Boolean),
        location:   profile.location,
      })
      .eq("id", currentUserId);
    setProfileSaving(false);
    error ? showToast("error", "Failed to save profile.") : showToast("success", "Profile updated successfully.");
  }

  // ── Save Password ──
  async function savePassword(e) {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirm) {
      showToast("error", "New passwords do not match."); return;
    }
    if (passwords.newPass.length < 8) {
      showToast("error", "Password must be at least 8 characters."); return;
    }
    setPassSaving(true);
    const { error } = await supabase.auth.updateUser({ password: passwords.newPass });
    setPassSaving(false);
    if (error) {
      showToast("error", error.message ?? "Failed to update password.");
    } else {
      setPasswords({ current: "", newPass: "", confirm: "" });
      showToast("success", "Password updated successfully.");
    }
  }

  // ── Save Notifications ──
  async function saveNotifications(e) {
    e.preventDefault();
    if (!currentUserId) return;
    setNotifSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ notification_prefs: notifPrefs })
      .eq("id", currentUserId);
    setNotifSaving(false);
    error ? showToast("error", "Failed to save preferences.") : showToast("success", "Notification preferences saved.");
  }

  // ── Save Payment Preferences ──
  async function savePayment(e) {
    e.preventDefault();
    if (!currentUserId) return;
    setPaymentSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ payment_prefs: paymentPrefs })
      .eq("id", currentUserId);
    setPaymentSaving(false);
    error ? showToast("error", "Failed to save payment preferences.") : showToast("success", "Payment preferences saved.");
  }

  // ── Upload ID Document ──
  async function handleDocUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !currentUserId) return;
    setDocFile(file);
    setUploading(true);

    const ext = file.name.split(".").pop();
    const path = `${currentUserId}/guarantor-id.${ext}`;
    const { data, error } = await supabase.storage
      .from("guarantor-docs")
      .upload(path, file, { upsert: true });

    if (!error) {
      const { data: urlData } = supabase.storage.from("guarantor-docs").getPublicUrl(path);
      setGuarantor((prev) => ({ ...prev, id_document_url: urlData?.publicUrl ?? "" }));
    } else {
      showToast("error", "Failed to upload document. Ensure the storage bucket exists.");
    }
    setUploading(false);
  }

  // ── Save Guarantor ──
  async function saveGuarantor(e) {
    e.preventDefault();
    if (!currentUserId) return;
    setGuarantorSaving(true);

    const payload = { ...guarantor, provider_id: currentUserId, status: "pending" };

    const { error } = await supabase
      .from("guarantors")
      .upsert(payload, { onConflict: "provider_id" });

    setGuarantorSaving(false);
    if (error) {
      showToast("error", "Failed to save guarantor information.");
    } else {
      setGuarantorStatus("pending");
      showToast("success", "Guarantor information submitted for review.");
    }
  }

  // ─────────────────────────────────────────────
  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="inline-block w-8 h-8 border-4 border-(--color-secondary)/30 border-t-(--color-secondary) rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-headline-md text-(--color-on-background)">Account Settings</h1>
        <p className="text-body-sm text-(--color-on-surface-variant) mt-1">
          Manage your profile, security, and preferences.
        </p>
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
                ? "bg-(--color-secondary) text-(--color-on-secondary) shadow-sm"
                : "text-(--color-on-surface-variant) hover:bg-(--color-surface-container)"
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ── PROFILE TAB ── */}
      {activeTab === "profile" && (
        <form onSubmit={saveProfile} className="bg-white rounded-(--radius-lg) border border-(--color-outline-variant)/30 shadow-sm p-6 space-y-5">
          <h2 className="text-lg font-semibold text-(--color-on-background)">Profile Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Full Name">
              <Input
                value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                placeholder="Your full name"
              />
            </Field>
            <Field label="Location">
              <Input
                value={profile.location}
                onChange={(e) => setProfile((p) => ({ ...p, location: e.target.value }))}
                placeholder="e.g., Yaoundé, Cameroon"
              />
            </Field>
          </div>
          <Field label="Bio" hint="Tell clients about yourself and your experience.">
            <Textarea
              value={profile.bio}
              onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
              placeholder="Describe your skills and experience..."
            />
          </Field>
          <Field label="Skills" hint="Comma-separated list, e.g., Cleaning, Delivery, Tutoring">
            <Input
              value={profile.skills}
              onChange={(e) => setProfile((p) => ({ ...p, skills: e.target.value }))}
              placeholder="Cleaning, Delivery, Gardening..."
            />
          </Field>
          <Field label="Avatar URL" hint="Direct link to your profile photo.">
            <Input
              value={profile.avatar_url}
              onChange={(e) => setProfile((p) => ({ ...p, avatar_url: e.target.value }))}
              placeholder="https://..."
            />
          </Field>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={profileSaving}
              className="flex items-center gap-2 bg-(--color-secondary) text-(--color-on-secondary) px-5 py-2.5 rounded-(--radius-md) text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {profileSaving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      )}

      {/* ── PASSWORD TAB ── */}
      {activeTab === "password" && (
        <form onSubmit={savePassword} className="bg-white rounded-(--radius-lg) border border-(--color-outline-variant)/30 shadow-sm p-6 space-y-5">
          <h2 className="text-lg font-semibold text-(--color-on-background)">Change Password</h2>
          {[
            { key: "current", label: "Current Password" },
            { key: "newPass", label: "New Password" },
            { key: "confirm", label: "Confirm New Password" },
          ].map(({ key, label }) => (
            <Field key={key} label={label}>
              <div className="relative">
                <Input
                  type={showPass[key] ? "text" : "password"}
                  value={passwords[key]}
                  onChange={(e) => setPasswords((p) => ({ ...p, [key]: e.target.value }))}
                  placeholder="••••••••"
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => ({ ...p, [key]: !p[key] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-(--color-outline) hover:text-(--color-on-surface)"
                >
                  {showPass[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>
          ))}
          <p className="text-xs text-(--color-on-surface-variant)">Minimum 8 characters recommended.</p>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={passSaving || !passwords.newPass}
              className="flex items-center gap-2 bg-(--color-secondary) text-(--color-on-secondary) px-5 py-2.5 rounded-(--radius-md) text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              {passSaving ? "Updating…" : "Update Password"}
            </button>
          </div>
        </form>
      )}

      {/* ── NOTIFICATIONS TAB ── */}
      {activeTab === "notifications" && (
        <form onSubmit={saveNotifications} className="bg-white rounded-(--radius-lg) border border-(--color-outline-variant)/30 shadow-sm p-6 space-y-5">
          <h2 className="text-lg font-semibold text-(--color-on-background)">Notification Preferences</h2>
          <div className="space-y-3">
            {[
              { key: "email_applications", label: "New application received", desc: "Get an email when a client accepts your application" },
              { key: "email_messages",     label: "New message received",     desc: "Get an email when you receive a new message" },
              { key: "email_payments",     label: "Payment updates",          desc: "Notifications about escrow releases and payment status" },
              { key: "email_job_updates",  label: "Job status changes",       desc: "When a job you applied for is updated or cancelled" },
              { key: "push_enabled",       label: "Browser push notifications",desc: "Receive real-time push notifications (requires browser permission)" },
            ].map(({ key, label, desc }) => (
              <label key={key} className="flex items-start gap-4 p-4 rounded-(--radius-md) border border-(--color-outline-variant)/30 cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={notifPrefs[key] ?? false}
                    onChange={(e) => setNotifPrefs((p) => ({ ...p, [key]: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-gray-200 peer-checked:bg-(--color-secondary) rounded-full transition-colors" />
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
              disabled={notifSaving}
              className="flex items-center gap-2 bg-(--color-secondary) text-(--color-on-secondary) px-5 py-2.5 rounded-(--radius-md) text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
            >
              <Bell className="w-4 h-4" />
              {notifSaving ? "Saving…" : "Save Preferences"}
            </button>
          </div>
        </form>
      )}

      {/* ── PAYMENT TAB ── */}
      {activeTab === "payment" && (
        <form onSubmit={savePayment} className="bg-white rounded-(--radius-lg) border border-(--color-outline-variant)/30 shadow-sm p-6 space-y-5">
          <h2 className="text-lg font-semibold text-(--color-on-background)">Payment Preferences</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Mobile Money Number">
              <Input
                value={paymentPrefs.mobile_money_number}
                onChange={(e) => setPaymentPrefs((p) => ({ ...p, mobile_money_number: e.target.value }))}
                placeholder="+237 6XX XXX XXX"
                type="tel"
              />
            </Field>
            <Field label="Mobile Money Provider">
              <select
                value={paymentPrefs.mobile_money_provider}
                onChange={(e) => setPaymentPrefs((p) => ({ ...p, mobile_money_provider: e.target.value }))}
                className="w-full px-4 py-2.5 border border-(--color-outline-variant)/50 rounded-(--radius-md) text-sm bg-gray-50 outline-none focus:border-(--color-secondary) focus:bg-white transition-all"
              >
                <option value="mtn">MTN Mobile Money</option>
                <option value="orange">Orange Money</option>
                <option value="express_union">Express Union</option>
              </select>
            </Field>
          </div>
          <Field label="Preferred Payout Method">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { value: "mobile_money", label: "Mobile Money" },
                { value: "card",         label: "Bank Card" },
                { value: "cash",         label: "Cash (Record Only)" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-(--radius-md) border cursor-pointer transition-all",
                    paymentPrefs.preferred_method === opt.value
                      ? "border-(--color-secondary) bg-(--color-secondary-container)/20"
                      : "border-(--color-outline-variant)/30 hover:border-(--color-secondary)/40"
                  )}
                >
                  <input
                    type="radio"
                    name="preferred_method"
                    value={opt.value}
                    checked={paymentPrefs.preferred_method === opt.value}
                    onChange={(e) => setPaymentPrefs((p) => ({ ...p, preferred_method: e.target.value }))}
                    className="accent-(--color-secondary)"
                  />
                  <span className="text-sm font-medium text-(--color-on-background)">{opt.label}</span>
                </label>
              ))}
            </div>
          </Field>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={paymentSaving}
              className="flex items-center gap-2 bg-(--color-secondary) text-(--color-on-secondary) px-5 py-2.5 rounded-(--radius-md) text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
            >
              <CreditCard className="w-4 h-4" />
              {paymentSaving ? "Saving…" : "Save Payment Info"}
            </button>
          </div>
        </form>
      )}

      {/* ── VERIFICATION TAB ── */}
      {activeTab === "verification" && (
        <div className="space-y-5">
          {/* Status banner */}
          {guarantorStatus && (() => {
            const meta = GUARANTOR_STATUS_META[guarantorStatus] ?? GUARANTOR_STATUS_META.pending;
            const StatusIcon = meta.icon;
            return (
              <div className={cn("flex items-center gap-3 p-4 rounded-(--radius-lg) border font-semibold text-sm", meta.color)}>
                <StatusIcon className="w-5 h-5 flex-shrink-0" />
                <div>
                  <span>Guarantor Status: {meta.label}</span>
                  {guarantorStatus === "rejected" && (
                    <p className="text-xs font-normal mt-0.5">
                      Your submission was rejected. Please review and resubmit with correct information.
                    </p>
                  )}
                  {guarantorStatus === "verified" && (
                    <p className="text-xs font-normal mt-0.5">
                      Your guarantor has been verified. Your verification badge is now active.
                    </p>
                  )}
                </div>
              </div>
            );
          })()}

          {guarantorLoading ? (
            <div className="p-16 flex justify-center">
              <span className="inline-block w-8 h-8 border-4 border-(--color-secondary)/30 border-t-(--color-secondary) rounded-full animate-spin" />
            </div>
          ) : (
            <form onSubmit={saveGuarantor} className="bg-white rounded-(--radius-lg) border border-(--color-outline-variant)/30 shadow-sm p-6 space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-(--color-on-background)">Guarantor Information</h2>
                <p className="text-sm text-(--color-on-surface-variant) mt-1">
                  Provide a guarantor's details to complete your provider verification. Only administrators can view this information.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Full Name *">
                  <Input
                    required
                    value={guarantor.full_name}
                    onChange={(e) => setGuarantor((g) => ({ ...g, full_name: e.target.value }))}
                    placeholder="Guarantor's full legal name"
                  />
                </Field>
                <Field label="Phone Number *">
                  <Input
                    required
                    type="tel"
                    value={guarantor.phone_number}
                    onChange={(e) => setGuarantor((g) => ({ ...g, phone_number: e.target.value }))}
                    placeholder="+237 6XX XXX XXX"
                  />
                </Field>
                <Field label="Email Address">
                  <Input
                    type="email"
                    value={guarantor.email}
                    onChange={(e) => setGuarantor((g) => ({ ...g, email: e.target.value }))}
                    placeholder="guarantor@email.com"
                  />
                </Field>
                <Field label="Relationship to You *">
                  <select
                    required
                    value={guarantor.relationship}
                    onChange={(e) => setGuarantor((g) => ({ ...g, relationship: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-(--color-outline-variant)/50 rounded-(--radius-md) text-sm bg-gray-50 outline-none focus:border-(--color-secondary) focus:bg-white transition-all"
                  >
                    <option value="">Select relationship…</option>
                    <option value="parent">Parent</option>
                    <option value="guardian">Guardian</option>
                    <option value="sibling">Sibling</option>
                    <option value="spouse">Spouse</option>
                    <option value="employer">Employer</option>
                    <option value="colleague">Colleague</option>
                    <option value="friend">Friend</option>
                    <option value="other">Other</option>
                  </select>
                </Field>
                <Field label="Occupation *">
                  <Input
                    required
                    value={guarantor.occupation}
                    onChange={(e) => setGuarantor((g) => ({ ...g, occupation: e.target.value }))}
                    placeholder="e.g., Civil Servant, Teacher"
                  />
                </Field>
                <Field label="National ID Number *">
                  <Input
                    required
                    value={guarantor.national_id_number}
                    onChange={(e) => setGuarantor((g) => ({ ...g, national_id_number: e.target.value }))}
                    placeholder="CNI / National ID number"
                  />
                </Field>
              </div>

              <Field label="Residential Address *" hint="Full residential address of the guarantor.">
                <Textarea
                  required
                  value={guarantor.residential_address}
                  onChange={(e) => setGuarantor((g) => ({ ...g, residential_address: e.target.value }))}
                  placeholder="Street, city, region…"
                />
              </Field>

              {/* ID Document Upload */}
              <Field label="ID Document Upload" hint="Upload a scan or photo of the guarantor's National ID card. Accepted: JPG, PNG, PDF (max 5MB).">
                <div className="border-2 border-dashed border-(--color-outline-variant)/50 rounded-(--radius-md) p-5 text-center hover:border-(--color-secondary)/50 transition-colors">
                  {guarantor.id_document_url ? (
                    <div className="space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                      <p className="text-sm font-semibold text-emerald-700">Document uploaded</p>
                      <a
                        href={guarantor.id_document_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-(--color-secondary) hover:underline"
                      >
                        View uploaded file →
                      </a>
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="block mx-auto text-xs text-(--color-on-surface-variant) hover:underline mt-1"
                      >
                        Replace file
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 text-(--color-outline) mx-auto" />
                      <p className="text-sm text-(--color-on-surface-variant)">
                        {uploading ? "Uploading…" : "Click to browse or drag and drop"}
                      </p>
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className="text-sm font-semibold text-(--color-secondary) hover:underline disabled:opacity-50"
                      >
                        {uploading ? "Uploading…" : "Choose File"}
                      </button>
                    </div>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={handleDocUpload}
                  />
                </div>
              </Field>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={guarantorSaving || uploading || guarantorStatus === "verified"}
                  className="flex items-center gap-2 bg-(--color-secondary) text-(--color-on-secondary) px-5 py-2.5 rounded-(--radius-md) text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {guarantorSaving
                    ? "Submitting…"
                    : guarantorStatus === "verified"
                    ? "Verified ✓"
                    : guarantorStatus === "pending"
                    ? "Resubmit for Review"
                    : "Submit for Review"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <Toast message={toast} />
    </div>
  );
}
