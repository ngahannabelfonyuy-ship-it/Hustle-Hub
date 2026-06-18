"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";
import { Search, MapPin, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = ["All", "Cleaning", "Moving", "Delivery", "Assembly", "Tech Support", "Yard Work", "Other"];

export default function FindWorkPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("All");
  
  // Modal state
  const [selectedJob, setSelectedJob] = useState(null);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setJobs(data);
      }
      setLoading(false);
    }
    load();
  }, []);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          job.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = category === "All" || job.category === category; // Mock data might not have category, so this is a simplified filter
    return matchesSearch && matchesCategory;
  });

  const handleApply = async () => {
    setApplying(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        alert("You must be logged in to apply for jobs.");
        return;
      }
      
      const { error } = await supabase
        .from("applications")
        .insert({
          job_id: selectedJob.id,
          provider_id: session.user.id,
          cover_note: "Applied from job board.",
          status: "pending"
        });

      if (error) {
        alert("Failed to submit application: " + error.message);
        return;
      }

      setApplied(true);
      setTimeout(() => {
        setSelectedJob(null);
        setApplied(false);
      }, 2000);
    } catch (err) {
      console.error("Apply error:", err);
      alert("An unexpected error occurred while applying.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="min-h-screen bg-(--color-background) text-(--color-on-background) flex flex-col">
      <Navbar />
      
      <main className="flex-grow max-w-6xl mx-auto px-5 md:px-12 py-8 w-full">
        <div className="mb-8">
          <h1 className="text-headline-lg font-bold text-(--color-primary)">Find Work</h1>
          <p className="text-body-md text-(--color-on-surface-variant) mt-2">Browse available jobs and apply to the ones that fit your skills.</p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-(--radius-lg) shadow-sm border border-(--color-outline-variant)/30 mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-(--color-outline)" />
            <input 
              type="text" 
              placeholder="Search jobs by title or keyword..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-(--color-outline-variant)/50 rounded-(--radius-md) outline-none focus:ring-2 focus:ring-(--color-primary)/20 focus:border-(--color-primary) transition-all"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button 
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border",
                  category === cat 
                    ? "bg-(--color-primary) text-(--color-on-primary) border-(--color-primary)" 
                    : "bg-white text-(--color-on-surface-variant) border-(--color-outline-variant)/40 hover:border-(--color-primary)/50"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <span className="inline-block w-8 h-8 border-4 border-(--color-primary)/30 border-t-(--color-primary) rounded-full animate-spin" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-(--radius-lg) border border-(--color-outline-variant)/30">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-(--color-on-background)">No jobs found</h3>
            <p className="text-(--color-on-surface-variant)">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map(job => (
              <div key={job.id} className="bg-white rounded-(--radius-lg) shadow-sm border border-(--color-outline-variant)/30 p-6 flex flex-col hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg leading-tight text-(--color-on-background) line-clamp-2">{job.title}</h3>
                  <span className="bg-emerald-100 text-emerald-800 text-sm font-bold px-2.5 py-1 rounded-md shrink-0">
                    FCFA {job.budget.toLocaleString()}
                  </span>
                </div>
                
                <p className="text-body-sm text-(--color-on-surface-variant) line-clamp-3 mb-6 flex-grow">
                  {job.description}
                </p>
                
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-xs text-(--color-on-surface-variant)">
                    <MapPin className="w-4 h-4 text-(--color-outline)" />
                    {job.location}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-(--color-on-surface-variant)">
                    <Clock className="w-4 h-4 text-(--color-outline)" />
                    Posted {new Date(job.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                <button 
                  onClick={() => setSelectedJob(job)}
                  className="w-full py-2.5 text-sm font-semibold text-(--color-primary) bg-blue-50 hover:bg-blue-100 rounded-(--radius-md) transition-colors mt-auto"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Application Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-(--radius-xl) shadow-level-3 w-full max-w-lg max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200">
            <div className="p-6 md:p-8">
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-(--color-on-background)">{selectedJob.title}</h2>
                  <div className="flex flex-wrap gap-3 mt-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                      <MapPin className="w-3.5 h-3.5" /> {selectedJob.location}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                      FCFA {selectedJob.budget.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="prose prose-sm max-w-none text-(--color-on-surface-variant) mb-8">
                <h4 className="text-sm font-bold text-(--color-on-background) uppercase tracking-wider mb-2">Job Description</h4>
                <p className="whitespace-pre-wrap leading-relaxed">{selectedJob.description}</p>
              </div>

              <div className="border-t border-(--color-outline-variant)/30 pt-6">
                {applied ? (
                  <div className="bg-emerald-50 text-emerald-800 p-4 rounded-(--radius-md) flex items-center gap-3 animate-in fade-in">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    <div>
                      <h4 className="font-bold">Application Sent!</h4>
                      <p className="text-xs mt-0.5">The client will review your profile.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setSelectedJob(null)}
                      className="flex-1 px-4 py-3 border border-(--color-outline-variant)/50 rounded-(--radius-md) font-semibold text-(--color-on-surface) hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleApply}
                      disabled={applying}
                      className="flex-[2] px-4 py-3 bg-(--color-primary) text-(--color-on-primary) rounded-(--radius-md) font-semibold flex justify-center items-center gap-2 hover:opacity-95 transition-opacity disabled:opacity-70"
                    >
                      {applying ? (
                        <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : "Apply for this Job"}
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
