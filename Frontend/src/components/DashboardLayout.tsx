import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, FileText, BarChart3, Trophy,
  Bell, GraduationCap, ChevronLeft, ChevronRight, Zap, Bot, LogOut, School, ClipboardCheck, UserCircle, CalendarDays,   Menu, X, Settings, CalendarOff, Clock, PenTool, IndianRupee, LifeBuoy, Volume2, VolumeX, Search
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api, getAccessToken } from "@/lib/backendApi";
import ThemeToggle from "@/components/ThemeToggle";
import { Loader2 } from "lucide-react";

const studentNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/student-dashboard" },
  { icon: BookOpen, label: "Lectures", path: "/lectures" },
  { icon: FileText, label: "Assignments", path: "/assignments" },
  { icon: PenTool, label: "Exams", path: "/exams" },
  { icon: Clock, label: "Timetable", path: "/timetable" },
  { icon: ClipboardCheck, label: "Attendance", path: "/attendance" },
  { icon: CalendarOff, label: "Leave", path: "/leave-requests" },
  { icon: IndianRupee, label: "Fees", path: "/fees" },
  { icon: CalendarDays, label: "Sprint Plan", path: "/sprint-plan" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: Trophy, label: "Leaderboard", path: "/leaderboard" },
  { icon: LifeBuoy, label: "Support", path: "/support" },
  { icon: Bot, label: "AI Tutor", path: "/ai-tutor" },
  { icon: Bell, label: "Notifications", path: "/notifications" },
  { icon: UserCircle, label: "Profile", path: "/profile" },
];

const teacherNavItems = [
  { icon: School, label: "Teacher Panel", path: "/teacher" },
  { icon: BookOpen, label: "Lectures", path: "/lectures" },
  { icon: FileText, label: "Assignments", path: "/assignments" },
  { icon: PenTool, label: "Exams", path: "/exams" },
  { icon: Clock, label: "Timetable", path: "/timetable" },
  { icon: ClipboardCheck, label: "Attendance", path: "/teacher-attendance" },
  { icon: CalendarOff, label: "Leave Requests", path: "/leave-requests" },
  { icon: CalendarDays, label: "Sprint Plan", path: "/sprint-plan" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: LifeBuoy, label: "Support Tickets", path: "/support" },
  { icon: Bot, label: "AI Tutor", path: "/ai-tutor" },
  { icon: Bell, label: "Notifications", path: "/notifications" },
  { icon: UserCircle, label: "Profile", path: "/profile" },
];

const adminNavItems = [
  { icon: Zap, label: "Admin Panel", path: "/admin" },
  { icon: BookOpen, label: "Lectures", path: "/lectures" },
  { icon: FileText, label: "Assignments", path: "/assignments" },
  { icon: PenTool, label: "Exams", path: "/exams" },
  { icon: Clock, label: "Timetable", path: "/timetable" },
  { icon: IndianRupee, label: "Fees", path: "/fees" },
  { icon: CalendarOff, label: "Leave Requests", path: "/leave-requests" },
  { icon: CalendarDays, label: "Sprint Plan", path: "/sprint-plan" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: LifeBuoy, label: "Support Tickets", path: "/support" },
  { icon: Bot, label: "AI Tutor", path: "/ai-tutor" },
  { icon: Bell, label: "Notifications", path: "/notifications" },
  { icon: UserCircle, label: "Profile", path: "/profile" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, roles, signOut, signOutLoading } = useAuth();
  const isAdmin = roles.includes("admin");
  const isTeacher = roles.includes("teacher");
  const navItems = isAdmin ? adminNavItems : isTeacher ? teacherNavItems : studentNavItems;

  const currentPage = navItems.find(item => item.path === location.pathname)?.label || "Dashboard";
  const sidebarWidth = collapsed ? 72 : 240;
  const prevUnreadRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [headerSoundOn, setHeaderSoundOn] = useState(
    () => localStorage.getItem("learnx_notification_sound") !== "off"
  );

  // Search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Don't auto-close on typing, only show results
  };

  const handleSearchSubmit = (query: string) => {
    if (query.trim()) {
      // Search through nav items and navigate
      const matchedItem = navItems.find(item => 
        item.label.toLowerCase().includes(query.toLowerCase())
      );
      if (matchedItem) {
        navigate(matchedItem.path);
        setSearchOpen(false);
        setSearchQuery("");
      }
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  useEffect(() => {
    localStorage.setItem("learnx_notification_sound", headerSoundOn ? "on" : "off");
    window.dispatchEvent(new Event("learnx-notification-sound"));
  }, [headerSoundOn]);

  useEffect(() => {
    const sync = () => setHeaderSoundOn(localStorage.getItem("learnx_notification_sound") !== "off");
    sync();
    window.addEventListener("learnx-notification-sound", sync);
    return () => window.removeEventListener("learnx-notification-sound", sync);
  }, []);

  const playNotificationBeep = async () => {
    if (localStorage.getItem("learnx_notification_sound") === "off") return;
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new Ctx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") await ctx.resume();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 880;
      g.gain.value = 0.0001;
      o.connect(g);
      g.connect(ctx.destination);
      const now = ctx.currentTime;
      g.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
      o.start(now);
      o.stop(now + 0.22);
    } catch {
      // ignore audio failures
    }
  };

  useEffect(() => {
    // Notifications unread count backend se aayega.
    if (!user) return;
    const accessToken = getAccessToken();
    if (!accessToken) {
      setUnreadNotifications(0);
      return;
    }

    async function fetchUnread() {
      const res = await api<{ count: number }>("/api/notifications/unread-count", {
        method: "GET",
        accessToken,
      });
      if (res.status === 200 && res.data) {
        const next = res.data.count ?? 0;
        if (next > prevUnreadRef.current) playNotificationBeep();
        prevUnreadRef.current = next;
        setUnreadNotifications(next);
      } else {
        prevUnreadRef.current = 0;
        setUnreadNotifications(0);
      }
    }

    void fetchUnread();
    const t = window.setInterval(() => {
      void fetchUnread();
    }, 10000);
    return () => window.clearInterval(t);
  }, [user, location.pathname]);

  return (
    <div className="min-h-screen bg-background transition-colors duration-300 relative">
      {/* Sign-out loading overlay */}
      {signOutLoading && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-card border border-border/20 rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-foreground font-medium">Please wait...</p>
            <p className="text-muted-foreground text-sm">Signing you out safely</p>
          </div>
        </div>
      )}

      {/* ========= SIDEBAR - Desktop ========= */}
      <motion.aside
        animate={{ width: sidebarWidth }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="fixed top-0 left-0 h-full z-50 hidden lg:flex flex-col border-r border-border/15"
        style={{ background: "hsl(var(--card) / 0.6)", backdropFilter: "blur(20px)" }}
      >
        {/* Logo */}
        <div className="h-[65px] flex items-center px-4 border-b border-border/10">
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-[14px] flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-sky-500 via-violet-500 to-pink-500 shadow-lg shadow-violet-500/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="font-extrabold text-[17px] text-foreground whitespace-nowrap tracking-tight"
                >
                  Learn<span className="bg-gradient-to-r from-sky-500 via-violet-500 to-pink-500 bg-clip-text text-transparent">X</span>
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
                  ${isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon className={`w-[18px] h-[18px] flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${isActive ? "text-primary" : ""}`} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-[13px] whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>

        {/* Sign out & Collapse toggle */}
        <div className="px-3 pb-4 space-y-1.5 border-t border-border/10 pt-3">
          <button
            onClick={signOut}
            disabled={signOutLoading}
            title={collapsed ? "Sign out" : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {signOutLoading ? (
              <Loader2 className="w-[18px] h-[18px] flex-shrink-0 animate-spin" />
            ) : (
              <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
            )}
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[13px] whitespace-nowrap"
                >
                  {signOutLoading ? "Please wait..." : "Sign out"}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all duration-200 border border-border/15"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </motion.aside>

      {/* ========= MOBILE SIDEBAR ========= */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 h-full w-[280px] max-w-[80vw] z-50 lg:hidden flex flex-col border-r border-border/20 bg-card"
            >
              <div className="h-14 flex items-center justify-between px-4 border-b border-border/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-sky-500 via-violet-500 to-pink-500">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-extrabold text-foreground text-sm">
                    Learn<span className="bg-gradient-to-r from-sky-500 via-violet-500 to-pink-500 bg-clip-text text-transparent">X</span>
                  </span>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-lg transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <nav className="flex-1 py-3 px-2.5 space-y-0.5 overflow-y-auto overscroll-contain">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 min-h-[44px] touch-manipulation
                        ${isActive ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"}`}
                    >
                      <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                      <span className="text-[13px]">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="p-3 border-t border-border/10">
                <button
                  onClick={() => { setMobileMenuOpen(false); signOut(); }}
                  disabled={signOutLoading}
                  className="w-full flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation"
                >
                  {signOutLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                  <span>{signOutLoading ? "Please wait..." : "Sign out"}</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ========= MAIN AREA ========= */}
      <div className="lg:transition-all lg:duration-300" style={{ marginLeft: undefined }}>
        {/* Desktop spacer for sidebar */}
        <motion.div
          animate={{ marginLeft: sidebarWidth }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="hidden lg:block min-h-screen"
        >
          {/* ========= TOP NAVBAR - Desktop ========= */}
          <div className="sticky top-0 z-40 h-[65px] border-b border-border/10 backdrop-blur-2xl bg-background/70 flex items-center justify-between px-7">
            {/* Left: Breadcrumb */}
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-primary/60" />
              <span className="text-[15px] font-semibold text-foreground tracking-tight">{currentPage}</span>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5">
              {/* Search Bar */}
              <div className="relative">
                <motion.button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">Search...</span>
                  <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono bg-muted/50 rounded border border-border/30">
                    ⌘K
                  </kbd>
                </motion.button>
                
                <AnimatePresence>
                  {searchOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setSearchOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed left-4 right-4 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 sm:max-w-md lg:w-80 rounded-2xl border border-border/20 bg-card/95 backdrop-blur-2xl shadow-2xl shadow-black/10 p-4 z-50"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <Search className="w-4 h-4 text-muted-foreground" />
                          <input
                            type="text"
                            placeholder="Search pages..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSearchSubmit(searchQuery);
                              } else if (e.key === 'Escape') {
                                setSearchOpen(false);
                              }
                            }}
                            className="flex-1 bg-transparent border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground"
                            autoFocus
                          />
                          {searchQuery && (
                            <button
                              onClick={clearSearch}
                              className="p-1 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        
                        {/* Search Results */}
                        {searchQuery && (
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            {navItems
                              .filter(item => 
                                item.label.toLowerCase().includes(searchQuery.toLowerCase())
                              )
                              .map(item => (
                                <Link
                                  key={item.path}
                                  to={item.path}
                                  onClick={() => {
                                    setSearchOpen(false);
                                    setSearchQuery("");
                                  }}
                                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                                >
                                  <item.icon className="w-4 h-4" />
                                  <span>{item.label}</span>
                                </Link>
                              ))}
                            {navItems.filter(item => 
                              item.label.toLowerCase().includes(searchQuery.toLowerCase())
                            ).length === 0 && (
                              <div className="text-center py-4 text-sm text-muted-foreground">
                                No results found
                              </div>
                            )}
                          </div>
                        )}
                        
                        {!searchQuery && (
                          <div className="text-center py-2 text-xs text-muted-foreground">
                            Type to search pages...
                          </div>
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <ThemeToggle />

              <button
                type="button"
                onClick={() => setHeaderSoundOn((s) => !s)}
                className="hidden sm:inline text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-lg hover:bg-muted/30"
                title="Notification sound"
              >
                Sound: {headerSoundOn ? "On" : "Off"}
              </button>

              {/* Notifications */}
              <Link
                to="/notifications"
                className="relative w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
              >
                <Bell className="w-[18px] h-[18px]" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] rounded-full bg-rose-500 ring-2 ring-background text-[10px] font-bold text-white flex items-center justify-center px-1">
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                )}
              </Link>

              {/* Divider */}
              <div className="w-px h-8 bg-border/20 mx-1.5" />

              {/* Profile */}
              <div className="relative">
                <button
                  onClick={() => setProfileDropdown(!profileDropdown)}
                  className="flex items-center gap-3 pl-1.5 pr-3 py-1.5 rounded-2xl hover:bg-muted/30 transition-all duration-200"
                >
                  {profile?.avatar_url ? (
                    <img src={`${profile.avatar_url}?t=${Date.now()}`} alt="Avatar" className="w-9 h-9 rounded-xl object-cover shadow-md" />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-violet-500 flex items-center justify-center text-sm font-bold text-white shadow-md shadow-violet-500/15">
                      {(profile?.full_name || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="text-[13px] font-semibold text-foreground leading-tight">{profile?.full_name || "User"}</p>
                    <p className="text-[11px] text-muted-foreground capitalize leading-tight">{roles.includes("admin") ? "Admin" : roles.includes("teacher") ? "Teacher" : "Student"}</p>
                  </div>
                </button>

                <AnimatePresence>
                  {profileDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setProfileDropdown(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-border/20 bg-card/95 backdrop-blur-2xl shadow-2xl shadow-black/10 dark:shadow-black/30 p-2 z-50"
                      >
                        {/* User info */}
                        <div className="px-3 py-3 mb-1">
                          <p className="text-sm font-bold text-foreground">{profile?.full_name || "User"}</p>
                          <p className="text-xs text-muted-foreground capitalize">{roles.includes("admin") ? "Admin" : roles.includes("teacher") ? "Teacher" : "Student"}</p>
                        </div>
                        <div className="border-t border-border/15 mb-1" />
                        <Link
                          to="/profile"
                          onClick={() => setProfileDropdown(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                        >
                          <UserCircle className="w-4 h-4" />
                          <span>My Profile</span>
                        </Link>
                        <Link
                          to="/notifications"
                          onClick={() => setProfileDropdown(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                        >
                          <Bell className="w-4 h-4" />
                          <span>Notifications</span>
                        </Link>
                        <div className="border-t border-border/15 my-1" />
                        <button
                          onClick={() => { setProfileDropdown(false); signOut(); }}
                          disabled={signOutLoading}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {signOutLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <LogOut className="w-4 h-4" />
                          )}
                          <span>{signOutLoading ? "Please wait..." : "Sign out"}</span>
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Page content */}
          <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
            {children}
          </div>
        </motion.div>

        {/* Mobile layout */}
        <div className="lg:hidden">
          {/* Mobile navbar */}
          <div className="sticky top-0 z-40 h-14 border-b border-border/10 backdrop-blur-2xl bg-background/70 flex items-center justify-between px-3 md:px-4">
            <div className="flex items-center gap-2 md:gap-3">
              <button 
                onClick={() => setMobileMenuOpen(true)} 
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-lg transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <span className="font-semibold text-sm text-foreground truncate max-w-[150px] md:max-w-none">{currentPage}</span>
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              {/* Mobile Search Button */}
              <motion.button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-lg transition-colors"
                whileTap={{ scale: 0.95 }}
              >
                <Search className="w-4 h-4" />
              </motion.button>

              <ThemeToggle />
              <button
                type="button"
                onClick={() => setHeaderSoundOn((s) => !s)}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-lg"
                title={headerSoundOn ? "Mute notification sound" : "Enable notification sound"}
                aria-label={headerSoundOn ? "Mute notification sound" : "Enable notification sound"}
              >
                {headerSoundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <Link 
                to="/notifications"
                className="relative w-8 h-8 md:w-9 md:h-9 rounded-lg md:rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-[16px] h-[16px] md:w-[18px] md:h-[18px]" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[14px] h-[14px] md:min-w-[16px] md:h-[16px] rounded-full bg-rose-500 text-[8px] md:text-[9px] font-bold text-white flex items-center justify-center px-0.5">
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                )}
              </Link>
              <button
                onClick={() => setProfileDropdown(!profileDropdown)}
                className="overflow-hidden w-7 h-7 md:w-8 md:h-8 rounded-lg md:rounded-xl hover:bg-muted/30 transition-colors"
                aria-label="Profile menu"
              >
                {profile?.avatar_url ? (
                  <img src={`${profile.avatar_url}?t=${Date.now()}`} alt="Avatar" className="w-full h-full rounded-lg object-cover" />
                ) : (
                  <div className="w-full h-full rounded-lg bg-gradient-to-br from-sky-500 to-violet-500 flex items-center justify-center text-[10px] md:text-xs font-bold text-white">
                    {(profile?.full_name || "U").charAt(0).toUpperCase()}
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Mobile content */}
          <div className="p-3 md:p-4 lg:p-6 max-w-[1400px] mx-auto overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
