// src/redux/store.js
import { configureStore, combineReducers } from '@reduxjs/toolkit';

import authReducer from '../slices/authSlice';
import categoryReducer from '../slices/categorySlice';
import serviceReducer from '../slices/serviceSlice';
import adminCustomerReducer from '../slices/adminCustomerSlice';  
import userReducer from '../slices/user/userSlice'; 
import providerReducer from '../slices/admin/providerSlice';
import applicationReducer from '../slices/admin/applicationsSlice';
import notificationReducer from '../slices/notificationSlice';

// store.js
const appReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  categories: categoryReducer,
  services: serviceReducer,
  adminCustomers: adminCustomerReducer,
  providers: providerReducer,
  applications: applicationReducer,
  notifications: notificationReducer,

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
        notifications: undefined,
      },
      action
    );
  }
  return appReducer(state, action);
};

const store = configureStore({ reducer: rootReducer });
export default store;
