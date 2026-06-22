import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Layout from './Layout'
import AddProductModal from './AddProductModal'
import SaleModal from './SaleModal'
import ProductDetailModal from './ProductDetailModal'
import { useAuth } from '../contexts/AuthContext'
import { productService } from '../services/productService'
import { categoryService } from '../services/categoryService'

function Products() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const categoryFilter = searchParams.get('category')
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [editingProduct, setEditingProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const { user, isAdmin, isStaff } = useAuth()

  // Fetch products and categories from database
  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  useEffect(() => {
    if (searchParams.get('sale') === '1' && (isAdmin() || isStaff())) {
      setIsSaleModalOpen(true)
    }
  }, [searchParams])

  // Filter products when category filter or search query changes
  useEffect(() => {
    let filtered = [...products]

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(
        p => p.category_name === categoryFilter || p.category === categoryFilter
      )
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(product => {
        const name = (product.name || '').toLowerCase()
        const category = (product.category_name || product.category || '').toLowerCase()
        const status = (product.status || '').toLowerCase()
        
        return name.includes(query) || 
               category.includes(query) || 
               status.includes(query) ||
               (product.stock && product.stock.toString().includes(query))
      })
    }

    setFilteredProducts(filtered)
  }, [categoryFilter, products, searchQuery])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const { data, error } = await productService.getAllProducts()
      if (error) throw error
      setProducts(data || [])
      setFilteredProducts(data || [])
    } catch (err) {
      console.error('Error fetching products:', err)
      setProducts([])
      setFilteredProducts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const { data, error } = await categoryService.getAllCategories()
      if (error) throw error
      setCategories(data || [])
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }

  const renderProductImage = (product, className = 'w-full h-full object-cover') => {
    if (!product.image) {
      return (
        <div className={`flex items-center justify-center bg-gray-200 text-gray-500 font-semibold ${className}`}>
          {product.name.charAt(0).toUpperCase()}
        </div>
      )
    }

    return (
      <img
        src={product.image}
        alt={product.name}
        className={className}
        onError={(e) => {
          e.target.style.display = 'none'
          e.target.nextElementSibling?.classList.remove('hidden')
        }}
      />
    )
  }

  const renderProductCardImage = (product) => {
    const imageClass = 'max-h-full max-w-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.15)]'

    if (!product.image) {
      return (
        <div className="flex h-28 w-full items-center justify-center text-3xl font-bold text-gray-400 sm:h-32">
          {product.name.charAt(0).toUpperCase()}
        </div>
      )
    }

    return (
      <div className="relative flex h-28 w-full items-center justify-center sm:h-32">
        {renderProductImage(product, imageClass)}
        {renderProductImageFallback(product)}
      </div>
    )
  }

  const renderProductImageFallback = (product) => (
    <div className="absolute inset-0 hidden bg-gray-200 text-gray-500 font-semibold">
      <div className="flex h-full items-center justify-center">
        {product.name.charAt(0).toUpperCase()}
      </div>
    </div>
  )

  const handleAddProduct = async (newProduct) => {
    try {
      // Find category by name
      const category = categories.find(cat => cat.name === newProduct.category)
      
      const productPayload = {
        name: newProduct.name,
        stock: newProduct.stock,
        sizes: newProduct.sizes,
        price: newProduct.price || 0,
        category_id: category?.id,
        category_name: newProduct.category,
        image: newProduct.image || null,
        barcode: newProduct.barcode || null
      }

      if (isAdmin()) {
        productPayload.cost = newProduct.cost || 0
      }

      const { data, error } = await productService.createProduct(productPayload)
      
      if (error) throw error
      await fetchProducts()
    } catch (err) {
      console.error('Error adding product:', err)
      alert('Failed to add product. Please try again.')
    }
  }

  const handleEditProduct = (product) => {
    setEditingProduct(product)
    setIsModalOpen(true)
  }

  const handleUpdateProduct = async (updatedProduct, productId) => {
    try {
      const id = productId || editingProduct?.id
      if (!id) return

      const category = categories.find(cat => cat.name === updatedProduct.category)
      
      const updatePayload = {
        name: updatedProduct.name,
        stock: updatedProduct.stock,
        sizes: updatedProduct.sizes,
        price: updatedProduct.price || 0,
        category_id: category?.id,
        category_name: updatedProduct.category,
        image: updatedProduct.image || null,
        barcode: updatedProduct.barcode || null
      }

      if (isAdmin()) {
        updatePayload.cost = updatedProduct.cost || 0
      }

      const { error } = await productService.updateProduct(id, updatePayload)
      
      if (error) throw error
      setEditingProduct(null)
      await fetchProducts()
    } catch (err) {
      console.error('Error updating product:', err)
      alert('Failed to update product. Please try again.')
    }
  }

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    
    try {
      const { error } = await productService.deleteProduct(productId)
      if (error) throw error
      await fetchProducts()
    } catch (err) {
      console.error('Error deleting product:', err)
      alert('Failed to delete product. Please try again.')
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingProduct(null)
  }

  const handleProductSubmit = (productData) => {
    const updateId = editingProduct?.id || productData.existingProductId
    if (updateId) {
      handleUpdateProduct(productData, updateId)
    } else {
      handleAddProduct(productData)
    }
    handleModalClose()
  }

  const handleProductClick = (product) => {
    setSelectedProduct(product)
  }

  const handleDetailClose = () => {
    setSelectedProduct(null)
  }

  const renderProductCard = (product) => (
    <div
      key={product.id}
      className="flex flex-col rounded-2xl bg-[#f3f3f3] p-3 sm:p-4 cursor-pointer transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
      onClick={() => handleProductClick(product)}
    >
      <div className="mb-3 flex items-center justify-center">
        {renderProductCardImage(product)}
      </div>

      <div className="mt-auto flex items-end justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-gray-900 sm:text-base">{product.name}</h3>
          <p className="mt-0.5 text-sm text-gray-900 sm:text-base">
            ₱{parseFloat(product.price || 0).toFixed(2)}
          </p>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            handleProductClick(product)
          }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-gray-900 shadow-sm transition-colors hover:bg-gray-50"
          aria-label={`View ${product.name}`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {(isAdmin() || isStaff()) && (
        <div className="mt-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleEditProduct(product)}
            className="flex-1 rounded-lg bg-blue-500 px-3 py-2 text-xs font-medium text-white hover:bg-blue-600 sm:text-sm"
          >
            Edit
          </button>
          {isAdmin() && (
            <button
              onClick={() => handleDeleteProduct(product.id)}
              className="flex-1 rounded-lg bg-red-500 px-3 py-2 text-xs font-medium text-white hover:bg-red-600 sm:text-sm"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  )

  const renderProductGrid = () => {
    if (loading) {
      return <div className="col-span-full py-12 text-center text-gray-400">Loading products...</div>
    }

    if (filteredProducts.length === 0) {
      return (
        <div className="col-span-full py-12 text-center text-gray-400">
          {searchQuery
            ? `No products found matching "${searchQuery}"`
            : categoryFilter
              ? `No products found in ${categoryFilter} category`
              : 'No products found'}
        </div>
      )
    }

    return filteredProducts.map(renderProductCard)
  }

  return (
    <Layout pageTitle="product">
      <AddProductModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onAddProduct={handleProductSubmit}
        editingProduct={editingProduct}
        categories={categories}
        products={products}
        isAdmin={isAdmin()}
      />
      <SaleModal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        onSaleComplete={fetchProducts}
      />
      <ProductDetailModal
        isOpen={!!selectedProduct}
        onClose={handleDetailClose}
        product={selectedProduct}
        isAdmin={isAdmin()}
      />
      <div className="ui-page">
        {/* Page Header */}
        <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:gap-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">
                {categoryFilter ? `Products - ${categoryFilter}` : 'Products'}
              </h1>
              {categoryFilter && (
                <button
                  onClick={() => navigate('/products', { replace: true })}
                  className="text-xs sm:text-sm text-primary-blue hover:underline mt-1"
                >
                  ← Show all products
                </button>
              )}
            </div>
            {/* Add Product Button - Mobile */}
            <div className="flex items-center gap-2 sm:hidden">
              {(isAdmin() || isStaff()) && (
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="ui-btn px-3 bg-primary-blue text-white hover:bg-[#357abd] whitespace-nowrap"
                >
                  + Add
                </button>
              )}
              {(isAdmin() || isStaff()) && (
                <button
                  onClick={() => setIsSaleModalOpen(true)}
                  className="ui-btn px-3 bg-green-600 text-white hover:bg-green-700 whitespace-nowrap"
                >
                  Record Sale
                </button>
              )}
            </div>
          </div>
          
          {/* Search and Actions Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Bar */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue w-full text-base"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  title="Clear search"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <svg
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            
            {/* Add Product Button - Desktop */}
            <div className="hidden sm:flex items-center gap-3">
              {(isAdmin() || isStaff()) && (
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="ui-btn bg-primary-blue text-white hover:bg-[#357abd] whitespace-nowrap"
                >
                  + Add product
                </button>
              )}
              
              {(isAdmin() || isStaff()) && (
                <button
                  onClick={() => setIsSaleModalOpen(true)}
                  className="ui-btn bg-green-600 text-white hover:bg-green-700 whitespace-nowrap"
                >
                  Record Sale
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Products - Card Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {renderProductGrid()}
        </div>
      </div>
    </Layout>
  )
}

export default Products

