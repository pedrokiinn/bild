
'use client';
import React from 'react';
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
import { Car, ClipboardCheck, Calendar, BarChart2, LogOut, Menu, Settings, Users, QrCode } from 'lucide-react';
import { Badge } from '../ui/badge';
import { User, getCurrentUser, login, logout } from '@/lib/auth';
import { Logo } from '../Logo';
import QRCodeModal from '../auth/QRCodeModal';
import { SheetTitle } from '../ui/sheet';


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
    }
];

function NavigationMenu() {
    const pathname = usePathname();
    const [user, setUser] = React.useState<User | null>(null);
    const { setOpenMobile } = useSidebar();

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
        setOpenMobile(false);
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

function LayoutContent({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [user, setUser] = React.useState<User | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isQrModalOpen, setIsQrModalOpen] = React.useState(false);

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
             <>
                <QRCodeModal
                    isOpen={isQrModalOpen}
                    onClose={() => setIsQrModalOpen(false)}
                    loginUrl="https://example.com/login" // Placeholder URL
                />
                <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4">
                    <div className="text-center space-y-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg mx-auto">
                            <ClipboardCheck className="w-10 h-10 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Bem-vindo ao CarCheck</h1>
                            <p className="text-slate-600">Faça login para continuar.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
                            <Button
                                size="lg"
                                onClick={handleLogin}
                                className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/90 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                                Fazer Login
                            </Button>
                             <Button
                                size="lg"
                                variant="outline"
                                onClick={() => setIsQrModalOpen(true)}
                                className="w-full sm:w-auto"
                            >
                                <QrCode className="w-5 h-5 mr-2" />
                                Login com QR Code
                            </Button>
                        </div>
                    </div>
                </div>
            </>
        );
    }
    return (
        <div className="min-h-screen flex w-full">
            <Sidebar>
                <SheetTitle className="hidden">Menu de Navegação</SheetTitle>
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
                                        <Badge className={'bg-emerald-100 text-emerald-800 text-xs'}>
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
                    <Logo />
                    <SidebarTrigger>
                        <Menu className="w-5 h-5" />
                    </SidebarTrigger>
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
