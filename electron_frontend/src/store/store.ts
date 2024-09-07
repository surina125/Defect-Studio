import { configureStore } from '@reduxjs/toolkit';
import levelReducer from './slices/levelSlice';
import themeReducer from './slices/themeSlice';
import userInfoSlice from './slices/userInfoSlice';

const store = configureStore({
  reducer: {
    level: levelReducer,
    theme: themeReducer,
    userInfo: userInfoSlice
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
