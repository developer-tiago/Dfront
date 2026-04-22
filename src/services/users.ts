import axios from '.';
import type { User } from '@/types';

type UserPayload = Omit<User, 'id' | 'account_id'>;

export default {
  index() {
    return axios.get<User[]>('/users');
  },

  create(data: UserPayload) {
    return axios.post<User>('/users', data);
  },

  show(id: string) {
    return axios.get<User>(`/users/${id}`);
  },

  update(id: string, data: Partial<UserPayload>) {
    return axios.put<User>(`/users/${id}`, data);
  },

  delete(id: string) {
    return axios.delete<void>(`/users/${id}`);
  },
};
