import { Navigate } from "react-router-dom";
import { getAuthSession } from "../../utils/authSession";

export default function ProtectedRoute({ children }) {
  const session = getAuthSession();

  if (!session?.role) {
    return <Navigate to="/login" replace />;
  }

  return children;
}