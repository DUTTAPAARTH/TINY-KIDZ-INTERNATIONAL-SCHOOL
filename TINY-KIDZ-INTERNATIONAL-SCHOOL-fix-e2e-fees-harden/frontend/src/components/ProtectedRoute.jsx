import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { getAuthToken } from "../utils/authSession";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { token, role } = useSelector((state) => state.auth);
  const hasToken = Boolean(token || getAuthToken());

  if (!hasToken) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    if (role === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (role === "teacher") return <Navigate to="/teacher/dashboard" replace />;
    if (role === "student") return <Navigate to="/student/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
