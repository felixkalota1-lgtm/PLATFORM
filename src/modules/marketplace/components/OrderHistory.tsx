import { useState } from 'react';
import { Package, Truck, CheckCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  createdAt: number;
  deliveredAt?: number;
  trackingNumber?: string;
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    label: 'Pending',
  },
  confirmed: {
    icon: Package,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    label: 'Confirmed',
  },
  shipped: {
    icon: Truck,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    label: 'Shipped',
  },
  delivered: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    label: 'Delivered',
  },
};

interface OrderHistoryProps {
  orders?: Order[];
}

export default function OrderHistory({ orders = [] }: OrderHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Mock data if no orders provided
  const mockOrders: Order[] = [
    {
      id: '1',
      orderId: 'ORD-2024-001',
      items: [
        { productId: '1', productName: 'Professional Desk Lamp', quantity: 1, price: 89.99 },
        { productId: '2', productName: 'USB Cable', quantity: 2, price: 9.99 },
      ],
      totalAmount: 109.97,
      status: 'delivered',
      createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
      deliveredAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
      trackingNumber: 'TRK-2024-001',
    },
    {
      id: '2',
      orderId: 'ORD-2024-002',
      items: [
        { productId: '3', productName: 'Ergonomic Office Chair', quantity: 1, price: 299.99 },
      ],
      totalAmount: 299.99,
      status: 'shipped',
      createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
      trackingNumber: 'TRK-2024-002',
    },
    {
      id: '3',
      orderId: 'ORD-2024-003',
      items: [
        { productId: '4', productName: 'Wireless Keyboard', quantity: 1, price: 79.99 },
        { productId: '5', productName: 'Mouse Pad', quantity: 1, price: 14.99 },
      ],
      totalAmount: 94.98,
      status: 'confirmed',
      createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    },
  ];

  const displayOrders = orders.length > 0 ? orders : mockOrders;

  if (displayOrders.length === 0) {
    return (
      <div className="text-center py-12">
        <Package size={48} className="mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600 dark:text-gray-400">No orders yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayOrders.map((order) => {
        const config = statusConfig[order.status];
        const StatusIcon = config.icon;
        const isExpanded = expandedId === order.id;

        return (
          <div
            key={order.id}
            className={`border rounded-lg overflow-hidden ${config.bgColor} ${config.borderColor}`}
          >
            {/* Order Header */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : order.id)}
              className="w-full p-4 hover:opacity-75 transition-opacity text-left"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <StatusIcon size={24} className={`${config.color} mt-1 flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {order.orderId}
                      </h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          config.bgColor
                        } ${config.color}`}
                      >
                        {config.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString()} • {order.items.length} item(s)
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    ${order.totalAmount.toFixed(2)}
                  </p>
                  {isExpanded ? (
                    <ChevronUp size={20} className="text-gray-500 ml-auto" />
                  ) : (
                    <ChevronDown size={20} className="text-gray-500 ml-auto" />
                  )}
                </div>
              </div>
            </button>

            {/* Order Details */}
            {isExpanded && (
              <div className="border-t dark:border-current border-opacity-20 p-4 space-y-4">
                {/* Items */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Items
                  </h4>
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-start text-sm"
                      >
                        <div>
                          <p className="text-gray-800 dark:text-gray-200">
                            {item.productName}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400 text-xs">
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t dark:border-current border-opacity-20">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Order Date
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {order.deliveredAt && (
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Delivered Date
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(order.deliveredAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {order.trackingNumber && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Tracking Number
                      </p>
                      <p className="text-sm font-mono font-medium text-gray-900 dark:text-white">
                        {order.trackingNumber}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t dark:border-current border-opacity-20">
                  <button className="flex-1 px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 font-medium">
                    View Details
                  </button>
                  {order.status === 'shipped' && (
                    <button className="flex-1 px-4 py-2 text-sm rounded-lg border border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium">
                      Track Package
                    </button>
                  )}
                  {order.status === 'delivered' && (
                    <button className="flex-1 px-4 py-2 text-sm rounded-lg border border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 font-medium">
                      Leave Review
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
