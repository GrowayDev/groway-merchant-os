'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  CreditCard, TrendingUp, Clock, CheckCircle, AlertCircle, 
  Plus, ArrowRight, Building2, Shield,
  FileText, Wallet, Calendar, Percent, ArrowUpRight, ArrowDownRight,
  Info, X, RefreshCw, Download,
  Check, Lock, Zap, ShoppingCart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

// Types
interface CreditTier {
  id: string;
  name: string;
  displayName: string;
  minLimit: number;
  maxLimit: number;
  interestRate: number;
  interestSpread: number;
  termMonths: number;
  minTermMonths: number;
  maxTermMonths: number;
  earlyPayDiscount: number;
  requireNCA: boolean;
  requireGuarantee: boolean;
  minRevenue: number;
  minTradingMonths: number;
  features: string;
  color: string;
  icon: string;
}

interface CreditFacility {
  id: string;
  merchantId: string;
  tierName: string;
  status: string;
  approvedLimit: number;
  availableCredit: number;
  drawnAmount: number;
  interestRate: number;
  totalRepaid: number;
  totalInterestPaid: number;
  totalDraws: number;
  activeDraws: number;
  nextPaymentDue: string | null;
  nextPaymentAmount: number;
  riskScore: number;
  paymentScore: number;
  utilizationRate: number;
  creditHealth: string;
}

interface DrawRequest {
  id: string;
  referenceNumber: string;
  amount: number;
  purpose: string;
  termMonths: number;
  interestRate: number;
  monthlyPayment: number;
  totalInterest: number;
  totalRepayable: number;
  status: string;
  createdAt: string;
  ncaAccepted: boolean;
  disbursedAt?: string;
}

interface Repayment {
  id: string;
  referenceNumber: string;
  amount: number;
  principalAmount: number;
  interestAmount: number;
  penaltyAmount: number;
  dueDate: string;
  paidDate?: string;
  status: string;
  paymentMethod?: string;
  lateFeeApplied: boolean;
}

// Format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Format date
const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

// Main Component
export default function GroCreditPage() {
  const [view, setView] = useState<'landing' | 'apply' | 'dashboard'>('landing');
  const [facility, setFacility] = useState<CreditFacility | null>(null);
  const [tiers, setTiers] = useState<CreditTier[]>([]);
  const [drawRequests, setDrawRequests] = useState<DrawRequest[]>([]);
  const [repayments, setRepayments] = useState<Repayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Draw request form state
  const [drawForm, setDrawForm] = useState({
    amount: 0,
    purpose: 'inventory',
    termMonths: 12,
    purposeDescription: ''
  });
  const [showDrawModal, setShowDrawModal] = useState(false);

  // Fetch facility data
  const fetchFacility = useCallback(async () => {
    try {
      const response = await fetch('/api/grocredit/facility?merchantId=demo-merchant');
      const data = await response.json();
      if (data.success) {
        setFacility(data.data);
        setTiers(data.tiers || []);
      }
    } catch (error) {
      console.error('Error fetching facility:', error);
    }
  }, []);

  // Fetch draw requests
  const fetchDrawRequests = useCallback(async () => {
    try {
      const response = await fetch('/api/grocredit/draw-requests?merchantId=demo-merchant');
      const data = await response.json();
      if (data.success) {
        setDrawRequests(data.data);
      }
    } catch (error) {
      console.error('Error fetching draw requests:', error);
    }
  }, []);

  // Fetch repayments
  const fetchRepayments = useCallback(async () => {
    try {
      const response = await fetch('/api/grocredit/repayments?merchantId=demo-merchant');
      const data = await response.json();
      if (data.success) {
        setRepayments(data.data);
      }
    } catch (error) {
      console.error('Error fetching repayments:', error);
    }
  }, []);

  // Initialize data
  useEffect(() => {
    fetchFacility();
    fetchDrawRequests();
    fetchRepayments();
  }, [fetchFacility, fetchDrawRequests, fetchRepayments]);

  // Handle draw request
  const handleDrawRequest = async () => {
    if (drawForm.amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (facility && drawForm.amount > facility.availableCredit) {
      toast.error(`Maximum available: ${formatCurrency(facility.availableCredit)}`);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/grocredit/draw-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: 'demo-merchant',
          ...drawForm
        })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Draw request submitted successfully!');
        setShowDrawModal(false);
        fetchFacility();
        fetchDrawRequests();
      } else {
        toast.error(data.error || 'Failed to submit draw request');
      }
    } catch {
      toast.error('Failed to submit draw request');
    } finally {
      setLoading(false);
    }
  };

  // Calculate monthly payment
  const calculateMonthlyPayment = () => {
    const rate = facility?.interestRate || 13.25;
    const monthlyRate = rate / 100 / 12;
    const amount = drawForm.amount;
    const months = drawForm.termMonths;
    
    if (amount <= 0 || months <= 0) return { monthly: 0, total: 0, interest: 0 };
    
    const monthly = amount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
      (Math.pow(1 + monthlyRate, months) - 1);
    const total = monthly * months;
    const interest = total - amount;
    
    return {
      monthly: Math.round(monthly * 100) / 100,
      total: Math.round(total * 100) / 100,
      interest: Math.round(interest * 100) / 100
    };
  };

  // Landing Page
  const LandingPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-green-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-green-500 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">GroCredit</h1>
              <p className="text-xs text-gray-500">Merchant Financing</p>
            </div>
          </div>
          <Button onClick={() => setView('dashboard')} variant="outline">
            Dashboard
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-teal-100 text-teal-700 hover:bg-teal-100">
            NCR Registered Credit Provider
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Working Capital for Your Business
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Quick access to inventory financing. Pay suppliers instantly, 
            repay from sales. Designed for South African merchants.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600"
              onClick={() => setView('apply')}
            >
              Apply Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => setView('dashboard')}>
              View Dashboard
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {[
            { label: 'Credit Disbursed', value: 'R47M+', icon: TrendingUp },
            { label: 'Active Merchants', value: '1,200+', icon: Building2 },
            { label: 'Avg. Approval Time', value: '24hrs', icon: Clock },
            { label: 'Repayment Rate', value: '98.5%', icon: CheckCircle }
          ].map((stat, i) => (
            <Card key={i} className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <stat.icon className="w-8 h-8 text-teal-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-center mb-8">How GroCredit Works</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: 'Instant Approval',
                description: 'Apply in 5 minutes. Get approved within 24 hours based on your Groway transaction history.'
              },
              {
                icon: ShoppingCart,
                title: 'Pay Suppliers Directly',
                description: 'Draw credit to pay suppliers via GroSupply. Stock your shelves without cash upfront.'
              },
              {
                icon: RefreshCw,
                title: 'Repay from Sales',
                description: 'Automatic daily repayments from your POS sales. Flexible terms from 1-36 months.'
              }
            ].map((feature, i) => (
              <Card key={i} className="bg-white hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <feature.icon className="w-12 h-12 text-teal-500 mb-4" />
                  <h4 className="text-lg font-semibold mb-2">{feature.title}</h4>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Credit Tiers */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-center mb-8">Credit Tiers</h3>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              {
                name: 'Starter',
                limit: 'R5K - R25K',
                rate: '15.5%',
                color: 'from-gray-400 to-gray-500',
                features: ['Quick approval', '6-month terms', 'No collateral']
              },
              {
                name: 'Business',
                limit: 'R25K - R100K',
                rate: '13.25%',
                color: 'from-teal-400 to-teal-500',
                features: ['Priority support', 'GroSupply integration', '12-month terms']
              },
              {
                name: 'Enterprise',
                limit: 'R100K - R500K',
                rate: '11.5%',
                color: 'from-green-400 to-green-500',
                features: ['Dedicated manager', 'Custom schedules', '36-month terms']
              },
              {
                name: 'Seasonal',
                limit: 'R10K - R75K',
                rate: '12.75%',
                color: 'from-orange-400 to-orange-500',
                features: ['Short-term funding', 'Stock builds', '3-6 month terms']
              }
            ].map((tier, i) => (
              <Card key={i} className={`bg-gradient-to-br ${tier.color} text-white`}>
                <CardContent className="p-6">
                  <h4 className="text-xl font-bold mb-2">{tier.name}</h4>
                  <div className="text-2xl font-bold mb-1">{tier.limit}</div>
                  <div className="text-sm opacity-90 mb-4">From {tier.rate} p.a.</div>
                  <ul className="space-y-2 text-sm">
                    {tier.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="text-center">
          <div className="flex flex-wrap justify-center gap-8 mb-8">
            {[
              { icon: Shield, label: 'NCR Registered' },
              { icon: Lock, label: 'POPIA Compliant' },
              { icon: FileText, label: 'NCA Compliant' },
              { icon: Badge, label: 'FSCA Regulated' }
            ].map((badge, i) => (
              <div key={i} className="flex items-center gap-2 text-gray-600">
                <badge.icon className="w-5 h-5 text-teal-500" />
                <span className="text-sm">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          <p>GroCredit is a registered credit provider (NCP xxx). All credit is subject to approval.</p>
          <p className="mt-1">Terms apply. Interest rates based on repo rate + spread. E&OE.</p>
        </div>
      </footer>
    </div>
  );

  // Application Form
  const ApplicationForm = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
      businessName: '',
      tradingName: '',
      registrationNumber: '',
      vatNumber: '',
      businessType: 'sole_proprietor',
      industry: '',
      tradingMonths: 12,
      monthlyRevenue: 0,
      annualRevenue: 0,
      requestedAmount: 50000,
      requestedTerm: 12,
      purpose: 'inventory',
      bankName: '',
      bankAccount: '',
      bankBranch: '',
      accountHolder: ''
    });

    const handleSubmit = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/grocredit/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ merchantId: 'demo-merchant', ...formData })
        });
        const data = await response.json();
        if (data.success) {
          toast.success('Application submitted successfully!');
          setView('dashboard');
        } else {
          toast.error(data.error || 'Failed to submit application');
        }
      } catch {
        toast.error('Failed to submit application');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <header className="border-b bg-white sticky top-0 z-50">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setView('landing')}>
              ← Back
            </Button>
            <h1 className="font-semibold">Credit Application</h1>
            <div className="text-sm text-gray-500">Step {step} of 3</div>
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-4 py-8">
          <Progress value={(step / 3) * 100} className="mb-8" />

          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Registered Business Name *</Label>
                    <Input 
                      value={formData.businessName}
                      onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                      placeholder="ABC Trading (Pty) Ltd"
                    />
                  </div>
                  <div>
                    <Label>Trading Name</Label>
                    <Input 
                      value={formData.tradingName}
                      onChange={(e) => setFormData({...formData, tradingName: e.target.value})}
                      placeholder="ABC Store"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Company Registration Number</Label>
                    <Input 
                      value={formData.registrationNumber}
                      onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})}
                      placeholder="2023/123456/07"
                    />
                  </div>
                  <div>
                    <Label>VAT Number</Label>
                    <Input 
                      value={formData.vatNumber}
                      onChange={(e) => setFormData({...formData, vatNumber: e.target.value})}
                      placeholder="4123456789"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Business Type</Label>
                    <select 
                      className="w-full px-3 py-2 border rounded-lg"
                      value={formData.businessType}
                      onChange={(e) => setFormData({...formData, businessType: e.target.value})}
                    >
                      <option value="sole_proprietor">Sole Proprietor</option>
                      <option value="cc">Close Corporation</option>
                      <option value="pty">Pty Ltd</option>
                      <option value="partnership">Partnership</option>
                    </select>
                  </div>
                  <div>
                    <Label>Industry</Label>
                    <select 
                      className="w-full px-3 py-2 border rounded-lg"
                      value={formData.industry}
                      onChange={(e) => setFormData({...formData, industry: e.target.value})}
                    >
                      <option value="">Select industry</option>
                      <option value="grocery">Grocery / FMCG</option>
                      <option value="restaurant">Restaurant / Food Service</option>
                      <option value="retail">Retail</option>
                      <option value="liquor">Liquor / Bar</option>
                      <option value="pharmacy">Pharmacy</option>
                      <option value="salon">Salon / Spa</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Financial Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Months in Operation</Label>
                    <Input 
                      type="number"
                      value={formData.tradingMonths}
                      onChange={(e) => setFormData({...formData, tradingMonths: parseInt(e.target.value) || 0})}
                      placeholder="12"
                    />
                  </div>
                  <div>
                    <Label>Monthly Revenue (ZAR)</Label>
                    <Input 
                      type="number"
                      value={formData.monthlyRevenue}
                      onChange={(e) => setFormData({...formData, monthlyRevenue: parseFloat(e.target.value) || 0})}
                      placeholder="100000"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Requested Credit Amount (ZAR) *</Label>
                    <Input 
                      type="number"
                      value={formData.requestedAmount}
                      onChange={(e) => setFormData({...formData, requestedAmount: parseFloat(e.target.value) || 0})}
                      placeholder="50000"
                    />
                  </div>
                  <div>
                    <Label>Preferred Term (months)</Label>
                    <select 
                      className="w-full px-3 py-2 border rounded-lg"
                      value={formData.requestedTerm}
                      onChange={(e) => setFormData({...formData, requestedTerm: parseInt(e.target.value)})}
                    >
                      <option value={3}>3 months</option>
                      <option value={6}>6 months</option>
                      <option value={12}>12 months</option>
                      <option value={18}>18 months</option>
                      <option value={24}>24 months</option>
                      <option value={36}>36 months</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label>Purpose of Credit</Label>
                  <select 
                    className="w-full px-3 py-2 border rounded-lg"
                    value={formData.purpose}
                    onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                  >
                    <option value="inventory">Inventory / Stock Purchase</option>
                    <option value="equipment">Equipment Purchase</option>
                    <option value="expansion">Business Expansion</option>
                    <option value="seasonal">Seasonal Stock Build</option>
                    <option value="emergency">Emergency Working Capital</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Banking Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Bank Name</Label>
                  <select 
                    className="w-full px-3 py-2 border rounded-lg"
                    value={formData.bankName}
                    onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                  >
                    <option value="">Select bank</option>
                    <option value="fnb">FNB</option>
                    <option value="capitec">Capitec</option>
                    <option value="standard">Standard Bank</option>
                    <option value="absa">Absa</option>
                    <option value="nedbank">Nedbank</option>
                    <option value="tyme">TymeBank</option>
                    <option value="african">African Bank</option>
                  </select>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Account Number</Label>
                    <Input 
                      value={formData.bankAccount}
                      onChange={(e) => setFormData({...formData, bankAccount: e.target.value})}
                      placeholder="1234567890"
                    />
                  </div>
                  <div>
                    <Label>Branch Code</Label>
                    <Input 
                      value={formData.bankBranch}
                      onChange={(e) => setFormData({...formData, bankBranch: e.target.value})}
                      placeholder="250655"
                    />
                  </div>
                </div>
                <div>
                  <Label>Account Holder Name</Label>
                  <Input 
                    value={formData.accountHolder}
                    onChange={(e) => setFormData({...formData, accountHolder: e.target.value})}
                    placeholder="ABC Trading (Pty) Ltd"
                  />
                </div>

                {/* NCA Disclosure */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-amber-800 mb-1">NCA Disclosure Notice</h4>
                      <p className="text-sm text-amber-700">
                        By submitting this application, you acknowledge that this is a credit agreement 
                        governed by the National Credit Act (NCA). You have the right to receive a 
                        pre-agreement statement and quotation before signing. Interest rates are 
                        calculated based on the current repo rate plus a tier-based spread.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between mt-6">
            <Button 
              variant="outline" 
              onClick={() => step > 1 ? setStep(step - 1) : setView('landing')}
            >
              {step > 1 ? 'Previous' : 'Cancel'}
            </Button>
            <Button 
              onClick={() => step < 3 ? setStep(step + 1) : handleSubmit()}
              disabled={loading}
              className="bg-gradient-to-r from-teal-500 to-green-500"
            >
              {loading ? 'Submitting...' : step < 3 ? 'Continue' : 'Submit Application'}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Dashboard
  const Dashboard = () => (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-green-500 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">GroCredit</h1>
              <p className="text-xs text-gray-500">Merchant Financing</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setView('landing')}>
              Home
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Facility Overview */}
        {facility && (
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-teal-500 to-green-500 text-white">
              <CardContent className="p-4">
                <div className="text-sm opacity-90">Available Credit</div>
                <div className="text-3xl font-bold">{formatCurrency(facility.availableCredit)}</div>
                <div className="text-sm opacity-75 mt-1">of {formatCurrency(facility.approvedLimit)} limit</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">Drawn Amount</div>
                  <ArrowUpRight className="w-4 h-4 text-red-500" />
                </div>
                <div className="text-2xl font-bold">{formatCurrency(facility.drawnAmount)}</div>
                <Progress 
                  value={facility.utilizationRate} 
                  className="h-2 mt-2"
                />
                <div className="text-xs text-gray-500 mt-1">{facility.utilizationRate}% utilized</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">Interest Rate</div>
                  <Percent className="w-4 h-4 text-teal-500" />
                </div>
                <div className="text-2xl font-bold">{facility.interestRate}%</div>
                <div className="text-xs text-gray-500">per annum</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">Next Payment</div>
                  <Calendar className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl font-bold">{formatCurrency(facility.nextPaymentAmount)}</div>
                <div className="text-xs text-gray-500">
                  {facility.nextPaymentDue ? formatDate(facility.nextPaymentDue) : 'No pending payments'}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-3 mb-6">
          <Button 
            className="bg-gradient-to-r from-teal-500 to-green-500"
            onClick={() => setShowDrawModal(true)}
            disabled={!facility || facility.status !== 'active'}
          >
            <Plus className="w-4 h-4 mr-2" />
            Request Draw
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Statement
          </Button>
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            NCA Documents
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="draws">Draw Requests</TabsTrigger>
            <TabsTrigger value="repayments">Repayments</TabsTrigger>
            <TabsTrigger value="history">Transaction History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Credit Health */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Credit Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                      facility?.creditHealth === 'healthy' ? 'bg-green-100' :
                      facility?.creditHealth === 'moderate' ? 'bg-amber-100' : 'bg-red-100'
                    }`}>
                      <span className={`text-2xl font-bold ${
                        facility?.creditHealth === 'healthy' ? 'text-green-600' :
                        facility?.creditHealth === 'moderate' ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {facility?.riskScore || 78}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold capitalize">{facility?.creditHealth || 'Healthy'}</div>
                      <div className="text-sm text-gray-500">Credit Score</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Payment Score</span>
                      <span className="font-medium">{facility?.paymentScore || 85}/100</span>
                    </div>
                    <Progress value={facility?.paymentScore || 85} className="h-2" />
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Repaid</span>
                      <span className="font-medium text-green-600">{formatCurrency(facility?.totalRepaid || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Interest Paid</span>
                      <span className="font-medium">{formatCurrency(facility?.totalInterestPaid || 0)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tier Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Tier: {facility?.tierName || 'Business'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Credit Limit</span>
                      <span className="font-medium">{formatCurrency(facility?.approvedLimit || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Interest Rate</span>
                      <span className="font-medium">{facility?.interestRate || 13.25}% p.a.</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Active Draws</span>
                      <span className="font-medium">{facility?.activeDraws || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Draws</span>
                      <span className="font-medium">{facility?.totalDraws || 0}</span>
                    </div>
                    <Separator className="my-4" />
                    <Button variant="outline" className="w-full">
                      Request Limit Increase
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...drawRequests.slice(0, 3), ...repayments.slice(0, 3)]
                    .sort((a, b) => new Date(b.createdAt || b.dueDate).getTime() - new Date(a.createdAt || a.dueDate).getTime())
                    .slice(0, 5)
                    .map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            'amount' in item ? 'bg-blue-100' : 'bg-green-100'
                          }`}>
                            {'amount' in item ? (
                              <ArrowUpRight className="w-5 h-5 text-blue-600" />
                            ) : (
                              <ArrowDownRight className="w-5 h-5 text-green-600" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">
                              {'amount' in item ? 'Draw Request' : 'Repayment'}
                            </div>
                            <div className="text-sm text-gray-500">{item.referenceNumber}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {'amount' in item ? formatCurrency(item.amount) : formatCurrency(item.amount)}
                          </div>
                          <Badge variant={item.status === 'paid' ? 'default' : 'secondary'}>
                            {item.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="draws">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Draw Requests</CardTitle>
                  <Button onClick={() => setShowDrawModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Draw
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {drawRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <div className="text-gray-500">No draw requests yet</div>
                    <Button className="mt-4" onClick={() => setShowDrawModal(true)}>
                      Request Your First Draw
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {drawRequests.map((draw) => (
                      <div key={draw.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="font-semibold">{draw.referenceNumber}</div>
                            <div className="text-sm text-gray-500">
                              {formatDate(draw.createdAt)} • {draw.purpose}
                            </div>
                          </div>
                          <Badge className={
                            draw.status === 'disbursed' ? 'bg-green-100 text-green-700' :
                            draw.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                            draw.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }>
                            {draw.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-gray-500">Amount</div>
                            <div className="font-medium">{formatCurrency(draw.amount)}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Term</div>
                            <div className="font-medium">{draw.termMonths} months</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Monthly</div>
                            <div className="font-medium">{formatCurrency(draw.monthlyPayment)}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Total Repay</div>
                            <div className="font-medium">{formatCurrency(draw.totalRepayable)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="repayments">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Repayment Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {repayments.map((repayment) => (
                    <div key={repayment.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-semibold">{repayment.referenceNumber}</div>
                          <div className="text-sm text-gray-500">
                            Due: {formatDate(repayment.dueDate)}
                            {repayment.paidDate && ` • Paid: ${formatDate(repayment.paidDate)}`}
                          </div>
                        </div>
                        <Badge className={
                          repayment.status === 'paid' ? 'bg-green-100 text-green-700' :
                          repayment.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          repayment.status === 'overdue' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }>
                          {repayment.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-gray-500">Amount</div>
                          <div className="font-medium">{formatCurrency(repayment.amount)}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Principal</div>
                          <div className="font-medium">{formatCurrency(repayment.principalAmount)}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Interest</div>
                          <div className="font-medium">{formatCurrency(repayment.interestAmount)}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Method</div>
                          <div className="font-medium capitalize">{repayment.paymentMethod || 'Debit Order'}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...repayments, ...drawRequests]
                    .sort((a, b) => new Date(b.createdAt || b.dueDate).getTime() - new Date(a.createdAt || a.dueDate).getTime())
                    .map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-3 border-b">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            'amount' in item ? 'bg-blue-100' : 'bg-green-100'
                          }`}>
                            {'amount' in item ? (
                              <ArrowUpRight className="w-5 h-5 text-blue-600" />
                            ) : (
                              <ArrowDownRight className="w-5 h-5 text-green-600" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium capitalize">
                              {'amount' in item ? 'Credit Draw' : 'Repayment'}
                            </div>
                            <div className="text-sm text-gray-500">{item.referenceNumber}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-medium ${'amount' in item ? 'text-red-600' : 'text-green-600'}`}>
                            {'amount' in item ? '-' : '+'}{formatCurrency(item.amount)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(item.createdAt || item.dueDate)}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Draw Request Modal */}
      {showDrawModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Request Credit Draw</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowDrawModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Amount (ZAR)</Label>
                <Input
                  type="number"
                  value={drawForm.amount}
                  onChange={(e) => setDrawForm({...drawForm, amount: parseFloat(e.target.value) || 0})}
                  placeholder="Enter amount"
                />
                <div className="text-sm text-gray-500 mt-1">
                  Available: {formatCurrency(facility?.availableCredit || 0)}
                </div>
              </div>
              <div>
                <Label>Purpose</Label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  value={drawForm.purpose}
                  onChange={(e) => setDrawForm({...drawForm, purpose: e.target.value})}
                >
                  <option value="inventory">Inventory / Stock Purchase</option>
                  <option value="equipment">Equipment Purchase</option>
                  <option value="expansion">Business Expansion</option>
                  <option value="seasonal">Seasonal Stock Build</option>
                  <option value="emergency">Emergency Working Capital</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <Label>Repayment Term</Label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  value={drawForm.termMonths}
                  onChange={(e) => setDrawForm({...drawForm, termMonths: parseInt(e.target.value)})}
                >
                  <option value={3}>3 months</option>
                  <option value={6}>6 months</option>
                  <option value={12}>12 months</option>
                  <option value={18}>18 months</option>
                  <option value={24}>24 months</option>
                </select>
              </div>

              {/* Calculated Summary */}
              {drawForm.amount > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Monthly Payment</span>
                    <span className="font-medium">{formatCurrency(calculateMonthlyPayment().monthly)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Interest</span>
                    <span className="font-medium">{formatCurrency(calculateMonthlyPayment().interest)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Total Repayable</span>
                    <span>{formatCurrency(calculateMonthlyPayment().total)}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowDrawModal(false)}>
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-teal-500 to-green-500"
                  onClick={handleDrawRequest}
                  disabled={loading || drawForm.amount <= 0}
                >
                  {loading ? 'Processing...' : 'Submit Request'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  // Render based on view
  return (
    <>
      {view === 'landing' && <LandingPage />}
      {view === 'apply' && <ApplicationForm />}
      {view === 'dashboard' && <Dashboard />}
    </>
  );
}
