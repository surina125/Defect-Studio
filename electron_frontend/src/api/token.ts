import axiosInstance from './token/axiosInstance';

export interface TokenIssueRequestType {
  end_date: string;
  quantity: number;
  department_ids: number[];
}

export const createTokenIssue = async (data: TokenIssueRequestType) => {
  try {
    const response = await axiosInstance.post('/admin/tokens', data);
    return response;
  } catch (error) {
    console.error(error);
  }
};

export interface TokenReadType {
  token_id: number;
  start_date: string;
  end_date: string;
  original_quantity: number;
  remaining_quantity: number;
  is_active: boolean;
  department_id: number;
}

export const getDepartmentTokenUsage = async (departmentId?: number) => {
  if (departmentId === undefined) {
    const response = await axiosInstance.get('/admin/tokens');
    console.log(response.data);
  } else {
    const response = await axiosInstance.get(`/admin/tokens/${departmentId}?department_id=${departmentId}`);
    console.log(response.data);
  }
};
