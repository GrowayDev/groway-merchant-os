'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
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
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import {
  ChefHat,
  Plus,
  Edit,
  Trash2,
  Search,
  Download,
  Package,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  ShoppingCart,
  Utensils,
  Coffee,
  Pizza,
  Salad,
  Cake,
  Wine,
  Flame,
  Zap,
  RefreshCw,
  X,
  Save,
  FileText,
  Box,
  Loader2,
} from 'lucide-react'

// Types
type UnitType = 'g' | 'kg' | 'ml' | 'l' | 'pcs' | 'tbsp' | 'tsp' | 'cup' | 'unit'
type RecipeCategory = 'starters' | 'mains' | 'burgers' | 'drinks' | 'desserts' | 'sides' | 'sauces'

interface Ingredient {
  id: string
  name: string
  sku: string
  category: string
  currentStock: number
  unit: string
  costPerUnit: number
  reorderPoint: number
  location?: string | null
}

interface RecipeIngredient {
  id: string
  ingredientId: string
  name: string
  quantity: number
  unit: string
  cost: number
  optional?: boolean
  substitute?: string | null
  ingredient?: Ingredient
}

interface Recipe {
  id: string
  name: string
  category: RecipeCategory
  description: string | null
  sku: string
  ingredients: RecipeIngredient[]
  preparationTime: number
  yield: number
  yieldUnit: string
  sellingPrice: number
  station: string
  active: boolean
  allergens: string | null
  dietary: string | null
  preparationSteps: string | null
  timesSold: number
  deductionsLast30Days: number
}

interface StockDeduction {
  id: string
  quantity: number
  unit: string
  cost: number
  orderId: string
  recipeId: string
  recipe: { name: string }
  ingredientId: string
  ingredient: { name: string }
  createdAt: string
}

const categoryIcons: Record<RecipeCategory, any> = {
  starters: Salad, mains: Utensils, burgers: Pizza, drinks: Coffee, desserts: Cake, sides: Utensils, sauces: ChefHat,
}

const unitOptions: { value: UnitType; label: string }[] = [
  { value: 'g', label: 'Grams (g)' }, { value: 'kg', label: 'Kilograms (kg)' }, { value: 'ml', label: 'Milliliters (ml)' }, { value: 'l', label: 'Liters (l)' },
  { value: 'pcs', label: 'Pieces (pcs)' }, { value: 'tbsp', label: 'Tablespoon' }, { value: 'tsp', label: 'Teaspoon' }, { value: 'cup', label: 'Cup' }, { value: 'unit', label: 'Unit' },
]

const ingredientCategories = ['Proteins', 'Seafood', 'Dairy', 'Vegetables', 'Bakery', 'Dry Goods', 'Oils', 'Sauces', 'Spices', 'Beverages']

export function RecipeEngineView() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [deductions, setDeductions] = useState<StockDeduction[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<RecipeCategory | 'all'>('all')
  const [activeTab, setActiveTab] = useState<'recipes' | 'ingredients' | 'deductions'>('recipes')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Dialogs
  const [recipeDialogOpen, setRecipeDialogOpen] = useState(false)
  const [ingredientDialogOpen, setIngredientDialogOpen] = useState(false)
  const [deductionDialogOpen, setDeductionDialogOpen] = useState(false)
  
  // Form states
  const [editingRecipe, setEditingRecipe] = useState<Partial<Recipe> | null>(null)
  const [editingIngredient, setEditingIngredient] = useState<Partial<Ingredient> | null>(null)
  const [newIngredientItem, setNewIngredientItem] = useState<Partial<RecipeIngredient>>({ quantity: 1, unit: 'g' })
  const [autoDeductEnabled, setAutoDeductEnabled] = useState(true)
  
  // Fetch data on mount
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [recipesRes, ingredientsRes, deductionsRes] = await Promise.all([
        fetch('/merchant-os/api/recipe-engine/recipes'),
        fetch('/merchant-os/api/recipe-engine/ingredients'),
        fetch('/merchant-os/api/recipe-engine/deductions'),
      ])
      
      const recipesData = await recipesRes.json()
      const ingredientsData = await ingredientsRes.json()
      const deductionsData = await deductionsRes.json()
      
      // Handle API error responses
      if (Array.isArray(recipesData)) {
        setRecipes(recipesData.map((r: any) => ({
          id: r.id,
          name: r.name,
          category: r.category,
          description: r.description,
          sku: r.sku,
          preparationTime: r.preparationTime,
          yield: r.yield,
          yieldUnit: r.yieldUnit,
          sellingPrice: r.sellingPrice,
          station: r.station,
          active: r.active,
          allergens: r.allergens,
          dietary: r.dietary,
          preparationSteps: r.preparationSteps,
          timesSold: r.timesSold,
          deductionsLast30Days: r.deductionsLast30Days,
          ingredients: (r.RecipeIngredient || []).map((i: any) => ({
            id: i.id,
            ingredientId: i.ingredientId,
            name: i.Ingredient?.name || 'Unknown',
            quantity: i.quantity,
            unit: i.unit,
            cost: i.cost,
            optional: i.optional,
            substitute: i.substitute,
            ingredient: i.Ingredient,
          })),
        })))
      } else {
        console.error('Recipes API error:', recipesData)
        setRecipes([])
      }
      
      setIngredients(Array.isArray(ingredientsData) ? ingredientsData : [])
      setDeductions(Array.isArray(deductionsData) ? deductionsData.map((d: any) => ({
        id: d.id,
        quantity: d.quantity,
        unit: d.unit,
        cost: d.cost,
        orderId: d.orderId,
        recipeId: d.recipeId,
        recipe: d.Recipe || { name: 'Unknown' },
        ingredientId: d.ingredientId,
        ingredient: d.Ingredient || { name: 'Unknown' },
        createdAt: d.createdAt,
      })) : [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }
  
  // Stats
  const stats = {
    activeRecipes: recipes.filter(r => r.active).length,
    totalIngredients: ingredients.length,
    lowStockIngredients: ingredients.filter(i => i.currentStock <= i.reorderPoint).length,
    lowMarginRecipes: recipes.filter(r => getMargin(r) < 20).length,
    todayDeductions: deductions.filter(d => new Date(d.createdAt).toDateString() === new Date().toDateString()).reduce((sum, d) => sum + d.cost, 0),
    totalDeductions: deductions.length,
  }
  
  function getMargin(recipe: Recipe): number {
    const costPrice = recipe.ingredients.reduce((sum, i) => sum + i.cost, 0)
    return recipe.sellingPrice > 0 ? ((recipe.sellingPrice - costPrice) / recipe.sellingPrice) * 100 : 0
  }
  
  // Filter recipes
  const filteredRecipes = useMemo(() => {
    return recipes.filter(recipe => {
      const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) || recipe.sku.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = activeCategory === 'all' || recipe.category === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [recipes, searchQuery, activeCategory])
  
  // Filter ingredients
  const filteredIngredients = useMemo(() => {
    return ingredients.filter(ing => {
      return ing.name.toLowerCase().includes(searchQuery.toLowerCase()) || ing.sku.toLowerCase().includes(searchQuery.toLowerCase())
    })
  }, [ingredients, searchQuery])
  
  // Recipe CRUD
  const createRecipe = async () => {
    if (!editingRecipe?.name || !editingRecipe.sku) {
      toast.error('Recipe name and SKU are required')
      return
    }
    
    setSaving(true)
    try {
      const res = await fetch('/merchant-os/api/recipe-engine/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingRecipe.name,
          category: editingRecipe.category || 'mains',
          description: editingRecipe.description,
          sku: editingRecipe.sku,
          preparationTime: editingRecipe.preparationTime || 15,
          yield: editingRecipe.yield || 1,
          yieldUnit: editingRecipe.yieldUnit || 'serving',
          sellingPrice: editingRecipe.sellingPrice || 0,
          station: editingRecipe.station || 'grill',
          active: editingRecipe.active ?? true,
          ingredients: editingRecipe.ingredients,
        }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create recipe')
      }
      
      const recipe = await res.json()
      setRecipes(prev => [...prev, recipe])
      setRecipeDialogOpen(false)
      setEditingRecipe(null)
      toast.success('Recipe created')
    } catch (error: any) {
      console.error('Error creating recipe:', error)
      toast.error(error.message || 'Failed to create recipe')
    } finally {
      setSaving(false)
    }
  }
  
  const updateRecipe = async () => {
    if (!editingRecipe?.id) return
    
    setSaving(true)
    try {
      const res = await fetch(`/merchant-os/api/recipe-engine/recipes/${editingRecipe.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingRecipe.name,
          category: editingRecipe.category,
          description: editingRecipe.description,
          preparationTime: editingRecipe.preparationTime,
          yield: editingRecipe.yield,
          yieldUnit: editingRecipe.yieldUnit,
          sellingPrice: editingRecipe.sellingPrice,
          station: editingRecipe.station,
          active: editingRecipe.active,
          ingredients: editingRecipe.ingredients,
        }),
      })
      
      if (!res.ok) throw new Error('Failed to update recipe')
      
      const updatedRecipe = await res.json()
      setRecipes(prev => prev.map(r => r.id === updatedRecipe.id ? updatedRecipe : r))
      setRecipeDialogOpen(false)
      setEditingRecipe(null)
      toast.success('Recipe updated')
    } catch (error) {
      console.error('Error updating recipe:', error)
      toast.error('Failed to update recipe')
    } finally {
      setSaving(false)
    }
  }
  
  const deleteRecipe = async (id: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/merchant-os/api/recipe-engine/recipes/${id}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) throw new Error('Failed to delete recipe')
      
      setRecipes(prev => prev.filter(r => r.id !== id))
      setRecipeDialogOpen(false)
      setEditingRecipe(null)
      toast.success('Recipe deleted')
    } catch (error) {
      console.error('Error deleting recipe:', error)
      toast.error('Failed to delete recipe')
    } finally {
      setSaving(false)
    }
  }
  
  // Ingredient CRUD
  const createIngredient = async () => {
    if (!editingIngredient?.name || !editingIngredient.sku) {
      toast.error('Ingredient name and SKU are required')
      return
    }
    
    setSaving(true)
    try {
      const res = await fetch('/merchant-os/api/recipe-engine/ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingIngredient),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create ingredient')
      }
      
      const ingredient = await res.json()
      setIngredients(prev => [...prev, ingredient])
      setIngredientDialogOpen(false)
      setEditingIngredient(null)
      toast.success('Ingredient created')
    } catch (error: any) {
      console.error('Error creating ingredient:', error)
      toast.error(error.message || 'Failed to create ingredient')
    } finally {
      setSaving(false)
    }
  }
  
  const updateIngredient = async () => {
    if (!editingIngredient?.id) return
    
    setSaving(true)
    try {
      const res = await fetch(`/merchant-os/api/recipe-engine/ingredients/${editingIngredient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingIngredient),
      })
      
      if (!res.ok) throw new Error('Failed to update ingredient')
      
      const updatedIngredient = await res.json()
      setIngredients(prev => prev.map(i => i.id === updatedIngredient.id ? updatedIngredient : i))
      setIngredientDialogOpen(false)
      setEditingIngredient(null)
      toast.success('Ingredient updated')
    } catch (error) {
      console.error('Error updating ingredient:', error)
      toast.error('Failed to update ingredient')
    } finally {
      setSaving(false)
    }
  }
  
  const deleteIngredient = async (id: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/merchant-os/api/recipe-engine/ingredients/${id}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete ingredient')
      }
      
      setIngredients(prev => prev.filter(i => i.id !== id))
      setIngredientDialogOpen(false)
      setEditingIngredient(null)
      toast.success('Ingredient deleted')
    } catch (error: any) {
      console.error('Error deleting ingredient:', error)
      toast.error(error.message || 'Failed to delete ingredient')
    } finally {
      setSaving(false)
    }
  }
  
  // Add ingredient to recipe
  const addIngredientToRecipe = () => {
    if (!newIngredientItem.ingredientId || !newIngredientItem.quantity) {
      toast.error('Select ingredient and quantity')
      return
    }
    
    const ingredient = ingredients.find(i => i.id === newIngredientItem.ingredientId)
    if (!ingredient) return
    
    const recipeIng: RecipeIngredient = {
      id: `temp-${Date.now()}`,
      ingredientId: ingredient.id,
      name: ingredient.name,
      quantity: newIngredientItem.quantity,
      unit: newIngredientItem.unit || ingredient.unit,
      cost: ingredient.costPerUnit * newIngredientItem.quantity,
    }
    
    setEditingRecipe(prev => prev ? { ...prev, ingredients: [...(prev.ingredients || []), recipeIng] } : null)
    setNewIngredientItem({ quantity: 1, unit: 'g' })
    toast.success('Ingredient added')
  }
  
  const removeIngredientFromRecipe = (id: string) => {
    setEditingRecipe(prev => prev ? { ...prev, ingredients: (prev.ingredients || []).filter(i => i.id !== id) } : null)
  }
  
  // Simulate stock deduction
  const simulateDeduction = async (recipe: Recipe, quantity: number = 1) => {
    setSaving(true)
    try {
      const res = await fetch('/merchant-os/api/recipe-engine/deductions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeId: recipe.id,
          quantity,
        }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to deduct stock')
      }
      
      const newDeductions = await res.json()
      
      // Refresh data
      await fetchData()
      
      toast.success(`Deducted ingredients for ${recipe.name}`)
    } catch (error: any) {
      console.error('Error deducting stock:', error)
      toast.error(error.message || 'Failed to deduct stock')
    } finally {
      setSaving(false)
    }
  }
  
  // Get ingredient by ID
  const getIngredient = (id: string) => ingredients.find(i => i.id === id)
  
  // Render stock badge
  const renderStockBadge = (ingredientId: string, requiredQty: number) => {
    const ingredient = getIngredient(ingredientId)
    if (!ingredient) return <Badge className="bg-gray-100 text-gray-500">Unknown</Badge>
    
    const isLow = ingredient.currentStock <= ingredient.reorderPoint
    const isSufficient = ingredient.currentStock >= requiredQty
    
    if (!isSufficient) return <Badge className="bg-red-100 text-red-700"><AlertTriangle className="h-3 w-3 mr-1" />Insufficient</Badge>
    if (isLow) return <Badge className="bg-amber-100 text-amber-700"><AlertTriangle className="h-3 w-3 mr-1" />Low Stock</Badge>
    return <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="h-3 w-3 mr-1" />{ingredient.currentStock} {ingredient.unit}</Badge>
  }
  
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#FAFAFA]">
        <Loader2 className="h-8 w-8 animate-spin text-[#00897B]" />
      </div>
    )
  }
  
  return (
    <div className="h-full flex flex-col bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-[#00897B]" />
              Recipe Engine
            </h1>
            <p className="text-sm text-[#757575]">Manage recipes and automatic stock deduction</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch checked={autoDeductEnabled} onCheckedChange={setAutoDeductEnabled} />
              <span className="text-sm text-[#757575]">Auto-deduct on sale</span>
            </div>
            <Button variant="outline" onClick={() => setDeductionDialogOpen(true)}>
              <FileText className="h-4 w-4 mr-2" />Deduction Log
            </Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => { setEditingRecipe({ ingredients: [], active: true }); setRecipeDialogOpen(true) }}>
              <Plus className="h-4 w-4 mr-2" />New Recipe
            </Button>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-6 gap-3">
          <div className="bg-[#E0F2F1] rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-[#00897B]">{stats.activeRecipes}</p>
            <p className="text-xs text-[#757575]">Active Recipes</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.totalIngredients}</p>
            <p className="text-xs text-[#757575]">Ingredients</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{stats.lowStockIngredients}</p>
            <p className="text-xs text-[#757575]">Low Stock Items</p>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.lowMarginRecipes}</p>
            <p className="text-xs text-[#757575]">Low Margin</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">R{stats.todayDeductions.toFixed(0)}</p>
            <p className="text-xs text-[#757575]">Today's Deductions</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.totalDeductions}</p>
            <p className="text-xs text-[#757575]">Total Operations</p>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Sidebar */}
        <div className="w-56 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-3 border-b border-gray-200">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="w-full">
                <TabsTrigger value="recipes" className="flex-1 text-xs">Recipes</TabsTrigger>
                <TabsTrigger value="ingredients" className="flex-1 text-xs">Items</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
              <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            {activeTab === 'recipes' ? (
              <div className="p-2">
                <button
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${activeCategory === 'all' ? 'bg-[#E0F2F1] text-[#00897B] font-medium' : 'text-[#757575] hover:bg-gray-100'}`}
                  onClick={() => setActiveCategory('all')}
                >
                  <Package className="h-4 w-4" />All Recipes<Badge variant="outline" className="ml-auto">{recipes.length}</Badge>
                </button>
                <Separator className="my-2" />
                {(['starters', 'mains', 'burgers', 'drinks', 'desserts', 'sides', 'sauces'] as RecipeCategory[]).map(category => {
                  const Icon = categoryIcons[category]
                  const count = recipes.filter(r => r.category === category).length
                  return (
                    <button
                      key={category}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${activeCategory === category ? 'bg-[#E0F2F1] text-[#00897B] font-medium' : 'text-[#757575] hover:bg-gray-100'}`}
                      onClick={() => setActiveCategory(category)}
                    >
                      <Icon className="h-4 w-4" /><span className="capitalize">{category}</span><Badge variant="outline" className="ml-auto">{count}</Badge>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="p-2">
                {ingredientCategories.map(category => {
                  const count = ingredients.filter(i => i.category === category).length
                  return (
                    <button
                      key={category}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#757575] hover:bg-gray-100`}
                    >
                      <Box className="h-4 w-4" /><span>{category}</span><Badge variant="outline" className="ml-auto">{count}</Badge>
                    </button>
                  )
                })}
              </div>
            )}
          </ScrollArea>
          
          <div className="p-3 border-t border-gray-200 space-y-2">
            <Button variant="outline" className="w-full justify-start" size="sm">
              <Download className="h-4 w-4 mr-2" />Export
            </Button>
            <Button variant="outline" className="w-full justify-start" size="sm" onClick={() => { setEditingIngredient({}); setIngredientDialogOpen(true) }}>
              <Plus className="h-4 w-4 mr-2" />Add Ingredient
            </Button>
          </div>
        </div>
        
        {/* Content Grid */}
        <ScrollArea className="flex-1 p-4">
          {activeTab === 'recipes' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRecipes.map(recipe => {
                const margin = getMargin(recipe)
                const isLowMargin = margin < 20
                const costPrice = recipe.ingredients.reduce((sum, i) => sum + i.cost, 0)
                
                return (
                  <Card
                    key={recipe.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${!recipe.active ? 'opacity-60' : ''} ${isLowMargin ? 'border-amber-300' : ''}`}
                    onClick={() => { setEditingRecipe({ ...recipe, ingredients: recipe.ingredients }); setRecipeDialogOpen(true) }}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {(() => { const Icon = categoryIcons[recipe.category]; return <Icon className="h-4 w-4 text-[#00897B]" /> })()}
                          <CardTitle className="text-base">{recipe.name}</CardTitle>
                        </div>
                        <div className="flex items-center gap-1">
                          <Switch checked={recipe.active} onCheckedChange={() => {
                            setRecipes(prev => prev.map(r => r.id === recipe.id ? { ...r, active: !r.active } : r))
                            fetch(`/merchant-os/api/recipe-engine/recipes/${recipe.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ active: !recipe.active }),
                            })
                          }} onClick={(e) => e.stopPropagation()} />
                        </div>
                      </div>
                      <CardDescription className="flex items-center gap-2">
                        <span>{recipe.sku}</span><span>·</span><span>{recipe.station}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-[#757575]">Selling Price</p>
                          <p className="text-lg font-bold text-[#00897B]">R{recipe.sellingPrice.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-[#757575]">Cost Price</p>
                          <p className="text-sm font-medium">R{costPrice.toFixed(2)}</p>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-[#757575]">Margin</span>
                          <span className={`text-xs font-medium ${margin < 0 ? 'text-red-600' : margin < 20 ? 'text-amber-600' : 'text-green-600'}`}>
                            {margin.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={Math.max(0, Math.min(100, margin))} className={`h-2 ${margin < 20 ? '[&>div]:bg-amber-500' : '[&>div]:bg-green-500'}`} />
                      </div>
                      
                      <div>
                        <p className="text-xs text-[#757575] mb-1">{recipe.ingredients.length} ingredients</p>
                        <div className="flex flex-wrap gap-1">
                          {recipe.ingredients.slice(0, 3).map(ing => <Badge key={ing.id} variant="outline" className="text-[10px]">{ing.name}</Badge>)}
                          {recipe.ingredients.length > 3 && <Badge variant="outline" className="text-[10px]">+{recipe.ingredients.length - 3}</Badge>}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-xs text-[#757575]"><Clock className="h-3 w-3" />{recipe.preparationTime}m</div>
                          <div className="flex items-center gap-1 text-xs text-[#757575]"><ShoppingCart className="h-3 w-3" />{recipe.timesSold} sold</div>
                        </div>
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); simulateDeduction(recipe) }} disabled={saving}>
                          <Zap className="h-3 w-3 mr-1" />Deduct
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredIngredients.map(ingredient => {
                const isLow = ingredient.currentStock <= ingredient.reorderPoint
                return (
                  <Card key={ingredient.id} className={`cursor-pointer transition-all hover:shadow-md ${isLow ? 'border-amber-300' : ''}`}
                    onClick={() => { setEditingIngredient(ingredient); setIngredientDialogOpen(true) }}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">{ingredient.name}</CardTitle>
                        <Badge className={isLow ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}>
                          {isLow ? 'Low Stock' : 'In Stock'}
                        </Badge>
                      </div>
                      <CardDescription>{ingredient.sku}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-[#757575]">Stock:</span> <span className="font-medium">{ingredient.currentStock} {ingredient.unit}</span></div>
                        <div><span className="text-[#757575]">Cost:</span> <span className="font-medium">R{ingredient.costPerUnit.toFixed(2)}/{ingredient.unit}</span></div>
                        <div><span className="text-[#757575]">Category:</span> <span className="font-medium">{ingredient.category}</span></div>
                        <div><span className="text-[#757575]">Reorder:</span> <span className="font-medium">{ingredient.reorderPoint} {ingredient.unit}</span></div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
          
          {(activeTab === 'recipes' && filteredRecipes.length === 0) && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ChefHat className="h-16 w-16 mb-4" />
              <p className="text-xl">No recipes found</p>
            </div>
          )}
        </ScrollArea>
      </div>
      
      {/* Recipe Dialog */}
      <Dialog open={recipeDialogOpen} onOpenChange={setRecipeDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{editingRecipe?.id ? 'Edit' : 'New'} Recipe</DialogTitle>
          </DialogHeader>
          
          {editingRecipe && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-sm font-medium">Recipe Name</Label><Input value={editingRecipe.name || ''} onChange={(e) => setEditingRecipe({ ...editingRecipe, name: e.target.value })} className="mt-1" /></div>
                <div><Label className="text-sm font-medium">SKU</Label><Input value={editingRecipe.sku || ''} onChange={(e) => setEditingRecipe({ ...editingRecipe, sku: e.target.value })} className="mt-1" /></div>
              </div>
              
              <div><Label className="text-sm font-medium">Description</Label><Textarea value={editingRecipe.description || ''} onChange={(e) => setEditingRecipe({ ...editingRecipe, description: e.target.value })} className="mt-1" rows={2} /></div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Category</Label>
                  <Select value={editingRecipe.category} onValueChange={(v) => setEditingRecipe({ ...editingRecipe, category: v as RecipeCategory })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(['starters', 'mains', 'burgers', 'drinks', 'desserts', 'sides', 'sauces'] as RecipeCategory[]).map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Station</Label>
                  <Select value={editingRecipe.station} onValueChange={(v) => setEditingRecipe({ ...editingRecipe, station: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grill">Grill</SelectItem><SelectItem value="cold">Cold</SelectItem><SelectItem value="fryer">Fryer</SelectItem>
                      <SelectItem value="pizza">Pizza</SelectItem><SelectItem value="bar">Bar</SelectItem><SelectItem value="dessert">Dessert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-sm font-medium">Prep Time (min)</Label><Input type="number" value={editingRecipe.preparationTime || 15} onChange={(e) => setEditingRecipe({ ...editingRecipe, preparationTime: parseInt(e.target.value) })} className="mt-1" /></div>
              </div>
              
              <Separator />
              
              {/* Ingredients */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Ingredients</Label>
                  <div className="flex gap-2">
                    <Select value={newIngredientItem.ingredientId} onValueChange={(v) => setNewIngredientItem({ ...newIngredientItem, ingredientId: v })}>
                      <SelectTrigger className="w-40"><SelectValue placeholder="Select ingredient" /></SelectTrigger>
                      <SelectContent>
                        {ingredients.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input type="number" className="w-20" value={newIngredientItem.quantity || 1} onChange={(e) => setNewIngredientItem({ ...newIngredientItem, quantity: parseFloat(e.target.value) })} />
                    <Select value={newIngredientItem.unit} onValueChange={(v) => setNewIngredientItem({ ...newIngredientItem, unit: v as UnitType })}>
                      <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {unitOptions.map(u => <SelectItem key={u.value} value={u.value}>{u.value}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={addIngredientToRecipe}><Plus className="h-4 w-4" /></Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {(editingRecipe.ingredients || []).map(ing => (
                    <div key={ing.id} className="flex items-center gap-3 p-3 bg-[#FAFAFA] rounded-lg border">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{ing.name}</p>
                        <p className="text-xs text-[#757575]">{ing.quantity} {ing.unit} · R{ing.cost.toFixed(2)}</p>
                      </div>
                      {editingRecipe.id && renderStockBadge(ing.ingredientId, ing.quantity)}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => removeIngredientFromRecipe(ing.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              {/* Pricing */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Selling Price</Label>
                  <div className="relative mt-1"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#757575]">R</span><Input type="number" value={editingRecipe.sellingPrice || 0} onChange={(e) => setEditingRecipe({ ...editingRecipe, sellingPrice: parseFloat(e.target.value) })} className="pl-8" /></div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Cost Price (auto)</Label>
                  <div className="relative mt-1"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#757575]">R</span><Input value={((editingRecipe.ingredients || []).reduce((s, i) => s + i.cost, 0)).toFixed(2)} className="pl-8 bg-gray-50" readOnly /></div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Margin</Label>
                  <div className="relative mt-1">
                    <Input 
                      value={`${(((editingRecipe.sellingPrice || 0) - (editingRecipe.ingredients || []).reduce((s, i) => s + i.cost, 0)) / Math.max(1, editingRecipe.sellingPrice || 1) * 100).toFixed(1)}%`} 
                      className={`bg-gray-50 ${(editingRecipe.ingredients || []).reduce((s, i) => s + i.cost, 0) > (editingRecipe.sellingPrice || 0) ? 'text-red-600' : ''}`}
                      readOnly 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            {editingRecipe?.id && (
              <Button variant="destructive" onClick={() => deleteRecipe(editingRecipe.id!)} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Trash2 className="h-4 w-4 mr-2" />Delete
              </Button>
            )}
            <Button variant="outline" onClick={() => setRecipeDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={editingRecipe?.id ? updateRecipe : createRecipe} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingRecipe?.id ? 'Update' : 'Create'} Recipe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Ingredient Dialog */}
      <Dialog open={ingredientDialogOpen} onOpenChange={setIngredientDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingIngredient?.id ? 'Edit' : 'New'} Ingredient</DialogTitle>
          </DialogHeader>
          
          {editingIngredient && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Name</Label><Input value={editingIngredient.name || ''} onChange={(e) => setEditingIngredient({ ...editingIngredient, name: e.target.value })} className="mt-1" /></div>
                <div><Label>SKU</Label><Input value={editingIngredient.sku || ''} onChange={(e) => setEditingIngredient({ ...editingIngredient, sku: e.target.value })} className="mt-1" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={editingIngredient.category} onValueChange={(v) => setEditingIngredient({ ...editingIngredient, category: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ingredientCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Unit</Label>
                  <Select value={editingIngredient.unit} onValueChange={(v) => setEditingIngredient({ ...editingIngredient, unit: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {unitOptions.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Current Stock</Label><Input type="number" value={editingIngredient.currentStock || 0} onChange={(e) => setEditingIngredient({ ...editingIngredient, currentStock: parseFloat(e.target.value) })} className="mt-1" /></div>
                <div><Label>Reorder Point</Label><Input type="number" value={editingIngredient.reorderPoint || 0} onChange={(e) => setEditingIngredient({ ...editingIngredient, reorderPoint: parseFloat(e.target.value) })} className="mt-1" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Cost per Unit (R)</Label><Input type="number" step="0.01" value={editingIngredient.costPerUnit || 0} onChange={(e) => setEditingIngredient({ ...editingIngredient, costPerUnit: parseFloat(e.target.value) })} className="mt-1" /></div>
                <div><Label>Location</Label><Input value={editingIngredient.location || ''} onChange={(e) => setEditingIngredient({ ...editingIngredient, location: e.target.value })} className="mt-1" /></div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            {editingIngredient?.id && (
              <Button variant="destructive" onClick={() => deleteIngredient(editingIngredient.id!)} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Trash2 className="h-4 w-4 mr-2" />Delete
              </Button>
            )}
            <Button variant="outline" onClick={() => setIngredientDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={editingIngredient?.id ? updateIngredient : createIngredient} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingIngredient?.id ? 'Update' : 'Create'} Ingredient
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Deduction Log Dialog */}
      <Dialog open={deductionDialogOpen} onOpenChange={setDeductionDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Stock Deduction Log</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {deductions.map(deduction => (
                <div key={deduction.id} className="flex items-center justify-between p-3 bg-[#FAFAFA] rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">{deduction.recipe.name}</p>
                    <p className="text-xs text-[#757575]">{deduction.ingredient.name} · {deduction.quantity} {deduction.unit}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm text-red-600">-R{deduction.cost.toFixed(2)}</p>
                    <p className="text-xs text-[#757575]">{new Date(deduction.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
              {deductions.length === 0 && (
                <div className="text-center py-8 text-[#757575]">
                  No deductions recorded
                </div>
              )}
            </div>
          </ScrollArea>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeductionDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
