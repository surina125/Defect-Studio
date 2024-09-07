import noAuthAxios from './token/noAuthAxios';
import { loginData } from '../types/user';

// 로그인 함수
export async function login(user: loginData) {
  try {
    const formData = new URLSearchParams();
    formData.append('username', user.username);
    formData.append('password', user.password);

    const response = await noAuthAxios.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const authorizationHeader = response.headers['authorization'];

    // 토큰이 있을 경우 저장
    if (authorizationHeader) {
      const token = authorizationHeader.split(' ')[1]; // 토큰만 저장
      localStorage.setItem('accessToken', token);
      console.log('Login successful, token:', token);
      return { token };
    } else {
      throw new Error('Login failed: No token found in response headers');
    }
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
}
