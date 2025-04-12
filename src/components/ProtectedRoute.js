import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth"; // custom hook we’ll create

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, role } = useAuth();

  if (!currentUser) return <Navigate to="/login" />;
  if (!allowedRoles.includes(role)) return <Navigate to="/unauthorized" />;

  return children;
};

export default ProtectedRoute;
