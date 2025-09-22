// GoogleLoginButton.jsx
import React from 'react';
import { useDispatch } from 'react-redux';
import { GoogleLogin } from '@react-oauth/google';
import { loginSuccess } from '../../redux/slices/authSlice';
import api from '../../API/apiConfig'; // ✅ correct import
import apiEndpoints from '../../API/apiEndpoints';
import { useNavigate } from 'react-router-dom';

const GoogleLoginButton = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSuccess = async (credentialResponse) => {
    try {
      const id_token = credentialResponse.credential; // ✅ use id_token

      // Send Google ID token to backend
      const { data } = await api.post(apiEndpoints.auth.googleLogin, { id_token });

      // Update Redux
      dispatch(loginSuccess({ user: data.user, access_token: data.access_token }));

      navigate('/dashboard'); // adjust to your app’s route
    } catch (error) {
      console.error('Google login error:', error?.response?.data || error.message);
    }
  };

  const handleError = () => {
    console.error('Google login failed');
  };

  return (
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={handleError}
      text="signin_with"
      theme="outline"
      size="large"
      shape="rectangular"
    />
  );
};

export default GoogleLoginButton;
