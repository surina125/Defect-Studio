import { useQuery } from '@tanstack/react-query';
import { Table } from 'antd'; // 테이블
import { AxiosError, AxiosResponse } from 'axios'; // Axios요청타입
import { DepartmentPersonType } from '../../../api/department'; // 요청 성공시 받아오는 데이터 타입
import { getDepartmentPeople } from '../../../api/department'; // 요청 함수
import { ConfigProvider, theme } from 'antd'; //다크모드
import { useSelector } from 'react-redux';
import { useState } from 'react';

type PropsType = {
  departmentsId: number;
};

const columns = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name'
  },
  {
    title: 'Nickname',
    dataIndex: 'nickname',
    key: 'nickname'
  },
  {
    title: 'Token Quantity',
    dataIndex: 'token_quantity',
    key: 'token_quantity'
  }
];

const rowSelection = {
  type: 'checkbox',
  onChange: (selectedRowKeys: number[], selectedRows: DepartmentPersonType[]) => {
    console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
  }
};

const SearchDepartmentPeople = ({ departmentsId }: PropsType) => {
  //부서 불러오기
  //컴포넌트 출력
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const { defaultAlgorithm, darkAlgorithm } = theme;
  const { data, isPending, isError, error } = useQuery<
    AxiosResponse<DepartmentPersonType[]>,
    AxiosError,
    DepartmentPersonType[],
    (string | number)[]
  >({
    queryKey: ['department_people', departmentsId],
    queryFn: () => getDepartmentPeople(departmentsId),
    select: (data) => data.data
  });
  const setThemeMode = useSelector((state) => state.theme.mode);
  return (
    <section className="token-issurance-department-container">
      <div>
        <p className="text-[20px] font-bold">Please choose the people to whom the tokens will be distributed.</p>
      </div>

      <div className="">
        {isPending && <p>Loading...</p>}
        {isError && <p>{error.message}</p>}
        {data && (
          <ConfigProvider
            theme={{
              algorithm: setThemeMode === 'dark' ? darkAlgorithm : defaultAlgorithm
            }}
          >
            <Table
              className={setThemeMode === 'dark' ? 'dark-table' : 'light-table'}
              columns={columns}
              dataSource={data}
              rowSelection={rowSelection}
            />
          </ConfigProvider>
        )}
      </div>
    </section>
  );
};

export default SearchDepartmentPeople;
