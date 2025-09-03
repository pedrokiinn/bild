
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
import { Car, ClipboardCheck, Calendar, BarChart2, LogOut, Menu, Users, FileText, Loader2, ArrowRight } from 'lucide-react';
import { User, getCurrentUser, login, logout, register } from '@/lib/auth';
import { Logo } from '../Logo';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '@/hooks/use-toast';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"


const navigationItems = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: BarChart2,
    },
    {
        title: "Novo Checklist",
        url: "/checklist",
        icon: ClipboardCheck,
    },
    {
        title: "Histórico",
        url: "/history",
        icon: Calendar,
    },
    {
        title: "Meus Veículos",
        url: "/vehicle",
        icon: Car,
        adminOnly: true,
    },
    {
        title: "Usuários",
        url: "/users",
        icon: Users,
        adminOnly: true,
    },
    {
        title: "Relatórios",
        url: "/reports",
        icon: FileText,
        adminOnly: true
    }
];

function NavigationMenu({ user }: { user: User | null }) {
    const pathname = usePathname();
    const { isMobile, setOpenMobile } = useSidebar();

    const getFilteredNavigation = () => {
        if (!user) return [];
        if (user.role === 'admin') return navigationItems;
        return navigationItems.filter(item => !item.adminOnly);
    };

    const handleLinkClick = () => {
        if(isMobile) {
            setOpenMobile(false);
        }
    }

    return (
        <SidebarMenu>
            {getFilteredNavigation().map((item) => (
                <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                        asChild
                        isActive={pathname.startsWith(item.url)}
                        className={`hover:bg-primary/10 hover:text-primary transition-all duration-300 rounded-xl mb-1 ${
                            pathname.startsWith(item.url)
                                ? 'bg-primary/10 text-primary font-semibold'
                                : 'text-slate-600'
                        }`}
                        onClick={handleLinkClick}
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
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const user = await login(email, password);
            onLoginSuccess(user);
        } catch (error: any) {
            toast({
                title: "Falha no Login",
                description: error.message || "Ocorreu um erro. Tente novamente.",
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md p-4 sm:p-6">
            <CardHeader className="text-center">
                <Logo className="mx-auto mb-6" />
                <CardTitle className="text-2xl flex items-center justify-center gap-2">
                    <ArrowRight className="w-6 h-6" />
                    Acessar sua Conta
                </CardTitle>
                <CardDescription>Use seu email e senha para continuar.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <Input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="seu@email.com" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="login-password">Senha</Label>
                        <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
                    </div>
                    <Button type="submit" className="w-full bg-green-500 hover:bg-green-600" disabled={isLoading}>
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Entrar
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="justify-center">
                <p className="text-sm text-muted-foreground">
                    Não tem uma conta?{' '}
                    <button onClick={onSwitchToRegister} className="text-primary hover:underline font-semibold">
                        Cadastre-se
                    </button>
                </p>
            </CardFooter>
        </Card>
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
            toast({
                title: "Erro de Cadastro",
                description: "As senhas não coincidem.",
                variant: 'destructive',
            });
            return;
        }
        setIsLoading(true);
        try {
            await register(name, email, password);
            toast({
                title: "Cadastro realizado!",
                description: "Você já pode fazer login com suas novas credenciais.",
            });
            onRegisterSuccess();
        } catch (error: any) {
             toast({
                title: "Falha no Cadastro",
                description: error.message || "Ocorreu um erro. Tente novamente.",
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md p-4 sm:p-6">
            <CardHeader className="text-center">
                <Logo className="mx-auto mb-6" />
                <CardTitle className="text-2xl">Criar Conta</CardTitle>
                <CardDescription>Crie uma nova conta para acessar o sistema.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="register-name">Nome de Usuário</Label>
                        <Input id="register-name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Seu nome de exibição"/>
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
                    <Button type="submit" className="w-full bg-green-500 hover:bg-green-600" disabled={isLoading}>
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Cadastrar
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="justify-center">
                <p className="text-sm text-muted-foreground">
                    Já tem uma conta?{' '}
                    <button onClick={onSwitchToLogin} className="text-primary hover:underline font-semibold">
                        Faça Login
                    </button>
                </p>
            </CardFooter>
        </Card>
    )
}


function LayoutContent({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [authView, setAuthView] = useState<'login' | 'register'>('login');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const userProfile = await getCurrentUser();
                setUser(userProfile);
            } else {
                setUser(null);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleAuthSuccess = (loggedInUser: User) => {
        setUser(loggedInUser);
        router.refresh();
    }
    
    const handleRegisterSuccess = () => {
        setAuthView("login");
    }

    const handleLogout = async () => {
        await logout();
        setUser(null);
        router.push('/');
        router.refresh();
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <Car className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
                    <p className="text-slate-600">Carregando...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex w-full">
            {user ? (
                <>
                    <Sidebar>
                        <SidebarHeader className="p-6 border-b border-slate-200/60 group-data-[state=collapsed]:hidden">
                            <Logo />
                        </SidebarHeader>

                        <SidebarContent className='p-3'>
                            <NavigationMenu user={user} />
                        </SidebarContent>

                        <SidebarFooter className="p-6 border-t border-slate-200/60 group-data-[state=collapsed]:hidden">
                            {user && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-slate-400 to-slate-500 rounded-full flex items-center justify-center">
                                            <span className="text-white font-semibold text-sm">
                                                {user.name.charAt(0)?.toUpperCase() || 'U'}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-900 text-sm truncate" title={user.name}>
                                                {user.name || 'Usuário'}
                                            </p>
                                            <p className="text-xs text-slate-500 truncate" title={user.email}>{user.email}</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleLogout}
                                        className="w-full"
                                    >
                                        <LogOut className="w-4 h-4 mr-2" />
                                        Sair
                                    </Button>
                                </div>
                            )}
                        </SidebarFooter>
                    </Sidebar>

                    <SidebarInset>
                         <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-4 py-3 flex items-center justify-between lg:hidden">
                            <div className="flex items-center gap-2">
                                <SidebarTrigger>
                                    <Menu className="w-5 h-5" />
                                </SidebarTrigger>
                                <h1 className="font-semibold text-lg">{navigationItems.find(item => pathname.startsWith(item.url))?.title || 'CarCheck'}</h1>
                            </div>
                        </header>

                        <main className="flex-1 overflow-auto">
                            {children}
                        </main>
                    </SidebarInset>
                </>
            ) : (
                <div className="w-full flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-gray-100">
                    {authView === 'login' ? (
                        <LoginView onLoginSuccess={handleAuthSuccess} onSwitchToRegister={() => setAuthView('register')} />
                    ) : (
                        <RegisterView onRegisterSuccess={handleRegisterSuccess} onSwitchToLogin={() => setAuthView('login')} />
                    )}
                </div>
            )}
        </div>
    );
}

export function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <LayoutContent>{children}</LayoutContent>
        </SidebarProvider>
    )
}
