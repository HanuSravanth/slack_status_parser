import { useState, useEffect, FormEvent, MouseEvent } from "react";
import { 
  Clipboard, 
  Send, 
  Calendar as CalendarIcon, 
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
  Info,
  Database,
  Lock,
  Search,
  ChevronRight,
  UserCheck,
  Power,
  RefreshCw,
  Clock,
  ExternalLink,
  ShieldCheck,
  ChevronDown
} from "lucide-react";
import { SlackProgressSummary } from "./types";
import { supabase, checkSupabaseStatus } from "./lib/supabase";

const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function App() {
  const [currentPage, setCurrentPage] = useState<"paste" | "dashboard" | "calendar" | "auth">("dashboard");
  const [pastedText, setPastedText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Authenticated state (local simulation or Supabase Auth integration)
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(
    localStorage.getItem("slack_auth_email") || null
  );
  const [currentUserDisplayName, setCurrentUserDisplayName] = useState<string>(
    localStorage.getItem("slack_auth_name") || "Developer Account"
  );
  const [supabaseConnected, setSupabaseConnected] = useState(false);

  // Supabase dynamic setup checking status
  useEffect(() => {
    const status = checkSupabaseStatus();
    const isConfig = !!status.isConfigured;
    setSupabaseConnected(isConfig);
    setAuthMethod(isConfig ? "supabase" : "simulated");

    if (supabase && isConfig) {
      // Fetch session on load
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session && session.user) {
          setCurrentUserEmail(session.user.email || null);
          setCurrentUserDisplayName(session.user.user_metadata?.display_name || session.user.email?.split("@")[0].toUpperCase() || "Developer");
          setAuthMethod("supabase");
        }
      });

      // Subscribe to auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session && session.user) {
          setCurrentUserEmail(session.user.email || null);
          setCurrentUserDisplayName(session.user.user_metadata?.display_name || session.user.email?.split("@")[0].toUpperCase() || "Developer");
          setAuthMethod("supabase");
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

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
  const [selectedFeedDate, setSelectedFeedDate] = useState<string>(getLocalDateString());

  // Parser custom target backfill dates config
  const [parserTargetDate, setParserTargetDate] = useState<string>(getLocalDateString());
  const [parserDateMode, setParserDateMode] = useState<"detect" | "override">("detect");

  // Calendar state
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(new Date());

  // Detailed selected record for slide-over drawer
  const [selectedRecord, setSelectedRecord] = useState<SlackProgressSummary | null>(null);

  // Sign-in modal simulation and Supabase Client Auth integration
  const [authEmailInput, setAuthEmailInput] = useState("");
  const [authNameInput, setAuthNameInput] = useState("");
  const [authPasswordInput, setAuthPasswordInput] = useState("");
  const [authMethod, setAuthMethod] = useState<"simulated" | "supabase">("simulated");
  const [isAuthModeSignUp, setIsAuthModeSignUp] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Load initial dataset from localStorage or fallback
  useEffect(() => {
    // If Supabase is configured, we could theoretically fetch from there. Let's first load from local
    const saved = localStorage.getItem("slack_status_summaries");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse local status history", e);
      }
    } else {
      // Seed with highly professional real-world status reports
      const sampleSeed: SlackProgressSummary[] = [
        {
          id: "seed-1",
          date: "2026-06-20",
          employee_name: "Siddharth Verma",
          project_name: "Authentication Core",
          progress: [
            "Spent the morning debugging the OAuth token expiration state issues in client logs.",
            "Visualized real-time telemetry analytics charts for backend API metrics.",
            "Restructured response JSON parser headers to align with safety frameworks."
          ],
          blockers: ["Waiting on DevOps to provision secure staging environment secrets."],
          plan: ["Write extensive client-side authorization mock test suites", "Merge auth endpoints with production server"],
          raw_text: "[siddharth 10:15 AM] status updates: completed token validation. Waiting on DevOps keys.",
          created_at: new Date(Date.now() - 3600000 * 3).toISOString()
        },
        {
          id: "seed-2",
          date: "2026-06-20",
          employee_name: "Jessica Chen",
          project_name: "SEO Pipeline",
          progress: [
            "Completed critical search metadata audit across all framework public assets.",
            "Added modern structured structured JSON-LD payloads for article indexing index optimization."
          ],
          blockers: [],
          plan: ["Build static marketing template directories", "Review page metrics with project managers on Monday"],
          raw_text: "[jessica 9:30 AM] SEO auditing complete. No blockers.",
          created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: "seed-3",
          date: "2026-06-19",
          employee_name: "Diana Prince",
          project_name: "Payment Gateways",
          progress: [
            "Successfully configured Stripe payment callbacks within sandbox environments.",
            "Integrated automatic transaction receipt email template pipelines."
          ],
          blockers: ["Fails verification when webhook signatures are cycled on dev server."],
          plan: ["Deploy sandbox hooks to serverless cloud testing instances", "Audit transaction log payloads"],
          raw_text: "Diana's payment status for June 19...",
          created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: "seed-4",
          date: "2026-06-18",
          employee_name: "Siddharth Verma",
          project_name: "Authentication Core",
          progress: [
            "Drafted baseline middleware schemas for multi-tenant account routers.",
            "Refactored cookie token storage rules to support secure cross-origin requests."
          ],
          blockers: [],
          plan: ["Begin token expiration bug investigation", "Coordinate workspace keys with Diana"],
          raw_text: "Auth draft update by Siddharth...",
          created_at: new Date(Date.now() - 172800000).toISOString()
        }
      ];
      setHistory(sampleSeed);
      localStorage.setItem("slack_status_summaries", JSON.stringify(sampleSeed));
    }
  }, []);

  // Sync state helper
  const updateHistory = (newHistory: SlackProgressSummary[]) => {
    setHistory(newHistory);
    localStorage.setItem("slack_status_summaries", JSON.stringify(newHistory));
  };

  // Toast notification
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Submit and call Gemini API
  const handleExtract = async () => {
    if (!pastedText.trim()) {
      setErrorMsg("Please paste some workspace Slack updates into the parser box.");
      return;
    }

    setIsExtracting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: pastedText, clientDate: parserTargetDate }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed parsing Slack log using workspace AI model.");
      }

      const data = await res.json();
      
      let parsedReports: any[] = [];
      if (data && Array.isArray(data.reports)) {
        parsedReports = data.reports;
      } else if (Array.isArray(data)) {
        parsedReports = data;
      } else if (data && typeof data === "object") {
        parsedReports = [data];
      }

      if (parsedReports.length === 0) {
        throw new Error("No structured status entries could be recognized.");
      }

      const parsedEntries: SlackProgressSummary[] = parsedReports.map((item: any, idx: number) => {
        const assignedDate = parserDateMode === "override"
          ? parserTargetDate
          : (item.date && item.date.match(/^\d{4}-\d{2}-\d{2}$/) ? item.date : parserTargetDate);

        return {
          id: "status-" + Math.random().toString(36).substr(2, 9) + "-" + idx,
          date: assignedDate,
          employee_name: item.employee_name || "Unknown Engineer",
          project_name: item.project_name || "General Maintenance",
          progress: Array.isArray(item.progress) ? item.progress : (item.progress ? [item.progress] : []),
          blockers: Array.isArray(item.blockers) ? item.blockers : (item.blockers ? [item.blockers] : []),
          plan: Array.isArray(item.plan) ? item.plan : (item.plan ? [item.plan] : []),
          raw_text: idx === 0 ? pastedText : undefined,
          created_at: new Date().toISOString()
        };
      });

      const newHistory = [...parsedEntries, ...history];
      updateHistory(newHistory);
      
      setPastedText("");
      showToast(`Successfully summarized ${parsedEntries.length} individual user updates!`, "success");
      setCurrentPage("dashboard");
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "An exception occurred during Gemini structured parsing.");
      showToast(e.message || "Error processing status.", "error");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDeleteEntry = (id: string, e: MouseEvent) => {
    e.stopPropagation(); // Avoid triggering details slide-over
    const updated = history.filter(item => item.id !== id);
    updateHistory(updated);
    showToast("Status record deleted from workspace context.", "info");
    if (selectedRecord?.id === id) {
      setSelectedRecord(null);
    }
  };

  // Auth Handler
  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!authEmailInput.trim()) return;
    if (!authPasswordInput) {
      showToast("Password is required to authenticate.", "error");
      return;
    }

    if (authMethod === "simulated") {
      setIsAuthenticating(true);
      // Simulate real auth in offline fallback mode using localStorage
      try {
        const usersStr = localStorage.getItem("slack_simulated_users") || "[]";
        let registeredUsers: Array<{ email: string; name: string; pw: string }> = [];
        try {
          registeredUsers = JSON.parse(usersStr);
        } catch {
          registeredUsers = [];
        }

        const emailClean = authEmailInput.trim().toLowerCase();

        if (isAuthModeSignUp) {
          // Check duplicate
          if (registeredUsers.some(u => u.email === emailClean)) {
            showToast("A user with this email already exists in the local workspace.", "error");
            return;
          }

          const resolvedName = authNameInput.trim() || authEmailInput.split("@")[0].toUpperCase();
          registeredUsers.push({
            email: emailClean,
            name: resolvedName,
            pw: authPasswordInput
          });

          localStorage.setItem("slack_simulated_users", JSON.stringify(registeredUsers));
          showToast("Workspace account created successfully! Please sign in with your password.", "success");
          setIsAuthModeSignUp(false);
          setAuthPasswordInput("");
        } else {
          // Sign In
          const matchedUser = registeredUsers.find(u => u.email === emailClean);
          
          if (!matchedUser) {
            // For convenience, if this is the first time and no users exist, auto-create this user so developers never get blocked!
            if (registeredUsers.length === 0) {
              const resolvedName = authNameInput.trim() || authEmailInput.split("@")[0].toUpperCase();
              const newUser = { email: emailClean, name: resolvedName, pw: authPasswordInput };
              registeredUsers.push(newUser);
              localStorage.setItem("slack_simulated_users", JSON.stringify(registeredUsers));
              
              setCurrentUserEmail(emailClean);
              setCurrentUserDisplayName(resolvedName);
              localStorage.setItem("slack_auth_email", emailClean);
              localStorage.setItem("slack_auth_name", resolvedName);
              showToast(`Created first telemetry profile: Welcome back, ${resolvedName}!`, "success");
              setCurrentPage("dashboard");
            } else {
              showToast("No account found with this email. Please switch to Create Account first.", "error");
            }
            return;
          }

          if (matchedUser.pw !== authPasswordInput) {
            showToast("Incorrect password. Please try again.", "error");
            return;
          }

          setCurrentUserEmail(matchedUser.email);
          setCurrentUserDisplayName(matchedUser.name);
          localStorage.setItem("slack_auth_email", matchedUser.email);
          localStorage.setItem("slack_auth_name", matchedUser.name);
          showToast(`Welcome back, ${matchedUser.name}!`, "success");
          setCurrentPage("dashboard");
        }
      } catch (err) {
        showToast("Local storage auth encountered an issue.", "error");
      } finally {
        setIsAuthenticating(false);
      }
    } else {
      // Supabase direct authentication
      if (!supabase) {
        showToast("Supabase client is not initialized. Please verify configuration.", "error");
        return;
      }

      setIsAuthenticating(true);
      try {
        if (isAuthModeSignUp) {
          const resolvedName = authNameInput.trim() || authEmailInput.split("@")[0].toUpperCase();
          const { data, error } = await supabase.auth.signUp({
            email: authEmailInput.trim(),
            password: authPasswordInput,
            options: {
              data: {
                display_name: resolvedName,
              }
            }
          });

          if (error) throw error;
          
          showToast("Account created successfully! Please verify your email or sign in.", "success");
          setIsAuthModeSignUp(false);
          setAuthPasswordInput("");
        } else {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: authEmailInput.trim(),
            password: authPasswordInput,
          });

          if (error) throw error;

          if (data.user) {
            const resolvedName = data.user.user_metadata?.display_name || data.user.email?.split("@")[0].toUpperCase() || "Developer";
            setCurrentUserEmail(data.user.email || null);
            setCurrentUserDisplayName(resolvedName);
            localStorage.setItem("slack_auth_email", data.user.email || "");
            localStorage.setItem("slack_auth_name", resolvedName);
            showToast(`Sign in successful! Welcome back, ${resolvedName}.`, "success");
            setCurrentPage("dashboard");
          }
        }
      } catch (err: any) {
        console.error("Supabase Auth failure:", err);
        showToast(err.message || "Authentication process failed.", "error");
      } finally {
        setIsAuthenticating(false);
      }
    }
  };

  const handleSignOut = async () => {
    if (supabase && authMethod === "supabase") {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error("Sign out error", err);
      }
    }
    setCurrentUserEmail(null);
    setCurrentUserDisplayName("Guest Contributor");
    localStorage.removeItem("slack_auth_email");
    localStorage.removeItem("slack_auth_name");
    showToast("Signed out of personalized workspace context.", "info");
  };

  // Email simulation modal trigger for a clean tabular layout email summary
  const openEmailModal = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const matchingReports = history.filter(item => item.date === selectedCalendarDate || item.date === todayStr);
    
    const activeReports = matchingReports.length > 0 ? matchingReports : history.slice(0, 4);
    if (activeReports.length === 0) {
      showToast("No status reports currently recorded to generate email.", "error");
      return;
    }

    let reportMarkup = `CONSOLIDATED TEAM STATUS UPDATE PANEL - Generated on ${new Date().toLocaleDateString()}\n`;
    reportMarkup += `========================================================================\n\n`;

    activeReports.forEach((item, index) => {
      reportMarkup += `[${index + 1}] CO-WORKER: ${item.employee_name}\n`;
      reportMarkup += `    PROJECT : ${item.project_name}\n`;
      reportMarkup += `    DATE    : ${item.date}\n`;
      reportMarkup += `    ------------------------------------------------\n`;
      reportMarkup += `    🟢 PROGRESS HIGHLIGHTS:\n`;
      if (item.progress.length > 0) {
        item.progress.forEach(p => reportMarkup += `      • ${p}\n`);
      } else {
        reportMarkup += `      • (No achievements specified)\n`;
      }

      reportMarkup += `    🔴 HARD BLOCKERS / BACKLOGS:\n`;
      if (item.blockers.length > 0) {
        item.blockers.forEach(b => reportMarkup += `      • ${b}\n`);
      } else {
        reportMarkup += `      • None. Operating smoothly.\n`;
      }

      reportMarkup += `    🔵 PLAN OF ACTIONS:\n`;
      if (item.plan.length > 0) {
        item.plan.forEach(pl => reportMarkup += `      • ${pl}\n`);
      } else {
        reportMarkup += `      • (No plans stated)\n`;
      }
      reportMarkup += `\n------------------------------------------------------------------------\n\n`;
    });

    reportMarkup += `Consolidated beautifully using Google AI Studio Workspace Agent (powered by Gemini models).`;

    setEmailRecipient("product-heads@company.com");
    setEmailSubject(`Workspace Consolidate Report: ${activeReports.length} Updates - (${selectedCalendarDate})`);
    setEmailBody(reportMarkup);
    setIsEmailModalOpen(true);
  };

  const handleSendEmailSimulation = async (e: FormEvent) => {
    e.preventDefault();
    setIsSendingEmail(true);

    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: emailRecipient,
          subject: emailSubject,
          body: emailBody
        })
      });

      if (!res.ok) throw new Error("API simulation failed.");

      await res.json();
      showToast(`Email dispatched successfully to ${emailRecipient}!`, "success");
      setIsEmailModalOpen(false);
    } catch {
      showToast("Simulation dispatched with local alert backup.", "success");
      setIsEmailModalOpen(false);
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Project colors mapping
  const getProjectTagColor = (project: string) => {
    const proj = project.toLowerCase();
    if (proj.includes("auth") || proj.includes("login") || proj.includes("security")) {
      return "bg-indigo-50 text-indigo-700 border-indigo-100";
    }
    if (proj.includes("seo") || proj.includes("market") || proj.includes("analytics")) {
      return "bg-teal-50 text-teal-700 border-teal-100";
    }
    if (proj.includes("pay") || proj.includes("stripe") || proj.includes("commerce")) {
      return "bg-purple-50 text-purple-700 border-purple-100";
    }
    if (proj.includes("dev") || proj.includes("deploy") || proj.includes("cloud")) {
      return "bg-amber-50 text-amber-700 border-amber-100";
    }
    return "bg-slate-100 text-slate-700 border-slate-200/60";
  };

  // Generate Calendar Days for Current Month View
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Pad initial blank spaces for previous month's wrap
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= totalDays; i++) {
      const paddedDay = i < 10 ? `0${i}` : `${i}`;
      const paddedMonth = (month + 1) < 10 ? `0${month + 1}` : `${month + 1}`;
      days.push(`${year}-${paddedMonth}-${paddedDay}`);
    }
    return days;
  };

  const changeCalendarMonth = (offset: number) => {
    setCurrentCalendarMonth(new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() + offset, 1));
  };

  // Filters logic
  const uniqueProjects = Array.from(new Set(history.map(h => h.project_name))).filter(Boolean);
  const uniqueEmployees = Array.from(new Set(history.map(h => h.employee_name))).filter(Boolean);

  const filteredHistory = history.filter(item => {
    const term = searchQuery.toLowerCase().trim();
    const matchesSearch = !term ||
      item.employee_name.toLowerCase().includes(term) ||
      item.project_name.toLowerCase().includes(term) ||
      item.progress.some(p => p.toLowerCase().includes(term)) ||
      item.blockers.some(b => b.toLowerCase().includes(term)) ||
      item.plan.some(pl => pl.toLowerCase().includes(term));

    const matchesProject = selectedProject === "All" || item.project_name === selectedProject;
    const matchesEmployee = selectedEmployee === "All" || item.employee_name === selectedEmployee;
    const matchesDate = !selectedFeedDate || item.date === selectedFeedDate;

    return matchesSearch && matchesProject && matchesEmployee && matchesDate;
  });

  // Health check metric stats representing currently filtered feed view
  const totalReportsCount = filteredHistory.length;
  const activeBlockersCount = filteredHistory.reduce((sum, item) => sum + (item.blockers?.length || 0), 0);
  const totalCollaborators = Array.from(new Set(filteredHistory.map(h => h.employee_name))).length;

  // Dynamic Today's summary calculations (Focuses on the most recent active date in the workspace feed for maximum insight)
  const allDatesSorted = history.map(h => h.date).filter(Boolean).sort((a, b) => b.localeCompare(a));
  const latestActiveDate = allDatesSorted.length > 0 ? allDatesSorted[0] : new Date().toISOString().split("T")[0];

  const todayItems = history.filter(item => item.date === latestActiveDate);
  const todayContributors = Array.from(new Set(todayItems.map(item => item.employee_name)));
  const todayProjects = Array.from(new Set(todayItems.map(item => item.project_name)));
  const todayProgressPoints = todayItems.flatMap(item => item.progress || []);
  const todayBlockersList = todayItems.flatMap(item => item.blockers || []).filter(Boolean);
  const todayUpcomingPlans = todayItems.flatMap(item => item.plan || []);

  if (!currentUserEmail) {
    return (
      <div id="auth_portal_wrapper" className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col items-center justify-center antialiased p-4 relative overflow-hidden">
        {/* Decorative background radial grids */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_105%)] opacity-40"></div>
        
        {/* Toast Overlay */}
        {toast && (
          <div id="toast" className="fixed top-6 right-6 z-50 transform transition-all animate-slide-in">
            <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold ${
              toast.type === "success" 
                ? "bg-slate-950 text-emerald-400 border-emerald-500/20" 
                : toast.type === "error"
                ? "bg-slate-950 text-rose-400 border-rose-500/20"
                : "bg-slate-950 text-indigo-400 border-indigo-500/20"
            }`}>
              <Sparkles className="w-5 h-5 shrink-0 text-indigo-400 animate-pulse" />
              <span>{toast.message}</span>
            </div>
          </div>
        )}

        {/* Auth Container Card */}
        <div className="w-full max-w-md bg-slate-950 border border-slate-800/80 rounded-3xl p-8 md:p-10 shadow-2xl relative z-10 overflow-hidden backdrop-blur-md">
          {/* Humble connectivity dot */}
          <div className="absolute top-6 right-6 flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${supabaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
            <span className="text-[9px] font-mono tracking-wider text-slate-500">
              {supabaseConnected ? "ONLINE STORAGE" : "LOCAL STORAGE"}
            </span>
          </div>

          {/* subtle glow gradients */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/5 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="text-center space-y-3 pb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center mx-auto text-white shadow-lg shadow-indigo-500/20">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="font-display font-black text-2xl md:text-3xl text-white tracking-tight pt-2">Slack Status Engine</h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              {isAuthModeSignUp 
                ? "Create your personal teammate credentials to start logging telemetry updates."
                : "Sign in with your workspace credentials to access the team feed dashboard."}
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {isAuthModeSignUp && (
              <div className="space-y-1.5">
                <label htmlFor="gate_name_input" className="block text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
                  Teammate Display Name
                </label>
                <input
                  id="gate_name_input"
                  type="text"
                  required
                  className="w-full text-xs p-3 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-600 font-medium"
                  placeholder="e.g. Siddharth Verma"
                  value={authNameInput}
                  onChange={(e) => setAuthNameInput(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="gate_email_input" className="block text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
                Workspace Email
              </label>
              <input
                id="gate_email_input"
                type="email"
                required
                className="w-full text-xs p-3 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-600 font-medium"
                placeholder="name@company.com"
                value={authEmailInput}
                onChange={(e) => setAuthEmailInput(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="gate_pw_input" className="block text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
                Password
              </label>
              <input
                id="gate_pw_input"
                type="password"
                required
                className="w-full text-xs p-3 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-600 font-medium"
                placeholder="••••••••"
                value={authPasswordInput}
                onChange={(e) => setAuthPasswordInput(e.target.value)}
              />
            </div>

            <button
              id="gate_auth_submit"
              type="submit"
              disabled={isAuthenticating}
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-950/20 transition-all pt-0.5 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              {isAuthenticating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isAuthModeSignUp ? "Create Workspace Account" : "Sign In to Status Engine"}</span>
                </>
              )}
            </button>
          </form>

          {/* Toggle View Link */}
          <div className="text-center pt-6">
            <button
              type="button"
              onClick={() => {
                setIsAuthModeSignUp(!isAuthModeSignUp);
                setAuthPasswordInput("");
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
            >
              {isAuthModeSignUp 
                ? "Already have an account? Sign In" 
                : "Don't have an account? Create one"}
            </button>
          </div>

          <p className="text-[10px] text-slate-550 font-mono text-center pt-8 border-t border-slate-900 mt-6 leading-relaxed">
            Locked feed protocols restrict telemetry viewing to authorized engineers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="workspace_container" className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col md:flex-row antialiased">
      
      {/* Toast Overlay */}
      {toast && (
        <div id="toast" className="fixed top-6 right-6 z-50 transform transition-all animate-slide-in">
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold ${
            toast.type === "success" 
              ? "bg-emerald-950 text-emerald-300 border-emerald-800/40" 
              : toast.type === "error"
              ? "bg-rose-950 text-rose-300 border-rose-800/40"
              : "bg-indigo-950 text-indigo-300 border-indigo-800/40"
          }`}>
            <Sparkles className="w-5 h-5 shrink-0 text-indigo-400" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* LEFT SIDEBAR: World-class Navigation Control Hub */}
      <aside id="workspace_sidebar" className="w-full md:w-80 shrink-0 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between">
        <div className="p-6 space-y-8">
          
          {/* Logo & Headline */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Clipboard className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display font-bold text-base tracking-tight text-white">Slack Status Engine</h1>
              <p className="text-[10px] text-slate-500 font-mono font-medium tracking-widest uppercase">WORKSPACE INTELLIGENCE</p>
            </div>
          </div>

          {/* User profile / session status */}
          <div id="profile_banner" className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/60 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-300 font-bold border border-indigo-500/20 text-xs">
                {currentUserDisplayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">{currentUserDisplayName}</p>
                <p className="text-[10px] text-slate-400 truncate tracking-tight">{currentUserEmail}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
              {currentUserEmail !== "guest.user@workspace.io" ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="text-[10px] text-slate-450 hover:text-rose-400 font-mono font-semibold transition-colors flex items-center gap-1"
                >
                  <Power className="w-3 h-3 text-rose-500" />
                  <span>Log out</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setCurrentPage("auth")}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-mono font-semibold transition-colors flex items-center gap-1"
                >
                  <Lock className="w-3 h-3" />
                  <span>Link Profile</span>
                </button>
              )}

              {/* Supabase Status Indicator */}
              <div className="flex items-center gap-1.5 text-[10px] font-mono">
                <span className={`w-1.5 h-1.5 rounded-full ${supabaseConnected ? "bg-emerald-500" : "bg-slate-600"}`}></span>
                <span className="text-slate-400" title={supabaseConnected ? "Bound to Supabase Cloud Storage" : "Using browser LocalStorage fallback"}>
                  {supabaseConnected ? "Supabase Active" : "Local DB"}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Items (Sidebar layout) */}
          <nav className="space-y-1.5 pt-2">
            
            {/* 1. Extract Paste Update tab */}
            <button
              onClick={() => setCurrentPage("paste")}
              className={`w-full text-left flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                currentPage === "paste"
                  ? "bg-indigo-600 text-white shadow-soft shadow-indigo-600/10"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <PlusCircle className="w-4.5 h-4.5" />
                <span>Parser Terminal</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-70" />
            </button>

            {/* 2. Structured Dashboard tab */}
            <button
              onClick={() => setCurrentPage("dashboard")}
              className={`w-full text-left flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                currentPage === "dashboard"
                  ? "bg-indigo-600 text-white shadow-soft shadow-indigo-600/10"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="w-4.5 h-4.5" />
                <span>Today's Feed</span>
              </div>
              {history.length > 0 && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  currentPage === "dashboard" ? "bg-white text-indigo-700" : "bg-slate-800 text-slate-350"
                }`}>
                  {history.length}
                </span>
              )}
            </button>

            {/* 3. Calendar Tracker tab */}
            <button
              onClick={() => setCurrentPage("calendar")}
              className={`w-full text-left flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                currentPage === "calendar"
                  ? "bg-indigo-600 text-white shadow-soft shadow-indigo-600/10"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-4.5 h-4.5" />
                <span>Calendar Matrix</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-70" />
            </button>

          </nav>

        </div>

        {/* Workspace details info */}
        <div className="p-6 border-t border-slate-900 text-slate-500 text-[11px] space-y-3 font-mono">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4.5 h-4.5 text-indigo-400/90" />
            <span className="text-slate-400 font-sans font-medium">Enterprise Standards</span>
          </div>
          <p className="text-[10px] leading-relaxed">
            Data persists securely. If Supabase keys are configured, data automatically migrates to your cloud Postgres container.
          </p>
          <div id="github_deployment_ref" className="pt-2 flex items-center justify-between text-indigo-400/80">
            <span>github-vercel: ready</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </div>
        </div>

      </aside>

      {/* MAIN VIEW AREA: Clean, spacious canvas */}
      <main className="flex-1 min-w-0 bg-slate-900 flex flex-col md:overflow-y-auto">
        
        {/* Sub Header for status messages */}
        <header className="bg-slate-950/40 border-b border-slate-800/50 px-6 sm:px-8 py-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-indigo-400 uppercase">
              {currentPage === "paste" && "Slack Text Parser Terminal"}
              {currentPage === "dashboard" && "Today's Status Feed"}
              {currentPage === "calendar" && "Interactive Activity Matrix"}
              {currentPage === "auth" && "Workspace Profiler Connection"}
            </span>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight mt-0.5">
              {currentPage === "paste" && "AI Extraction Studio"}
              {currentPage === "dashboard" && "Workspace Today's Feed"}
              {currentPage === "calendar" && "Date Submission Tracking"}
              {currentPage === "auth" && "Link Account Profiles"}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Dynamic System Date Display */}
            <div className="flex items-center gap-2.5 px-3.5 py-2 bg-slate-900 border border-slate-800/80 rounded-xl text-xs text-slate-300 font-mono shadow-inner shadow-slate-950/40">
              <CalendarIcon className="w-4 h-4 text-indigo-400" />
              <span className="font-semibold text-xs leading-none text-slate-100">{getLocalDateString()}</span>
            </div>

            <button
              onClick={() => {
                showToast("Refreshing workspace status registry...", "info");
              }}
              className="p-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-350 hover:text-white transition-all"
              title="Refresh and sync data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* View Layout Wrappers */}
        <div className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-6">

          {/* VIEW 1: PASTE TERMINAL */}
          {currentPage === "paste" && (
            <div id="paste_interface" className="space-y-6 max-w-4xl">
              
              {/* Premium modern minimal instruction callout */}
              <div className="bg-gradient-to-tr from-indigo-950/50 to-slate-950/50 p-6 rounded-2xl border border-slate-800/60 shadow-xl relative">
                <div className="absolute right-6 top-6 w-16 h-16 bg-indigo-500/10 rounded-full blur-xl"></div>
                
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-4.5 h-4.5 text-indigo-400" />
                  <span>How to structure your copied daily slack logs</span>
                </h3>
                <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                  You can copy and paste raw threads containing feedback from multiple employees. Gemini 2.5 Flash will automatically scan the boundaries of each message, separate the employees, extract achievements, call out blockers explicitly, and map plans.
                </p>
              </div>

              {/* Main Paste form details */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 sm:p-6 space-y-5">
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-semibold uppercase font-mono tracking-wider text-slate-400">INPUT RAW SLACK PASTE LOG</span>
                  </div>
                  {pastedText && (
                    <button
                      type="button"
                      onClick={() => setPastedText("")}
                      className="text-xs text-rose-450 hover:text-rose-350 font-medium transition-colors"
                    >
                      Clear textarea
                    </button>
                  )}
                </div>

                <div className="relative">
                  <textarea
                    id="slack_raw_input"
                    rows={12}
                    className="w-full text-slate-200 text-xs sm:text-sm font-mono p-4 rounded-xl border border-slate-800 bg-slate-900/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/80 placeholder:text-slate-500 transition-all leading-relaxed"
                    placeholder={`[9:15 AM] siddharth_verma: Status for today:\n- Restructured SEO template pipelines.\n- Diagnosing transaction hook callback signatures.\nBlocked: waiting on DevOps access credentials.\nPlans: fix callback validations, connect DB.\n\n[Jessica] Jessica updates:\n* Met with PM, finalized Sendgrid styling.\nBlockers: NONE.\nTomorrow: marketing campaigns and invites.`}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                  />
                </div>

                {/* Custom backfill/target date settings */}
                <div className="bg-slate-900/40 p-4.5 rounded-xl border border-slate-800/80 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-indigo-400" />
                        <span>Date Assignment Settings for Backfilling / Extraction</span>
                      </h4>
                      <p className="text-[11px] text-slate-450">
                        Choose whether to override the date of the parsed reports, or auto-detect with a custom fallback date.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                      <span className="text-[10px] font-mono text-slate-500 tracking-wider">BACKFILL UTILITY</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    {/* Select Mode */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
                        Date Mapping Strategy
                      </label>
                      <select
                        className="w-full h-10 text-xs bg-slate-950/60 border border-slate-800/80 rounded-xl px-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/80 text-slate-200 font-medium cursor-pointer transition-all"
                        value={parserDateMode}
                        onChange={(e) => setParserDateMode(e.target.value as "detect" | "override")}
                      >
                        <option value="detect" className="bg-slate-950 text-slate-300">Auto-Detect Dates (Fallback to selected date)</option>
                        <option value="override" className="bg-slate-950 text-slate-300">Force/Override All Reports to Selected Date</option>
                      </select>
                    </div>

                    {/* Backfill Target Date Picker */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
                        Target Date
                      </label>
                      <input
                        type="date"
                        className="w-full h-10 text-xs bg-slate-950/60 border border-slate-800/80 rounded-xl px-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/80 text-slate-200 font-medium cursor-pointer transition-all [color-scheme:dark]"
                        value={parserTargetDate}
                        onChange={(e) => setParserTargetDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {errorMsg && (
                  <div className="bg-rose-950/40 border border-rose-900/50 rounded-xl p-4 text-xs text-rose-300 flex items-center gap-3">
                    <AlertCircle className="w-4.5 h-4.5 text-rose-400 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono text-slate-500">
                      Chars: <strong>{pastedText.length}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setPastedText(`[siddharth_verma 11:00 AM]\nCompleted token validation and cookie storage. Charts styled and waiting dev feedback.\nBlocked: DevOps database staging access\nPlan: merge endpoints on Monday\n\n[jessica_chen 11:30 AM]\nCompleted meta tag auditing. promotional emails delivered successfully\nBlockers: None!`)}
                      className="text-[11px] text-indigo-450 hover:text-indigo-350 hover:underline font-mono"
                    >
                      (Load Quick Sample)
                    </button>
                  </div>

                  <button
                    id="btn_extract_submit"
                    type="button"
                    disabled={isExtracting}
                    onClick={handleExtract}
                    className={`h-11 px-6 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all ${
                      isExtracting 
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                        : "bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-lg hover:shadow-indigo-600/10 active:scale-98"
                    }`}
                  >
                    {isExtracting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-slate-600 border-t-white rounded-full animate-spin"></div>
                        <span>Extracting Structured Co-Worker Updates...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-indigo-300" />
                        <span>Run Workspace AI Summarizer</span>
                      </>
                    )}
                  </button>
                </div>

              </div>

              {/* Elegant global horizontal footer status bar */}
              <div className="bg-slate-950 px-5 py-4 rounded-xl border border-slate-800/80 flex items-center gap-3 text-slate-400 text-xs">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  Dynamic parser configured for strict structured telemetry. Gemini models output normalized JSON directly matching team roster registries.
                </span>
              </div>

            </div>
          )}

          {/* VIEW 2: TODAY'S STATUS FEED REGISTRY */}
          {currentPage === "dashboard" && (
            <div id="dashboard_registry" className="space-y-6">
              
              {/* Modern Grid Analytics Panel */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">CONSOLIDATED UPDATES</span>
                    <p className="text-2xl font-display font-bold text-white leading-none">{totalReportsCount}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                    <FileText className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">ACTIVE OUTCOMES</span>
                    <p className="text-2xl font-display font-bold text-white leading-none">
                      {history.filter(h => h.progress?.length > 0).length}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 border border-teal-500/20">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">CRITICAL PATH BARRIER</span>
                    <p className={`text-2xl font-display font-bold leading-none ${activeBlockersCount > 0 ? "text-rose-400 animate-pulse" : "text-emerald-400"}`}>
                      {activeBlockersCount} {activeBlockersCount === 1 ? "Blocker" : "Blockers"}
                    </p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                    activeBlockersCount > 0 
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/20" 
                      : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  }`}>
                    <AlertCircle className="w-5 h-5" />
                  </div>
                </div>

              </div>

              {/* Dynamic Filtering Panel */}
              <div className="bg-slate-950 border border-slate-800/85 rounded-2xl p-5 space-y-4">
                
                {/* Row 1: Search and Primary Actions */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Search query input */}
                  <div className="relative flex-1 max-w-xl">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      id="search_query"
                      type="text"
                      placeholder="Search people, tags, plans or blockers..."
                      className="w-full h-10 text-xs pl-10 pr-10 rounded-xl border border-slate-800/80 bg-slate-900/30 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/80 transition-all font-medium"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-450 hover:text-slate-300 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Primary Action Button: Consolidated & Email */}
                  <div className="flex items-center shrink-0 w-full lg:w-auto">
                    <button
                      onClick={openEmailModal}
                      className="w-full lg:w-auto h-10 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-550 text-white font-bold text-xs px-5 rounded-xl shadow-lg shadow-indigo-600/10 transition-all active:scale-98 whitespace-nowrap border border-indigo-500/20"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Consolidate & Email</span>
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-900/60" />

                {/* Row 2: Selectors and resets */}
                <div className="flex flex-col sm:flex-row sm:items-center flex-wrap gap-3">
                  {/* Indicator Label */}
                  <span className="text-[10px] text-slate-500 font-mono tracking-wider font-semibold uppercase mr-1">
                    Filters:
                  </span>

                  {/* Filter projects */}
                  <div className="relative w-full sm:w-48">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Briefcase className="w-4 h-4" />
                    </span>
                    <select
                      id="proj_select_filter"
                      className="w-full h-10 appearance-none text-xs bg-slate-900/30 border border-slate-850 rounded-xl pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/80 text-slate-200 cursor-pointer font-medium transition-all"
                      value={selectedProject}
                      onChange={(e) => setSelectedProject(e.target.value)}
                    >
                      <option value="All" className="bg-slate-950 text-slate-300">All Projects</option>
                      {uniqueProjects.map(proj => (
                        <option key={proj} value={proj} className="bg-slate-950 text-slate-300">{proj}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Filter team member */}
                  <div className="relative w-full sm:w-48">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <User className="w-4 h-4" />
                    </span>
                    <select
                      id="engineer_select_filter"
                      className="w-full h-10 appearance-none text-xs bg-slate-900/30 border border-slate-850 rounded-xl pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/80 text-slate-200 cursor-pointer font-medium transition-all"
                      value={selectedEmployee}
                      onChange={(e) => setSelectedEmployee(e.target.value)}
                    >
                      <option value="All" className="bg-slate-950 text-slate-300">All Resources</option>
                      {uniqueEmployees.map(emp => (
                        <option key={emp} value={emp} className="bg-slate-950 text-slate-300">{emp}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Filter Feed Date */}
                  <div className="relative w-full sm:w-44">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <CalendarIcon className="w-4 h-4 text-indigo-400" />
                    </span>
                    <input
                      type="date"
                      className="w-full h-10 text-xs bg-slate-900/30 border border-slate-850 rounded-xl pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/80 text-slate-200 cursor-pointer font-medium transition-all [color-scheme:dark]"
                      value={selectedFeedDate}
                      onChange={(e) => setSelectedFeedDate(e.target.value)}
                    />
                  </div>

                  {/* Toggle Mode: All Dates vs Today */}
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedFeedDate) {
                        setSelectedFeedDate("");
                      } else {
                        setSelectedFeedDate(getLocalDateString());
                      }
                    }}
                    className={`h-10 px-4 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 active:scale-95 cursor-pointer ${
                      !selectedFeedDate 
                        ? "bg-indigo-600/95 text-white shadow-soft hover:bg-indigo-600 shadow-indigo-600/10" 
                        : "bg-slate-900/30 border border-slate-850 text-slate-400 hover:text-white"
                    }`}
                  >
                    <span>{!selectedFeedDate ? "Showing All Dates" : "Today Only"}</span>
                  </button>

                  {/* Clear filters trigger */}
                  {(searchQuery || selectedProject !== "All" || selectedEmployee !== "All" || selectedFeedDate !== getLocalDateString()) && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedProject("All");
                        setSelectedEmployee("All");
                        setSelectedFeedDate(getLocalDateString());
                      }}
                      className="text-xs text-indigo-400 hover:text-indigo-350 font-bold px-3.5 h-10 rounded-xl hover:bg-slate-900/40 transition-all shrink-0 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reset Filters</span>
                    </button>
                  )}

                </div>

              </div>

              {/* WORLD-CLASS TABULAR REGISTRY FORMAT */}
              {filteredHistory.length === 0 ? (
                <div className="bg-slate-950 rounded-2xl border border-slate-800/80 p-12 text-center max-w-xl mx-auto">
                  <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center mx-auto text-slate-500 mb-4">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">No updates match filters</h3>
                  <p className="text-xs text-slate-450 leading-relaxed mt-2 max-w-sm mx-auto">
                    Adjust your active search query or switch back to the <strong>Parser Terminal</strong> input tab to paste the daily logs.
                  </p>
                  <button
                    onClick={() => setCurrentPage("paste")}
                    className="mt-5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2 shadow"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Paste Workspace Update</span>
                  </button>
                </div>
              ) : (
                <div className="bg-slate-950 border border-slate-800/70 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      
                      {/* Table Column Headings */}
                      <thead>
                        <tr className="bg-slate-900/40 border-b border-slate-800/70 text-[10px] font-mono tracking-widest text-slate-450 uppercase">
                          <th className="py-4.5 px-6 font-semibold">Teammate & Period</th>
                          <th className="py-4.5 px-5 font-semibold">Workspace Focus</th>
                          <th className="py-4.5 px-5 font-semibold">Accomplishments & Progress</th>
                          <th className="py-4.5 px-5 font-semibold">Plan of approach</th>
                          <th className="py-4.5 px-5 font-semibold">Operational Status</th>
                          <th className="py-4.5 px-6 font-semibold text-center">Settings</th>
                        </tr>
                      </thead>

                      {/* Client Table Rows */}
                      <tbody className="divide-y divide-slate-800/60 text-xs">
                        {filteredHistory.map((item) => {
                          const hasBlocker = item.blockers && item.blockers.length > 0;
                          return (
                            <tr
                              key={item.id}
                              onClick={() => setSelectedRecord(item)}
                              className="hover:bg-slate-900/30 cursor-pointer transition-all duration-100 group"
                            >
                              
                              {/* 1. Teammate and date */}
                              <td className="py-5 px-6 font-medium text-slate-200">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-slate-850 border border-slate-800 flex items-center justify-center font-bold text-slate-300 text-[10px] group-hover:border-indigo-500/50 transition-all">
                                    {item.employee_name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-display font-semibold group-hover:text-indigo-400 transition-colors text-slate-200">
                                      {item.employee_name}
                                    </p>
                                    <p className="text-[9px] text-slate-500 text-left font-mono mt-0.5">
                                      {item.date}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              {/* 2. Project column */}
                              <td className="py-5 px-5">
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold tracking-tight border max-w-[120px] truncate bg-slate-900 text-indigo-400 border-indigo-950">
                                  {item.project_name}
                                </span>
                              </td>

                              {/* 3. Achievements summary (rendered beautifully compact) */}
                              <td className="py-5 px-5 text-slate-400 max-w-xs">
                                <div className="space-y-1.5">
                                  {item.progress.length > 0 ? (
                                    item.progress.slice(0, 2).map((p, idx) => (
                                      <div key={idx} className="flex items-start gap-1.5 leading-relaxed text-[11px]">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                                        <span className="line-clamp-2">{p}</span>
                                      </div>
                                    ))
                                  ) : (
                                    <span className="italic text-slate-600 text-[11px]">(No metrics written)</span>
                                  )}
                                  {item.progress.length > 2 && (
                                    <p className="text-[10px] text-indigo-400 font-semibold font-mono pl-3">
                                      + {item.progress.length - 2} more highlight(s)
                                    </p>
                                  )}
                                </div>
                              </td>

                              {/* 4. Plan of action column */}
                              <td className="py-5 px-5 text-slate-400 max-w-xs">
                                <div className="space-y-1">
                                  {item.plan && item.plan.length > 0 ? (
                                    item.plan.slice(0, 2).map((pl, idx) => (
                                      <div key={idx} className="flex items-start gap-1.5 leading-relaxed text-[11px]">
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></span>
                                        <span className="line-clamp-2">{pl}</span>
                                      </div>
                                    ))
                                  ) : (
                                    <span className="italic text-slate-650 text-[11px]">None stated</span>
                                  )}
                                </div>
                              </td>

                              {/* 5. Blockers operational Health metrics */}
                              <td className="py-5 px-5">
                                {hasBlocker ? (
                                  <div className="space-y-1">
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-rose-950/40 text-rose-300 border border-rose-900/30 font-semibold font-mono">
                                      <AlertCircle className="w-3 h-3 text-rose-400" />
                                      <span>BLOCKED</span>
                                    </span>
                                    <p className="text-[9px] text-rose-400 leading-snug line-clamp-2 max-w-[120px] italic">
                                      "{item.blockers[0]}"
                                    </p>
                                  </div>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-emerald-950/40 text-emerald-300 border border-emerald-900/30 font-semibold font-mono">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                    <span>OPERATIONAL</span>
                                  </span>
                                )}
                              </td>

                              {/* 6. Settings action toolbar */}
                              <td className="py-5 px-6 scroll-p-1 select-none">
                                <div className="flex items-center justify-center gap-2">
                                  
                                  {/* Delete row */}
                                  <button
                                    onClick={(e) => handleDeleteEntry(item.id, e)}
                                    className="p-1 px-2 rounded hover:bg-slate-800 text-slate-500 hover:text-rose-400 transition-all font-mono text-[10px]"
                                    title="Exclude registry row"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>

                                </div>
                              </td>

                            </tr>
                          );
                        })}
                      </tbody>

                    </table>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* VIEW 3: DYNAMIC MONTH CALENDAR ACTIVITY MATRIX */}
          {currentPage === "calendar" && (
            <div id="calendar_matrix" className="space-y-6 max-w-4xl">
              
              {/* Calendar month selector controls */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-medium text-base text-white">Daily Submission Tracker</h3>
                    <p className="text-xs text-slate-450 mt-1">
                      Monitor which developers posted daily updates on specific calendar milestones. Select a custom date below to filter co-worker statuses.
                    </p>
                  </div>

                  <div className="flex items-center bg-slate-900 border border-slate-800 p-1.5 rounded-lg gap-2">
                    <button
                      onClick={() => changeCalendarMonth(-1)}
                      className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
                    >
                      &larr;
                    </button>
                    <span className="text-xs font-mono font-bold px-2 text-slate-200">
                      {currentCalendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </span>
                    <button
                      onClick={() => changeCalendarMonth(1)}
                      className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
                    >
                      &rarr;
                    </button>
                  </div>
                </div>

                {/* Calendar Grid Matrix */}
                <div className="grid grid-cols-7 gap-2.5">
                  
                  {/* Row titles headers */}
                  {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(dayName => (
                    <div key={dayName} className="text-center font-mono text-[10px] text-slate-500 font-bold py-1.5">
                      {dayName}
                    </div>
                  ))}

                  {/* Calendar day entries mapping */}
                  {getDaysInMonth(currentCalendarMonth).map((dateStr, idx) => {
                    if (!dateStr) {
                      return <div key={`empty-${idx}`} className="bg-slate-950/20 rounded-xl h-18"></div>;
                    }

                    // Count metrics representing reports on this date string
                    const matchingReports = history.filter(item => item.date === dateStr);
                    const isSelected = selectedCalendarDate === dateStr;

                    return (
                      <button
                        key={dateStr}
                        onClick={() => {
                          setSelectedCalendarDate(dateStr);
                          showToast(`Selected update logs for date: ${dateStr}`, "info");
                        }}
                        className={`h-22 p-2 rounded-xl text-left border flex flex-col justify-between transition-all relative overflow-hidden group ${
                          isSelected 
                            ? "bg-indigo-650 border-indigo-500 text-white shadow-soft" 
                            : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700 text-slate-200 hover:bg-slate-900"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`text-[11px] font-mono font-bold ${
                            isSelected ? "text-indigo-100" : "text-slate-400 group-hover:text-white"
                          }`}>
                            {parseInt(dateStr.split("-")[2])}
                          </span>
                          
                          {matchingReports.length > 0 && (
                            <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                              isSelected ? "bg-white text-indigo-950" : "bg-indigo-500/25 text-indigo-300"
                            }`}>
                              {matchingReports.length}
                            </span>
                          )}
                        </div>

                        {/* List employee names reported today in mini badge limits */}
                        <div className="space-y-0.5 truncate w-full pt-1">
                          {matchingReports.slice(0, 2).map((item, idX) => (
                            <p key={idX} className={`text-[8.5px] truncate font-sans leading-normal ${
                              isSelected ? "text-indigo-200" : "text-slate-450"
                            }`}>
                              • {item.employee_name}
                            </p>
                          ))}
                          {matchingReports.length > 2 && (
                            <p className="text-[8px] font-semibold text-indigo-400 font-mono">
                              + {matchingReports.length - 2} more
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}

                </div>

              </div>

              {/* Day filter updates summary */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
                
                <div className="flex items-center justify-between pb-3 border-b border-slate-850">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    <span>Status reports captured on: {selectedCalendarDate}</span>
                  </h4>

                  <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                    {history.filter(item => item.date === selectedCalendarDate).length} Update(s)
                  </span>
                </div>

                <div className="space-y-4">
                  {history.filter(item => item.date === selectedCalendarDate).length === 0 ? (
                    <div className="text-left text-xs text-slate-500 py-4 leading-relaxed">
                      No status records currently stored for this date. Switch back to the <strong>Parser Terminal</strong> and paste Slack data for {selectedCalendarDate} to view progress reports.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {history.filter(item => item.date === selectedCalendarDate).map(item => (
                        <div 
                          key={item.id}
                          onClick={() => setSelectedRecord(item)}
                          className="bg-slate-900 border border-slate-800 p-4 rounded-xl hover:border-slate-700 cursor-pointer transition-all space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-slate-200 text-xs">{item.employee_name}</p>
                              <p className="text-[10px] text-indigo-400 font-mono mt-0.5">{item.project_name}</p>
                            </div>
                            <span className={`text-[10px] font-mono font-bold p-1 rounded ${
                              item.blockers?.length > 0 ? "bg-rose-950/30 text-rose-350 border border-rose-900/10" : "bg-emerald-950/30 text-emerald-350 border border-emerald-900/10"
                            }`}>
                              {item.blockers?.length > 0 ? "Blocked" : "Healthy"}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-400 space-y-1">
                            <p><strong>Highlights:</strong> {item.progress[0] || "None status"}</p>
                            {item.progress.length > 1 && <p className="text-[10px] text-slate-500">+{item.progress.length - 1} more items</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* VIEW 4: PERSONALIZED PROFILE ROUTER AND CONNECT SUPABASE CREDENTIALS */}
          {currentPage === "auth" && (
            <div id="auth_portal" className="max-w-xl mx-auto bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
              
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="font-display font-semibold text-lg text-white">Workspace Session Portal</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Establish your contributor identity to stamp updates or connect directly to a remote postgres backend.
                </p>
              </div>

              {/* Segmented control tab bar for auth style selection */}
              <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod("simulated");
                    setErrorMsg(null);
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    authMethod === "simulated"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Simulated Session
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod("supabase");
                    setErrorMsg(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    authMethod === "supabase"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Real Supabase Auth</span>
                </button>
              </div>

              {authMethod === "simulated" ? (
                /* Simulated email session provider form */
                <form onSubmit={handleAuthSubmit} className="space-y-4 pt-1">
                  <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800 text-[11px] text-indigo-300 leading-normal">
                    💡 Standalone Mode: Establish instant developer sessions. Perfect for mock audits and preview testing.
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="sim_auth_email" className="block text-[11px] font-mono text-slate-400 uppercase">
                      Developer Email
                    </label>
                    <input
                      id="sim_auth_email"
                      type="email"
                      required
                      className="w-full text-xs p-3 rounded-lg border border-slate-850 bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="siddharth@mycompany.io"
                      value={authEmailInput}
                      onChange={(e) => setAuthEmailInput(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="sim_auth_name" className="block text-[11px] font-mono text-slate-400 uppercase">
                      Preferred Display Name
                    </label>
                    <input
                      id="sim_auth_name"
                      type="text"
                      className="w-full text-xs p-3 rounded-lg border border-slate-850 bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Siddharth Verma"
                      value={authNameInput}
                      onChange={(e) => setAuthNameInput(e.target.value)}
                    />
                  </div>

                  <button
                    id="sim_auth_btn_submit"
                    type="submit"
                    className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all pt-1 flex items-center justify-center gap-2"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Connect Profile Session</span>
                  </button>
                </form>
              ) : (
                /* Real Supabase database sign in / signup */
                <div className="space-y-4">
                  {!supabaseConnected ? (
                    /* Supabase not yet declared */
                    <div className="space-y-4 pt-1">
                      <div className="bg-slate-900/80 border border-slate-850 p-5 rounded-2xl space-y-3">
                        <div className="flex items-center gap-2 text-amber-400">
                          <AlertCircle className="w-5 h-5" />
                          <span className="text-xs font-semibold">Supabase Keys Unconfigured</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                          Your client is currently in offline mode. To activate real live Supabase dynamic user authentication and PostgreSQL data persistence, declare your key pair:
                        </p>
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 font-mono text-[10px] text-slate-300 space-y-1.5">
                          <p className="text-slate-500"># Inside system credentials or .env file:</p>
                          <p>VITE_SUPABASE_URL="https://your-proj.supabase.co"</p>
                          <p>VITE_SUPABASE_ANON_KEY="eyJhbGc..."</p>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                          Once these keys are bound inside credentials/settings, the client will automatically trigger high-fidelity direct auth APIs.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setAuthMethod("simulated")}
                        className="w-full h-11 border border-slate-800 text-slate-350 hover:bg-slate-900 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                      >
                        <span>Continue with Simulated Session fallback</span>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>
                  ) : (
                    /* Real Supabase Auth available */
                    <form onSubmit={handleAuthSubmit} className="space-y-4 pt-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 bg-slate-950">
                        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/20 px-2 py-1 rounded border border-emerald-900/30">
                          ● SUPABASE AUTHENTICATION CONNECTED
                        </span>
                        
                        <button
                          type="button"
                          onClick={() => setIsAuthModeSignUp(!isAuthModeSignUp)}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold text-left sm:text-right"
                        >
                          {isAuthModeSignUp ? "Switch to Sign In" : "Switch to Sign Up / Create Account"}
                        </button>
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="sup_auth_email" className="block text-[11px] font-mono text-slate-400 uppercase">
                          Supabase User Email
                        </label>
                        <input
                          id="sup_auth_email"
                          type="email"
                          required
                          className="w-full text-xs p-3 rounded-lg border border-slate-850 bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          placeholder="developer@company.com"
                          value={authEmailInput}
                          onChange={(e) => setAuthEmailInput(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="sup_auth_password" className="block text-[11px] font-mono text-slate-400 uppercase">
                          Password
                        </label>
                        <input
                          id="sup_auth_password"
                          type="password"
                          required
                          className="w-full text-xs p-3 rounded-lg border border-slate-850 bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          placeholder="••••••••"
                          value={authPasswordInput}
                          onChange={(e) => setAuthPasswordInput(e.target.value)}
                        />
                      </div>

                      {isAuthModeSignUp && (
                        <div className="space-y-1">
                          <label htmlFor="sup_auth_name" className="block text-[11px] font-mono text-slate-400 uppercase">
                            Teammate Display Name
                          </label>
                          <input
                            id="sup_auth_name"
                            type="text"
                            className="w-full text-xs p-3 rounded-lg border border-slate-850 bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            placeholder="Siddharth Verma"
                            value={authNameInput}
                            onChange={(e) => setAuthNameInput(e.target.value)}
                          />
                        </div>
                      )}

                      <button
                        id="sup_auth_btn_submit"
                        type="submit"
                        disabled={isAuthenticating}
                        className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all pt-1 flex items-center justify-center gap-2"
                      >
                        {isAuthenticating ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                            <span>Authenticating Secure Client Session...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            <span>{isAuthModeSignUp ? "Create Workspace Account" : "Sign In to Database Context"}</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-slate-850/50 bg-slate-950 space-y-3 text-[11px] text-slate-500 font-mono">
                <p><strong>Configuring cloud backup storage:</strong></p>
                <p className="leading-relaxed text-[10px]/relaxed text-slate-550">
                  Setting up environmental <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> variables binds your daily status reports seamlessly to your PostgreSQL backend.
                </p>
              </div>

            </div>
          )}

        </div>

      </main>

      {/* SLIDE-OVER DRAWER DETAIL: Structured record visualization view pane */}
      {selectedRecord && (
        <div id="drawer" className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex justify-end">
          
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="w-full max-w-xl bg-slate-950 border-l border-slate-800 h-full flex flex-col justify-between shadow-2xl animate-slide-left overflow-y-auto"
          >
            
            {/* Drawer Header */}
            <div>
              <div className="bg-slate-900 p-5 border-b border-slate-800 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-indigo-400 tracking-wider">STRUCTURED TEAM UPDATE DETAIL</span>
                  <h3 className="font-display font-semibold text-white text-base">{selectedRecord.employee_name}</h3>
                </div>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body content */}
              <div className="p-6 space-y-6">
                
                {/* Meta details cards summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                    <span className="text-[9px] text-slate-500 font-mono block">Submissions Date</span>
                    <span className="text-xs font-semibold text-slate-200 mt-1 block">{selectedRecord.date}</span>
                  </div>
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                    <span className="text-[9px] text-slate-500 font-mono block">Active Project Scope</span>
                    <span className="text-xs font-semibold text-indigo-400 mt-1 block">{selectedRecord.project_name}</span>
                  </div>
                </div>

                {/* Complete progress breakdown */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase text-emerald-400 font-mono tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Progress Highlights</span>
                  </h4>
                  <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800 space-y-2.5">
                    {selectedRecord.progress.map((p, idx) => (
                      <p className="text-xs text-slate-300 leading-normal flex items-start gap-2" key={idx}>
                        <span className="text-emerald-400 font-bold shrink-0 mt-0.5 font-mono">•</span>
                        <span>{p}</span>
                      </p>
                    ))}
                  </div>
                </div>

                {/* Impediment details */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase text-rose-450 font-mono tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-450" />
                    <span>Blockers / Dependencies</span>
                  </h4>
                  <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-850 space-y-2.5">
                    {selectedRecord.blockers && selectedRecord.blockers.length > 0 ? (
                      selectedRecord.blockers.map((b, idx) => (
                        <p className="text-xs text-rose-300 leading-normal flex items-start gap-2 bg-rose-950/20 p-2 rounded" key={idx}>
                          <span className="text-rose-450 font-bold font-mono shrink-0">•</span>
                          <span>{b}</span>
                        </p>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500">None reported today. 🎉</span>
                    )}
                  </div>
                </div>

                {/* Plan details */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase text-indigo-400 font-mono tracking-wider flex items-center gap-1.5">
                    <Send className="w-4 h-4 text-indigo-400" />
                    <span>Estimated next steps plan</span>
                  </h4>
                  <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800 space-y-2.5">
                    {selectedRecord.plan && selectedRecord.plan.length > 0 ? (
                      selectedRecord.plan.map((pl, idx) => (
                        <p className="text-xs text-slate-300 leading-normal flex items-start gap-2" key={idx}>
                          <span className="text-indigo-450 font-bold shrink-0 mt-0.5 font-mono">•</span>
                          <span>{pl}</span>
                        </p>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500">No scheduled upcoming actions listed.</span>
                    )}
                  </div>
                </div>

                {/* Raw snippet source if kept */}
                {selectedRecord.raw_text && (
                  <div className="space-y-2">
                    <span className="text-[10px] text-slate-550 font-mono">ORIGINAL SLACK TEXT CONTENT</span>
                    <pre className="text-[10px] font-mono leading-relaxed bg-slate-900 p-3 rounded-lg border border-slate-850 overflow-x-auto whitespace-pre-wrap text-slate-400 max-h-32">
                      {selectedRecord.raw_text}
                    </pre>
                  </div>
                )}

              </div>
            </div>

            {/* Close actions drawer footer */}
            <div className="bg-slate-900 p-5 border-t border-slate-850 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-500">ID: {selectedRecord.id}</span>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold rounded-lg"
              >
                Dismiss drawer
              </button>
            </div>

          </div>

        </div>
      )}

      {/* Simulated Email Compose Dialog Modal */}
      {isEmailModalOpen && (
        <div id="email_modal_overlay" className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div 
            id="email_modal_card"
            className="bg-slate-950 rounded-2xl shadow-2xl border border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-zoom-in"
          >
            
            <div className="bg-slate-900 p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4.5 h-4.5 text-indigo-400" />
                <h3 className="font-display font-medium text-sm text-white">Daily Team Consolidated updates Dispatch</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsEmailModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors animate-pulse"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email Form */}
            <form onSubmit={handleSendEmailSimulation} className="p-6 space-y-4 flex-1 overflow-y-auto">
              
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400">Recipient Email</label>
                <input
                  type="email"
                  className="w-full text-xs p-3 rounded-lg border border-slate-800 bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                  placeholder="manager@mycompany.com, leads@mycompany.com"
                  value={emailRecipient}
                  onChange={(e) => setEmailRecipient(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400">Subject</label>
                <input
                  type="text"
                  className="w-full text-xs p-3 rounded-lg border border-slate-800 bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                  placeholder="Team Consolidated updates digest"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-400">Email Contents (Auto-Generated Table Output)</label>
                  <span className="text-[10px] text-slate-500 font-mono">Consolidation Engine active</span>
                </div>
                <textarea
                  rows={9}
                  className="w-full text-xs font-mono p-4 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="px-4 py-2 border border-slate-800 text-xs font-semibold text-slate-400 hover:bg-slate-900 rounded-lg"
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
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-3.5 h-3.5" />
                      <span>Simulate Dispatch Email</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
