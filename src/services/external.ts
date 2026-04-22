import axios from 'axios';

export default {
  zipcode(zipcode: string) {
    return axios.get(`https://brasilapi.com.br/api/cep/v1/${zipcode}`);
  },
};
