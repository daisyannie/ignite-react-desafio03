import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {  
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      
      let newCart
      const response = await api.get<Stock>(`/stock/${productId}`)
      const { amount: stock } = response.data

      if (stock === 0) {
        toast.error('Quantidade solicitada fora de estoque')
        return
      }

      const cartProduct = cart.filter((cartProduct) => (cartProduct.id === productId))
      if (cartProduct.length) {
        if (cartProduct[0].amount +1 > stock) {
          toast.error('Quantidade solicitada fora de estoque')
          return
        }
        newCart = cart.map((cartProduct) => {
          if (cartProduct.id === productId) return { ...cartProduct, amount: cartProduct.amount + 1 }
          return cartProduct
        })
      } else {
        const response = await api.get<Product>(`/products/${productId}`)
        const product = response.data

        newCart = [...cart, { ...product, amount: 1 }]
      }
      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = cart.filter((product) => (product.id !== productId))
      if (newCart.length === cart.length) throw new Error()
      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) return

      const response = await api.get<Stock>(`/stock/${productId}`)
      const { amount: stock } = response.data

      if (amount > stock) {
        toast.error('Quantidade solicitada fora de estoque')
        return
      }
      const newCart = cart.map((product) => {
        if (product.id === productId) {
          return {
            ...product,
            amount
          }
        } else {
          return product
        }
      })
      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
