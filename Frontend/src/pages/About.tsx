import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  BellRing,
  BookOpenCheck,
  Bot,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  KeyRound,
  LockKeyhole,
  MailCheck,
  Menu,
  Moon,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  TicketCheck,
  Trophy,
  UserCog,
  Users,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";

const platformUrl = "https://learnxplatform.qzz.io";

type IconItem = {
  title: string;
  description?: string;
  icon: LucideIcon;
};

const stats = [
  { value: "10K+", label: "Students" },
  { value: "500+", label: "Teachers" },
  { value: "50+", label: "Institutions" },
  { value: "99.9%", label: "Uptime" },
];

const workflow: IconItem[] = [
  {
    title: "Admin Setup",
    description: "Admin creates teachers with unique code and password while keeping full system control.",
    icon: UserCog,
  },
  {
    title: "Teacher Access",
    description: "Teachers login using code to manage classes, assignments, exams, and updates.",
    icon: KeyRound,
  },
  {
    title: "Student Management",
    description: "Admins or teachers add students, then LearnX sends credentials automatically.",
    icon: UsersRound,
  },
  {
    title: "Email Notifications",
    description: "Students receive secure login details and important learning alerts on email.",
    icon: MailCheck,
  },
];

const roles = [
  {
    title: "Admin Panel",
    icon: ShieldCheck,
    accent: "from-blue-500 to-cyan-400",
    features: [
      "Manage teachers and students",
      "Control classes, assignments, exams",
      "User management with edit and delete",
      "Fee management system",
      "View analytics dashboard",
      "Monitor support tickets",
    ],
  },
  {
    title: "Teacher Panel",
    icon: GraduationCap,
    accent: "from-violet-500 to-fuchsia-500",
    features: [
      "Login via code and password",
      "Create assignments, quizzes, announcements",
      "AI generates content from topic",
      "Attendance with location and selfie",
      "Student analytics and weak student tracking",
      "Solve support tickets",
      "AI help for doubts",
    ],
  },
  {
    title: "Student Panel",
    icon: BookOpenCheck,
    accent: "from-emerald-500 to-teal-400",
    features: [
      "Login via email credentials",
      "Dashboard with performance and reports",
      "Lecture video section",
      "Assignments with deadlines and late rules",
      "Secure exam with tab warnings and auto submit",
      "AI camera monitoring for anti-cheating",
      "Timetable view and attendance with selfie/location",
      "Leaderboard, tickets, sound notifications",
      "Dark/light mode, AI tutor, sprint plan, profile, fees",
    ],
  },
];

const smartFeatures: IconItem[] = [
  { title: "Global Search Bar", icon: Search },
  { title: "Secure Authentication", icon: LockKeyhole },
  { title: "AI Tutor and AI Content Generator", icon: Bot },
  { title: "Analytics Dashboard", icon: BarChart3 },
  { title: "Smart Timetable", icon: CalendarDays },
  { title: "Real-time Notifications", icon: BellRing },
  { title: "Leaderboard System", icon: Trophy },
  { title: "Ticket Support System", icon: TicketCheck },
];

const whyLearnX: IconItem[] = [
  { title: "AI Powered Automation", description: "Reduce repetitive work for admins and teachers.", icon: Sparkles },
  { title: "Real-time Monitoring", description: "Track performance, attendance, tickets, and learning health instantly.", icon: BarChart3 },
  { title: "Anti-Cheating Exam System", description: "Tab switch warnings, auto submit, and AI camera monitoring.", icon: ShieldCheck },
  { title: "Role-based Access Control", description: "Separate, secure workspaces for admin, teacher, and student journeys.", icon: LockKeyhole },
  { title: "Scalable for Institutes", description: "Built for growing schools, coaching centers, and multi-class institutions.", icon: UsersRound },
];

const sectionVariant: Variants = {
  hidden: { opacity: 0, y: 36 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: "easeOut" } },
};

const staggerVariant: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

const itemVariant: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

function SectionHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <motion.div
      className="mx-auto mb-12 max-w-3xl text-center"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.35 }}
      variants={sectionVariant}
    >
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.28em] text-blue-600 dark:text-cyan-300">
        {eyebrow}
      </p>
      <h2 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">{subtitle}</p>
    </motion.div>
  );
}

function GlassPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`border border-white/60 bg-white/70 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] dark:shadow-[0_24px_80px_rgba(0,0,0,0.35)] ${className}`}
    >
      {children}
    </div>
  );
}

function FeatureCheck({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-cyan-500" />
      <span>{children}</span>
    </li>
  );
}

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navItems = useMemo(
    () => [
      { label: "Home", href: "/" },
      { label: "Features", href: "/features" },
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
    [],
  );

  return (
    <div className={darkMode ? "dark" : ""}>
      <main className="min-h-screen overflow-hidden bg-[#f7f9fc] text-slate-950 antialiased transition-colors duration-500 dark:bg-[#050713] dark:text-white">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <motion.div
            className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-cyan-300/30 blur-3xl dark:bg-cyan-500/20"
            animate={{ x: [0, 70, 0], y: [0, 40, 0], scale: [1, 1.12, 1] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute right-[-10rem] top-32 h-[32rem] w-[32rem] rounded-full bg-violet-300/35 blur-3xl dark:bg-violet-700/25"
            animate={{ x: [0, -50, 0], y: [0, 70, 0], scale: [1, 0.95, 1] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:44px_44px] opacity-60 dark:bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)]" />
        </div>

        <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
          <GlassPanel className="mx-auto flex max-w-7xl items-center justify-between rounded-3xl px-4 py-3 sm:px-6">
            <Link to="/" className="flex items-center gap-3" aria-label="LearnX home">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                <GraduationCap className="h-5 w-5" />
              </span>
              <span className="text-lg font-bold tracking-tight">LearnX</span>
            </Link>

            <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
              {navItems.map((item) => (
                <Link key={item.href} to={item.href} className="transition hover:text-blue-600 dark:hover:text-cyan-300">
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDarkMode((value) => !value)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white/70 text-slate-700 transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <a
                href={platformUrl}
                className="hidden rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-xl shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-blue-600 dark:bg-white dark:text-slate-950 dark:hover:bg-cyan-200 sm:inline-flex"
              >
                Visit Platform
              </a>
              <button
                type="button"
                onClick={() => setMobileNavOpen((value) => !value)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white/70 md:hidden dark:border-white/10 dark:bg-white/10"
                aria-label="Toggle menu"
              >
                {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </GlassPanel>
          {mobileNavOpen && (
            <GlassPanel className="mx-auto mt-3 flex max-w-7xl flex-col gap-2 rounded-3xl p-3 md:hidden">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className="rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
                >
                  {item.label}
                </Link>
              ))}
            </GlassPanel>
          )}
        </header>

        <section id="top" className="relative flex min-h-screen items-center px-4 pb-20 pt-32 sm:px-6 lg:px-8">
          <div className="mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
            <motion.div initial="hidden" animate="visible" variants={staggerVariant} className="relative z-10">
              <motion.p
                variants={itemVariant}
                className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/60 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm backdrop-blur dark:border-cyan-400/20 dark:bg-white/10 dark:text-cyan-200"
              >
                <Sparkles className="h-4 w-4" /> AI-powered LMS for modern institutions
              </motion.p>
              <motion.h1
                variants={itemVariant}
                className="max-w-4xl text-5xl font-semibold tracking-[-0.06em] text-slate-950 dark:text-white sm:text-7xl lg:text-8xl"
              >
                <span className="block bg-gradient-to-r from-blue-600 via-violet-600 to-cyan-500 bg-clip-text text-transparent">
                  LearnX
                </span>
                <span className="block text-[0.62em] leading-tight sm:text-[0.58em]">#1 AI Learning Platform in India</span>
              </motion.h1>
              <motion.p
                variants={itemVariant}
                className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300 sm:text-xl"
              >
                Complete educational management system with automation, AI, and real-time insights.
              </motion.p>
              <motion.div variants={itemVariant} className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a
                  href={platformUrl}
                  className="group inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-4 text-base font-semibold text-white shadow-2xl shadow-cyan-500/25 transition hover:-translate-y-1 hover:shadow-cyan-500/35"
                >
                  View Demo
                  <ArrowRight className="ml-2 h-5 w-5 transition group-hover:translate-x-1" />
                </a>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white/70 px-6 py-4 text-base font-semibold text-slate-800 shadow-xl shadow-slate-900/5 backdrop-blur transition hover:-translate-y-1 hover:border-blue-200 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:border-cyan-300/40"
                >
                  Explore Features
                </a>
              </motion.div>

              <motion.div variants={itemVariant} className="mt-12 grid grid-cols-2 gap-x-8 gap-y-6 sm:flex sm:flex-wrap">
                {stats.map((stat) => (
                  <div key={stat.label} className="min-w-28">
                    <div className="bg-gradient-to-r from-slate-950 to-blue-600 bg-clip-text text-3xl font-bold text-transparent dark:from-white dark:to-cyan-300">
                      {stat.value}
                    </div>
                    <div className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              className="relative min-h-[460px] lg:min-h-[620px]"
              initial={{ opacity: 0, scale: 0.94, x: 30 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            >
              <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-br from-blue-500 via-violet-500 to-cyan-400 opacity-20 blur-3xl" />
              <GlassPanel className="absolute inset-0 overflow-hidden rounded-[3rem] p-5 sm:p-7">
                <div className="relative flex h-full flex-col rounded-[2.25rem] border border-slate-200/70 bg-white/75 p-5 dark:border-white/10 dark:bg-slate-950/45 sm:p-6">
                  <div className="flex items-center justify-between border-b border-slate-200/70 pb-5 dark:border-white/10">
                    <div>
                      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">LearnX Command Center</p>
                      <h3 className="mt-1 text-2xl font-semibold tracking-tight">Live institute intelligence</h3>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 text-white shadow-lg shadow-cyan-500/25">
                      <Bot className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="grid flex-1 gap-5 py-5 sm:grid-cols-2">
                    <motion.div
                      className="rounded-[2rem] bg-slate-950 p-5 text-white dark:bg-white dark:text-slate-950"
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <p className="text-sm opacity-70">AI Tutor Sessions</p>
                      <p className="mt-4 text-5xl font-semibold tracking-tight">1,284</p>
                      <p className="mt-4 text-sm opacity-75">Doubts solved across chat and image prompts this week.</p>
                    </motion.div>
                    <div className="space-y-5">
                      <div className="rounded-[2rem] border border-slate-200 bg-white/80 p-5 dark:border-white/10 dark:bg-white/10">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Exam Security</p>
                          <ShieldCheck className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                          <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                            initial={{ width: "18%" }}
                            animate={{ width: "92%" }}
                            transition={{ duration: 1.4, delay: 0.6, ease: "easeOut" }}
                          />
                        </div>
                        <p className="mt-4 text-3xl font-bold">92%</p>
                      </div>
                      <div className="rounded-[2rem] border border-slate-200 bg-white/80 p-5 dark:border-white/10 dark:bg-white/10">
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Attendance verified</p>
                        <div className="mt-5 flex -space-x-3">
                          {["A", "I", "L", "M", "X"].map((letter, index) => (
                            <span
                              key={letter}
                              className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-blue-500 to-violet-500 text-sm font-bold text-white dark:border-slate-900"
                              style={{ opacity: 1 - index * 0.08 }}
                            >
                              {letter}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 border-t border-slate-200/70 pt-5 dark:border-white/10 sm:grid-cols-3">
                    {[
                      ["Tickets", "24", TicketCheck],
                      ["Reports", "768", BarChart3],
                      ["Alerts", "Live", BellRing],
                    ].map(([label, value, Icon]) => {
                      const PanelIcon = Icon as LucideIcon;
                      return (
                        <div key={label as string} className="flex items-center gap-3 rounded-2xl bg-slate-100/80 p-4 dark:bg-white/10">
                          <PanelIcon className="h-5 w-5 text-blue-600 dark:text-cyan-300" />
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{label as string}</p>
                            <p className="font-semibold">{value as string}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </GlassPanel>
            </motion.div>
          </div>
        </section>

        {/* Video Demo Section */}
        <section className="relative px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7 }}
              className="text-center mb-16"
            >
              <motion.div
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-6 bg-white/70 dark:bg-black/70 backdrop-blur-sm border border-border/50"
                whileHover={{ scale: 1.05 }}
              >
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-cyan-300" />
                <span className="text-sm font-medium text-muted-foreground">Live Demo</span>
              </motion.div>
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-blue-600 to-cyan-400 bg-clip-text text-transparent">
                See LearnX in Action
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Experience the complete workflow, AI features, and user interface that makes LearnX the future of education management.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              {/* Video Container with Glassmorphism */}
              <GlassPanel className="relative overflow-hidden rounded-[3rem] p-1 bg-gradient-to-br from-blue-500/20 to-cyan-400/20">
                <div className="relative rounded-[2.5rem] overflow-hidden bg-black">
                  {/* Video Element */}
                  <video
                    className="w-full h-auto max-h-[600px] object-cover rounded-[2.5rem]"
                    autoPlay
                    muted
                    loop
                    playsInline
                    controls
                    poster="/video-poster.jpg"
                    title="LearnX Platform Demo - AI Learning Management System in Action"
                    aria-label="LearnX Platform Demo Video"
                  >
                    <source src="/learnx.MP4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>

                  {/* Overlay Effects */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                    <motion.div
                      className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-3 py-1.5 border border-white/20"
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-xs text-white font-medium">LIVE DEMO</span>
                    </motion.div>
                  </div>
                </div>
              </GlassPanel>

              {/* Floating Video Features */}
              <motion.div
                className="absolute -top-4 -right-4 bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-xl border border-white/20 dark:border-white/10"
                initial={{ opacity: 0, x: 20, y: -20 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Secure Platform</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">End-to-end encryption</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="absolute -bottom-4 -left-4 bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-xl border border-white/20 dark:border-white/10"
                initial={{ opacity: 0, x: -20, y: 20 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">AI Powered</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Smart automation</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Video Stats */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              {[
                { icon: Users, label: "Active Users", value: "10K+" },
                { icon: BookOpenCheck, label: "Courses", value: "500+" },
                { icon: Trophy, label: "Success Rate", value: "98%" },
                { icon: Sparkles, label: "AI Features", value: "50+" }
              ].map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.4 + idx * 0.1 }}
                >
                  <motion.div
                    className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-400"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <stat.icon className="w-6 h-6 text-white" />
                  </motion.div>
                  <motion.div
                    className="text-2xl font-bold text-slate-900 dark:text-white"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8 + idx * 0.1, type: "spring" }}
                  >
                    {stat.value}
                  </motion.div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section id="workflow" className="relative px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeader
              eyebrow="How it works"
              title="A smooth path from setup to learning"
              subtitle="LearnX connects administration, teaching, student onboarding, and communication in one secure AI-assisted workflow."
            />
            <motion.div
              className="grid gap-5 md:grid-cols-2 lg:grid-cols-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={staggerVariant}
            >
              {workflow.map((item, index) => (
                <motion.div key={item.title} variants={itemVariant} whileHover={{ y: -8 }}>
                  <GlassPanel className="group h-full rounded-[2rem] p-6 transition duration-300 hover:border-blue-200 hover:shadow-[0_30px_90px_rgba(37,99,235,0.16)] dark:hover:border-cyan-300/30">
                    <div className="mb-7 flex items-center justify-between">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 text-white shadow-lg shadow-cyan-500/25 transition group-hover:scale-105">
                        <item.icon className="h-6 w-6" />
                      </div>
                      <span className="text-sm font-bold text-slate-300 dark:text-slate-600">0{index + 1}</span>
                    </div>
                    <h3 className="text-xl font-semibold tracking-tight">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{item.description}</p>
                  </GlassPanel>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section id="roles" className="relative px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeader
              eyebrow="User roles"
              title="Purpose-built panels for every learner journey"
              subtitle="Admins get control, teachers get AI-assisted productivity, and students get a focused learning experience."
            />
            <motion.div
              className="grid gap-6 lg:grid-cols-3"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
              variants={staggerVariant}
            >
              {roles.map((role) => (
                <motion.div key={role.title} variants={itemVariant} whileHover={{ y: -8 }}>
                  <GlassPanel className="h-full rounded-[2.25rem] p-6 transition duration-300 hover:shadow-[0_30px_90px_rgba(15,23,42,0.14)] dark:hover:shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${role.accent} text-white shadow-lg`}>
                        <role.icon className="h-7 w-7" />
                      </div>
                      <h3 className="text-2xl font-semibold tracking-tight">{role.title}</h3>
                    </div>
                    <ul className="mt-7 space-y-3">
                      {role.features.map((feature) => (
                        <FeatureCheck key={feature}>{feature}</FeatureCheck>
                      ))}
                    </ul>
                  </GlassPanel>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section id="features" className="relative px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeader
              eyebrow="Smart features"
              title="Everything the institution needs, beautifully connected"
              subtitle="Search, security, AI, analytics, notifications, ranking, and support are designed to work together in real time."
            />
            <motion.div
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={staggerVariant}
            >
              {smartFeatures.map((feature) => (
                <motion.div key={feature.title} variants={itemVariant} whileHover={{ y: -6, scale: 1.01 }}>
                  <GlassPanel className="group flex h-full min-h-40 flex-col justify-between rounded-[2rem] p-6 transition hover:border-cyan-200 dark:hover:border-cyan-300/30">
                    <feature.icon className="h-8 w-8 text-blue-600 transition group-hover:scale-110 dark:text-cyan-300" />
                    <h3 className="mt-8 text-lg font-semibold tracking-tight">{feature.title}</h3>
                  </GlassPanel>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section id="why" className="relative px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid items-start gap-12 lg:grid-cols-[0.85fr_1.15fr]">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={sectionVariant}
                className="lg:sticky lg:top-32"
              >
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.28em] text-blue-600 dark:text-cyan-300">
                  Why LearnX
                </p>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
                  Premium learning operations with AI at the core.
                </h2>
                <p className="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-300">
                  LearnX helps institutions modernize management, protect assessments, and give every role the tools they need to move faster.
                </p>
              </motion.div>

              <motion.div
                className="space-y-4"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={staggerVariant}
              >
                {whyLearnX.map((item) => (
                  <motion.div key={item.title} variants={itemVariant} whileHover={{ x: 8 }}>
                    <GlassPanel className="flex gap-5 rounded-[2rem] p-5 transition hover:border-blue-200 dark:hover:border-cyan-300/30 sm:p-6">
                      <div className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                        <item.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold tracking-tight">{item.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{item.description}</p>
                      </div>
                    </GlassPanel>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        <section className="relative px-4 py-24 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-slate-950 px-6 py-16 text-center text-white shadow-[0_40px_120px_rgba(15,23,42,0.35)] dark:bg-white dark:text-slate-950 sm:px-10 sm:py-20"
            initial={{ opacity: 0, y: 34, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mx-auto max-w-3xl">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300 dark:text-blue-600">Get started</p>
              <h2 className="text-4xl font-semibold tracking-tight sm:text-6xl">Start Smart Learning Today</h2>
              <p className="mt-5 text-lg leading-8 text-slate-300 dark:text-slate-600">
                Launch a faster, safer, AI-enhanced education system with LearnX.
              </p>
              <a
                href={platformUrl}
                className="mt-9 inline-flex items-center justify-center rounded-2xl bg-white px-7 py-4 text-base font-semibold text-slate-950 shadow-2xl shadow-cyan-500/20 transition hover:-translate-y-1 hover:bg-cyan-100 dark:bg-slate-950 dark:text-white dark:hover:bg-blue-600"
              >
                Visit Platform
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </div>
          </motion.div>
        </section>

        <footer className="relative border-t border-slate-200/70 px-4 py-8 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400 sm:px-6">
          <p>LearnX - Smart AI Learning Platform. Built for scalable education management.</p>
        </footer>
      </main>
    </div>
  );
}

export default App;
