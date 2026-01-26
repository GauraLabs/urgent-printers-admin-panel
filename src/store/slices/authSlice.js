/**
 * Auth Redux Slice
 * Manages authentication state and user session
 */

import { createSlice } from '@reduxjs/toolkit';
import { apiSlice } from '../api/apiSlice';

// Only set isLoading to true if there's a token to verify
// Otherwise, we know the user is not authenticated and can skip loading
const hasToken = typeof window !== 'undefined' && localStorage.getItem('access_token');

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: !!hasToken, // Only loading if there's a token to verify
  permissions: [],
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, access_token, refresh_token } = action.payload;
      state.user = user;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.permissions = user?.permissions || [];

      if (access_token) {
        localStorage.setItem('access_token', access_token);
      }
      if (refresh_token) {
        localStorage.setItem('refresh_token', refresh_token);
      }
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.permissions = [];
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle login success
      .addMatcher(
        apiSlice.endpoints.login.matchFulfilled,
        (state, { payload }) => {
          state.user = payload.user;
          state.isAuthenticated = true;
          state.isLoading = false;
          state.permissions = payload.user?.permissions || [];
          localStorage.setItem('access_token', payload.access_token);
          if (payload.refresh_token) {
            localStorage.setItem('refresh_token', payload.refresh_token);
          }
        }
      )
      // Handle getMe success
      .addMatcher(
        apiSlice.endpoints.getMe.matchFulfilled,
        (state, { payload }) => {
          state.user = payload;
          state.isAuthenticated = true;
          state.isLoading = false;
          state.permissions = payload?.permissions || [];
        }
      )
      // Handle getMe failure
      .addMatcher(
        apiSlice.endpoints.getMe.matchRejected,
        (state) => {
          state.user = null;
          state.isAuthenticated = false;
          state.isLoading = false;
          state.permissions = [];
        }
      )
      // Handle logout success
      .addMatcher(
        apiSlice.endpoints.logout.matchFulfilled,
        (state) => {
          state.user = null;
          state.isAuthenticated = false;
          state.isLoading = false;
          state.permissions = [];
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      );
  },
});

export const { setCredentials, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsLoading = (state) => state.auth.isLoading;
export const selectUserPermissions = (state) => state.auth.permissions;
export const selectUserRole = (state) => state.auth.user?.role?.name;
