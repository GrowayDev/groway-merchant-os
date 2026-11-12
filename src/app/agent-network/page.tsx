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
  Gift,
  TrendingUp,
  CheckCircle2,
  Star,
  Award,
  Crown,
  Target,
  Play,
  Shield,
  Sparkles,
  Building2,
  UserPlus,
  Wallet,
  Trophy,
  Medal,
  Copy,
  Share2,
} from 'lucide-react'

// Tier benefits data
const tierBenefits = [
  {
    tier: 'Starter',
    commission: '5%',
    minReferrals: 0,
    color: 'bg-gray-100 text-gray-700',
    icon: Star,
    benefits: ['Basic commission rate', 'Referral code', 'Dashboard access', 'Email support'],
  },
  {
    tier: 'Bronze',
    commission: '7%',
    minReferrals: 5,
    color: 'bg-amber-100 text-amber-700',
    icon: Medal,
    benefits: ['Higher commission', 'Priority support', 'Marketing materials', 'Training access'],
  },
  {
    tier: 'Silver',
    commission: '10%',
    minReferrals: 15,
    color: 'bg-slate-100 text-slate-700',
    icon: Award,
    benefits: ['Premium commission', 'Dedicated account manager', 'Custom referral links', 'Advanced analytics'],
  },
  {
    tier: 'Gold',
    commission: '12%',
    minReferrals: 30,
    color: 'bg-yellow-100 text-yellow-700',
    icon: Crown,
    benefits: ['Elite commission', 'Network override (2nd level)', 'Exclusive events', 'Priority payouts'],
  },
  {
    tier: 'Platinum',
    commission: '15%',
    minReferrals: 50,
    color: 'bg-purple-100 text-purple-700',
    icon: Trophy,
    benefits: ['Maximum commission', 'Network override (3 levels)', 'Enterprise preview', 'VIP support'],
  },
]

// Success stories
const successStories = [
  {
    name: 'Sipho Mokoena',
    business: "Sipho's Spaza Shop",
    tier: 'Gold',
    earnings: 'R45,000',
    referrals: 34,
    quote: "The referral program changed my business. I earn extra income just by recommending Groway to fellow merchants.",
    avatar: 'SM',
  },
  {
    name: 'Thandi Nkosi',
    business: 'Thandi Beauty Salon',
    tier: 'Silver',
    earnings: 'R28,500',
    referrals: 18,
    quote: "I've built a whole network of beauty salons using Groway. The commission helps me expand my own business.",
    avatar: 'TN',
  },
  {
    name: 'Jacob Zulu',
    business: 'JZ Electronics',
    tier: 'Platinum',
    earnings: 'R125,000',
    referrals: 67,
    quote: "From a small electronics shop to building a network of 67 merchants. Groway's agent program is incredible.",
    avatar: 'JZ',
  },
]

// How it works steps
const howItWorks = [
  {
    step: 1,
    title: 'Get Your Referral Code',
    description: 'Sign up as an agent and receive your unique referral code instantly.',
    icon: Gift,
  },
  {
    step: 2,
    title: 'Refer Merchants',
    description: 'Share your code with merchants who could benefit from Groway POS.',
    icon: UserPlus,
  },
  {
    step: 3,
    title: 'Earn Commissions',
    description: 'Get paid when your referrals activate and start transacting.',
    icon: DollarSign,
  },
]

// FAQ data
const faqs = [
  {
    question: 'Who can become an agent?',
    answer: 'Any existing Groway merchant with an active account in good standing can become an agent. You just need to have used Groway for at least 30 days.',
  },
  {
    question: 'How much can I earn?',
    answer: 'Commissions range from 5% to 15% depending on your tier. Top agents earn over R100,000 per month in commissions.',
  },
  {
    question: 'When do I get paid?',
    answer: 'Commissions are calculated monthly and paid out by the 5th of each month. You need a minimum of R500 to request a payout.',
  },
  {
    question: 'What is network override?',
    answer: 'Gold and Platinum agents earn a percentage from merchants referred by their own referrals (2nd and 3rd level). This creates passive income.',
  },
  {
    question: 'How do I track my referrals?',
    answer: 'You get access to a real-time dashboard showing all your referrals, their status, and your earnings.',
  },
]

export default function AgentNetworkPage() {
  const [calcReferrals, setCalcReferrals] = useState(10)
  const [calcAvgRevenue, setCalcAvgRevenue] = useState(5000)

  const estimatedEarnings = calcReferrals * calcAvgRevenue * 0.10 // Silver tier default

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <img src="/groway-logo.png" alt="Groway" className="h-8 w-auto" />
              <Badge variant="outline" className="border-[#00897B]/30 text-[#00897B]">Agent Network</Badge>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#how-it-works" className="text-sm font-medium text-[#757575] hover:text-[#00897B]">How It Works</a>
              <a href="#tiers" className="text-sm font-medium text-[#757575] hover:text-[#00897B]">Tiers</a>
              <a href="#calculator" className="text-sm font-medium text-[#757575] hover:text-[#00897B]">Calculator</a>
              <a href="#success" className="text-sm font-medium text-[#757575] hover:text-[#00897B]">Success Stories</a>
              <a href="#faq" className="text-sm font-medium text-[#757575] hover:text-[#00897B]">FAQ</a>
            </div>
            
            {/* CTA */}
            <div className="flex items-center gap-3">
              <Link href="/agent-network/portal">
                <Button variant="outline" className="hidden sm:flex">Agent Login</Button>
              </Link>
              <Link href="/agent-network/portal">
                <Button className="bg-[#00897B] hover:bg-[#00695C]">
                  Start Earning
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#00897B] via-[#00695C] to-[#004D40] py-16 lg:py-24">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-6">
              <Sparkles className="h-4 w-4 text-yellow-300" />
              <span className="text-sm font-medium text-white">Turn Your Network Into Revenue</span>
            </div>
            
            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Earn Commission By
              <br />
              <span className="text-yellow-300">Referring Merchants</span>
            </h1>
            
            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Join Groway's Agent Network and earn up to 15% commission on every merchant you refer. 
              Build your network and create passive income streams.
            </p>
            
            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 mb-8">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">R1.2M+</p>
                <p className="text-sm text-white/70">Paid in Commissions</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">1,234</p>
                <p className="text-sm text-white/70">Active Agents</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">8,945</p>
                <p className="text-sm text-white/70">Successful Referrals</p>
              </div>
            </div>
            
            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/agent-network/portal">
                <Button size="lg" className="bg-white text-[#00897B] hover:bg-gray-100 font-semibold px-8 py-6 text-base shadow-xl">
                  <Gift className="mr-2 h-5 w-5" />
                  Get Your Referral Code
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="bg-transparent text-white border-white/30 hover:bg-white/10 font-semibold px-8 py-6 text-base">
                <Play className="mr-2 h-5 w-5" />
                Watch How It Works
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 px-3 py-1 border-[#00897B]/30 text-[#00897B]">Simple Process</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-3">How It Works</h2>
            <p className="text-[#757575] max-w-2xl mx-auto">
              Start earning commissions in three simple steps. No complex setup required.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((step, index) => (
              <div key={step.step} className="relative">
                {/* Connector line */}
                {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-1/2 w-full h-0.5 bg-[#E0F2F1]" />
                )}
                
                <Card className="relative border-2 border-transparent hover:border-[#00897B]/20 transition-colors">
                  <CardContent className="p-8 text-center">
                    {/* Step number */}
                    <div className="w-16 h-16 rounded-full bg-[#E0F2F1] flex items-center justify-center mx-auto mb-4">
                      <step.icon className="h-8 w-8 text-[#00897B]" />
                    </div>
                    
                    <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#00897B] text-white flex items-center justify-center text-sm font-bold">
                      {step.step}
                    </div>
                    
                    <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">{step.title}</h3>
                    <p className="text-[#757575]">{step.description}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tier Benefits */}
      <section id="tiers" className="py-16 lg:py-20 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 px-3 py-1 border-[#00897B]/30 text-[#00897B]">Progressive Rewards</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-3">Tier Benefits</h2>
            <p className="text-[#757575] max-w-2xl mx-auto">
              The more merchants you refer, the higher your tier and commission rate. Unlock exclusive benefits as you grow.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {tierBenefits.map((tier, index) => (
              <Card 
                key={tier.tier} 
                className={`relative overflow-hidden ${index === tierBenefits.length - 1 ? 'ring-2 ring-purple-400' : ''}`}
              >
                {index === tierBenefits.length - 1 && (
                  <div className="absolute top-0 right-0 bg-purple-500 text-white text-xs font-medium px-2 py-0.5 rounded-bl">
                    BEST
                  </div>
                )}
                <CardContent className="p-5">
                  {/* Tier Badge */}
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${tier.color} text-sm font-semibold mb-4`}>
                    <tier.icon className="h-4 w-4" />
                    {tier.tier}
                  </div>
                  
                  {/* Commission */}
                  <div className="mb-4">
                    <p className="text-3xl font-bold text-[#1A1A1A]">{tier.commission}</p>
                    <p className="text-xs text-[#757575]">Commission Rate</p>
                  </div>
                  
                  {/* Min Referrals */}
                  <p className="text-sm text-[#757575] mb-4">
                    {tier.minReferrals === 0 ? 'Start here' : `${tier.minReferrals}+ referrals`}
                  </p>
                  
                  {/* Benefits */}
                  <ul className="space-y-2">
                    {tier.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-[#00897B] mt-0.5 flex-shrink-0" />
                        <span className="text-[#757575]">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Commission Calculator */}
      <section id="calculator" className="py-16 lg:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 px-3 py-1 border-[#00897B]/30 text-[#00897B]">Earnings Potential</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-3">Commission Calculator</h2>
            <p className="text-[#757575]">
              See how much you could earn based on your referral activity.
            </p>
          </div>
          
          <Card className="border-2 border-[#00897B]/20">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Inputs */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                      Number of Referrals per Month
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={calcReferrals}
                      onChange={(e) => setCalcReferrals(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-[#757575] mt-1">
                      <span>1</span>
                      <span className="text-lg font-bold text-[#00897B]">{calcReferrals}</span>
                      <span>50</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                      Avg. Monthly Revenue per Referral (R)
                    </label>
                    <input
                      type="range"
                      min="1000"
                      max="20000"
                      step="500"
                      value={calcAvgRevenue}
                      onChange={(e) => setCalcAvgRevenue(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-[#757575] mt-1">
                      <span>R1,000</span>
                      <span className="text-lg font-bold text-[#00897B]">R{calcAvgRevenue.toLocaleString()}</span>
                      <span>R20,000</span>
                    </div>
                  </div>
                </div>
                
                {/* Results */}
                <div className="bg-gradient-to-br from-[#E0F2F1] to-[#B2DFDB] rounded-xl p-6 text-center">
                  <p className="text-sm text-[#00695C] font-medium mb-2">Estimated Monthly Earnings</p>
                  <p className="text-4xl sm:text-5xl font-bold text-[#00897B] mb-2">
                    R{estimatedEarnings.toLocaleString()}
                  </p>
                  <p className="text-sm text-[#757575]">
                    Based on Silver tier (10%)
                  </p>
                  
                  <div className="mt-4 pt-4 border-t border-[#00897B]/20">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[#757575]">Annual Potential</span>
                      <span className="font-semibold text-[#1A1A1A]">R{(estimatedEarnings * 12).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#757575]">With Network Override</span>
                      <span className="font-semibold text-[#00897B]">+R{(estimatedEarnings * 12 * 0.3).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Success Stories */}
      <section id="success" className="py-16 lg:py-20 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 px-3 py-1 border-[#00897B]/30 text-[#00897B]">Real Results</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-3">Success Stories</h2>
            <p className="text-[#757575] max-w-2xl mx-auto">
              Meet agents who are building wealth through the Groway Agent Network.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {successStories.map((story, index) => (
              <Card key={index} className="bg-white">
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-[#E0F2F1] flex items-center justify-center text-[#00897B] font-bold">
                      {story.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-[#1A1A1A]">{story.name}</p>
                      <p className="text-xs text-[#757575]">{story.business}</p>
                    </div>
                    <Badge className={`ml-auto ${
                      story.tier === 'Platinum' ? 'bg-purple-100 text-purple-700' :
                      story.tier === 'Gold' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {story.tier}
                    </Badge>
                  </div>
                  
                  {/* Quote */}
                  <p className="text-[#757575] text-sm italic mb-4">"{story.quote}"</p>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-2xl font-bold text-[#00897B]">{story.earnings}</p>
                      <p className="text-xs text-[#757575]">Total Earned</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[#1A1A1A]">{story.referrals}</p>
                      <p className="text-xs text-[#757575]">Referrals</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 lg:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 px-3 py-1 border-[#00897B]/30 text-[#00897B]">Questions?</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-3">Frequently Asked Questions</h2>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardContent className="p-5">
                  <h3 className="font-semibold text-[#1A1A1A] mb-2">{faq.question}</h3>
                  <p className="text-[#757575] text-sm">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-20 bg-gradient-to-br from-[#00897B] via-[#00695C] to-[#004D40]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Start Earning?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Join thousands of merchants who are already earning passive income through the Groway Agent Network.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/agent-network/portal">
              <Button size="lg" className="bg-white text-[#00897B] hover:bg-gray-100 font-semibold px-8 py-6 text-base shadow-xl">
                <Gift className="mr-2 h-5 w-5" />
                Get Your Referral Code
              </Button>
            </Link>
          </div>
          
          <p className="text-sm text-white/60 mt-6">
            Already an agent? <Link href="/agent-network/portal" className="underline hover:text-white">Login here</Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-[#1A1A1A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/groway-logo.png" alt="Groway" className="h-6 w-auto" />
              <span className="text-xs text-[#757575]">Agent Network</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-[#757575]">
              <a href="#" className="hover:text-white">Terms</a>
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
    </div>
  )
}
