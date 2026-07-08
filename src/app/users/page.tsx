
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
            setUsers(allUsers.sort((a, b) => a.name.localeCompare(b.name)));
        } catch (err: any) {
            console.error("Erro ao carregar usuários:", err);
            setError(err.message || "Não foi possível carregar a lista de usuários. Verifique se você tem permissão de administrador.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { 
        if (currentUser?.role === 'admin') {
            loadData(); 
        } else if (currentUser !== undefined) {
            setIsLoading(false);
        }
    }, [loadData, currentUser]);

    const handleRoleChange = async (userId: string, newRole: 'admin' | 'collaborator') => {
        try {
            await updateUserRole(userId, newRole);
            toast({ title: "Sucesso", description: "Cargo atualizado com sucesso."});
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
            toast({ title: "Sucesso", description: "Usuário removido do sistema."});
            loadData();
            setUserToDelete(null);
        } catch (e: any) {
            toast({ 
                title: "Falha na Exclusão", 
                description: e.message, 
                variant: "destructive", 
                duration: 8000 
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetPassword = async (newPassword: string) => {
        if (!userToReset) return;
        try {
            await resetPasswordByAdmin(userToReset.id, newPassword);
            toast({ title: "Sucesso", description: "Senha alterada com sucesso."});
            setUserToReset(null);
        } catch (e: any) {
            toast({ 
                title: "Falha na Senha", 
                description: e.message, 
                variant: "destructive", 
                duration: 8000 
            });
        }
    };

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (currentUser === undefined || isLoading) {
        return (
            <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="flex justify-between items-center">
                        <Skeleton className="h-10 w-48" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                    <Skeleton className="h-14 w-full rounded-2xl" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array(6).fill(0).map((_, i) => (
                            <Card key={i} className="bg-white border-slate-100 shadow-sm rounded-2xl">
                                <CardHeader className="flex-row items-center gap-4 pb-2">
                                    <Skeleton className="w-14 h-14 rounded-2xl" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-5 w-3/4" />
                                        <Skeleton className="h-4 w-1/2" />
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4"><Skeleton className="h-12 w-full rounded-xl" /></CardContent>
                                <CardFooter className="justify-end gap-2 pt-4 border-t border-slate-50">
                                    <Skeleton className="h-9 w-20" />
                                    <Skeleton className="h-9 w-20" />
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (currentUser?.role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white rounded-3xl shadow-xl border border-slate-100 mx-4 my-10 max-w-lg lg:mx-auto">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold mb-3 text-slate-900">Acesso Restrito</h2>
                <p className="text-slate-600 leading-relaxed mb-6">Esta área é exclusiva para administradores da G3. Se você acredita que deveria ter acesso, entre em contato com o suporte.</p>
                <Button onClick={() => window.location.href = '/dashboard'}>Voltar ao Início</Button>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-primary/10 rounded-2xl shadow-inner">
                            <Users className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Equipe G3</h1>
                            <p className="text-slate-500 font-medium">Controle de acessos e cargos dos colaboradores.</p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={loadData} disabled={isLoading} className="bg-white border-slate-200 hover:bg-slate-50 shadow-sm h-12 px-6 rounded-xl">
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Atualizar Equipe
                    </Button>
                </div>

                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <Input 
                        placeholder="Buscar colaborador por nome ou email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 bg-white h-14 border-slate-200 rounded-2xl shadow-sm focus:ring-primary/20"
                    />
                </div>

                {error ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-3xl shadow-sm border border-slate-200">
                        <UserX className="w-16 h-16 mb-6 text-red-400 opacity-50" />
                        <h3 className="text-xl font-bold text-slate-900">Erro ao carregar colaboradores</h3>
                        <p className="max-w-md px-8 text-slate-600 mt-2">{error}</p>
                        <Button variant="outline" className="mt-8 px-8" onClick={loadData}>Tentar Novamente</Button>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-3xl shadow-sm border border-slate-200">
                        <Users className="w-20 h-20 mb-6 text-slate-200" />
                        <h3 className="text-xl font-bold text-slate-900">Nenhum colaborador encontrado</h3>
                        <p className="text-slate-500">Ajuste seu termo de busca para encontrar o que procura.</p>
                        <Button variant="ghost" className="mt-4" onClick={() => setSearchTerm('')}>Limpar Filtro</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredUsers.map(user => (
                            <Card key={user.id} className="hover:shadow-xl transition-all duration-500 bg-white border-slate-100 shadow-sm rounded-2xl flex flex-col group overflow-hidden">
                                <CardHeader className="flex-row items-center gap-5 pb-4">
                                    <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center font-bold shrink-0 text-2xl group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <CardTitle className="text-lg truncate font-bold text-slate-900 tracking-tight">{user.name}</CardTitle>
                                        <p className="text-sm text-slate-500 truncate">{user.email}</p>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 space-y-4 pt-2">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Nível de Acesso</Label>
                                        <Select 
                                            value={user.role} 
                                            onValueChange={(val: any) => handleRoleChange(user.id, val)}
                                            disabled={user.email === 'keennlemariem@gmail.com' || user.id === currentUser?.id}
                                        >
                                            <SelectTrigger className="w-full bg-slate-50/50 border-slate-200 h-12 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    {user.role === 'admin' ? <ShieldCheck className="w-5 h-5 text-primary" /> : <Users className="w-5 h-5 text-slate-400" />}
                                                    <SelectValue />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="admin">Administrador</SelectItem>
                                                <SelectItem value="collaborator">Colaborador G3</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                                <CardFooter className="justify-end gap-2 border-t border-slate-50 pt-4 bg-slate-50/20 px-6 pb-6">
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-slate-600 h-10 px-4 rounded-xl hover:bg-slate-100"
                                        onClick={() => setUserToReset(user)} 
                                        disabled={user.email === 'keennlemariem@gmail.com'}
                                    >
                                        <KeyRound className="w-4 h-4 mr-2" />
                                        Senha
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-red-500 hover:bg-red-50 hover:text-red-600 h-10 px-4 rounded-xl"
                                        onClick={() => setUserToDelete(user)} 
                                        disabled={user.email === 'keennlemariem@gmail.com' || user.id === currentUser?.id}
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Remover
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
    );
}

export default function UsersPage() { return <UsersContent />; }
