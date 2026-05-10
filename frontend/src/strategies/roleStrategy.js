/**
 * Strategy Pattern: each user role defines its allowed UI capabilities.
 * Replaces the 5 different copies of userIsAuthorized() across pages.
 * Adding a new role requires only adding an entry here — no page changes.
 */
const strategies = {
  admin: {
    canViewStats: true,
    canModifyInventory: true,
    canDeleteInventory: true,
    canManageStockAlerts: true,
    canManageUsers: true,
    canDeleteOrders: true,
    canCreateOrders: true,
  },
  manager: {
    canViewStats: true,
    canModifyInventory: true,
    canDeleteInventory: false,
    canManageStockAlerts: true,
    canManageUsers: false,
    canDeleteOrders: false,
    canCreateOrders: true,
  },
  cashier: {
    canViewStats: false,
    canModifyInventory: false,
    canDeleteInventory: false,
    canManageStockAlerts: false,
    canManageUsers: false,
    canDeleteOrders: false,
    canCreateOrders: true,
  },
};

export function getRoleStrategy(userType) {
  return strategies[userType?.toLowerCase()] || strategies.cashier;
}
