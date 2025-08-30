// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';

import authReducer from '../slices/authSlice';
import categoryReducer from '../slices/categorySlice';
import serviceReducer from '../slices/serviceSlice';


const store = configureStore({
  reducer: {
    auth: authReducer,        
    categories: categoryReducer, 
    services: serviceReducer,   
  },
});

export default store;
