import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, role, loading } = useAuth();

  // 1. While checking auth, don't render anything yet
  if (loading) {
    return <p style={{ padding: '1rem' }}>🔐 Checking access...</p>;
  }

  // 2. If not logged in, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // 3. If role is not allowed, redirect to unauthorized
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 4. Render the protected content
  return children;
};

export default ProtectedRoute;
