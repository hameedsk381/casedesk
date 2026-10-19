'use client';

import React, { createContext, useContext } from 'react';
import { allowAllPermissions, type WorkspacePermissions } from '@/lib/auth/permissionTypes';

const ALLOW_ALL = allowAllPermissions();

const CasePermissionsContext = createContext<WorkspacePermissions | null>(null);

/**
 * Supplies the signed-in user's permissions for the case being viewed so any
 * descendant tab can hide or disable actions it is not allowed to perform.
 */
export function CasePermissionsProvider({
  permissions,
  children,
}: {
  permissions: WorkspacePermissions;
  children: React.ReactNode;
}) {
  return (
    <CasePermissionsContext.Provider value={permissions}>{children}</CasePermissionsContext.Provider>
  );
}

/** The current case's permissions. Allows everything outside a case context. */
export function useCasePermissions(): WorkspacePermissions {
  return useContext(CasePermissionsContext) ?? ALLOW_ALL;
}
