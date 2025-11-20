// src/app/(dashboard)/dashboard/settings/page.tsx
import { redirect } from 'next/navigation';

// This page's sole purpose is to redirect to the default settings tab.
export default function SettingsPage() {
  redirect('/dashboard/settings/organization');
}