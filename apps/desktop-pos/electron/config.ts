import type { ShopConfig } from '@algo/types';

/**
 * Get shop configuration with optional overrides
 * @param overrides Optional partial configuration to merge with defaults
 */
export function getShopConfig(overrides?: Partial<ShopConfig>): ShopConfig {
  const defaults: ShopConfig = {
    name: process.env.SHOP_NAME || 'YOUR SHOP NAME',
    addressLine1: process.env.SHOP_ADDRESS_LINE1 || 'Address Line 1',
    addressLine2: process.env.SHOP_ADDRESS_LINE2 || 'City, Postal Code',
    phone1: process.env.SHOP_PHONE1 || '077-1234567',
    phone2: process.env.SHOP_PHONE2 || '032-1234567',
    email: process.env.SHOP_EMAIL || 'info@yourshop.com',
  };

  // Merge with overrides
  return { ...defaults, ...overrides };
}

/**
 * Get default shop configuration (from environment variables)
 */
export function getDefaultShopConfig(): ShopConfig {
  return getShopConfig();
}
