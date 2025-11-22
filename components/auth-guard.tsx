'use client';

import { usePrivy } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, Shield, Zap, ArrowRight } from 'lucide-react';
import { ReactNode, useEffect, useState } from 'react';
import Image from 'next/image';

export default function AuthGuard({ children }: { children: ReactNode }) {
    const { ready, authenticated, login } = usePrivy();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Show nothing during SSR to prevent hydration mismatch
    if (!mounted) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!ready) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!authenticated) {
        return (
            <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
                {/* Background Image */}
                <div className="absolute inset-0">
                    <Image
                        src="/doodles.jpg"
                        alt="Background"
                        fill
                        className="object-cover"
                        priority
                        quality={100}
                    />
                    <div className="absolute inset-0 bg-background/90 "></div>
                </div>

                {/* Animated overlay elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -left-1/4 top-0 h-96 w-96 rounded-full bg-primary/10 blur-3xl"></div>
                    <div className="absolute -right-1/4 bottom-0 h-96 w-96 rounded-full bg-secondary/10 blur-3xl"></div>
                    <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-2xl"></div>
                </div>

                <div className="relative z-10 w-full max-w-5xl">
                    <div className="grid gap-8 md:grid-cols-2 md:gap-12 items-center">
                        {/* Left side - Branding & Image */}
                        <div className="space-y-6 text-center md:text-left order-2 md:order-1">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/80 backdrop-blur-sm px-4 py-2">
                                    <Sparkles className="h-4 w-4 text-primary" />
                                    <span className="text-sm font-medium text-primary">Powered by AI</span>
                                </div>
                                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                                    <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent drop-shadow-lg">
                                        Fluid Agent
                                    </span>
                                </h1>
                                <div className="inline-block rounded-2xl border border-primary/20 bg-card/90 backdrop-blur-md px-6 py-4 shadow-xl">
                                    <p className="text-lg text-foreground leading-relaxed">
                                        Experience the future of AI-powered agents. Deploy, monetize, and scale intelligent solutions with seamless blockchain integration.
                                    </p>
                                </div>
                            </div>

                            {/* Feature highlights */}
                            <div className="space-y-3 rounded-2xl border border-primary/10 bg-card/80 backdrop-blur-sm p-6 shadow-lg">
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
                                        <Shield className="h-4 w-4 text-primary" />
                                    </div>
                                    <span className="text-foreground font-medium">Secure blockchain-based payments</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
                                        <Zap className="h-4 w-4 text-primary" />
                                    </div>
                                    <span className="text-foreground font-medium">Instant agent deployment</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
                                        <Sparkles className="h-4 w-4 text-primary" />
                                    </div>
                                    <span className="text-foreground font-medium">Model Context Protocol integration</span>
                                </div>
                            </div>
                        </div>

                        {/* Right side - Auth Card */}
                        <div className="order-1 md:order-2">
                            <Card className="border-primary/10 shadow-2xl backdrop-blur-sm bg-card/95 rounded-3xl overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none"></div>
                                <CardHeader className="relative text-center space-y-4 pb-8 pt-12">
                                    <div className="mx-auto mb-2 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-lg">
                                        <Sparkles className="h-10 w-10 text-white" />
                                    </div>
                                    <CardTitle className="text-3xl font-bold tracking-tight">
                                        Welcome Back
                                    </CardTitle>
                                    <CardDescription className="text-base leading-relaxed px-4">
                                        Sign in to access the{" "}
                                        <span className="font-semibold text-primary">Fluid Marketplace</span> and start building with AI agents
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="relative space-y-6 pb-12">
                                    <Button 
                                        onClick={login} 
                                        className="group relative w-full h-14 text-lg font-semibold rounded-2xl bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/25 transition-all duration-300" 
                                        size="lg"
                                    >
                                        <span className="flex items-center gap-2">
                                            Sign In
                                            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                        </span>
                                    </Button>

                                    <div className="space-y-3 pt-2">
                                        <div className="relative">
                                            <div className="absolute inset-0 flex items-center">
                                                <span className="w-full border-t border-border/50"></span>
                                            </div>
                                            <div className="relative flex justify-center text-xs uppercase">
                                                <span className="bg-card px-2 text-muted-foreground">Secure & Decentralized</span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-center text-muted-foreground px-6">
                                            Your wallet, your data. We use industry-standard encryption and blockchain technology to keep your assets secure.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
