import { useEffect, useState, useCallback } from 'react';
import { eventBus, INTEGRATION_EVENTS } from '../../services/integrationEventBus';
import { useIntegrationStore } from '../../services/integrationStore';

// ============================================================================
// Marketplace Integration Layer
// Links shopping cart to warehouse, orders to fulfillment, inventory awareness
// ============================================================================

interface CartItem {
  sku: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  vendorId: string;
  warehouseAvailable: number;
  estimatedDeliveryDays: number;
}

interface Cart {
  customerId: string;
  items: CartItem[];
  totalPrice: number;
  totalItems: number;
  lastUpdated: Date;
  vendorGroups: Map<string, CartItem[]>;
}

interface CartCheckoutData {
  cartId: string;
  customerId: string;
  items: CartItem[];
  totalPrice: number;
  deliveryAddress: string;
  shippingMethod: string;
  estimatedDeliveryDate: Date;
}

// Hook 1: Real-time warehouse inventory sync with shopping cart
export function useMarketplaceCartInventorySync() {
  const [carts, setCarts] = useState<Map<string, Cart>>(new Map());
  const store = useIntegrationStore();

  useEffect(() => {
    // Listen for stock level changes
    const handleStockUpdated = (data: any) => {
      syncCartInventory(data.sku, data.warehouseQuantity);
    };

    // Listen for low stock warnings
    const handleStockLow = (data: any) => {
      notifyCustomersOfLowStock(data.sku);
    };

    eventBus.on(INTEGRATION_EVENTS.WAREHOUSE_STOCK_UPDATED, handleStockUpdated);
    eventBus.on(INTEGRATION_EVENTS.INVENTORY_STOCK_LOW, handleStockLow);

    return () => {
      eventBus.removeAllListeners(INTEGRATION_EVENTS.WAREHOUSE_STOCK_UPDATED);
      eventBus.removeAllListeners(INTEGRATION_EVENTS.INVENTORY_STOCK_LOW);
    };
  }, []);

  const syncCartInventory = useCallback((sku: string, warehouseQuantity: number) => {
    // Update all carts with new inventory info for this SKU
    setCarts((prev) => {
      const updated = new Map(prev);
      updated.forEach((cart) => {
        const itemIndex = cart.items.findIndex((item) => item.sku === sku);
        if (itemIndex >= 0) {
          cart.items[itemIndex].warehouseAvailable = warehouseQuantity;
          // If item out of stock, flag for customer
          if (warehouseQuantity === 0) {
            eventBus.emit(INTEGRATION_EVENTS.MARKETPLACE_ITEM_OUT_OF_STOCK, {
              sku,
              cartId: `cart-${cart.customerId}`,
              customerId: cart.customerId,
              timestamp: new Date(),
            });
          } else if (warehouseQuantity < 5) {
            // Low stock warning
            eventBus.emit(INTEGRATION_EVENTS.MARKETPLACE_ITEM_LOW_STOCK, {
              sku,
              remainingQuantity: warehouseQuantity,
              cartId: `cart-${cart.customerId}`,
              timestamp: new Date(),
            });
          }
        }
      });
      return updated;
    });
  }, []);

  const notifyCustomersOfLowStock = useCallback((sku: string) => {
    // Find all carts with this item and notify customers
    carts.forEach((cart) => {
      const hasItem = cart.items.some((item) => item.sku === sku);
      if (hasItem) {
        eventBus.emit(INTEGRATION_EVENTS.INVENTORY_STOCK_LOW, {
          customerId: cart.customerId,
          sku,
          message: 'An item in your cart is running low on stock',
          timestamp: new Date(),
        });
      }
    });
  }, [carts]);

  const addItemToCart = useCallback(
    (customerId: string, sku: string, quantity: number, vendorId: string) => {
      const stockLevel = store.stockLevels.get(sku);
      const warehouseAvailable = stockLevel?.warehouseQuantity || 0;

      if (warehouseAvailable < quantity) {
        eventBus.emit(INTEGRATION_EVENTS.MARKETPLACE_INSUFFICIENT_INVENTORY, {
          sku,
          requested: quantity,
          available: warehouseAvailable,
          customerId,
          timestamp: new Date(),
        });
        return false;
      }

      setCarts((prev) => {
        const cartKey = `cart-${customerId}`;
        const existing = prev.get(cartKey);
        const cart: Cart = existing || {
          customerId,
          items: [] as CartItem[],
          totalPrice: 0,
          totalItems: 0,
          lastUpdated: new Date(),
          vendorGroups: new Map(),
        };

        const existingItem = cart.items.find((item) => item.sku === sku);
        if (existingItem) {
          existingItem.quantity += quantity;
        } else {
          const newItem: CartItem = {
            sku,
            productId: sku,
            productName: `Product ${sku}`,
            quantity,
            price: 100, // placeholder
            vendorId,
            warehouseAvailable,
            estimatedDeliveryDays: 3,
          };
          cart.items.push(newItem);
        }

        // Group by vendor
        const vendorGroup = cart.vendorGroups.get(vendorId) || [];
        const item = cart.items.find((i: CartItem) => i.sku === sku)!;
        if (!vendorGroup.find((i: CartItem) => i.sku === sku)) {
          vendorGroup.push(item);
        }
        cart.vendorGroups.set(vendorId, vendorGroup);

        cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        cart.totalPrice = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        cart.lastUpdated = new Date();

        prev.set(cartKey, cart);
        return prev;
      });

      return true;
    },
    [store.stockLevels]
  );

  return {
    carts,
    syncCartInventory,
    addItemToCart,
  };
}

// Hook 2: Multi-vendor cart grouping with priority handling
export function useMarketplaceVendorGrouping() {
  const [vendorGroups, setVendorGroups] = useState<Map<string, CartItem[]>>(new Map());
  const [checkoutSequence, setCheckoutSequence] = useState<string[]>([]);

  const groupCartByVendor = useCallback((cartItems: CartItem[]) => {
    const groups = new Map<string, CartItem[]>();

    cartItems.forEach((item) => {
      const vendorId = item.vendorId;
      if (!groups.has(vendorId)) {
        groups.set(vendorId, []);
      }
      groups.get(vendorId)!.push(item);
    });

    setVendorGroups(groups);

    // Determine checkout sequence (best vendors first)
    const sequence = Array.from(groups.keys()).sort((a, b) => {
      // Higher rated vendors go first
      return b.localeCompare(a);
    });

    setCheckoutSequence(sequence);

    return groups;
  }, []);

  const createMultiVendorOrders = useCallback((cartCheckout: CartCheckoutData) => {
    const orderIds: string[] = [];

    // Create separate order for each vendor
    vendorGroups.forEach((items, vendorId) => {
      const orderId = `ORD-${Date.now()}-${vendorId}`;
      orderIds.push(orderId);

      eventBus.emit(INTEGRATION_EVENTS.MARKETPLACE_ORDER_PLACED, {
        orderId,
        customerId: cartCheckout.customerId,
        vendorId,
        items,
        totalPrice: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        deliveryAddress: cartCheckout.deliveryAddress,
        estimatedDeliveryDate: cartCheckout.estimatedDeliveryDate,
        timestamp: new Date(),
      });
    });

    // Emit consolidated checkout event
    eventBus.emit(INTEGRATION_EVENTS.MARKETPLACE_CHECKOUT_COMPLETED, {
      cartId: cartCheckout.cartId,
      customerId: cartCheckout.customerId,
      orderIds,
      totalPrice: cartCheckout.totalPrice,
      vendorCount: vendorGroups.size,
      timestamp: new Date(),
    });

    return orderIds;
  }, [vendorGroups]);

  return {
    vendorGroups,
    checkoutSequence,
    groupCartByVendor,
    createMultiVendorOrders,
  };
}

// Hook 3: Dynamic pricing based on warehouse availability and demand
export function useMarketplaceDynamicPricing() {
  const [dynamicPrices, setDynamicPrices] = useState<Map<string, number>>(new Map());
  const store = useIntegrationStore();

  useEffect(() => {
    // Listen for stock changes to update pricing
    const handleStockUpdated = (data: any) => {
      calculateDynamicPrice(data.sku, data.warehouseQuantity);
    };

    eventBus.on(INTEGRATION_EVENTS.WAREHOUSE_STOCK_UPDATED, handleStockUpdated);

    return () => {
      eventBus.removeAllListeners(INTEGRATION_EVENTS.WAREHOUSE_STOCK_UPDATED);
    };
  }, []);

  const calculateDynamicPrice = useCallback((sku: string, warehouseQuantity: number) => {
    const stockLevel = store.stockLevels.get(sku);
    const basePrice = 100; // placeholder
    let dynamicPrice = basePrice;

    if (!stockLevel) return;

    // High demand, low stock = higher price
    if (warehouseQuantity < stockLevel.reorderLevel * 0.5) {
      dynamicPrice = basePrice * 1.15; // 15% markup
    } else if (warehouseQuantity < stockLevel.reorderLevel) {
      dynamicPrice = basePrice * 1.08; // 8% markup
    } else if (warehouseQuantity > stockLevel.reorderLevel * 2) {
      dynamicPrice = basePrice * 0.95; // 5% discount
    }

    setDynamicPrices((prev) => new Map(prev).set(sku, dynamicPrice));

    eventBus.emit(INTEGRATION_EVENTS.MARKETPLACE_PRICE_UPDATED, {
      sku,
      basePrice,
      dynamicPrice,
      reason: warehouseQuantity < stockLevel.reorderLevel ? 'high_demand' : 'promotional',
      timestamp: new Date(),
    });
  }, [store.stockLevels]);

  return {
    dynamicPrices,
    calculateDynamicPrice,
  };
}
