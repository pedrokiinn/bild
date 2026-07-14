'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger,
    SidebarInset,
    useSidebar
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Car, ClipboardCheck, Calendar, BarChart2, LogOut, Users, Loader2, Eye, EyeOff } from 'lucide-react';
import { User, login, logout, register } from '@/lib/auth';
import { Logo } from '../Logo';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '@/hooks/use-toast';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { UserProvider } from '@/context/UserContext';

const navigationItems = [
    { title: "Dashboard", url: "/dashboard", icon: BarChart2 },
    { title: "Novo Checklist", url: "/checklist", icon: ClipboardCheck },
    { title: "Histórico", url: "/history", icon: Calendar },
    { title: "Veículos", url: "/vehicle", icon: Car, adminOnly: true },
    { title: "Equipe", url: "/users", icon: Users, adminOnly: true }
];

function NavigationMenu({ user }: { user: User | null }) {
    const pathname = usePathname();
    const { isMobile, setOpenMobile } = useSidebar();

    const getFilteredNavigation = () => {
        if (!user) return [];
        if (user.role === 'admin') return navigationItems;
        return navigationItems.filter(item => !item.adminOnly);
    };

    return (
        <SidebarMenu>
            {getFilteredNavigation().map((item) => (
                <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                        asChild
                        isActive={pathname.startsWith(item.url)}
                        className={`hover:bg-primary/10 hover:text-primary transition-all duration-300 rounded-xl mb-1 ${
                            pathname.startsWith(item.url) ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-600'
                        }`}
                        onClick={() => isMobile && setOpenMobile(false)}
                    >
                        <Link href={item.url} className="flex items-center gap-3 px-4 py-3">
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium text-sm">{item.title}</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
    );
}

function LoginView({ onLoginSuccess, onSwitchToRegister }: { onLoginSuccess: (user: User) => void, onSwitchToRegister: () => void }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const user = await login(email, password);
            onLoginSuccess(user);
        } catch (error: any) {
            toast({ title: "Falha no Login", description: error.message, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md shadow-2xl border-0">
                <CardHeader className="text-center">
                    <Logo className="mx-auto mb-6" />
                    <CardTitle className="text-2xl flex items-center justify-center gap-2">Acessar Conta</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="login-email">Email</Label>
                            <Input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="seu@email.com" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="login-password">Senha</Label>
                            <div className="relative">
                                <Input id="login-password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
                                <Button type="button" variant="ghost" size="icon" className="absolute inset-y-0 right-0 h-full" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </Button>
                            </div>
                        </div>
                        <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isLoading}>
                            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Entrar'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center">
                    <p className="text-sm text-muted-foreground">Não tem uma conta? <button onClick={onSwitchToRegister} className="text-primary hover:underline font-semibold">Cadastre-se</button></p>
                </CardFooter>
            </Card>
        </div>
    );
}

function RegisterView({ onRegisterSuccess, onSwitchToLogin }: { onRegisterSuccess: () => void, onSwitchToLogin: () => void }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast({ title: "Erro de Cadastro", description: "As senhas não coincidem.", variant: 'destructive' });
            return;
        }
        setIsLoading(true);
        try {
            await register(name, email, password);
            toast({ title: "Cadastro realizado!", description: "Você já pode fazer login." });
            onRegisterSuccess();
        } catch (error: any) {
             toast({ title: "Falha no Cadastro", description: error.message, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md shadow-2xl border-0">
                <CardHeader className="text-center">
                    <Logo className="mx-auto mb-6" />
                    <CardTitle className="text-2xl">Criar Conta</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="register-name">Nome Completo</Label>
                            <Input id="register-name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Seu nome completo"/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="register-email">Email</Label>
                            <Input id="register-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="seu@email.com" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="register-password">Senha</Label>
                            <Input id="register-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Mínimo 6 caracteres" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="register-confirm-password">Repetir Senha</Label>
                            <Input id="register-confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                        </div>
                        <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isLoading}>
                            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Cadastrar'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center">
                    <p className="text-sm text-muted-foreground">Já tem uma conta? <button onClick={onSwitchToLogin} className="text-primary hover:underline font-semibold">Faça Login</button></p>
                </CardFooter>
            </Card>
        </div>
    )
}

function LayoutContent({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [authView, setAuthView] = useState<'login' | 'register'>('login');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    const snap = await getDoc(doc(db, "users", firebaseUser.uid));
                    if (snap.exists()) {
                        setUser({ id: snap.id, ...snap.data() } as User);
                    } else {
                        setUser(null);
                        await logout();
                    }
                } catch (e) {
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        await logout();
        setUser(null);
        router.push('/');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Car className="w-12 h-12 text-primary animate-pulse" />
            </div>
        )
    }

    if (!user) {
        return authView === 'login' 
            ? <LoginView onLoginSuccess={setUser} onSwitchToRegister={() => setAuthView('register')} /> 
            : <RegisterView onRegisterSuccess={() => setAuthView('login')} onSwitchToLogin={() => setAuthView('login')} />;
    }

    return (
        <UserProvider user={user}>
            <div className="min-h-screen flex w-full bg-slate-50">
                <Sidebar collapsible="icon">
                    <SidebarHeader className="p-4 border-b h-20 flex flex-col justify-center transition-all duration-300">
                      <Logo />
                    </SidebarHeader>
                    <SidebarContent className='p-3'><NavigationMenu user={user} /></SidebarContent>
                    <SidebarFooter className="p-4 border-t transition-all duration-300">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-2 bg-white rounded-xl shadow-sm overflow-hidden group-data-[state=collapsed]:p-1 group-data-[state=collapsed]:justify-center">
                                <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold shrink-0">
                                    {user.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0 group-data-[state=collapsed]:hidden animate-in fade-in duration-300">
                                    <p className="font-semibold text-sm truncate">{user.name}</p>
                                    <p className="text-xs text-slate-500 truncate capitalize">{user.role}</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full text-red-500 hover:bg-red-50 group-data-[state=collapsed]:px-2">
                                <LogOut className="w-4 h-4 mr-2 group-data-[state=collapsed]:mr-0" /> 
                                <span className="group-data-[state=collapsed]:hidden">Sair</span>
                            </Button>
                        </div>
                    </SidebarFooter>
                </Sidebar>
                <SidebarInset>
                    <header className="bg-white/80 backdrop-blur-xl border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10 h-14">
                        <SidebarTrigger className="hover:bg-primary/10 hover:text-primary transition-colors" />
                        <h1 className="font-bold text-lg text-primary lg:hidden">G3 Checklist</h1>
                        <div className="flex items-center gap-4">
                            <span className="hidden md:block text-sm font-medium text-slate-600">
                                Olá, {user.name}
                            </span>
                        </div>
                    </header>
                    <div className="flex-1 overflow-auto">{children}</div>
                </SidebarInset>
            </div>
        </UserProvider>
    );
}

export function MainLayout({ children }: { children: React.ReactNode }) {
    return <SidebarProvider><LayoutContent>{children}</LayoutContent></SidebarProvider>;
}