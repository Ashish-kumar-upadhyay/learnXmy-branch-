import { useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap, Mail } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    if (!email.trim()) toast.error("Email is required");
    else {
      toast.success("Reset flow currently disabled. Please contact admin.");
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold gradient-text">Reset Password</h1>
        </div>
        <div className="glass-card p-6">
          {sent ? (
            <div className="text-center space-y-3">
              <p className="text-foreground">Check your email for a reset link!</p>
              <Link to="/auth" className="text-sm text-primary hover:underline">Back to sign in</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-muted/50 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors" />
              </div>
              <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg font-medium text-sm text-primary-foreground disabled:opacity-50" style={{ background: "var(--gradient-primary)" }}>
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
              <Link to="/auth" className="block text-center text-sm text-muted-foreground hover:text-foreground">Back to sign in</Link>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
