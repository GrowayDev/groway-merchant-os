'use client';

import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Upload, Download, Users, FileSpreadsheet, 
  CheckCircle, XCircle, AlertCircle, Loader2 
} from 'lucide-react';

interface BulkUserOperationsProps {
  tenantId?: string;
  onClose: () => void;
}

interface BulkResult {
  successCount: number;
  failedCount: number;
  success: string[];
  failed: { id: string; error: string }[];
}

export function BulkUserOperations({ tenantId, onClose }: BulkUserOperationsProps) {
  const [activeTab, setActiveTab] = useState('import');
  const [isLoading, setIsLoading] = useState(false);
  const [operation, setOperation] = useState('create');
  const [csvData, setCsvData] = useState('');
  const [jsonData, setJsonData] = useState('');
  const [result, setResult] = useState<BulkResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (file.name.endsWith('.json')) {
        try {
          JSON.parse(content);
          setJsonData(content);
          setActiveTab('json');
        } catch {
          alert('Invalid JSON file');
        }
      } else {
        setCsvData(content);
        setActiveTab('csv');
      }
    };
    reader.readAsText(file);
  };

  const parseCSV = (csv: string): Record<string, string>[] => {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data: Record<string, string>[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      data.push(row);
    }
    
    return data;
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      let users: Record<string, unknown>[] = [];

      if (activeTab === 'csv' && csvData) {
        users = parseCSV(csvData);
      } else if (activeTab === 'json' && jsonData) {
        users = JSON.parse(jsonData);
      }

      if (users.length === 0) {
        throw new Error('No users to process');
      }

      const response = await fetch('/api/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation,
          users,
          tenantId,
        }),
      });

      const data = await response.json();
      setResult(data.results);
    } catch (error) {
      console.error('Error in bulk operation:', error);
      alert('Failed to process bulk operation');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = (format: 'csv' | 'json') => {
    const csvTemplate = 'type,phone,email,firstName,lastName,role,status\nconsumer,+27123456789,john@example.com,John,Doe,member,active\nadmin,,admin@example.com,Jane,Smith,admin,active';
    const jsonTemplate = JSON.stringify([
      { type: 'consumer', phone: '+27123456789', email: 'john@example.com', firstName: 'John', lastName: 'Doe', role: 'member', status: 'active' },
      { type: 'admin', email: 'admin@example.com', name: 'Admin User', role: 'admin', status: 'active' },
    ], null, 2);

    const content = format === 'csv' ? csvTemplate : jsonTemplate;
    const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-template.${format}`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk User Operations
          </DialogTitle>
          <DialogDescription>
            Import, update, or delete multiple users at once
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Operation Selection */}
          <div className="grid gap-2">
            <Label>Select Operation</Label>
            <Select value={operation} onValueChange={setOperation}>
              <SelectTrigger>
                <SelectValue placeholder="Select operation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="create">Create Users</SelectItem>
                <SelectItem value="update">Update Users</SelectItem>
                <SelectItem value="delete">Delete Users</SelectItem>
                <SelectItem value="addToTenant">Add to Tenant</SelectItem>
                <SelectItem value="removeFromTenant">Remove from Tenant</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* File Upload */}
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,.json"
              className="hidden"
            />
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              Drag and drop a file here, or click to select
            </p>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              Select File
            </Button>
            {selectedFile && (
              <p className="text-sm text-muted-foreground mt-2">
                Selected: {selectedFile.name}
              </p>
            )}
          </div>

          {/* Data Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="csv">CSV</TabsTrigger>
              <TabsTrigger value="json">JSON</TabsTrigger>
            </TabsList>

            <TabsContent value="csv" className="mt-4">
              <div className="grid gap-2">
                <Label>CSV Data</Label>
                <Textarea
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                  placeholder="type,phone,email,firstName,lastName,role,status&#10;consumer,+27123456789,john@example.com,John,Doe,member,active"
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
            </TabsContent>

            <TabsContent value="json" className="mt-4">
              <div className="grid gap-2">
                <Label>JSON Data</Label>
                <Textarea
                  value={jsonData}
                  onChange={(e) => setJsonData(e.target.value)}
                  placeholder='[{"type": "consumer", "phone": "+27123456789", ...}]'
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Templates */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Download template:</span>
            <Button variant="outline" size="sm" onClick={() => downloadTemplate('csv')}>
              <FileSpreadsheet className="h-4 w-4 mr-1" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadTemplate('json')}>
              <Download className="h-4 w-4 mr-1" />
              JSON
            </Button>
          </div>

          {/* Results */}
          {result && (
            <div className="rounded-lg border p-4 space-y-3">
              <h4 className="font-medium">Results</h4>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>{result.successCount} successful</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span>{result.failedCount} failed</span>
                </div>
              </div>
              {result.failed.length > 0 && (
                <div className="space-y-1">
                  {result.failed.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      {f.id}: {f.error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Process {operation === 'create' ? 'Import' : operation === 'update' ? 'Update' : 'Operation'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default BulkUserOperations;
