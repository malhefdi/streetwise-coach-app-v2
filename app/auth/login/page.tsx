'use client';

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { getSupabaseClient } from '@/core/services/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
    const supabase = getSupabaseClient();
    const router = useRouter();

    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') {
                router.push('/dashboard');
                router.refresh();
            }
        });

        return () => subscription.unsubscribe();
    }, [supabase, router]);

    return (
        <div className="flex align-items-center justify-content-center min-h-screen bg-primary-50">
            <div className="surface-card p-4 shadow-2 border-round w-full lg:w-6 xl:w-4">
                <div className="text-center mb-5">
                    <div className="text-900 text-3xl font-bold mb-3">Streetwise Coach</div>
                    <span className="text-600 font-medium line-height-3">Sign in to your coaching account</span>
                </div>

                <Auth
                    supabaseClient={supabase}
                    appearance={{
                        theme: ThemeSupa,
                        variables: {
                            default: {
                                colors: {
                                    brand: '#6366f1',
                                    brandAccent: '#4f46e5',
                                },
                            },
                        },
                        className: {
                            container: 'auth-container',
                            button: 'auth-button',
                            input: 'auth-input',
                        },
                    }}
                    providers={['google']}
                    redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`}
                    onlyThirdPartyProviders={false}
                />
            </div>
        </div>
    );
}
