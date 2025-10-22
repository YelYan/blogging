import client from "./api.client";
import type { LoginCredentials, RegisterCredentials, User } from "@/types";

interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

export const authApi = {
  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const { data } = await client.post<AuthResponse>(
      "/auth/register",
      credentials
    );
    return data;
  },

  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await client.post<AuthResponse>(
      "/auth/login",
      credentials
    );
    return data;
  },

  getMe: async (): Promise<ApiResponse<User>> => {
    const { data } = await client.get<ApiResponse<User>>("/auth/me");
    return data;
  },

  logout: async (): Promise<ApiResponse> => {
    const { data } = await client.post<ApiResponse>("/auth/logout");
    return data;
  },

  forgotPassword: async (email: string): Promise<ApiResponse> => {
    const { data } = await client.post<ApiResponse>("/auth/forgotpassword", {
      email,
    });
    return data;
  },

  resetPassword: async (
    token: string,
    password: string
  ): Promise<AuthResponse> => {
    const { data } = await client.put<AuthResponse>(
      `/auth/resetpassword/${token}`,
      { password }
    );
    return data;
  },

  verifyResetToken: async (token: string): Promise<ApiResponse> => {
    const { data } = await client.get<ApiResponse>(
      `/auth/resetpassword/${token}`
    );
    return data;
  },

  verifyEmail: async (token: string): Promise<ApiResponse> => {
    const { data } = await client.get<ApiResponse>(
      `/auth/verify-email/${token}`
    );
    return data;
  },

  resendVerificationEmail: async (): Promise<ApiResponse> => {
    const { data } = await client.post<ApiResponse>(
      "/auth/resend-verification"
    );
    return data;
  },
};
