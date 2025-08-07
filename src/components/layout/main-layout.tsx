
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  ClipboardCheck,
  Car,
  Calendar,
  LogOut,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Logo } from '../Logo';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Separator } from '../ui/separator';

const navigationItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: BarChart3,
  },
  {
    title: 'Novo Checklist',
    url: '/checklist',
    icon: ClipboardCheck,
  },
  {
    title: 'Histórico',
    url: '/history',
    icon: Calendar,
  },
  {
    title: 'Meus Veículos',
    url: '/vehicle',
    icon: Car,
  },
];

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
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
                  tooltip={{
                    children: item.title,
                    className: "w-max",
                  }}
                >
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter>
          <Separator className="my-2"/>
          <SidebarGroup>
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src="https://placehold.co/100x100" data-ai-hint="male avatar" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <span className="font-semibold text-sm truncate">John Doe</span>
                <span className="text-xs text-muted-foreground truncate">john.doe@example.com</span>
              </div>
              <Button variant="ghost" size="icon" className="ml-auto">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </SidebarGroup>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="md:hidden flex flex-col items-start p-4 bg-background border-b sticky top-0 z-10">
          <div className="flex justify-between w-full items-center mb-2">
            <Logo />
            <SidebarTrigger />
          </div>
        </header>
        <main className="p-4 md:p-6 lg:p-8">
            <div className="hidden md:flex items-center mb-6">
                <SidebarTrigger />
            </div>
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
