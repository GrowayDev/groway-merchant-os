'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { LivestockDashboard } from '../LivestockDashboard'
import { WeightTrackingPanel } from './WeightTrackingPanel'
import { VaccinationScheduler } from './VaccinationScheduler'
import { FeedConsumptionPanel } from './FeedConsumptionPanel'
import { CampRotationPlanner } from './CampRotationPlanner'
import { AIWeightEstimator } from './AIWeightEstimator'
import { GrassAssessmentPanel } from './GrassAssessmentPanel'
import { AdvancedReporting } from './AdvancedReporting'
import { AlertAutomation } from './AlertAutomation'
import { IoTSensorIntegration } from './IoTSensorIntegration'
import { BlockchainTraceability } from './BlockchainTraceability'
import { MobileFeaturesPanel } from './MobileFeaturesPanel'
import { PredictiveAnalytics } from './PredictiveAnalytics'
import {
  LayoutDashboard,
  Scale,
  Syringe,
  Utensils,
  MapPin,
  Bell,
  Brain,
  Sprout,
  FileText,
  Cpu,
  Link,
  Smartphone,
  TrendingUp,
} from 'lucide-react'

interface LivestockManagementContainerProps {
  farmId: string
  subVerticalColor?: string
}

export function LivestockManagementContainer({ farmId }: LivestockManagementContainerProps) {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 px-6">
          <TabsList className="bg-transparent h-12 gap-1 flex-wrap">
            {/* Phase 1 - Foundation */}
            <TabsTrigger 
              value="dashboard" 
              className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-900"
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>

            {/* Phase 2 - Core Features */}
            <TabsTrigger 
              value="weight" 
              className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-900"
            >
              <Scale className="w-4 h-4 mr-2" />
              Weight
            </TabsTrigger>
            <TabsTrigger 
              value="vaccination" 
              className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-900 relative"
            >
              <Syringe className="w-4 h-4 mr-2" />
              Vaccination
              <Badge className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5">3</Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="feed" 
              className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-900"
            >
              <Utensils className="w-4 h-4 mr-2" />
              Feed
            </TabsTrigger>
            <TabsTrigger 
              value="camps" 
              className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-900 relative"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Camps
              <Badge className="ml-2 bg-amber-500 text-white text-xs px-1.5 py-0.5">2</Badge>
            </TabsTrigger>

            {/* Phase 3 - AI & Automation */}
            <TabsTrigger 
              value="ai" 
              className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-900"
            >
              <Brain className="w-4 h-4 mr-2" />
              AI Tools
            </TabsTrigger>
            <TabsTrigger 
              value="reports" 
              className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-900"
            >
              <FileText className="w-4 h-4 mr-2" />
              Reports
            </TabsTrigger>
            <TabsTrigger 
              value="alerts" 
              className="data-[state=active]:bg-red-100 data-[state=active]:text-red-900 relative"
            >
              <Bell className="w-4 h-4 mr-2" />
              Alerts
              <Badge className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5">5</Badge>
            </TabsTrigger>

            {/* Phase 4 - Advanced Features */}
            <TabsTrigger 
              value="iot" 
              className="data-[state=active]:bg-cyan-100 data-[state=active]:text-cyan-900"
            >
              <Cpu className="w-4 h-4 mr-2" />
              IoT Sensors
            </TabsTrigger>
            <TabsTrigger 
              value="blockchain" 
              className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-900"
            >
              <Link className="w-4 h-4 mr-2" />
              Traceability
            </TabsTrigger>
            <TabsTrigger 
              value="mobile" 
              className="data-[state=active]:bg-green-100 data-[state=active]:text-green-900"
            >
              <Smartphone className="w-4 h-4 mr-2" />
              Mobile
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-900"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto">
          {/* Phase 1 - Dashboard */}
          <TabsContent value="dashboard" className="m-0">
            <LivestockDashboard farmId={farmId} />
          </TabsContent>

          {/* Phase 2 - Core Features */}
          <TabsContent value="weight" className="m-0 p-6">
            <WeightTrackingPanel farmId={farmId} />
          </TabsContent>

          <TabsContent value="vaccination" className="m-0 p-6">
            <VaccinationScheduler farmId={farmId} />
          </TabsContent>

          <TabsContent value="feed" className="m-0 p-6">
            <FeedConsumptionPanel farmId={farmId} />
          </TabsContent>

          <TabsContent value="camps" className="m-0 p-6">
            <CampRotationPlanner farmId={farmId} />
          </TabsContent>

          {/* Phase 3 - AI & Automation */}
          <TabsContent value="ai" className="m-0 p-6">
            <Tabs defaultValue="weight-ai" className="space-y-6">
              <TabsList>
                <TabsTrigger value="weight-ai">
                  <Scale className="w-4 h-4 mr-2" />
                  AI Weight Estimation
                </TabsTrigger>
                <TabsTrigger value="grass-ai">
                  <Sprout className="w-4 h-4 mr-2" />
                  Grass Assessment
                </TabsTrigger>
              </TabsList>
              <TabsContent value="weight-ai">
                <AIWeightEstimator farmId={farmId} />
              </TabsContent>
              <TabsContent value="grass-ai">
                <GrassAssessmentPanel farmId={farmId} />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="reports" className="m-0 p-6">
            <AdvancedReporting farmId={farmId} />
          </TabsContent>

          <TabsContent value="alerts" className="m-0 p-6">
            <AlertAutomation farmId={farmId} />
          </TabsContent>

          {/* Phase 4 - Advanced Features */}
          <TabsContent value="iot" className="m-0 p-6">
            <IoTSensorIntegration farmId={farmId} />
          </TabsContent>

          <TabsContent value="blockchain" className="m-0 p-6">
            <BlockchainTraceability farmId={farmId} />
          </TabsContent>

          <TabsContent value="mobile" className="m-0 p-6">
            <MobileFeaturesPanel farmId={farmId} />
          </TabsContent>

          <TabsContent value="analytics" className="m-0 p-6">
            <PredictiveAnalytics farmId={farmId} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
