'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Table2,
  Plus,
  Edit,
  Trash2,
  Users,
  Clock,
  Circle,
  Square,
  RectangleHorizontal,
  MapPin,
  User,
  Timer,
  CheckCircle2,
  Utensils,
  CreditCard,
  Printer,
  MessageCircle,
  Grid3X3,
  ZoomIn,
  ZoomOut,
  Save,
  Undo,
  Redo,
  FolderPlus,
  Settings,
  X,
  Loader2,
  Layout,
  Wine,
  UtensilsCrossed,
  CookingPot,
  Coffee,
  Beer,
  ChefHat,
  Sun,
  Crown,
  Store,
} from 'lucide-react'
import { floorPlanTemplates, type FloorPlanTemplate } from '../data/floorPlanTemplates'

// Types
type TableShape = 'circle' | 'square' | 'rectangle' | 'booth'
type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning' | 'out_of_service'

interface RestaurantTable {
  id: string
  number: string
  shape: TableShape
  x: number
  y: number
  width: number
  height: number
  rotation: number
  seats: number
  status: TableStatus
  sectionId: string
  serverId?: string | null
  server?: { id: string; name: string } | null
  serverName?: string
  currentOrder?: {
    id: string
    orderId: string
    items: number
    total: number
    startTime: string
    guests: number
  } | null
  reservation?: {
    id: string
    customerName: string
    phone: string
    time: string
    guests: number
    notes?: string
  } | null
  minSpending?: number | null
}

interface FloorSection {
  id: string
  name: string
  color: string
  tables: RestaurantTable[]
}

interface Server {
  id: string
  name: string
  status: 'active' | 'break' | 'off'
  tables: { id: string }[]
}

const statusColors: Record<TableStatus, { bg: string; border: string; text: string; label: string }> = {
  available: { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-700', label: 'Available' },
  occupied: { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-700', label: 'Occupied' },
  reserved: { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-700', label: 'Reserved' },
  cleaning: { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-700', label: 'Cleaning' },
  out_of_service: { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-500', label: 'Out of Service' },
}

const colorOptions = [
  '#00897B', '#FF9800', '#9C27B0', '#3F51B5', '#607D8B', '#E91E63', '#00BCD4', '#4CAF50'
]

export function TableFloorPlanView() {
  const [sections, setSections] = useState<FloorSection[]>([])
  const [servers, setServers] = useState<Server[]>([])
  const [activeSection, setActiveSection] = useState<string>('')
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [showGrid, setShowGrid] = useState(true)
  const [draggedTable, setDraggedTable] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Dialogs
  const [tableDialogOpen, setTableDialogOpen] = useState(false)
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false)
  const [reservationDialogOpen, setReservationDialogOpen] = useState(false)
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)
  const [serverDialogOpen, setServerDialogOpen] = useState(false)
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<FloorPlanTemplate | null>(null)
  
  // Form states
  const [editingSection, setEditingSection] = useState<Partial<FloorSection> | null>(null)
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null)
  const [newReservation, setNewReservation] = useState({ customerName: '', phone: '', time: '', guests: 2, notes: '' })
  const [newOrder, setNewOrder] = useState({ guests: 1 })
  const [newServer, setNewServer] = useState({ name: '' })
  const [saving, setSaving] = useState(false)
  
  // History for undo/redo
  const [history, setHistory] = useState<FloorSection[][]>([])
  const [historyIndex, setHistoryIndex] = useState(0)
  
  const floorRef = useRef<HTMLDivElement>(null)

  // Fetch data on mount
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [sectionsRes, serversRes] = await Promise.all([
        fetch('/merchant-os/api/floorplan/sections'),
        fetch('/merchant-os/api/floorplan/servers'),
      ])
      
      const sectionsData = await sectionsRes.json()
      const serversData = await serversRes.json()
      
      // Transform data for frontend
      const transformedSections = sectionsData.map((section: any) => ({
        id: section.id,
        name: section.name,
        color: section.color,
        tables: section.tables.map((table: any) => ({
          id: table.id,
          number: table.number,
          shape: table.shape as TableShape,
          x: table.x,
          y: table.y,
          width: table.width,
          height: table.height,
          rotation: table.rotation,
          seats: table.seats,
          status: table.status as TableStatus,
          sectionId: table.sectionId,
          serverId: table.serverId,
          server: table.server,
          serverName: table.server?.name,
          currentOrder: table.currentOrder ? {
            id: table.currentOrder.id,
            orderId: table.currentOrder.orderId,
            items: table.currentOrder.items,
            total: table.currentOrder.total,
            startTime: table.currentOrder.startTime,
            guests: table.currentOrder.guests,
          } : null,
          reservation: table.reservation ? {
            id: table.reservation.id,
            customerName: table.reservation.customerName,
            phone: table.reservation.phone || '',
            time: table.reservation.time,
            guests: table.reservation.guests,
            notes: table.reservation.notes || '',
          } : null,
          minSpending: table.minSpending,
        })),
      }))
      
      setSections(transformedSections)
      if (transformedSections.length > 0 && !activeSection) {
        setActiveSection(transformedSections[0].id)
      }
      
      setServers(serversData.map((s: any) => ({
        id: s.id,
        name: s.name,
        status: s.status,
        tables: s.tables || [],
      })))
      
      setHistory([transformedSections])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }
  
  // Stats
  const allTables = sections.flatMap(s => s.tables)
  const stats = {
    available: allTables.filter(t => t.status === 'available').length,
    occupied: allTables.filter(t => t.status === 'occupied').length,
    reserved: allTables.filter(t => t.status === 'reserved').length,
    totalSeats: allTables.reduce((sum, t) => sum + t.seats, 0),
    occupiedSeats: allTables.filter(t => t.currentOrder).reduce((sum, t) => sum + (t.currentOrder?.guests || 0), 0),
    activeOrders: allTables.filter(t => t.currentOrder).length,
    revenue: allTables.filter(t => t.currentOrder).reduce((sum, t) => sum + (t.currentOrder?.total || 0), 0),
  }
  
  // History management
  const saveToHistory = useCallback((newSections: FloorSection[]) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newSections)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }, [history, historyIndex])
  
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setSections(history[historyIndex - 1])
      toast.success('Undo successful')
    }
  }
  
  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setSections(history[historyIndex + 1])
      toast.success('Redo successful')
    }
  }
  
  // Section CRUD
  const addSection = () => {
    setEditingSection({ id: '', name: '', color: colorOptions[0], tables: [] })
    setSectionDialogOpen(true)
  }
  
  const editSection = (section: FloorSection) => {
    setEditingSection({ ...section })
    setSectionDialogOpen(true)
  }
  
  const saveSection = async () => {
    if (!editingSection?.name) {
      toast.error('Section name is required')
      return
    }
    
    setSaving(true)
    try {
      const isEdit = !!editingSection.id
      const url = isEdit 
        ? `/merchant-os/api/floorplan/sections/${editingSection.id}`
        : '/merchant-os/api/floorplan/sections'
      const method = isEdit ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingSection.name, color: editingSection.color }),
      })
      
      if (!res.ok) throw new Error('Failed to save section')
      
      const savedSection = await res.json()
      
      setSections(prev => {
        const newSections = isEdit
          ? prev.map(s => s.id === savedSection.id ? { ...savedSection, tables: s.tables } : s)
          : [...prev, { ...savedSection, tables: [] }]
        saveToHistory(newSections)
        return newSections
      })
      
      if (!isEdit) {
        setActiveSection(savedSection.id)
      }
      
      setSectionDialogOpen(false)
      setEditingSection(null)
      toast.success(isEdit ? 'Section updated' : 'Section created')
    } catch (error) {
      console.error('Error saving section:', error)
      toast.error('Failed to save section')
    } finally {
      setSaving(false)
    }
  }
  
  const deleteSection = async (sectionId: string) => {
    if (sections.length <= 1) {
      toast.error('Cannot delete the last section')
      return
    }
    
    const section = sections.find(s => s.id === sectionId)
    if (section?.tables.length) {
      toast.error('Cannot delete section with tables. Move or delete tables first.')
      return
    }
    
    setSaving(true)
    try {
      const res = await fetch(`/merchant-os/api/floorplan/sections/${sectionId}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete section')
      }
      
      setSections(prev => {
        const newSections = prev.filter(s => s.id !== sectionId)
        saveToHistory(newSections)
        return newSections
      })
      
      if (activeSection === sectionId) {
        setActiveSection(sections[0].id)
      }
      
      toast.success('Section deleted')
    } catch (error: any) {
      console.error('Error deleting section:', error)
      toast.error(error.message || 'Failed to delete section')
    } finally {
      setSaving(false)
    }
  }
  
  // Table CRUD
  const addTable = async (shape: TableShape) => {
    const section = sections.find(s => s.id === activeSection)
    if (!section) return
    
    setSaving(true)
    try {
      const res = await fetch('/merchant-os/api/floorplan/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: `${section.tables.length + 1}`,
          shape,
          x: 100 + Math.random() * 100,
          y: 100 + Math.random() * 100,
          width: shape === 'circle' ? 60 : shape === 'rectangle' ? 80 : 50,
          height: shape === 'circle' ? 60 : shape === 'rectangle' ? 50 : 50,
          seats: shape === 'rectangle' ? 6 : 4,
          status: 'available',
          sectionId: activeSection,
        }),
      })
      
      if (!res.ok) throw new Error('Failed to create table')
      
      const newTable = await res.json()
      
      setSections(prev => {
        const newSections = prev.map(s =>
          s.id === activeSection ? { 
            ...s, 
            tables: [...s.tables, { 
              ...newTable, 
              serverName: newTable.server?.name 
            }] 
          } : s
        )
        saveToHistory(newSections)
        return newSections
      })
      
      toast.success(`Added ${shape} table`)
    } catch (error) {
      console.error('Error creating table:', error)
      toast.error('Failed to create table')
    } finally {
      setSaving(false)
    }
  }
  
  const updateTable = async (tableId: string, updates: Partial<RestaurantTable>) => {
    try {
      const res = await fetch(`/merchant-os/api/floorplan/tables/${tableId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      
      if (!res.ok) throw new Error('Failed to update table')
      
      const updatedTable = await res.json()
      
      setSections(prev => {
        const newSections = prev.map(section => ({
          ...section,
          tables: section.tables.map(table =>
            table.id === tableId ? { ...table, ...updates, serverName: updatedTable.server?.name } : table
          ),
        }))
        saveToHistory(newSections)
        return newSections
      })
      
      if (selectedTable?.id === tableId) {
        setSelectedTable(prev => prev ? { ...prev, ...updates, serverName: updatedTable.server?.name } : null)
      }
    } catch (error) {
      console.error('Error updating table:', error)
      toast.error('Failed to update table')
    }
  }
  
  const deleteTable = async (tableId: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/merchant-os/api/floorplan/tables/${tableId}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) throw new Error('Failed to delete table')
      
      setSections(prev => {
        const newSections = prev.map(section => ({
          ...section,
          tables: section.tables.filter(t => t.id !== tableId),
        }))
        saveToHistory(newSections)
        return newSections
      })
      
      setSelectedTable(null)
      setTableDialogOpen(false)
      toast.success('Table deleted')
    } catch (error) {
      console.error('Error deleting table:', error)
      toast.error('Failed to delete table')
    } finally {
      setSaving(false)
    }
  }
  
  const saveTable = async () => {
    if (!editingTable) return
    
    setSaving(true)
    try {
      await updateTable(editingTable.id, editingTable)
      setTableDialogOpen(false)
      setEditingTable(null)
      toast.success('Table saved')
    } finally {
      setSaving(false)
    }
  }
  
  // Reservation CRUD
  const createReservation = async () => {
    if (!selectedTable || !newReservation.customerName || !newReservation.time) {
      toast.error('Customer name and time are required')
      return
    }
    
    setSaving(true)
    try {
      const res = await fetch('/merchant-os/api/floorplan/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: selectedTable.id,
          ...newReservation,
        }),
      })
      
      if (!res.ok) throw new Error('Failed to create reservation')
      
      const reservation = await res.json()
      
      setSections(prev => {
        const newSections = prev.map(section => ({
          ...section,
          tables: section.tables.map(table =>
            table.id === selectedTable.id ? {
              ...table,
              status: 'reserved',
              reservation: {
                id: reservation.id,
                customerName: newReservation.customerName,
                phone: newReservation.phone,
                time: newReservation.time,
                guests: newReservation.guests,
                notes: newReservation.notes,
              },
            } : table
          ),
        }))
        saveToHistory(newSections)
        return newSections
      })
      
      setSelectedTable(prev => prev ? {
        ...prev,
        status: 'reserved',
        reservation: {
          id: reservation.id,
          customerName: newReservation.customerName,
          phone: newReservation.phone,
          time: newReservation.time,
          guests: newReservation.guests,
          notes: newReservation.notes,
        },
      } : null)
      
      setReservationDialogOpen(false)
      setNewReservation({ customerName: '', phone: '', time: '', guests: 2, notes: '' })
      toast.success('Reservation created')
    } catch (error) {
      console.error('Error creating reservation:', error)
      toast.error('Failed to create reservation')
    } finally {
      setSaving(false)
    }
  }
  
  const cancelReservation = async () => {
    if (!selectedTable?.reservation) return
    
    setSaving(true)
    try {
      const res = await fetch(`/merchant-os/api/floorplan/reservations/${selectedTable.reservation.id}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) throw new Error('Failed to cancel reservation')
      
      await updateTable(selectedTable.id, { status: 'available' })
      
      setSections(prev => {
        const newSections = prev.map(section => ({
          ...section,
          tables: section.tables.map(table =>
            table.id === selectedTable.id ? {
              ...table,
              status: 'available',
              reservation: null,
            } : table
          ),
        }))
        saveToHistory(newSections)
        return newSections
      })
      
      setSelectedTable(prev => prev ? { ...prev, status: 'available', reservation: null } : null)
      setReservationDialogOpen(false)
      toast.success('Reservation cancelled')
    } catch (error) {
      console.error('Error cancelling reservation:', error)
      toast.error('Failed to cancel reservation')
    } finally {
      setSaving(false)
    }
  }
  
  const seatReservation = async () => {
    if (!selectedTable?.reservation) return
    
    setSaving(true)
    try {
      // Create order
      const res = await fetch('/merchant-os/api/floorplan/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: selectedTable.id,
          guests: selectedTable.reservation.guests,
        }),
      })
      
      if (!res.ok) throw new Error('Failed to seat reservation')
      
      const order = await res.json()
      
      setSections(prev => {
        const newSections = prev.map(section => ({
          ...section,
          tables: section.tables.map(table =>
            table.id === selectedTable.id ? {
              ...table,
              status: 'occupied',
              currentOrder: {
                id: order.id,
                orderId: order.orderId,
                items: 0,
                total: 0,
                startTime: order.startTime,
                guests: selectedTable.reservation!.guests,
              },
              reservation: null,
            } : table
          ),
        }))
        saveToHistory(newSections)
        return newSections
      })
      
      setReservationDialogOpen(false)
      setSelectedTable(null)
      toast.success('Guests seated')
    } catch (error) {
      console.error('Error seating reservation:', error)
      toast.error('Failed to seat reservation')
    } finally {
      setSaving(false)
    }
  }
  
  // Order management
  const createOrder = async () => {
    if (!selectedTable) return
    
    setSaving(true)
    try {
      const res = await fetch('/merchant-os/api/floorplan/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: selectedTable.id,
          guests: newOrder.guests,
        }),
      })
      
      if (!res.ok) throw new Error('Failed to create order')
      
      const order = await res.json()
      
      setSections(prev => {
        const newSections = prev.map(section => ({
          ...section,
          tables: section.tables.map(table =>
            table.id === selectedTable.id ? {
              ...table,
              status: 'occupied',
              currentOrder: {
                id: order.id,
                orderId: order.orderId,
                items: 0,
                total: 0,
                startTime: order.startTime,
                guests: newOrder.guests,
              },
            } : table
          ),
        }))
        saveToHistory(newSections)
        return newSections
      })
      
      setOrderDialogOpen(false)
      setNewOrder({ guests: 1 })
      toast.success('Order started')
    } catch (error) {
      console.error('Error creating order:', error)
      toast.error('Failed to create order')
    } finally {
      setSaving(false)
    }
  }
  
  const closeOrder = async () => {
    if (!selectedTable?.currentOrder) return
    
    setSaving(true)
    try {
      const res = await fetch(`/merchant-os/api/floorplan/orders/${selectedTable.currentOrder.id}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) throw new Error('Failed to close order')
      
      setSections(prev => {
        const newSections = prev.map(section => ({
          ...section,
          tables: section.tables.map(table =>
            table.id === selectedTable.id ? {
              ...table,
              status: 'cleaning',
              currentOrder: null,
            } : table
          ),
        }))
        saveToHistory(newSections)
        return newSections
      })
      
      setSelectedTable(prev => prev ? { ...prev, status: 'cleaning', currentOrder: null } : null)
      toast.success('Order closed')
    } catch (error) {
      console.error('Error closing order:', error)
      toast.error('Failed to close order')
    } finally {
      setSaving(false)
    }
  }
  
  // Server CRUD
  const addServer = async () => {
    if (!newServer.name.trim()) {
      toast.error('Server name is required')
      return
    }
    
    setSaving(true)
    try {
      const res = await fetch('/merchant-os/api/floorplan/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newServer.name, status: 'active' }),
      })
      
      if (!res.ok) throw new Error('Failed to create server')
      
      const server = await res.json()
      
      setServers(prev => [...prev, { ...server, tables: [] }])
      setNewServer({ name: '' })
      setServerDialogOpen(false)
      toast.success('Server added')
    } catch (error) {
      console.error('Error creating server:', error)
      toast.error('Failed to create server')
    } finally {
      setSaving(false)
    }
  }
  
  const assignServer = async (serverId: string) => {
    if (!selectedTable) return
    
    await updateTable(selectedTable.id, { serverId })
    toast.success('Server assigned')
  }
  
  // Apply template function
  const applyTemplate = async (template: FloorPlanTemplate) => {
    if (saving) return
    
    // Check if there are existing tables
    const existingTables = sections.flatMap(s => s.tables)
    if (existingTables.length > 0) {
      const confirmed = window.confirm(
        'Applying this template will remove all existing sections and tables. Continue?'
      )
      if (!confirmed) return
    }
    
    setSaving(true)
    setSelectedTemplate(template)
    
    try {
      // First, delete all existing tables
      for (const table of existingTables) {
        await fetch(`/merchant-os/api/floorplan/tables/${table.id}`, { method: 'DELETE' })
      }
      
      // Delete all existing sections
      for (const section of sections) {
        await fetch(`/merchant-os/api/floorplan/sections/${section.id}`, { method: 'DELETE' })
      }
      
      // Create new sections with tables
      const newSections: FloorSection[] = []
      
      for (const templateSection of template.sections) {
        // Create section
        const sectionRes = await fetch('/merchant-os/api/floorplan/sections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: templateSection.name,
            color: templateSection.color,
          }),
        })
        
        if (!sectionRes.ok) throw new Error('Failed to create section')
        
        const savedSection = await sectionRes.json()
        const createdTables: RestaurantTable[] = []
        
        // Create tables for this section
        for (const templateTable of templateSection.tables) {
          const tableRes = await fetch('/merchant-os/api/floorplan/tables', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              number: templateTable.number,
              shape: templateTable.shape,
              x: templateTable.x,
              y: templateTable.y,
              width: templateTable.width,
              height: templateTable.height,
              seats: templateTable.seats,
              minSpending: templateTable.minSpending,
              status: 'available',
              sectionId: savedSection.id,
            }),
          })
          
          if (tableRes.ok) {
            const savedTable = await tableRes.json()
            createdTables.push({
              id: savedTable.id,
              number: savedTable.number,
              shape: savedTable.shape as TableShape,
              x: savedTable.x,
              y: savedTable.y,
              width: savedTable.width,
              height: savedTable.height,
              rotation: savedTable.rotation,
              seats: savedTable.seats,
              status: savedTable.status as TableStatus,
              sectionId: savedTable.sectionId,
              minSpending: savedTable.minSpending,
            })
          }
        }
        
        newSections.push({
          id: savedSection.id,
          name: savedSection.name,
          color: savedSection.color,
          tables: createdTables,
        })
      }
      
      setSections(newSections)
      setHistory([newSections])
      setHistoryIndex(0)
      
      if (newSections.length > 0) {
        setActiveSection(newSections[0].id)
      }
      
      setTemplateDialogOpen(false)
      setSelectedTemplate(null)
      toast.success(`Applied "${template.name}" template with ${template.tableCount} tables!`)
    } catch (error) {
      console.error('Error applying template:', error)
      toast.error('Failed to apply template')
    } finally {
      setSaving(false)
    }
  }
  
  // Drag and drop
  const handleDragStart = (e: React.DragEvent, tableId: string) => {
    if (!editMode) return
    setDraggedTable(tableId)
    e.dataTransfer.effectAllowed = 'move'
  }
  
  const handleDragOver = (e: React.DragEvent) => {
    if (!editMode || !draggedTable) return
    e.preventDefault()
  }
  
  const handleDrop = async (e: React.DragEvent) => {
    if (!editMode || !draggedTable || !floorRef.current) return
    e.preventDefault()
    
    const rect = floorRef.current.getBoundingClientRect()
    const x = Math.max(0, (e.clientX - rect.left) / zoom - 30)
    const y = Math.max(0, (e.clientY - rect.top) / zoom - 30)
    
    await updateTable(draggedTable, { x, y })
    setDraggedTable(null)
  }
  
  // Table click handler
  const handleTableClick = (table: RestaurantTable) => {
    setSelectedTable(table)
    
    if (editMode) {
      setEditingTable(table)
      setTableDialogOpen(true)
    } else if (table.status === 'available') {
      setReservationDialogOpen(true)
    } else if (table.status === 'reserved' && table.reservation) {
      setReservationDialogOpen(true)
    } else if (table.status === 'occupied' && table.currentOrder) {
      setOrderDialogOpen(true)
    }
  }
  
  // Render table
  const renderTable = (table: RestaurantTable) => {
    const style = statusColors[table.status]
    
    return (
      <div
        key={table.id}
        draggable={editMode}
        onDragStart={(e) => handleDragStart(e, table.id)}
        onClick={() => handleTableClick(table)}
        className={`absolute cursor-pointer transition-all duration-200 border-2 flex flex-col items-center justify-center ${style.bg} ${style.border} hover:shadow-lg group`}
        style={{
          left: table.x * zoom,
          top: table.y * zoom,
          width: table.width * zoom,
          height: table.height * zoom,
          borderRadius: table.shape === 'circle' ? '50%' : table.shape === 'booth' ? '16px 16px 4px 4px' : '8px',
          transform: `rotate(${table.rotation}deg)`,
        }}
      >
        <span className={`font-bold text-sm ${style.text}`}>{table.number}</span>
        <span className={`text-[10px] ${style.text} opacity-75`}>
          <Users className="h-3 w-3 inline mr-0.5" />{table.seats}
        </span>
        
        {table.currentOrder && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] px-1.5 rounded-full whitespace-nowrap">
            {table.currentOrder.items} items · R{table.currentOrder.total.toFixed(0)}
          </div>
        )}
        
        {table.reservation && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
            <Clock className="h-2.5 w-2.5 text-white" />
          </div>
        )}
        
        {(table.serverName || table.server?.name) && (
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[8px] px-1.5 py-0.5 rounded whitespace-nowrap">
            {table.serverName || table.server?.name}
          </div>
        )}
      </div>
    )
  }
  
  const currentSection = sections.find(s => s.id === activeSection)

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#FAFAFA]">
        <Loader2 className="h-8 w-8 animate-spin text-[#00897B]" />
      </div>
    )
  }
  
  return (
    <div className="h-full flex bg-[#FAFAFA]">
      {/* Left Sidebar - Sections */}
      <div className="w-48 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-3 border-b border-gray-200 flex items-center justify-between">
          <p className="text-xs font-medium text-[#757575]">SECTIONS</p>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={addSection}>
            <FolderPlus className="h-4 w-4" />
          </Button>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {sections.map(section => (
              <div
                key={section.id}
                className={`group flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer ${
                  activeSection === section.id
                    ? 'bg-[#E0F2F1] text-[#00897B] font-medium'
                    : 'text-[#757575] hover:bg-gray-100'
                }`}
                onClick={() => setActiveSection(section.id)}
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: section.color }} />
                <span className="flex-1 truncate">{section.name}</span>
                <Badge variant="outline" className="text-[10px]">{section.tables.length}</Badge>
                
                <div className="hidden group-hover:flex gap-1">
                  <button onClick={(e) => { e.stopPropagation(); editSection(section) }}>
                    <Edit className="h-3 w-3" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); deleteSection(section.id) }} className="text-red-500">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="p-3 border-t border-gray-200">
          <p className="text-xs font-medium text-[#757575] mb-2">ZOOM</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs text-[#757575] flex-1 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[#00897B]" />
                Table Floor Plan
              </h1>
              <p className="text-sm text-[#757575]">Manage restaurant seating and table status</p>
            </div>
            
            <div className="flex items-center gap-2">
              {editMode && (
                <>
                  <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex === 0}>
                    <Undo className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex === history.length - 1}>
                    <Redo className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowGrid(!showGrid)}>
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setServerDialogOpen(true)}>
                    <Users className="h-4 w-4 mr-1" />
                    Servers
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setTemplateDialogOpen(true)}
                    className="border-[#00897B] text-[#00897B]"
                  >
                    <Layout className="h-4 w-4 mr-1" />
                    Templates
                  </Button>
                </>
              )}
              
              <Button
                variant={editMode ? 'default' : 'outline'}
                size="sm"
                className={editMode ? 'bg-[#00897B] hover:bg-[#00695C]' : ''}
                onClick={() => setEditMode(!editMode)}
              >
                {editMode ? (
                  <><Save className="h-4 w-4 mr-2" />Done Editing</>
                ) : (
                  <><Edit className="h-4 w-4 mr-2" />Edit Mode</>
                )}
              </Button>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-6 gap-3">
            <div className="bg-green-50 rounded-lg p-2 text-center">
              <p className="text-xl font-bold text-green-600">{stats.available}</p>
              <p className="text-[10px] text-[#757575]">Available</p>
            </div>
            <div className="bg-red-50 rounded-lg p-2 text-center">
              <p className="text-xl font-bold text-red-600">{stats.occupied}</p>
              <p className="text-[10px] text-[#757575]">Occupied</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-2 text-center">
              <p className="text-xl font-bold text-amber-600">{stats.reserved}</p>
              <p className="text-[10px] text-[#757575]">Reserved</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-2 text-center">
              <p className="text-xl font-bold text-blue-600">{stats.occupiedSeats}/{stats.totalSeats}</p>
              <p className="text-[10px] text-[#757575]">Guests</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-2 text-center">
              <p className="text-xl font-bold text-purple-600">{stats.activeOrders}</p>
              <p className="text-[10px] text-[#757575]">Orders</p>
            </div>
            <div className="bg-[#E0F2F1] rounded-lg p-2 text-center">
              <p className="text-xl font-bold text-[#00897B]">R{stats.revenue.toFixed(0)}</p>
              <p className="text-[10px] text-[#757575]">Revenue</p>
            </div>
          </div>
        </div>
        
        {/* Floor Canvas */}
        <div className="flex-1 overflow-hidden flex">
          <div className="flex-1 relative">
            {editMode && (
              <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-2 flex items-center gap-2">
                <p className="text-xs font-medium text-[#757575] mr-2">Add Table:</p>
                <Button variant="outline" size="sm" onClick={() => addTable('circle')} disabled={saving}>
                  <Circle className="h-4 w-4 mr-1" />Round
                </Button>
                <Button variant="outline" size="sm" onClick={() => addTable('square')} disabled={saving}>
                  <Square className="h-4 w-4 mr-1" />Square
                </Button>
                <Button variant="outline" size="sm" onClick={() => addTable('rectangle')} disabled={saving}>
                  <RectangleHorizontal className="h-4 w-4 mr-1" />Rect
                </Button>
                <Button variant="outline" size="sm" onClick={() => addTable('booth')} disabled={saving}>
                  <Users className="h-4 w-4 mr-1" />Booth
                </Button>
              </div>
            )}
            
            <div
              ref={floorRef}
              className="w-full h-full relative overflow-auto"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              style={{
                backgroundImage: showGrid ? 'radial-gradient(circle, #e5e5e5 1px, transparent 1px)' : 'none',
                backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
              }}
            >
              <div className="absolute inset-0 opacity-5" style={{ backgroundColor: currentSection?.color }} />
              {currentSection?.tables.map(renderTable)}
              
              <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3">
                <p className="text-[10px] font-medium text-[#757575] mb-2">STATUS</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(statusColors).map(([status, style]) => (
                    <div key={status} className="flex items-center gap-1.5">
                      <div className={`w-3 h-3 rounded ${style.bg} border ${style.border}`} />
                      <span className="text-[10px] text-[#757575]">{style.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Sidebar - Table Details */}
      {selectedTable && !editMode && (
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-[#1A1A1A]">Table {selectedTable.number}</h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedTable(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Badge className={`${statusColors[selectedTable.status].bg} ${statusColors[selectedTable.status].text} mt-2`}>
              {statusColors[selectedTable.status].label}
            </Badge>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* Info */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#757575]">Seats</span>
                  <span className="font-medium">{selectedTable.seats}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#757575]">Section</span>
                  <span className="font-medium">{sections.find(s => s.id === selectedTable.sectionId)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#757575]">Server</span>
                  <span className="font-medium">{selectedTable.serverName || selectedTable.server?.name || 'Unassigned'}</span>
                </div>
              </div>
              
              <Separator />
              
              {/* Current Order */}
              {selectedTable.currentOrder && (
                <>
                  <div>
                    <h3 className="font-medium text-sm mb-2">Current Order</h3>
                    <Card>
                      <CardContent className="p-3 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-[#757575]">Order ID</span>
                          <span className="font-medium">{selectedTable.currentOrder.orderId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#757575]">Items</span>
                          <span className="font-medium">{selectedTable.currentOrder.items}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#757575]">Total</span>
                          <span className="font-bold text-[#00897B]">R{selectedTable.currentOrder.total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#757575]">Guests</span>
                          <span className="font-medium">{selectedTable.currentOrder.guests}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm"><Utensils className="h-4 w-4 mr-1" />View Order</Button>
                    <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" />Add Items</Button>
                    <Button variant="outline" size="sm"><Printer className="h-4 w-4 mr-1" />Print</Button>
                    <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C]"><CreditCard className="h-4 w-4 mr-1" />Pay</Button>
                    <Button variant="destructive" size="sm" className="col-span-2" onClick={closeOrder}>Close Order</Button>
                  </div>
                </>
              )}
              
              {/* Reservation */}
              {selectedTable.reservation && (
                <>
                  <div>
                    <h3 className="font-medium text-sm mb-2">Reservation</h3>
                    <Card className="border-amber-200 bg-amber-50">
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-amber-600" />
                          <span className="font-medium">{selectedTable.reservation.customerName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-[#757575]" />
                          <span>{selectedTable.reservation.time}</span>
                          <Users className="h-4 w-4 text-[#757575] ml-2" />
                          <span>{selectedTable.reservation.guests} guests</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MessageCircle className="h-4 w-4 text-[#757575]" />
                          <span>{selectedTable.reservation.phone}</span>
                        </div>
                        {selectedTable.reservation.notes && (
                          <p className="text-xs text-[#757575] mt-2 p-2 bg-white rounded">{selectedTable.reservation.notes}</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={seatReservation}>
                      <CheckCircle2 className="h-4 w-4 mr-1" />Seat Now
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setReservationDialogOpen(true)}>
                      <Edit className="h-4 w-4 mr-1" />Edit
                    </Button>
                    <Button variant="destructive" size="sm" className="col-span-2" onClick={cancelReservation}>Cancel Reservation</Button>
                  </div>
                </>
              )}
              
              <Separator />
              
              {/* Status Change */}
              <div>
                <h3 className="font-medium text-sm mb-2">Change Status</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(statusColors).map(([status, style]) => (
                    <Button
                      key={status}
                      variant="outline"
                      size="sm"
                      className={`${style.bg} ${style.text}`}
                      disabled={selectedTable.status === status || saving}
                      onClick={() => updateTable(selectedTable.id, { status: status as TableStatus })}
                    >
                      {style.label}
                    </Button>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              {/* Server Assignment */}
              <div>
                <h3 className="font-medium text-sm mb-2">Assign Server</h3>
                <Select value={selectedTable.serverId || ''} onValueChange={assignServer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select server" />
                  </SelectTrigger>
                  <SelectContent>
                    {servers.map(server => (
                      <SelectItem key={server.id} value={server.id}>
                        {server.name} ({server.tables.length} tables)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </ScrollArea>
        </div>
      )}
      
      {/* Section Dialog */}
      <Dialog open={sectionDialogOpen} onOpenChange={setSectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSection?.id ? 'Edit' : 'Add'} Section</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Section Name</Label>
              <Input
                value={editingSection?.name || ''}
                onChange={(e) => setEditingSection(prev => prev ? { ...prev, name: e.target.value } : null)}
                placeholder="e.g., Main Dining"
              />
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex gap-2 mt-2">
                {colorOptions.map(color => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 ${editingSection?.color === color ? 'border-black' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setEditingSection(prev => prev ? { ...prev, color } : null)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSectionDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={saveSection} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Table Edit Dialog */}
      <Dialog open={tableDialogOpen} onOpenChange={setTableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Table</DialogTitle>
          </DialogHeader>
          {editingTable && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Table Number</Label>
                  <Input value={editingTable.number} onChange={(e) => setEditingTable({ ...editingTable, number: e.target.value })} />
                </div>
                <div>
                  <Label>Seats</Label>
                  <Input type="number" value={editingTable.seats} onChange={(e) => setEditingTable({ ...editingTable, seats: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Width</Label>
                  <Input type="number" value={editingTable.width} onChange={(e) => setEditingTable({ ...editingTable, width: parseInt(e.target.value) || 50 })} />
                </div>
                <div>
                  <Label>Height</Label>
                  <Input type="number" value={editingTable.height} onChange={(e) => setEditingTable({ ...editingTable, height: parseInt(e.target.value) || 50 })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Shape</Label>
                  <Select value={editingTable.shape} onValueChange={(v) => setEditingTable({ ...editingTable, shape: v as TableShape })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="circle">Circle</SelectItem>
                      <SelectItem value="square">Square</SelectItem>
                      <SelectItem value="rectangle">Rectangle</SelectItem>
                      <SelectItem value="booth">Booth</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Rotation</Label>
                  <Input type="number" value={editingTable.rotation} onChange={(e) => setEditingTable({ ...editingTable, rotation: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="destructive" onClick={() => editingTable && deleteTable(editingTable.id)} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Trash2 className="h-4 w-4 mr-2" />Delete
            </Button>
            <Button variant="outline" onClick={() => setTableDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={saveTable} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Reservation Dialog */}
      <Dialog open={reservationDialogOpen} onOpenChange={setReservationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTable?.reservation ? 'Edit' : 'Create'} Reservation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Customer Name</Label>
              <Input value={newReservation.customerName} onChange={(e) => setNewReservation({ ...newReservation, customerName: e.target.value })} placeholder="John Doe" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={newReservation.phone} onChange={(e) => setNewReservation({ ...newReservation, phone: e.target.value })} placeholder="+27 82 123 4567" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Time</Label>
                <Input type="time" value={newReservation.time} onChange={(e) => setNewReservation({ ...newReservation, time: e.target.value })} />
              </div>
              <div>
                <Label>Guests</Label>
                <Input type="number" value={newReservation.guests} onChange={(e) => setNewReservation({ ...newReservation, guests: parseInt(e.target.value) || 1 })} />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={newReservation.notes} onChange={(e) => setNewReservation({ ...newReservation, notes: e.target.value })} placeholder="Special requests..." />
            </div>
          </div>
          <DialogFooter>
            {selectedTable?.reservation && (
              <Button variant="destructive" onClick={cancelReservation} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Cancel Reservation
              </Button>
            )}
            <Button variant="outline" onClick={() => setReservationDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={createReservation} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Reservation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Order Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order for Table {selectedTable?.number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Number of Guests</Label>
              <Input type="number" value={newOrder.guests} onChange={(e) => setNewOrder({ guests: parseInt(e.target.value) || 1 })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOrderDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={createOrder} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Start Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Server Dialog */}
      <Dialog open={serverDialogOpen} onOpenChange={setServerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Servers</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Input 
                value={newServer.name} 
                onChange={(e) => setNewServer({ name: e.target.value })} 
                placeholder="Server name" 
                className="flex-1"
              />
              <Button onClick={addServer} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add
              </Button>
            </div>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {servers.map(server => (
                  <div key={server.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span>{server.name}</span>
                    <Badge variant="outline">{server.tables.length} tables</Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setServerDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Template Selector Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layout className="h-5 w-5 text-[#00897B]" />
              Floor Plan Templates
            </DialogTitle>
            <DialogDescription>
              Choose a pre-built layout to quickly set up your restaurant floor plan.
              This will replace your current layout.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[60vh] pr-4">
            <div className="grid grid-cols-2 gap-4 py-4">
              {floorPlanTemplates.map((template) => {
                const IconComponent = getTemplateIcon(template.icon)
                const isSelected = selectedTemplate?.id === template.id
                const totalSeats = template.sections.reduce(
                  (sum, s) => sum + s.tables.reduce((tSum, t) => tSum + t.seats, 0),
                  0
                )
                
                return (
                  <Card 
                    key={template.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      isSelected 
                        ? 'border-2 border-[#00897B] bg-[#E0F2F1]' 
                        : 'border hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: template.sections[0]?.color + '20' || '#00897B20' }}
                        >
                          <IconComponent 
                            className="h-6 w-6" 
                            style={{ color: template.sections[0]?.color || '#00897B' }} 
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-[#1A1A1A]">{template.name}</h3>
                          <p className="text-xs text-[#757575] mt-1">{template.description}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center gap-4 text-xs text-[#757575]">
                        <div className="flex items-center gap-1">
                          <Table2 className="h-3.5 w-3.5" />
                          <span>{template.tableCount} tables</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          <span>{totalSeats} seats</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{template.sections.length} sections</span>
                        </div>
                      </div>
                      
                      {/* Mini preview */}
                      <div className="mt-3 h-20 bg-gray-50 rounded border relative overflow-hidden">
                        {template.sections.slice(0, 2).map((section, sIdx) => (
                          <div 
                            key={sIdx}
                            className="absolute inset-0 opacity-10"
                            style={{ 
                              backgroundColor: section.color,
                              left: sIdx === 1 ? '50%' : 0,
                              right: sIdx === 0 ? '50%' : 0,
                            }}
                          />
                        ))}
                        {template.sections[0]?.tables.slice(0, 6).map((table, tIdx) => (
                          <div
                            key={tIdx}
                            className="absolute bg-gray-400"
                            style={{
                              left: `${(table.x % 100) + 10}%`,
                              top: `${(table.y % 80) + 10}%`,
                              width: table.shape === 'circle' ? '10%' : table.shape === 'rectangle' ? '15%' : '8%',
                              height: table.shape === 'circle' ? '10%' : '8%',
                              borderRadius: table.shape === 'circle' ? '50%' : table.shape === 'booth' ? '4px 4px 1px 1px' : '2px',
                            }}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </ScrollArea>
          
          <DialogFooter className="flex items-center justify-between border-t pt-4">
            <div className="text-sm text-[#757575]">
              {selectedTemplate && (
                <span>Selected: <strong>{selectedTemplate.name}</strong> ({selectedTemplate.tableCount} tables)</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                className="bg-[#00897B] hover:bg-[#00695C]"
                disabled={!selectedTemplate || saving}
                onClick={() => selectedTemplate && applyTemplate(selectedTemplate)}
              >
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Apply Template
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Helper function to get template icon component
function getTemplateIcon(iconName: string): React.ComponentType<{ className?: string; style?: React.CSSProperties }> {
  const icons: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
    Wine,
    UtensilsCrossed,
    CookingPot,
    Coffee,
    Beer,
    Users,
    ChefHat,
    Sun,
    Crown,
    Store,
  }
  return icons[iconName] || Layout
}
