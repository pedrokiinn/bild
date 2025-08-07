
import { CheckSquare } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2 font-bold text-lg text-primary">
      <div className="p-1">
        <CheckSquare className="h-8 w-8 text-primary" />
      </div>
      <span className="font-headline">Car Checklist</span>
    </div>
  );
}
