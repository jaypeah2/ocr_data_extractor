import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';

const GoogleAuth = ({ onSuccess, onError }) => {

  const IS_LOCALHOST = window.location.hostname.includes("localhost");
  const API_URL = IS_LOCALHOST ? 'http://localhost:9000/' : 'https://api.simplejay.com/';
  
  const handleSuccess = async (credentialResponse) => {
    try {
      const response = await axios.post(`${API_URL}google_login`, {
        id_token: credentialResponse.credential
      });
      localStorage.setItem('DATA_EXTRACTOR_USER_TOKEN', response.data);
      onSuccess?.(response.data);
    } catch (error) {
      onError?.(error);
      throw new Error(error.response?.data?.message || 'Failed to authenticate with Google');
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
