import { ShoppingCart as ShoppingCartIcon, Trash2, ArrowRight } from 'lucide-react'
import { useMarketplaceStore as useStore } from '../store'

export default function ShoppingCart() {
  const { cart, removeFromCart, updateCartQuantity, clearCart, getCartTotal } = useStore()

  if (cart.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
        <ShoppingCartIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Your cart is empty
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Start shopping to add items to your cart
        </p>
      </div>
    )
  }

  const total = getCartTotal()

  return (
    <div className="space-y-6">
      {/* Items */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Shopping Cart ({cart.length} items)
          </h2>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {cart.map((item) => (
            <div key={`${item.productId}-${item.vendorId}`} className="p-6 flex gap-6">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Product ID: {item.productId}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Vendor: {item.vendorId}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Unit Price: ${item.price.toFixed(2)}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                  <button
                    onClick={() =>
                      updateCartQuantity(
                        item.productId,
                        item.vendorId,
                        Math.max(1, item.quantity - 1)
                      )
                    }
                    className="px-3 py-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    −
                  </button>
                  <span className="px-4 py-1 font-semibold text-gray-900 dark:text-white">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      updateCartQuantity(
                        item.productId,
                        item.vendorId,
                        item.quantity + 1
                      )
                    }
                    className="px-3 py-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    +
                  </button>
                </div>

                <div className="text-right w-32">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>

                <button
                  onClick={() => removeFromCart(item.productId, item.vendorId)}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 dark:hover:bg-opacity-20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <button
            onClick={clearCart}
            className="w-full px-4 py-2 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900 dark:hover:bg-opacity-20 transition-colors"
          >
            Clear Cart
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Subtotal</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Shipping</span>
            <span>TBD</span>
          </div>
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Tax</span>
            <span>TBD</span>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-between font-bold text-lg text-gray-900 dark:text-white">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors">
            Proceed to Checkout
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
