'use client'

import dynamic from 'next/dynamic'
import React from 'react'

// ViewLoader component
const ViewLoader = () => (
  <div className="flex items-center justify-center h-full min-h-[400px]">
    <div className="text-center">
      <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-4"></div>
      <p className="text-sm text-gray-500">Loading...</p>
    </div>
  </div>
)

// Helper to create dynamic imports with ssr: false
const dyn = (importFn: () => Promise<{ default: React.ComponentType<Record<string, unknown>> }>) =>
  dynamic(importFn, { ssr: false, loading: () => <ViewLoader /> })

// Dynamically import all view components
const views: Record<string, React.ComponentType<Record<string, unknown>>> = {
  'dashboard': dyn(() => import('./MerchantDashboard').then(m => ({ default: m.MerchantDashboard }))),
  'salesreport': dyn(() => import('./SalesReportView').then(m => ({ default: m.SalesReportView }))),
  'transactions': dyn(() => import('./TransactionsView').then(m => ({ default: m.TransactionsView }))),
  'inventory': dyn(() => import('./InventoryView').then(m => ({ default: m.InventoryView }))),
  'pricing': dyn(() => import('./PricingManagementView').then(m => ({ default: m.PricingManagementView }))),
  'crm': dyn(() => import('./CRMView').then(m => ({ default: m.CRMView }))),
  'marketing': dyn(() => import('./MarketingView').then(m => ({ default: m.MarketingView }))),
  'staff': dyn(() => import('./StaffHRMView').then(m => ({ default: m.StaffHRMView }))),
  'accounting': dyn(() => import('./AccountingView').then(m => ({ default: m.AccountingView }))),
  'booking': dyn(() => import('./EnhancedBookingView').then(m => ({ default: m.EnhancedBookingView }))),
  'widget': dyn(() => import('./OnlineBookingWidget').then(m => ({ default: m.OnlineBookingWidget }))),
  'giftcards': dyn(() => import('./VouchersAndGiftCardsView').then(m => ({ default: m.VouchersAndGiftCardsView }))),
  'grosupply': dyn(() => import('./GroSupplyEnhancedView').then(m => ({ default: m.GroSupplyEnhancedView }))),
  'gromarket': dyn(() => import('./GroSupplyMarketplaceView').then(m => ({ default: m.GroSupplyMarketplaceView }))),
  'payments': dyn(() => import('./PaymentGatewayView').then(m => ({ default: m.PaymentGatewayView }))),
  'grocredit': dyn(() => import('./GroCreditView').then(m => ({ default: m.GroCreditView }))),
  'multilocation': dyn(() => import('./MultiLocationView').then(m => ({ default: m.MultiLocationView }))),
  'enterprise': dyn(() => import('./EnterprisePortalView').then(m => ({ default: m.EnterprisePortalView }))),
  'hardware': dyn(() => import('./HardwareIntegration').then(m => ({ default: m.HardwareIntegration }))),
  'training': dyn(() => import('./TrainingView').then(m => ({ default: m.TrainingView }))),
  'lms': dyn(() => import('./LearningManagementView').then(m => ({ default: m.LearningManagementView }))),
  'mentorship': dyn(() => import('./MentorshipView').then(m => ({ default: m.MentorshipView }))),
  'reporting': dyn(() => import('./StakeholderReportingView').then(m => ({ default: m.StakeholderReportingView }))),
  'settings': dyn(() => import('./SettingsView').then(m => ({ default: m.SettingsView }))),
  'qrmenu': dyn(() => import('./DigitalQRMenuView').then(m => ({ default: m.DigitalQRMenuView }))),
  'floorplan': dyn(() => import('./TableFloorPlanView').then(m => ({ default: m.TableFloorPlanView }))),
  'kitchen': dyn(() => import('./KitchenDisplayView').then(m => ({ default: m.KitchenDisplayView }))),
  'recipe': dyn(() => import('./RecipeEngineView').then(m => ({ default: m.RecipeEngineView }))),
  'fnbmanagement': dyn(() => import('./FnbManagementView').then(m => ({ default: m.FnbManagementView }))),
  'courses': dyn(() => import('./CourseManagementView').then(m => ({ default: m.CourseManagementView }))),
  'billsplit': dyn(() => import('./BillSplittingView').then(m => ({ default: m.BillSplittingView }))),
  'qrselfservice': dyn(() => import('./QRSelfServiceView').then(m => ({ default: m.QRSelfServiceView }))),
  'liquor': dyn(() => import('./LiquorComplianceView').then(m => ({ default: m.LiquorComplianceView }))),
  'healthbeauty': dyn(() => import('./HealthBeautyView').then(m => ({ default: m.HealthBeautyView }))),
  'hotel': dyn(() => import('./HotelManagementView').then(m => ({ default: m.HotelManagementView }))),
  'customerfacing': dyn(() => import('./CustomerFacingView').then(m => ({ default: m.CustomerFacingView }))),
  'waiterpad': dyn(() => import('./WaiterPadView').then(m => ({ default: m.WaiterPadView }))),
  'sars': dyn(() => import('./SarsEfilingView').then(m => ({ default: m.SarsEfilingView }))),
  'bankfeed': dyn(() => import('./BankFeedView').then(m => ({ default: m.BankFeedView }))),
  'courier': dyn(() => import('./CourierIntegrationView').then(m => ({ default: m.CourierIntegrationView }))),
  'whatsapp': dyn(() => import('./WhatsAppBusinessView').then(m => ({ default: m.WhatsAppBusinessView }))),
  'hardwarebuilding': dyn(() => import('./HardwareBuildingView').then(m => ({ default: m.HardwareBuildingView }))),
  'notifications': dyn(() => import('../../components/NotificationCenter').then(m => ({ default: m.NotificationCenter }))),
  'funeral': dyn(() => import('./FuneralServicesView').then(m => ({ default: m.FuneralServicesView }))),
  'autorepair': dyn(() => import('./AutoRepairView').then(m => ({ default: m.AutoRepairView }))),
  'dryclean': dyn(() => import('./DryCleaningView').then(m => ({ default: m.DryCleaningView }))),
  'professional': dyn(() => import('./ProfessionalComplianceView').then(m => ({ default: m.ProfessionalComplianceView }))),
  'realestate': dyn(() => import('./RealEstateView').then(m => ({ default: m.RealEstateView }))),
  'architecture': dyn(() => import('./ArchitectureView').then(m => ({ default: m.ArchitectureView }))),
  'engineering': dyn(() => import('./EngineeringView').then(m => ({ default: m.EngineeringView }))),
  'quantitysurveying': dyn(() => import('./QuantitySurveyingView').then(m => ({ default: m.QuantitySurveyingView }))),
  'medicalpractice': dyn(() => import('./MedicalPracticeView').then(m => ({ default: m.MedicalPracticeView }))),
  'dentalpractice': dyn(() => import('./DentalPracticeView').then(m => ({ default: m.DentalPracticeView }))),
  'childcare': dyn(() => import('./ChildcareView').then(m => ({ default: m.ChildcareView }))),
  'sportleisure': dyn(() => import('./SportLeisureView').then(m => ({ default: m.SportLeisureView }))),
  'electronicstech': dyn(() => import('./ElectronicsTechView').then(m => ({ default: m.ElectronicsTechView }))),
  'agriculture': dyn(() => import('./AgricultureView').then(m => ({ default: m.AgricultureView }))),
}

// Export the registry accessor function
export function getViewRegistry() {
  return views
}
