import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import StudentPortalLayout from "@/components/StudentPortalLayout";
import { useDataSync } from "@/hooks/useDataSync";
import { useClassEngine } from "@/hooks/useClassEngine";
import { useRealtimeStudents } from "@/hooks/useRealtimeStudents";
import { useRealtimeClassHistory } from "@/hooks/useRealtimeClassHistory";
import { useStore } from "@/store/useStore";
import { useLocation } from "react-router-dom";

// Lazy load pages for better performance
const MonitorPage = lazy(() => import("@/pages/MonitorPage"));
const StudentsPage = lazy(() => import("@/pages/StudentsPage"));
const RankingPage = lazy(() => import("@/pages/RankingPage"));
const ReportsPage = lazy(() => import("@/pages/ReportsPage"));
const TurmasDesafiosPage = lazy(() => import("@/pages/TurmasDesafiosPage"));
const SensorsPage = lazy(() => import("@/pages/SensorsPage"));
const AdminLoginPage = lazy(() => import("@/pages/AdminLoginPage"));
const AdminDashboardPage = lazy(() => import("@/pages/AdminDashboardPage"));
const UserLoginPage = lazy(() => import("@/pages/UserLoginPage"));
const StudentDashboard = lazy(() => import("@/pages/StudentDashboard"));
const ProfessoresPage = lazy(() => import("@/pages/ProfessoresPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
}

const queryClient = new QueryClient();

function AppContent() {
  const { loading, error } = useDataSync();
  useClassEngine(); // Global class engine — keeps timers alive across all routes
  useRealtimeStudents(); // Supabase Realtime — syncs student totals across all devices
  useRealtimeClassHistory(); // Supabase Realtime — syncs class sessions & participants in real time

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error("Data sync error:", error);
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Admin Routes - No Layout */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />

        {/* Academy Login - No Layout */}
        <Route path="/login" element={<PublicRoute><UserLoginPage /></PublicRoute>} />

        {/* App Routes - With Layout (Protected) */}
        <Route path="/" element={<ProtectedRoute><MonitorPage /></ProtectedRoute>} />
        <Route path="/students" element={<ProtectedRoute><StudentsPage /></ProtectedRoute>} />
        <Route path="/ranking" element={<ProtectedRoute><RankingPage /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
        <Route path="/turmas" element={<ProtectedRoute><TurmasDesafiosPage /></ProtectedRoute>} />
        <Route path="/professores" element={<ProtectedRoute><ProfessoresPage /></ProtectedRoute>} />
        <Route path="/sensors" element={<ProtectedRoute><SensorsPage /></ProtectedRoute>} />

        {/* Student Portal Routes */}
        <Route path="/student/dashboard" element={<StudentProtectedRoute><StudentDashboard /></StudentProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<CatchAllRoute />} />
      </Routes>
    </Suspense>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = !!localStorage.getItem("academy_auth");
  const isAdminAuthorized = useStore((s) => s.isAdminAuthorized);
  const currentTenant = useStore((s) => s.currentTenant);
  const location = useLocation();

  if (!isAuthenticated) {
    return <UserLoginPage />;
  }

  // If not master machine, only allow ranking and reports
  if (!isAdminAuthorized && location.pathname !== "/ranking" && location.pathname !== "/reports") {
    return <Navigate to="/ranking" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
}

function StudentProtectedRoute({ children }: { children: React.ReactNode }) {
  const isStudentAuthenticated = !!localStorage.getItem("student_auth");
  if (!isStudentAuthenticated) {
    return <UserLoginPage />;
  }
  return <StudentPortalLayout>{children}</StudentPortalLayout>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAcademyAuthenticated = !!localStorage.getItem("academy_auth");
  const isStudentAuthenticated = !!localStorage.getItem("student_auth");

  if (isAcademyAuthenticated) return <Navigate to="/" replace />;
  if (isStudentAuthenticated) return <Navigate to="/student/dashboard" replace />;
  return <>{children}</>;
}

function CatchAllRoute() {
  const isAuthenticated = !!localStorage.getItem("academy_auth");
  if (isAuthenticated) {
    return (
      <AppLayout>
        <NotFound />
      </AppLayout>
    );
  }
  return <NotFound />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
