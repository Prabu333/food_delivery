import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./UserSlice";
import selectedItemsReducer from "./SeletedItemSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    selectedItems: selectedItemsReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
