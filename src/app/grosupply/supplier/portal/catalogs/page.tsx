'use client';

import { useState, useMemo } from 'react';
import { 
  Plus, Search, MoreHorizontal, Eye, Edit, Trash2, Copy, Share2, 
  Grid, List, Package, Lock, Globe, Users, Clock, ChevronRight,
  CheckCircle, XCircle, ExternalLink, Download, Archive, Tag,
  Image as ImageIcon, FileText, Calendar, DollarSign, Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

// Types
interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  unit: string;
  minOrderQty: number;
  image?: string;
  inStock: boolean;
  description: string;
}

interface Catalog {
  id: string;
  name: string;
  description: string;
  visibility: 'public' | 'private' | 'request_access';
  status: 'draft' | 'published' | 'archived';
  products: CatalogProduct[];
  coverImage?: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  viewCount: number;
  requestCount: number;
  shareLink: string;
  tags: string[];
}

interface CatalogProduct {
  productId: string;
  product: Product;
  featured: boolean;
  sortOrder: number;
  customPrice?: number;
  notes?: string;
}

interface AccessRequest {
  id: string;
  catalogId: string;
  buyerName: string;
  buyerCompany: string;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  message: string;
}

// Mock data
const mockProducts: Product[] = [
  { id: 'p1', name: 'Organic Tomatoes', sku: 'VEG-TOM-001', category: 'Vegetables', price: 4.99, unit: 'kg', minOrderQty: 10, inStock: true, description: 'Fresh organic vine-ripened tomatoes' },
  { id: 'p2', name: 'Fresh Basil Bundle', sku: 'HERB-BAS-001', category: 'Herbs', price: 2.49, unit: 'bundle', minOrderQty: 20, inStock: true, description: 'Aromatic fresh basil bundles' },
  { id: 'p3', name: 'Red Bell Peppers', sku: 'VEG-PEP-001', category: 'Vegetables', price: 5.99, unit: 'kg', minOrderQty: 5, inStock: true, description: 'Premium red bell peppers' },
  { id: 'p4', name: 'Baby Spinach', sku: 'VEG-SPN-001', category: 'Leafy Greens', price: 6.99, unit: 'kg', minOrderQty: 5, inStock: true, description: 'Fresh baby spinach leaves' },
  { id: 'p5', name: 'Organic Carrots', sku: 'VEG-CAR-001', category: 'Vegetables', price: 3.49, unit: 'kg', minOrderQty: 10, inStock: true, description: 'Sweet organic carrots' },
  { id: 'p6', name: 'Fresh Cilantro', sku: 'HERB-CIL-001', category: 'Herbs', price: 1.99, unit: 'bundle', minOrderQty: 30, inStock: false, description: 'Fresh cilantro bundles' },
  { id: 'p7', name: 'Yellow Onions', sku: 'VEG-ONI-001', category: 'Vegetables', price: 2.29, unit: 'kg', minOrderQty: 25, inStock: true, description: 'Premium yellow onions' },
  { id: 'p8', name: 'Mixed Salad Greens', sku: 'VEG-SAL-001', category: 'Leafy Greens', price: 7.99, unit: 'kg', minOrderQty: 3, inStock: true, description: 'Premium mixed salad greens' },
  { id: 'p9', name: 'Russet Potatoes', sku: 'VEG-POT-001', category: 'Vegetables', price: 1.99, unit: 'kg', minOrderQty: 50, inStock: true, description: 'Quality russet potatoes' },
  { id: 'p10', name: 'Fresh Mint', sku: 'HERB-MNT-001', category: 'Herbs', price: 2.29, unit: 'bundle', minOrderQty: 20, inStock: true, description: 'Fresh mint bundles' },
];

const mockCatalogs: Catalog[] = [
  {
    id: 'c1',
    name: 'Summer Produce Collection',
    description: 'Fresh seasonal produce for summer menus. Features the best vegetables and herbs for light, refreshing dishes.',
    visibility: 'public',
    status: 'published',
    products: [
      { productId: 'p1', product: mockProducts[0], featured: true, sortOrder: 1, customPrice: 4.49 },
      { productId: 'p2', product: mockProducts[1], featured: true, sortOrder: 2 },
      { productId: 'p3', product: mockProducts[2], featured: false, sortOrder: 3 },
      { productId: 'p4', product: mockProducts[3], featured: false, sortOrder: 4 },
    ],
    createdAt: new Date('2024-06-15'),
    updatedAt: new Date('2024-06-20'),
    publishedAt: new Date('2024-06-18'),
    viewCount: 234,
    requestCount: 12,
    shareLink: 'https://groway.market/catalogs/summer-produce-2024',
    tags: ['seasonal', 'organic', 'fresh'],
  },
  {
    id: 'c2',
    name: 'Restaurant Essentials',
    description: 'Core ingredients every restaurant needs. High-volume staples at competitive prices.',
    visibility: 'public',
    status: 'published',
    products: [
      { productId: 'p5', product: mockProducts[4], featured: false, sortOrder: 1 },
      { productId: 'p7', product: mockProducts[6], featured: true, sortOrder: 2 },
      { productId: 'p9', product: mockProducts[8], featured: false, sortOrder: 3 },
    ],
    createdAt: new Date('2024-05-01'),
    updatedAt: new Date('2024-06-10'),
    publishedAt: new Date('2024-05-05'),
    viewCount: 567,
    requestCount: 28,
    shareLink: 'https://groway.market/catalogs/restaurant-essentials',
    tags: ['essentials', 'bulk', 'wholesale'],
  },
  {
    id: 'c3',
    name: 'Premium Herb Selection',
    description: 'Curated collection of fresh herbs for gourmet kitchens.',
    visibility: 'request_access',
    status: 'published',
    products: [
      { productId: 'p2', product: mockProducts[1], featured: true, sortOrder: 1 },
      { productId: 'p6', product: mockProducts[5], featured: false, sortOrder: 2 },
      { productId: 'p10', product: mockProducts[9], featured: true, sortOrder: 3 },
    ],
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2024-06-15'),
    publishedAt: new Date('2024-06-05'),
    viewCount: 89,
    requestCount: 5,
    shareLink: 'https://groway.market/catalogs/premium-herbs',
    tags: ['premium', 'herbs', 'gourmet'],
  },
  {
    id: 'c4',
    name: 'Fall Harvest Preview',
    description: 'Upcoming fall produce selection. Work in progress.',
    visibility: 'private',
    status: 'draft',
    products: [
      { productId: 'p5', product: mockProducts[4], featured: false, sortOrder: 1 },
    ],
    createdAt: new Date('2024-06-20'),
    updatedAt: new Date('2024-06-20'),
    viewCount: 0,
    requestCount: 0,
    shareLink: 'https://groway.market/catalogs/fall-harvest-preview',
    tags: ['fall', 'preview'],
  },
];

const mockAccessRequests: AccessRequest[] = [
  { id: 'ar1', catalogId: 'c3', buyerName: 'Sarah Chen', buyerCompany: 'The Green Kitchen', requestedAt: new Date('2024-06-19'), status: 'pending', message: 'We are a farm-to-table restaurant looking for premium herb suppliers.' },
  { id: 'ar2', catalogId: 'c3', buyerName: 'Michael Torres', buyerCompany: 'Casa Moderna', requestedAt: new Date('2024-06-18'), status: 'pending', message: 'Interested in your gourmet herb selection for our new location.' },
  { id: 'ar3', catalogId: 'c3', buyerName: 'Emily Watson', buyerCompany: 'Fresh Bites Catering', requestedAt: new Date('2024-06-17'), status: 'approved', message: 'We need consistent herb supply for our catering operations.' },
];

export default function CatalogsPage() {
  const [catalogs, setCatalogs] = useState<Catalog[]>(mockCatalogs);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all');
  
  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [productsDialogOpen, setProductsDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [accessRequestsDialogOpen, setAccessRequestsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Form state
  const [selectedCatalog, setSelectedCatalog] = useState<Catalog | null>(null);
  const [catalogName, setCatalogName] = useState('');
  const [catalogDescription, setCatalogDescription] = useState('');
  const [catalogVisibility, setCatalogVisibility] = useState<'public' | 'private' | 'request_access'>('public');
  const [catalogTags, setCatalogTags] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  
  // Access requests
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>(mockAccessRequests);

  // Filter catalogs
  const filteredCatalogs = useMemo(() => {
    return catalogs.filter(catalog => {
      const matchesSearch = catalog.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        catalog.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        catalog.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || catalog.status === statusFilter;
      const matchesVisibility = visibilityFilter === 'all' || catalog.visibility === visibilityFilter;
      return matchesSearch && matchesStatus && matchesVisibility;
    });
  }, [catalogs, searchQuery, statusFilter, visibilityFilter]);

  // Stats
  const stats = useMemo(() => ({
    total: catalogs.length,
    published: catalogs.filter(c => c.status === 'published').length,
    draft: catalogs.filter(c => c.status === 'draft').length,
    totalViews: catalogs.reduce((sum, c) => sum + c.viewCount, 0),
    totalProducts: catalogs.reduce((sum, c) => sum + c.products.length, 0),
    pendingRequests: accessRequests.filter(r => r.status === 'pending').length,
  }), [catalogs, accessRequests]);

  const handleCreateCatalog = () => {
    if (!catalogName.trim()) {
      toast.error('Catalog name is required');
      return;
    }
    
    const newCatalog: Catalog = {
      id: `c${Date.now()}`,
      name: catalogName,
      description: catalogDescription,
      visibility: catalogVisibility,
      status: 'draft',
      products: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      viewCount: 0,
      requestCount: 0,
      shareLink: `https://groway.market/catalogs/${catalogName.toLowerCase().replace(/\s+/g, '-')}`,
      tags: catalogTags.split(',').map(t => t.trim()).filter(Boolean),
    };
    
    setCatalogs([...catalogs, newCatalog]);
    setCreateDialogOpen(false);
    resetForm();
    toast.success('Catalog created successfully');
  };

  const handleUpdateCatalog = () => {
    if (!selectedCatalog) return;
    
    setCatalogs(catalogs.map(c => 
      c.id === selectedCatalog.id 
        ? { 
            ...c, 
            name: catalogName, 
            description: catalogDescription, 
            visibility: catalogVisibility,
            tags: catalogTags.split(',').map(t => t.trim()).filter(Boolean),
            updatedAt: new Date() 
          }
        : c
    ));
    setEditDialogOpen(false);
    resetForm();
    toast.success('Catalog updated successfully');
  };

  const handleDeleteCatalog = () => {
    if (!selectedCatalog) return;
    setCatalogs(catalogs.filter(c => c.id !== selectedCatalog.id));
    setDeleteDialogOpen(false);
    setSelectedCatalog(null);
    toast.success('Catalog deleted successfully');
  };

  const handlePublishCatalog = (catalog: Catalog) => {
    setCatalogs(catalogs.map(c => 
      c.id === catalog.id 
        ? { ...c, status: 'published' as const, publishedAt: new Date(), updatedAt: new Date() }
        : c
    ));
    toast.success('Catalog published successfully');
  };

  const handleArchiveCatalog = (catalog: Catalog) => {
    setCatalogs(catalogs.map(c => 
      c.id === catalog.id 
        ? { ...c, status: 'archived' as const, updatedAt: new Date() }
        : c
    ));
    toast.success('Catalog archived');
  };

  const handleDuplicateCatalog = (catalog: Catalog) => {
    const newCatalog: Catalog = {
      ...catalog,
      id: `c${Date.now()}`,
      name: `${catalog.name} (Copy)`,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      viewCount: 0,
      requestCount: 0,
      publishedAt: undefined,
    };
    setCatalogs([...catalogs, newCatalog]);
    toast.success('Catalog duplicated');
  };

  const handleAddProducts = () => {
    if (!selectedCatalog) return;
    
    const newProducts = selectedProducts
      .filter(pid => !selectedCatalog.products.find(p => p.productId === pid))
      .map((productId, index) => ({
        productId,
        product: mockProducts.find(p => p.id === productId)!,
        featured: false,
        sortOrder: selectedCatalog.products.length + index + 1,
      }))
      .filter(p => p.product);
    
    setCatalogs(catalogs.map(c => 
      c.id === selectedCatalog.id 
        ? { ...c, products: [...c.products, ...newProducts], updatedAt: new Date() }
        : c
    ));
    
    setProductsDialogOpen(false);
    setSelectedProducts([]);
    toast.success(`Added ${newProducts.length} products to catalog`);
  };

  const handleRemoveProduct = (catalogId: string, productId: string) => {
    setCatalogs(catalogs.map(c => 
      c.id === catalogId 
        ? { ...c, products: c.products.filter(p => p.productId !== productId), updatedAt: new Date() }
        : c
    ));
    toast.success('Product removed from catalog');
  };

  const handleAccessRequest = (requestId: string, action: 'approve' | 'reject') => {
    setAccessRequests(accessRequests.map(r => 
      r.id === requestId 
        ? { ...r, status: action === 'approve' ? 'approved' : 'rejected' }
        : r
    ));
    toast.success(`Access request ${action}d`);
  };

  const handleCopyShareLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success('Share link copied to clipboard');
  };

  const resetForm = () => {
    setCatalogName('');
    setCatalogDescription('');
    setCatalogVisibility('public');
    setCatalogTags('');
    setSelectedCatalog(null);
    setSelectedProducts([]);
  };

  const openEditDialog = (catalog: Catalog) => {
    setSelectedCatalog(catalog);
    setCatalogName(catalog.name);
    setCatalogDescription(catalog.description);
    setCatalogVisibility(catalog.visibility);
    setCatalogTags(catalog.tags.join(', '));
    setEditDialogOpen(true);
  };

  const openProductsDialog = (catalog: Catalog) => {
    setSelectedCatalog(catalog);
    setProductsDialogOpen(true);
  };

  const openPreviewDialog = (catalog: Catalog) => {
    setSelectedCatalog(catalog);
    setPreviewDialogOpen(true);
  };

  const openShareDialog = (catalog: Catalog) => {
    setSelectedCatalog(catalog);
    setShareDialogOpen(true);
  };

  const openDeleteDialog = (catalog: Catalog) => {
    setSelectedCatalog(catalog);
    setDeleteDialogOpen(true);
  };

  const getVisibilityIcon = (visibility: Catalog['visibility']) => {
    switch (visibility) {
      case 'public': return <Globe className="h-4 w-4" />;
      case 'private': return <Lock className="h-4 w-4" />;
      case 'request_access': return <Users className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: Catalog['status']) => {
    switch (status) {
      case 'published': return <Badge className="bg-green-100 text-green-700 border-green-200">Published</Badge>;
      case 'draft': return <Badge variant="secondary">Draft</Badge>;
      case 'archived': return <Badge variant="outline" className="text-muted-foreground">Archived</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Catalogs</h1>
          <p className="text-muted-foreground">Create and manage product catalogs to share with buyers</p>
        </div>
        <div className="flex gap-2">
          {stats.pendingRequests > 0 && (
            <Button variant="outline" onClick={() => setAccessRequestsDialogOpen(true)}>
              <Users className="h-4 w-4 mr-2" />
              Access Requests
              <Badge variant="destructive" className="ml-2">{stats.pendingRequests}</Badge>
            </Button>
          )}
          <Button onClick={() => { resetForm(); setCreateDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Catalog
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Catalogs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.published}</div>
            <div className="text-sm text-muted-foreground">Published</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-orange-600">{stats.draft}</div>
            <div className="text-sm text-muted-foreground">Drafts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <div className="text-sm text-muted-foreground">Products Listed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.totalViews}</div>
            <div className="text-sm text-muted-foreground">Total Views</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-purple-600">{stats.pendingRequests}</div>
            <div className="text-sm text-muted-foreground">Pending Requests</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search catalogs by name, description, or tags..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Visibility</SelectItem>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="private">Private</SelectItem>
            <SelectItem value="request_access">Request Access</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-1 border rounded-md p-1">
          <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('grid')}>
            <Grid className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('list')}>
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Catalogs Grid/List */}
      {filteredCatalogs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No catalogs found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== 'all' || visibilityFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first catalog to organize and share products with buyers'}
            </p>
            <Button onClick={() => { resetForm(); setCreateDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Catalog
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCatalogs.map(catalog => (
            <Card key={catalog.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getVisibilityIcon(catalog.visibility)}
                      {getStatusBadge(catalog.status)}
                    </div>
                    <CardTitle className="text-lg">{catalog.name}</CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openPreviewDialog(catalog)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditDialog(catalog)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openProductsDialog(catalog)}>
                        <Package className="h-4 w-4 mr-2" />
                        Manage Products
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => openShareDialog(catalog)}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCopyShareLink(catalog.shareLink)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Link
                      </DropdownMenuItem>
                      {catalog.status === 'draft' && (
                        <DropdownMenuItem onClick={() => handlePublishCatalog(catalog)}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Publish
                        </DropdownMenuItem>
                      )}
                      {catalog.status === 'published' && (
                        <DropdownMenuItem onClick={() => handleArchiveCatalog(catalog)}>
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleDuplicateCatalog(catalog)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => openDeleteDialog(catalog)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription className="line-clamp-2">{catalog.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Products Preview */}
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {catalog.products.slice(0, 4).map((p, i) => (
                      <div 
                        key={p.productId}
                        className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium"
                      >
                        {p.product.name.charAt(0)}
                      </div>
                    ))}
                    {catalog.products.length > 4 && (
                      <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                        +{catalog.products.length - 4}
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {catalog.products.length} product{catalog.products.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {catalog.tags.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {catalog.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{catalog.tags.length - 3}
                    </Badge>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {catalog.viewCount}
                  </div>
                  {catalog.visibility === 'request_access' && (
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {catalog.requestCount} requests
                    </div>
                  )}
                  {catalog.publishedAt && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(catalog.publishedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-0 gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openProductsDialog(catalog)}>
                  <Package className="h-4 w-4 mr-1" />
                  Products
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openShareDialog(catalog)}>
                  <Share2 className="h-4 w-4 mr-1" />
                  Share
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCatalogs.map(catalog => (
            <Card key={catalog.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getVisibilityIcon(catalog.visibility)}
                      {getStatusBadge(catalog.status)}
                      <h3 className="font-medium truncate">{catalog.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{catalog.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>{catalog.products.length} products</span>
                      <span>•</span>
                      <span>{catalog.viewCount} views</span>
                      {catalog.publishedAt && (
                        <>
                          <span>•</span>
                          <span>Published {new Date(catalog.publishedAt).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openPreviewDialog(catalog)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(catalog)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openShareDialog(catalog)}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openDeleteDialog(catalog)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Catalog Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Catalog</DialogTitle>
            <DialogDescription>
              Create a catalog to organize and share products with buyers
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Catalog Name *</Label>
              <Input 
                id="name" 
                placeholder="e.g., Summer Produce Collection"
                value={catalogName}
                onChange={(e) => setCatalogName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Describe what this catalog contains..."
                value={catalogDescription}
                onChange={(e) => setCatalogDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select value={catalogVisibility} onValueChange={(v: any) => setCatalogVisibility(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span>Public - Visible to all buyers</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="request_access">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>Request Access - Buyers must request access</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      <span>Private - Only visible to you</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input 
                id="tags" 
                placeholder="e.g., seasonal, organic, fresh"
                value={catalogTags}
                onChange={(e) => setCatalogTags(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateCatalog}>Create Catalog</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Catalog Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Catalog</DialogTitle>
            <DialogDescription>
              Update catalog details and settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Catalog Name *</Label>
              <Input 
                id="edit-name" 
                value={catalogName}
                onChange={(e) => setCatalogName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea 
                id="edit-description" 
                value={catalogDescription}
                onChange={(e) => setCatalogDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select value={catalogVisibility} onValueChange={(v: any) => setCatalogVisibility(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span>Public - Visible to all buyers</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="request_access">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>Request Access - Buyers must request access</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      <span>Private - Only visible to you</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-tags">Tags (comma separated)</Label>
              <Input 
                id="edit-tags" 
                value={catalogTags}
                onChange={(e) => setCatalogTags(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateCatalog}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Products Dialog */}
      <Dialog open={productsDialogOpen} onOpenChange={setProductsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Manage Products - {selectedCatalog?.name}</DialogTitle>
            <DialogDescription>
              Add or remove products from this catalog
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="current" className="py-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="current">Current Products ({selectedCatalog?.products.length || 0})</TabsTrigger>
              <TabsTrigger value="add">Add Products</TabsTrigger>
            </TabsList>
            <TabsContent value="current" className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                {selectedCatalog && selectedCatalog.products.length > 0 ? (
                  <div className="space-y-3">
                    {selectedCatalog.products
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map(cp => (
                        <div 
                          key={cp.productId}
                          className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50"
                        >
                          <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{cp.product.name}</h4>
                              {cp.featured && (
                                <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Featured</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{cp.product.sku}</span>
                              <span>•</span>
                              <span>${(cp.customPrice || cp.product.price).toFixed(2)}/{cp.product.unit}</span>
                              <span>•</span>
                              <span>Min: {cp.product.minOrderQty} {cp.product.unit}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setCatalogs(catalogs.map(c => 
                                  c.id === selectedCatalog.id 
                                    ? { 
                                        ...c, 
                                        products: c.products.map(p => 
                                          p.productId === cp.productId 
                                            ? { ...p, featured: !p.featured }
                                            : p
                                        )
                                      }
                                    : c
                                ));
                              }}
                            >
                              {cp.featured ? 'Unfeature' : 'Feature'}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-destructive"
                              onClick={() => handleRemoveProduct(selectedCatalog.id, cp.productId)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No products in this catalog yet</p>
                    <p className="text-sm">Switch to "Add Products" tab to add products</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
            <TabsContent value="add" className="mt-4">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search products..." 
                    className="pl-9"
                    onChange={(e) => {
                      // Filter products based on search
                    }}
                  />
                </div>
              </div>
              <ScrollArea className="h-[350px] pr-4">
                <div className="space-y-2">
                  {mockProducts
                    .filter(p => !selectedCatalog?.products.find(cp => cp.productId === p.id))
                    .map(product => (
                      <div 
                        key={product.id}
                        className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                        onClick={() => {
                          if (selectedProducts.includes(product.id)) {
                            setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                          } else {
                            setSelectedProducts([...selectedProducts, product.id]);
                          }
                        }}
                      >
                        <Checkbox 
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={() => {}}
                        />
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium">{product.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{product.sku}</span>
                            <span>•</span>
                            <span>${product.price.toFixed(2)}/{product.unit}</span>
                            <span>•</span>
                            <Badge variant="outline" className="text-xs">{product.category}</Badge>
                          </div>
                        </div>
                        <Badge variant={product.inStock ? 'default' : 'secondary'}>
                          {product.inStock ? 'In Stock' : 'Out of Stock'}
                        </Badge>
                      </div>
                    ))}
                </div>
              </ScrollArea>
              {selectedProducts.length > 0 && (
                <div className="flex items-center justify-between pt-4 border-t mt-4">
                  <span className="text-sm text-muted-foreground">
                    {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
                  </span>
                  <Button onClick={handleAddProducts}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Selected
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Preview Catalog Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview: {selectedCatalog?.name}
            </DialogTitle>
            <DialogDescription>
              See how buyers will view this catalog
            </DialogDescription>
          </DialogHeader>
          {selectedCatalog && (
            <div className="py-4">
              {/* Catalog Header */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg p-6 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  {getVisibilityIcon(selectedCatalog.visibility)}
                  {getStatusBadge(selectedCatalog.status)}
                </div>
                <h2 className="text-2xl font-bold mb-2">{selectedCatalog.name}</h2>
                <p className="text-muted-foreground mb-4">{selectedCatalog.description}</p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    {selectedCatalog.products.length} products
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Updated {new Date(selectedCatalog.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Tags */}
              {selectedCatalog.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {selectedCatalog.tags.map(tag => (
                    <Badge key={tag} variant="secondary">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Products Grid */}
              <ScrollArea className="h-[400px]">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pr-4">
                  {selectedCatalog.products.map(cp => (
                    <Card key={cp.productId} className="overflow-hidden">
                      <div className="aspect-square bg-muted flex items-center justify-center relative">
                        <Package className="h-12 w-12 text-muted-foreground" />
                        {cp.featured && (
                          <Badge className="absolute top-2 left-2 bg-yellow-500 text-white">
                            Featured
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <h4 className="font-medium truncate">{cp.product.name}</h4>
                        <p className="text-sm text-muted-foreground">{cp.product.sku}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-bold text-green-600">
                            ${(cp.customPrice || cp.product.price).toFixed(2)}
                            <span className="text-xs font-normal text-muted-foreground">/{cp.product.unit}</span>
                          </span>
                          <Badge variant="outline" className="text-xs">
                            Min: {cp.product.minOrderQty}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Catalog</DialogTitle>
            <DialogDescription>
              Share this catalog with buyers
            </DialogDescription>
          </DialogHeader>
          {selectedCatalog && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Share Link</Label>
                <div className="flex gap-2">
                  <Input value={selectedCatalog.shareLink} readOnly className="flex-1" />
                  <Button variant="outline" onClick={() => handleCopyShareLink(selectedCatalog.shareLink)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <h4 className="font-medium">Share Options</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="justify-start" onClick={() => handleCopyShareLink(selectedCatalog.shareLink)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in Marketplace
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Export Excel
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">QR Code</h4>
                </div>
                <div className="bg-white p-4 rounded-lg border flex items-center justify-center">
                  <div className="h-32 w-32 bg-muted rounded flex items-center justify-center text-muted-foreground">
                    QR Code
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Buyers can scan this QR code to view the catalog
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Access Requests Dialog */}
      <Dialog open={accessRequestsDialogOpen} onOpenChange={setAccessRequestsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Access Requests</DialogTitle>
            <DialogDescription>
              Manage buyer requests to access your private catalogs
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] py-4">
            {accessRequests.filter(r => r.status === 'pending').length > 0 ? (
              <div className="space-y-4 pr-4">
                {accessRequests
                  .filter(r => r.status === 'pending')
                  .map(request => {
                    const catalog = catalogs.find(c => c.id === request.catalogId);
                    return (
                      <Card key={request.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                {request.buyerName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <div>
                                  <h4 className="font-medium">{request.buyerName}</h4>
                                  <p className="text-sm text-muted-foreground">{request.buyerCompany}</p>
                                </div>
                                <Badge variant="outline">
                                  {catalog?.name}
                                </Badge>
                              </div>
                              <p className="text-sm bg-muted p-3 rounded-lg mb-3">
                                "{request.message}"
                              </p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                  Requested {new Date(request.requestedAt).toLocaleDateString()}
                                </span>
                                <div className="flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleAccessRequest(request.id, 'reject')}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                  <Button 
                                    size="sm"
                                    onClick={() => handleAccessRequest(request.id, 'approve')}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No pending access requests</p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Catalog</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedCatalog?.name}"?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. The catalog and all its product listings will be permanently removed.
              Buyers who have bookmarked this catalog will no longer be able to access it.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteCatalog}>Delete Catalog</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
