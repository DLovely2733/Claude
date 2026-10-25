import { create } from 'zustand';

interface ToastState {
  items: { id: number; text: string }[];
  push: (text: string) => void;
}

let n = 0;
export const useToasts = create<ToastState>((set, get) => ({
  items: [],
  push: (text) => {
    const id = ++n;
    set({ items: [...get().items, { id, text }] });
    setTimeout(() => set({ items: get().items.filter((t) => t.id !== id) }), 3200);
  },
}));

export const toast = (text: string) => useToasts.getState().push(text);
