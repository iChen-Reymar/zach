import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Layout from './Layout'
import AddProductModal from './AddProductModal'
import SaleModal from './SaleModal'
import { useAuth } from '../contexts/AuthContext'
import { productService } from '../services/productService'
import { categoryService } from '../services/categoryService'
import { assetPath } from '../utils/assetPath'

function Products() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const categoryFilter = searchParams.get('category')
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const { user, isAdmin, isStaff } = useAuth()
  
  // Check if user is a customer (not admin or staff)
  const isCustomer = () => {
    return !isAdmin() && !isStaff()
  }

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-primary-blue text-white'
      case 'Low stock':
        return 'bg-black text-white'
      case 'Sold':
        return 'bg-gray-300 text-gray-700'
      default:
        return 'bg-gray-200 text-gray-700'
    }
  }

  const getStatusFromStock = (stock) => {
    if (stock === 0) return 'Sold'
    if (stock <= 2) return 'Low stock'
    return 'Active'
  }

  const handleAddProduct = async (newProduct) => {
    try {
      // Find category by name
      const category = categories.find(cat => cat.name === newProduct.category)
      
      const { data, error } = await productService.createProduct({
        name: newProduct.name,
        stock: newProduct.stock,
        price: newProduct.price || 0,
        category_id: category?.id,
        category_name: newProduct.category,
        image: newProduct.image || null,
        barcode: newProduct.barcode || null
      })
      
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
      
      const { error } = await productService.updateProduct(id, {
        name: updatedProduct.name,
        stock: updatedProduct.stock,
        price: updatedProduct.price || 0,
        category_id: category?.id,
        category_name: updatedProduct.category,
        image: updatedProduct.image || null,
        barcode: updatedProduct.barcode || null
      })
      
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

  return (
    <Layout pageTitle="product">
      <AddProductModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onAddProduct={handleProductSubmit}
        editingProduct={editingProduct}
        categories={categories}
        products={products}
      />
      <SaleModal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        onSaleComplete={fetchProducts}
      />
      <div className="p-3 sm:p-4 md:p-6">
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
                  className="px-3 py-2 bg-primary-blue text-white rounded-lg text-sm font-medium hover:bg-[#357abd] transition-colors whitespace-nowrap"
                >
                  + Add
                </button>
              )}
              {(isAdmin() || isStaff()) && (
                <button
                  onClick={() => setIsSaleModalOpen(true)}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors whitespace-nowrap"
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
                  className="px-4 py-2 bg-primary-blue text-white rounded-lg font-medium hover:bg-[#357abd] transition-colors whitespace-nowrap"
                >
                  + Add product
                </button>
              )}
              
              {(isAdmin() || isStaff()) && (
                <button
                  onClick={() => setIsSaleModalOpen(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors whitespace-nowrap"
                >
                  Record Sale
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Products - Desktop Table View */}
        <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-4 px-6 text-gray-600 font-semibold">Name of product</th>
                  <th className="text-left py-4 px-6 text-gray-600 font-semibold">Status</th>
                  <th className="text-left py-4 px-6 text-gray-600 font-semibold">Price</th>
                  <th className="text-left py-4 px-6 text-gray-600 font-semibold">Stock info</th>
                  <th className="text-left py-4 px-6 text-gray-600 font-semibold">Categories</th>
                  {(isAdmin() || isStaff()) && (
                    <th className="text-left py-4 px-6 text-gray-600 font-semibold">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-400">
                      Loading products...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-400">
                      {searchQuery 
                        ? `No products found matching "${searchQuery}"`
                        : categoryFilter 
                          ? `No products found in ${categoryFilter} category`
                          : 'No products found'
                      }
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                            <img
                              src={product.image || assetPath('images/Fender-P-Bass-electric-guitar.webp')}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = `https://via.placeholder.com/48x48?text=${product.name.charAt(0)}`
                              }}
                            />
                          </div>
                          <span className="font-medium text-gray-900">{product.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(product.status)}`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-900 font-semibold">
                        ₱{parseFloat(product.price || 0).toFixed(2)}
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {product.stock} in Stock
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {product.category_name || product.category}
                      </td>
                      {(isAdmin() || isStaff()) && (
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                              title="Edit"
                            >
                              Edit
                            </button>
                            {isAdmin() && (
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                                title="Delete"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Products - Mobile Card View */}
        <div className="md:hidden space-y-3">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading products...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              {searchQuery 
                ? `No products found matching "${searchQuery}"`
                : categoryFilter 
                  ? `No products found in ${categoryFilter} category`
                  : 'No products found'
              }
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div key={product.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                {/* Product Image and Header */}
                <div className="relative">
                  <div className="w-full h-48 bg-gray-200 overflow-hidden">
                    <img
                      src={product.image || assetPath('images/Fender-P-Bass-electric-guitar.webp')}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = `https://via.placeholder.com/400x300?text=${product.name.charAt(0)}`
                      }}
                    />
                  </div>
                  <div className="absolute top-2 right-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(product.status)}`}>
                      {product.status}
                    </span>
                  </div>
                </div>
                
                {/* Product Info */}
                <div className="p-4 space-y-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 leading-tight break-words">{product.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{product.category_name || product.category}</p>
                  </div>
                  
                  {/* Price and Stock */}
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Price</p>
                      <p className="text-xl font-bold text-gray-900">₱{parseFloat(product.price || 0).toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1">Stock</p>
                      <p className="text-xl font-bold text-gray-900">{product.stock}</p>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  {(isAdmin() || isStaff()) && (
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="flex-1 px-4 py-2.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors min-h-[44px]"
                      >
                        Edit
                      </button>
                      {isAdmin() && (
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="flex-1 px-4 py-2.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 active:bg-red-700 transition-colors min-h-[44px]"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  )
}

export default Products

