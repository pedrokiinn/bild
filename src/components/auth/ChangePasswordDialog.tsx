
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
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { changePassword } from '@/lib/auth';

interface ChangePasswordDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({ isOpen, onOpenChange }: ChangePasswordDialogProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const resetState = () => {
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setIsSaving(false);
  }

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As novas senhas não coincidem.',
        variant: 'destructive',
      });
      return;
    }
    if (newPassword.length < 6) {
        toast({
            title: 'Erro',
            description: 'A nova senha deve ter pelo menos 6 caracteres.',
            variant: 'destructive',
        });
        return;
    }

    setIsSaving(true);
    try {
      await changePassword(newPassword);
      toast({
        title: 'Sucesso!',
        description: 'Sua senha foi alterada.',
      });
      onOpenChange(false); // This will trigger resetState via handleOpenChange
    } catch (error: any) {
      toast({
        title: 'Falha ao alterar a senha',
        description: error.message || 'Ocorreu um erro. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
        resetState();
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar Senha</DialogTitle>
          <DialogDescription>
            Defina a nova senha desejada.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova Senha</Label>
            <div className="relative">
                <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo de 6 caracteres"
                />
                 <Button type="button" variant="ghost" size="icon" className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground" onClick={() => setShowNewPassword(!showNewPassword)}>
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
            <Input
              id="confirmPassword"
              type={showNewPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handlePasswordChange} disabled={isSaving || !newPassword}>
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar Nova Senha
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
