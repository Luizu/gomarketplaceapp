import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storedProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (storedProducts) {
        setProducts([...JSON.parse(storedProducts)]);
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(async id => {
    setProducts(prod => {
      const listProductsUpdated = prod.map(item =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item,
      );

      AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(listProductsUpdated),
      );
      return listProductsUpdated;
    });
  }, []);

  const decrement = useCallback(
    async id => {
      const filteredProducts = products.filter(prod => prod.id !== id);

      const cartedProduct = products.find(product => product.id === id);

      if (cartedProduct && cartedProduct.quantity > 1) {
        setProducts(state => {
          const listProductsUpdated = state.map(element =>
            element.id === id
              ? { ...element, quantity: element.quantity - 1 }
              : element,
          );

          AsyncStorage.setItem(
            'GoMarketplace:products',
            JSON.stringify(listProductsUpdated),
          );

          return listProductsUpdated;
        });
      } else {
        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify([...filteredProducts]),
        );
        setProducts(filteredProducts);
      }
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      if (!product) return setProducts([]);

      const productExists = products.find(prod => prod.id === product.id);

      if (productExists) {
        increment(product.id);
        return;
      }

      const newProduct = { ...product, quantity: 1 };

      setProducts(existentProducts => [...existentProducts, newProduct]);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
