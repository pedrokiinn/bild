'use client';
import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Smartphone } from "lucide-react";

export default function QRCodeModal({ isOpen, onClose, loginUrl }: { isOpen: boolean, onClose: () => void, loginUrl: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (isOpen && canvasRef.current) {
            generateQRCode();
        }
    }, [isOpen, loginUrl]);

    const generateQRCode = () => {
        // Simulação de QR Code usando canvas
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const size = 200;
        
        canvas.width = size;
        canvas.height = size;
        
        // Fundo branco
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        
        // Padrão simples de QR Code (simulado)
        ctx.fillStyle = '#000000';
        const blockSize = 10;
        
        for (let i = 0; i < size; i += blockSize) {
            for (let j = 0; j < size; j += blockSize) {
                if (Math.random() > 0.5) {
                    ctx.fillRect(i, j, blockSize, blockSize);
                }
            }
        }
        
        // Cantos de referência
        const cornerSize = 70;
        ctx.fillStyle = '#000000';
        
        // Canto superior esquerdo
        ctx.fillRect(0, 0, cornerSize, cornerSize);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(10, 10, cornerSize - 20, cornerSize - 20);
        ctx.fillStyle = '#000000';
        ctx.fillRect(20, 20, cornerSize - 40, cornerSize - 40);
        
        // Canto superior direito
        ctx.fillStyle = '#000000';
        ctx.fillRect(size - cornerSize, 0, cornerSize, cornerSize);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(size - cornerSize + 10, 10, cornerSize - 20, cornerSize - 20);
        ctx.fillStyle = '#000000';
        ctx.fillRect(size - cornerSize + 20, 20, cornerSize - 40, corner-size - 40);
        
        // Canto inferior esquerdo
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, size - cornerSize, cornerSize, cornerSize);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(10, size - cornerSize + 10, cornerSize - 20, cornerSize - 20);
        ctx.fillStyle = '#000000';
        ctx.fillRect(20, size - cornerSize + 20, cornerSize - 40, corner-size - 40);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="bg-white shadow-2xl border-0 max-w-sm w-full">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-primary" />
                        QR Code Login
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="bg-white p-4 rounded-lg shadow-inner border-2 border-slate-100">
                            <canvas 
                                ref={canvasRef}
                                className="max-w-full h-auto"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-slate-600">
                            Escaneie este QR Code com outro smartphone para fazer login automaticamente.
                        </p>
                        <p className="text-xs text-slate-500">
                            Use a câmera do seu telefone ou um aplicativo de QR Code.
                        </p>
                    </div>
                    <Button onClick={onClose} variant="outline" className="w-full">
                        Fechar
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
