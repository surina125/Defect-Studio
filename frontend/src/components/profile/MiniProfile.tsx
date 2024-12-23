import { useNavigate } from 'react-router-dom';
import { logout } from '../../api/user';
import { useDispatch } from 'react-redux';
import { resetOutputs } from '../../store/slices/generation/outputSlice';

interface miniProfilePropsType {
  nickname: string;
  department_name: string;
  email: string;
}

const MiniProfile = ({ nickname, department_name, email }: miniProfilePropsType) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const onResetOutput = () => {
    dispatch(resetOutputs('txt2Img'));
    dispatch(resetOutputs('img2Img'));
    dispatch(resetOutputs('inpainting'));
    dispatch(resetOutputs('removeBg'));
    dispatch(resetOutputs('cleanup'));
  };

  return (
    <>
      <div className="w-[300px] h-full relative">
        <div
          className="w-[300px] h-full absolute left-[-1px] top-[-1px] rounded-[10px] bg-white dark:bg-gray-800  dark:text-white "
          style={{ boxShadow: '0px 4px 4px 0 rgba(0,0,0,0.25)' }}
        />
        <section className="flex flex-col items-center justify-center relative p-2 dark:text-white ">
          <p className="text-base text-left ">{nickname}</p>
          <p className=" text-base text-left ">{department_name}</p>
          <p className=" text-sm text-left ">{email}</p>
          <div className="flex flex-row justify-evenly w-[90%] mt-2 ">
            <button
              onClick={() => {
                onResetOutput;
                logout();
                navigate('/login');
              }}
              className="btn w-[80px] h-[30px] rounded-lg text-base bg-[#fd7272] hover:bg-[#f26a6a] text-white active:scale-95"
            >
              Log Out
            </button>

            <button
              onClick={async () => {
                navigate(`/profile`);
              }}
              className="btn w-[80px] h-[30px] rounded-lg text-base bg-[#8a2be2] hover:bg-[#8226d9] text-white active:scale-95"
            >
              Detail
            </button>
          </div>
        </section>
      </div>
    </>
  );
};

export default MiniProfile;
