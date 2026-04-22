import axios from '.';
import type { Account, Service } from '@/types';
import type { User } from '@/types/user';

export interface AccountBookingInfo extends Account {
  services?: Service[];
  users?: User[];
}

export default {
  index() {
    return axios.get<Account>('/accounts');
  },

  update($data: Account) {
    return axios.put<Account>('/accounts', $data);
  },

  getInfoBySlug(slug: string) {
    return axios.get<AccountBookingInfo>(`/accounts/slug/${slug}`);
  }
};
