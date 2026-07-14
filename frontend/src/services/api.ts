import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to automatically add authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Types
export interface User {
  id: number;
  username: string;
  email: string;
}

export interface AuthResponse {
  message: string;
  token?: string;
  user?: User;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string;
}

export interface TaskFilters {
  status?: string;
  priority?: string;
  search?: string;
}

// API methods
export const authAPI = {
  register: async (username: string, email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', { username, email, password });
    return response.data;
  },
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    return response.data;
  },
  getProfile: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },
};

export const taskAPI = {
  getTasks: async (filters: TaskFilters = {}): Promise<Task[]> => {
    const response = await api.get<Task[]>('/tasks', { params: filters });
    return response.data;
  },
  createTask: async (taskData: CreateTaskInput): Promise<{ message: string; task: Task }> => {
    const response = await api.post<{ message: string; task: Task }>('/tasks', taskData);
    return response.data;
  },
  updateTask: async (id: number, taskData: UpdateTaskInput): Promise<{ message: string; task: Task }> => {
    const response = await api.put<{ message: string; task: Task }>(`/tasks/${id}`, taskData);
    return response.data;
  },
  deleteTask: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/tasks/${id}`);
    return response.data;
  },
};

export default api;
