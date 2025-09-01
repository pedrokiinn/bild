
'use client';
import React, { useState, useEffect } from 'react';
import { User, DeletionReport } from '@/types';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Users, Shield, User as UserIcon, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

function DeletionDialog({ isOpen, onOpenChange, onConfirm, isSaving }: { isOpen: boolean, onOpenChange: (open: boolean) => void, onConfirm: (reason: string) => void, isSaving: boolean }) {
    const [reason, setReason] = useState('');

    const handleConfirm = () => {
        if (!reason.trim()) {
            alert('Por favor, forneça uma justificativa para a exclusão.');
            return;
        }
        onConfirm(reason);
    }

    return (
         <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Excluir Usuário</DialogTitle>
                    <DialogDescription>
                        Para excluir este usuário, por favor, forneça uma justificativa. Esta ação é irreversível e será registrada.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="reason" className="text-left">Justificativa</Label>
                    <Textarea
                        id="reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Ex: Fim de contrato, duplicidade de conta, etc."
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
    )
}


function UsersContent() {
    const [users, setUsers] = useState<User[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // State for deletion dialog
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

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
        if (!currentUser) return;

        const admins = users.filter(u => u.role === 'admin');
        if (currentUser.id === userId && newRole !== 'admin' && admins.length <= 1) {
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

    const handleDeleteUser = async (reason: string) => {
        if (!userToDelete || !currentUser || !currentUser.name) return;
        
        if (currentUser.id === userToDelete.id) {
            toast({ title: "Ação não permitida", description: "Você não pode excluir sua própria conta.", variant: "destructive"});
            setIsDeleteDialogOpen(false);
            setUserToDelete(null);
            return;
        }
        
        setIsSaving(true);
        try {
            await deleteUser(userToDelete.id, reason, currentUser.name);
            toast({ title: "Sucesso", description: `Usuário ${userToDelete.name} excluído.`});
            loadData();
        } catch (e: any) {
            console.error("Falha ao excluir o usuário:", e);
            toast({ title: "Erro", description: e.message || "Ocorreu um erro ao tentar excluir o usuário.", variant: "destructive"});
        } finally {
            setIsSaving(false);
            setIsDeleteDialogOpen(false);
            setUserToDelete(null);
        }
    };

    const openDeleteDialog = (user: User) => {
        setUserToDelete(user);
        setIsDeleteDialogOpen(true);
    };

    const renderLoadingSkeleton = () => (
        Array(5).fill(0).map((_, index) => (
            <TableRow key={index}>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
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
                            Promova, rebaixe ou remova usuários do sistema.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>Função</TableHead>
                                        <TableHead>Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? renderLoadingSkeleton() : users.map(user => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.name}</TableCell>
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
                                                    onClick={() => openDeleteDialog(user)}
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
             <DeletionDialog
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={handleDeleteUser}
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
