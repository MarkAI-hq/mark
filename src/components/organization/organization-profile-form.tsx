// src/components/organization/organization-profile-form.tsx
'use client'

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Organization } from '@/lib/types';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

// FIX: Expanded Zod schema to include all relevant fields from the DTO.
const profileSchema = z.object({
  name: z.string().min(2, { message: 'Organization name must be at least 2 characters.' }),
  type: z.string().optional(),
  country_code: z.string().optional(),
  region: z.string().optional(),
  timezone: z.string().optional(),
  address_details: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postal_code: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  contact_information: z.object({
    email: z.string().email({ message: "Invalid email address." }).optional().or(z.literal('')),
    phone: z.string().optional(),
    website: z.string().url({ message: "Invalid URL." }).optional().or(z.literal('')),
  }).optional(),
  education_system: z.string().optional(),
});

export type OrganizationProfileData = z.infer<typeof profileSchema>;

interface OrganizationProfileFormProps {
  organization: Organization;
  onSubmit: (data: OrganizationProfileData) => void;
  isSubmitting: boolean;
}

export function OrganizationProfileForm({
  organization,
  onSubmit,
  isSubmitting,
}: OrganizationProfileFormProps) {
  const form = useForm<OrganizationProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: organization.name || '',
      type: organization.type || '',
      country_code: organization.country_code || '',
      region: organization.region || '',
      timezone: organization.timezone || '',
      address_details: {
        street: organization.address_details?.street || '',
        city: organization.address_details?.city || '',
        state: organization.address_details?.state || '',
        postal_code: organization.address_details?.postal_code || '',
        country: organization.address_details?.country || '',
      },
      contact_information: {
        email: organization.contact_information?.email || '',
        phone: organization.contact_information?.phone || '',
        website: organization.contact_information?.website || '',
      },
      education_system: organization.education_system || '',
    },
  });

  // FIX: Effect to set the timezone to the user's local timezone if it's not already set.
  useEffect(() => {
    if (!form.getValues('timezone')) {
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      form.setValue('timezone', userTimezone);
    }
  }, [form]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Profile</CardTitle>
        <CardDescription>
          Update your organization&apos;s details. This information will be used in reports and communications.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* --- Basic Information --- */}
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

            {/* --- Location Information --- */}
            <div>
              <h3 className="text-lg font-medium mb-2">Location</h3>
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
                      <FormDescription>
                        Defaults to your browser&apos;s timezone if not set.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* --- Contact Information --- */}
            <div>
              <h3 className="text-lg font-medium mb-2">Contact</h3>
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
  );
}
