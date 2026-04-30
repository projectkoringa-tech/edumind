import React from 'react';
import { cn } from '../lib/utils';

export const Card = ({ children, className, onClick }: any) => (
  <div 
    onClick={onClick}
    className={cn(
      "bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden", 
      onClick && "cursor-pointer",
      className
    )}
  >
    {children}
  </div>
);
