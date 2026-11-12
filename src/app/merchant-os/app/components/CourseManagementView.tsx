'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Utensils,
  Clock,
  ChefHat,
  CheckCircle2,
  Play,
  Pause,
  SkipForward,
  AlertTriangle,
  Flame,
  Snowflake,
  Pizza,
  Wine,
  Cake,
  Coffee,
  Salad,
  Soup,
  Timer,
  Users,
  Table2,
  ArrowRight,
  RefreshCw,
  Bell,
  BellRing,
  Loader2,
  MessageSquare,
  Send,
  AlertCircle,
  Zap,
  Ban,
  Check,
  X,
  Radio,
  Volume2,
  Hourglass,
  ChevronRight,
} from 'lucide-react'

// Types
type CourseType = 'starter' | 'main' | 'dessert' | 'drinks' | 'sides'
type CourseStatus = 'pending' | 'held' | 'ordered' | 'preparing' | 'ready' | 'served'
type Priority = 'normal' | 'high' | 'rush'

interface CourseItem {
  id: string
  name: string
  quantity: number
  price: number
  notes?: string
  station: 'grill' | 'cold' | 'fryer' | 'pizza' | 'bar' | 'dessert'
  status: CourseStatus
  preparationTime: number
  dietary?: string[]
  allergens?: string[]
  firedAt?: Date
  readyAt?: Date
}

interface KitchenMessage {
  id: string
  message: string
  sentAt: Date
  from: 'waiter' | 'kitchen'
  acknowledged: boolean
  acknowledgedAt?: Date
}

interface Course {
  id: string
  type: CourseType
  name: string
  items: CourseItem[]
  status: CourseStatus
  orderedAt?: Date
  readyAt?: Date
  servedAt?: Date
  estimatedTime: number
  priority: Priority
  heldUntil?: Date
  holdReason?: string
}

interface TableOrder {
  id: string
  tableNumber: string
  guests: number
  serverName: string
  courses: Course[]
  status: 'active' | 'completed'
  startedAt: Date
  messages: KitchenMessage[]
  rushReason?: string
}

// Course configurations with clear progression
const courseConfig: Record<CourseType, { name: string; icon: any; color: string; order: number; description: string }> = {
  drinks: { name: 'Drinks', icon: Wine, color: 'bg-purple-100 text-purple-700 border-purple-300', order: 0, description: 'Beverages & cocktails' },
  starter: { name: 'Starters', icon: Salad, color: 'bg-amber-100 text-amber-700 border-amber-300', order: 1, description: 'Appetizers & light bites' },
  main: { name: 'Mains', icon: Utensils, color: 'bg-red-100 text-red-700 border-red-300', order: 2, description: 'Main courses' },
  sides: { name: 'Sides', icon: Soup, color: 'bg-orange-100 text-orange-700 border-orange-300', order: 2, description: 'Side dishes' },
  dessert: { name: 'Desserts', icon: Cake, color: 'bg-pink-100 text-pink-700 border-pink-300', order: 3, description: 'Sweet treats & coffee' },
}

const statusConfig: Record<CourseStatus, { label: string; color: string; bgColor: string; icon: any; pulse?: boolean }> = {
  pending: { label: 'Pending', color: 'text-gray-600', bgColor: 'bg-gray-100 border-gray-300', icon: Clock },
  held: { label: 'On Hold', color: 'text-amber-600', bgColor: 'bg-amber-100 border-amber-400', icon: Pause },
  ordered: { label: 'Ordered', color: 'text-sky-600', bgColor: 'bg-sky-100 border-sky-300', icon: Bell },
  preparing: { label: 'Preparing', color: 'text-orange-600', bgColor: 'bg-orange-100 border-orange-300', icon: Flame, pulse: true },
  ready: { label: 'Ready!', color: 'text-green-600', bgColor: 'bg-green-100 border-green-400', icon: BellRing, pulse: true },
  served: { label: 'Served', color: 'text-gray-500', bgColor: 'bg-gray-200 border-gray-300', icon: CheckCircle2 },
}

const stationConfig: Record<string, { name: string; icon: any; color: string }> = {
  grill: { name: 'Grill', icon: Flame, color: 'text-red-500' },
  cold: { name: 'Cold', icon: Snowflake, color: 'text-blue-500' },
  fryer: { name: 'Fryer', icon: Flame, color: 'text-amber-500' },
  pizza: { name: 'Pizza', icon: Pizza, color: 'text-green-500' },
  bar: { name: 'Bar', icon: Wine, color: 'text-purple-500' },
  dessert: { name: 'Dessert', icon: Cake, color: 'text-pink-500' },
}

const priorityConfig: Record<Priority, { label: string; color: string; bgColor: string; icon: any }> = {
  normal: { label: 'Normal', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: Clock },
  high: { label: 'High', color: 'text-amber-600', bgColor: 'bg-amber-100', icon: AlertTriangle },
  rush: { label: 'RUSH', color: 'text-red-600', bgColor: 'bg-red-100', icon: Zap },
}

// Common allergens for display
const allergenWarnings: Record<string, { icon: string; color: string }> = {
  nuts: { icon: '🥜', color: 'bg-amber-500 text-white' },
  dairy: { icon: '🥛', color: 'bg-blue-500 text-white' },
  gluten: { icon: '🌾', color: 'bg-yellow-500 text-white' },
  shellfish: { icon: '🦐', color: 'bg-orange-500 text-white' },
  eggs: { icon: '🥚', color: 'bg-yellow-400 text-white' },
  soy: { icon: '🫘', color: 'bg-green-500 text-white' },
  fish: { icon: '🐟', color: 'bg-cyan-500 text-white' },
  sesame: { icon: '🌱', color: 'bg-lime-500 text-white' },
}

// Sample data
const sampleOrders: TableOrder[] = [
  {
    id: 'order-1',
    tableNumber: '12',
    guests: 4,
    serverName: 'Thabo M.',
    status: 'active',
    startedAt: new Date(Date.now() - 45 * 60000),
    messages: [
      { id: 'm1', message: 'Table wants medium-rare on all steaks', sentAt: new Date(Date.now() - 35 * 60000), from: 'waiter', acknowledged: true, acknowledgedAt: new Date(Date.now() - 34 * 60000) },
    ],
    courses: [
      {
        id: 'course-1',
        type: 'starter',
        name: 'Starters',
        status: 'served',
        orderedAt: new Date(Date.now() - 40 * 60000),
        readyAt: new Date(Date.now() - 30 * 60000),
        servedAt: new Date(Date.now() - 25 * 60000),
        estimatedTime: 15,
        priority: 'normal',
        items: [
          { id: 'i1', name: 'Garlic Bread (4 slices)', quantity: 2, price: 35, station: 'cold', status: 'served', preparationTime: 5, dietary: [] },
          { id: 'i2', name: 'Calamari Rings', quantity: 1, price: 75, station: 'fryer', status: 'served', preparationTime: 10, dietary: [] },
        ]
      },
      {
        id: 'course-2',
        type: 'main',
        name: 'Mains',
        status: 'preparing',
        orderedAt: new Date(Date.now() - 20 * 60000),
        estimatedTime: 25,
        priority: 'normal',
        items: [
          { id: 'i3', name: 'Sirloin Steak (300g) - Medium', quantity: 2, price: 185, station: 'grill', status: 'preparing', preparationTime: 20, notes: 'Medium rare', dietary: [], firedAt: new Date(Date.now() - 20 * 60000) },
          { id: 'i4', name: 'Grilled Salmon', quantity: 1, price: 175, station: 'grill', status: 'preparing', preparationTime: 15, dietary: [], allergens: ['fish'], firedAt: new Date(Date.now() - 20 * 60000) },
          { id: 'i5', name: 'Vegetable Curry', quantity: 1, price: 95, station: 'cold', status: 'preparing', preparationTime: 12, dietary: ['vegan'], firedAt: new Date(Date.now() - 20 * 60000) },
        ]
      },
      {
        id: 'course-3',
        type: 'dessert',
        name: 'Desserts',
        status: 'pending',
        estimatedTime: 10,
        priority: 'normal',
        items: [
          { id: 'i6', name: 'Malva Pudding', quantity: 2, price: 55, station: 'dessert', status: 'pending', preparationTime: 8, dietary: [], allergens: ['dairy', 'gluten'] },
          { id: 'i7', name: 'Ice Cream (2 scoops)', quantity: 2, price: 35, station: 'dessert', status: 'pending', preparationTime: 2, dietary: [], allergens: ['dairy'] },
        ]
      }
    ]
  },
  {
    id: 'order-2',
    tableNumber: '7',
    guests: 2,
    serverName: 'Nomsa K.',
    status: 'active',
    startedAt: new Date(Date.now() - 20 * 60000),
    messages: [],
    rushReason: 'VIP guests - need quick turnaround',
    courses: [
      {
        id: 'course-4',
        type: 'main',
        name: 'Mains',
        status: 'ordered',
        orderedAt: new Date(Date.now() - 15 * 60000),
        estimatedTime: 20,
        priority: 'rush',
        items: [
          { id: 'i8', name: 'Lamb Chops (4pc)', quantity: 1, price: 175, station: 'grill', status: 'ordered', preparationTime: 18, dietary: [], firedAt: new Date(Date.now() - 15 * 60000) },
          { id: 'i9', name: 'Peri-Peri Chicken (Half)', quantity: 1, price: 145, station: 'grill', status: 'ordered', preparationTime: 15, notes: 'Extra hot', dietary: [], firedAt: new Date(Date.now() - 15 * 60000) },
        ]
      }
    ]
  },
  {
    id: 'order-3',
    tableNumber: '3',
    guests: 6,
    serverName: 'Johan P.',
    status: 'active',
    startedAt: new Date(Date.now() - 60 * 60000),
    messages: [
      { id: 'm2', message: 'Allergies: 2 guests have nut allergies - please be careful!', sentAt: new Date(Date.now() - 55 * 60000), from: 'waiter', acknowledged: true },
    ],
    courses: [
      {
        id: 'course-5',
        type: 'starter',
        name: 'Starters',
        status: 'served',
        orderedAt: new Date(Date.now() - 55 * 60000),
        servedAt: new Date(Date.now() - 40 * 60000),
        estimatedTime: 12,
        priority: 'normal',
        items: [
          { id: 'i10', name: 'Spring Rolls (6pc)', quantity: 2, price: 55, station: 'fryer', status: 'served', preparationTime: 8, dietary: [] },
        ]
      },
      {
        id: 'course-6',
        type: 'main',
        name: 'Mains',
        status: 'ready',
        orderedAt: new Date(Date.now() - 30 * 60000),
        readyAt: new Date(Date.now() - 5 * 60000),
        estimatedTime: 25,
        priority: 'rush',
        items: [
          { id: 'i11', name: 'Bobotie with Rice', quantity: 2, price: 95, station: 'cold', status: 'ready', preparationTime: 12, dietary: [], allergens: ['eggs'], readyAt: new Date(Date.now() - 5 * 60000) },
          { id: 'i12', name: 'Oxtail Stew', quantity: 2, price: 155, station: 'grill', status: 'ready', preparationTime: 20, dietary: [], readyAt: new Date(Date.now() - 5 * 60000) },
          { id: 'i13', name: 'Grilled Snoek', quantity: 2, price: 125, station: 'grill', status: 'ready', preparationTime: 15, dietary: [], allergens: ['fish'], readyAt: new Date(Date.now() - 5 * 60000) },
        ]
      }
    ]
  }
]

export function CourseManagementView() {
  const [orders, setOrders] = useState<TableOrder[]>([])
  const [selectedOrder, setSelectedOrder] = useState<TableOrder | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [fireCourseDialogOpen, setFireCourseDialogOpen] = useState(false)
  const [fireItemDialogOpen, setFireItemDialogOpen] = useState(false)
  const [holdCourseDialogOpen, setHoldCourseDialogOpen] = useState(false)
  const [rushDialogOpen, setRushDialogOpen] = useState(false)
  const [messageDialogOpen, setMessageDialogOpen] = useState(false)
  const [selectedCourseToFire, setSelectedCourseToFire] = useState<Course | null>(null)
  const [selectedItemToFire, setSelectedItemToFire] = useState<{ course: Course; item: CourseItem } | null>(null)
  const [selectedCourseToHold, setSelectedCourseToHold] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [holdReason, setHoldReason] = useState('')
  const [holdMinutes, setHoldMinutes] = useState(10)
  const [rushReason, setRushReason] = useState('')
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set())

  // Fetch orders from API
  const fetchOrders = useCallback(async () => {
    try {
      const [posRes, kitchenRes] = await Promise.all([
        fetch('/merchant-os/api/pos/orders?status=open'),
        fetch('/merchant-os/api/kitchen/orders')
      ])
      
      const posData = await posRes.json()
      const kitchenData = await kitchenRes.json()
      
      // Transform POS orders to course format
      const transformedOrders = (posData.data || []).map((order: any) => {
        // Group items by course type based on category/station
        const courseGroups: Record<string, CourseItem[]> = {}
        
        order.items?.forEach((item: any) => {
          const courseType = getCourseTypeFromItem(item)
          if (!courseGroups[courseType]) {
            courseGroups[courseType] = []
          }
          courseGroups[courseType].push({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.unitPrice,
            notes: item.notes,
            station: item.station || 'grill',
            status: mapKitchenStatus(item.status || 'pending'),
            preparationTime: item.preparationTime || 15,
            dietary: item.dietary ? JSON.parse(item.dietary) : [],
          })
        })
        
        // Convert to courses array
        const courses: Course[] = Object.entries(courseGroups).map(([type, items], index) => {
          const config = courseConfig[type as CourseType] || courseConfig.main
          return {
            id: `course-${order.id}-${index}`,
            type: type as CourseType,
            name: config.name,
            items,
            status: getCourseStatusFromItems(items),
            orderedAt: order.createdAt ? new Date(order.createdAt) : undefined,
            estimatedTime: Math.max(...items.map(i => i.preparationTime), 15),
            priority: 'normal' as const,
          }
        }).sort((a, b) => courseConfig[a.type].order - courseConfig[b.type].order)
        
        return {
          id: order.id,
          tableNumber: order.tableNumber || '-',
          guests: order.guests || 1,
          serverName: order.staffName || order.staff?.name || 'Unassigned',
          courses,
          status: 'active' as const,
          startedAt: new Date(order.createdAt),
          messages: [],
        }
      })
      
      // If no real orders, use sample data
      if (transformedOrders.length === 0) {
        setOrders(sampleOrders)
      } else {
        setOrders(transformedOrders)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      // Use sample data on error
      setOrders(sampleOrders)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Helper to determine course type from item
  const getCourseTypeFromItem = (item: any): CourseType => {
    const station = item.station?.toLowerCase() || ''
    const category = (item.category || '').toLowerCase()
    
    if (station.includes('bar') || category.includes('drink') || category.includes('beverage')) return 'drinks'
    if (station.includes('dessert') || category.includes('dessert')) return 'dessert'
    if (category.includes('starter') || category.includes('appetizer') || category.includes('start')) return 'starter'
    if (category.includes('side')) return 'sides'
    return 'main'
  }

  // Map kitchen status to course status
  const mapKitchenStatus = (status: string): CourseStatus => {
    const statusMap: Record<string, CourseStatus> = {
      'pending': 'pending',
      'held': 'held',
      'ordered': 'ordered',
      'preparing': 'preparing',
      'ready': 'ready',
      'served': 'served',
      'completed': 'served',
    }
    return statusMap[status.toLowerCase()] || 'pending'
  }

  // Get course status from items
  const getCourseStatusFromItems = (items: CourseItem[]): CourseStatus => {
    if (items.every(i => i.status === 'served')) return 'served'
    if (items.every(i => i.status === 'ready')) return 'ready'
    if (items.some(i => i.status === 'preparing')) return 'preparing'
    if (items.some(i => i.status === 'ordered')) return 'ordered'
    if (items.some(i => i.status === 'held')) return 'held'
    return 'pending'
  }

  // Fetch orders on mount and poll every 10 seconds
  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 10000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchOrders()
    toast.success('Orders refreshed')
  }

  // Calculate time elapsed
  const getTimeElapsed = (date: Date) => {
    const elapsed = Math.floor((currentTime.getTime() - date.getTime()) / 60000)
    return elapsed
  }

  // Calculate time remaining for course
  const getTimeRemaining = (course: Course) => {
    if (!course.orderedAt) return null
    const elapsed = Math.floor((currentTime.getTime() - course.orderedAt.getTime()) / 60000)
    return course.estimatedTime - elapsed
  }

  // Get current active course for a table
  const getActiveCourse = (order: TableOrder): Course | null => {
    // First check for ready courses (priority)
    const readyCourse = order.courses.find(c => c.status === 'ready')
    if (readyCourse) return readyCourse
    
    // Then check for preparing courses
    const preparingCourse = order.courses.find(c => c.status === 'preparing')
    if (preparingCourse) return preparingCourse
    
    // Then check for ordered courses
    const orderedCourse = order.courses.find(c => c.status === 'ordered')
    if (orderedCourse) return orderedCourse
    
    // Then check for held courses
    const heldCourse = order.courses.find(c => c.status === 'held')
    if (heldCourse) return heldCourse
    
    // Then check for pending courses (in order)
    const pendingCourses = order.courses.filter(c => c.status === 'pending')
    if (pendingCourses.length > 0) {
      return pendingCourses.sort((a, b) => courseConfig[a.type].order - courseConfig[b.type].order)[0]
    }
    
    return null
  }

  // Check if course timing is overdue
  const isCourseOverdue = (course: Course): { overdue: boolean; minutes: number } => {
    if (!course.orderedAt || course.status === 'served' || course.status === 'ready') {
      return { overdue: false, minutes: 0 }
    }
    const elapsed = Math.floor((currentTime.getTime() - course.orderedAt.getTime()) / 60000)
    const overdue = elapsed > course.estimatedTime
    return { overdue, minutes: Math.max(0, elapsed - course.estimatedTime) }
  }

  // Fire course (send to kitchen)
  const fireCourse = (orderId: string, courseId: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          courses: order.courses.map(course => {
            if (course.id === courseId) {
              return {
                ...course,
                status: 'ordered' as CourseStatus,
                orderedAt: new Date(),
                items: course.items.map(item => ({ 
                  ...item, 
                  status: 'ordered' as CourseStatus,
                  firedAt: new Date()
                }))
              }
            }
            return course
          })
        }
      }
      return order
    }))
    toast.success('Course fired to kitchen!')
    setFireCourseDialogOpen(false)
    setSelectedItemIds(new Set())
  }

  // Fire selected items only
  const fireSelectedItems = (orderId: string, courseId: string) => {
    if (selectedItemIds.size === 0) {
      toast.error('Please select items to fire')
      return
    }

    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          courses: order.courses.map(course => {
            if (course.id === courseId) {
              const updatedItems = course.items.map(item => 
                selectedItemIds.has(item.id) 
                  ? { ...item, status: 'ordered' as CourseStatus, firedAt: new Date() }
                  : item
              )
              
              // Update course status based on items
              const newStatus = getCourseStatusFromItems(updatedItems)
              
              return { 
                ...course, 
                items: updatedItems, 
                status: newStatus,
                orderedAt: course.orderedAt || new Date()
              }
            }
            return course
          })
        }
      }
      return order
    }))
    toast.success(`${selectedItemIds.size} item(s) fired to kitchen!`)
    setFireItemDialogOpen(false)
    setSelectedItemIds(new Set())
  }

  // Fire single item
  const fireSingleItem = (orderId: string, courseId: string, itemId: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          courses: order.courses.map(course => {
            if (course.id === courseId) {
              const updatedItems = course.items.map(item => 
                item.id === itemId 
                  ? { ...item, status: 'ordered' as CourseStatus, firedAt: new Date() }
                  : item
              )
              
              const newStatus = getCourseStatusFromItems(updatedItems)
              
              return { 
                ...course, 
                items: updatedItems, 
                status: newStatus,
                orderedAt: course.orderedAt || new Date()
              }
            }
            return course
          })
        }
      }
      return order
    }))
    toast.success('Item fired to kitchen!')
  }

  // Hold course
  const holdCourse = (orderId: string, courseId: string, reason: string, minutes: number) => {
    const holdUntil = new Date(Date.now() + minutes * 60000)
    
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          courses: order.courses.map(course => {
            if (course.id === courseId) {
              return {
                ...course,
                status: 'held' as CourseStatus,
                holdReason: reason,
                heldUntil: holdUntil,
                items: course.items.map(item => ({ ...item, status: 'held' as CourseStatus }))
              }
            }
            return course
          })
        }
      }
      return order
    }))
    toast.success(`Course held for ${minutes} minutes`)
    setHoldCourseDialogOpen(false)
    setHoldReason('')
    setHoldMinutes(10)
  }

  // Release held course
  const releaseCourse = (orderId: string, courseId: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          courses: order.courses.map(course => {
            if (course.id === courseId) {
              return {
                ...course,
                status: 'pending' as CourseStatus,
                holdReason: undefined,
                heldUntil: undefined,
                items: course.items.map(item => ({ ...item, status: 'pending' as CourseStatus }))
              }
            }
            return course
          })
        }
      }
      return order
    }))
    toast.success('Course released from hold')
  }

  // Set rush priority
  const setRushPriority = (orderId: string, reason: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          rushReason: reason,
          courses: order.courses.map(course => ({
            ...course,
            priority: 'rush' as Priority
          }))
        }
      }
      return order
    }))
    toast.success('RUSH flag set for this table!')
    setRushDialogOpen(false)
    setRushReason('')
  }

  // Clear rush priority
  const clearRushPriority = (orderId: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          rushReason: undefined,
          courses: order.courses.map(course => ({
            ...course,
            priority: 'normal' as Priority
          }))
        }
      }
      return order
    }))
    toast.success('RUSH flag cleared')
  }

  // Send message to kitchen
  const sendMessage = (orderId: string, message: string) => {
    if (!message.trim()) return
    
    const newMsg: KitchenMessage = {
      id: `msg-${Date.now()}`,
      message: message.trim(),
      sentAt: new Date(),
      from: 'waiter',
      acknowledged: false
    }
    
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          messages: [...order.messages, newMsg]
        }
      }
      return order
    }))
    
    toast.success('Message sent to kitchen!')
    setNewMessage('')
    setMessageDialogOpen(false)
    
    // Simulate kitchen acknowledgment after 3 seconds
    setTimeout(() => {
      setOrders(prev => prev.map(order => {
        if (order.id === orderId) {
          return {
            ...order,
            messages: order.messages.map(msg => 
              msg.id === newMsg.id 
                ? { ...msg, acknowledged: true, acknowledgedAt: new Date() }
                : msg
            )
          }
        }
        return order
      }))
    }, 3000)
  }

  // Mark course as ready
  const markCourseReady = (orderId: string, courseId: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          courses: order.courses.map(course => {
            if (course.id === courseId) {
              return {
                ...course,
                status: 'ready' as CourseStatus,
                readyAt: new Date(),
                items: course.items.map(item => ({ ...item, status: 'ready' as CourseStatus, readyAt: new Date() }))
              }
            }
            return course
          })
        }
      }
      return order
    }))
    toast.success('Course marked as ready!')
  }

  // Mark course as served
  const markCourseServed = (orderId: string, courseId: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          courses: order.courses.map(course => {
            if (course.id === courseId) {
              return {
                ...course,
                status: 'served' as CourseStatus,
                servedAt: new Date(),
                items: course.items.map(item => ({ ...item, status: 'served' as CourseStatus }))
              }
            }
            return course
          })
        }
      }
      return order
    }))
    toast.success('Course served to table!')
  }

  // Update item status
  const updateItemStatus = (orderId: string, courseId: string, itemId: string, status: CourseStatus) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          courses: order.courses.map(course => {
            if (course.id === courseId) {
              const updatedItems = course.items.map(item => 
                item.id === itemId ? { ...item, status } : item
              )
              
              // Update course status based on items
              const newCourseStatus = getCourseStatusFromItems(updatedItems)
              
              return { ...course, items: updatedItems, status: newCourseStatus }
            }
            return course
          })
        }
      }
      return order
    }))
  }

  // Toggle item selection for firing
  const toggleItemSelection = (itemId: string) => {
    setSelectedItemIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  // Get all allergens for an order
  const getAllOrderAllergens = (order: TableOrder): string[] => {
    const allergens = new Set<string>()
    order.courses.forEach(course => {
      course.items.forEach(item => {
        item.allergens?.forEach(a => allergens.add(a))
      })
    })
    return Array.from(allergens)
  }

  // Get active stats
  const activeOrders = orders.filter(o => o.status === 'active')
  const totalGuests = activeOrders.reduce((sum, o) => sum + o.guests, 0)
  const coursesInKitchen = activeOrders.flatMap(o => o.courses).filter(c => c.status === 'preparing' || c.status === 'ordered').length
  const coursesReady = activeOrders.flatMap(o => o.courses).filter(c => c.status === 'ready').length
  const rushOrders = activeOrders.filter(o => o.rushReason).length
  const overdueCourses = activeOrders.flatMap(o => o.courses).filter(c => isCourseOverdue(c).overdue).length

  // Get next pending course for a table
  const getNextPendingCourse = (order: TableOrder) => {
    const pendingCourses = order.courses.filter(c => c.status === 'pending')
    if (pendingCourses.length === 0) return null
    return pendingCourses.sort((a, b) => courseConfig[a.type].order - courseConfig[b.type].order)[0]
  }

  // Render visual timeline for course progression
  const renderCourseTimeline = (order: TableOrder) => {
    const courseTypes: CourseType[] = ['drinks', 'starter', 'main', 'dessert']
    
    return (
      <div className="flex items-center gap-1">
        {courseTypes.map((type, index) => {
          const course = order.courses.find(c => c.type === type)
          const config = courseConfig[type]
          const Icon = config.icon
          
          let statusColor = 'bg-gray-200 text-gray-400 border-gray-200'
          let showCheck = false
          let showBell = false
          
          if (course) {
            if (course.status === 'served') {
              statusColor = 'bg-green-500 text-white border-green-500'
              showCheck = true
            } else if (course.status === 'ready') {
              statusColor = 'bg-green-400 text-white border-green-400 animate-pulse'
              showBell = true
            } else if (course.status === 'preparing' || course.status === 'ordered') {
              statusColor = 'bg-orange-400 text-white border-orange-400'
            } else if (course.status === 'held') {
              statusColor = 'bg-amber-300 text-amber-800 border-amber-400'
            } else if (course.status === 'pending') {
              statusColor = 'bg-gray-100 text-gray-600 border-gray-300'
            }
          }
          
          const isActive = course && getActiveCourse(order)?.id === course.id
          
          return (
            <div key={type} className="flex items-center">
              <div 
                className={`
                  flex items-center gap-1 px-2 py-1 rounded-full text-xs border-2 transition-all
                  ${statusColor}
                  ${isActive ? 'ring-2 ring-offset-1 ring-orange-300' : ''}
                `}
                title={course ? `${config.name}: ${statusConfig[course.status]?.label}` : `${config.name}: Not ordered`}
              >
                <Icon className="h-3 w-3" />
                {showCheck && <Check className="h-3 w-3" />}
                {showBell && <BellRing className="h-3 w-3" />}
              </div>
              {index < courseTypes.length - 1 && (
                <ChevronRight className="h-4 w-4 mx-0.5 text-gray-300" />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // Render order card
  const renderOrderCard = (order: TableOrder) => {
    const timeElapsed = getTimeElapsed(order.startedAt)
    const nextCourse = getNextPendingCourse(order)
    const activeCourse = getActiveCourse(order)
    const orderAllergens = getAllOrderAllergens(order)
    const overdueInfo = activeCourse ? isCourseOverdue(activeCourse) : { overdue: false, minutes: 0 }
    
    return (
      <Card 
        key={order.id}
        className={`cursor-pointer transition-all hover:shadow-lg ${
          selectedOrder?.id === order.id ? 'border-[#00897B] border-2' : 'border-gray-200'
        } ${order.rushReason ? 'border-l-4 border-l-red-500' : ''}`}
        onClick={() => setSelectedOrder(order)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Table2 className="h-5 w-5 text-[#00897B]" />
              Table {order.tableNumber}
              {order.rushReason && (
                <Badge className="bg-red-100 text-red-700 border border-red-300 animate-pulse">
                  <Zap className="h-3 w-3 mr-1" />RUSH
                </Badge>
              )}
            </CardTitle>
            <Badge className="bg-[#E0F2F1] text-[#00897B]">
              <Users className="h-3 w-3 mr-1" />{order.guests}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-[#757575]">
            <span>{order.serverName}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span className={timeElapsed > 90 ? 'text-red-600 font-medium' : ''}>
                {timeElapsed} min
              </span>
            </span>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Course Timeline */}
          {renderCourseTimeline(order)}
          
          {/* Allergen Alerts */}
          {orderAllergens.length > 0 && (
            <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg border border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-xs text-red-700 font-medium">Allergens:</span>
              <div className="flex gap-1 flex-wrap">
                {orderAllergens.map(a => (
                  <Badge key={a} className="text-[10px] bg-red-100 text-red-700 border border-red-300">
                    {allergenWarnings[a]?.icon || '⚠️'} {a}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Overdue Alert */}
          {overdueInfo.overdue && (
            <div className="flex items-center gap-2 p-2 bg-red-100 rounded-lg border border-red-300">
              <AlertCircle className="h-4 w-4 text-red-600 animate-pulse" />
              <span className="text-xs text-red-700 font-bold">
                {overdueInfo.minutes} min overdue!
              </span>
            </div>
          )}
          
          {/* Ready Courses Alert */}
          {order.courses.filter(c => c.status === 'ready').length > 0 && (
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg text-green-700 border border-green-200 animate-pulse">
              <BellRing className="h-4 w-4" />
              <span className="text-sm font-medium">
                {order.courses.filter(c => c.status === 'ready').length} course(s) READY TO SERVE!
              </span>
            </div>
          )}
          
          {/* Next Course Action */}
          {nextCourse && !overdueInfo.overdue && (
            <Button 
              size="sm" 
              className="w-full bg-[#00897B] hover:bg-[#00695C]"
              onClick={(e) => {
                e.stopPropagation()
                setSelectedOrder(order)
                setSelectedCourseToFire(nextCourse)
                setFireCourseDialogOpen(true)
              }}
            >
              <Play className="h-4 w-4 mr-2" />Fire {nextCourse.name}
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="h-full flex flex-col bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
              <Utensils className="h-5 w-5 text-[#00897B]" />
              Course Management
            </h1>
            <p className="text-sm text-[#757575]">Manage course flow for each table</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-mono font-bold">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              <p className="text-xs text-[#757575]">{currentTime.toLocaleDateString()}</p>
            </div>
            
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-6 gap-3">
          <div className="bg-[#E0F2F1] rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-[#00897B]">{activeOrders.length}</p>
            <p className="text-[10px] text-[#757575]">Active Tables</p>
          </div>
          <div className="bg-sky-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-sky-600">{totalGuests}</p>
            <p className="text-[10px] text-[#757575]">Total Guests</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-orange-600">{coursesInKitchen}</p>
            <p className="text-[10px] text-[#757575]">In Kitchen</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center border-2 border-green-400">
            <p className="text-xl font-bold text-green-600">{coursesReady}</p>
            <p className="text-[10px] text-[#757575]">Ready to Serve</p>
          </div>
          <div className="bg-red-50 rounded-lg p-2 text-center border-2 border-red-300">
            <p className="text-xl font-bold text-red-600">{overdueCourses}</p>
            <p className="text-[10px] text-[#757575]">Overdue</p>
          </div>
          <div className="bg-red-100 rounded-lg p-2 text-center border-2 border-red-400">
            <p className="text-xl font-bold text-red-600">{rushOrders}</p>
            <p className="text-[10px] text-[#757575]">RUSH Orders</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Panel - Orders List */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-3 border-b border-gray-200">
            <p className="text-xs font-medium text-[#757575]">ACTIVE TABLES ({activeOrders.length})</p>
          </div>
          
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-3">
              {activeOrders.map(renderOrderCard)}
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel - Order Details */}
        {selectedOrder ? (
          <div className="flex-1 flex flex-col min-w-0">
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      Table {selectedOrder.tableNumber}
                      <Badge className="bg-[#E0F2F1] text-[#00897B]">
                        {selectedOrder.guests} guests
                      </Badge>
                      {selectedOrder.rushReason && (
                        <Badge className="bg-red-100 text-red-700 border border-red-300 animate-pulse">
                          <Zap className="h-3 w-3 mr-1" />RUSH
                        </Badge>
                      )}
                    </h2>
                    <p className="text-sm text-[#757575]">Server: {selectedOrder.serverName}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-[#757575]">Seated</p>
                    <p className="font-bold">{getTimeElapsed(selectedOrder.startedAt)} min ago</p>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setMessageDialogOpen(true)}
                      className="flex items-center gap-1"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Message
                    </Button>
                    
                    {selectedOrder.rushReason ? (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => clearRushPriority(selectedOrder.id)}
                        className="flex items-center gap-1 border-red-300 text-red-600"
                      >
                        <X className="h-4 w-4" />
                        Clear RUSH
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setRushDialogOpen(true)}
                        className="flex items-center gap-1"
                      >
                        <Zap className="h-4 w-4" />
                        RUSH
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Messages */}
              {selectedOrder.messages.length > 0 && (
                <div className="mt-3 p-2 bg-gray-50 rounded-lg max-h-24 overflow-y-auto">
                  {selectedOrder.messages.slice(-3).map(msg => (
                    <div key={msg.id} className="flex items-center gap-2 text-sm py-1">
                      <MessageSquare className="h-3 w-3 text-[#00897B]" />
                      <span className="flex-1 truncate">{msg.message}</span>
                      {msg.acknowledged ? (
                        <Badge className="text-[10px] bg-green-100 text-green-700">
                          <Check className="h-2 w-2 mr-1" />ACK
                        </Badge>
                      ) : (
                        <Badge className="text-[10px] bg-gray-100 text-gray-500">
                          <Hourglass className="h-2 w-2 mr-1" />Waiting
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {selectedOrder.courses.sort((a, b) => courseConfig[a.type].order - courseConfig[b.type].order).map((course) => {
                  const config = courseConfig[course.type]
                  const status = statusConfig[course.status]
                  const priority = priorityConfig[course.priority]
                  const timeRemaining = getTimeRemaining(course)
                  const overdueInfo = isCourseOverdue(course)
                  const Icon = config.icon
                  const isActiveCourse = getActiveCourse(selectedOrder)?.id === course.id
                  
                  return (
                    <Card 
                      key={course.id} 
                      className={`
                        ${course.status === 'ready' ? 'border-green-500 border-2 animate-pulse' : ''} 
                        ${course.status === 'held' ? 'border-amber-400 border-2' : ''}
                        ${isActiveCourse && course.status !== 'ready' && course.status !== 'served' ? 'ring-2 ring-orange-300' : ''}
                        ${overdueInfo.overdue ? 'border-red-500 border-2' : ''}
                      `}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${config.color} border`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <CardTitle className="text-base flex items-center gap-2">
                                {course.name}
                                {course.status === 'held' && (
                                  <Badge className="bg-amber-100 text-amber-700 border border-amber-300">
                                    <Pause className="h-3 w-3 mr-1" />HOLD
                                  </Badge>
                                )}
                              </CardTitle>
                              <p className="text-xs text-[#757575]">{course.items.length} items • {config.description}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {course.priority === 'rush' && (
                              <Badge className="bg-red-100 text-red-700 border border-red-300 animate-pulse">
                                <Zap className="h-3 w-3 mr-1" />RUSH
                              </Badge>
                            )}
                            
                            <Badge className={`${status.bgColor} border ${status.color}`}>
                              <status.icon className={`h-3 w-3 mr-1 ${status.pulse ? 'animate-pulse' : ''}`} />
                              {status.label}
                            </Badge>
                            
                            {course.orderedAt && course.status !== 'served' && (
                              <div className="text-right">
                                <p className="text-xs text-[#757575]">Est: {course.estimatedTime}min</p>
                                {timeRemaining !== null && (
                                  <p className={`text-sm font-medium ${
                                    overdueInfo.overdue ? 'text-red-600 font-bold animate-pulse' : 
                                    timeRemaining < 5 ? 'text-amber-600' : ''
                                  }`}>
                                    {overdueInfo.overdue 
                                      ? `${overdueInfo.minutes}m OVERDUE!` 
                                      : `${timeRemaining}m left`
                                    }
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-3">
                        {/* Items */}
                        <div className="space-y-2">
                          {course.items.map((item) => {
                            const station = stationConfig[item.station]
                            const itemStatus = statusConfig[item.status]
                            const itemOverdue = item.firedAt && item.status !== 'served' && item.status !== 'ready' && 
                              (currentTime.getTime() - item.firedAt.getTime()) / 60000 > item.preparationTime
                            
                            return (
                              <div 
                                key={item.id} 
                                className={`
                                  flex items-center justify-between p-2 rounded-lg border
                                  ${item.status === 'served' ? 'bg-gray-50 opacity-60 border-gray-200' : 
                                    item.status === 'ready' ? 'bg-green-50 border-green-200' : 
                                    item.status === 'preparing' ? 'bg-orange-50 border-orange-200' : 
                                    item.status === 'ordered' ? 'bg-sky-50 border-sky-200' :
                                    item.status === 'held' ? 'bg-amber-50 border-amber-200' :
                                    'bg-gray-50 border-gray-200'}
                                  ${itemOverdue ? 'border-red-300 border-2' : ''}
                                `}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="font-bold text-sm">{item.quantity}x</span>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium text-sm">{item.name}</p>
                                      
                                      {/* Individual item fire button */}
                                      {item.status === 'pending' && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 px-2 text-[10px] bg-[#00897B] text-white hover:bg-[#00695C]"
                                          onClick={() => fireSingleItem(selectedOrder.id, course.id, item.id)}
                                        >
                                          <Play className="h-3 w-3 mr-1" />Fire
                                        </Button>
                                      )}
                                    </div>
                                    
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <station.icon className={`h-3 w-3 ${station.color}`} />
                                      <span className="text-xs text-[#757575]">{station.name}</span>
                                      
                                      {/* Dietary badges */}
                                      {item.dietary && item.dietary.length > 0 && (
                                        <div className="flex gap-1">
                                          {item.dietary.map(d => (
                                            <Badge key={d} className="text-[8px] px-1 bg-green-100 text-green-700 border border-green-300">
                                              {d === 'vegan' ? '🌱' : d === 'vegetarian' ? '🥬' : d[0].toUpperCase()}
                                            </Badge>
                                          ))}
                                        </div>
                                      )}
                                      
                                      {/* Prominent Allergen alerts */}
                                      {item.allergens && item.allergens.length > 0 && (
                                        <div className="flex gap-1 items-center bg-red-100 px-1 py-0.5 rounded border border-red-300">
                                          <AlertTriangle className="h-3 w-3 text-red-600" />
                                          {item.allergens.map(a => (
                                            <span key={a} className="text-[10px] text-red-700 font-bold">
                                              {allergenWarnings[a]?.icon || '⚠️'} {a}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                      
                                      {/* Notes */}
                                      {item.notes && (
                                        <span className="text-xs text-amber-600 bg-amber-50 px-1 rounded">
                                          📝 {item.notes}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <span className="font-bold">R{(item.price * item.quantity).toFixed(0)}</span>
                                  <Badge className={`text-[10px] ${itemStatus.bgColor} border ${itemStatus.color}`}>
                                    {itemStatus.label}
                                  </Badge>
                                  
                                  {/* Item status actions */}
                                  {item.status === 'ordered' && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 px-2 text-[10px] bg-orange-100 text-orange-700 hover:bg-orange-200"
                                      onClick={() => updateItemStatus(selectedOrder.id, course.id, item.id, 'preparing')}
                                    >
                                      <Flame className="h-3 w-3 mr-1" />Start
                                    </Button>
                                  )}
                                  
                                  {item.status === 'preparing' && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 px-2 text-[10px] bg-green-100 text-green-700 hover:bg-green-200"
                                      onClick={() => updateItemStatus(selectedOrder.id, course.id, item.id, 'ready')}
                                    >
                                      <Check className="h-3 w-3 mr-1" />Ready
                                    </Button>
                                  )}
                                  
                                  {item.status === 'ready' && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 px-2 text-[10px] bg-green-500 text-white hover:bg-green-600"
                                      onClick={() => updateItemStatus(selectedOrder.id, course.id, item.id, 'served')}
                                    >
                                      <CheckCircle2 className="h-3 w-3 mr-1" />Served
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        
                        {/* Course Actions */}
                        <div className="flex gap-2 pt-2 flex-wrap">
                          {course.status === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                className="flex-1 bg-[#00897B] hover:bg-[#00695C]"
                                onClick={() => {
                                  setSelectedCourseToFire(course)
                                  setFireCourseDialogOpen(true)
                                }}
                              >
                                <Play className="h-4 w-4 mr-2" />Fire All
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50"
                                onClick={() => {
                                  setSelectedCourseToHold(course)
                                  setHoldCourseDialogOpen(true)
                                }}
                              >
                                <Pause className="h-4 w-4 mr-2" />Hold
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setSelectedCourseToFire(course)
                                  setSelectedItemIds(new Set())
                                  setFireItemDialogOpen(true)
                                }}
                              >
                                <Flame className="h-4 w-4 mr-2" />Select Items
                              </Button>
                            </>
                          )}
                          
                          {course.status === 'held' && (
                            <>
                              <Button 
                                size="sm" 
                                className="flex-1 bg-[#00897B] hover:bg-[#00695C]"
                                onClick={() => releaseCourse(selectedOrder.id, course.id)}
                              >
                                <Play className="h-4 w-4 mr-2" />Release
                              </Button>
                              <Badge className="bg-amber-100 text-amber-700 py-2 px-4 border border-amber-300">
                                <Pause className="h-4 w-4 mr-2" />{course.holdReason || 'On Hold'}
                                {course.heldUntil && (
                                  <span className="ml-2 text-xs">
                                    Until {course.heldUntil.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                              </Badge>
                            </>
                          )}
                          
                          {course.status === 'ordered' && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1 bg-orange-50 border-orange-300 text-orange-700 hover:bg-orange-100"
                              onClick={() => {
                                // Mark all items as preparing
                                course.items.forEach(item => {
                                  if (item.status === 'ordered') {
                                    updateItemStatus(selectedOrder.id, course.id, item.id, 'preparing')
                                  }
                                })
                              }}
                            >
                              <Flame className="h-4 w-4 mr-2" />Start Preparing
                            </Button>
                          )}
                          
                          {course.status === 'preparing' && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1 bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                              onClick={() => markCourseReady(selectedOrder.id, course.id)}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />Mark Ready
                            </Button>
                          )}
                          
                          {course.status === 'ready' && (
                            <Button 
                              size="sm" 
                              className="flex-1 bg-green-600 hover:bg-green-700 animate-pulse"
                              onClick={() => markCourseServed(selectedOrder.id, course.id)}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />Mark Served
                            </Button>
                          )}
                          
                          {course.status === 'served' && (
                            <Badge className="bg-gray-200 text-gray-600 py-2 px-4 border border-gray-300">
                              <CheckCircle2 className="h-4 w-4 mr-2" />Completed
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[#757575]">
            <div className="text-center">
              <Table2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Select a table to manage courses</p>
            </div>
          </div>
        )}
      </div>

      {/* Fire Course Dialog */}
      <Dialog open={fireCourseDialogOpen} onOpenChange={setFireCourseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🔥 Fire Course to Kitchen?</DialogTitle>
            <DialogDescription>
              This will send all items in "{selectedCourseToFire?.name}" to the kitchen for preparation.
            </DialogDescription>
          </DialogHeader>
          
          {selectedCourseToFire && (
            <div className="py-4">
              <p className="text-sm font-medium mb-2">Items to send:</p>
              <div className="space-y-1">
                {selectedCourseToFire.items.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span>{item.quantity}x {item.name}</span>
                    <span className="text-[#757575]">{stationConfig[item.station]?.name}</span>
                  </div>
                ))}
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex justify-between text-sm">
                <span>Estimated time:</span>
                <span className="font-bold">{selectedCourseToFire.estimatedTime} minutes</span>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setFireCourseDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-[#00897B] hover:bg-[#00695C]"
              onClick={() => selectedOrder && selectedCourseToFire && fireCourse(selectedOrder.id, selectedCourseToFire.id)}
            >
              <Play className="h-4 w-4 mr-2" />Fire Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fire Selected Items Dialog */}
      <Dialog open={fireItemDialogOpen} onOpenChange={setFireItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🔥 Fire Selected Items</DialogTitle>
            <DialogDescription>
              Select individual items from "{selectedCourseToFire?.name}" to send to the kitchen.
            </DialogDescription>
          </DialogHeader>
          
          {selectedCourseToFire && (
            <div className="py-4">
              <p className="text-sm font-medium mb-2">Select items to fire:</p>
              <div className="space-y-2">
                {selectedCourseToFire.items.filter(i => i.status === 'pending').map(item => (
                  <div 
                    key={item.id}
                    className={`
                      flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all
                      ${selectedItemIds.has(item.id) ? 'bg-[#00897B] text-white border-[#00897B]' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}
                    `}
                    onClick={() => toggleItemSelection(item.id)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${selectedItemIds.has(item.id) ? 'bg-white border-white' : 'border-gray-300'}`}>
                        {selectedItemIds.has(item.id) && <Check className="h-3 w-3 text-[#00897B]" />}
                      </div>
                      <span>{item.quantity}x {item.name}</span>
                    </div>
                    <span className={`text-sm ${selectedItemIds.has(item.id) ? 'text-white/80' : 'text-[#757575]'}`}>
                      {stationConfig[item.station]?.name}
                    </span>
                  </div>
                ))}
              </div>
              
              {selectedItemIds.size > 0 && (
                <div className="mt-4 p-2 bg-[#E0F2F1] rounded-lg">
                  <p className="text-sm text-[#00897B]">
                    {selectedItemIds.size} item(s) selected
                  </p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setFireItemDialogOpen(false)
              setSelectedItemIds(new Set())
            }}>
              Cancel
            </Button>
            <Button 
              className="bg-[#00897B] hover:bg-[#00695C]"
              disabled={selectedItemIds.size === 0}
              onClick={() => selectedOrder && selectedCourseToFire && fireSelectedItems(selectedOrder.id, selectedCourseToFire.id)}
            >
              <Play className="h-4 w-4 mr-2" />Fire Selected ({selectedItemIds.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hold Course Dialog */}
      <Dialog open={holdCourseDialogOpen} onOpenChange={setHoldCourseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>⏸️ Hold Course</DialogTitle>
            <DialogDescription>
              Put "{selectedCourseToHold?.name}" on hold. It won't be sent to the kitchen until released.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="hold-reason">Reason (optional)</Label>
              <Input
                id="hold-reason"
                placeholder="e.g., Waiting for guests to finish starters"
                value={holdReason}
                onChange={(e) => setHoldReason(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="hold-minutes">Hold Duration (minutes)</Label>
              <div className="flex gap-2 mt-2">
                {[5, 10, 15, 20, 30].map(mins => (
                  <Button
                    key={mins}
                    size="sm"
                    variant={holdMinutes === mins ? 'default' : 'outline'}
                    className={holdMinutes === mins ? 'bg-[#00897B] hover:bg-[#00695C]' : ''}
                    onClick={() => setHoldMinutes(mins)}
                  >
                    {mins}m
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setHoldCourseDialogOpen(false)
              setHoldReason('')
              setHoldMinutes(10)
            }}>
              Cancel
            </Button>
            <Button 
              className="bg-amber-500 hover:bg-amber-600"
              onClick={() => selectedOrder && selectedCourseToHold && holdCourse(selectedOrder.id, selectedCourseToHold.id, holdReason, holdMinutes)}
            >
              <Pause className="h-4 w-4 mr-2" />Hold Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rush Flag Dialog */}
      <Dialog open={rushDialogOpen} onOpenChange={setRushDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>⚡ Set RUSH Priority</DialogTitle>
            <DialogDescription>
              Flag this order as urgent. Kitchen will be notified to prioritize it.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="rush-reason">Reason for rush</Label>
              <Textarea
                id="rush-reason"
                placeholder="e.g., VIP guests, customer complaint, late order..."
                value={rushReason}
                onChange={(e) => setRushReason(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Warning</span>
              </div>
              <p className="text-xs text-red-600 mt-1">
                RUSH orders will be flagged in the kitchen and may affect other orders' timing.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setRushDialogOpen(false)
              setRushReason('')
            }}>
              Cancel
            </Button>
            <Button 
              className="bg-red-500 hover:bg-red-600"
              onClick={() => selectedOrder && setRushPriority(selectedOrder.id, rushReason)}
            >
              <Zap className="h-4 w-4 mr-2" />Set RUSH
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Kitchen Message Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>💬 Send Message to Kitchen</DialogTitle>
            <DialogDescription>
              Send a message to the kitchen staff regarding Table {selectedOrder?.tableNumber}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="e.g., Customer requests no onions on all dishes..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={3}
              />
            </div>
            
            {/* Quick messages */}
            <div>
              <Label className="text-xs text-[#757575]">Quick messages:</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  'Allergies - please be careful',
                  'Customer in a hurry',
                  'Birthday celebration',
                  'Anniversary - make it special',
                  'Check on order status',
                ].map(msg => (
                  <Button
                    key={msg}
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => setNewMessage(msg)}
                  >
                    {msg}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setMessageDialogOpen(false)
              setNewMessage('')
            }}>
              Cancel
            </Button>
            <Button 
              className="bg-[#00897B] hover:bg-[#00695C]"
              disabled={!newMessage.trim()}
              onClick={() => selectedOrder && sendMessage(selectedOrder.id, newMessage)}
            >
              <Send className="h-4 w-4 mr-2" />Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
