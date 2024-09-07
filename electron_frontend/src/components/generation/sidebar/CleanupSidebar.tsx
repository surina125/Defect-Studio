import { useState } from 'react';
import { Button } from 'antd';
import { FormatPainterOutlined } from '@ant-design/icons';
// import { useFabric } from '../../../contexts/FabricContext';
import InpaintingModal from '../masking/InpaintingModal';
import UploadImagePlusMask from '../parameters/UploadImagePlusMask';

const CleanupSidebar: React.FC = () => {
  // const { canvasDownloadUrl, maskingResult, setMaskingResult } = useFabric();

  const [showModal, setShowModal] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('manual');

  // 탭 변경 시 MaskingResult 리셋
  // useEffect(() => {
  //   setMaskingResult(null);
  // }, [setMaskingResult]);

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        // const ratio = img.width / img.height;
        // const newWidth = ratio > 1 ? 512 : 512 * ratio;
        // const newHeight = ratio > 1 ? 512 / ratio : 512;

        setImageSrc(reader.result as string);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  // const handleDownloadImage = (url: string | null, filename: string) => {
  //   if (url) {
  //     const link = document.createElement('a');
  //     link.href = url;
  //     link.download = filename;
  //     document.body.appendChild(link);
  //     link.click();
  //     document.body.removeChild(link);
  //   }
  // };

  // const handleDownloadCanvasImage = () => {
  //   handleDownloadImage(canvasDownloadUrl, 'canvas.png');
  // };

  const handleCloseModal = () => {
    setShowModal(false); // 모달 닫기
  };

  return (
    <div className="w-full lg:w-72 h-full fixed-height mr-6">
      <div className="w-full lg:w-72 h-full overflow-y-auto custom-scrollbar rounded-[15px] bg-white shadow-lg border border-gray-300 dark:bg-gray-600 dark:border-none">
        {/* 이미지 업로드 */}
        <UploadImagePlusMask
          handleImageUpload={handleImageUpload}
          imagePreview={imageSrc}
          // inpaintingResult={maskingResult}
          setActiveTab={setActiveTab}
        />

        {imageSrc && (
          <div className="px-6 pb-10">
            {/* Start Masking 버튼 */}
            {activeTab === 'manual' && (
              <Button
                type="primary"
                icon={<FormatPainterOutlined />}
                onClick={() => setShowModal(true)} // 버튼 클릭 시 모달 열기
                className="w-full mt-2"
              >
                Start Masking
              </Button>
            )}

            {/* 인페인팅 결과 및 다운로드 */}
            {/* {activeTab === 'manual' && maskingResult && (
              <div className="relative w-full pb-[61.8%] border border-dashed border-gray-300 rounded-lg mt-4 flex items-center justify-center">
                <img
                  src={maskingResult}
                  alt="Inpainting Result"
                  className="absolute top-0 left-0 w-full h-full object-cover rounded-lg"
                />
                <Button type="default" onClick={handleDownloadCanvasImage} className="w-full mt-2">
                  Download Canvas Image
                </Button>
              </div>
            )} */}
          </div>
        )}
      </div>

      {/* Inpainting 모달 창 - 모달 상태에 따라 렌더링 */}
      {showModal && imageSrc && (
        <InpaintingModal imageSrc={imageSrc} onClose={handleCloseModal} /> // 모달 닫기 함수 전달
      )}
    </div>
  );
};

export default CleanupSidebar;
