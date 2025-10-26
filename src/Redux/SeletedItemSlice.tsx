import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "./store";

interface CartItem {
  id: string;
  userId: string;
  itemId: string;
  foodName: string;
  foodHotel: string;
  foodPrice: number;
  foodImage: string;
  deliveryTime: number;
  discountPercentage?: number;
  quantity: number;
}

interface SelectedItemsState {
  items: CartItem[];
}

const initialState: SelectedItemsState = {
  items: [],
};

const selectedItemsSlice = createSlice({
  name: "selectedItems",
  initialState,
  reducers: {
    setSelectedItems: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
    },
    clearSelectedItems: (state) => {
      state.items = [];
    },
    updateSelectedQuantity: (
      state,
      action: PayloadAction<{ id: string; quantity: number }>
    ) => {
      const { id, quantity } = action.payload;
      const item = state.items.find((i) => i.id === id);
      if (item) {
        item.quantity = quantity;
      }
    },
    removeSelectedItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((i) => i.id !== action.payload);
    },
  },
});

export const {
  setSelectedItems,
  clearSelectedItems,
  updateSelectedQuantity,
  removeSelectedItem,
} = selectedItemsSlice.actions;

export const selectSelectedItems = (state: RootState) => state.selectedItems.items;

export default selectedItemsSlice.reducer;
