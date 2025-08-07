'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger,
    SidebarInset
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Car, ClipboardCheck, Calendar, Users, BarChart2, LogOut, Menu, Settings } from 'lucide-react';
import { Badge } from '../ui/badge';
import { User, getCurrentUser, login, logout } from '@/lib/auth';
import { Logo } from '../Logo';

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
    },
];

export function MainLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = React.useState<User | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        checkUser();
    }, []);

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

    const handleLogin = async () => {
        await login();
        await checkUser();
        router.refresh();
    }

    const handleLogout = async () => {
        await logout();
        setUser(null);
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
                <div className="text-center space-y-6">
                     <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg mx-auto">
                        <Car className="w-10 h-10 text-primary-foreground" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Bem-vindo ao FleetCheck Pro</h1>
                        <p className="text-slate-600">Faça login para continuar.</p>
                    </div>
                    <Button 
                        size="lg"
                        onClick={handleLogin}
                        className="bg-gradient-to-r from-primary to-primary/90 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        Fazer Login
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <SidebarProvider>
            <div className="min-h-screen flex w-full">
                <Sidebar>
                    <SidebarHeader>
                        <Logo />
                    </SidebarHeader>
                    
                    <SidebarContent>
                        <SidebarMenu>
                            {navigationItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton 
                                        asChild 
                                        isActive={pathname.startsWith(item.url)}
                                        className={`hover:bg-primary/10 hover:text-primary transition-all duration-300 rounded-xl mb-1 ${
                                            pathname.startsWith(item.url)
                                                ? 'bg-primary/10 text-primary font-semibold' 
                                                : 'text-slate-600'
                                        }`}
                                    >
                                        <Link href={item.url} className="flex items-center gap-3 px-4 py-3">
                                            <item.icon className="w-5 h-5" />
                                            <span className="font-medium text-sm">{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarContent>

                    <SidebarFooter>
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
                                            <Badge className={'bg-emerald-100 text-emerald-800'}>
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
                    <header className="bg-background/80 backdrop-blur-xl border-b px-6 py-4 flex items-center justify-between lg:hidden">
                        <Logo />
                        <SidebarTrigger>
                            <Menu className="w-5 h-5" />
                        </SidebarTrigger>
                    </header>
                    
                    <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
                        {children}
                    </main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}