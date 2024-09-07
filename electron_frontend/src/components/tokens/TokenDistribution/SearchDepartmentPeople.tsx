import { useQuery } from '@tanstack/react-query';
import { Select, Space } from 'antd';
import { AxiosError, AxiosResponse } from 'axios';
import { DepartmentPersonType } from '../../../api/department';
import { getDepartmentPeople } from '../../../api/department';

type AntdSelectOptionType = {
  value: number;
  label: string;
  name: string;
  quantity: number;
};

type PropsType = {
  departmentsId: number;
};

const SearchDepartmentPeople = ({ departmentsId }: PropsType) => {
  //부서 불러오기
  //컴포넌트 출력
  const { data, isPending, isError, error } = useQuery<
    AxiosResponse<DepartmentPersonType[]>,
    AxiosError,
    AntdSelectOptionType[],
    (string | number)[]
  >({
    queryKey: ['department_people', departmentsId],
    queryFn: () => getDepartmentPeople(departmentsId),
    select: (data) =>
      data.data.map((department) => {
        return {
          value: department.member_id,
          label: department.name,
          name: department.name,
          quantity: department.token_quantity
        };
      })
  });

  return (
    <section className="token-issurance-department-container">
      <div>
        <p className="text-[20px] font-bold">Please select the departments you wish to grant the token to</p>
      </div>

      <div className="">
        {isPending && <p>Loading...</p>}
        {isError && <p>{error.message}</p>}
        {data && (
          <Select
            showSearch
            mode="multiple"
            filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            notFoundContent={isPending ? 'Loading...' : 'Not Found'}
            style={{ width: '100%' }}
            options={data}
            optionRender={(option) => (
              <Space>
                <span>{option.label}</span>
              </Space>
            )}
          />
        )}
      </div>
    </section>
  );
};

export default SearchDepartmentPeople;
