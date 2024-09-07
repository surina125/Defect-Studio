export interface signUpFormType {
  login_id: string;
  password: string;
  name: string;
  nickname: string;
  email: string;
  role: 'super_admin' | 'department_member' | 'department_admin';
  department_id: number;
}

export type userInfo = Omit<signUpFormType, 'password'> & {
  isLogined: boolean;
  token: string;
};

export interface loginData {
  username: string;
  password: string;
}
