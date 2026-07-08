
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
import { Trash2, Users, Loader2, Search, KeyRound, AlertCircle, RefreshCw, ShieldCheck } from 'lucide-react';
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
    const adminUser = useUser();

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const allUsers = await getUsers();
            setUsers(allUsers.sort((a, b) => a.name.localeCompare(b.name)));
        } catch (err: any) {
            console.error("Erro ao carregar usuários:", err);
            setError("Não foi possível carregar a lista de usuários. Verifique se você tem permissão de administrador ou se os dados foram semeados.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { 
        loadData(); 
    }, [loadData]);

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
            toast({ title: "Erro de Função", description: e.message, variant: "destructive", duration: 8000 });
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetPassword = async (newPassword: string) => {
        if (!userToReset) return;
        try {
            await resetPasswordByAdmin(userToReset.id, newPassword);
            toast({ title: "Sucesso", description: "Senha do colaborador alterada."});
            setUserToReset(null);
        } catch (e: any) {
            toast({ title: "Erro de Função", description: e.message, variant: "destructive", duration: 8000 });
        }
    };

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (adminUser === undefined) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (adminUser?.role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-white rounded-2xl shadow-sm border mx-4 my-6">
                <AlertCircle className="w-16 h-16 text-destructive mb-4" />
                <h2 className="text-2xl font-bold mb-2 text-slate-900">Acesso Restrito</h2>
                <p className="text-muted-foreground max-w-sm">Somente administradores podem gerenciar a equipe. Se você é um administrador, verifique seu perfil.</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-2xl">
                            <Users className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Equipe G3</h1>
                            <p className="text-sm text-slate-500">Controle de acessos e cargos dos colaboradores.</p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={loadData} disabled={isLoading} className="bg-white">
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Atualizar Lista
                    </Button>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                        placeholder="Buscar por nome ou email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-white h-12 border-slate-200"
                    />
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array(6).fill(0).map((_, i) => (
                            <Card key={i} className="bg-white border-0 shadow-sm">
                                <CardHeader className="flex-row items-center gap-4">
                                    <Skeleton className="w-12 h-12 rounded-full" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Skeleton className="h-10 w-full" />
                                </CardContent>
                                <CardFooter className="justify-end gap-2 border-t pt-4">
                                    <Skeleton className="h-8 w-24" />
                                    <Skeleton className="h-8 w-24" />
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500 bg-white rounded-2xl shadow-sm border border-slate-200">
                        <AlertCircle className="w-12 h-12 mb-4 text-destructive" />
                        <h3 className="text-lg font-bold text-slate-900">Erro de Carregamento</h3>
                        <p className="max-w-md px-6 text-slate-600 mt-2">{error}</p>
                        <Button variant="outline" className="mt-6" onClick={loadData}>Tentar Novamente</Button>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500 bg-white rounded-2xl shadow-sm border border-slate-200">
                        <Users className="w-16 h-16 mb-4 opacity-10" />
                        <h3 className="text-lg font-bold text-slate-900">Nenhum usuário</h3>
                        <p className="text-slate-600">Não encontramos colaboradores com esses critérios.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredUsers.map(user => (
                            <Card key={user.id} className="hover:shadow-md transition-all duration-300 bg-white border-0 shadow-sm flex flex-col group">
                                <CardHeader className="flex-row items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center font-bold shrink-0 text-xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <CardTitle className="text-base truncate font-bold text-slate-900">{user.name}</CardTitle>
                                        <p className="text-sm text-slate-500 truncate">{user.email}</p>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 space-y-4">
                                    <div>
                                        <Label className="text-[10px] text-slate-400 mb-2 block font-bold uppercase tracking-widest">Nível de Acesso</Label>
                                        <Select 
                                            value={user.role} 
                                            onValueChange={(val: any) => handleRoleChange(user.id, val)}
                                            disabled={user.email === 'keennlemariem@gmail.com' || user.id === adminUser?.id}
                                        >
                                            <SelectTrigger className="w-full bg-slate-50/50 border-slate-200">
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
                                <CardFooter className="justify-end gap-2 border-t border-slate-50 pt-4 mt-auto">
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-slate-600 h-9 hover:bg-slate-100"
                                        onClick={() => setUserToReset(user)} 
                                        disabled={user.email === 'keennlemariem@gmail.com'}
                                    >
                                        <KeyRound className="w-4 h-4 mr-2" />
                                        Senha
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-destructive hover:bg-destructive/10 h-9"
                                        onClick={() => setUserToDelete(user)} 
                                        disabled={user.email === 'keennlemariem@gmail.com' || user.id === adminUser?.id}
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Excluir
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
