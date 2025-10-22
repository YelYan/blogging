import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '@/store/store';
import { 
  login, 
  register, 
  logout, 
  loadUser, 
  updateProfile, 
  followUser, 
  unfollowUser, 
  verifyEmail, 
  resendVerificationEmail,
  clearAuth,
  clearError,
  updateUserField,
  incrementFollowing,
  decrementFollowing,
  addBookmark,
  removeBookmark
} from '@/store/slices/authSlice';
import { useEffect } from 'react';
import type { LoginCredentials, RegisterCredentials, User } from '@/types';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (auth.token && !auth.user) {
      dispatch(loadUser());
    }
  }, [auth.token, auth.user, dispatch]);

  return {
    ...auth,
    login: (credentials: LoginCredentials) => dispatch(login(credentials)),
    register: (credentials: RegisterCredentials) => dispatch(register(credentials)),
    logout: () => dispatch(logout()),
    loadUser: () => dispatch(loadUser()),
    updateProfile: (profileData: Partial<User>) => dispatch(updateProfile(profileData)),
    followUser: (userId: string) => dispatch(followUser(userId)),
    unfollowUser: (userId: string) => dispatch(unfollowUser(userId)),
    verifyEmail: (token: string) => dispatch(verifyEmail(token)),
    resendVerificationEmail: () => dispatch(resendVerificationEmail()),
    clearAuth: () => dispatch(clearAuth()),
    clearError: () => dispatch(clearError()),
    updateUserField: (updates: Partial<User>) => dispatch(updateUserField(updates)),
    incrementFollowing: () => dispatch(incrementFollowing()),
    decrementFollowing: () => dispatch(decrementFollowing()),
    addBookmark: (id: string) => dispatch(addBookmark(id)),
    removeBookmark: (id: string) => dispatch(removeBookmark(id)),
  };
};
