// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';

import authReducer from '../slices/authSlice';
import categoryReducer from '../slices/categorySlice';
import serviceReducer from '../slices/serviceSlice';
import adminCustomerReducer from '../slices/adminCustomerSlice';  

const store = configureStore({
  reducer: {
    auth: authReducer,        
    categories: categoryReducer, 
    services: serviceReducer,   
    adminCustomers: adminCustomerReducer, 
  },
});

export default store;
