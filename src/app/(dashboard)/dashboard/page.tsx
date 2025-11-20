// src/app/(dashboard)/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

export default async function DashboardPage() {
  const user = await getSession();

  if (!user) {
    redirect('/login');
  }

  if (user.role === 'Admin') {
    redirect('/dashboard/settings/organization');
  } else {
    redirect('/dashboard/subjects');
  }

  return null; // This page never renders UI.
}

// b91376ab-4156-4874-bebd-d918e0760ba3 userid
// 59d5ac92-75f2-4092-b65f-057eaae6566c roleid (admin)