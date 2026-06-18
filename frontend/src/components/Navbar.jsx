"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Menu, X, LogOut, LayoutDashboard, User } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const router = useRouter();

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      
      if (!error && data) {
        setProfile(data);
      } else {
        // Fallback to metadata
        const sessionUser = (await supabase.auth.getSession()).data.session?.user;
        if (sessionUser) {
          setProfile({
            name: sessionUser.user_metadata?.name || "User",
            role: sessionUser.user_metadata?.role || "student",
            avatar_url: sessionUser.user_metadata?.avatar_url || null,
          });
        }
      }
    } catch (err) {
      console.error("Error fetching navbar profile:", err);
    }
  };

  useEffect(() => {
    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsOpen(false);
    router.push("/");
  };

  // Get dashboard link based on role
  const getDashboardHref = () => {
    if (!profile) return "/dashboard";
    if (profile.role === "admin") return "/admin";
    if (profile.role === "employer") return "/client-dashboard";
    return "/dashboard";
  };

  // Array of items to easily extend or shrink the menu
  const menuItems = [
    { label: "Find Work", href: "/find-work" },
    { label: "Find Help", href: "/find-help" },
    { label: "Trust & Safety", href: "/trust-safety" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-(--color-background)/75 backdrop-blur-md border-b border-(--color-outline-variant)/30 py-4 px-5 md:px-12 shadow-sm transition-all duration-300">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Left container for logo and links */}
        <div className="flex items-center gap-10">
          {/* Brand Logo */}
          <Link href="/" className="text-2xl font-bold font-[family-name:--font-headline] text-(--color-primary) hover:scale-[1.02] transition-transform flex items-center gap-1.5">
            <span className="bg-gradient-to-br from-(--color-primary) to-indigo-500 text-white w-8 h-8 rounded-lg flex items-center justify-center text-lg shadow-sm">H</span>
            <span>HustleHub</span>
          </Link>
          
          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8 text-body-md font-semibold text-(--color-on-background)">
            {menuItems.map((item, index) => (
              <Link 
                key={index} 
                href={item.href} 
                className="hover:text-(--color-primary) transition-colors duration-200 relative group"
              >
                {item.label}
                <span className="absolute bottom-[-4px] left-0 w-0 h-0.5 bg-(--color-primary) transition-all duration-200 group-hover:w-full" />
              </Link>
            ))}
          </div>
        </div>

        {/* Action Buttons (Desktop Only) */}
        <div className="hidden md:flex items-center gap-4">
          {session ? (
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2.5">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-(--color-outline-variant)/50 shadow-sm" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-(--color-primary) font-bold text-sm shadow-sm">
                    {profile?.name ? profile.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                  </div>
                )}
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-(--color-on-background)">{profile?.name}</span>
                  <span className="text-[10px] text-(--color-on-surface-variant) capitalize font-semibold">{profile?.role}</span>
                </div>
              </div>

              <Link 
                href={getDashboardHref()} 
                className="flex items-center gap-1.5 text-body-sm font-semibold text-(--color-primary) hover:opacity-85 transition-opacity"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>

              <button 
                onClick={handleLogout} 
                className="flex items-center gap-1.5 text-body-sm font-semibold text-gray-500 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </button>
            </div>
          ) : (
            <>
              <Link href="/login" className="text-body-md font-semibold text-(--color-on-background) hover:text-(--color-primary) transition-colors px-3 py-2">
                Log In
              </Link>
              <Link href="/signup" className="bg-gradient-to-r from-(--color-primary) to-indigo-700 text-(--color-on-primary) px-5 py-2.5 rounded-(--radius-md) font-semibold hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Utility Controls */}
        <div className="flex items-center gap-4 md:hidden">
          {session && (
            <button className="text-(--color-on-background) p-1" aria-label="Notifications">
              <Bell className="w-6 h-6" strokeWidth={2} />
            </button>
          )}

          {/* Hamburger Menu Toggle Button */}
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="text-(--color-on-background) p-1 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {isOpen ? (
              <X className="w-6 h-6" strokeWidth={2} />
            ) : (
              <Menu className="w-6 h-6" strokeWidth={2} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown Panel */}
      {isOpen && (
        <div className="md:hidden mt-4 pt-4 border-t border-(--color-outline-variant)/20 flex flex-col gap-4 animate-in slide-in-from-top-4 duration-200">
          {menuItems.map((item, index) => (
            <Link 
              key={index} 
              href={item.href} 
              className="text-body-md py-2 font-medium border-b border-gray-100" 
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          
          {session ? (
            <div className="flex flex-col gap-3.5 pt-2">
              <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-10 h-10 rounded-full object-cover border border-(--color-outline-variant)/50" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-(--color-primary) font-bold">
                    {profile?.name ? profile.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                  </div>
                )}
                <div className="flex flex-col text-left">
                  <span className="text-sm font-bold text-(--color-on-background)">{profile?.name}</span>
                  <span className="text-xs text-(--color-on-surface-variant) capitalize">{profile?.role}</span>
                </div>
              </div>

              <Link 
                href={getDashboardHref()} 
                className="w-full flex items-center justify-center gap-2 border border-(--color-outline-variant)/40 text-(--color-primary) py-3 rounded-(--radius-md) font-semibold text-center hover:bg-gray-50 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <LayoutDashboard className="w-4.5 h-4.5" />
                Dashboard
              </Link>
              
              <button 
                onClick={handleLogout} 
                className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 py-3 rounded-(--radius-md) font-semibold text-center hover:bg-red-100 transition-colors"
              >
                <LogOut className="w-4.5 h-4.5" />
                Log Out
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 mt-2">
              <Link 
                href="/login" 
                className="w-full border border-(--color-outline-variant)/40 text-(--color-primary) py-3 rounded-(--radius-md) font-semibold text-center hover:bg-gray-50 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Log In
              </Link>
              <Link 
                href="/signup" 
                className="w-full bg-(--color-primary) text-(--color-on-primary) py-3 rounded-(--radius-md) font-semibold text-center hover:opacity-90 transition-opacity"
                onClick={() => setIsOpen(false)}
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}