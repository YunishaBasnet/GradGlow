import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useTheme } from "./context/ThemeContext";

import LandingPage from "./pages/public/LandingPage";
import LoginPage from "./pages/public/LoginPage";
import GetStartedPage from "./pages/public/GetStartedPage";

import StudentDashboard from "./pages/student/StudentDashboard";
import StudentActionPlan from "./pages/student/StudentActionPlan";
import StudentCourseDetails from "./pages/student/StudentCourseDetails";
import StudentHelpSupport from "./pages/student/StudentHelpSupport";
import StudentInsights from "./pages/student/StudentInsights";
import StudentPersonalInfo from "./pages/student/StudentPersonalInfo";
import StudentRequests from "./pages/student/StudentRequests";

import AdvisorDashboard from "./pages/advisor/AdvisorDashboard";
import AdvisorAppointments from "./pages/advisor/AdvisorAppointments";
import AdvisorMessages from "./pages/advisor/AdvisorMessages";
import AdvisorProfile from "./pages/advisor/AdvisorProfile";
import AdvisorHelp from "./pages/advisor/AdvisorHelp";

import AdminDashboard from "./pages/universityAdmin/AdminDashboard";

import ProtectedRoute from "./components/common/ProtectedRoute";
import RoleGuard from "./components/common/RoleGuard";
import { getAuthSession } from "./utils/authSession";

function getDashboardPath(role) {
  switch (role) {
    case "student":
      return "/student/dashboard";
    case "advisor":
      return "/advisor/dashboard";
    case "university_admin":
      return "/admin/dashboard";
    default:
      return "/";
  }
}

function LoginEntry() {
  const session = getAuthSession();

  if (session?.role) {
    return <Navigate to={getDashboardPath(session.role)} replace />;
  }

  return <LoginPage />;
}

export default function App() {
  const { darkMode } = useTheme();

  return (
    <div className={`app ${darkMode ? "dark" : "light"}`}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginEntry />} />
          <Route path="/get-started" element={<GetStartedPage />} />

          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRole="student">
                  <StudentDashboard />
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/action-plan"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRole="student">
                  <StudentActionPlan />
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/course/:code"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRole="student">
                  <StudentCourseDetails />
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route path="/student/course-details" element={<Navigate to="/student/dashboard" replace />} />
          <Route path="/student/personal" element={<Navigate to="/student/personal-info" replace />} />
          <Route path="/student/help" element={<Navigate to="/student/help-support" replace />} />

          <Route
            path="/student/help-support"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRole="student">
                  <StudentHelpSupport />
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/insights"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRole="student">
                  <StudentInsights />
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/personal-info"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRole="student">
                  <StudentPersonalInfo />
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/requests"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRole="student">
                  <StudentRequests />
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/advisor/dashboard"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRole="advisor">
                  <AdvisorDashboard />
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/advisor/appointments"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRole="advisor">
                  <AdvisorAppointments />
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/advisor/messages"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRole="advisor">
                  <AdvisorMessages />
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/advisor/profile"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRole="advisor">
                  <AdvisorProfile />
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route path="/advisor/help" element={<AdvisorHelp />} />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRole="university_admin">
                  <AdminDashboard />
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}