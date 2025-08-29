
'use client';
import React from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { ChecklistItemOption as ChecklistItemType } from "@/types";

const colorClasses = {
    green: "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200",
    blue: "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200",
    orange: "bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200",
    red: "bg-red-100 text-red-800 border-red-300 hover:bg-red-200"
};

const selectedColorClasses = {
    green: "bg-emerald-500 text-white border-emerald-500",
    blue: "bg-blue-500 text-white border-blue-500",
    yellow: "bg-yellow-500 text-white border-yellow-500",
    orange: "bg-orange-500 text-white border-orange-500",
    red: "bg-red-500 text-white border-red-500"
};

interface ChecklistItemProps {
    item: ChecklistItemType;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

export default function ChecklistItem({ item, value, onChange, disabled }: ChecklistItemProps) {
    return (
        <div className="space-y-3">
            <div>
                <Label className="text-base font-semibold text-slate-900">
                    {item.title}
                </Label>
                <p className="text-sm text-slate-600 mt-1">
                    {item.description}
                </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {item.options.map((option) => (
                    <Button
                        key={option.value}
                        type="button"
                        variant="outline"
                        className={`h-auto p-3 text-center transition-all duration-200 ${
                            value === option.value
                                ? selectedColorClasses[option.color as keyof typeof selectedColorClasses]
                                : colorClasses[option.color as keyof typeof colorClasses]
                        } ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
                        onClick={() => onChange(option.value)}
                        disabled={disabled}
                    >
                        <span className="font-medium text-sm">
                            {option.label}
                        </span>
                    </Button>
                ))}
            </div>
        </div>
    );
}
