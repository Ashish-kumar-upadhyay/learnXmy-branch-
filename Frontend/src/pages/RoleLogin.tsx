import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE, setTokens } from "@/lib/backendApi";
import { useRateLimit } from "@/hooks/useRateLimit";
import {
  GraduationCap, Mail, Lock, Eye, EyeOff, User, ArrowLeft,
  School, ShieldCheck, Zap, Sparkles, Clock, Hash,
  BookOpen, Award, Target, Lightbulb, Star,
  ArrowRight, TrendingUp, Users, Brain,
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
  const loginFormRef = useRef<HTMLDivElement>(null);
  const demoLoginInProgress = useRef(false);
  const { 
    rateLimitState, 
    checkRateLimit, 
    recordAttempt, 
    scheduleRetry, 
    cleanup 
  } = useRateLimit();
  const handleGetStartedClick = () => {
    setIsLogin(true);
    setHighlightInputs(true);
    if (loginFormRef.current) {
      loginFormRef.current.scrollIntoView({ behavior: "smooth" });
    }
    // Remove highlight after 3 seconds
    setTimeout(() => setHighlightInputs(false), 3000);
  };
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [studentLoginId, setStudentLoginId] = useState("");
  const [teacherLoginCode, setTeacherLoginCode] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [waitingApproval, setWaitingApproval] = useState(false);
  const [highlightInputs, setHighlightInputs] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Cleanup rate limit timers on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const handleDemoLogin = async (demoEmail: string, demoPassword: string) => {
    // Prevent multiple submissions immediately using ref
    if (demoLoginInProgress.current || isSubmitting || demoLoading) {
      return;
    }

    // Check rate limit before proceeding
    const rateCheck = checkRateLimit();
    if (!rateCheck.allowed) {
      const waitMinutes = Math.ceil((rateCheck.waitTime || 0) / 1000 / 60);
      toast.error(`Rate limit exceeded. Please wait ${waitMinutes} minute${waitMinutes > 1 ? 's' : ''} before trying demo login.`);
      return;
    }

    demoLoginInProgress.current = true;
    setIsSubmitting(true);
    setDemoLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: demoEmail, password: demoPassword }),
      });
      const json = await res.json().catch(() => null);
      
      if (!res.ok || !json?.data) {
        const errorMessage = json?.message || json?.errors?.[0] || "Demo login failed";
        
        // Handle specific rate limit errors
        if (res.status === 429) {
          const retryAfter = res.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
          const waitMinutes = Math.ceil(waitTime / 1000 / 60);
          toast.error(`Rate limit exceeded. Please wait ${waitMinutes} minute${waitMinutes > 1 ? 's' : ''} before trying again.`);
          recordAttempt(false);
          throw new Error(errorMessage);
        }
        
        recordAttempt(false);
        throw new Error(errorMessage);
      }

      // Success - reset rate limit
      recordAttempt(true);
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
      demoLoginInProgress.current = false;
      setDemoLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isSubmitting || loading) {
      return;
    }
    
    // Check rate limit before proceeding
    const rateCheck = checkRateLimit();
    if (!rateCheck.allowed) {
      const waitMinutes = Math.ceil((rateCheck.waitTime || 0) / 1000 / 60);
      toast.error(`Too many attempts. Please wait ${waitMinutes} minute${waitMinutes > 1 ? 's' : ''} before trying again.`);
      return;
    }

    setIsSubmitting(true);
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
        
        if (!res.ok || !json?.data) {
          const errorMessage = json?.message || "Login failed";
          
          // Handle specific rate limit errors
          if (res.status === 429) {
            const retryAfter = res.headers.get('Retry-After');
            const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
            const waitMinutes = Math.ceil(waitTime / 1000 / 60);
            toast.error(`Rate limit exceeded. Please wait ${waitMinutes} minute${waitMinutes > 1 ? 's' : ''} before trying again.`);
            recordAttempt(false);
            throw new Error(errorMessage);
          }
          
          recordAttempt(false);
          throw new Error(errorMessage);
        }

        // Success - reset rate limit
        recordAttempt(true);
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
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background transition-colors duration-500">
      {/* Theme toggle */}
      <div className="fixed top-5 right-5 z-50">
        <ThemeToggle />
      </div>

      {/* ===== LEFT SIDE - Illustration ===== */}
      <div
        // initial={{ opacity: 0, x: -40 }}
        // animate={{ opacity: 1, x: 0 }}
        // transition={{ duration: 0.7, ease: "easeOut" }}
        className="hidden lg:flex w-[42%] relative overflow-hidden items-center justify-center"
        style={{ background: config.bgGradient }}
      >
        {/* Floating glass shapes with enhanced animations */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Main floating elements with enhanced 3D effects */}
          <div
            // animate={{ 
            //   y: [0, -30, 0], 
            //   rotate: [0, 10, 0], 
            //   scale: [1, 1.1, 1],
            //   z: [0, 50, 0]
            // }}
            // transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[10%] left-[8%] w-36 h-36 rounded-3xl border border-white/15 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md shadow-2xl"
            style={{ 
              transform: "rotate(15deg)",
              transformStyle: "preserve-3d",
              perspective: "1000px"
            }}
          >
            <div className="absolute inset-2 rounded-2xl bg-gradient-to-br from-primary/20 to-transparent" />
            {/* Inner 3D layer */}
            <div
              // animate={{ rotateY: [0, 360] }}
              // transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-4 rounded-xl bg-gradient-to-br from-white/5 to-transparent backdrop-blur-sm"
              style={{ transformStyle: "preserve-3d" }}
            />
          </div>
          
          <div
            // animate={{ y: [0, 25, 0], rotate: [0, -8, 0], x: [0, -10, 0] }}
            // transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            className="absolute bottom-[25%] right-[12%] w-28 h-28 rounded-2xl border border-white/15 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md shadow-2xl"
            style={{ transform: "rotate(-12deg)" }}
          >
            <div className="absolute inset-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-transparent" />
          </div>
          
          <div
            // animate={{ y: [0, 15, 0], x: [0, 8, 0], scale: [1, 0.9, 1] }}
            // transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 3 }}
            className="absolute top-[50%] left-[20%] w-24 h-24 rounded-2xl border border-white/15 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md shadow-2xl"
          >
            <div className="absolute inset-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-transparent" />
          </div>
          
          {/* Small decorative elements */}
          <div
            // animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }}
            // transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-[15%] right-[25%] w-8 h-8 rounded-full bg-gradient-to-r from-primary/30 to-violet-500/30 backdrop-blur-sm"
          />
          <div
            // animate={{ rotate: [0, -360], opacity: [0.3, 0.8, 0.3] }}
            // transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[35%] left-[30%] w-6 h-6 rounded-full bg-gradient-to-r from-amber-500/40 to-orange-500/40 backdrop-blur-sm"
          />
          <div
            // animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
            // transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[60%] right-[35%] w-4 h-4 rounded-full bg-gradient-to-r from-rose-500/50 to-pink-500/50 backdrop-blur-sm"
          />

          {/* Enhanced blur circles with gradients */}
          <div
            // animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
            // transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[20%] right-[15%] w-56 h-56 rounded-full blur-[100px]"
            style={{ 
              background: `radial-gradient(circle, ${config.glowColor}, transparent)`,
            }}
          />
          <div
            // animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            // transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-[25%] left-[10%] w-44 h-44 rounded-full blur-[80px]"
            style={{ 
              background: `radial-gradient(circle, ${config.glowColor}, transparent)`,
            }}
          />
          <div
            // animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.5, 0.2] }}
            // transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
            className="absolute top-[45%] left-[40%] w-32 h-32 rounded-full blur-[60px]"
            style={{ 
              background: `radial-gradient(circle, ${config.glowColor}, transparent)`,
            }}
          />
        </div>

        {/* Center content with enhanced animations */}
        <div className="relative z-10 text-center px-12">
          {/* Enhanced particle system with dynamic movements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                // initial={{ opacity: 0, scale: 0 }}
                // animate={{ 
                //   opacity: [0, 0.8, 0],
                //   scale: [0, 1, 0],
                //   y: [0, -30, -60],
                //   x: [0, Math.sin(i) * 20, Math.sin(i) * 40],
                //   rotate: [0, 180, 360]
                // }}
                // transition={{ 
                //   duration: 4 + Math.random() * 2,
                //   repeat: Infinity,
                //   ease: "easeOut",
                //   delay: i * 0.3
                // }}
                className="absolute rounded-full"
                style={{
                  left: `${15 + i * 7}%`,
                  top: `${25 + (i % 3) * 20}%`,
                  width: `${2 + Math.random() * 4}px`,
                  height: `${2 + Math.random() * 4}px`,
                  background: `radial-gradient(circle, ${config.glowColor}, transparent)`,
                  filter: 'blur(0.5px)'
                }}
              />
            ))}
            
            {/* Orbital particles */}
            {[...Array(6)].map((_, i) => (
              <div
                key={`orbital-${i}`}
                // animate={{
                //   rotate: [0, 360],
                // }}
                // transition={{
                //   duration: 15 + i * 2,
                //   repeat: Infinity,
                //   ease: "linear"
                // }}
                className="absolute top-1/2 left-1/2 w-px h-px"
                style={{
                  transformOrigin: `${-100 + i * 40}px center`
                }}
              >
                <div
                  // animate={{
                  //   scale: [0.5, 1.5, 0.5],
                  //   opacity: [0.3, 1, 0.3]
                  // }}
                  // transition={{
                  //   duration: 2,
                  //   repeat: Infinity,
                  //   ease: "easeInOut"
                  // }}
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: config.glowColor,
                    filter: 'blur(0.3px)'
                  }}
                />
              </div>
            ))}
          </div>
          
          {/* Glowing icon with enhanced 3D effects */}
          <div
            // initial={{ scale: 0.6, opacity: 0, rotate: -10 }}
            // animate={{ scale: 1, opacity: 1, rotate: 0 }}
            // transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative mx-auto mb-10"
            style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
          >
            {/* Enhanced rotating rings with 3D depth */}
            <div
              // animate={{ rotateX: [0, 360], rotateY: [0, 360] }}
              // transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 w-36 h-36 mx-auto rounded-3xl"
              style={{ 
                background: `conic-gradient(from 0deg, transparent, ${config.glowColor}, transparent)`,
                filter: 'blur(1px)',
                transformStyle: "preserve-3d"
              }}
            />
            <div
              // animate={{ rotateX: [360, 0], rotateZ: [0, 360] }}
              // transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 w-32 h-32 mx-auto rounded-2xl"
              style={{ 
                background: `conic-gradient(from 180deg, transparent, ${config.glowColor}, transparent)`,
                filter: 'blur(0.8px)',
                transformStyle: "preserve-3d"
              }}
            />
            
            {/* Enhanced pulsing glow with multiple layers */}
            <div
              // animate={{ 
              //   scale: [1, 1.4, 1],
              //   opacity: [0.3, 0.8, 0.3],
              //   rotate: [0, 180, 360]
              // }}
              // transition={{ 
              //   duration: 4,
              //   repeat: Infinity,
              //   ease: "easeInOut"
              // }}
              className="absolute inset-0 w-32 h-32 mx-auto rounded-3xl blur-xl"
              style={{ 
                background: config.gradient,
                transformStyle: "preserve-3d"
              }}
            />
            <div
              // animate={{ 
              //   scale: [1.2, 1.6, 1.2],
              //   opacity: [0.2, 0.5, 0.2]
              // }}
              // transition={{ 
              //   duration: 6,
              //   repeat: Infinity,
              //   ease: "easeInOut",
              //   delay: 2
              // }}
              className="absolute inset-0 w-36 h-36 mx-auto rounded-3xl blur-2xl"
              style={{ 
                background: config.gradient,
                transformStyle: "preserve-3d"
              }}
            />
            
            {/* Main icon container with 3D hover effects */}
            <div
              // whileHover={{ 
              //   rotateY: 15,
              //   rotateX: -15,
              //   scale: 1.05,
              //   z: 50
              // }}
              // transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative w-32 h-32 mx-auto rounded-3xl flex items-center justify-center border-2 border-white/30 backdrop-blur-md shadow-2xl cursor-pointer"
              style={{ 
                background: config.gradient,
                transformStyle: "preserve-3d"
              }}
            >
              <div
                // animate={{ 
                //   scale: [1, 1.15, 1],
                //   opacity: [0.6, 1, 0.6],
                //   rotate: [0, 5, -5, 0]
                // }}
                // transition={{ 
                //   duration: 3,
                //   repeat: Infinity,
                //   ease: "easeInOut"
                // }}
                className="absolute inset-2 rounded-2xl bg-gradient-to-br from-white/20 to-transparent"
                style={{ transformStyle: "preserve-3d" }}
              />
              
              <div
                // animate={{ rotate: [0, 8, -8, 0], y: [0, -2, 0] }}
                // transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10"
                style={{ transformStyle: "preserve-3d" }}
              >
                <RoleIcon className="w-16 h-16 text-white drop-shadow-2xl" />
                {/* Icon glow effect */}
                <div
                  // animate={{ opacity: [0.5, 1, 0.5] }}
                  // transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 blur-xl"
                  style={{ background: config.glowColor }}
                />
              </div>
            </div>
          </div>

          {/* Enhanced heading with staggered animation */}
          <div
            // initial={{ opacity: 0, y: 40 }}
            // animate={{ opacity: 1, y: 0 }}
            // transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
          >
            <h2
              // initial={{ opacity: 0, scale: 0.8 }}
              // animate={{ opacity: 1, scale: 1 }}
              // transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
              className="text-5xl font-black bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent tracking-tight mb-4 leading-tight"
            >
              {config.heading}
            </h2>
            
            {/* Animated underline */}
            <div
              // initial={{ width: 0 }}
              // animate={{ width: "100%" }}
              // transition={{ delay: 1.2, duration: 0.8, ease: "easeOut" }}
              className="h-1 mx-auto mb-4 rounded-full bg-gradient-to-r from-primary via-violet-500 to-primary"
              style={{ maxWidth: "200px" }}
            />
            
            <p
              // initial={{ opacity: 0, y: 20 }}
              // animate={{ opacity: 1, y: 0 }}
              // transition={{ delay: 1.4, duration: 0.6, ease: "easeOut" }}
              className="text-muted-foreground text-xl leading-relaxed font-medium"
            >
              {config.subheading}
            </p>
          </div>

          {/* Enhanced floating elements */}
          <div className="mt-12 space-y-4">
            {/* Feature badges */}
            <div
              // initial={{ opacity: 0, x: -30 }}
              // animate={{ opacity: 1, x: 0 }}
              // transition={{ delay: 1.8, duration: 0.6, ease: "easeOut" }}
              className="flex flex-wrap justify-center gap-3"
            >
              {[
                { icon: BookOpen, label: "Smart Learning", color: "from-blue-500 to-cyan-500" },
                { icon: Award, label: "Certified Courses", color: "from-amber-500 to-orange-500" },
                { icon: Target, label: "Goal Oriented", color: "from-emerald-500 to-teal-500" },
                { icon: Users, label: "Community Driven", color: "from-violet-500 to-purple-500" },
              ].map((feature, index) => (
                <div
                  key={feature.label}
                  // initial={{ opacity: 0, scale: 0.8 }}
                  // animate={{ opacity: 1, scale: 1 }}
                  // transition={{ delay: 2.0 + index * 0.1, duration: 0.5, ease: "easeOut" }}
                  // whileHover={{ scale: 1.05, y: -2 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm shadow-lg"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${feature.color}`}>
                    <feature.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-medium text-foreground/90">{feature.label}</span>
                </div>
              ))}
            </div>
            
                      </div>
        </div>

        {/* Back button */}
        <button
          onClick={() => navigate("/auth")}
          className="absolute top-6 left-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group z-10"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back
        </button>
      </div>

      {/* ===== RIGHT SIDE - Login Form ===== */}
      <div
        // initial={{ opacity: 0, x: 40 }}
        // animate={{ opacity: 1, x: 0 }}
        // transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
        className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-10 relative"
        ref={loginFormRef}
      >
        {/* Mobile back button with enhanced styling */}
        <button
          onClick={() => navigate("/auth")}
          className="lg:hidden absolute top-4 left-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-all duration-300 group p-2 rounded-lg hover:bg-muted/50"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back
        </button>

        <div className="w-full max-w-[380px] sm:max-w-[420px]">
          {waitingApproval ? (
            <div 
              // initial={{ opacity: 0, scale: 0.95 }} 
              // animate={{ opacity: 1, scale: 1 }} 
              className="text-center"
            >
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
            </div>
          ) : (
          <>
          {/* Header */}
          <div 
            // initial={{ opacity: 0, y: -20 }}
            // animate={{ opacity: 1, y: 0 }}
            // transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center mb-8 animate-fadeInUp"
          >
            <div
              // initial={{ scale: 0.8, opacity: 0 }}
              // animate={{ scale: 1, opacity: 1 }}
              // transition={{ duration: 0.5, delay: 0.2 }}
              className="relative inline-block"
            >
              <div
                className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg"
                style={{ background: config.gradient }}
              >
                <RoleIcon className="w-6 h-6 text-white" />
              </div>
              {/* Glow effect */}
              <div
                className="absolute inset-0 w-12 h-12 rounded-xl mx-auto -z-10"
                style={{ 
                  background: config.gradient,
                  filter: 'blur(12px)',
                  opacity: 0.6
                }}
                // animate={{ 
                //   scale: [1, 1.2, 1],
                //   opacity: [0.6, 0.3, 0.6]
                // }}
                // transition={{ 
                //   duration: 3,
                //   repeat: Infinity,
                //   ease: "easeInOut"
                // }}
              />
            </div>
            <h1 
              // initial={{ opacity: 0, y: 10 }}
              // animate={{ opacity: 1, y: 0 }}
              // transition={{ duration: 0.5, delay: 0.3 }}
              className="text-2xl font-extrabold text-foreground tracking-tight"
            >
              {isLogin ? `${config.label} Sign In` : `Create ${config.label} Account`}
            </h1>
            <p 
              // initial={{ opacity: 0, y: 10 }}
              // animate={{ opacity: 1, y: 0 }}
              // transition={{ duration: 0.5, delay: 0.4 }}
              className="text-muted-foreground text-sm mt-1.5"
            >
              {isLogin
                ? validRole === "student"
                  ? "Sign in with your Student ID and password"
                  : validRole === "teacher"
                    ? "Sign in with your Teacher code and password"
                    : "Enter your credentials to continue"
                : "Fill in your details to get started"}
            </p>
          </div>

          {/* Login Card with premium glassmorphism - Mobile optimized */}
          <div 
            // initial={{ opacity: 0, y: 20 }}
            // animate={{ opacity: 1, y: 0 }}
            // transition={{ duration: 0.6, delay: 0.2 }}
            className="relative glass-card-3d p-5 sm:p-8 animate-fadeInUp"
            style={{
              background: 'linear-gradient(145deg, hsl(var(--card)), hsl(var(--background)), hsl(var(--muted) / 0.3))',
              backdropFilter: 'blur(20px)',
              border: '1px solid hsl(var(--border) / 0.6)',
              boxShadow: '0 8px 32px hsl(var(--foreground) / 0.1), 0 4px 16px hsl(var(--foreground) / 0.05), inset 0 1px 0 hsl(255 255 255 / 0.1)'
            }}
          >
            {/* Card top gradient line */}
            <div 
              // initial={{ width: 0 }}
              // animate={{ width: "100%" }}
              // transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
              className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
              style={{ background: config.gradient }}
            />
            
            {/* Subtle background pattern */}
            <div className="absolute inset-0 rounded-xl opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 25% 25%, ${config.glowColor} 0%, transparent 50%), radial-gradient(circle at 75% 75%, ${config.glowColor} 0%, transparent 50%)`,
                backgroundSize: '20px 20px'
              }} />
            </div>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {!isLogin && (
                <div
                  // initial={{ opacity: 0, x: -20 }}
                  // animate={{ opacity: 1, x: 0 }}
                  // transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block font-medium">
                    Full Name
                  </label>
                  <div className="relative group">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-all duration-300 group-focus-within:text-primary group-focus-within:scale-110" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                      required={!isLogin}
                      autoComplete="off"
                      autoCorrect="off"
                      className="input-premium-glass w-full pl-10 pr-4 py-3 rounded-xl text-sm text-foreground placeholder:text-muted-foreground transition-all duration-300"
                      // whileFocus={{ scale: 1.02 }}
                      style={{
                        background: 'hsl(var(--muted) / 0.3)',
                        border: '1px solid hsl(var(--border) / 0.5)',
                        backdropFilter: 'blur(10px)'
                      }}
                    />
                    {/* Enhanced focus ring */}
                    <div className="absolute inset-0 rounded-xl pointer-events-none">
                      <div 
                        className="absolute inset-0 rounded-xl border-2 border-primary/20"
                        // initial={{ opacity: 0, scale: 0.95 }}
                        // whileFocus={{ opacity: 1, scale: 1 }}
                        // transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {isLogin && validRole === "student" ? (
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block font-medium">
                    Student ID
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-all duration-300 focus-within:text-primary focus-within:scale-110" />
                    <input
                      type="text"
                      value={studentLoginId}
                      onChange={(e) => setStudentLoginId(e.target.value.toUpperCase())}
                      placeholder="e.g. STU2026123456"
                      required
                      autoComplete="off"
                      autoCorrect="off"
                      className="input-premium-glass w-full pl-10 pr-4 py-3 rounded-xl text-sm text-foreground placeholder:text-muted-foreground transition-all duration-200 font-mono tracking-wide"
                      style={{
                        background: 'hsl(var(--muted) / 0.3)',
                        border: '1px solid hsl(var(--border) / 0.5)',
                        backdropFilter: 'blur(10px)'
                      }}
                      // whileFocus={{ scale: 1.02 }}
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
                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-all duration-300 focus-within:text-primary focus-within:scale-110" />
                    <input
                      type="text"
                      value={teacherLoginCode}
                      onChange={(e) => setTeacherLoginCode(e.target.value.toUpperCase())}
                      placeholder="e.g. TCH2026123456"
                      required
                      autoComplete="off"
                      autoCorrect="off"
                      className="input-premium-glass w-full pl-10 pr-4 py-3 rounded-xl text-sm text-foreground placeholder:text-muted-foreground transition-all duration-200 font-mono tracking-wide"
                      style={{
                        background: 'hsl(var(--muted) / 0.3)',
                        border: '1px solid hsl(var(--border) / 0.5)',
                        backdropFilter: 'blur(10px)'
                      }}
                      // whileFocus={{ scale: 1.02 }}
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
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-all duration-300 focus-within:text-primary focus-within:scale-110" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      autoComplete="off"
                      autoCorrect="off"
                      className={`input-premium-glass w-full pl-10 pr-4 py-3 rounded-xl text-sm text-foreground placeholder:text-muted-foreground transition-all duration-200 ${highlightInputs ? 'ring-4 ring-primary/50 border-primary/50 bg-primary/10 scale-[1.02]' : ''}`}
                      style={{
                        background: 'hsl(var(--muted) / 0.3)',
                        border: '1px solid hsl(var(--border) / 0.5)',
                        backdropFilter: 'blur(10px)'
                      }}
                      // whileFocus={{ scale: 1.02 }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block font-medium">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-all duration-300 focus-within:text-primary focus-within:scale-110" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    autoComplete="off"
                    autoCorrect="off"
                    className={`input-premium-glass w-full pl-10 pr-11 py-3 rounded-xl text-sm text-foreground placeholder:text-muted-foreground transition-all duration-200 ${highlightInputs ? 'ring-4 ring-primary/50 border-primary/50 bg-primary/10 scale-[1.02]' : ''}`}
                    style={{
                      background: 'hsl(var(--muted) / 0.3)',
                      border: '1px solid hsl(var(--border) / 0.5)',
                      backdropFilter: 'blur(10px)'
                    }}
                    // whileFocus={{ scale: 1.02 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-110"
                    // whileHover={{ scale: 1.1 }}
                    // whileTap={{ scale: 0.9 }}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {rateLimitState.isBlocked && (
                <div className="rounded-2xl border border-red-200/50 dark:border-red-800/30 bg-red-50 dark:bg-red-950/20 p-4 mb-4">
                  <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-400 font-medium">
                    <Clock className="w-4 h-4" />
                    Too many attempts. Please wait before trying again.
                  </div>
                </div>
              )}

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

              <button
                type="submit"
                disabled={loading || isSubmitting || rateLimitState.isBlocked}
                className="btn-premium-3d w-full py-3 sm:py-3.5 rounded-xl font-semibold text-sm relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  background: config.gradient,
                  boxShadow: '0 4px 20px hsl(var(--primary) / 0.4), 0 2px 8px hsl(var(--primary) / 0.2)'
                }}
                // whileHover={{ 
                //   scale: 1.02, 
                //   y: -2,
                //   boxShadow: '0 8px 30px hsl(var(--primary) / 0.5), 0 4px 12px hsl(var(--primary) / 0.3)'
                // }}
                // whileTap={{ scale: 0.98, y: 0 }}
                // transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {/* Button shimmer effect */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    backgroundSize: '200% 100%'
                  }}
                  // animate={{
                  //   backgroundPosition: ['200% 0', '-200% 0']
                  // }}
                  // transition={{
                  //   duration: 1.5,
                  //   repeat: Infinity,
                  //   ease: "linear"
                  // }}
                />
                
                {/* Button inner glow */}
                <div className="absolute inset-0 rounded-xl" style={{
                  background: 'radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 70%)',
                  opacity: 0.6
                }} />
                
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div
                        // animate={{ rotate: 360 }}
                        // transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                      <span className="flex items-center gap-2">
                        <span className="animate-pulse">⏳</span>
                        Please wait...
                      </span>
                    </>
                  ) : isLogin ? "Sign In" : "Create Account"}
                </span>
                
                {/* Hover border glow */}
                <div
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    border: '1px solid rgba(255,255,255,0.3)',
                    filter: 'blur(0.5px)'
                  }}
                />
              </button>
            </form>

          </div>

          {/* Enhanced Demo Accounts - Mobile optimized */}
          <div
            // initial={{ opacity: 0, y: 16 }}
            // animate={{ opacity: 1, y: 0 }}
            // transition={{ delay: 0.5, duration: 0.4 }}
            className="glass-card-3d mt-5 sm:mt-6 p-4 sm:p-5 animate-slideInRight"
            style={{
              background: 'linear-gradient(145deg, hsl(var(--card)), hsl(var(--muted) / 0.2))',
              backdropFilter: 'blur(16px)',
              border: '1px solid hsl(var(--border) / 0.4)',
              boxShadow: '0 4px 20px hsl(var(--foreground) / 0.08)'
            }}
          >
            {/* Section header with enhanced styling */}
            <div className="flex items-center gap-2 mb-4">
              <div
                // animate={{ rotate: [0, 10, -10, 0] }}
                // transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className={`p-1.5 rounded-lg ${rateLimitState.isBlocked ? 'bg-red-500' : ''}`}
                style={{ 
                  background: rateLimitState.isBlocked 
                    ? 'linear-gradient(135deg, hsl(var(--destructive)), hsl(var(--destructive) / 0.8))'
                    : 'linear-gradient(135deg, hsl(var(--warning)), hsl(var(--warning) / 0.8))' 
                }}
              >
                <Zap className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                {rateLimitState.isBlocked ? "Rate Limited" : "Quick Demo Access"}
              </h3>
            </div>
            
            {/* Rate limit warning for demo section */}
            {rateLimitState.isBlocked && (
              <div className="rounded-xl border border-red-200/50 dark:border-red-800/30 bg-red-50 dark:bg-red-950/20 p-3 mb-3">
                <div className="flex items-center gap-2 text-xs text-red-700 dark:text-red-400">
                  <Clock className="w-3 h-3" />
                  Too many attempts. Please wait before trying demo login.
                </div>
              </div>
            )}
            
            {/* Demo account cards */}
            <div className="space-y-3">
              {demoAccounts
                .filter((demo) => demo.role.toLowerCase() === validRole)
                .map((demo, index) => (
                <button
                  key={demo.role}
                  onClick={() => handleDemoLogin(demo.email, demo.password)}
                  disabled={demoLoginInProgress.current || demoLoading || isSubmitting || rateLimitState.isBlocked}
                  className="group w-full flex items-center gap-3 p-2.5 sm:p-3 rounded-xl border border-border/30 hover:border-primary/20 transition-all duration-300 text-left disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden touch-manipulation"
                  style={{
                    background: 'linear-gradient(145deg, hsl(var(--muted) / 0.3), hsl(var(--muted) / 0.1))',
                    backdropFilter: 'blur(8px)',
                    minHeight: '60px'
                  }}
                  // whileHover={{ 
                  //   scale: 1.02, 
                  //   x: 4,
                  //   boxShadow: '0 4px 20px hsl(var(--primary) / 0.1)'
                  // }}
                  // whileTap={{ scale: 0.98 }}
                  // initial={{ opacity: 0, x: -20 }}
                  // animate={{ opacity: 1, x: 0 }}
                  // transition={{ delay: 0.6 + index * 0.1, duration: 0.3 }}
                >
                  {/* Hover gradient overlay */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"
                    style={{
                      background: `linear-gradient(135deg, ${demo.gradient} / 0.1, transparent)`,
                    }}
                  />
                  
                  {/* Icon with enhanced styling */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg relative z-10"
                    style={{ background: demo.gradient }}
                    // whileHover={{ scale: 1.1, rotate: 5 }}
                    // transition={{ duration: 0.2 }}
                  >
                    <demo.icon className="w-5 h-5 text-white" />
                    {/* Icon glow */}
                    <div className="absolute inset-0 rounded-xl blur-md opacity-50" 
                      style={{ background: demo.gradient }} 
                    />
                  </div>
                  
                  {/* Text content */}
                  <div className="flex-1 min-w-0 relative z-10">
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                      {demo.role}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      {demo.role === "Student" || demo.role === "Teacher"
                        ? `${demo.email} (demo — email login)`
                        : demo.email}
                    </p>
                  </div>
                  
                  {/* Arrow indicator */}
                  <div
                    className="text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-1 relative z-10"
                    // initial={{ x: -10 }}
                    // whileHover={{ x: 0 }}
                  >
                    {demoLoading ? (
                      <>
                        <div
                          // animate={{ rotate: 360 }}
                          // transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full"
                        />
                        <span className="flex items-center gap-1">
                          <span className="animate-pulse">⏳</span>
                          Please wait...
                        </span>
                      </>
                    ) : (
                      <>
                        Login
                        <ArrowRight className="w-3 h-3" />
                      </>
                    )}
                  </div>
                  
                  {/* Subtle border animation */}
                  <div
                    className="absolute inset-0 rounded-xl border-2 border-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ borderStyle: 'dashed' }}
                  />
                </button>
              ))}
            </div>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
}
