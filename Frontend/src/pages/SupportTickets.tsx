import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Loader2, MessageSquare, Clock, CheckCircle2, AlertCircle, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { api, getAccessToken } from "@/lib/backendApi";

interface Ticket {
  id: string;
  student_id: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  response: string | null;
  responded_by: string | null;
  responded_at: string | null;
  created_at: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/20 text-warning",
  high: "bg-destructive/20 text-destructive",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  open: <AlertCircle className="w-4 h-4 text-warning" />,
  in_progress: <Clock className="w-4 h-4 text-primary" />,
  resolved: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  closed: <CheckCircle2 className="w-4 h-4 text-muted-foreground" />,
};

export default function SupportTickets() {
  const { user, roles } = useAuth();
  const isStudent = !roles.includes("admin") && !roles.includes("teacher");
  const isStaff = roles.includes("admin") || roles.includes("teacher");

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ subject: "", description: "", category: "general", priority: "medium" });
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [responseText, setResponseText] = useState("");
  const [responding, setResponding] = useState(false);
  const [filter, setFilter] = useState("all");

  const fetchTickets = async () => {
    setLoading(true);
    const accessToken = getAccessToken();
    if (!accessToken) return;
    const res = await api<Ticket[]>("/api/support-tickets", { method: "GET", accessToken });
    if (res.status === 200 && res.data) setTickets(res.data);
    setLoading(false);
  };

  useEffect(() => { void fetchTickets(); }, [user, roles]);

  const createTicket = async () => {
    if (!form.subject.trim() || !form.description.trim()) { toast.error("Subject and description required"); return; }
    setSaving(true);
    const accessToken = getAccessToken();
    if (!accessToken) { toast.error("Login required"); setSaving(false); return; }
    const res = await api("/api/support-tickets", {
      method: "POST",
      accessToken,
      body: JSON.stringify({
        subject: form.subject.trim(),
        description: form.description.trim(),
        category: form.category,
        priority: form.priority,
      }),
    });
    if (res.status !== 201 && res.status !== 200) {
      toast.error("Failed to create ticket");
    } else {
      toast.success("Ticket created!");
      setForm({ subject: "", description: "", category: "general", priority: "medium" });
      setShowForm(false);
      fetchTickets();
    }
    setSaving(false);
  };

  const respondToTicket = async (ticketId: string, newStatus: string) => {
    if (!responseText.trim() && newStatus === "resolved") { toast.error("Please add a response"); return; }
    setResponding(true);
    const accessToken = getAccessToken();
    if (!accessToken) { toast.error("Login required"); setResponding(false); return; }
    const res = await api(`/api/support-tickets/${ticketId}/respond`, {
      method: "PUT",
      accessToken,
      body: JSON.stringify({
        status: newStatus,
        response: responseText.trim() || null,
      }),
    });
    if (res.status !== 200) {
      const msg =
        typeof res.error === "string"
          ? res.error
          : (res.error as any)?.message || (Array.isArray((res.error as any)?.errors) ? (res.error as any).errors[0] : null) || "Update failed";
      toast.error(msg);
    }
    else {
      toast.success("Ticket updated!");
      setSelectedTicket(null);
      setResponseText("");
      fetchTickets();
    }
    setResponding(false);
  };

  const filteredTickets = tickets.filter(t => filter === "all" || t.status === filter);

  const inputClass = "w-full px-3 py-2.5 rounded-lg bg-muted/50 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors";

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            <span className="gradient-text">Support Tickets</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{isStudent ? "Raise a ticket for help from Teachers/Admin" : "Manage student support tickets"}</p>
        </div>
        {isStudent && (
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
            <Plus className="w-4 h-4" />{showForm ? "Cancel" : "New Ticket"}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["all", "open", "in_progress", "resolved", "closed"].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${filter === s ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}>
            {s === "all" ? "All" : s.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="glass-card p-5 space-y-4">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">New Support Ticket</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground uppercase mb-1 block">Subject *</label>
                <input className={inputClass} value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="Brief summary of your issue" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground uppercase mb-1 block">Category</label>
                  <select className={inputClass} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                    <option value="general">General</option>
                    <option value="technical">Technical</option>
                    <option value="academic">Academic</option>
                    <option value="fee">Fee Related</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground uppercase mb-1 block">Priority</label>
                  <select className={inputClass} value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase mb-1 block">Description *</label>
              <textarea className={`${inputClass} min-h-[100px] resize-none`} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe your issue in detail..." />
            </div>
            <button onClick={createTicket} disabled={saving} className="px-5 py-2 rounded-lg text-sm font-medium text-primary-foreground disabled:opacity-50" style={{ background: "var(--gradient-primary)" }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Ticket"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-foreground mb-1">No Tickets</h3>
          <p className="text-sm text-muted-foreground">{isStudent ? "Create a ticket to get help!" : "No support tickets to review."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map(ticket => (
            <motion.div key={ticket.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="glass-card p-4 cursor-pointer hover:border-primary/30 transition-colors"
              onClick={() => { setSelectedTicket(ticket); setResponseText(ticket.response || ""); }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {STATUS_ICONS[ticket.status]}
                    <h3 className="text-sm font-bold text-foreground truncate">{ticket.subject}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{ticket.description}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${PRIORITY_COLORS[ticket.priority]}`}>{ticket.priority}</span>
                  <span className="text-[10px] text-muted-foreground capitalize px-2 py-0.5 rounded-full bg-muted/50">{ticket.category}</span>
                  <span className="text-[10px] text-muted-foreground">{new Date(ticket.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              {ticket.response && (
                <div className="mt-3 pt-3 border-t border-border/30">
                  <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Response:</span> {ticket.response}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Ticket Detail Modal */}
      <AnimatePresence>
        {selectedTicket && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4"
            onClick={() => setSelectedTicket(null)}
          >
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="glass-card p-6 w-full max-w-lg space-y-4 max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {STATUS_ICONS[selectedTicket.status]}
                    <h3 className="text-base font-bold text-foreground">{selectedTicket.subject}</h3>
                  </div>
                  <div className="flex gap-2 mt-1">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${PRIORITY_COLORS[selectedTicket.priority]}`}>{selectedTicket.priority}</span>
                    <span className="text-[10px] text-muted-foreground capitalize px-2 py-0.5 rounded-full bg-muted/50">{selectedTicket.category}</span>
                    <span className="text-[10px] text-muted-foreground capitalize px-2 py-0.5 rounded-full bg-muted/50">{selectedTicket.status.replace("_", " ")}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedTicket(null)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>

              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-sm text-foreground">{selectedTicket.description}</p>
                <p className="text-[10px] text-muted-foreground mt-2">{new Date(selectedTicket.created_at).toLocaleString()}</p>
              </div>

              {selectedTicket.response && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <p className="text-xs font-semibold text-primary mb-1">Staff Response</p>
                  <p className="text-sm text-foreground">{selectedTicket.response}</p>
                </div>
              )}

              {isStaff && selectedTicket.status !== "closed" && (
                <div className="space-y-3 pt-2 border-t border-border/30">
                  <div>
                    <label className="text-xs text-muted-foreground uppercase mb-1 block">Your Response</label>
                    <textarea className={`${inputClass} min-h-[80px] resize-none`} value={responseText} onChange={e => setResponseText(e.target.value)} placeholder="Write your response..." />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => respondToTicket(selectedTicket.id, "in_progress")} disabled={responding} className="px-4 py-2 rounded-lg text-xs font-semibold bg-primary/20 text-primary hover:bg-primary/30 transition-colors disabled:opacity-50">
                      Mark In Progress
                    </button>
                    <button onClick={() => respondToTicket(selectedTicket.id, "resolved")} disabled={responding} className="px-4 py-2 rounded-lg text-xs font-semibold text-primary-foreground disabled:opacity-50" style={{ background: "var(--gradient-primary)" }}>
                      {responding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Resolve"}
                    </button>
                    <button onClick={() => respondToTicket(selectedTicket.id, "closed")} disabled={responding} className="px-4 py-2 rounded-lg text-xs font-semibold bg-muted text-muted-foreground hover:bg-muted/80 transition-colors disabled:opacity-50">
                      Close
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
