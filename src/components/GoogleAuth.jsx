import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { authService } from '../services/auth';

const GoogleAuth = ({ onSuccess, onError }) => {
  const handleSuccess = async (credentialResponse) => {
    try {
      const userData = await authService.loginWithGoogle(credentialResponse.credential);
      onSuccess?.(userData);
    } catch (error) {
      console.error('Google authentication error:', error);
      onError?.(error);
    }
  };

  const handleError = (error) => {
    console.error('Google login failed:', error);
    onError?.(error);
  };

  return (
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={handleError}
      useOneTap
      theme="filled_blue"
      shape="rectangular"
      text="signin_with"
    />
  );
};

export default GoogleAuth;
