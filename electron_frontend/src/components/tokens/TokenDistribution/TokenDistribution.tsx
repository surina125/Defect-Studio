import { useQuery } from '@tanstack/react-query';
import { Select } from 'antd';
import { AxiosError, AxiosResponse } from 'axios';
import { getAllDepartments } from '../../../api/department';
import SearchDepartmentPeople from './SearchDepartmentPeople';
import { useState } from 'react';

type departmentType = {
  department_id: number;
  department_name: string;
};

type SelectOptionType = {
  value: number;
  label: string;
};

const TokenDistribution = () => {
  const [selectedDepartment, setSelectedDepartment] = useState<number | undefined>(undefined);
  const [selectedDepartmentPeople, setSelectedDepartmentPeople] = useState<number[]>([]);
  const { data, isError, error, isLoading } = useQuery<
    AxiosResponse<departmentType[]>,
    AxiosError,
    SelectOptionType[],
    string[]
  >({
    queryKey: ['departments'],
    queryFn: getAllDepartments,
    select: (response) =>
      response.data.map((department) => {
        return {
          value: department.department_id,
          label: department.department_name
        };
      })
  });

  return (
    <div className="flex flex-col justify-center align-middle">
      {/* 부서 선택 */}
      <section className="flex flex-col">
        {isLoading && <div>Loading...</div>}
        {isError && <div>{error?.message || 'Try again Later'}</div>}
        {data && (
          <Select
            className="align-middle"
            showSearch
            style={{ width: '100%' }}
            placeholder="Search to Select Department"
            optionFilterProp="label"
            filterSort={(optionA, optionB) =>
              (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
            }
            onChange={(value) => setSelectedDepartment(value)}
            options={[...data]}
          />
        )}
      </section>

      {selectedDepartment && (
        <section className="flex flex-col mt-4">
          <SearchDepartmentPeople
            departmentsId={selectedDepartment}
            selectedDepartmentPeople={selectedDepartmentPeople}
            setSelectedDepartmentPeople={setSelectedDepartmentPeople}
          />
        </section>
      )}

      {
        //부서 사람 선택 후 분배 버튼
      }
    </div>
  );
};

export default TokenDistribution;
