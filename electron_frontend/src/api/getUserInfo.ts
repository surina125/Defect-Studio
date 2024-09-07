import axiosInstance from './token/axiosInstance';
import { apiServer } from './token/apiSERVER';
import { AxiosError, AxiosResponse } from 'axios';

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

export const getUserInfo = async (): Promise<AxiosResponse<userInfo, AxiosError>> => {
  try {
    const response = await axiosInstance.get(apiServer + '/api/members');
    console.log('response Data ' + response);
    return response;
  } catch (error) {
    if (error.status) {
      throw Error('Not Authorized');
    }
    throw Error('Unexpected error occurred'); // Add a return statement at the end of the function
  }
};
