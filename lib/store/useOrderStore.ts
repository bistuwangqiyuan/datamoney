import { create } from 'zustand';
import { OrderType, OrderSide } from '@/lib/types/order';

interface OrderDraft {
  type: OrderType;
  side: OrderSide;
  price: string;
  quantity: string;
}

interface OrderState {
  draft: OrderDraft;
  isSubmitting: boolean;
  setDraft: (draft: Partial<OrderDraft>) => void;
  setSubmitting: (submitting: boolean) => void;
  resetDraft: () => void;
}

const DEFAULT_DRAFT: OrderDraft = {
  type: 'LIMIT',
  side: 'BUY',
  price: '',
  quantity: '',
};

export const useOrderStore = create<OrderState>((set) => ({
  draft: DEFAULT_DRAFT,
  isSubmitting: false,
  
  setDraft: (updates) =>
    set((state) => ({
      draft: { ...state.draft, ...updates },
    })),
  
  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  
  resetDraft: () => set({ draft: DEFAULT_DRAFT, isSubmitting: false }),
}));

