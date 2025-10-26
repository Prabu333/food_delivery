// src/components/ProtectedRoute.tsx
import React from "react";
import type { ReactElement } from "react";
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import type { RootState } from "../../Redux/store";

interface Props {
  children: ReactElement;
}

const ProtectedRoute: React.FC<Props> = ({ children }) => {
  const user = useSelector((state: RootState) => state.user);
  const location = useLocation();

  if (!user?.uid) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
