import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from '@/services/auth.api';
import { userApi } from '@/services/user.api';
import type {PayloadAction} from "@reduxjs/toolkit"
import type { AuthState, LoginCredentials, RegisterCredentials, User } from '@/types';

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: false,
  error: null,
};

// Auth Thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await authApi.login(credentials);
      localStorage.setItem('token', response.token);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (credentials: RegisterCredentials, { rejectWithValue }) => {
    try {
      const response = await authApi.register(credentials);
      localStorage.setItem('token', response.token);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Registration failed');
    }
  }
);

export const loadUser = createAsyncThunk(
  'auth/loadUser',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('No token found');
      }
      const response = await authApi.getMe();
      return response.data;
    } catch (error: any) {
      localStorage.removeItem('token');
      return rejectWithValue(error.response?.data?.error || 'Failed to load user');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authApi.logout();
      localStorage.removeItem('token');
      return null;
    } catch (error: any) {
      localStorage.removeItem('token');
      return null;
    }
  }
);

// User Profile Thunks
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData: any, { rejectWithValue }) => {
    try {
      const response = await userApi.updateProfile(profileData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update profile');
    }
  }
);

export const followUser = createAsyncThunk(
  'auth/followUser',
  async (userId: string, { getState, rejectWithValue }) => {
    try {
      const response = await userApi.followUser(userId);
      return { userId, data: response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to follow user');
    }
  }
);

export const unfollowUser = createAsyncThunk(
  'auth/unfollowUser',
  async (userId: string, { getState, rejectWithValue }) => {
    try {
      const response = await userApi.unfollowUser(userId);
      return { userId, data: response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to unfollow user');
    }
  }
);

export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (token: string, { rejectWithValue }) => {
    try {
      const response = await authApi.verifyEmail(token);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Email verification failed');
    }
  }
);

export const resendVerificationEmail = createAsyncThunk(
  'auth/resendVerificationEmail',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authApi.resendVerificationEmail();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to resend verification email');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('token');
    },
    clearError: (state) => {
      state.error = null;
    },
    updateUserField: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    incrementFollowing: (state) => {
      if (state.user) {
        state.user.followingCount += 1;
      }
    },
    decrementFollowing: (state) => {
      if (state.user && state.user.followingCount > 0) {
        state.user.followingCount -= 1;
      }
    },
    addBookmark: (state, action: PayloadAction<string>) => {
      if (state.user) {
        if (!state.user.bookmarks) {
          state.user.bookmarks = [];
        }
        state.user.bookmarks.push(action.payload);
        state.user.bookmarkCount = (state.user.bookmarkCount || 0) + 1;
      }
    },
    removeBookmark: (state, action: PayloadAction<string>) => {
      if (state.user && state.user.bookmarks) {
        state.user.bookmarks = state.user.bookmarks.filter(id => id !== action.payload);
        state.user.bookmarkCount = Math.max(0, (state.user.bookmarkCount || 0) - 1);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
        state.error = action.payload as string;
      })
      
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
        state.error = action.payload as string;
      })
      
      // Load User
      .addCase(loadUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(loadUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
        state.error = action.payload as string;
      })
      
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      
      // Update Profile
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      
      // Follow User
      .addCase(followUser.fulfilled, (state, action) => {
        if (state.user) {
          state.user.followingCount = action.payload.data.followingCount;
          if (state.user.following && typeof action.payload.userId === 'string') {
            state.user.following.push(action.payload.userId);
          }
        }
      })
      
      // Unfollow User
      .addCase(unfollowUser.fulfilled, (state, action) => {
        if (state.user) {
          state.user.followingCount = action.payload.data.followingCount;
          if (state.user.following) {
            state.user.following = state.user.following.filter(
              id => id !== action.payload.userId
            );
          }
        }
      })
      
      // Verify Email
      .addCase(verifyEmail.fulfilled, (state) => {
        if (state.user) {
          state.user.isEmailVerified = true;
        }
      });
  },
});

export const {
  clearAuth,
  clearError,
  updateUserField,
  incrementFollowing,
  decrementFollowing,
  addBookmark,
  removeBookmark,
} = authSlice.actions;

export default authSlice.reducer;