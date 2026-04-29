import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import DashboardLayout from "@/components/DashboardLayout";
import Index from "./pages/Index";
import Lectures from "./pages/Lectures";
import Assignments from "./pages/Assignments";
import Analytics from "./pages/Analytics";
import Leaderboard from "./pages/Leaderboard";
import AiTutor from "./pages/AiTutor";
import Notifications from "./pages/Notifications";
import RoleSelect from "./pages/RoleSelect";
import RoleLogin from "./pages/RoleLogin";
import GoogleCallback from "./pages/GoogleCallback";
import WelcomeMagicLogin from "./pages/WelcomeMagicLogin";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import TeacherDashboard from "./pages/TeacherDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Attendance from "./pages/Attendance";
import TeacherStudentAttendance from "./pages/TeacherStudentAttendance";
import Profile from "./pages/Profile";
import SprintPlan from "./pages/SprintPlan";
import LeaveRequests from "./pages/LeaveRequests";
import Timetable from "./pages/Timetable";
import ExamsPage from "./pages/Exams";
import FeeManagement from "./pages/FeeManagement";
import SupportTickets from "./pages/SupportTickets";
import Classes from "./pages/Classes";
import Features from "./pages/Features";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-foreground font-medium">Please wait...</p>
      </div>
    </div>
  );
}

function getDefaultRoute(roles: string[]) {
  if (roles.includes("admin")) return "/admin";
  if (roles.includes("teacher")) return "/teacher";
  return "/";
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, roles } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to={getDefaultRoute(roles)} replace />;
  return <>{children}</>;
}

function HomeRoute() {
  const { roles } = useAuth();

  if (roles.includes("admin")) return <Navigate to="/admin" replace />;
  if (roles.includes("teacher")) return <Navigate to="/teacher" replace />;

  return (
    <DashboardLayout>
      <Index />
    </DashboardLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
          <Routes>
            <Route path="/auth" element={<PublicRoute><RoleSelect /></PublicRoute>} />
            <Route path="/auth/:role" element={<PublicRoute><RoleLogin /></PublicRoute>} />
            <Route path="/auth/google/callback" element={<PublicRoute><GoogleCallback /></PublicRoute>} />
            {/* Not inside PublicRoute: must run even if another account is still in localStorage */}
            <Route path="/auth/welcome" element={<WelcomeMagicLogin />} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/features" element={<Features />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/" element={<ProtectedRoute><HomeRoute /></ProtectedRoute>} />
            <Route path="/student-dashboard" element={<ProtectedRoute><DashboardLayout><Index /></DashboardLayout></ProtectedRoute>} />
            <Route path="/lectures" element={<ProtectedRoute><DashboardLayout><Lectures /></DashboardLayout></ProtectedRoute>} />
            <Route path="/assignments" element={<ProtectedRoute><DashboardLayout><Assignments /></DashboardLayout></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><DashboardLayout><Analytics /></DashboardLayout></ProtectedRoute>} />
            <Route path="/leaderboard" element={<ProtectedRoute><DashboardLayout><Leaderboard /></DashboardLayout></ProtectedRoute>} />
            <Route path="/ai-tutor" element={<ProtectedRoute><DashboardLayout><AiTutor /></DashboardLayout></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><DashboardLayout><Notifications /></DashboardLayout></ProtectedRoute>} />
            <Route path="/attendance" element={<ProtectedRoute><DashboardLayout><Attendance /></DashboardLayout></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><DashboardLayout><Profile /></DashboardLayout></ProtectedRoute>} />
            <Route path="/sprint-plan" element={<ProtectedRoute><DashboardLayout><SprintPlan /></DashboardLayout></ProtectedRoute>} />
            <Route path="/leave-requests" element={<ProtectedRoute><DashboardLayout><LeaveRequests /></DashboardLayout></ProtectedRoute>} />
            <Route path="/timetable" element={<ProtectedRoute><DashboardLayout><Timetable /></DashboardLayout></ProtectedRoute>} />
            <Route path="/exams" element={<ProtectedRoute><DashboardLayout><ExamsPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/fees" element={<ProtectedRoute><DashboardLayout><FeeManagement /></DashboardLayout></ProtectedRoute>} />
            <Route path="/classes" element={<ProtectedRoute><DashboardLayout><Classes /></DashboardLayout></ProtectedRoute>} />
            <Route path="/teacher" element={<ProtectedRoute><DashboardLayout><TeacherDashboard /></DashboardLayout></ProtectedRoute>} />
            <Route path="/teacher-attendance" element={<ProtectedRoute><DashboardLayout><TeacherStudentAttendance /></DashboardLayout></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><DashboardLayout><AdminDashboard /></DashboardLayout></ProtectedRoute>} />
            <Route path="/support" element={<ProtectedRoute><DashboardLayout><SupportTickets /></DashboardLayout></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
