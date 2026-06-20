import { useState, useEffect, FormEvent } from "react";
import { 
  Clipboard, 
  Send, 
  Calendar, 
  User, 
  Briefcase, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Trash2, 
  Mail, 
  FileText, 
  BarChart3, 
  Compass, 
  PlusCircle, 
  X,
  Sparkles,
  Info
} from "lucide-react";
import { SAMPLE_SLACK_MESSAGES, SampleSlackMessage } from "./samples";
import { SlackProgressSummary } from "./types";

export default function App() {
  const [currentPage, setCurrentPage] = useState<"paste" | "dashboard">("paste");
  const [pastedText, setPastedText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dashboard status list
  const [history, setHistory] = useState<SlackProgressSummary[]>([]);
  
  // Custom toast notification system
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Email sending modal variables
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Selected filters for dashboard
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<string>("All");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("All");

  // Load initial dataset from localStorage or fallback
  useEffect(() => {
    const saved = localStorage.getItem("slack_status_summaries");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse local status history", e);
      }
    } else {
      // Seed with some elegant default entries for visualization
      const sampleSeed: SlackProgressSummary[] = [
        {
          id: "seed-1",
          date: "2026-06-20",
          employee_name: "Siddharth (Lead Dev)",
          project_name: "Auth Core",
          progress: [
            "Spent the morning debugging the oauth token expiration issues in the login flow.",
            "Visual draft of the dashboard charts completed successfully."
          ],
          blockers: ["Waiting on DevOps to grant access to staging DB bucket credentials."],
          plan: ["Write test scripts for oauth edge cases", "Finalize main DB connection parameters"],
          raw_text: "Sample slack import...",
          created_at: new Date(Date.now() - 3600000 * 2).toISOString()
        },
        {
          id: "seed-2",
          date: "2026-06-20",
          employee_name: "Jessica (Marketing PM)",
          project_name: "SEO Engine",
          progress: [
            "Completed SEO audit and structured metadata header tags for better indexing.",
            "Styled SendGrid newsletters and verified responsive layouts."
          ],
          blockers: ["Stripe webhook signatures failing on the dev gateway endpoint."],
          plan: ["Organize promotional content calendar", "Schedule beta candidate email batches"],
          raw_text: "Marketing weekly update...",
          created_at: new Date(Date.now() - 3600000).toISOString()
        }
      ];
      setHistory(sampleSeed);
      localStorage.setItem("slack_status_summaries", JSON.stringify(sampleSeed));
    }
  }, []);

  // Sync state to localStorage
  const updateHistory = (newHistory: SlackProgressSummary[]) => {
    setHistory(newHistory);
    localStorage.setItem("slack_status_summaries", JSON.stringify(newHistory));
  };

  // Quick helper for toast alerts
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Pre-load raw Slack updates from the templates
  const handleSelectSample = (sample: SampleSlackMessage) => {
    setPastedText(sample.text);
    showToast(`Loaded ${sample.title} template!`, "info");
  };

  // Submit and call Gemini API on express backend
  const handleExtract = async () => {
    if (!pastedText.trim()) {
      setErrorMsg("Please paste some Slack logs or template updates first.");
      return;
    }

    setIsExtracting(true);
    setErrorMsg(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

      const res = await fetch("/api/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: pastedText }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to parse content via Gemini model API.");
      }

      const data = await res.json();
      
      // Make parsed summary structure
      const newEntry: SlackProgressSummary = {
        id: "status-" + Math.random().toString(36).substr(2, 9),
        date: data.date || new Date().toISOString().split('T')[0],
        employee_name: data.employee_name || "Unknown Author",
        project_name: data.project_name || "General Work",
        progress: Array.isArray(data.progress) ? data.progress : [data.progress],
        blockers: Array.isArray(data.blockers) ? data.blockers : [data.blockers].filter(Boolean),
        plan: Array.isArray(data.plan) ? data.plan : [data.plan],
        raw_text: pastedText,
        created_at: new Error().stack ? new Date().toISOString() : "2026-06-20T00:00:00Z",
      };

      // Prepended record
      const updated = [newEntry, ...history];
      updateHistory(updated);
      
      setPastedText("");
      showToast("Successfully extracted with Gemini 2.5 Flash status metrics!", "success");
      // Seamless direct navigation to dashboard
      setCurrentPage("dashboard");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred during Gemini AI processing.");
      showToast(err.message || "Extraction failed.", "error");
    } finally {
      setIsExtracting(false);
    }
  };

  // Deleting item from history
  const handleDeleteEntry = (id: string) => {
    const updated = history.filter(item => item.id !== id);
    updateHistory(updated);
    showToast("Status entry removed from your local workspace.", "info");
  };

  // Triggering the Send Email Simulation Modal
  const openEmailModal = () => {
    // Generate text summary with standard format for active dashboard entries
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysUpdates = history.filter(item => item.date === todayStr || history.length <= 4);
    
    if (todaysUpdates.length === 0) {
      showToast("No status reports recorded. Capture some first!", "error");
      return;
    }

    let compiledReportBody = `DAILY STATUS UPDATE PANEL - Generated on ${todayStr}\n`;
    compiledReportBody += `=================================================\n\n`;

    todaysUpdates.forEach((item, index) => {
      compiledReportBody += `${index + 1}. ${item.employee_name} | Project: [${item.project_name}] | Date: ${item.date}\n`;
      
      compiledReportBody += `   🟢 PROGRESS:\n`;
      item.progress.forEach(p => compiledReportBody += `     - ${p}\n`);
      
      if (item.blockers && item.blockers.length > 0) {
        compiledReportBody += `   🔴 BLOCKERS/DEPENDENCIES:\n`;
        item.blockers.forEach(b => compiledReportBody += `     - ${b}\n`);
      } else {
        compiledReportBody += `   🔴 BLOCKERS: None reported\n`;
      }
      
      compiledReportBody += `   🔵 NEXT STEPS/PLAN:\n`;
      item.plan.forEach(pl => compiledReportBody += `     - ${pl}\n`);
      compiledReportBody += `\n-------------------------------------------------\n\n`;
    });

    compiledReportBody += `Generated automatically with Slack Status Summarizer powered by Gemini AI.\n`;

    setEmailRecipient("team-leads@mycompany.com");
    setEmailSubject(`Daily Status Consolidated Report - ${todayStr}`);
    setEmailBody(compiledReportBody);
    setIsEmailModalOpen(true);
  };

  // Simulated email delivery logic calling our real express backend
  const handleSendEmailSimulation = async (e: FormEvent) => {
    e.preventDefault();
    if (!emailRecipient.trim() || !emailSubject.trim() || !emailBody.trim()) {
      showToast("All fields are required to deliver the progress digest.", "error");
      return;
    }

    setIsSendingEmail(true);
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          to: emailRecipient,
          subject: emailSubject,
          body: emailBody
        })
      });

      if (!res.ok) {
        throw new Error("Could not execute simulated email delivery endpoint.");
      }

      await res.json();
      showToast(`Email dispatched to ${emailRecipient}! (Simulated outcome)`, "success");
      setIsEmailModalOpen(false);
    } catch (err: any) {
      console.error(err);
      showToast("Simulated delivery met an error. Sending bypassed.", "error");
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Filter lists configuration
  const uniqueProjects = Array.from(new Set(history.map(h => h.project_name)));
  const uniqueEmployees = Array.from(new Set(history.map(h => h.employee_name)));

  // Filter logic
  const filteredHistory = history.filter(item => {
    const matchesSearch = 
      item.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.progress.some(p => p.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.blockers.some(b => b.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.plan.some(pl => pl.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesProject = selectedProject === "All" || item.project_name === selectedProject;
    const matchesEmployee = selectedEmployee === "All" || item.employee_name === selectedEmployee;

    return matchesSearch && matchesProject && matchesEmployee;
  });

  // KPI Calculations
  const totalEmployeesReported = uniqueEmployees.length;
  const activeBlockersCount = history.reduce((acc, h) => acc + (h.blockers?.length || 0), 0);
  const totalReportsCount = history.length;

  return (
    <div id="app_root" className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased">
      
      {/* Toast Notification */}
      {toast && (
        <div id="toast_container" className="fixed top-5 right-5 z-50 transform transition-all duration-300 animate-slide-in">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
            toast.type === "success" 
              ? "bg-emerald-50 text-emerald-800 border-emerald-100" 
              : toast.type === "error"
              ? "bg-rose-50 text-rose-800 border-rose-100"
              : "bg-indigo-50 text-indigo-800 border-indigo-100"
          }`}>
            <Sparkles className="w-5 h-5 shrink-0" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Corporate Header Section */}
      <header id="app_header" className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Logo Brand Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-soft shadow-indigo-100">
              <Clipboard className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display font-medium text-lg tracking-tight text-slate-800">Slack Status Parser</h1>
              <p className="text-xs text-slate-500 font-medium font-mono">powered by Gemini 2.5 Flash</p>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/50">
            <button
              id="nav_btn_paste"
              onClick={() => { setCurrentPage("paste"); setErrorMsg(null); }}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
                currentPage === "paste" 
                  ? "bg-white text-indigo-600 shadow-sm" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Paste Update</span>
            </button>
            <button
              id="nav_btn_dashboard"
              onClick={() => setCurrentPage("dashboard")}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
                currentPage === "dashboard" 
                  ? "bg-white text-indigo-600 shadow-sm" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard View</span>
              {history.length > 0 && (
                <span className="ml-1 bg-indigo-50 text-indigo-600 px-1.5 py-0.5 text-xs rounded-full font-mono font-bold">
                  {history.length}
                </span>
              )}
            </button>
          </div>

          {/* External Github Ready Badge */}
          <div className="hidden sm:flex items-center gap-2 text-xs bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-500 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Vercel / GitHub Ready</span>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* VIEW 1: PASTE / EXTRACT messages */}
        {currentPage === "paste" && (
          <div id="view_paste_container" className="max-w-4xl mx-auto grid grid-cols-1 gap-8">
            
            {/* Visual Intro Banner */}
            <div id="intro_banner" className="bg-gradient-to-tr from-slate-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl"></div>
              <div className="absolute left-1/3 bottom-0 w-32 h-32 bg-slate-500/10 rounded-full blur-xl"></div>
              
              <div className="relative z-10 max-w-xl">
                <span className="bg-indigo-500/25 border border-indigo-400/20 text-indigo-200 text-xs font-semibold tracking-wider uppercase px-3 py-1 rounded-full font-mono">
                  Workspace AI Extraction
                </span>
                <h2 className="text-2xl sm:text-3xl font-display font-medium text-white tracking-tight mt-3 mb-2">
                  Paste unstructured chat, build instantly organized reports
                </h2>
                <p className="text-slate-350 text-sm leading-relaxed">
                  Avoid formatting checklists manually. Simply copy and paste messages directly from your Slack client chat log or thread, then load raw information. Our integrated Gemini AI identifies key metrics automatically.
                </p>
              </div>
            </div>

            {/* Core Workflow Interaction */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Sample Templates Setup */}
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Compass className="w-4.5 h-4.5 text-indigo-500" />
                    <h3 className="text-sm font-semibold text-slate-800">Test Templates</h3>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Don't have your Slack app close by? Select one of our real workspace logs below to see the extraction logic in action instantly:
                  </p>
                  
                  <div className="flex flex-col gap-2.5 pt-1">
                    {SAMPLE_SLACK_MESSAGES.map((sample, idx) => (
                      <button
                        key={idx}
                        id={`sample_btn_${idx}`}
                        type="button"
                        onClick={() => handleSelectSample(sample)}
                        className="group text-left p-3 rounded-lg border border-slate-200/80 bg-slate-50 hover:bg-indigo-50/40 hover:border-indigo-200 transition-all text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between font-medium text-slate-800 group-hover:text-indigo-700 transition-colors">
                          <span>{sample.title}</span>
                          <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transform translate-x-[-4px] group-hover:translate-x-0 transition-all" />
                        </div>
                        <p className="text-slate-400 line-clamp-2 text-[11px] font-mono leading-normal">
                          {sample.text}
                        </p>
                      </button>
                    ))}
                  </div>
                  
                  <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100/50 text-[11px] text-slate-600 flex gap-2">
                    <Info className="w-4 h-4 shrink-0 text-indigo-500 mt-0.5" />
                    <span className="leading-normal">
                      Each extraction uses <strong>gemini-2.5-flash</strong> with strict structured JSON schema configuration constraints on the backend.
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Paste Textarea Interface */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-4">
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4.5 h-4.5 text-indigo-500" />
                      <label htmlFor="slack_paste_input" className="text-sm font-semibold text-slate-850">
                        Paste Slack Message Here
                      </label>
                    </div>
                    {pastedText && (
                      <button 
                        type="button" 
                        onClick={() => setPastedText("")}
                        className="text-xs text-rose-500 font-medium hover:underline"
                      >
                        Clear text
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <textarea
                      id="slack_paste_input"
                      rows={9}
                      className="w-full text-sm font-mono p-4 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                      placeholder="siddharth 10:15 AM&#10;Hey team, spent the morning fixing oauth token expiration bugs...&#10;Blocked: Waiting for dev keys...&#10;Plan: finalize DB test patterns..."
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                    />
                  </div>

                  {errorMsg && (
                    <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 text-xs text-rose-700 flex items-center gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-slate-400 font-mono">
                      {pastedText.length ? `${pastedText.length} characters pasted` : "Awaiting clipboard content"}
                    </span>

                    <button
                      id="btn_extract_submit"
                      type="button"
                      disabled={isExtracting}
                      onClick={handleExtract}
                      className={`flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl text-white shadow-soft shadow-indigo-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all ${
                        isExtracting 
                          ? "bg-slate-400 cursor-not-allowed" 
                          : "bg-indigo-600 hover:bg-indigo-700 active:scale-98"
                      }`}
                    >
                      {isExtracting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                          <span>AI Parsing...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-indigo-200" />
                          <span>Extract Status</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              </div>

            </div>

          </div>
        )}

        {/* VIEW 2: DASHBOARD VIEW for aggregated summaries */}
        {currentPage === "dashboard" && (
          <div id="view_dashboard_container" className="space-y-6">
            
            {/* Quick Summary Dashboard Banner with KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              {/* Introduction Card */}
              <div className="md:col-span-1 bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs text-slate-450 font-semibold tracking-wider uppercase font-mono">WORKSPACE SUMMARY</h3>
                  <h4 className="text-lg font-display font-medium text-slate-800 mt-1">Status Consolidation</h4>
                </div>
                <div className="mt-4">
                  <button
                    id="btn_open_email_simulation"
                    type="button"
                    onClick={openEmailModal}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email Today's Status</span>
                  </button>
                </div>
              </div>

              {/* KPI 1 */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-semibold tracking-wider font-mono">TOTAL REPORTS</span>
                  <p className="text-3xl font-display font-bold text-slate-800 mt-1">{totalReportsCount}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <FileText className="w-5 h-5" />
                </div>
              </div>

              {/* KPI 2 */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-semibold tracking-wider font-mono">ACTIVE BLOCKERS</span>
                  <p className="text-3xl font-display font-bold text-slate-800 mt-1">{activeBlockersCount}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${activeBlockersCount > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>

              {/* KPI 3 */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-semibold tracking-wider font-mono">MEMBERS VISIBLE</span>
                  <p className="text-3xl font-display font-bold text-slate-800 mt-1">{totalEmployeesReported}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                  <User className="w-5 h-5" />
                </div>
              </div>

            </div>

            {/* Dashboard Filters Area */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              
              {/* Search String Input */}
              <div className="relative w-full md:w-80">
                <input
                  id="search_filter_input"
                  type="text"
                  placeholder="Search progress, task, blocker..."
                  className="w-full text-xs p-2.5 pl-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Filter Dropdowns */}
              <div className="w-full md:w-auto flex flex-wrap items-center gap-3">
                
                {/* Project Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-xs font-medium font-mono">Project:</span>
                  <select
                    id="filter_project_select"
                    className="text-xs p-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                  >
                    <option value="All">All Projects ({uniqueProjects.length})</option>
                    {uniqueProjects.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Team member selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-xs font-medium font-mono">Team:</span>
                  <select
                    id="filter_employee_select"
                    className="text-xs p-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                  >
                    <option value="All">All Members ({uniqueEmployees.length})</option>
                    {uniqueEmployees.map((e) => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                </div>

                {/* Clear Filters helper */}
                {(searchQuery || selectedProject !== "All" || selectedEmployee !== "All") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedProject("All");
                      setSelectedEmployee("All");
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    Reset filters
                  </button>
                )}

              </div>

            </div>

            {/* List of Extracted Records */}
            {filteredHistory.length === 0 ? (
              <div id="no_records_box" className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center max-w-lg mx-auto">
                <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center mx-auto text-slate-400 mb-4">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-850">No status records found</h3>
                <p className="text-xs text-slate-550 leading-relaxed mt-2">
                  No structured data matches your active filter query. Switch to the <strong>Paste Update</strong> tab to paste unstructured texts first.
                </p>
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage("paste")}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-slate-800 rounded-lg transition-all"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Add status entry</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredHistory.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl border border-slate-200/80 shadow-xs hover:shadow-soft transition-all p-5 flex flex-col justify-between space-y-4"
                  >
                    
                    {/* Entry Header */}
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 id={`col_member_name_${item.id}`} className="font-display font-medium text-slate-800 text-base flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                            {item.employee_name}
                          </h3>
                          
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-mono">
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200/60">
                              <Calendar className="w-3.5 h-3.5" />
                              {item.date}
                            </span>
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50/50 text-indigo-700 border border-indigo-100/40">
                              <Briefcase className="w-3.5 h-3.5" />
                              {item.project_name}
                            </span>
                          </div>
                        </div>

                        {/* Delete entry action */}
                        <button
                          type="button"
                          onClick={() => handleDeleteEntry(item.id)}
                          className="text-slate-400 hover:text-red-500 rounded p-1 hover:bg-slate-50 transition-all opacity-80 hover:opacity-100"
                          title="Remove from history"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Structured Info Blocks */}
                      <div className="mt-5 space-y-4">
                        
                        {/* 1. PROGRESS */}
                        <div className="space-y-1.5">
                          <h4 className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Progress / Completed</span>
                          </h4>
                          <ul className="text-slate-600 text-xs pl-5 list-disc space-y-1 leading-relaxed">
                            {item.progress && item.progress.length > 0 ? (
                              item.progress.map((p, idx) => (
                                <li key={idx}>{p}</li>
                              ))
                            ) : (
                              <li className="text-slate-400 italic">No progress reported.</li>
                            )}
                          </ul>
                        </div>

                        {/* 2. BLOCKERS */}
                        <div className="space-y-1.5">
                          <h4 className={`text-xs font-semibold flex items-center gap-1.5 ${item.blockers && item.blockers.length > 0 ? 'text-red-800' : 'text-slate-550'}`}>
                            <AlertCircle className={`w-3.5 h-3.5 shrink-0 ${item.blockers && item.blockers.length > 0 ? 'text-red-600' : 'text-slate-400'}`} />
                            <span>Blockers / Dependencies</span>
                          </h4>
                          {item.blockers && item.blockers.length > 0 ? (
                            <ul className="text-slate-600 text-xs pl-5 list-disc space-y-1 leading-relaxed">
                              {item.blockers.map((b, idx) => (
                                <li className="text-red-600 bg-red-50/40 px-1 py-0.5 rounded-sm" key={idx}>{b}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-slate-400 italic text-xs pl-5">None reported 🎉</p>
                          )}
                        </div>

                        {/* 3. PLAN */}
                        <div className="space-y-1.5">
                          <h4 className="text-xs font-semibold text-indigo-800 flex items-center gap-1.5">
                            <Send className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span>Next Steps / Plan</span>
                          </h4>
                          <ul className="text-slate-600 text-xs pl-5 list-disc space-y-1 leading-relaxed">
                            {item.plan && item.plan.length > 0 ? (
                              item.plan.map((pl, idx) => (
                                <li key={idx}>{pl}</li>
                              ))
                            ) : (
                              <li className="text-slate-400 italic">No plans stated.</li>
                            )}
                          </ul>
                        </div>

                      </div>
                    </div>

                    {/* View Original raw text log popup source */}
                    {item.raw_text && (
                      <div className="pt-3 border-t border-slate-100">
                        <details className="text-[11px] text-slate-500">
                          <summary className="cursor-pointer hover:text-slate-800 focus:outline-none select-none font-medium">
                            Show Original Slack Paste
                          </summary>
                          <pre className="mt-2 p-2 rounded bg-slate-50 text-[10px] font-mono leading-normal whitespace-pre-wrap max-h-24 overflow-y-auto overflow-x-hidden text-slate-600 border border-slate-100">
                            {item.raw_text}
                          </pre>
                        </details>
                      </div>
                    )}

                  </div>
                ))}
              </div>
            )}

          </div>
        )}

      </main>

      {/* Simulated Email Compose Dialog Modal */}
      {isEmailModalOpen && (
        <div id="email_modal_overlay" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div 
            id="email_modal_card"
            className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-zoom-in"
          >
            
            {/* Modal Header */}
            <div className="bg-slate-950 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4.5 h-4.5 text-indigo-400" />
                <h3 className="font-display font-medium text-sm">Dispersing Consolidate Status Update</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsEmailModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email form detail */}
            <form onSubmit={handleSendEmailSimulation} className="p-5 space-y-4 flex-1 overflow-y-auto">
              
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Recipient Email</label>
                <input
                  type="email"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                  placeholder="manager@mycompany.com, team-leads@mycompany.com"
                  value={emailRecipient}
                  onChange={(e) => setEmailRecipient(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Subject</label>
                <input
                  type="text"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                  placeholder="Consolidated Daily Project Health Update"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">Email Body Preview (Auto-Generated)</label>
                  <span className="text-[10px] text-slate-400 font-mono">Consolidated dashboard reports</span>
                </div>
                <textarea
                  rows={10}
                  className="w-full text-xs font-mono p-3 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                  placeholder="Write message contents here..."
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                />
              </div>

              <div className="bg-amber-50 rounded-lg p-3 border border-amber-100 flex gap-2 text-xs text-amber-850">
                <Sparkles className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  This dispatches to the server simulation. The console logs will format the full email body real-time. In real deployments, you can hook this up to SendGrid, Mailgun, or AWS SES API keys.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-xs font-semibold text-slate-650 hover:bg-slate-50 rounded-lg"
                >
                  Cancel
                </button>
                
                <button
                  id="btn_send_email_commit"
                  type="submit"
                  disabled={isSendingEmail}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  {isSendingEmail ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                      <span>Sending Simulated email...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-3.5 h-3.5" />
                      <span>Dispatch Status Email</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Corporate Minimal Footer */}
      <footer id="app_footer" className="mt-8 bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-450 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Slack Status Parser. All rights reserved locally.</p>
          <div className="flex gap-4">
            <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors">
              Deploying to Vercel
            </a>
            <span>•</span>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors">
              Export to GitHub
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
