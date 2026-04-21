import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  GraduationCap, Target, Rocket, HeartHandshake, Sparkles, Users, 
  Award, BookOpen, Globe, Lightbulb, ShieldCheck, TrendingUp, Clock,
  CheckCircle, ArrowRight, Star, Zap, MessageCircle
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

export default function About() {
  const [activeTheme, setActiveTheme] = useState("default");
  const [activeTab, setActiveTab] = useState("mission");

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

  const values = [
    { icon: HeartHandshake, title: "Student-First", desc: "Every decision starts with what's best for learners" },
    { icon: Lightbulb, title: "Innovation", desc: "Pushing boundaries with cutting-edge technology" },
    { icon: ShieldCheck, title: "Trust", desc: "Building reliable, secure educational platforms" },
    { icon: Users, title: "Community", desc: "Fostering collaborative learning environments" }
  ];

  const timeline = [
    { year: "2020", title: "Founded", desc: "Started with a vision to transform education" },
    { year: "2021", title: "First Launch", desc: "Released our MVP to 100+ students" },
    { year: "2022", title: "Growth", desc: "Expanded to 1000+ users across 10 schools" },
    { year: "2023", title: "AI Integration", desc: "Introduced AI-powered learning assistant" },
    { year: "2024", title: "Global Reach", desc: "Now serving 10,000+ students worldwide" }
  ];

  const team = [
    { name: "Alex Chen", role: "CEO & Founder", desc: "Visionary leader with 15+ years in edtech" },
    { name: "Sarah Johnson", role: "CTO", desc: "AI expert driving technical innovation" },
    { name: "Mike Williams", role: "Head of Education", desc: "Former educator shaping learning experiences" },
    { name: "Emily Davis", role: "Lead Designer", desc: "Creating intuitive, beautiful interfaces" }
  ];

  return (
    <div className={`min-h-screen ${currentTheme.bgGradient} relative overflow-hidden`}>
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Animated Background Elements */}
      <motion.div
        animate={{ y: [0, -35, 0], rotate: [0, 6, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-8%] left-[-6%] w-[400px] h-[400px] rounded-full blur-[120px] pointer-events-none opacity-60"
        style={{ background: currentTheme.primary }}
      />
      <motion.div
        animate={{ y: [0, 30, 0], rotate: [0, -4, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-[-10%] right-[-6%] w-[350px] h-[350px] rounded-full blur-[100px] pointer-events-none opacity-40"
        style={{ background: currentTheme.secondary }}
      />
      <motion.div
        animate={{ y: [0, 18, 0], x: [0, -12, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute top-[45%] left-[15%] w-[220px] h-[220px] rounded-full blur-[85px] pointer-events-none opacity-30"
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
                  item.label === "About" 
                    ? "font-semibold" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
                style={{
                  color: item.label === "About" ? currentTheme.primary : undefined
                }}
              >
                {item.label}
              </Link>
            ))}
          </motion.div>
        </nav>

        {/* Hero Section */}
        <motion.section
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
            <span className="text-sm font-medium text-muted-foreground">Our Story</span>
          </motion.div>
          <motion.h1
            className="text-5xl md:text-7xl font-black tracking-tight mb-6"
            style={{ color: currentTheme.primary }}
          >
            About LearnX
          </motion.h1>
          <motion.p
            className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            LearnX is designed to simplify modern education with a focused experience for students, teachers, and administrators.
            Our mission is to blend technology and pedagogy in a way that feels intuitive, fast, and genuinely helpful.
          </motion.p>
        </motion.section>

        {/* Mission/Vision/Promise Tabs */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mb-16"
        >
          <div className="flex justify-center mb-8">
            <div className="inline-flex rounded-xl bg-white/70 dark:bg-black/70 backdrop-blur-sm border border-border/50 p-1">
              {[
                { id: "mission", label: "Mission", icon: Target },
                { id: "vision", label: "Vision", icon: Rocket },
                { id: "promise", label: "Promise", icon: HeartHandshake }
              ].map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 rounded-lg flex items-center gap-2 transition-all ${
                    activeTab === tab.id
                      ? "bg-white dark:bg-black shadow-md"
                      : "hover:bg-white/50 dark:hover:bg-black/50"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <tab.icon className="w-4 h-4" style={{ color: currentTheme.primary }} />
                  <span className="text-sm font-medium">{tab.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-3xl mx-auto"
            >
              <div className="rounded-3xl border border-border/50 bg-white/70 dark:bg-black/70 backdrop-blur-md p-8">
                {activeTab === "mission" && (
                  <div className="text-center">
                    <motion.div
                      className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})` }}
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Target className="w-10 h-10 text-white" />
                    </motion.div>
                    <h3 className="text-3xl font-bold mb-4" style={{ color: currentTheme.primary }}>Our Mission</h3>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      Deliver calm, high-impact digital learning workflows that empower educators and inspire students to achieve their full potential.
                    </p>
                  </div>
                )}
                {activeTab === "vision" && (
                  <div className="text-center">
                    <motion.div
                      className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})` }}
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    >
                      <Rocket className="w-10 h-10 text-white" />
                    </motion.div>
                    <h3 className="text-3xl font-bold mb-4" style={{ color: currentTheme.primary }}>Our Vision</h3>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      Empower institutions with intelligent and scalable tools that make quality education accessible to everyone, everywhere.
                    </p>
                  </div>
                )}
                {activeTab === "promise" && (
                  <div className="text-center">
                    <motion.div
                      className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})` }}
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <HeartHandshake className="w-10 h-10 text-white" />
                    </motion.div>
                    <h3 className="text-3xl font-bold mb-4" style={{ color: currentTheme.primary }}>Our Promise</h3>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      Student-first design, teacher productivity, and admin clarity - every feature, every decision, every day.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.section>

        {/* Values Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold mb-8 text-center" style={{ color: currentTheme.primary }}>Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, idx) => (
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
                  className="w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center"
                  style={{ background: currentTheme.primary }}
                  whileHover={{ scale: 1.2, rotate: 15 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <value.icon className="w-8 h-8 text-white" />
                </motion.div>
                <h3 className="font-bold text-foreground mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Timeline Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold mb-8 text-center" style={{ color: currentTheme.primary }}>Our Journey</h2>
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-primary to-secondary" />
              
              {timeline.map((item, idx) => (
                <motion.div
                  key={idx}
                  className={`flex items-center mb-8 ${
                    idx % 2 === 0 ? "flex-row-reverse" : ""
                  }`}
                  initial={{ opacity: 0, x: idx % 2 === 0 ? 50 : -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + idx * 0.1, duration: 0.5 }}
                >
                  <div className="w-1/2" />
                  <motion.div
                    className="w-8 h-8 rounded-full border-4 border-white dark:border-black flex items-center justify-center"
                    style={{ background: currentTheme.primary }}
                    whileHover={{ scale: 1.2 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <CheckCircle className="w-4 h-4 text-white" />
                  </motion.div>
                  <div className="w-1/2 px-8">
                    <motion.div
                      className="rounded-2xl border border-border/50 bg-white/70 dark:bg-black/70 backdrop-blur-md p-6"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl font-bold" style={{ color: currentTheme.primary }}>{item.year}</span>
                        <span className="text-sm text-muted-foreground">{item.title}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Team Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold mb-8 text-center" style={{ color: currentTheme.primary }}>Meet Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, idx) => (
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
                  className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold"
                  style={{ background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})` }}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {member.name.split(' ').map(n => n[0]).join('')}
                </motion.div>
                <h3 className="font-bold text-foreground mb-1">{member.name}</h3>
                <p className="text-sm font-medium mb-2" style={{ color: currentTheme.primary }}>{member.role}</p>
                <p className="text-sm text-muted-foreground">{member.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* CTA Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-center"
        >
          <motion.div
            className="rounded-3xl p-12 border border-border/50 bg-white/70 dark:bg-black/70 backdrop-blur-md"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.primary}10, ${currentTheme.secondary}10)`
            }}
          >
            <h2 className="text-3xl font-bold mb-4" style={{ color: currentTheme.primary }}>Join Our Journey</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Be part of the education revolution. Whether you're a student, educator, or institution, LearnX is here to help you succeed.
            </p>
            <motion.div
              className="flex gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
            >
              <motion.button
                className="px-8 py-3 rounded-xl font-semibold text-white shadow-lg"
                style={{ background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})` }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = "/auth"}
              >
                Get Started
              </motion.button>
              <motion.button
                className="px-8 py-3 rounded-xl font-semibold bg-white dark:bg-black border border-border/50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = "/contact"}
              >
                Learn More
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.section>
      </div>
    </div>
  );
}
