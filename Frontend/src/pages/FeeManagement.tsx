import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, IndianRupee, Receipt, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { api, getAccessToken } from "@/lib/backendApi";

interface FeeStructure {
  id: string;
  batch: string;
  fee_type: string;
  amount: number;
  due_date: string;
  description: string | null;
}

interface FeePayment {
  id: string;
  student_id: string;
  fee_structure_id: string;
  amount_paid: number;
  payment_method: string;
  paid_at: string;
  receipt_no: string | null;
  status: string;
  student_name?: string;
}

export default function FeeManagement() {
  const { user, roles, profile } = useAuth();
  const isAdmin = roles.includes("admin");
  const isStudent = !roles.includes("admin") && !roles.includes("teacher");

  const [tab, setTab] = useState<"structure" | "payments" | "student">(isStudent ? "student" : "structure");
  const [fees, setFees] = useState<FeeStructure[]>([]);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPayForm, setShowPayForm] = useState(false);

  const [feeForm, setFeeForm] = useState({ batch: "", fee_type: "tuition", amount: 0, due_date: "", description: "" });
  const [payForm, setPayForm] = useState({ student_id: "", fee_structure_id: "", amount_paid: 0, payment_method: "cash", receipt_no: "", notes: "" });

  const [students, setStudents] = useState<{ id: string; full_name: string; class_name: string | null; role?: string }[]>([]);

  useEffect(() => {
    void fetchData();
  }, [isAdmin, isStudent, user?.id]);

  const fetchData = async () => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      setFees([]);
      setPayments([]);
      setStudents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const feeRes = await api<any[]>("/api/fee/structure", { method: "GET", accessToken });
    const feeRows = feeRes.status === 200 && feeRes.data ? feeRes.data : [];
    setFees(
      feeRows.map((f: any) => ({
        id: String(f._id ?? f.id),
        batch: f.batch ?? "",
        fee_type: f.fee_type,
        amount: Number(f.amount ?? 0),
        due_date: f.due_date,
        description: f.description ?? null,
      }))
    );

    if (isAdmin) {
      const [payRes, usersRes] = await Promise.all([
        api<any[]>("/api/fee/payments", { method: "GET", accessToken }),
        api<any[]>("/api/users", { method: "GET", accessToken }),
      ]);
      const users = usersRes.status === 200 && usersRes.data ? usersRes.data : [];
      const studentsOnly = users
        .map((u: any) => ({
          id: String(u.id ?? u._id),
          full_name: u.full_name ?? u.name ?? "Unknown",
          class_name: u.class_name ?? u.assignedClass ?? null,
          role: u.role,
        }))
        .filter((u: any) => u.role === "student");
      setStudents(studentsOnly);

      const nameMap: Record<string, string> = {};
      studentsOnly.forEach((s) => {
        nameMap[s.id] = s.full_name;
      });

      const payRows = payRes.status === 200 && payRes.data ? payRes.data : [];
      setPayments(
        payRows.map((p: any) => ({
          id: String(p._id ?? p.id),
          student_id: String(p.student_id),
          fee_structure_id: String(p.fee_structure_id),
          amount_paid: Number(p.amount_paid ?? 0),
          payment_method: p.payment_method ?? "cash",
          paid_at: p.paid_at ?? new Date().toISOString(),
          receipt_no: p.receipt_no ?? null,
          status: p.status ?? "paid",
          student_name: nameMap[String(p.student_id)] || "Unknown",
        }))
      );
    } else if (isStudent && user) {
      const payRes = await api<any[]>(`/api/fee/payments/student/${encodeURIComponent(user.id)}`, {
        method: "GET",
        accessToken,
      });
      const payRows = payRes.status === 200 && payRes.data ? payRes.data : [];
      setPayments(
        payRows.map((p: any) => ({
          id: String(p._id ?? p.id),
          student_id: String(p.student_id),
          fee_structure_id: String(p.fee_structure_id),
          amount_paid: Number(p.amount_paid ?? 0),
          payment_method: p.payment_method ?? "cash",
          paid_at: p.paid_at ?? new Date().toISOString(),
          receipt_no: p.receipt_no ?? null,
          status: p.status ?? "paid",
        }))
      );
    }

    setLoading(false);
  };

  const handleAddFee = async () => {
    if (!feeForm.batch || !feeForm.amount || !feeForm.due_date) { toast.error("Fill all required fields"); return; }
    const accessToken = getAccessToken();
    if (!accessToken) { toast.error("Login required"); return; }
    const res = await api("/api/fee/structure", {
      method: "POST",
      accessToken,
      body: JSON.stringify({
      batch: feeForm.batch,
      fee_type: feeForm.fee_type,
      amount: feeForm.amount,
      due_date: feeForm.due_date,
      description: feeForm.description || null,
      }),
    });
    if (res.status !== 201 && res.status !== 200) { toast.error("Failed to add fee"); return; }
    toast.success("Fee structure added!");
    setShowForm(false);
    setFeeForm({ batch: "", fee_type: "tuition", amount: 0, due_date: "", description: "" });
    void fetchData();
  };

  const handleRecordPayment = async () => {
    if (!payForm.student_id || !payForm.fee_structure_id || !payForm.amount_paid) { toast.error("Fill all required fields"); return; }
    const accessToken = getAccessToken();
    if (!accessToken) { toast.error("Login required"); return; }
    const res = await api("/api/fee/payments", {
      method: "POST",
      accessToken,
      body: JSON.stringify({
      student_id: payForm.student_id,
      fee_structure_id: payForm.fee_structure_id,
      amount_paid: payForm.amount_paid,
      payment_method: payForm.payment_method,
      receipt_no: payForm.receipt_no || null,
      }),
    });
    if (res.status !== 201 && res.status !== 200) { toast.error("Failed to record payment"); return; }
    toast.success("Payment recorded!");
    setShowPayForm(false);
    setPayForm({ student_id: "", fee_structure_id: "", amount_paid: 0, payment_method: "cash", receipt_no: "", notes: "" });
    void fetchData();
  };

  const getStudentFeeStatus = (feeId: string) => {
    const paid = payments.filter(p => p.fee_structure_id === feeId).reduce((sum, p) => sum + p.amount_paid, 0);
    const fee = fees.find(f => f.id === feeId);
    if (!fee) return { paid: 0, remaining: 0, status: "unknown" };
    const remaining = fee.amount - paid;
    return { paid, remaining, status: remaining <= 0 ? "paid" : new Date(fee.due_date) < new Date() ? "overdue" : "pending" };
  };

  const tabs = isStudent
    ? [{ key: "student" as const, label: "My Fees" }]
    : [
        { key: "structure" as const, label: "Fee Structure" },
        { key: "payments" as const, label: "Payments" },
      ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">💰 Fee Management</h1>
          <p className="text-sm text-muted-foreground">{isStudent ? "View your fee status & payments" : "Manage fees and record payments"}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2 rounded-xl text-sm font-medium transition ${tab === t.key ? "bg-primary text-primary-foreground" : "bg-card border border-border/20 text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          {/* ===== STUDENT VIEW ===== */}
          {tab === "student" && isStudent && (
            <div className="space-y-4">
              {fees.filter(f => !profile?.class_name || f.batch === profile.class_name).length === 0 ? (
                <div className="text-center py-16">
                  <IndianRupee className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No fees assigned to your batch</p>
                </div>
              ) : (
                fees.filter(f => !profile?.class_name || f.batch === profile.class_name).map((fee, i) => {
                  const status = getStudentFeeStatus(fee.id);
                  return (
                    <motion.div key={fee.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="bg-card border border-border/20 rounded-2xl p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-foreground capitalize">{fee.fee_type} Fee</h3>
                          {fee.description && <p className="text-xs text-muted-foreground">{fee.description}</p>}
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase flex items-center gap-1
                          ${status.status === "paid" ? "bg-emerald-500/10 text-emerald-600" : status.status === "overdue" ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-600"}`}>
                          {status.status === "paid" ? <CheckCircle2 className="w-3 h-3" /> : status.status === "overdue" ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {status.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Total</p>
                          <p className="font-bold text-foreground">₹{fee.amount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Paid</p>
                          <p className="font-bold text-emerald-600">₹{status.paid.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Remaining</p>
                          <p className={`font-bold ${status.remaining > 0 ? "text-destructive" : "text-emerald-600"}`}>₹{Math.max(0, status.remaining).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Due Date</p>
                          <p className="font-medium text-foreground">{format(new Date(fee.due_date), "dd MMM yyyy")}</p>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-3 h-2 bg-muted/30 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all" style={{ width: `${Math.min(100, (status.paid / fee.amount) * 100)}%` }} />
                      </div>
                    </motion.div>
                  );
                })
              )}

              {/* Payment history */}
              {payments.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-foreground mb-3">Payment History</h3>
                  <div className="space-y-2">
                    {payments.map(p => (
                      <div key={p.id} className="flex items-center justify-between bg-card/50 border border-border/10 rounded-xl p-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">₹{p.amount_paid.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{p.payment_method} • {format(new Date(p.paid_at), "dd MMM yyyy")}</p>
                        </div>
                        {p.receipt_no && <span className="text-xs text-muted-foreground">#{p.receipt_no}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== FEE STRUCTURE (Admin) ===== */}
          {tab === "structure" && isAdmin && (
            <div className="space-y-4">
              <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
                <Plus className="w-4 h-4" /> Add Fee
              </button>

              {showForm && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border/20 rounded-2xl p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Batch *</label>
                      <input value={feeForm.batch} onChange={e => setFeeForm({ ...feeForm, batch: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-border/20 bg-background text-sm text-foreground" placeholder="A" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Fee Type</label>
                      <select value={feeForm.fee_type} onChange={e => setFeeForm({ ...feeForm, fee_type: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-border/20 bg-background text-sm text-foreground">
                        <option value="tuition">Tuition</option>
                        <option value="exam">Exam</option>
                        <option value="library">Library</option>
                        <option value="sports">Sports</option>
                        <option value="transport">Transport</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Amount (₹) *</label>
                      <input type="number" value={feeForm.amount} onChange={e => setFeeForm({ ...feeForm, amount: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-xl border border-border/20 bg-background text-sm text-foreground" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Due Date *</label>
                      <input type="date" value={feeForm.due_date} onChange={e => setFeeForm({ ...feeForm, due_date: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-border/20 bg-background text-sm text-foreground" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                      <input value={feeForm.description} onChange={e => setFeeForm({ ...feeForm, description: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-border/20 bg-background text-sm text-foreground" placeholder="Monthly tuition fee" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleAddFee} className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium">Save</button>
                    <button onClick={() => setShowForm(false)} className="px-5 py-2 rounded-xl bg-muted/30 text-muted-foreground text-sm">Cancel</button>
                  </div>
                </motion.div>
              )}

              {fees.length === 0 ? (
                <div className="text-center py-16">
                  <Receipt className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No fee structure defined yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fees.map((fee, i) => (
                    <motion.div key={fee.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="bg-card border border-border/20 rounded-2xl p-5">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-foreground capitalize">{fee.fee_type} Fee</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Batch {fee.batch}</span>
                      </div>
                      {fee.description && <p className="text-xs text-muted-foreground mb-2">{fee.description}</p>}
                      <div className="flex justify-between text-sm">
                        <span className="text-foreground font-bold">₹{fee.amount.toLocaleString()}</span>
                        <span className="text-muted-foreground">Due: {format(new Date(fee.due_date), "dd MMM yyyy")}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== PAYMENTS (Admin) ===== */}
          {tab === "payments" && isAdmin && (
            <div className="space-y-4">
              <button onClick={() => setShowPayForm(!showPayForm)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
                <Plus className="w-4 h-4" /> Record Payment
              </button>

              {showPayForm && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border/20 rounded-2xl p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Student *</label>
                      <select value={payForm.student_id} onChange={e => setPayForm({ ...payForm, student_id: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-border/20 bg-background text-sm text-foreground">
                        <option value="">Select student</option>
                        {students.map(s => <option key={s.id} value={s.id}>{s.full_name} {s.class_name ? `(${s.class_name})` : ""}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Fee *</label>
                      <select value={payForm.fee_structure_id} onChange={e => setPayForm({ ...payForm, fee_structure_id: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-border/20 bg-background text-sm text-foreground">
                        <option value="">Select fee</option>
                        {fees.map(f => <option key={f.id} value={f.id}>{f.fee_type} - Batch {f.batch} (₹{f.amount})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Amount Paid (₹) *</label>
                      <input type="number" value={payForm.amount_paid} onChange={e => setPayForm({ ...payForm, amount_paid: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-xl border border-border/20 bg-background text-sm text-foreground" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Method</label>
                      <select value={payForm.payment_method} onChange={e => setPayForm({ ...payForm, payment_method: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-border/20 bg-background text-sm text-foreground">
                        <option value="cash">Cash</option>
                        <option value="upi">UPI</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="cheque">Cheque</option>
                        <option value="online">Online</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Receipt No</label>
                      <input value={payForm.receipt_no} onChange={e => setPayForm({ ...payForm, receipt_no: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-border/20 bg-background text-sm text-foreground" placeholder="REC-001" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
                      <input value={payForm.notes} onChange={e => setPayForm({ ...payForm, notes: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-border/20 bg-background text-sm text-foreground" placeholder="Partial payment" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleRecordPayment} className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium">Record</button>
                    <button onClick={() => setShowPayForm(false)} className="px-5 py-2 rounded-xl bg-muted/30 text-muted-foreground text-sm">Cancel</button>
                  </div>
                </motion.div>
              )}

              {payments.length === 0 ? (
                <div className="text-center py-16">
                  <Receipt className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No payments recorded yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/10">
                        <th className="text-left py-3 px-3 text-xs text-muted-foreground font-medium">Student</th>
                        <th className="text-left py-3 px-3 text-xs text-muted-foreground font-medium">Amount</th>
                        <th className="text-left py-3 px-3 text-xs text-muted-foreground font-medium">Method</th>
                        <th className="text-left py-3 px-3 text-xs text-muted-foreground font-medium">Date</th>
                        <th className="text-left py-3 px-3 text-xs text-muted-foreground font-medium">Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map(p => (
                        <tr key={p.id} className="border-b border-border/5 hover:bg-muted/10">
                          <td className="py-2.5 px-3 text-foreground font-medium">{p.student_name}</td>
                          <td className="py-2.5 px-3 text-foreground font-bold">₹{p.amount_paid.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-muted-foreground capitalize">{p.payment_method.replace("_", " ")}</td>
                          <td className="py-2.5 px-3 text-muted-foreground">{format(new Date(p.paid_at), "dd MMM yyyy")}</td>
                          <td className="py-2.5 px-3 text-muted-foreground">{p.receipt_no || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
