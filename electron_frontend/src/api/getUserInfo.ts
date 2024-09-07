import axiosInstance from './token/axiosInstance';
import { apiServer } from './token/apiSERVER';

export type userInfo = {
  member_pk: number;
  login_id: string;
  nickname: string;
  email: string;
  role: 'super_admin' | 'department_member' | 'department_admin';
  department_id: number;
  department_name: string;
  token_quantity: number;
};

export const getUserInfo = async () => {
  try {
    const response = await axiosInstance.get(apiServer + 'api/members');
    console.log('response Data ' + response.data);
    return response;
  } catch (error) {
    throw Error('Failed to fetch user info');
  }
};
