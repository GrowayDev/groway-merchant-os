'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Mail, Send, Clock, CheckCircle, XCircle, 
  RefreshCw, Plus, Trash2, Loader2 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  invitedByName: string;
  expiresAt: string;
  acceptedAt?: string;
  createdAt: string;
  tenant?: {
    name: string;
    slug: string;
  };
}

interface UserInvitationDialogProps {
  tenantId?: string;
  onClose: () => void;
  standalone?: boolean;
}

export function UserInvitationDialog({ 
  tenantId, 
  onClose, 
  standalone = false 
}: UserInvitationDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [emails, setEmails] = useState('');
  const [role, setRole] = useState('member');
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [result, setResult] = useState<{
    successCount: number;
    failedCount: number;
    failed: { email: string; error: string }[];
  } | null>(null);

  const fetchInvitations = async () => {
    try {
      const params = new URLSearchParams({
        ...(tenantId && { tenantId }),
      });
      const response = await fetch(`/api/users/invite?${params}`);
      const data = await response.json();
      setInvitations(data.invitations || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [tenantId]);

  const handleSendInvitations = async () => {
    if (!emails.trim()) return;
    setIsLoading(true);
    setResult(null);

    try {
      const emailList = emails
        .split(/[,\n]/)
        .map(e => e.trim())
        .filter(e => e.includes('@'));

      if (emailList.length === 0) {
        throw new Error('No valid emails found');
      }

      const response = await fetch('/api/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails: emailList,
          tenantId,
          role,
          invitedBy: 'current-user', // Should be actual user ID
          invitedByName: 'Admin', // Should be actual user name
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(data.results);
        setEmails('');
        fetchInvitations();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error sending invitations:', error);
      alert('Failed to send invitations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await fetch(`/api/users/invite?id=${invitationId}`, { method: 'DELETE' });
      fetchInvitations();
    } catch (error) {
      console.error('Error canceling invitation:', error);
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-green-100 text-green-800',
    declined: 'bg-red-100 text-red-800',
    expired: 'bg-gray-100 text-gray-800',
  };

  const content = (
    <div className="space-y-6">
      {/* Send Invitations Form */}
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="emails">Email Addresses</Label>
          <Textarea
            id="emails"
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            placeholder="Enter email addresses, one per line or comma-separated&#10;john@example.com&#10;jane@example.com"
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            Enter one email per line or separate with commas
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="role">Assign Role</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="owner">Owner</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results */}
        {result && (
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>{result.successCount} invitations sent</span>
              </div>
              {result.failedCount > 0 && (
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span>{result.failedCount} failed</span>
                </div>
              )}
            </div>
            {result.failed.length > 0 && (
              <div className="text-sm text-red-600">
                {result.failed.map((f, i) => (
                  <div key={i}>{f.email}: {f.error}</div>
                ))}
              </div>
            )}
          </div>
        )}

        <Button 
          onClick={handleSendInvitations} 
          disabled={isLoading || !emails.trim()}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send Invitations
            </>
          )}
        </Button>
      </div>

      {/* Pending Invitations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Recent Invitations</h3>
          <Button variant="outline" size="sm" onClick={fetchInvitations}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>

        {invitations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No invitations found
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invited By</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium">
                      {invitation.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{invitation.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[invitation.status]}>
                        {invitation.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{invitation.invitedByName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(invitation.expiresAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      {invitation.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelInvitation(invitation.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );

  if (standalone) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6" />
            User Invitations
          </h2>
          <p className="text-muted-foreground">
            Send and manage user invitations to your tenant
          </p>
        </div>
        {content}
      </div>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invite Users
          </DialogTitle>
          <DialogDescription>
            Send invitations to new users to join your organization
          </DialogDescription>
        </DialogHeader>

        {content}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default UserInvitationDialog;
