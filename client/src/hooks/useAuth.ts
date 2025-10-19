import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '@/store/store';
import { login, register, logout, loadUser } from '@/store/slices/authSlice';
import { useEffect } from 'react';

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
    login: (credentials: any) => dispatch(login(credentials)),
    register: (credentials: any) => dispatch(register(credentials)),
    logout: () => dispatch(logout()),
  };
};