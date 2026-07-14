
'use client';
import { Car } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <div className={cn(
      "flex items-center transition-all duration-300",
      isCollapsed ? "justify-center w-full" : "gap-3 px-2",
      className
    )}>
        <div className="shrink-0 w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg transition-transform hover:scale-105">
            <Car className="w-6 h-6 text-primary-foreground" />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col overflow-hidden whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
              <h2 className="font-bold text-foreground text-lg leading-tight">G3 Checklist</h2>
              <p className="text-xs text-muted-foreground font-medium">Inspeção Diária</p>
          </div>
        )}
    </div>
  );
}
