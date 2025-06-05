'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { verifyEmail } from '@/lib/actions/auth';

export default function VerifyEmailPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [verification, setVerification] = useState<{
        status: 'loading' | 'success' | 'error' | 'idle';
        message: string;
    }>({
        status: 'idle',
        message: 'Verifying your email, please wait...',
    });

    useEffect(() => {
        const token = searchParams.get('token');

        if (!token) {
            setVerification({
                status: 'error',
                message: 'Invalid or expired email verification link. Please register or request a new link.',
            });
            return;
        }

        setVerification({
            status: 'loading',
            message: 'Verifying your email, please wait...',
        });

        const handleVerification = async () => {
            const { data, error } = await verifyEmail(token);

            if (data) {
                setVerification({
                    status: 'success',
                    message: 'Email verified successfully! Redirecting to login...',
                });
                setTimeout(() => {
                    router.push('/login');
                }, 2000);
            }
            if (error) {
                setVerification({
                    status: 'error',
                    message: error.message,
                });
            }
        };

        handleVerification();
    }, [searchParams, router]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
            <Card className="w-full max-w-md p-6 shadow-lg rounded-lg text-center">
                <CardHeader>
                    <CardTitle className="text-2xl">Email Verification</CardTitle>
                    <CardDescription aria-live="polite">
                        {verification.message}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center items-center h-24">
                    {verification.status === 'loading' && (
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    )}
                    {verification.status === 'success' && (
                        <span className="text-green-500 text-6xl">🎉 {verification.message}</span>
                    )}
                    {verification.status === 'error' && (
                        <span className="text-red-500 text-6xl">❌ {verification.message}</span>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}