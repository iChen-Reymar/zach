export async function lookupProductByBarcode(barcode, localProducts = []) {
  const code = barcode.trim()
  if (!code) {
    return { barcode: code, source: 'none', name: null, product: null }
  }

  const localMatch = localProducts.find((p) => p.barcode === code)
  if (localMatch) {
    return {
      barcode: code,
      source: 'local',
      name: localMatch.name,
      product: localMatch
    }
  }

  if (navigator.onLine) {
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(code)}.json`
      )
      if (response.ok) {
        const data = await response.json()
        const name = data?.product?.product_name?.trim()
        if (data?.status === 1 && name) {
          return { barcode: code, source: 'online', name, product: null }
        }
      }
    } catch (err) {
      console.warn('Barcode online lookup failed:', err)
    }
  }

  return { barcode: code, source: 'none', name: null, product: null }
}
