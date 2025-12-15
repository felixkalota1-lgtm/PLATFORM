/**
 * INVENTORY INTEGRATION MODULE
 * Syncs inventory with warehouse transfers and stock movements
 */

import { useEffect, useState } from 'react';
import { eventBus, INTEGRATION_EVENTS } from '../../services/integrationEventBus';
import { useIntegrationStore } from '../../services/integrationStore';

interface IncomingTransfer {
  transferId: string;
  fromWarehouse: string;
  items: Array<{
    sku: string;
    productName: string;
    quantity: number;
  }>;
  arrivedAt: Date;
  status: 'in_transit' | 'arrived' | 'processed';
}

/**
 * Hook to manage incoming transfers to a branch
 */
export function useBranchIncomingTransfers(branchId: string) {
  const [incomingTransfers, setIncomingTransfers] = useState<IncomingTransfer[]>([]);
  const [pendingItems, setPendingItems] = useState<number>(0);

  useEffect(() => {
    // Listen for transfer completions
    const unsubTransfer = eventBus.on(INTEGRATION_EVENTS.WAREHOUSE_TRANSFER_INITIATED, (data) => {
      // Only add if this transfer is for our branch
      if (data.destination === branchId) {
        const newTransfer: IncomingTransfer = {
          transferId: data.transferId,
          fromWarehouse: data.source,
          items: data.items,
          arrivedAt: new Date(),
          status: 'in_transit',
        };

        setIncomingTransfers((prev) => [newTransfer, ...prev]);
        setPendingItems((prev) => prev + data.items.reduce((sum: number, item: any) => sum + item.quantity, 0));

        console.log(
          `✅ Transfer #${data.transferId} initiated to ${branchId}: ${data.items.length} items`
        );
      }
    });

    // Listen for transfer completions (goods arrived at branch)
    const unsubComplete = eventBus.on(INTEGRATION_EVENTS.WAREHOUSE_TRANSFER_COMPLETED, (data) => {
      setIncomingTransfers((prev) =>
        prev.map((t) =>
          t.transferId === data.transferId ? { ...t, status: 'arrived' } : t
        )
      );

      console.log(`✅ Transfer #${data.transferId} has been delivered to ${branchId}`);
    });

    return () => {
      unsubTransfer();
      unsubComplete();
    };
  }, [branchId]);

  // Process transfer to add items to branch inventory
  const processTransferToInventory = (transferId: string, inventory: any[]) => {
    const transfer = incomingTransfers.find((t) => t.transferId === transferId);
    if (!transfer) return;

    // Merge items into branch inventory
    const updatedInventory = inventory.map((item) => {
      const transferItem = transfer.items.find((ti) => ti.sku === item.sku);
      if (transferItem) {
        return {
          ...item,
          stock: (item.stock || 0) + transferItem.quantity,
          lastRestocked: new Date(),
        };
      }
      return item;
    });

    // Add any new items that weren't in inventory
    transfer.items.forEach((transferItem) => {
      if (!inventory.find((i) => i.sku === transferItem.sku)) {
        updatedInventory.push({
          sku: transferItem.sku,
          name: transferItem.productName,
          stock: transferItem.quantity,
          lastRestocked: new Date(),
        });
      }
    });

    // Mark transfer as processed
    setIncomingTransfers((prev) =>
      prev.map((t) =>
        t.transferId === transferId ? { ...t, status: 'processed' } : t
      )
    );

    setPendingItems((prev) =>
      Math.max(0, prev - transfer.items.reduce((sum, item) => sum + item.quantity, 0))
    );

    return updatedInventory;
  };

  return {
    incomingTransfers,
    pendingItems,
    processTransferToInventory,
    unprocessedTransfers: incomingTransfers.filter((t) => t.status !== 'processed'),
  };
}

/**
 * Hook to monitor low stock and request transfers from warehouse
 */
export function useLowStockAutoRequest(branchId: string) {
  const integrationStore = useIntegrationStore();

  const requestStockReplenishment = (
    productSku: string,
    productName: string,
    currentQuantity: number,
    reorderLevel: number,
    requestedQuantity: number
  ) => {
    // Create low stock alert in integration store
    eventBus.emit(INTEGRATION_EVENTS.INVENTORY_STOCK_LOW, {
      sku: productSku,
      productName,
      quantity: currentQuantity,
      reorderLevel,
      branchId,
      timestamp: new Date(),
    });

    // Create automatic transfer request
    eventBus.emit(INTEGRATION_EVENTS.INVENTORY_TRANSFER_REQUEST, {
      requestId: `req_${Date.now()}`,
      branch: branchId,
      requestedItems: [
        {
          sku: productSku,
          productName,
          quantity: requestedQuantity,
        },
      ],
      timestamp: new Date(),
    });

    // Add to integration store
    integrationStore.createRequest({
      id: `req_${Date.now()}`,
      type: 'inventory_reorder',
      department: branchId,
      items: [
        {
          name: productName,
          quantity: requestedQuantity,
          priority: currentQuantity === 0 ? 'urgent' : 'high',
        },
      ],
      status: 'pending',
      createdAt: new Date(),
      createdBy: branchId,
    });
  };

  return { requestStockReplenishment };
}

/**
 * Hook to sync products between warehouse and inventory
 */
export function useProductSync(tenantId: string) {
  // const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  // When warehouse stock is updated, sync to inventory
  useEffect(() => {
    const unsubStockUpdate = eventBus.on(INTEGRATION_EVENTS.WAREHOUSE_STOCK_UPDATED, (data) => {
      console.log(`📦 Warehouse stock updated: ${data.sku}`, data);

      // This would trigger a Firestore sync in real app
      // For now, update integration store
      useIntegrationStore.getState().updateStockLevel(data.sku, {
        sku: data.sku,
        productName: data.productName,
        warehouseQuantity: data.warehouseQuantity,
        branchQuantities: data.branchQuantities || {},
        reorderLevel: 10,
        lastUpdated: new Date(),
      });
    });

    return () => {
      unsubStockUpdate();
    };
  }, [tenantId]);

  return { syncStatus: 'idle' };
}

export default {
  useBranchIncomingTransfers,
  useLowStockAutoRequest,
  useProductSync,
};
