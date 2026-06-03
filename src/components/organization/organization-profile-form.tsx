// src/components/organization/organization-profile-form.tsx
'use client'

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Copy, Check, GraduationCap } from 'lucide-react';
import { Organization } from '@/lib/types';
import {
  Form, FormControl, FormField, FormItem,
  FormLabel, FormMessage, FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

const profileSchema = z.object({
  name:        z.string().min(2, { message: 'Organization name must be at least 2 characters.' }),
  school_code: z.string().min(2).max(20).optional(),
  type:        z.string().optional(),
  country_code:     z.string().optional(),
  region:           z.string().optional(),
  timezone:         z.string().optional(),
  address_details: z.object({
    street:      z.string().optional(),
    city:        z.string().optional(),
    state:       z.string().optional(),
    postal_code: z.string().optional(),
    country:     z.string().optional(),
  }).optional(),
  contact_information: z.object({
    email:   z.string().email({ message: 'Invalid email address.' }).optional().or(z.literal('')),
    phone:   z.string().optional(),
    website: z.string().url({ message: 'Invalid URL.' }).optional().or(z.literal('')),
  }).optional(),
  education_system: z.string().optional(),
});

export type OrganizationProfileData = z.infer<typeof profileSchema>;

interface OrganizationProfileFormProps {
  organization:  Organization;
  onSubmit:      (data: OrganizationProfileData) => void;
  isSubmitting:  boolean;
}

export function OrganizationProfileForm({
  organization,
  onSubmit,
  isSubmitting,
}: OrganizationProfileFormProps) {
  const [copied, setCopied] = useState(false);

  const form = useForm<OrganizationProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name:        organization.name || '',
      school_code: organization.school_code || '',
      type:        organization.type || '',
      country_code:     organization.country_code || '',
      region:           organization.region || '',
      timezone:         organization.timezone || '',
      address_details: {
        street:      organization.address_details?.street || '',
        city:        organization.address_details?.city || '',
        state:       organization.address_details?.state || '',
        postal_code: organization.address_details?.postal_code || '',
        country:     organization.address_details?.country || '',
      },
      contact_information: {
        email:   organization.contact_information?.email || '',
        phone:   organization.contact_information?.phone || '',
        website: organization.contact_information?.website || '',
      },
      education_system: organization.education_system || '',
    },
  });

  useEffect(() => {
    if (!form.getValues('timezone')) {
      form.setValue('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
  }, [form]);

  const schoolCode = form.watch('school_code') || organization.school_code;

  const handleCopy = () => {
    if (!schoolCode) return;
    navigator.clipboard.writeText(schoolCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">

      {/* ── Student Portal Access Card ─────────────────────────────────────── */}
      <Card className="border-amber-200 bg-amber-50/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-amber-600" />
            Student Portal Access
          </CardTitle>
          <CardDescription>
            Share this code with students so they can log in at{' '}
            <span className="font-medium text-foreground">/student/login</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="font-mono text-xl px-5 py-2.5 tracking-[0.3em] border-amber-300 text-amber-700 bg-white font-bold"
            >
              {schoolCode || '—'}
            </Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={!schoolCode}
              className="gap-1.5"
            >
              {copied
                ? <><Check className="h-3.5 w-3.5 text-green-500" /> Copied</>
                : <><Copy className="h-3.5 w-3.5" /> Copy</>
              }
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Students log in with: <strong>School Code</strong> + <strong>Student ID</strong> + <strong>PIN</strong>.
            You can change the code below — students will need the new code to log in.
          </p>
        </CardContent>
      </Card>

      {/* ── Organization Profile Form ──────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Profile</CardTitle>
          <CardDescription>
            Update your organization&apos;s details. This information is used in reports and communications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              {/* Basic */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl><Input placeholder="Your Organization's Name" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="school_code"
                  render={({ field }) => (
                    <FormItem className="max-w-xs">
                      <FormLabel>School Code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. MIR-2025"
                          className="font-mono tracking-widest uppercase"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      </FormControl>
                      <FormDescription>
                        Must be unique. Changing this requires all students to use the new code.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Type</FormLabel>
                        <FormControl><Input placeholder="e.g., School, University" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="education_system"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Education System</FormLabel>
                        <FormControl><Input placeholder="e.g., National Curriculum" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Location */}
              <div>
                <h3 className="text-lg font-medium mb-4">Location</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="address_details.country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address_details.state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State / Region</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timezone</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormDescription>Defaults to your browser&apos;s timezone if not set.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Contact */}
              <div>
                <h3 className="text-lg font-medium mb-4">Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contact_information.email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Public Email</FormLabel>
                        <FormControl><Input placeholder="contact@example.com" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact_information.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Public Phone</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}