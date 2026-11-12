'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  User, Mail, Phone, MapPin, Building, Wallet, Gift,
  Send, CheckCircle, Loader2, Copy, Check
} from 'lucide-react';

interface AgentRegistrationFormProps {
  open: boolean;
  onClose: () => void;
  parentReferralCode?: string;
}

const provinces = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
  'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'
];

const businessTypes = [
  'Retail Shop', 'Restaurant/Cafe', 'Salon/Beauty', 'Hardware',
  'Pharmacy', 'Clothing', 'Electronics', 'Services', 'Other'
];

export function AgentRegistrationForm({ open, onClose, parentReferralCode }: AgentRegistrationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [agentData, setAgentData] = useState<{ referralCode: string; agentCode: string } | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    idNumber: '',
    businessName: '',
    businessType: '',
    province: '',
    city: '',
    parentReferralCode: parentReferralCode || '',
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    branchCode: '',
    termsAccepted: false,
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register');
      }

      setAgentData({
        referralCode: data.agent.referralCode,
        agentCode: data.agent.agentCode,
      });
      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setIsSuccess(false);
    setError('');
    setAgentData(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      idNumber: '',
      businessName: '',
      businessType: '',
      province: '',
      city: '',
      parentReferralCode: '',
      bankName: '',
      accountNumber: '',
      accountHolder: '',
      branchCode: '',
      termsAccepted: false,
    });
    onClose();
  };

  if (isSuccess && agentData) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl text-center">Welcome to the Agent Network!</DialogTitle>
              <DialogDescription className="text-center">
                Your registration is complete. Start earning commissions today!
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 space-y-4">
              <div className="p-4 bg-[#E0F2F1] rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Your Referral Code</p>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-mono font-bold text-[#00897B]">{agentData.referralCode}</p>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handleCopy(agentData.referralCode)}
                  >
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Your Agent Code</p>
                <p className="text-lg font-mono font-semibold">{agentData.agentCode}</p>
              </div>
            </div>

            <div className="mt-6 p-4 border rounded-lg text-left">
              <h4 className="font-semibold text-sm mb-2">Next Steps:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Share your referral code with merchants</li>
                <li>• Complete KYC verification to enable payouts</li>
                <li>• Track your referrals in the agent portal</li>
                <li>• Earn 5% commission on every signup!</li>
              </ul>
            </div>

            <Button onClick={handleClose} className="mt-6 w-full bg-[#00897B] hover:bg-[#00695C]">
              Start Earning
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Gift className="h-5 w-5 text-[#00897B]" />
            Become an Agent
          </DialogTitle>
          <DialogDescription>
            Join our agent network and start earning commissions on referrals.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <User className="h-4 w-4" />
              Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">First Name *</label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Last Name *</label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 flex items-center gap-1">
                  <Mail className="h-3 w-3" /> Email *
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Phone *
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600">ID Number</label>
              <Input
                value={formData.idNumber}
                onChange={(e) => handleInputChange('idNumber', e.target.value)}
              />
            </div>
          </div>

          {/* Business Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Building className="h-4 w-4" />
              Business Information (Optional)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Business Name</label>
                <Input
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Business Type</label>
                <Select
                  value={formData.businessType}
                  onValueChange={(v) => handleInputChange('businessType', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {businessTypes.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">City/Town *</label>
                <Input
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Province *</label>
                <Select
                  value={formData.province}
                  onValueChange={(v) => handleInputChange('province', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select province" />
                  </SelectTrigger>
                  <SelectContent>
                    {provinces.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Bank Details (For Payouts)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Bank Name</label>
                <Input
                  value={formData.bankName}
                  onChange={(e) => handleInputChange('bankName', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Account Number</label>
                <Input
                  value={formData.accountNumber}
                  onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Account Holder</label>
                <Input
                  value={formData.accountHolder}
                  onChange={(e) => handleInputChange('accountHolder', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Branch Code</label>
                <Input
                  value={formData.branchCode}
                  onChange={(e) => handleInputChange('branchCode', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Referral Code */}
          {parentReferralCode && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Referred by: <span className="font-mono font-semibold">{parentReferralCode}</span>
              </p>
            </div>
          )}

          {/* Terms */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="terms"
              checked={formData.termsAccepted}
              onCheckedChange={(checked) => handleInputChange('termsAccepted', checked === true)}
            />
            <label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
              I agree to the{' '}
              <a href="#" className="text-[#00897B] underline">Agent Network Terms</a>
              {' '}and{' '}
              <a href="#" className="text-[#00897B] underline">Commission Policy</a>.
              I understand that commissions are paid monthly and I must complete KYC to receive payouts.
            </label>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-[#00897B] hover:bg-[#00695C]"
              disabled={isSubmitting || !formData.termsAccepted}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Register Now
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AgentRegistrationForm;
