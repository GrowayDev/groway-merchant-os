import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// South African major allergens as per Consumer Protection Act
const SA_ALLERGENS = [
  { id: 'milk', name: 'Milk', icon: '🥛', description: 'Milk and milk products including lactose' },
  { id: 'eggs', name: 'Eggs', icon: '🥚', description: 'Eggs and egg products' },
  { id: 'fish', name: 'Fish', icon: '🐟', description: 'Fish and fish products' },
  { id: 'shellfish', name: 'Shellfish', icon: '🦐', description: 'Crustaceans and molluscs' },
  { id: 'tree_nuts', name: 'Tree Nuts', icon: '🥜', description: 'Almonds, hazelnuts, walnuts, cashews, etc.' },
  { id: 'peanuts', name: 'Peanuts', icon: '🥜', description: 'Peanuts and peanut products' },
  { id: 'wheat', name: 'Wheat/Gluten', icon: '🌾', description: 'Wheat, rye, barley, oats, and gluten' },
  { id: 'soy', name: 'Soy', icon: '🫘', description: 'Soybeans and soy products' },
  { id: 'sesame', name: 'Sesame', icon: '🌱', description: 'Sesame seeds and sesame products' },
  { id: 'sulphites', name: 'Sulphites', icon: '🍷', description: 'Sulphur dioxide and sulphites above 10ppm' },
]

// South African dietary preferences
const SA_DIETARY = [
  { id: 'vegetarian', name: 'Vegetarian', icon: '🥬', description: 'No meat, fish, or poultry' },
  { id: 'vegan', name: 'Vegan', icon: '🌱', description: 'No animal products' },
  { id: 'gluten_free', name: 'Gluten-Free', icon: '🌾', description: 'No gluten-containing ingredients' },
  { id: 'halaal', name: 'Halaal', icon: '☪️', description: 'Prepared according to Islamic law' },
  { id: 'kosher', name: 'Kosher', icon: '✡️', description: 'Prepared according to Jewish dietary laws' },
]

// GET - Fetch allergen data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    // Get all recipes with allergen information
    if (action === 'recipes') {
      const recipes = await db.recipe.findMany({
        where: { active: true },
        select: {
          id: true,
          name: true,
          sku: true,
          category: true,
          allergens: true,
          dietary: true,
          sellingPrice: true,
        },
        orderBy: { name: 'asc' },
      })
      
      return NextResponse.json(recipes.map(r => ({
        ...r,
        allergens: r.allergens ? JSON.parse(r.allergens) : [],
        dietary: r.dietary ? JSON.parse(r.dietary) : [],
      })))
    }
    
    // Get recipes safe for specific allergen profile
    if (action === 'safe') {
      const allergens = searchParams.get('allergens')?.split(',') || []
      
      const recipes = await db.recipe.findMany({
        where: { active: true },
        select: {
          id: true,
          name: true,
          sku: true,
          category: true,
          allergens: true,
          dietary: true,
          sellingPrice: true,
        },
        orderBy: { name: 'asc' },
      })
      
      const safeRecipes = recipes.filter(r => {
        const recipeAllergens = r.allergens ? JSON.parse(r.allergens) : []
        // Return recipes that DON'T contain any of the specified allergens
        return !allergens.some(a => recipeAllergens.includes(a))
      })
      
      return NextResponse.json(safeRecipes.map(r => ({
        ...r,
        allergens: r.allergens ? JSON.parse(r.allergens) : [],
        dietary: r.dietary ? JSON.parse(r.dietary) : [],
      })))
    }
    
    // Get allergen summary statistics
    if (action === 'stats') {
      const recipes = await db.recipe.findMany({
        where: { active: true },
        select: {
          allergens: true,
          dietary: true,
        },
      })
      
      const allergenCounts: Record<string, number> = {}
      const dietaryCounts: Record<string, number> = {}
      
      recipes.forEach(r => {
        const recipeAllergens = r.allergens ? JSON.parse(r.allergens) : []
        const recipeDietary = r.dietary ? JSON.parse(r.dietary) : []
        
        recipeAllergens.forEach((a: string) => {
          allergenCounts[a] = (allergenCounts[a] || 0) + 1
        })
        
        recipeDietary.forEach((d: string) => {
          dietaryCounts[d] = (dietaryCounts[d] || 0) + 1
        })
      })
      
      return NextResponse.json({
        totalRecipes: recipes.length,
        allergenCounts: SA_ALLERGENS.map(a => ({
          ...a,
          count: allergenCounts[a.id] || 0,
        })),
        dietaryCounts: SA_DIETARY.map(d => ({
          ...d,
          count: dietaryCounts[d.id] || 0,
        })),
      })
    }
    
    // Default: return allergen and dietary reference lists
    return NextResponse.json({
      allergens: SA_ALLERGENS,
      dietary: SA_DIETARY,
      compliance: {
        act: 'Consumer Protection Act, 2008 (Act No. 68 of 2008)',
        regulation: 'Regulations Relating to Labelling and Advertising of Foodstuffs (R.146)',
        requirement: 'All major allergens must be declared on food labels and menus',
      },
    })
  } catch (error) {
    console.error('Error fetching allergen data:', error)
    return NextResponse.json({ error: 'Failed to fetch allergen data' }, { status: 500 })
  }
}
