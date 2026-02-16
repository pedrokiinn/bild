
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
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sendPasswordReset } from '@/lib/auth';

interface ForgotPasswordDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ForgotPasswordDialog({ isOpen, onOpenChange }: ForgotPasswordDialogProps) {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSendLink = async () => {
    if (!email) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira seu email.',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    try {
      await sendPasswordReset(email);
      toast({
        title: 'Link enviado!',
        description: 'Se o email estiver cadastrado, um link de recuperação foi enviado. Verifique sua caixa de entrada.',
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Falha ao enviar o link',
        description: error.message || 'Ocorreu um erro. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setEmail('');
      setIsSending(false);
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Recuperar Senha</DialogTitle>
          <DialogDescription>
            Insira seu email para receber um link de recuperação de senha.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reset-email">Email</Label>
            <Input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSending}>
            Cancelar
          </Button>
          <Button onClick={handleSendLink} disabled={isSending || !email}>
            {isSending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Enviar Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
