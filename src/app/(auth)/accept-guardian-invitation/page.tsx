// src/app/(auth)/accept-guardian-invitation/page.tsx
'use client'

import { LineChart, CalendarCheck, CreditCard } from 'lucide-react'

import { InvitationAcceptShell, type InvitationAcceptConfig } from '@/components/auth/invitation-accept-shell'
import { peekGuardianInvitation, acceptGuardianInvitation } from '@/lib/actions/guardian'

const HIGHLIGHTS = [
  {
    icon: LineChart,
    title: "Track your child's progress",
    desc: 'Real-time grades and mastery scores as new work comes in.',
  },
  {
    icon: CalendarCheck,
    title: 'Attendance at a glance',
    desc: 'See presence, absence, and lateness without asking the school.',
  },
  {
    icon: CreditCard,
    title: 'Simple billing',
    desc: "View and pay your child's term fees directly from your dashboard.",
  },
]

const config: InvitationAcceptConfig = {
  peekInvitation: peekGuardianInvitation,
  acceptExisting: (token) => acceptGuardianInvitation({ token }),
  registerNew: (payload) => acceptGuardianInvitation(payload),

  supportsSso: false,
  resolveRedirect: () => '/guardian/dashboard',

  badgeLabel: 'Guardian access',
  heroHeadingLead: "You've been invited",
  heroHeadingHighlight: 'as a guardian.',
  heroCopy: (meta) =>
    meta
      ? `See ${meta.organizationName}'s reports, attendance and billing for your child.`
      : "Set up your account to follow your child's progress on Mirror Intelligence.",
  highlights: HIGHLIGHTS,
  invitationTitle: 'Guardian Invitation',
  formHeading: 'Set up your guardian account.',
  existingUserSuccessMessage: () => "You've been linked to your child's account. Please log in.",
  existingUserSuccessToast: 'Welcome to Mirror Intelligence!',
  registerSuccessToast: 'Welcome to Mirror Intelligence!',
  errorHelpCopy: 'Ask the school to resend your guardian invitation.',
}

export default function AcceptGuardianInvitationPage() {
  return <InvitationAcceptShell config={config} />
}
