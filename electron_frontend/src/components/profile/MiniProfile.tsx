import { useNavigate } from 'react-router-dom';

const MiniProfile = () => {
  const navigate = useNavigate();
  return (
    <>
      <div className="w-[300px] h-[400px] relative">
        <div
          className="w-[300px] h-[400px] absolute left-[-1px] top-[-1px] rounded-[10px] bg-white border border-[#e0e0e0]"
          style={{ boxShadow: '0px 4px 4px 0 rgba(0,0,0,0.25)' }}
        />
        <svg
          width={141}
          height={141}
          viewBox="0 0 141 141"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute left-[78px] top-[22px]"
          preserveAspectRatio="xMidYMid meet"
        >
          <path
            d="M141 70.5C141 109.436 109.436 141 70.5 141C31.5639 141 0 109.436 0 70.5C0 31.5639 31.5639 0 70.5 0C109.436 0 141 31.5639 141 70.5Z"
            fill="#C4C4C4"
          />
        </svg>
        <p className="absolute left-[114px] top-[178px] text-base text-left text-black">Nickname</p>
        <p className="absolute left-[49px] top-[200px] text-base text-left text-black">Samsumg Electronic Co. DX</p>
        <p className="absolute left-[99px] top-[225px] text-sm text-left text-[#47415e]">ssafy@ssafy.com</p>
        <div className="w-[94px] h-[37px] absolute left-[38px] top-[346px]">
          <button className="btn w-[94px] h-[37px] absolute left-[-1px] top-[-1px] rounded-[10px] text-base bg-[#fd7272] hover:bg-[#f26a6a] text-white active:scale-95">
            Log Out
          </button>
        </div>
        0
        <div className="w-[94px] h-[37px] absolute left-[171px] top-[346px]">
          <button
            onClick={() => {
              navigate('/profile/test');
            }}
            className="btn w-[94px] h-[37px] absolute left-[-1px] top-[-1px] rounded-[10px] text-base bg-[#8a2be2] hover:bg-[#8226d9] text-white active:scale-95"
          >
            Detail
          </button>
        </div>
        <button className="absolute button left-[60px] top-[286px] text-sm text-left text-black">
          Left Token : 123, 400 Tokens
        </button>
      </div>
      ;
    </>
  );
};

export default MiniProfile;
