// Role-Based Access Control configuration

export type UserRole = 'admin' | 'manager' | 'staff' | 'vendor' | 'buyer';

export interface RolePermissions {
  [key: string]: string[];
}

// Define what each role can do
export const ROLE_PERMISSIONS: RolePermissions = {
  admin: [
    // Auth & User Management
    'manage_users',
    'manage_roles',
    'view_audit_logs',
    
    // All modules
    'access_marketplace',
    'access_inventory',
    'access_procurement',
    'access_warehouse',
    'access_logistics',
    'access_hr',
    'access_accounting',
    'access_analytics',
    'access_communication',
    
    // Operations
    'create_product',
    'edit_product',
    'delete_product',
    'manage_orders',
    'manage_quotes',
    'manage_inventory',
    'view_reports',
    'export_data',
    'manage_settings',
  ],
  
  manager: [
    'access_marketplace',
    'access_inventory',
    'access_procurement',
    'access_warehouse',
    'access_logistics',
    'access_communication',
    'access_analytics',
    
    'create_product',
    'edit_product',
    'manage_orders',
    'manage_quotes',
    'manage_inventory',
    'view_reports',
    'export_data',
  ],
  
  staff: [
    'access_marketplace',
    'access_inventory',
    'access_communication',
    
    'view_products',
    'view_orders',
    'create_order',
    'manage_inventory',
  ],
  
  vendor: [
    'access_marketplace',
    'access_communication',
    
    'create_product',
    'edit_product',
    'manage_orders',
    'view_quotes',
    'respond_to_inquiry',
  ],
  
  buyer: [
    'access_marketplace',
    'access_procurement',
    'access_communication',
    
    'view_products',
    'create_inquiry',
    'view_quotes',
    'manage_orders',
    'view_reports',
  ],
};

/**
 * Check if a user role has a specific permission
 */
export function hasPermission(role: UserRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Check if a user can access a specific module
 */
export function canAccessModule(role: UserRole, module: string): boolean {
  const moduleAccess = `access_${module}`;
  return hasPermission(role, moduleAccess);
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): string[] {
  return ROLE_PERMISSIONS[role] || [];
}
