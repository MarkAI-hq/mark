// src/app/(auth)/accept-invitation/page.tsx
'use client'

import { ShieldCheck, BookOpen, BarChart2 } from 'lucide-react'

import { InvitationAcceptShell, type InvitationAcceptConfig } from '@/components/auth/invitation-accept-shell'
import { peekInvitation, acceptInvitation, registerInvited } from '@/lib/actions/auth'

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Your classes, your way',
    desc: 'Access and manage your assigned classes and learner profiles.',
  },
  {
    icon: BookOpen,
    title: 'Full assessment control',
    desc: 'Create exams, assessments and marking guides with complete access.',
  },
  {
    icon: BarChart2,
    title: 'Learner insights',
    desc: 'View student performance and analytics across your classes.',
  },
]

const config: InvitationAcceptConfig = {
  peekInvitation,
  acceptExisting: acceptInvitation,
  registerNew: registerInvited,

  supportsSso: true,
  ssoReturnUrl: '/dashboard/teacher',
  resolveRedirect: (user) => {
    const role = user?.roles?.[0]
    return role === 'Teacher' ? '/dashboard/teacher' : '/dashboard'
  },

  badgeLabel: 'Teaching Intelligence',
  heroHeadingLead: "You've been",
  heroHeadingHighlight: 'invited.',
  heroCopy: (meta) =>
    meta
      ? `Complete your account to join ${meta.organizationName}.`
      : "Your account is being set up. Here's what you'll have access to as a teacher.",
  highlights: FEATURES,
  invitationTitle: 'Accept Invitation',
  roleSuffix: () => ' as a Teacher',
  formHeading: 'Complete your account.',
  existingUserSuccessMessage: (organizationName) => `You've been added to ${organizationName}. Please log in.`,
  existingUserSuccessToast: 'Welcome aboard!',
  registerSuccessToast: 'Welcome aboard!',
  errorHelpCopy: 'Contact your administrator to resend the invitation.',
}

export default function AcceptInvitationPage() {
  return <InvitationAcceptShell config={config} />
}
