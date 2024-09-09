import { signUpFormType } from '../types/user';
import noAuthAxios from './token/axiosInstance';

export const signupHTTP = async (data: signUpFormType) => {
  try {
    const response = noAuthAxios.post('/members/signup', data, {
      headers: {
        'Content-Type': ''
      }
    });
    return response;
  } catch (error) {
    throw new Error('Signup failed');
  }
};
