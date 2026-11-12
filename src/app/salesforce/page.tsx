'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  ArrowRight,
  ArrowLeft,
  Users,
  DollarSign,
  Briefcase,
  TrendingUp,
  CheckCircle2,
  MapPin,
  Calendar,
  Clock,
  GraduationCap,
  Target,
  Award,
  Play,
  Building2,
  UserPlus,
  Wallet,
  Shield,
  Car,
  Phone,
  Mail,
  Star,
  Globe,
  MessageCircle,
  UserCog,
} from 'lucide-react'

// Job roles
const jobRoles = [
  {
    title: 'Field Sales Agent',
    type: 'Full-time / Contract',
    location: 'Nationwide',
    description: 'Primary merchant acquisition role. Visit businesses, present Groway POS, and onboard new merchants.',
    requirements: ['Valid driver\'s license', 'Own vehicle preferred', 'Strong communication skills', 'Sales experience preferred'],
    salary: 'Base + Commission (R8,000 - R25,000+/month)',
    icon: MapPin,
  },
  {
    title: 'Senior Sales Agent',
    type: 'Full-time',
    location: 'Major Cities',
    description: 'Experienced agent with territory management and team mentorship responsibilities.',
    requirements: ['2+ years in field sales', 'Team leadership experience', 'Territory planning skills', 'CRM proficiency'],
    salary: 'Base + Commission + Override (R15,000 - R40,000+/month)',
    icon: UserCog,
  },
  {
    title: 'Team Lead',
    type: 'Full-time',
    location: 'Regional',
    description: 'Lead a team of 8-12 field agents. Drive performance and territory coverage.',
    requirements: ['3+ years in sales leadership', 'Proven track record', 'Coaching ability', 'Strategic planning'],
    salary: 'Base + Team Override + Bonuses (R25,000 - R60,000+/month)',
    icon: Users,
  },
]

// Benefits
const benefits = [
  {
    title: 'Competitive Commission',
    description: 'Earn 5-15% commission on every merchant you onboard. Top performers earn R50,000+ monthly.',
    icon: DollarSign,
  },
  {
    title: 'Training & Development',
    description: 'Comprehensive onboarding, product training, and ongoing sales coaching.',
    icon: GraduationCap,
  },
  {
    title: 'Career Growth',
    description: 'Clear progression path from Agent → Senior Agent → Team Lead → Regional Manager.',
    icon: TrendingUp,
  },
  {
    title: 'Flexible Schedule',
    description: 'Manage your own time while meeting territory coverage targets.',
    icon: Calendar,
  },
  {
    title: 'Territory Support',
    description: 'Leads provided, marketing materials, and CRM tools to help you succeed.',
    icon: Target,
  },
  {
    title: 'Incentives & Rewards',
    description: 'Monthly bonuses, quarterly competitions, and annual recognition events.',
    icon: Award,
  },
]

// Testimonials
const testimonials = [
  {
    name: 'Thabo Molefe',
    role: 'Senior Sales Agent - Gauteng North',
    quote: 'I started as a field agent 2 years ago. Now I lead my own team and earn 3x what I did at my corporate job.',
    earnings: 'R45,000/month average',
    avatar: 'TM',
  },
  {
    name: 'Nomsa Ndlovu',
    role: 'Team Lead - KwaZulu-Natal',
    quote: 'The commission structure is amazing. I love meeting merchants and showing them how Groway can transform their business.',
    earnings: 'R55,000/month average',
    avatar: 'NN',
  },
  {
    name: 'Jacob Zulu',
    role: 'Top Performer - Eastern Cape',
    quote: 'I\'ve recruited 67 merchants this year. The override from my team\'s performance gives me passive income too.',
    earnings: 'R65,000/month average',
    avatar: 'JZ',
  },
]

// Stats
const salesforceStats = [
  { value: '892', label: 'Active Agents' },
  { value: 'R4.5M', label: 'Monthly Commissions Paid' },
  { value: '23.5%', label: 'Conversion Rate' },
  { value: '85%', label: 'Agent Retention' },
]

// FAQ
const faqs = [
  {
    q: 'What does a Field Sales Agent do?',
    a: 'You visit small businesses in your assigned territory, demonstrate Groway POS, and help them sign up. You\'re the face of Groway to merchants.',
  },
  {
    q: 'Do I need a car?',
    a: 'Own transport is preferred but not required. We have opportunities in urban areas with good public transport access.',
  },
  {
    q: 'How are territories assigned?',
    a: 'Territories are based on your location and market potential. You\'ll receive leads in your area and can self-generate referrals too.',
  },
  {
    q: 'What\'s the commission structure?',
    a: 'Commission tiers range from 5% (Trainee) to 15% (Elite). You earn on every merchant you onboard, plus overrides on team performance.',
  },
  {
    q: 'Is training provided?',
    a: 'Yes! All agents complete our Groway Sales Academy covering product knowledge, sales techniques, and CRM tools.',
  },
]

export default function SalesforcePage() {
  const [showApplyDialog, setShowApplyDialog] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <img src="/groway-logo.png" alt="Groway" className="h-8 w-auto" />
              <Badge variant="outline" className="border-[#00897B]/30 text-[#00897B]">Salesforce</Badge>
            </Link>
            
            <div className="hidden md:flex items-center gap-6">
              <a href="#roles" className="text-sm font-medium text-[#757575] hover:text-[#00897B]">Open Roles</a>
              <a href="#benefits" className="text-sm font-medium text-[#757575] hover:text-[#00897B]">Benefits</a>
              <a href="#success" className="text-sm font-medium text-[#757575] hover:text-[#00897B]">Success Stories</a>
              <a href="#faq" className="text-sm font-medium text-[#757575] hover:text-[#00897B]">FAQ</a>
            </div>
            
            <div className="flex items-center gap-3">
              <Link href="/salesforce/portal">
                <Button variant="outline">Agent Login</Button>
              </Link>
              <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setShowApplyDialog(true)}>
                Apply Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1A1A1A] via-[#2D2D2D] to-[#1A1A1A] py-16 lg:py-24">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-[#00897B] blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 rounded-full bg-[#00897B] blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00897B]/20 text-[#00897B] mb-6">
              <Briefcase className="h-4 w-4" />
              Join Our Sales Team
            </Badge>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Earn Great Money
              <br />
              <span className="text-[#00897B]">Growing Businesses</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Join Groway's field sales team and help small businesses across South Africa 
              modernize with our powerful POS system. Great commission, flexible schedule, real impact.
            </p>
            
            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 mb-8">
              {salesforceStats.map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-gray-400">{stat.label}</p>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-[#00897B] hover:bg-[#00695C] text-white font-semibold px-8 py-6 text-base" onClick={() => setShowApplyDialog(true)}>
                <UserPlus className="mr-2 h-5 w-5" />
                Apply to Join
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent text-white border-white/30 hover:bg-white/10 px-8 py-6 text-base">
                <Play className="mr-2 h-5 w-5" />
                Watch Day in the Life
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-8 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-[#1A1A1A]">892</p>
              <p className="text-sm text-[#757575]">Active Field Agents</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1A1A1A]">15,420</p>
              <p className="text-sm text-[#757575]">Merchants Onboarded</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1A1A1A]">R456K</p>
              <p className="text-sm text-[#757575]">Avg Annual Earnings</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1A1A1A]">9</p>
              <p className="text-sm text-[#757575]">Provinces Covered</p>
            </div>
          </div>
        </div>
      </section>

      {/* Open Roles */}
      <section id="roles" className="py-16 lg:py-20 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 px-3 py-1 border-[#00897B]/30 text-[#00897B]">Open Positions</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-3">Join Our Team</h2>
            <p className="text-[#757575] max-w-2xl mx-auto">
              We're looking for motivated individuals to help grow our merchant network across South Africa.
            </p>
          </div>
          
          <div className="space-y-4">
            {jobRoles.map((role, index) => (
              <Card key={index} className="hover:border-[#00897B] transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-14 h-14 rounded-lg bg-[#E0F2F1] flex items-center justify-center">
                        <role.icon className="h-7 w-7 text-[#00897B]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-[#1A1A1A]">{role.title}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-[#757575]">
                          <span>{role.type}</span>
                          <span>•</span>
                          <span>{role.location}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 lg:text-center">
                      <p className="text-sm text-[#757575]">{role.description}</p>
                    </div>
                    
                    <div className="lg:text-right">
                      <p className="text-sm font-semibold text-[#00897B]">{role.salary}</p>
                      <Button className="mt-2 bg-[#00897B] hover:bg-[#00695C]" onClick={() => {
                        setSelectedRole(role.title)
                        setShowApplyDialog(true)
                      }}>
                        Apply Now
                      </Button>
                    </div>
                  </div>
                  
                  {/* Requirements */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-[#757575] mb-2">Requirements:</p>
                    <div className="flex flex-wrap gap-2">
                      {role.requirements.map((req, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{req}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 px-3 py-1 border-[#00897B]/30 text-[#00897B]">Why Join Us</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-3">Benefits & Perks</h2>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="border-transparent hover:border-[#00897B]/20 transition-colors">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-[#E0F2F1] flex items-center justify-center mb-4">
                    <benefit.icon className="h-6 w-6 text-[#00897B]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">{benefit.title}</h3>
                  <p className="text-sm text-[#757575]">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Earnings Calculator */}
      <section className="py-16 lg:py-20 bg-[#FAFAFA]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 px-3 py-1 border-[#00897B]/30 text-[#00897B]">Earnings Potential</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-3">Calculate Your Earnings</h2>
          </div>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm text-[#757575] mb-4">Average monthly earnings by experience level</p>
                <div className="space-y-4">
                  {[
                    { level: 'Trainee', range: 'R8,000 - R15,000', commission: '5%' },
                    { level: 'Standard', range: 'R15,000 - R25,000', commission: '8%' },
                    { level: 'Senior', range: 'R25,000 - R40,000', commission: '12%' },
                    { level: 'Elite', range: 'R40,000 - R70,000+', commission: '15%' },
                  ].map((tier, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-[#1A1A1A]">{tier.level}</p>
                        <p className="text-xs text-[#757575]">{tier.commission} commission</p>
                      </div>
                      <p className="text-lg font-bold text-[#00897B]">{tier.range}</p>
                    </div>
                  ))}
                </div>
                <Button className="mt-6 bg-[#00897B] hover:bg-[#00695C]" onClick={() => setShowApplyDialog(true)}>
                  Start Your Career
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      <section id="success" className="py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 px-3 py-1 border-[#00897B]/30 text-[#00897B]">Real Stories</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-3">Success Stories</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-[#E0F2F1] flex items-center justify-center text-[#00897B] font-bold">
                      {t.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-[#1A1A1A]">{t.name}</p>
                      <p className="text-xs text-[#757575]">{t.role}</p>
                    </div>
                  </div>
                  <p className="text-[#757575] text-sm italic mb-4">"{t.quote}"</p>
                  <Badge className="bg-green-50 text-green-700">{t.earnings}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 lg:py-20 bg-[#FAFAFA]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 px-3 py-1 border-[#00897B]/30 text-[#00897B]">Questions?</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A]">FAQ</h2>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <h3 className="font-semibold text-[#1A1A1A] mb-2">{faq.q}</h3>
                  <p className="text-sm text-[#757575]">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-20 bg-gradient-to-br from-[#00897B] via-[#00695C] to-[#004D40]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Start Your Sales Career?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Join a fast-growing team and help businesses across South Africa succeed with Groway.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-[#00897B] hover:bg-gray-100 font-semibold px-8 py-6 text-base" onClick={() => setShowApplyDialog(true)}>
              <UserPlus className="mr-2 h-5 w-5" />
              Apply Now
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent text-white border-white/30 hover:bg-white/10 px-8 py-6 text-base">
              <MessageCircle className="mr-2 h-5 w-5" />
              Contact Recruiter
            </Button>
          </div>
          
          <p className="text-sm text-white/60 mt-6">
            Already an agent? <Link href="/salesforce/portal" className="underline hover:text-white">Login here</Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-[#1A1A1A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/groway-logo.png" alt="Groway" className="h-6 w-auto" />
              <span className="text-xs text-[#757575]">Field Salesforce</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-[#757575]">
              <a href="#" className="hover:text-white">Careers</a>
              <a href="#" className="hover:text-white">Privacy</a>
              <a href="#" className="hover:text-white">Support</a>
              <Link href="/" className="hover:text-white flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" />
                Back to Home
              </Link>
            </div>
            <p className="text-xs text-[#757575]">© 2026 Groway (Pty) Ltd</p>
          </div>
        </div>
      </footer>

      {/* Apply Dialog */}
      {showApplyDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-lg m-4">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Apply to Join</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowApplyDialog(false)}>
                  ✕
                </Button>
              </div>
              <p className="text-sm text-[#757575] mb-6">
                {selectedRole ? `Applying for: ${selectedRole}` : 'Fill in your details to apply'}
              </p>
              <div className="space-y-4">
                <Input placeholder="Full Name" />
                <Input type="email" placeholder="Email Address" />
                <Input placeholder="Phone Number" />
                <Input placeholder="City/Location" />
                <select className="w-full p-2 border rounded-lg">
                  <option>Select Role</option>
                  {jobRoles.map(r => <option key={r.title}>{r.title}</option>)}
                </select>
                <Input placeholder="Tell us about yourself (optional)" />
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" className="flex-1" onClick={() => setShowApplyDialog(false)}>Cancel</Button>
                <Button className="flex-1 bg-[#00897B] hover:bg-[#00695C]" onClick={() => setShowApplyDialog(false)}>
                  Submit Application
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
