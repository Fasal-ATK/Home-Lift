// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';

import authReducer from '../slices/authSlice';
import categoryReducer from '../slices/categorySlice';
import serviceReducer from '../slices/serviceSlice';
import adminCustomerReducer from '../slices/adminCustomerSlice';  
import userReducer from '../slices/user/userSlice'; 
import providerReducer from '../slices/admin/providerSlice';
import applicationReducer from '../slices/admin/applicationsSlice'

const store = configureStore({
  reducer: {
    auth: authReducer,        
    categories: categoryReducer, 
    services: serviceReducer,   
    adminCustomers: adminCustomerReducer,
    user: userReducer,          
    providers: providerReducer,
    applications: applicationReducer,
  },
});

export default store;
