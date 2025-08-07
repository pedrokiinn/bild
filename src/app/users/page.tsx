
'use client';
import React, { useState, useEffect } from 'react';
import { User } from '@/types';
import { getUsers, updateUserRole, deleteUser } from '@/lib/data';
import { getCurrentUser } from '@/lib/auth';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Users, Shield, User as UserIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from '@/hooks/use-toast';

function UsersContent() {
    const [users, setUsers] = useState<User[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [allUsers, me] = await Promise.all([getUsers(), getCurrentUser()]);
            setUsers(allUsers.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
            setCurrentUser(me);
        } catch (e) {
            console.error("Erro ao carregar dados dos usuários:", e);
            toast({ title: "Erro", description: "Falha ao carregar usuários.", variant: "destructive" });
        }
        setIsLoading(false);
    };

    const handleRoleChange = async (userId: string, newRole: 'admin' | 'collaborator') => {
        const userToChange = users.find(u => u.id === userId);
        const admins = users.filter(u => u.role === 'admin');

        if (currentUser?.id === userId && newRole !== 'admin' && admins.length <= 1) {
            toast({ title: "Ação não permitida", description: "Você não pode remover sua própria permissão de administrador, pois é o único existente.", variant: "destructive"});
            return;
        }

        try {
            await updateUserRole(userId, newRole);
            toast({ title: "Sucesso", description: "Função do usuário atualizada."});
            loadData();
        } catch (e) {
            console.error("Falha ao atualizar a função do usuário:", e);
            toast({ title: "Erro", description: "Ocorreu um erro ao tentar atualizar a função.", variant: "destructive"});
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (currentUser?.id === userId) {
            toast({ title: "Ação não permitida", description: "Você não pode excluir sua própria conta.", variant: "destructive"});
            return;
        }

        if (confirm("Tem certeza que deseja excluir este usuário? Esta ação é irreversível e removerá todos os dados associados a ele.")) {
            try {
                await deleteUser(userId);
                toast({ title: "Sucesso", description: "Usuário excluído."});
                loadData();
            } catch (e) {
                console.error("Falha ao excluir o usuário:", e);
                toast({ title: "Erro", description: "Ocorreu um erro ao tentar excluir o usuário.", variant: "destructive"});
            }
        }
    };

    const renderLoadingSkeleton = () => (
        Array(5).fill(0).map((_, index) => (
            <TableRow key={index}>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-48" /></TableCell>
                <TableCell><Skeleton className="h-10 w-32" /></TableCell>
                <TableCell><Skeleton className="h-10 w-10" /></TableCell>
            </TableRow>
        ))
    );

    return (
        <div className="p-4 md:p-6 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
            <div className="max-w-6xl mx-auto space-y-6">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-xl md:text-2xl text-slate-900">
                            <Users className="w-6 h-6 text-primary" />
                            Gerenciamento de Usuários
                        </CardTitle>
                        <p className="text-slate-600 text-sm md:text-base">
                            Adicione, remova e gerencie as permissões dos usuários do sistema.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-700 bg-blue-50 border border-blue-200 p-3 rounded-lg mb-6">
                            <strong>Nota:</strong> Esta é uma simulação. Em um ambiente real, novos usuários seriam convidados através de um sistema de autenticação.
                        </p>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead className="hidden sm:table-cell">Email</TableHead>
                                        <TableHead>Função</TableHead>
                                        <TableHead>Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? renderLoadingSkeleton() : users.map(user => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell className="hidden sm:table-cell">{user.email}</TableCell>
                                            <TableCell>
                                                <Select
                                                    value={user.role}
                                                    onValueChange={(newRole: 'admin' | 'collaborator') => handleRoleChange(user.id, newRole)}
                                                    disabled={currentUser?.id === user.id && users.filter(u => u.role === 'admin').length <= 1}
                                                >
                                                    <SelectTrigger className="w-[150px] text-xs sm:text-sm">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="admin">
                                                            <div className="flex items-center gap-2">
                                                                <Shield className="w-4 h-4 text-primary" /> Administrador
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="collaborator">
                                                            <div className="flex items-center gap-2">
                                                                <UserIcon className="w-4 h-4 text-blue-600" /> Colaborador
                                                            </div>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    disabled={currentUser?.id === user.id}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                         { !isLoading && users.length === 0 && (
                            <div className="text-center py-12">
                                <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                    Nenhum outro usuário encontrado
                                </h3>
                                <p className="text-slate-600 text-sm">
                                    Novos usuários aparecerão aqui assim que se registrarem.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
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

