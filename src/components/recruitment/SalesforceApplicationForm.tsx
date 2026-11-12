'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { 
  User, Mail, Phone, MapPin, FileText, Car, Briefcase,
  Clock, Send, CheckCircle, Loader2
} from 'lucide-react';

interface SalesforceApplicationFormProps {
  open: boolean;
  onClose: () => void;
  selectedRole?: string;
}

const provinces = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
  'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'
];

const roles = [
  { value: 'field_agent', label: 'Field Sales Agent' },
  { value: 'senior_agent', label: 'Senior Sales Agent' },
  { value: 'team_lead', label: 'Team Lead' },
];

const experienceLevels = [
  { value: 'none', label: 'No experience (Entry level)' },
  { value: '1-2_years', label: '1-2 years' },
  { value: '3-5_years', label: '3-5 years' },
  { value: '5+_years', label: '5+ years' },
];

const availabilityOptions = [
  { value: 'immediate', label: 'Immediately' },
  { value: '1_week', label: 'Within 1 week' },
  { value: '2_weeks', label: 'Within 2 weeks' },
  { value: '1_month', label: 'Within 1 month' },
];

const hearAboutOptions = [
  'Social Media', 'Friend/Referral', 'Job Portal', 'Company Website',
  'Career Fair', 'Radio/TV', 'Other'
];

export function SalesforceApplicationForm({ open, onClose, selectedRole }: SalesforceApplicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [applicationId, setApplicationId] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    idNumber: '',
    location: '',
    province: '',
    appliedRole: selectedRole || '',
    experience: '',
    hasVehicle: false,
    driversLicense: false,
    currentEmployment: '',
    availability: '',
    hearAboutUs: '',
    motivation: '',
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
      const response = await fetch('/api/salesforce/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit application');
      }

      setApplicationId(data.application.applicationId);
      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    setError('');
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      idNumber: '',
      location: '',
      province: '',
      appliedRole: '',
      experience: '',
      hasVehicle: false,
      driversLicense: false,
      currentEmployment: '',
      availability: '',
      hearAboutUs: '',
      motivation: '',
    });
    onClose();
  };

  if (isSuccess) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl text-center">Application Submitted!</DialogTitle>
              <DialogDescription className="text-center">
                Thank you for applying to join the Groway Salesforce team.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Your Application ID:</p>
              <p className="text-lg font-mono font-bold text-[#00897B]">{applicationId}</p>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              We'll review your application and contact you within 2-3 business days.
            </p>
            <Button onClick={handleClose} className="mt-6 bg-[#00897B] hover:bg-[#00695C]">
              Close
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
          <DialogTitle className="text-xl">Apply to Join Groway Salesforce</DialogTitle>
          <DialogDescription>
            {selectedRole ? `Applying for: ${selectedRole}` : 'Fill in your details to apply'}
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
                  placeholder="John"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Last Name *</label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  required
                  placeholder="Doe"
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
                  placeholder="john@example.com"
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
                  placeholder="+27 82 123 4567"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600">ID Number (optional)</label>
              <Input
                value={formData.idNumber}
                onChange={(e) => handleInputChange('idNumber', e.target.value)}
                placeholder="8001015001089"
              />
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
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  required
                  placeholder="Johannesburg"
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

          {/* Role & Experience */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Role & Experience
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Applying for *</label>
                <Select
                  value={formData.appliedRole}
                  onValueChange={(v) => handleInputChange('appliedRole', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-gray-600">Experience Level</label>
                <Select
                  value={formData.experience}
                  onValueChange={(v) => handleInputChange('experience', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience" />
                  </SelectTrigger>
                  <SelectContent>
                    {experienceLevels.map((e) => (
                      <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 flex items-center gap-1">
                  <Car className="h-3 w-3" /> Do you have a vehicle?
                </label>
                <Select
                  value={formData.hasVehicle ? 'yes' : 'no'}
                  onValueChange={(v) => handleInputChange('hasVehicle', v === 'yes')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-gray-600">Driver's License?</label>
                <Select
                  value={formData.driversLicense ? 'yes' : 'no'}
                  onValueChange={(v) => handleInputChange('driversLicense', v === 'yes')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Additional Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Current Employment</label>
                <Input
                  value={formData.currentEmployment}
                  onChange={(e) => handleInputChange('currentEmployment', e.target.value)}
                  placeholder="Unemployed / Company name"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Availability
                </label>
                <Select
                  value={formData.availability}
                  onValueChange={(v) => handleInputChange('availability', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="When can you start?" />
                  </SelectTrigger>
                  <SelectContent>
                    {availabilityOptions.map((a) => (
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600">How did you hear about us?</label>
              <Select
                value={formData.hearAboutUs}
                onValueChange={(v) => handleInputChange('hearAboutUs', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {hearAboutOptions.map((h) => (
                    <SelectItem key={h} value={h}>{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-gray-600">Why do you want to join? (optional)</label>
              <textarea
                className="w-full min-h-[80px] p-3 border rounded-md text-sm"
                value={formData.motivation}
                onChange={(e) => handleInputChange('motivation', e.target.value)}
                placeholder="Tell us about your motivation..."
              />
            </div>
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
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Application
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default SalesforceApplicationForm;
