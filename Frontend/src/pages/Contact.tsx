import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  GraduationCap, Mail, Phone, MapPin, Send, Sparkles,
  MessageCircle, Zap, Star, CheckCircle, Loader2, MessageSquare, Menu, Moon, Sun, X
} from "lucide-react";
import { toast } from "sonner";
import { API_BASE, getApiErrorMessage } from "@/lib/backendApi";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeTheme, setActiveTheme] = useState("default");
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  const features = [
    { icon: MessageCircle, title: "Quick Response", desc: "Get replies within 24 hours" },
    { icon: Zap, title: "Fast Support", desc: "Real-time chat assistance" },
    { icon: Star, title: "Expert Team", desc: "Dedicated professionals" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          message: formData.message.trim(),
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const msg =
          typeof json?.message === "string"
            ? json.message
            : getApiErrorMessage(json, "Could not send message");
        toast.error(msg);
        return;
      }
      setIsSubmitted(true);
      toast.success("Message sent! We'll get back to you soon.");
      setTimeout(() => {
        setFormData({ name: "", email: "", message: "" });
        setIsSubmitted(false);
      }, 3000);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className={`min-h-screen ${currentTheme.bgGradient} relative overflow-hidden`}>

      {/* Animated Background Elements */}
      <motion.div
        animate={{ y: [0, -30, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full blur-[120px] pointer-events-none opacity-60"
        style={{ background: currentTheme.primary }}
      />
      <motion.div
        animate={{ y: [0, 20, 0], rotate: [0, -3, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-[-10%] left-[-5%] w-[350px] h-[350px] rounded-full blur-[100px] pointer-events-none opacity-40"
        style={{ background: currentTheme.secondary }}
      />
      <motion.div
        animate={{ y: [0, 15, 0], x: [0, -10, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute top-[40%] right-[15%] w-[200px] h-[200px] rounded-full blur-[80px] pointer-events-none opacity-30"
        style={{ background: currentTheme.accent }}
      />

      <div className="relative z-10 container mx-auto px-6 md:px-16 py-6">
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
            <span className="text-sm font-medium text-muted-foreground">Get in Touch</span>
          </motion.div>
          <motion.h1
            className="text-5xl md:text-7xl font-black tracking-tight mb-6"
            style={{ color: currentTheme.primary }}
          >
            Let's Connect
          </motion.h1>
          <motion.p
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Have questions or want a demo? Reach out and our team will help you get started quickly.
          </motion.p>
        </motion.section>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12"
        >
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              className="rounded-2xl border border-border/50 bg-white/70 dark:bg-black/70 backdrop-blur-md p-6 text-center"
              whileHover={{ 
                scale: 1.05, 
                boxShadow: `0 10px 40px -10px ${currentTheme.primary}40`
              }}
              onHoverStart={() => setHoveredFeature(idx)}
              onHoverEnd={() => setHoveredFeature(null)}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.div
                className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: currentTheme.primary }}
                animate={{ 
                  rotate: hoveredFeature === idx ? 360 : 0,
                  scale: hoveredFeature === idx ? 1.1 : 1
                }}
                transition={{ duration: 0.5 }}
              >
                <feature.icon className="w-6 h-6 text-white" />
              </motion.div>
              <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Content Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Info Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="rounded-3xl border border-border/50 bg-white/70 dark:bg-black/70 backdrop-blur-md p-8 relative overflow-hidden group"
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
                className="w-16 h-16 rounded-2xl mb-6 flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})` }}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <MessageCircle className="w-8 h-8 text-white" />
              </motion.div>
              
              <h2 className="text-3xl font-bold mb-4" style={{ color: currentTheme.primary }}>Get in Touch</h2>
              <p className="text-muted-foreground mb-8">
                We're here to help and answer any questions you might have.
              </p>
              
              <div className="space-y-6">
                {[
                  { icon: Mail, text: "ashishkumarupadhyay0328@gmail.com", label: "Personal Email" },
                  { icon: Mail, text: "learnx.support@gmail.com", label: "Office Email" },
                  { icon: Phone, text: "7987665254", label: "Phone" },
                  { icon: MapPin, text: "Indore, India", label: "Location" }
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 dark:bg-muted/10 border border-border/30"
                    whileHover={{ 
                      x: 10,
                      backgroundColor: `${currentTheme.primary}10`,
                      borderColor: currentTheme.primary
                    }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <motion.div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ background: currentTheme.primary }}
                      whileHover={{ scale: 1.2, rotate: 15 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <item.icon className="w-5 h-5 text-white" />
                    </motion.div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">{item.label}</p>
                      <p className="text-foreground font-medium">{item.text}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="rounded-3xl border border-border/50 bg-white/70 dark:bg-black/70 backdrop-blur-md p-8"
          >
            <AnimatePresence mode="wait">
              {!isSubmitted ? (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  <h2 className="text-3xl font-bold mb-6" style={{ color: currentTheme.primary }}>Send us a Message</h2>
                  
                  <motion.div
                    className="space-y-2"
                    whileFocus={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <label className="text-sm font-medium text-foreground">Your Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-xl border border-border/50 bg-white/80 dark:bg-black/50 px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      placeholder="John Doe"
                      style={{
                        '--tw-ring-color': `${currentTheme.primary}30`
                      } as React.CSSProperties}
                    />
                  </motion.div>

                  <motion.div
                    className="space-y-2"
                    whileFocus={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <label className="text-sm font-medium text-foreground">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-xl border border-border/50 bg-white/80 dark:bg-black/50 px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      placeholder="john@example.com"
                      style={{
                        '--tw-ring-color': `${currentTheme.primary}30`
                      } as React.CSSProperties}
                    />
                  </motion.div>

                  <motion.div
                    className="space-y-2"
                    whileFocus={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <label className="text-sm font-medium text-foreground">How can we help?</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={5}
                      className="w-full min-h-[130px] rounded-xl border border-border/50 bg-white/80 dark:bg-black/50 px-4 py-3 text-sm outline-none resize-none transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      placeholder="Tell us about your project or questions..."
                      style={{
                        '--tw-ring-color': `${currentTheme.primary}30`
                      } as React.CSSProperties}
                    />
                  </motion.div>

                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-xl font-semibold py-4 flex items-center justify-center gap-3 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 relative overflow-hidden group"
                    style={{ background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})` }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Message</span>
                        <motion.div
                          animate={{ x: [0, 5, 0] }}
                          transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                        >
                          <Send className="w-5 h-5" />
                        </motion.div>
                      </>
                    )}
                  </motion.button>
                </motion.form>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="text-center py-12"
                >
                  <motion.div
                    className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})` }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <CheckCircle className="w-10 h-10 text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-bold mb-3" style={{ color: currentTheme.primary }}>Message Sent!</h3>
                  <p className="text-muted-foreground">
                    Thank you for reaching out. We'll get back to you within 24 hours.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </section>

        {/* Floating Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="fixed bottom-6 right-6 flex flex-col gap-3"
        >
          <motion.button
            className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white"
            style={{ background: currentTheme.secondary }}
            whileHover={{ scale: 1.1, rotate: -15 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => window.open(`https://wa.me/917987665254`, '_blank')}
          >
            <MessageSquare className="w-6 h-6" />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
