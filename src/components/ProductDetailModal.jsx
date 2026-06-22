import { sortSizeEntries, formatSizeLabel } from '../utils/shoeSizes'

function ProductDetailModal({ isOpen, onClose, product, isAdmin = false }) {
  if (!isOpen || !product) return null

  const sizeEntries = sortSizeEntries(product.sizes)
  const hasSizes = sizeEntries.length > 0

  return (
    <div className="ui-modal-shell">
      <div className="ui-modal-panel max-w-lg">
        <div className="ui-modal-header">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 pr-4">{product.name}</h2>
          <button onClick={onClose} className="ui-touch text-gray-400 hover:text-gray-600 transition-colors shrink-0 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="ui-modal-body space-y-4">
          {product.image ? (
            <div className="w-full h-36 rounded-md overflow-hidden bg-gray-100">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-full h-24 rounded-md bg-gray-100 flex items-center justify-center text-3xl font-bold text-gray-400">
              {product.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 mb-1">Category</p>
              <p className="font-medium text-gray-900">{product.category_name || product.category || '—'}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Selling Price</p>
              <p className="font-medium text-gray-900">₱{parseFloat(product.price || 0).toFixed(2)}</p>
            </div>
            {isAdmin && (
              <div>
                <p className="text-gray-500 mb-1">Cost Price</p>
                <p className="font-medium text-gray-900">₱{parseFloat(product.cost || 0).toFixed(2)}</p>
              </div>
            )}
            <div>
              <p className="text-gray-500 mb-1">Total Stock</p>
              <p className="font-medium text-gray-900">{product.stock} pairs</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Status</p>
              <p className="font-medium text-gray-900">{product.status}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Available EU Sizes</h3>
            {hasSizes ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {sizeEntries.map(([size, qty]) => (
                  <div
                    key={size}
                    className="flex flex-col items-center rounded-md border border-primary-blue bg-white p-2"
                  >
                    <span className="text-lg font-semibold text-gray-900">{size}</span>
                    <span className="text-xs text-gray-500 mt-0.5">{formatSizeLabel(size)}</span>
                    <span className="text-sm font-semibold text-primary-blue mt-1">{qty} pairs</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4">
                No per-size breakdown. This product has {product.stock} pairs in total stock.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetailModal
