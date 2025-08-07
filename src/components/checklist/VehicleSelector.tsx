'use client';
import React from 'react';
import type { Vehicle } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, Plus } from "lucide-react";
import Link from "next/link";

interface VehicleSelectorProps {
    vehicles: Vehicle[];
    onSelect: (vehicle: Vehicle) => void;
}

export default function VehicleSelector({ vehicles, onSelect }: VehicleSelectorProps) {
    return (
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-slate-900">
                    <Car className="w-6 h-6 text-primary" />
                    Selecione o Veículo
                </CardTitle>
            </CardHeader>
            <CardContent>
                {vehicles.length === 0 ? (
                    <div className="text-center py-8">
                        <Car className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                            Nenhum veículo cadastrado
                        </h3>
                        <p className="text-slate-600 mb-6">
                            Você precisa cadastrar um veículo antes de fazer o checklist
                        </p>
                        <Link href="/vehicle">
                            <Button className="bg-gradient-to-r from-primary to-primary/90">
                                <Plus className="w-4 h-4 mr-2" />
                                Cadastrar Veículo
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {vehicles.map((vehicle) => (
                            <Button
                                key={vehicle.id}
                                variant="outline"
                                className="p-6 h-auto flex items-center justify-between hover:bg-primary/10 hover:border-primary/20 transition-all duration-300"
                                onClick={() => onSelect(vehicle)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
                                        <Car className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-semibold text-slate-900">
                                            {vehicle.brand} {vehicle.model} ({vehicle.year})
                                        </h3>
                                        <p className="text-sm text-slate-600">
                                            Placa: {vehicle.license_plate}
                                        </p>
                                    </div>
                                </div>
                            </Button>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
