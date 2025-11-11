
'use client';
import React, { useState, useEffect } from 'react';
import { DeletionReport } from '@/types';
import { getDeletionReports, deleteReport, deleteAllReports } from '@/lib/data';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Trash2, FileText, UserX, Shield, Loader2, Calendar, ShieldX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ConfirmationDialog from '@/components/shared/ConfirmationDialog';

function ReportsContent() {
    const [reports, setReports] = useState<DeletionReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [isSingleDeleteOpen, setIsSingleDeleteOpen] = useState(false);
    const [isClearAllOpen, setIsClearAllOpen] = useState(false);
    const [reportToDelete, setReportToDelete] = useState<string | null>(null);

    const { toast } = useToast();

    const loadData = async () => {
        setIsLoading(true);
        try {
            const fetchedReports = await getDeletionReports();
            setReports(fetchedReports);
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

    const openSingleDeleteDialog = (reportId: string) => {
        setReportToDelete(reportId);
        setIsSingleDeleteOpen(true);
    };

    const handleDeleteReport = async () => {
        if (!reportToDelete) return;
        
        setIsSaving(true);
        try {
            await deleteReport(reportToDelete);
            toast({ title: "Sucesso", description: "Relatório excluído com sucesso." });
            loadData(); // Refresh data
        } catch (e) {
            toast({ title: "Erro", description: "Falha ao excluir o relatório.", variant: "destructive" });
        } finally {
            setIsSaving(false);
            setIsSingleDeleteOpen(false);
            setReportToDelete(null);
        }
    }

    const handleClearAll = async () => {
        setIsSaving(true);
        try {
            await deleteAllReports();
            toast({ title: "Sucesso", description: "Todos os relatórios foram excluídos." });
            loadData();
        } catch (e) {
            toast({ title: "Erro", description: "Falha ao limpar o histórico de relatórios.", variant: "destructive" });
        } finally {
            setIsSaving(false);
            setIsClearAllOpen(false);
        }
    }

    const renderLoadingSkeleton = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(3).fill(0).map((_, index) => (
                <Card key={index} className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="space-y-1">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-4 w-40" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                    <CardFooter>
                         <Skeleton className="h-8 w-8 ml-auto" />
                    </CardFooter>
                </Card>
            ))}
        </div>
    );

    return (
        <div className="p-4 md:p-6 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                    <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-3 text-xl md:text-2xl text-slate-900">
                                <FileText className="w-6 h-6 text-primary" />
                                Relatórios de Exclusão de Usuários
                            </CardTitle>
                            <p className="text-slate-600 text-sm md:text-base mt-1">
                                Histórico de todas as contas de usuários removidas do sistema.
                            </p>
                        </div>
                        {reports.length > 0 && (
                            <Button
                                variant="destructive"
                                onClick={() => setIsClearAllOpen(true)}
                                disabled={isLoading || isSaving}
                            >
                                <ShieldX className="w-4 h-4 mr-2" />
                                Limpar Histórico
                            </Button>
                        )}
                    </CardHeader>
                </Card>

                {isLoading ? renderLoadingSkeleton() : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {reports.map(report => {
                             const reportDate = report.timestamp.toDate();
                            return (
                            <Card key={report.id} className="bg-white/80 backdrop-blur-sm shadow-lg border-0 hover:shadow-2xl transition-shadow flex flex-col">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                             <div className="p-2.5 bg-red-100 rounded-full">
                                                <UserX className="w-5 h-5 text-red-600" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base font-bold text-slate-900">{report.deletedUserName}</CardTitle>
                                                <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
                                                    <Calendar className="w-3 h-3"/>
                                                    {format(reportDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 space-y-3 text-sm">
                                    <div className="flex items-start gap-2 text-slate-700">
                                        <Shield className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" /> 
                                        <div>
                                            <span className="font-medium">Admin:</span> {report.adminName}
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2 text-slate-700">
                                        <FileText className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                                        <div>
                                            <span className="font-medium">Justificativa:</span> {report.reason}
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-end pt-4 border-t border-slate-200/60">
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        onClick={() => openSingleDeleteDialog(report.id)}
                                        disabled={isSaving}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        )})}
                    </div>
                )}
                
                { !isLoading && reports.length === 0 && (
                    <div className="text-center py-16">
                        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                            Nenhum relatório encontrado
                        </h3>
                        <p className="text-slate-600 text-sm">
                            Quando um usuário for excluído, o relatório aparecerá aqui.
                        </p>
                    </div>
                )}
            </div>
             <ConfirmationDialog
                isOpen={isSingleDeleteOpen}
                onOpenChange={setIsSingleDeleteOpen}
                onConfirm={handleDeleteReport}
                title="Excluir Relatório"
                description="Tem certeza de que deseja excluir este relatório? Esta ação é irreversível."
                isSaving={isSaving}
            />
            <ConfirmationDialog
                isOpen={isClearAllOpen}
                onOpenChange={setIsClearAllOpen}
                onConfirm={handleClearAll}
                title="Limpar todo o histórico?"
                description="Tem certeza de que deseja excluir TODOS os relatórios? Esta ação é irreversível."
                isSaving={isSaving}
            />
        </div>
    );
}

export default function ReportsPage() {
    return (
        <ReportsContent />
    );
}
