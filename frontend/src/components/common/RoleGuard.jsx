import { Navigate } from "react-router-dom";
import { getAuthSession } from "../../utils/authSession";

function getDashboardPath(role) {
  switch (role) {
    case "student":
      return "/student/dashboard";
    case "advisor":
      return "/advisor/dashboard";
    case "university_admin":
      return "/admin/dashboard";
    case "super_admin":
      return "/super-admin/dashboard";
    default:
      return "/login";
  }
}

export default function RoleGuard({ allowedRole, children }) {
  const session = getAuthSession();

  if (!session?.role) {
    return <Navigate to="/login" replace />;
  }

  if (session.role !== allowedRole) {
    return <Navigate to={getDashboardPath(session.role)} replace />;
  }

  return children;
}