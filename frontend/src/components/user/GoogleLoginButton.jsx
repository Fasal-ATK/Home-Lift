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
      const id_token = credentialResponse.credential; 

      // Send Google ID token to backend
      const { data } = await api.post(apiEndpoints.auth.googleLogin, { id_token });

      // Update Redux
      dispatch(loginSuccess({ user: data.user, access_token: data.access_token }));

      navigate('/dashboard'); // adjust to your app’s route
    } catch {
      // Google login error — user already sees failure from GoogleLogin component
    }
  };

  const handleError = () => {
    // Google login failed — handled by the GoogleLogin component UI
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
