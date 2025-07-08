'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { verifyEmail } from '@/lib/actions/auth';
import { Loader2 } from 'lucide-react'; 

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function VerifyEmailPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error' | 'idle'>('idle');
    const [statusMessage, setStatusMessage] = useState('Verifying your email...');

    useEffect(() => {
        const token = searchParams.get('token');

        if (!token) {
            setStatusMessage('No verification token found. Please check your link.');
            setVerificationStatus('error');
            toast.error('Verification Failed', { description: 'No token found in the URL.' });
            return;
        }

        setVerificationStatus('loading');
        setStatusMessage('Verifying your email, please wait...');

        const handleVerification = async () => {
            const { data, error } = await verifyEmail(token);

            if (data) {
                setStatusMessage('Email verified successfully! Redirecting to login...');
                setVerificationStatus('success');
                toast.success('Email Verified', { description: data.message || 'Your email has been successfully verified.' });
                setTimeout(() => {
                    router.push('/dashboard/subjects');
                }, 2000);
            } else {
                setStatusMessage(`Verification failed: ${error?.message || 'An unknown error occurred.'}`);
                setVerificationStatus('error');
                toast.error('Verification Failed', { description: error?.message || 'An error occurred during verification. You are being redirected to the signup page' });
                setTimeout(() => {
                     router.push('/signup'); // Or a specific error page
                }, 3000);
            }
        };

        handleVerification();
    }, [searchParams, router]); 

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
            <Card className="w-full max-w-md p-6 shadow-lg rounded-lg text-center">
                <CardHeader>
                    <CardTitle className="text-2xl">Email Verification</CardTitle>
                    <CardDescription>
                        {statusMessage}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center items-center h-24">
                    {verificationStatus === 'loading' && (
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    )}
                    {verificationStatus === 'success' && (
                        <span className="text-green-500 text-6xl">🎉</span> // Success emoji
                    )}
                    {verificationStatus === 'error' && (
                        <span className="text-red-500 text-6xl">❌</span> // Error emoji
                    )}
                </CardContent>
            </Card>
        </div>
    );
}