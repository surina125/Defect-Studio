import axiosInstance from './token/axiosInstance';

type TokenReadType = {
  token_id: number;
  start_date: string;
  end_date: string;
  original_quantity: number;
  remaining_quantity: number;
  is_active: boolean;
  department_id: number;
};

export const getDepartmentTokenUsage = async (departmentId?: number) => {
  if (departmentId === undefined) {
    const response = await axiosInstance.get('/admin/tokens');
    console.log(response.data);
  } else {
    const response = await axiosInstance.get(`/admin/tokens/${departmentId}?department_id=${departmentId}`);
    console.log(response.data);
  }
};
