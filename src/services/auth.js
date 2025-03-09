import axios from 'axios';

const API_URL = 'http://localhost:9000/';

export const authService = {
  async loginWithGoogle(accessToken) {
    try {
      const response = await axios.post(`${API_URL}google_login`, {
        id_token: accessToken
      });
      if (response.data.token) {
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to authenticate with Google');
    }
  },

  logout() {
    localStorage.removeItem('user');
  },

  getCurrentUser() {
    return JSON.parse(localStorage.getItem('user'));
  },

  getAuthHeader() {
    const user = this.getCurrentUser();
    if (user && user.token) {
      return { Authorization: `Bearer ${user.token}` };
    }
    return {};
  }
};
