'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/types';

interface ResetPasswordDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (password: string) => Promise<void>;
  user: User | null;
}

export function ResetPasswordDialog({ isOpen, onOpenChange, onConfirm, user }: ResetPasswordDialogProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleConfirm = async () => {
    if (!password || password.length < 6) {
      toast({
        title: "Senha inválida",
        description: "A nova senha deve ter no mínimo 6 caracteres.",
        variant: "destructive",
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({
        title: "As senhas não coincidem",
        description: "Por favor, verifique a confirmação da nova senha.",
        variant: "destructive",
      });
      return;
    }
    setIsSaving(true);
    await onConfirm(password);
    setIsSaving(false);
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setIsSaving(false);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary"/>
            Redefinir Senha
          </DialogTitle>
          <DialogDescription>
            Você está definindo uma nova senha para o usuário <span className="font-semibold">{user?.name}</span>. O usuário precisará usar esta nova senha para fazer login.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">Nova Senha</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="pr-10"
              />
              <Button type="button" variant="ghost" size="icon" className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground" onClick={() => setShowPassword(p => !p)}>
                {showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isSaving || !password || !confirmPassword}>
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Confirmar Redefinição
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
