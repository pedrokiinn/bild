
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@/types';
import { getUsers, updateUserRole } from '@/lib/data';
import { resetPasswordByAdmin, deleteUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Users, Loader2, Search, KeyRound, AlertCircle, RefreshCw, ShieldCheck, UserX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useUser } from '@/context/UserContext';
import { ResetPasswordDialog } from '@/components/auth/ResetPasswordDialog';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

function DeletionDialog({ isOpen, onOpenChange, onConfirm, isSaving }: { isOpen: boolean, onOpenChange: (open: boolean) => void, onConfirm: (reason: string) => void, isSaving: boolean }) {
    const [reason, setReason] = useState('');
    const handleConfirm = () => {
        if (!reason.trim()) return;
        onConfirm(reason);
        setReason('');
    };
    return (
         <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Excluir Usuário</DialogTitle>
                    <DialogDescription>
                        Esta ação removerá o usuário permanentemente e será registrada no histórico de exclusões.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="reason">Justificativa da Exclusão</Label>
                    <Textarea
                        id="reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Ex: Colaborador desligado da empresa."
                        className="mt-2"
                    />
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancelar</Button>
                    <Button variant="destructive" onClick={handleConfirm} disabled={isSaving || !reason.trim()}>
                        {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Confirmar Exclusão
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function UsersContent() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [userToReset, setUserToReset] = useState<User | null>(null);

    const { toast } = useToast();
    const currentUser = useUser();

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const allUsers = await getUsers();
            setUsers(allUsers.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
        } catch (err: any) {
            console.error("Erro ao carregar usuários:", err);
            setError("Não foi possível carregar a lista de colaboradores. Verifique se você é um administrador e tem permissão de leitura na coleção 'users'.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { 
        if (currentUser?.role === 'admin') {
            loadData(); 
        } else if (currentUser !== null) {
            setIsLoading(false);
        }
    }, [loadData, currentUser]);

    const handleRoleChange = async (userId: string, newRole: 'admin' | 'collaborator') => {
        try {
            await updateUserRole(userId, newRole);
            toast({ title: "Sucesso", description: "Cargo atualizado."});
            loadData();
        } catch (e: any) {
            toast({ title: "Erro", description: e.message, variant: "destructive"});
        }
    };

    const handleDeleteUser = async (reason: string) => {
        if (!userToDelete) return;
        setIsSaving(true);
        try {
            await deleteUser(userToDelete.id, reason);
            toast({ title: "Sucesso", description: "Usuário removido."});
            loadData();
            setUserToDelete(null);
        } catch (e: any) {
            toast({ title: "Falha na Exclusão", description: e.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetPassword = async (newPassword: string) => {
        if (!userToReset) return;
        try {
            await resetPasswordByAdmin(userToReset.id, newPassword);
            toast({ title: "Sucesso", description: "Senha alterada."});
            setUserToReset(null);
        } catch (e: any) {
            toast({ title: "Falha na Senha", description: e.message, variant: "destructive" });
        }
    };

    const filteredUsers = users.filter(u => 
        (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="p-8 bg-slate-50 min-h-screen">
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="flex justify-between items-center">
                        <Skeleton className="h-10 w-48" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-2xl" />)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <ProtectedRoute requiredRole="admin">
            <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold">Equipe G3</h1>
                            <p className="text-slate-500">Gestão de colaboradores e permissões.</p>
                        </div>
                        <Button variant="outline" onClick={loadData} disabled={isLoading}>
                            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Atualizar
                        </Button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input placeholder="Buscar por nome ou email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-12 bg-white rounded-xl shadow-sm" />
                    </div>

                    {error ? (
                        <div className="text-center py-20 bg-white rounded-2xl border shadow-sm">
                            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Erro de Carregamento</h3>
                            <p className="text-slate-600 max-w-md mx-auto">{error}</p>
                            <Button variant="outline" className="mt-6" onClick={loadData}>Tentar Novamente</Button>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-2xl border shadow-sm">
                            <Users className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500">Nenhum colaborador encontrado.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredUsers.map(user => (
                                <Card key={user.id} className="bg-white border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                                    <CardHeader className="flex-row items-center gap-4 pb-4">
                                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold text-xl">
                                            {user.name?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                        <div className="min-w-0">
                                            <CardTitle className="text-lg truncate">{user.name}</CardTitle>
                                            <p className="text-sm text-slate-500 truncate">{user.email}</p>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Acesso</Label>
                                            <Select 
                                                value={user.role} 
                                                onValueChange={(val: any) => handleRoleChange(user.id, val)}
                                                disabled={user.email === 'keennlemariem@gmail.com' || user.id === currentUser?.id}
                                            >
                                                <SelectTrigger className="bg-slate-50 border-slate-100">
                                                    <div className="flex items-center gap-2">
                                                        {user.role === 'admin' ? <ShieldCheck className="w-4 h-4 text-primary" /> : <Users className="w-4 h-4 text-slate-400" />}
                                                        <SelectValue />
                                                    </div>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="admin">Administrador</SelectItem>
                                                    <SelectItem value="collaborator">Colaborador</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="justify-end gap-2 border-t pt-4 bg-slate-50/30">
                                        <Button variant="ghost" size="sm" onClick={() => setUserToReset(user)} disabled={user.email === 'keennlemariem@gmail.com'}>
                                            <KeyRound className="w-4 h-4 mr-2" /> Senha
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => setUserToDelete(user)} disabled={user.email === 'keennlemariem@gmail.com' || user.id === currentUser?.id}>
                                            <Trash2 className="w-4 h-4 mr-2" /> Remover
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
                <ResetPasswordDialog isOpen={!!userToReset} onOpenChange={() => setUserToReset(null)} onConfirm={handleResetPassword} user={userToReset} />
                <DeletionDialog isOpen={!!userToDelete} onOpenChange={() => setUserToDelete(null)} onConfirm={handleDeleteUser} isSaving={isSaving} />
            </div>
        </ProtectedRoute>
    );
}

export default function UsersPage() { return <UsersContent />; }
