
'use client';
import React, { useState, useEffect } from 'react';
import { DeletionReport, User } from '@/types';
import { getDeletionReports, deleteReport } from '@/lib/data';
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
} from "@/components/ui/dialog"
import { Trash2, FileText, UserX, Shield, Clock, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';


function PasswordConfirmationDialog({ isOpen, onOpenChange, onConfirm, isSaving }: { isOpen: boolean, onOpenChange: (open: boolean) => void, onConfirm: (password: string) => void, isSaving: boolean }) {
    const [password, setPassword] = useState('');

    const handleConfirm = () => {
        onConfirm(password);
        setPassword('');
    }

    return (
         <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirmar Exclusão de Relatório</DialogTitle>
                    <DialogDescription>
                        Para sua segurança, por favor, insira sua senha de administrador para confirmar a exclusão deste relatório.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-2"
                    />
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancelar</Button>
                    <Button variant="destructive" onClick={handleConfirm} disabled={isSaving || !password}>
                        {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Confirmar Exclusão
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function ReportsContent() {
    const [reports, setReports] = useState<DeletionReport[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [reportToDelete, setReportToDelete] = useState<string | null>(null);

    const { toast } = useToast();

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [fetchedReports, me] = await Promise.all([getDeletionReports(), getCurrentUser()]);
            setReports(fetchedReports);
            setCurrentUser(me);
        } catch (e) {
            console.error("Erro ao carregar relatórios:", e);
            toast({ title: "Erro", description: "Falha ao carregar relatórios.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const openConfirmationDialog = (reportId: string) => {
        setReportToDelete(reportId);
        setIsConfirmOpen(true);
    };

    const handleDeleteReport = async (password: string) => {
        if (!reportToDelete || !currentUser) return;
        
        // Basic password check - in a real app, this would be more secure
        if (password !== currentUser.password) {
            toast({ title: "Erro", description: "Senha incorreta.", variant: "destructive" });
            return;
        }

        setIsSaving(true);
        try {
            await deleteReport(reportToDelete);
            toast({ title: "Sucesso", description: "Relatório excluído com sucesso." });
            loadData(); // Refresh data
        } catch (e) {
            toast({ title: "Erro", description: "Falha ao excluir o relatório.", variant: "destructive" });
        } finally {
            setIsSaving(false);
            setIsConfirmOpen(false);
            setReportToDelete(null);
        }
    }

    const renderLoadingSkeleton = () => (
        Array(3).fill(0).map((_, index) => (
            <TableRow key={index}>
                <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                <TableCell><Skeleton className="h-10 w-10" /></TableCell>
            </TableRow>
        ))
    );

    return (
        <div className="p-4 md:p-6 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-xl md:text-2xl text-slate-900">
                            <FileText className="w-6 h-6 text-primary" />
                            Relatórios de Exclusão de Usuários
                        </CardTitle>
                        <p className="text-slate-600 text-sm md:text-base">
                            Histórico de todas as contas de usuários removidas do sistema.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Usuário Excluído</TableHead>
                                        <TableHead>Admin Responsável</TableHead>
                                        <TableHead>Justificativa</TableHead>
                                        <TableHead>Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? renderLoadingSkeleton() : reports.map(report => (
                                        <TableRow key={report.id}>
                                            <TableCell className="font-medium text-sm text-slate-600 whitespace-nowrap">
                                                {format(new Date(report.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <UserX className="w-4 h-4 text-red-500" />
                                                    {report.deletedUserName}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                 <div className="flex items-center gap-2">
                                                    <Shield className="w-4 h-4 text-emerald-600" />
                                                    {report.adminName}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-700">
                                                {report.reason}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    onClick={() => openConfirmationDialog(report.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                         { !isLoading && reports.length === 0 && (
                            <div className="text-center py-12">
                                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                    Nenhum relatório encontrado
                                </h3>
                                <p className="text-slate-600 text-sm">
                                    Quando um usuário for excluído, o relatório aparecerá aqui.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
             <PasswordConfirmationDialog
                isOpen={isConfirmOpen}
                onOpenChange={setIsConfirmOpen}
                onConfirm={handleDeleteReport}
                isSaving={isSaving}
            />
        </div>
    );
}

export default function ReportsPage() {
    return (
        <ProtectedRoute requiredRole="admin">
            <ReportsContent />
        </ProtectedRoute>
    );
}
