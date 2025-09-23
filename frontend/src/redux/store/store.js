// src/redux/store.js
import { configureStore, combineReducers } from '@reduxjs/toolkit';

import authReducer from '../slices/authSlice';
import categoryReducer from '../slices/categorySlice';
import serviceReducer from '../slices/serviceSlice';
import adminCustomerReducer from '../slices/adminCustomerSlice';  
import userReducer from '../slices/user/userSlice'; 
import providerReducer from '../slices/admin/providerSlice';
import applicationReducer from '../slices/admin/applicationsSlice';

// store.js
const appReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  categories: categoryReducer,
  services: serviceReducer,
  adminCustomers: adminCustomerReducer,
  providers: providerReducer,
  applications: applicationReducer,
});

const rootReducer = (state, action) => {
  if (action.type === 'LOGOUT_RESET') {
    return appReducer(
      {
        // only reset slices you want cleared
        auth: undefined,
        user: undefined,
        adminCustomers: undefined,
        providers: undefined,
        applications: undefined,
        categories: undefined,
        services: undefined,
      },
      action
    );
  }
  return appReducer(state, action);
};

const store = configureStore({ reducer: rootReducer });
export default store;
