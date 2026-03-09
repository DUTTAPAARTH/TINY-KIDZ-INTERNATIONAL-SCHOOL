import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children, allowedRoles }) => {
  const { token, role } = useSelector((state) => state.auth);

  // Missing token or role → redirect to login
  if (!token || !role) {
    return <Navigate to="/login" />;
  }

  // Token exists but role not in allowed roles → redirect to own dashboard
  if (allowedRoles && !allowedRoles.includes(role)) {
    const dashboardPaths = {
      admin: "/admin/dashboard",
      teacher: "/teacher/dashboard",
      student: "/student/dashboard",
    };
    return <Navigate to={dashboardPaths[role] || "/login"} />;
  }

  // Token valid and role allowed → render the page
  return children;
};

export default PrivateRoute;
