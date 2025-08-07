import { Car } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2 font-bold text-lg text-primary">
      <div className="bg-primary text-primary-foreground p-2 rounded-lg">
        <Car className="h-6 w-6" />
      </div>
      <span className="font-headline">FleetCheck Pro</span>
    </div>
  );
}
