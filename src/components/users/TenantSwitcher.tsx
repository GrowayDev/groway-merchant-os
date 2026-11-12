'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Building2, ChevronDown, Check } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
}

interface TenantSwitcherProps {
  tenants: Tenant[];
  selectedTenantId: string;
  onTenantChange: (tenantId: string) => void;
}

export function TenantSwitcher({
  tenants,
  selectedTenantId,
  onTenantChange,
}: TenantSwitcherProps) {
  const selectedTenant = tenants.find(t => t.id === selectedTenantId);

  const planColors: Record<string, string> = {
    starter: 'bg-gray-100 text-gray-800',
    pro: 'bg-blue-100 text-blue-800',
    enterprise: 'bg-purple-100 text-purple-800',
  };

  if (tenants.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Building2 className="h-4 w-4" />
          <span className="max-w-[150px] truncate">
            {selectedTenant?.name || 'All Tenants'}
          </span>
          {selectedTenant && (
            <Badge className={planColors[selectedTenant.plan] || 'bg-gray-100'} variant="secondary">
              {selectedTenant.plan}
            </Badge>
          )}
          <ChevronDown className="h-4 w-4 ml-auto" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[250px]">
        <DropdownMenuLabel>Select Tenant</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={() => onTenantChange('')}
          className="flex items-center justify-between"
        >
          <span>All Tenants</span>
          {!selectedTenantId && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {tenants.map((tenant) => (
          <DropdownMenuItem
            key={tenant.id}
            onClick={() => onTenantChange(tenant.id)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span>{tenant.name}</span>
              <Badge 
                className={planColors[tenant.plan] || 'bg-gray-100'} 
                variant="secondary"
              >
                {tenant.plan}
              </Badge>
            </div>
            {selectedTenantId === tenant.id && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default TenantSwitcher;
