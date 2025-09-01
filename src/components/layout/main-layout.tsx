
'use client';
import React, { useState } from 'react';
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
import { Car, ClipboardCheck, Calendar, BarChart2, LogOut, Menu, Users, FileText, Loader2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { User, getCurrentUser, login, logout, register } from '@/lib/auth';
import { Logo } from '../Logo';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"


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

function NavigationMenu() {
    const pathname = usePathname();
    const [user, setUser] = React.useState<User | null>(null);
    const { setOpenMobile, isMobile } = useSidebar();

     React.useEffect(() => {
        const checkUser = async () => {
            const currentUser = await getCurrentUser();
            setUser(currentUser);
        };
        checkUser();
    }, []);

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

function LoginTab({ onLoginSuccess }: { onLoginSuccess: () => void }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await login(username, password);
            onLoginSuccess();
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
        <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="login-username">Usuário</Label>
                <Input id="login-username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="login-password">Senha</Label>
                <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Entrar
            </Button>
        </form>
    )
}

function RegisterTab({ onRegisterSuccess }: { onRegisterSuccess: () => void }) {
    const [username, setUsername] = useState('');
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
            await register(username, password);
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
        <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="register-username">Colaborador</Label>
                <Input id="register-username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="register-password">Senha</Label>
                <Input id="register-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
             <div className="space-y-2">
                <Label htmlFor="register-confirm-password">Repetir Senha</Label>
                <Input id="register-confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
                 {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Cadastrar
            </Button>
        </form>
    )
}


function LayoutContent({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = React.useState<User | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState("login");

    const checkUser = async () => {
        setIsLoading(true);
        try {
            const currentUser = await getCurrentUser();
            setUser(currentUser);
        } catch (error) {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        checkUser();
    }, []);

    const handleAuthSuccess = () => {
        checkUser();
        router.refresh();
    }
    
    const handleRegisterSuccess = () => {
        setActiveTab("login");
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
                <Car className="w-12 h-12 text-primary animate-pulse" />
            </div>
        )
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4">
                <div className="w-full max-w-md mx-auto">
                     <div className="text-center space-y-4 mb-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg mx-auto">
                            <ClipboardCheck className="w-10 h-10 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Bem-vindo ao CarCheck</h1>
                            <p className="text-slate-600">Faça login ou cadastre-se para continuar.</p>
                        </div>
                    </div>
                     <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="login">Entrar</TabsTrigger>
                            <TabsTrigger value="register">Cadastrar</TabsTrigger>
                        </TabsList>
                        <TabsContent value="login">
                           <LoginTab onLoginSuccess={handleAuthSuccess} />
                        </TabsContent>
                        <TabsContent value="register">
                           <RegisterTab onRegisterSuccess={handleRegisterSuccess} />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        );
    }
    return (
        <div className="min-h-screen flex w-full">
            <Sidebar>
                <SidebarHeader className="p-6 border-b border-slate-200/60 group-data-[state=collapsed]:hidden">
                    <Logo />
                </SidebarHeader>

                <SidebarContent className='p-3'>
                    <NavigationMenu />
                </SidebarContent>

                <SidebarFooter className="p-6 border-t border-slate-200/60 group-data-[state=collapsed]:hidden">
                    {user && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-slate-400 to-slate-500 rounded-full flex items-center justify-center">
                                    <span className="text-white font-semibold text-sm">
                                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-slate-900 text-sm truncate">
                                        {user.name || 'Usuário'}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Badge className={user.role === 'admin' ? 'bg-emerald-100 text-emerald-800 text-xs' : 'bg-blue-100 text-blue-800 text-xs'}>
                                            {user.role}
                                        </Badge>
                                    </div>
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
