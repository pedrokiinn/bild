
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@/types';
import { getUsers, updateUserRole } from '@/lib/data';
import { resetPasswordByAdmin, deleteUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Users, Search, KeyRound, ShieldAlert, RefreshCw, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useUser } from '@/context/UserContext';
import { ResetPasswordDialog } from '@/components/auth/ResetPasswordDialog';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ConfirmationDialog from '@/components/shared/ConfirmationDialog';

function UsersContent() {
    const currentUser = useUser();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [userToReset, setUserToReset] = useState<User | null>(null);
    const { toast } = useToast();

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const allUsers = await getUsers();
            setUsers(allUsers.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
        } catch (err: any) {
            console.error("Erro ao carregar usuários:", err);
            setError(err.message || "Falha ao carregar a lista de equipe.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (currentUser && currentUser.role === 'admin') {
            loadData();
        } else if (currentUser) {
            setIsLoading(false);
            setError("Acesso restrito: Apenas administradores podem gerenciar a equipe.");
        }
    }, [currentUser, loadData]);

    const handleRoleChange = async (userId: string, newRole: 'admin' | 'collaborator') => {
        try {
            await updateUserRole(userId, newRole);
            toast({ title: "Sucesso", description: "Cargo atualizado com sucesso."});
            loadData();
        } catch (e: any) {
            toast({ title: "Erro", description: e.message, variant: "destructive"});
        }
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        setIsSaving(true);
        try {
            await deleteUser(userToDelete.id);
            toast({ title: "Sucesso", description: "Usuário removido do sistema permanentemente."});
            setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
            setUserToDelete(null);
        } catch (e: any) {
            console.error("Erro ao deletar:", e);
            const isNotFound = e.message?.includes('not-found');
            toast({ 
                title: "Falha na Exclusão", 
                description: isNotFound 
                    ? "A função de exclusão não foi detectada no servidor. Por favor, execute 'firebase deploy --only functions' no seu terminal para ativar este recurso." 
                    : (e.message || "Erro desconhecido ao tentar excluir."), 
                variant: "destructive" 
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
            console.error("Erro ao resetar senha:", e);
            const isNotFound = e.message?.includes('not-found');
            toast({ 
                title: "Falha na Senha", 
                description: isNotFound 
                    ? "A função de redefinição não foi detectada no servidor. Por favor, execute 'firebase deploy --only functions' no seu terminal." 
                    : (e.message || "Erro desconhecido."), 
                variant: "destructive" 
            });
        }
    };

    const filteredUsers = users.filter(user => 
        (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
        (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="p-8 max-w-7xl mx-auto space-y-6">
                <Skeleton className="h-10 w-48 mb-8" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array(6).fill(0).map((_, i) => (
                        <Card key={i} className="p-6 space-y-4">
                            <div className="flex gap-4">
                                <Skeleton className="w-12 h-12 rounded-xl" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            </div>
                            <Skeleton className="h-10 w-full rounded-md" />
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center bg-slate-50 min-h-[80vh] flex flex-col items-center justify-center">
                <div className="bg-white p-12 rounded-3xl shadow-xl border border-slate-100 max-w-md">
                    <ShieldAlert className="w-16 h-16 text-red-400 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Acesso Negado</h2>
                    <p className="text-slate-500 mb-8">{error}</p>
                    <Button onClick={loadData} className="w-full">
                        <RefreshCw className="w-4 h-4 mr-2" /> Tentar Novamente
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Equipe G3</h1>
                        <p className="text-slate-500">Gestão de colaboradores e permissões de acesso.</p>
                    </div>
                    <Button variant="outline" onClick={loadData} disabled={isLoading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Atualizar
                    </Button>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                        placeholder="Buscar colaborador por nome ou email..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        className="pl-10 h-12 bg-white rounded-xl shadow-sm border-0 focus-visible:ring-primary" 
                    />
                </div>

                {filteredUsers.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                        <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-900">Nenhum colaborador</h3>
                        <p className="text-slate-500">Sua busca não retornou nenhum resultado.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredUsers.map(user => (
                            <Card key={user.id} className="bg-white border-0 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                                <CardHeader className="flex-row items-center gap-4 pb-4">
                                    <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center font-bold text-xl">
                                        {user.name?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <div className="min-w-0">
                                        <CardTitle className="text-lg truncate">{user.name}</CardTitle>
                                        <p className="text-sm text-slate-500 truncate">{user.email}</p>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Acesso ao Sistema</Label>
                                        <Select 
                                            value={user.role} 
                                            onValueChange={(val: any) => handleRoleChange(user.id, val)}
                                            disabled={user.email === 'keennlemariem@gmail.com' || user.id === currentUser?.id}
                                        >
                                            <SelectTrigger className="bg-slate-50 border-0 h-11">
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
            <ConfirmationDialog 
                isOpen={!!userToDelete} 
                onOpenChange={() => setUserToDelete(null)} 
                onConfirm={handleDeleteUser} 
                title="Excluir Colaborador" 
                description={`Tem certeza que deseja remover ${userToDelete?.name}? Esta ação não pode ser desfeita.`} 
                isSaving={isSaving} 
            />
        </div>
    );
}

export default function UsersPage() {
    return (
        <ProtectedRoute requiredRole="admin">
            <UsersContent />
        </ProtectedRoute>
    );
}
