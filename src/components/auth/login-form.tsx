'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { authenticate } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { AlertCircle, ShieldCheck, Award, Lock, ArrowRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button className="w-full h-12 text-base font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/25" aria-disabled={pending} disabled={pending}>
            {pending ? 'Signing in...' : (
                <span className="flex items-center justify-center gap-2">
                    Sign In <ArrowRight className="w-5 h-5" />
                </span>
            )}
        </Button>
    );
}

export function LoginForm() {
    const [errorMessage, dispatch] = useFormState(authenticate, undefined);

    return (
        <div className="w-full max-w-[420px] animate-in fade-in zoom-in duration-500">
            <Card className="shadow-2xl shadow-blue-500/10 border-0 overflow-hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl">
                <CardHeader className="space-y-2 pt-8 pb-6 text-center">
                    <CardTitle className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Welcome Back</CardTitle>
                    <CardDescription className="text-gray-500 dark:text-gray-400 text-base">
                        Sign in to access your school portal
                    </CardDescription>
                </CardHeader>
                <form action={dispatch}>
                    <CardContent className="grid gap-5 px-8">
                        <div className="grid gap-2">
                            <Label htmlFor="email" className="text-gray-700 dark:text-gray-300 font-semibold flex gap-1">
                                Username or Email <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="Enter your username or email"
                                required
                                className="h-12 bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:ring-primary focus:border-primary transition-all"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password" className="text-gray-700 dark:text-gray-300 font-semibold flex gap-1">
                                Password <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="Enter your password"
                                required
                                className="h-12 bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:ring-primary focus:border-primary transition-all"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="role" className="text-gray-700 dark:text-gray-300 font-semibold flex gap-1">
                                Select Role <span className="text-red-500">*</span>
                            </Label>
                            <Select name="role" required>
                                <SelectTrigger className="h-12 bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                                    <SelectValue placeholder="Choose your role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Administrator</SelectItem>
                                    <SelectItem value="teacher">Teacher</SelectItem>
                                    <SelectItem value="student">Student</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary mt-0.5" />
                                Remember me
                            </label>
                            <a href="#" className="text-sm font-semibold text-primary hover:underline underline-offset-4">
                                Forgot Password?
                            </a>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-6 p-8 pt-6">
                        <SubmitButton />

                        {errorMessage && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
                                <AlertCircle className="h-4 w-4" />
                                <p>{errorMessage}</p>
                            </div>
                        )}

                        <div className="w-full pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-3 gap-2">
                            <div className="flex flex-col items-center gap-1.5 text-center">
                                <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
                                    <ShieldCheck className="w-4 h-4" />
                                </div>
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight leading-none">Secure<br />Login</span>
                            </div>
                            <div className="flex flex-col items-center gap-1.5 text-center border-x border-gray-100 dark:border-gray-800 px-2">
                                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                                    <Award className="w-4 h-4" />
                                </div>
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight leading-none">CBSE/ICSE<br />Compliant</span>
                            </div>
                            <div className="flex flex-col items-center gap-1.5 text-center">
                                <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600">
                                    <Lock className="w-4 h-4" />
                                </div>
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight leading-none">Data<br />Protected</span>
                            </div>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
