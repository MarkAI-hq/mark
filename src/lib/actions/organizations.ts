// src/lib/actions/organizations.ts
'use server'

import { revalidatePath } from 'next/cache'
import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse, Organization } from '@/lib/types'

export interface OrganizationUser {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  email_verified: boolean;
  onboarding_complete: boolean;
  created_at: string;
  role: string | null;
}

interface InvitationResponse {
  message: string;
  invitation_id: string;
  expires_at: string;
}

export async function getOrganizationDetails(
  organizationId: string,
): Promise<ServerActionResponse<Organization>> {
  if (!organizationId) {
    return { data: null, error: { message: 'Organization ID is required.' } };
  }
  return await fetcher<Organization>(`/organizations/${organizationId}`);
}

export async function getOrganizationUsers(
  organizationId: string,
): Promise<ServerActionResponse<OrganizationUser[]>> {
  if (!organizationId) {
    return { data: null, error: { message: 'Organization ID is required.' } };
  }
  return await fetcher<OrganizationUser[]>(`/organizations/${organizationId}/users`);
}

export async function inviteUserToOrganization(
  organizationId: string,
  email: string,
  role: string,
): Promise<ServerActionResponse<InvitationResponse>> {
  try {
    const response = await fetcher<InvitationResponse>(
      `/organizations/${organizationId}/invite`,
      {
        method: 'POST',
        body: JSON.stringify({ email, role }),
      },
    );

    if (response.error) {
      throw new Error(response.error.message);
    }

    revalidatePath('/dashboard/settings/members');
    return { data: response.data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    return { data: null, error: { message } };
  }
}

export async function acceptOrganizationInvitation(
  token: string,
): Promise<ServerActionResponse<{ message: string }>> {
  try {
    const response = await fetcher<{ message: string }>(
      '/organizations/accept-invitation',
      {
        method: 'POST',
        body: JSON.stringify({ token }),
      },
    );

    if (response.error) {
      throw new Error(response.error.message);
    }

    return { data: response.data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    return { data: null, error: { message } };
  }
}

export async function removeUserFromOrganization(
  organizationId: string,
  userId: string,
): Promise<ServerActionResponse<{ message: string }>> {
  try {
    const response = await fetcher<{ message: string }>(
      `/organizations/${organizationId}/users/${userId}`,
      {
        method: 'DELETE',
      },
    );

    if (response.error) {
      throw new Error(response.error.message);
    }

    revalidatePath('/dashboard/settings/members');
    return { data: response.data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    return { data: null, error: { message } };
  }
}

export async function updateUserRole(
  organizationId: string,
  userId: string,
  role: 'Admin' | 'Teacher',
): Promise<ServerActionResponse<{ message: string }>> {
  try {
    const response = await fetcher<{ message: string }>(
      `/organizations/${organizationId}/users/${userId}/role`,
      {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      },
    );

    if (response.error) {
      throw new Error(response.error.message);
    }

    revalidatePath('/dashboard/settings/members');
    return { data: response.data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    return { data: null, error: { message } };
  }
}

/**
 * NEW: Server Action to update an organization's details.
 * @param organizationId The UUID of the organization to update.
 * @param data The partial data to update.
 * @returns A ServerActionResponse containing the updated organization.
 */
export async function getAvailableRoles(): Promise<ServerActionResponse<{ role_id: string; role_name: string; description: string | null }[]>> {
  try {
    const response = await fetcher<{ role_id: string; role_name: string; description: string | null }[]>('/roles')
    return { data: response.data, error: response.error }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred'
    return { data: null, error: { message } }
  }
}

export async function updateOrganization(
  organizationId: string,
  data: Partial<Omit<Organization, 'organization_id'>>,
): Promise<ServerActionResponse<Organization>> {
  try {
    const response = await fetcher<Organization>(
      `/organizations/${organizationId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
    );

    if (response.error) {
      throw new Error(response.error.message);
    }

    // Revalidate the settings page to show the updated details
    revalidatePath('/dashboard/settings/organization');
    return { data: response.data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    return { data: null, error: { message } };
  }
}
