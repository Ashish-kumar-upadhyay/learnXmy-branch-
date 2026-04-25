import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE, setTokens } from "@/lib/backendApi";
import {
  GraduationCap, Mail, Lock, Eye, EyeOff, User, ArrowLeft,
  School, ShieldCheck, Zap, Sparkles, Clock, Hash,
} from "lucide-react";
import { toast } from "sonner";
import ThemeToggle from "@/components/ThemeToggle";

const roleConfig = {
  student: {
    label: "Student",
    icon: GraduationCap,
    gradient: "linear-gradient(135deg, hsl(220 90% 56%), hsl(260 50% 58%))",
    bgGradient: "linear-gradient(135deg, hsl(220 90% 56% / 0.15), hsl(260 50% 58% / 0.08))",
    glowColor: "hsl(220 90% 56% / 0.4)",
    heading: "Ready to learn?",
    subheading: "Your campus journey starts here",
    demo: { email: "student@demo.com", password: "123456" },
  },
  teacher: {
    label: "Teacher",
    icon: School,
    gradient: "linear-gradient(135deg, hsl(260 50% 58%), hsl(190 80% 50%))",
    bgGradient: "linear-gradient(135deg, hsl(260 50% 58% / 0.15), hsl(190 80% 50% / 0.08))",
    glowColor: "hsl(260 50% 58% / 0.4)",
    heading: "Teacher Portal",
    subheading: "Manage your classes and students",
    demo: { email: "teacher@demo.com", password: "123456" },
  },
  admin: {
    label: "Admin",
    icon: ShieldCheck,
    gradient: "linear-gradient(135deg, hsl(0 72% 51%), hsl(38 92% 50%))",
    bgGradient: "linear-gradient(135deg, hsl(0 72% 51% / 0.15), hsl(38 92% 50% / 0.08))",
    glowColor: "hsl(0 72% 51% / 0.4)",
    heading: "System Control",
    subheading: "Full platform access",
    demo: { email: "admin@demo.com", password: "123456" },
  },
};

type RoleKey = "student" | "teacher" | "admin";

const demoAccounts = [
  { role: "Student", email: "student@demo.com", password: "123456", icon: GraduationCap, gradient: "linear-gradient(135deg, hsl(220 90% 56%), hsl(260 50% 58%))" },
  { role: "Teacher", email: "teacher@demo.com", password: "123456", icon: School, gradient: "linear-gradient(135deg, hsl(260 50% 58%), hsl(190 80% 50%))" },
  { role: "Admin", email: "admin@demo.com", password: "123456", icon: ShieldCheck, gradient: "linear-gradient(135deg, hsl(0 72% 51%), hsl(38 92% 50%))" },
];

export default function RoleLogin() {
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [studentLoginId, setStudentLoginId] = useState("");
  const [teacherLoginCode, setTeacherLoginCode] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [waitingApproval, setWaitingApproval] = useState(false);

  const validRole = (role && role in roleConfig ? role : "student") as RoleKey;
  const config = roleConfig[validRole];
  const RoleIcon = config.icon;

  // Clear all input fields when component mounts
  useEffect(() => {
    setEmail("");
    setStudentLoginId("");
    setTeacherLoginCode("");
    setPassword("");
    setFullName("");
  }, [role]);

  const handleDemoLogin = async (demoEmail: string, demoPassword: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: demoEmail, password: demoPassword }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.data) {
        throw new Error(json?.message || json?.errors?.[0] || "Demo login failed");
      }

      setTokens({ accessToken: json.data.accessToken, refreshToken: json.data.refreshToken });
      await refreshProfile();

      const roles = (json.data.user?.roles || []) as string[];
      toast.success("Welcome to LearnX! 🎉");
      if (roles.includes("admin")) navigate("/admin");
      else if (roles.includes("teacher")) navigate("/teacher");
      else navigate("/");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Demo login failed";
      if (msg.toLowerCase().includes("failed to fetch")) {
        toast.error(`Backend server unreachable. Ensure backend runs on ${API_BASE}`);
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const loginBody =
          validRole === "student"
            ? { studentId: studentLoginId.trim(), password }
            : validRole === "teacher"
              ? { teacherCode: teacherLoginCode.trim(), password }
              : { email: email.trim(), password };
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(loginBody),
        });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.data) throw new Error(json?.message || "Login failed");

        setTokens({ accessToken: json.data.accessToken, refreshToken: json.data.refreshToken });
        await refreshProfile();

        const roles = (json.data.user?.roles || []) as string[];
        toast.success("Welcome back!");
        if (roles.includes("admin")) navigate("/admin");
        else if (roles.includes("teacher")) navigate("/teacher");
        else navigate("/");
      } else {
        const registerPayload: Record<string, unknown> = {
          password,
          full_name: fullName,
          role: validRole,
          class_name: null,
        };
        if (validRole !== "student") {
          registerPayload.email = email.trim();
        } else if (email.trim()) {
          registerPayload.email = email.trim();
        }
        const res = await fetch(`${API_BASE}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(registerPayload),
        });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.data) throw new Error(json?.message || "Register failed");

        setTokens({ accessToken: json.data.accessToken, refreshToken: json.data.refreshToken });
        await refreshProfile();

        const roles = (json.data.user?.roles || []) as string[];
        const sid = json.data.user?.student_id as string | undefined;
        const tc = json.data.user?.teacher_code as string | undefined;
        if (validRole === "student" && sid) {
          toast.success(`Account created! Your Student ID: ${sid}`);
        } else if (validRole === "teacher" && tc) {
          toast.success(`Account created! Your Teacher code: ${tc} (use it to sign in)`);
        } else {
          toast.success("Account created!");
        }
        if (roles.includes("admin")) navigate("/admin");
        else if (roles.includes("teacher")) navigate("/teacher");
        else navigate("/");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Auth failed";
      if (msg.toLowerCase().includes("failed to fetch")) {
        toast.error("Backend server unreachable. Start backend and try again.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background transition-colors duration-500">
      {/* Theme toggle */}
      <div className="fixed top-5 right-5 z-50">
        <ThemeToggle />
      </div>

      {/* ===== LEFT SIDE - Illustration ===== */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="hidden lg:flex w-[42%] relative overflow-hidden items-center justify-center"
        style={{ background: config.bgGradient }}
      >
        {/* Floating glass shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[15%] left-[10%] w-32 h-32 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm"
            style={{ transform: "rotate(12deg)" }}
          />
          <motion.div
            animate={{ y: [0, 15, 0], rotate: [0, -3, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-[20%] right-[8%] w-24 h-24 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm"
            style={{ transform: "rotate(-8deg)" }}
          />
          <motion.div
            animate={{ y: [0, 10, 0], x: [0, -8, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute top-[55%] left-[18%] w-20 h-20 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm"
          />

          {/* Blur circles */}
          <div
            className="absolute top-[25%] right-[20%] w-48 h-48 rounded-full blur-[80px] opacity-60"
            style={{ background: config.glowColor }}
          />
          <div
            className="absolute bottom-[30%] left-[15%] w-36 h-36 rounded-full blur-[60px] opacity-40"
            style={{ background: config.glowColor }}
          />
        </div>

        {/* Center content */}
        <div className="relative z-10 text-center px-12">
          {/* Glowing icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative mx-auto mb-8"
          >
            <div
              className="absolute inset-0 w-28 h-28 mx-auto rounded-3xl blur-2xl opacity-50"
              style={{ background: config.gradient }}
            />
            <div
              className="relative w-28 h-28 mx-auto rounded-3xl flex items-center justify-center border border-white/20 backdrop-blur-sm"
              style={{ background: config.gradient }}
            >
              <RoleIcon className="w-14 h-14 text-white drop-shadow-lg" />
            </div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-4xl font-black text-foreground tracking-tight mb-3"
          >
            {config.heading}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.5 }}
            className="text-muted-foreground text-lg"
          >
            {config.subheading}
          </motion.p>

          {/* Floating badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.4 }}
            className="mt-10 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-card/50 backdrop-blur-sm text-sm text-muted-foreground"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            Powered by LearnX
          </motion.div>
        </div>

        {/* Back button */}
        <button
          onClick={() => navigate("/auth")}
          className="absolute top-6 left-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group z-10"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back
        </button>
      </motion.div>

      {/* ===== RIGHT SIDE - Login Form ===== */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
        className="flex-1 flex flex-col items-center justify-center px-6 py-10 relative"
      >
        {/* Mobile back button */}
        <button
          onClick={() => navigate("/auth")}
          className="lg:hidden absolute top-5 left-5 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back
        </button>

        <div className="w-full max-w-[420px]">
          {waitingApproval ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center bg-amber-100 dark:bg-amber-950/30">
                <Clock className="w-10 h-10 text-amber-500" />
              </div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight mb-2">Waiting for Approval</h1>
              <p className="text-muted-foreground text-sm mb-6">Your account has been created. Please wait for your teacher to approve your account before you can log in.</p>
              <div className="rounded-2xl border border-amber-200/50 dark:border-amber-800/30 bg-amber-50 dark:bg-amber-950/20 p-4 mb-6">
                <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">🔔 Your teacher will review and approve your account shortly.</p>
              </div>
              <button onClick={() => { setWaitingApproval(false); setIsLogin(true); }} className="text-sm text-primary hover:text-primary/80 font-semibold transition-colors">
                ← Back to Sign In
              </button>
            </motion.div>
          ) : (
          <>
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center mb-8 animate-fadeInUp"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative inline-block"
            >
              <div
                className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg"
                style={{ background: config.gradient }}
              >
                <RoleIcon className="w-6 h-6 text-white" />
              </div>
              {/* Glow effect */}
              <motion.div
                className="absolute inset-0 w-12 h-12 rounded-xl mx-auto -z-10"
                style={{ 
                  background: config.gradient,
                  filter: 'blur(12px)',
                  opacity: 0.6
                }}
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.6, 0.3, 0.6]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-2xl font-extrabold text-foreground tracking-tight"
            >
              {isLogin ? `${config.label} Sign In` : `Create ${config.label} Account`}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-muted-foreground text-sm mt-1.5"
            >
              {isLogin
                ? validRole === "student"
                  ? "Sign in with your Student ID and password"
                  : validRole === "teacher"
                    ? "Sign in with your Teacher code and password"
                    : "Enter your credentials to continue"
                : "Fill in your details to get started"}
            </motion.p>
          </motion.div>

          {/* Login Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass-card p-7 animate-fadeInUp"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block font-medium">
                    Full Name
                  </label>
                  <div className="relative group">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <motion.input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                      required={!isLogin}
                      autoComplete="off"
                      autoCorrect="off"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/30 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all duration-300 focus:scale-[1.02] focus:bg-white/50"
                      whileFocus={{ scale: 1.02 }}
                    />
                    {/* Focus ring effect */}
                    <div className="absolute inset-0 rounded-xl pointer-events-none">
                      <div className="absolute inset-0 rounded-xl border-2 border-primary/20 opacity-0 transition-opacity duration-300 group-focus-within:opacity-100" />
                    </div>
                  </div>
                </motion.div>
              )}

              {isLogin && validRole === "student" ? (
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block font-medium">
                    Student ID
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={studentLoginId}
                      onChange={(e) => setStudentLoginId(e.target.value.toUpperCase())}
                      placeholder="e.g. STU2026123456"
                      required
                      autoComplete="off"
                      autoCorrect="off"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/30 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all duration-200 font-mono tracking-wide"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    Your teacher or admin gave you this ID when they created your account.
                  </p>
                </div>
              ) : isLogin && validRole === "teacher" ? (
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block font-medium">
                    Teacher code
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={teacherLoginCode}
                      onChange={(e) => setTeacherLoginCode(e.target.value.toUpperCase())}
                      placeholder="e.g. TCH2026123456"
                      required
                      autoComplete="off"
                      autoCorrect="off"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/30 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all duration-200 font-mono tracking-wide"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    Your admin shared this code when your teacher account was created.
                  </p>
                </div>
              ) : (!isLogin && validRole === "student") ? null : (
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block font-medium">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      autoComplete="off"
                      autoCorrect="off"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/30 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all duration-200"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block font-medium">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    autoComplete="off"
                    autoCorrect="off"
                    className="w-full pl-10 pr-11 py-3 rounded-xl bg-muted/30 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all duration-200 focus:scale-[1.02] focus:bg-white/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isLogin && validRole !== "student" && validRole !== "teacher" && (
                <div className="flex items-center justify-end">
                  <Link
                    to="/forgot-password"
                    className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                className="btn-premium w-full py-3 rounded-xl font-semibold text-sm relative overflow-hidden group"
                style={{ background: config.gradient }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Loading...
                    </>
                  ) : isLogin ? "Sign In" : "Create Account"}
                </span>
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.button>
            </form>

          </motion.div>

          {/* Demo Accounts */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="glass-card-hover mt-6 p-5 animate-slideInRight"
          >
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-warning" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Quick Demo Access</h3>
            </div>
            <div className="space-y-2">
              {demoAccounts
                .filter((demo) => demo.role.toLowerCase() === validRole)
                .map((demo) => (
                <motion.button
                  key={demo.role}
                  onClick={() => handleDemoLogin(demo.email, demo.password)}
                  disabled={loading}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-muted/20 border border-border/30 hover:bg-muted/40 hover:border-primary/20 transition-all duration-200 text-left group disabled:opacity-50"
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
                    style={{ background: demo.gradient }}
                  >
                    <demo.icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">{demo.role}</p>
                    <p className="text-[11px] text-muted-foreground font-mono truncate">
                      {demo.role === "Student" || demo.role === "Teacher"
                        ? `${demo.email} (demo — email login)`
                        : demo.email}
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Login →
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
          </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
