// src/components/auth/role-guard.tsx
'use client'

import { useAuth } from '@/hooks/use-auth';
import React from 'react';

interface RoleGuardProps {
  requiredRole: string;
  children: React.ReactNode;
}

export function RoleGuard({ requiredRole, children }: RoleGuardProps) {
  const { user } = useAuth();

  // render nothing.
  if (!user || user.role !== requiredRole) {
    return null;
  }

  // If the user has the required role, render the children.
  return <>{children}</>;
}