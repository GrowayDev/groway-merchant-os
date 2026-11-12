'use client'

import { useState } from 'react'
import AdminLayout from './components/AdminLayout'
import PlatformDashboard from './components/PlatformDashboard'
import MerchantManagement from './components/MerchantManagement'
import ComplianceCenter from './components/ComplianceCenter'
import FraudManagementCenter from './components/FraudManagementCenter'
import SupportTools from './components/SupportTools'
import AnalyticsView from './components/AnalyticsView'
import SettingsView from './components/SettingsView'
import AuditLogView from './components/AuditLogView'
import ApplicationsOverview from './components/ApplicationsOverview'
import UserManagementView from './components/UserManagementView'
import TenantManagementView from './components/TenantManagementView'

export type AdminViewType = 
  | 'apps'
  | 'dashboard' 
  | 'tenants'
  | 'merchants'
  | 'users'
  | 'compliance' 
  | 'fraud' 
  | 'support' 
  | 'analytics' 
  | 'audit' 
  | 'settings'

export default function AdminConsoleApp() {
  const [activeView, setActiveView] = useState<AdminViewType>('apps')

  const renderView = () => {
    switch (activeView) {
      case 'apps':
        return <ApplicationsOverview />
      case 'dashboard':
        return <PlatformDashboard />
      case 'tenants':
        return <TenantManagementView />
      case 'merchants':
        return <MerchantManagement />
      case 'users':
        return <UserManagementView />
      case 'compliance':
        return <ComplianceCenter />
      case 'fraud':
        return <FraudManagementCenter />
      case 'support':
        return <SupportTools />
      case 'analytics':
        return <AnalyticsView />
      case 'audit':
        return <AuditLogView />
      case 'settings':
        return <SettingsView />
      default:
        return <ApplicationsOverview />
    }
  }

  return (
    <AdminLayout activeView={activeView} setActiveView={setActiveView}>
      {renderView()}
    </AdminLayout>
  )
}
