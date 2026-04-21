import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  GraduationCap, Sparkles, Bot, BarChart3, ShieldCheck, Layers, 
  Zap, ArrowRight, Star, Users, BookOpen, Award, Clock, Target,
  CheckCircle, TrendingUp, Globe, Lightbulb, Rocket
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const featureItems = [
  {
    icon: Bot,
    title: "AI Learning Assistant",
    description: "Personalized suggestions, smart doubt-solving, and 24/7 guided support for learners.",
    details: ["Smart Content Recommendations", "Interactive Learning Paths", "Real-time Doubt Resolution"],
    color: "from-sky-500 to-blue-600",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description: "Track performance trends with visual dashboards for students, teachers, and admins.",
    details: ["Performance Metrics", "Progress Tracking", "Predictive Insights"],
    color: "from-violet-500 to-purple-600",
  },
  {
    icon: ShieldCheck,
    title: "Secure Role Access",
    description: "Role-based modules with safe auth flows and protected data access across the platform.",
    details: ["Multi-Role Authentication", "Data Encryption", "Access Control"],
    color: "from-pink-500 to-rose-600",
  },
  {
    icon: Layers,
    title: "Unified Workflow",
    description: "Assignments, attendance, communication, and reports in one consistent interface.",
    details: ["Integrated Tools", "Streamlined Processes", "Centralized Dashboard"],
    color: "from-emerald-500 to-cyan-600",
  },
];

const additionalFeatures = [
  { icon: Clock, title: "24/7 Availability", desc: "Access learning materials anytime, anywhere" },
  { icon: Users, title: "Collaborative Learning", desc: "Engage with peers and instructors in real-time" },
  { icon: Award, title: "Certification", desc: "Earn recognized certificates upon completion" },
  { icon: Globe, title: "Multi-Language", desc: "Support for multiple languages and regions" },
  { icon: Lightbulb, title: "Smart Recommendations", desc: "AI-powered course and content suggestions" },
  { icon: Rocket, title: "Fast Performance", desc: "Optimized for speed and reliability" }
];

const stats = [
  { value: "10K+", label: "Active Students", icon: Users },
  { value: "500+", label: "Courses Available", icon: BookOpen },
  { value: "99.9%", label: "Uptime", icon: TrendingUp },
  { value: "24/7", label: "Support", icon: Clock }
];

export default function Features() {
  const [activeTheme, setActiveTheme] = useState("default");
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<number | null>(null);

  const themes = {
    default: {
      primary: "hsl(220 90% 56%)",
      secondary: "hsl(260 50% 58%)",
      accent: "hsl(190 80% 50%)",
      bgGradient: "bg-gradient-to-br from-[#f7f9fc] via-background to-[#eef4ff] dark:from-[#0b1220] dark:via-[#0f172a] dark:to-[#111827]"
    },
    sunset: {
      primary: "hsl(15 90% 55%)",
      secondary: "hsl(45 93% 47%)",
      accent: "hsl(340 82% 52%)",
      bgGradient: "bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950 dark:via-amber-950 dark:to-yellow-950"
    },
    ocean: {
      primary: "hsl(200 84% 47%)",
      secondary: "hsl(180 84% 57%)",
      accent: "hsl(220 84% 67%)",
      bgGradient: "bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 dark:from-cyan-950 dark:via-blue-950 dark:to-indigo-950"
    }
  };

  const currentTheme = themes[activeTheme as keyof typeof themes];

  return (
    <div className={`min-h-screen ${currentTheme.bgGradient} relative overflow-hidden`}>
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Animated Background Elements */}
      <motion.div
        animate={{ y: [0, -40, 0], rotate: [0, 8, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] right-[-5%] w-[450px] h-[450px] rounded-full blur-[130px] pointer-events-none opacity-60"
        style={{ background: currentTheme.primary }}
      />
      <motion.div
        animate={{ y: [0, 25, 0], rotate: [0, -5, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-[-12%] left-[-8%] w-[380px] h-[380px] rounded-full blur-[110px] pointer-events-none opacity-40"
        style={{ background: currentTheme.secondary }}
      />
      <motion.div
        animate={{ y: [0, 20, 0], x: [0, -15, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute top-[35%] right-[20%] w-[250px] h-[250px] rounded-full blur-[90px] pointer-events-none opacity-30"
        style={{ background: currentTheme.accent }}
      />

      <div className="relative z-10 container mx-auto px-6 md:px-16 py-6">
        {/* Theme Customization Panel */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed top-20 right-4 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-md rounded-2xl border border-border/50 p-3 shadow-xl"
        >
          <p className="text-xs font-semibold text-muted-foreground mb-2 text-center">Theme</p>
          <div className="flex gap-2">
            {Object.keys(themes).map((theme) => (
              <motion.button
                key={theme}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTheme(theme)}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  activeTheme === theme ? 'border-foreground scale-110' : 'border-border'
                }`}
                style={{ background: themes[theme as keyof typeof themes].primary }}
              />
            ))}
          </div>
        </motion.div>

        <nav className="mb-12 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link to="/auth" className="flex items-center gap-2.5 group">
              <motion.div
                className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md"
                style={{ background: currentTheme.primary }}
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <GraduationCap className="w-5 h-5 text-white" />
              </motion.div>
              <span className="text-xl font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">
                LearnX
              </span>
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="hidden md:flex items-center gap-8"
          >
            {[
              { label: "Features", to: "/features" },
              { label: "About", to: "/about" },
              { label: "Contact", to: "/contact" }
            ].map((item, idx) => (
              <Link
                key={item.label}
                to={item.to}
                className={`text-sm transition-all hover:scale-105 ${
                  item.label === "Features" 
                    ? "font-semibold" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
                style={{
                  color: item.label === "Features" ? currentTheme.primary : undefined
                }}
              >
                {item.label}
              </Link>
            ))}
          </motion.div>
        </nav>

        {/* Hero Section */}
        <motion.header
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <motion.div
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-6 bg-white/70 dark:bg-black/70 backdrop-blur-sm border border-border/50"
            whileHover={{ scale: 1.05 }}
          >
            <Sparkles className="w-4 h-4" style={{ color: currentTheme.primary }} />
            <span className="text-sm font-medium text-muted-foreground">Powerful, modern, and scalable</span>
          </motion.div>
          <motion.h1
            className="text-5xl md:text-7xl font-black tracking-tight mb-6"
            style={{ color: currentTheme.primary }}
          >
            Features That Make Learning
            <span className="block">Engaging & Effective</span>
          </motion.h1>
          <motion.p
            className="text-xl text-muted-foreground max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            LearnX combines AI intelligence, streamlined tools, and clean workflows to improve outcomes for every role.
          </motion.p>
        </motion.header>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
        >
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              className="text-center p-6 rounded-2xl bg-white/70 dark:bg-black/70 backdrop-blur-md border border-border/50"
              whileHover={{ 
                scale: 1.05, 
                boxShadow: `0 10px 40px -10px ${currentTheme.primary}40`
              }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.div
                className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
                style={{ background: currentTheme.primary }}
                animate={{ 
                  rotate: [0, 360],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear", delay: idx * 2 }}
              >
                <stat.icon className="w-6 h-6 text-white" />
              </motion.div>
              <motion.div
                className="text-2xl font-bold text-foreground"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 + idx * 0.1, type: "spring", stiffness: 200 }}
              >
                {stat.value}
              </motion.div>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Features Grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold mb-8 text-center" style={{ color: currentTheme.primary }}>Core Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featureItems.map((feature, idx) => (
              <motion.div
                key={feature.title}
                className="rounded-3xl border border-border/50 bg-white/70 dark:bg-black/70 backdrop-blur-md p-8 relative overflow-hidden group cursor-pointer"
                whileHover={{ 
                  scale: 1.02, 
                  boxShadow: `0 20px 60px -20px ${currentTheme.primary}40`
                }}
                onHoverStart={() => setHoveredFeature(idx)}
                onHoverEnd={() => setHoveredFeature(null)}
                onClick={() => setSelectedFeature(selectedFeature === idx ? null : idx)}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {/* Animated Background Pattern */}
                <motion.div
                  className="absolute inset-0 opacity-5"
                  style={{ background: `repeating-linear-gradient(45deg, ${currentTheme.primary}, ${currentTheme.primary} 10px, transparent 10px, transparent 20px)` }}
                  animate={{ x: [0, 20, 0] }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                />
                
                <div className="relative z-10">
                  <motion.div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white shadow-lg mb-6`}
                    animate={{ 
                      rotate: hoveredFeature === idx ? 360 : 0,
                      scale: hoveredFeature === idx ? 1.1 : 1
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    <feature.icon className="w-8 h-8" />
                  </motion.div>
                  
                  <h3 className="text-2xl font-bold text-foreground mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground mb-4">{feature.description}</p>
                  
                  <AnimatePresence>
                    {(selectedFeature === idx || hoveredFeature === idx) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-2"
                      >
                        {feature.details.map((detail, detailIdx) => (
                          <motion.div
                            key={detailIdx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: detailIdx * 0.1 }}
                            className="flex items-center gap-2 text-sm text-muted-foreground"
                          >
                            <CheckCircle className="w-4 h-4" style={{ color: currentTheme.primary }} />
                            <span>{detail}</span>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <motion.div
                    className="flex items-center gap-2 text-sm font-medium mt-4"
                    style={{ color: currentTheme.primary }}
                    animate={{ x: selectedFeature === idx ? 5 : 0 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <span>{selectedFeature === idx ? "Show less" : "Learn more"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Additional Features */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold mb-8 text-center" style={{ color: currentTheme.primary }}>Additional Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {additionalFeatures.map((feature, idx) => (
              <motion.div
                key={idx}
                className="rounded-2xl border border-border/50 bg-white/70 dark:bg-black/70 backdrop-blur-md p-6 text-center"
                whileHover={{ 
                  scale: 1.05, 
                  boxShadow: `0 10px 40px -10px ${currentTheme.primary}40`
                }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.div
                  className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
                  style={{ background: currentTheme.primary }}
                  whileHover={{ scale: 1.2, rotate: 15 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </motion.div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* CTA Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="text-center"
        >
          <motion.div
            className="rounded-3xl p-12 border border-border/50 bg-white/70 dark:bg-black/70 backdrop-blur-md"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.primary}10, ${currentTheme.secondary}10)`
            }}
          >
            <h2 className="text-3xl font-bold mb-4" style={{ color: currentTheme.primary }}>Ready to Get Started?</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of students and educators who are already transforming their learning experience with LearnX.
            </p>
            <motion.div
              className="flex gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <motion.button
                className="px-8 py-3 rounded-xl font-semibold text-white shadow-lg"
                style={{ background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})` }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = "/auth"}
              >
                Start Learning
              </motion.button>
              <motion.button
                className="px-8 py-3 rounded-xl font-semibold bg-white dark:bg-black border border-border/50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = "/contact"}
              >
                Contact Sales
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.section>
      </div>
    </div>
  );
}
