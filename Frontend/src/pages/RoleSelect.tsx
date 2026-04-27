 import { useRef, useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Users, BookOpen, Shield, ArrowRight, Sparkles, Zap, TrendingUp, X, Clock, Award, Menu, Moon, Sun } from "lucide-react";

const studentHero = "/stundets.png";

const roles = [
  {
    key: "student",
    icon: BookOpen,
    title: "Student",
    desc: "Access courses, track progress, and achieve your learning goals efficiently.",
    tag: "Learner",
    iconClass: "bg-blue-500",
  },
  {
    key: "teacher",
    icon: Users,
    title: "Teacher",
    desc: "Create courses, manage classrooms, and monitor student performance.",
    tag: "Educator",
    iconClass: "bg-violet-500",
  },
  {
    key: "admin",
    icon: Shield,
    title: "Admin",
    desc: "Oversee platform operations, manage users, and ensure quality.",
    tag: "Management",
    iconClass: "bg-pink-500",
  },
];

const stats = [
  { value: "10K+", label: "Users" },
  { value: "99%", label: "Uptime" },
  { value: "AI", label: "Powered" },
];

export default function RoleSelect() {
  const navigate = useNavigate();
  const roleRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const navItems = useMemo(
    () => [
      { label: "Home", href: "/" },
      { label: "Features", href: "/features" },
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
    [],
  );

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <div className="h-dvh bg-gradient-to-br from-[#f7f9fc] via-background to-[#eef4ff] dark:from-[#0a0a0a] dark:via-[#1a1a1a] dark:to-[#2a2a2a] relative overflow-hidden flex flex-col">

      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-primary/5 dark:bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] bg-violet-400/10 dark:bg-purple-500/25 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute top-[20%] right-[25%] w-3 h-3 bg-primary/30 dark:bg-cyan-400/40 rounded-full animate-pulse pointer-events-none" />
      <div className="absolute top-[15%] right-[15%] w-2 h-2 bg-primary/20 dark:bg-blue-400/35 rounded-full animate-pulse pointer-events-none" style={{ animationDelay: "1s" }} />
      <div className="absolute top-[40%] right-[8%] w-2 h-2 bg-primary/25 dark:bg-purple-400/30 rounded-full animate-pulse pointer-events-none" style={{ animationDelay: "2s" }} />
      <div className="absolute bottom-[40%] left-[10%] w-2 h-2 bg-primary/20 dark:bg-cyan-400/25 rounded-full animate-pulse pointer-events-none" style={{ animationDelay: "0.5s" }} />

      <section className="relative z-10 flex-1 flex flex-col overflow-hidden">
        <div className="container mx-auto px-6 md:px-16 flex-1 flex flex-col justify-end pb-2 md:pb-4 relative">
          {/* Glassmorphism Navigation */}
          <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
            <div className="mx-auto flex max-w-7xl items-center justify-between rounded-3xl px-4 py-3 border border-white/60 bg-white/70 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] dark:shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:px-6">
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
                <button
                  type="button"
                  onClick={() => setIsMenuOpen((value) => !value)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white/70 md:hidden dark:border-white/10 dark:bg-white/10"
                  aria-label="Toggle menu"
                >
                  {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </div>
            </div>
            {isMenuOpen && (
              <div className="mx-auto mt-3 flex max-w-7xl flex-col gap-2 rounded-3xl border border-white/60 bg-white/70 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] dark:shadow-[0_24px_80px_rgba(0,0,0,0.35)] p-3 md:hidden">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </header>

          
          {/* Mobile layout - Text first, then image */}
          <div className="md:hidden flex flex-col items-center relative mt-12">
            {/* Text content on top for mobile */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-2 bg-white/70 dark:bg-white/10 border border-border/60 dark:border-white/15 backdrop-blur-sm">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="text-[9px] font-medium text-muted-foreground dark:text-slate-300">
                  Trusted by 10,000+ students worldwide
                </span>
              </div>

              <h1 className="text-2xl font-extrabold text-foreground dark:text-white leading-[1.08] mb-1.5 tracking-tight">
                Smart Learning
                <br />
                <span className="bg-gradient-to-r from-foreground to-muted-foreground dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Platform
                </span>
              </h1>

              <p className="text-muted-foreground dark:text-gray-300 text-[10px] leading-relaxed mb-3 max-w-sm mx-auto">
                Revolutionize education with our intelligent tools for students, teachers, and administrators.
              </p>

              <div className="flex items-center justify-center gap-2.5">
                <button
                  onClick={() => roleRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
                  className="group bg-primary text-primary-foreground px-4 py-2 rounded-xl font-semibold text-[10px] hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 shadow-md flex items-center gap-2 dark:shadow-primary/30"
                >
                  Get Started
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <button
                  onClick={() => navigate("/features")}
                  className="bg-white/70 dark:bg-white/10 border border-border/60 dark:border-white/15 backdrop-blur-sm px-4 py-2 rounded-xl font-semibold text-[10px] text-foreground dark:text-slate-100 hover:bg-card/90 dark:hover:bg-white/15 transition-all duration-300"
                >
                  Learn More
                </button>
              </div>
            </div>

            {/* Image below text for mobile */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent rounded-full blur-3xl scale-125" />
              
              {/* Mobile AI Tutor badge */}
              <div className="absolute left-[-80px] top-[-10px] z-20 rounded-xl border border-border/60 dark:border-white/15 bg-white/90 dark:bg-[#111827]/90 px-2 py-1 shadow-lg backdrop-blur-md animate-float">
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-white">
                    <Zap className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-foreground dark:text-slate-100 leading-none">AI Tutor</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground dark:text-slate-300 leading-none">Always Active</p>
                  </div>
                </div>
              </div>

              {/* Mobile Results badge */}
              <div className="absolute right-[-80px] bottom-[-10px] z-20 rounded-xl border border-border/60 dark:border-white/15 bg-white/90 dark:bg-[#111827]/90 px-2 py-1 shadow-lg backdrop-blur-md animate-float" style={{ animationDelay: "1s" }}>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-white">
                    <TrendingUp className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-foreground dark:text-slate-100 leading-none">+45%</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground dark:text-slate-300 leading-none">Better Results</p>
                  </div>
                </div>
              </div>

              {/* Mobile 24/7 Support badge */}
              <div className="absolute left-[-60px] bottom-[60px] z-20 rounded-xl border border-border/60 dark:border-white/15 bg-white/90 dark:bg-[#111827]/90 px-2 py-1 shadow-lg backdrop-blur-md animate-float" style={{ animationDelay: "2s" }}>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white">
                    <Clock className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-foreground dark:text-slate-100 leading-none">24/7</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground dark:text-slate-300 leading-none">Support</p>
                  </div>
                </div>
              </div>

              {/* Mobile Expert Teachers badge */}
              <div className="absolute right-[-60px] top-[40px] z-20 rounded-xl border border-border/60 dark:border-white/15 bg-white/90 dark:bg-[#111827]/90 px-2 py-1 shadow-lg backdrop-blur-md animate-float" style={{ animationDelay: "3s" }}>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-600 text-white">
                    <Award className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-foreground dark:text-slate-100 leading-none">Expert</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground dark:text-slate-300 leading-none">Teachers</p>
                  </div>
                </div>
              </div>

              <img
                src={studentHero}
                alt="Student with books"
                className="h-[140px] w-auto object-contain drop-shadow-2xl dark:drop-shadow-[0_20px_40px_rgba(0,0,0,0.45)] relative z-10"
                width={600}
                height={900}
              />
            </div>
          </div>

          {/* Desktop layout - side by side (unchanged) */}
          <div className="hidden md:flex items-center relative mt-16">
            <div className="max-w-lg relative z-20 shrink-0">
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-4 bg-white/70 dark:bg-white/10 border border-border/60 dark:border-white/15 backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium text-muted-foreground dark:text-slate-300">
                  Trusted by 10,000+ students worldwide
                </span>
              </div>

              <h1 className="text-5xl font-extrabold text-foreground dark:text-white leading-[1.08] mb-4 tracking-tight">
                Smart Learning
                <br />
                <span className="bg-gradient-to-r from-foreground to-muted-foreground dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Platform
                </span>
              </h1>

              <p className="text-muted-foreground dark:text-gray-300 text-sm leading-relaxed mb-6 max-w-sm">
                Revolutionize education with our intelligent tools for students, teachers, and administrators.
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => roleRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
                  className="group bg-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 shadow-md flex items-center gap-2 dark:shadow-primary/30"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <button
                  onClick={() => navigate("/features")}
                  className="bg-white/70 dark:bg-white/10 border border-border/60 dark:border-white/15 backdrop-blur-sm px-8 py-3 rounded-xl font-semibold text-sm text-foreground dark:text-slate-100 hover:bg-card/90 dark:hover:bg-white/15 transition-all duration-300"
                >
                  Learn More
                </button>
              </div>
            </div>

            <div className="flex-1 flex justify-end relative z-10">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent rounded-full blur-3xl scale-125" />
                
                {/* Desktop AI Tutor badge */}
                <div className="absolute left-[-86px] top-[46px] z-20 rounded-2xl border border-border/60 dark:border-white/15 bg-white/90 dark:bg-[#111827]/90 px-3 py-2 shadow-lg backdrop-blur-md animate-float">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-white">
                      <Zap className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-foreground dark:text-slate-100 leading-none">AI Tutor</p>
                      <p className="mt-1 text-xs text-muted-foreground dark:text-slate-300 leading-none">Always Active</p>
                    </div>
                  </div>
                </div>

                {/* Desktop Results badge */}
                <div className="absolute right-[-78px] bottom-[34px] z-20 rounded-2xl border border-border/60 dark:border-white/15 bg-white/90 dark:bg-[#111827]/90 px-3 py-2 shadow-lg backdrop-blur-md animate-float" style={{ animationDelay: "1s" }}>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-white">
                      <TrendingUp className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-foreground dark:text-slate-100 leading-none">+45%</p>
                      <p className="mt-1 text-xs text-muted-foreground dark:text-slate-300 leading-none">Better Results</p>
                    </div>
                  </div>
                </div>

                {/* Desktop 24/7 Support badge */}
                <div className="absolute left-[-70px] bottom-[100px] z-20 rounded-2xl border border-border/60 dark:border-white/15 bg-white/90 dark:bg-[#111827]/90 px-3 py-2 shadow-lg backdrop-blur-md animate-float" style={{ animationDelay: "2s" }}>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white">
                      <Clock className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-foreground dark:text-slate-100 leading-none">24/7</p>
                      <p className="mt-1 text-xs text-muted-foreground dark:text-slate-300 leading-none">Support</p>
                    </div>
                  </div>
                </div>

                {/* Desktop Expert Teachers badge */}
                <div className="absolute right-[-70px] top-[80px] z-20 rounded-2xl border border-border/60 dark:border-white/15 bg-white/90 dark:bg-[#111827]/90 px-3 py-2 shadow-lg backdrop-blur-md animate-float" style={{ animationDelay: "3s" }}>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-600 text-white">
                      <Award className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-foreground dark:text-slate-100 leading-none">Expert</p>
                      <p className="mt-1 text-xs text-muted-foreground dark:text-slate-300 leading-none">Teachers</p>
                    </div>
                  </div>
                </div>

                <img
                  src={studentHero}
                  alt="Student with books"
                  className="h-[340px] w-auto object-contain drop-shadow-2xl dark:drop-shadow-[0_20px_40px_rgba(0,0,0,0.45)] relative z-10"
                  width={600}
                  height={900}
                />
              </div>
            </div>
          </div>

          <div ref={roleRef} className="grid grid-cols-3 gap-2 md:gap-5 mt-3 md:mt-3 relative z-20">
            {roles.map((card, idx) => (
              <motion.button
                key={card.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.08 }}
                onClick={() => navigate(`/auth/${card.key}`)}
                className="rounded-xl p-3 bg-white/75 dark:bg-white/10 backdrop-blur-md border border-border/60 dark:border-white/20 hover:shadow-xl dark:hover:shadow-white/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer group text-left md:rounded-2xl md:p-5"
              >
                {/* Mobile tag */}
                <div className="inline-flex items-center rounded-full border border-border/60 dark:border-white/15 bg-muted/50 dark:bg-white/10 px-1.5 py-0.5 text-[8px] text-muted-foreground dark:text-slate-300 mb-2 md:text-[10px] md:mb-3">
                  {card.tag}
                </div>
                {/* Desktop tag */}
                <div className="hidden md:inline-flex items-center rounded-full border border-border/60 dark:border-white/15 bg-muted/50 dark:bg-white/10 px-2 py-0.5 text-[10px] text-muted-foreground dark:text-slate-300 mb-3">
                  {card.tag}
                </div>
                <div className="flex items-center gap-1.5 mb-1 md:gap-3 md:mb-3">
                  <div className={`w-7 h-7 rounded-lg ${card.iconClass} flex items-center justify-center text-white shadow-md md:w-10 md:h-10 md:rounded-xl`}>
                    <card.icon className="w-3.5 h-3.5 md:w-5 md:h-5" />
                  </div>
                </div>
                <h3 className="text-xs font-bold text-card-foreground dark:text-white md:text-base">{card.title}</h3>
                <p className="hidden md:block text-muted-foreground dark:text-gray-300 text-xs mb-3 leading-relaxed">{card.desc}</p>
                <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-card-foreground dark:text-white md:text-xs">
                  Continue
                  <span className="w-5 h-5 rounded-full bg-muted/70 dark:bg-white/10 group-hover:bg-foreground group-hover:text-background dark:group-hover:bg-slate-100 dark:group-hover:text-slate-900 inline-flex items-center justify-center transition md:w-7 md:h-7">
                    <ArrowRight className="w-2.5 h-2.5 md:w-3.5 md:h-3.5" />
                  </span>
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-20 border-t border-border/40 dark:border-white/20 shrink-0 bg-white/55 dark:bg-black/50 backdrop-blur-md">
        <div className="container mx-auto px-10 md:px-16 grid grid-cols-3 divide-x divide-border/40 dark:border-white/20 text-center py-2.5 md:py-3.5">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center">
              <span className="text-lg md:text-xl font-bold text-foreground dark:text-white">
                {stat.value}{" "}
                <span className="font-normal text-muted-foreground dark:text-gray-300 text-xs md:text-sm">{stat.label}</span>
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
