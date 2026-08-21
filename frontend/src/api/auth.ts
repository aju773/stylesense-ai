import api from "./axios";

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  style_preferences: Record<string, unknown>;
}

export async function register(email: string, password: string): Promise<User> {
  const { data } = await api.post<User>("/auth/register/", { email, password });
  return data;
}
export async function login(email: string, password: string): Promise<User> {
  const { data } = await api.post<User>("/auth/login/", { email, password });
  return data;
}
export async function logout(): Promise<void> {
  await api.post("/auth/logout/");
}
export async function getMe(): Promise<User> {
  const { data } = await api.get<User>("/auth/me/");
  return data;
}
