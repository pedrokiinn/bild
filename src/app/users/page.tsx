
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
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Users, Loader2, Search, KeyRound, AlertCircle, RefreshCw } from 'lucide-react';
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
    }

    return (
         <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Excluir Usuário</DialogTitle>
                    <DialogDescription>
                        Esta ação removerá o usuário e será registrada no histórico de exclusões.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="reason">Justificativa</Label>
                    <Textarea
                        id="reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Ex: Saída da empresa."
                        className="mt-2"
                    />
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button variant="destructive" onClick={handleConfirm} disabled={isSaving || !reason.trim()}>
                        {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Confirmar Exclusão
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
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
            setError("Não foi possível carregar a lista de usuários. Isso pode ser um erro de permissão ou conexão.");
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
            toast({ title: "Erro", description: e.message, variant: "destructive"});
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
            toast({ title: "Erro", description: e.message, variant: "destructive"});
        }
    };

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (adminUser?.role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
                <AlertCircle className="w-16 h-16 text-destructive mb-4" />
                <h2 className="text-2xl font-bold mb-2">Acesso Restrito</h2>
                <p className="text-muted-foreground">Somente administradores podem visualizar esta página.</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <Users className="w-8 h-8 text-primary" />
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Gestão de Equipe</h1>
                            <p className="text-sm text-slate-500">Gerencie cargos e acessos dos colaboradores.</p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={loadData} disabled={isLoading}>
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
                        className="pl-9 bg-white"
                    />
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array(3).fill(0).map((_, i) => (
                            <Card key={i} className="bg-white border-0 shadow-sm">
                                <CardHeader className="flex-row items-center gap-4">
                                    <Skeleton className="w-10 h-10 rounded-full" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Skeleton className="h-10 w-full" />
                                </CardContent>
                                <CardFooter className="justify-end gap-2 border-t pt-4">
                                    <Skeleton className="h-8 w-20" />
                                    <Skeleton className="h-8 w-20" />
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 bg-white rounded-xl shadow-sm border border-slate-200">
                        <AlertCircle className="w-12 h-12 mb-4 text-destructive" />
                        <p className="max-w-md px-6">{error}</p>
                        <Button variant="outline" className="mt-4" onClick={loadData}>Tentar Novamente</Button>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 bg-white rounded-xl shadow-sm border border-slate-200">
                        <Users className="w-12 h-12 mb-4 opacity-20" />
                        <p>Nenhum usuário encontrado.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredUsers.map(user => (
                            <Card key={user.id} className="hover:shadow-md transition-shadow bg-white border-0 shadow-sm flex flex-col">
                                <CardHeader className="flex-row items-center gap-4">
                                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold shrink-0">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <CardTitle className="text-sm truncate font-bold">{user.name}</CardTitle>
                                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <Label className="text-xs text-slate-500 mb-2 block font-semibold uppercase tracking-wider">Cargo no Sistema</Label>
                                    <Select 
                                        value={user.role} 
                                        onValueChange={(val: any) => handleRoleChange(user.id, val)}
                                        disabled={user.email === 'keennlemariem@gmail.com' || user.id === adminUser?.id}
                                    >
                                        <SelectTrigger className="w-full bg-slate-50/50">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">Administrador</SelectItem>
                                            <SelectItem value="collaborator">Colaborador</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </CardContent>
                                <CardFooter className="justify-end gap-2 border-t pt-4 mt-auto">
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-slate-600 h-8"
                                        onClick={() => setUserToReset(user)} 
                                        disabled={user.email === 'keennlemariem@gmail.com'}
                                    >
                                        <KeyRound className="w-4 h-4 mr-2" />
                                        Senha
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-destructive hover:bg-destructive/10 h-8"
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
