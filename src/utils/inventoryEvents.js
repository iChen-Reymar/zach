export const INVENTORY_UPDATED_EVENT = 'inventory-updated'

export function notifyInventoryUpdated() {
  window.dispatchEvent(new CustomEvent(INVENTORY_UPDATED_EVENT))
}
