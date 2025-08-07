

import { Car } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
            <Car className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
            <h2 className="font-bold text-foreground text-lg">CarCheck</h2>
            <p className="text-xs text-muted-foreground font-medium">Inspeção Diária</p>
        </div>
    </div>
  );
}
