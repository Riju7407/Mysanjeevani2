/**
 * Cart utility functions for consistent add to cart behavior across the app
 */

export interface CartItem {
  id: string | number;
  name: string;
  price: number;
  displayPrice: number;
  displayMrp?: number;
  currencySymbol?: '₹' | '$';
  currency?: 'INR' | 'USD';
  quantity: number;
  brand: string;
  image?: string;
  vendorId?: string;
  vendorName?: string;
}

export const addToCartUtil = (product: any): CartItem | null => {
  try {
    // Validate product has required fields
    if (!product || !product._id || !product.name || product.price === undefined) {
      console.error('[AddToCart] Invalid product:', product);
      return null;
    }

    const cartItem: CartItem = {
      id: product._id,
      name: product.name || 'Product',
      price: Number(product.price) || 0,
      displayPrice: Number(product.displayPrice ?? product.price) || 0,
      displayMrp: product.displayMrp ?? product.mrp ? Number(product.displayMrp ?? product.mrp) : undefined,
      currencySymbol: product.currencySymbol || '₹',
      currency: product.currency || 'INR',
      quantity: 1,
      brand: product.brand || 'MySanjeevni',
      image: product.image || product.icon || '💊',
      vendorId: product.vendorId,
      vendorName: product.vendorName || 'MySanjeevni',
    };

    // Get existing cart
    const raw = localStorage.getItem('cart') || '[]';
    let cart: any[] = [];
    
    try {
      cart = JSON.parse(raw);
      if (!Array.isArray(cart)) {
        console.warn('[AddToCart] Cart is not an array, resetting');
        cart = [];
      } else {
        // Filter out null/undefined items from cart
        cart = cart.filter((item: any) => item && typeof item === 'object');
      }
    } catch (e) {
      console.error('[AddToCart] Failed to parse cart:', e);
      cart = [];
    }

    // Check if product already exists in cart
    const existingIndex = cart.findIndex((item: any) => item && item.id === product._id);
    
    if (existingIndex >= 0) {
      // Increment quantity
      cart[existingIndex].quantity = (cart[existingIndex].quantity || 1) + 1;
      console.log('[AddToCart] Updated quantity for product:', product._id, 'New quantity:', cart[existingIndex].quantity);
    } else {
      // Add new item
      cart.push(cartItem);
      console.log('[AddToCart] Added new product to cart:', product._id);
    }

    // Save to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Dispatch storage event for other tabs/components
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'cart',
      newValue: JSON.stringify(cart),
      oldValue: raw,
      storageArea: localStorage,
    }));

    console.log('[AddToCart] Success - Cart updated');
    return cartItem;
  } catch (error) {
    console.error('[AddToCart] Unexpected error:', error);
    return null;
  }
};

export const removeFromCartUtil = (productId: string | number): boolean => {
  try {
    const raw = localStorage.getItem('cart') || '[]';
    let cart = JSON.parse(raw);
    
    if (!Array.isArray(cart)) {
      console.warn('[RemoveFromCart] Cart is not an array');
      return false;
    }

    // Filter out null/undefined items
    cart = cart.filter((item: any) => item && typeof item === 'object');
    const initialLength = cart.length;
    cart = cart.filter((item: any) => item && item.id !== productId);

    if (cart.length === initialLength) {
      console.warn('[RemoveFromCart] Product not found:', productId);
      return false;
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'cart',
      newValue: JSON.stringify(cart),
      oldValue: raw,
      storageArea: localStorage,
    }));

    console.log('[RemoveFromCart] Product removed:', productId);
    return true;
  } catch (error) {
    console.error('[RemoveFromCart] Error:', error);
    return false;
  }
};

export const updateCartQuantityUtil = (productId: string | number, quantity: number): boolean => {
  try {
    if (quantity < 0) {
      console.error('[UpdateCart] Invalid quantity:', quantity);
      return false;
    }

    const raw = localStorage.getItem('cart') || '[]';
    let cart = JSON.parse(raw);

    if (!Array.isArray(cart)) {
      console.warn('[UpdateCart] Cart is not an array');
      return false;
    }

    // Filter out null/undefined items
    cart = cart.filter((item: any) => item && typeof item === 'object');
    const item = cart.find((i: any) => i && i.id === productId);
    if (!item) {
      console.warn('[UpdateCart] Product not found:', productId);
      return false;
    }

    if (quantity === 0) {
      cart = cart.filter((i: any) => i && i.id !== productId);
    } else {
      item.quantity = quantity;
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'cart',
      newValue: JSON.stringify(cart),
      oldValue: raw,
      storageArea: localStorage,
    }));

    console.log('[UpdateCart] Updated product:', productId, 'Quantity:', quantity);
    return true;
  } catch (error) {
    console.error('[UpdateCart] Error:', error);
    return false;
  }
};

export const getCartUtil = (): CartItem[] => {
  try {
    const raw = localStorage.getItem('cart') || '[]';
    const cart = JSON.parse(raw);
    if (!Array.isArray(cart)) return [];
    // Filter out null/undefined items
    return cart.filter((item: any) => item && typeof item === 'object');
  } catch (error) {
    console.error('[GetCart] Error:', error);
    return [];
  }
};

export const clearCartUtil = (): boolean => {
  try {
    const old = localStorage.getItem('cart');
    localStorage.setItem('cart', JSON.stringify([]));
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'cart',
      newValue: '[]',
      oldValue: old,
      storageArea: localStorage,
    }));
    console.log('[ClearCart] Cart cleared');
    return true;
  } catch (error) {
    console.error('[ClearCart] Error:', error);
    return false;
  }
};
