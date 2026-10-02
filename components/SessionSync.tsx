import { useEffect } from 'react';
import { useAuth } from '@/store/auth';
import { useCart } from '@/store/cart';
import { useShop } from '@/store/shop';

// Keeps per-user cart and wishlist in sync with the signed-in account.
// Renders nothing. Must live inside AuthProvider + ShopProvider + CartProvider.
export function SessionSync() {
  const { user } = useAuth();
  const cart = useCart();
  const { refreshWishlist } = useShop();

  useEffect(() => {
    cart.setOwner(user?.id ?? null);
    void refreshWishlist(user?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return null;
}
