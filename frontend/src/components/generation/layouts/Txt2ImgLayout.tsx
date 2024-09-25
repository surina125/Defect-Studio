import { useState, useCallback } from 'react';
import { Modal, Button, Select, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../sidebar/Txt2ImgSidebar';
import PromptParams from '../params/PromptParams';
import Txt2ImgDisplay from '../outputDisplay/Txt2ImgDisplay';
import { useDispatch, useSelector } from 'react-redux';
import { setIsNegativePrompt, setIsLoading } from '../../../store/slices/generation/txt2ImgSlice';
import { setImageList as setImg2ImgImages } from '../../../store/slices/generation/img2ImgSlice';
import { setInitImageList as setInpaintingImages } from '../../../store/slices/generation/inpaintingSlice';
import { setImageList as setRemoveBgImages } from '../../../store/slices/generation/removeBgSlice';
import { setInitImageList as setCleanupImages } from '../../../store/slices/generation/cleanupSlice';
import { useTxt2ImgParams } from '../../../hooks/generation/useTxt2ImgParams';
import GenerateButton from '../../common/GenerateButton';
import { RiFolderDownloadLine } from 'react-icons/ri';
import { MdMoveUp } from 'react-icons/md';
import { RiCheckboxMultipleBlankFill, RiCheckboxMultipleBlankLine } from 'react-icons/ri';
import { AiOutlineEyeInvisible, AiOutlineEye } from 'react-icons/ai';
import { postTxt2ImgGeneration } from '../../../api/generation';
import { RootState } from '../../../store/store';

const Txt2ImgLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { params, isLoading, output } = useSelector((state: RootState) => state.txt2Img);
  const { prompt, negativePrompt, isNegativePrompt, updatePrompt, updateNegativePrompt } = useTxt2ImgParams();

  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [allSelected, setAllSelected] = useState(false);
  const [isIconFilled, setIsIconFilled] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isFormatModalVisible, setIsFormatModalVisible] = useState(false);
  const [selectedImageFormat, setSelectedImageFormat] = useState<string>('png');

  const imageFormats = [
    { value: 'png', label: 'PNG' },
    { value: 'jpg', label: 'JPG' },
    { value: 'jpeg', label: 'JPEG' },
    { value: 'bmp', label: 'BMP' }
  ];

  const handleNegativePromptChange = useCallback(() => {
    dispatch(setIsNegativePrompt(!isNegativePrompt));
  }, [isNegativePrompt, dispatch]);

  const handleGenerate = async () => {
    const data = {
      model: params.modelParams.model,
      scheduler: params.samplingParams.scheduler,
      prompt: params.promptParams.prompt,
      negative_prompt: params.promptParams.negativePrompt,
      width: params.imgDimensionParams.width,
      height: params.imgDimensionParams.height,
      num_inference_steps: params.samplingParams.numInferenceSteps,
      guidance_scale: params.guidanceParams.guidanceScale,
      seed: params.seedParams.seed,
      batch_count: params.batchParams.batchCount,
      batch_size: params.batchParams.batchSize,
      output_path: '' // 추후 settings 페이지 경로 넣을 예정
    };

    try {
      dispatch(setIsLoading(true));
      await postTxt2ImgGeneration('remote', data);
      dispatch(setIsLoading(false));
    } catch (error) {
      if (error instanceof Error) {
        message.error(`Error generating image: ${error.message}`);
      } else {
        message.error('An unknown error occurred');
      }
      dispatch(setIsLoading(false));
    }
  };

  const handleSelectAllImages = useCallback(() => {
    if (allSelected) {
      setSelectedImages([]);
    } else {
      setSelectedImages(output.outputImgs);
    }
    setAllSelected(!allSelected);
    setIsIconFilled(!isIconFilled);
  }, [allSelected, output.outputImgs]);

  const handleDownloadImages = async () => {
    if (selectedImages.length === 0) {
      message.warning('Please select at least one image to save.');
      return;
    }
    const folderPath = await window.electron.selectFolder();
    if (!folderPath) {
      message.info('Folder selection was canceled.');
      return;
    }
    const response = await window.electron.saveImages(selectedImages, folderPath, selectedImageFormat);
    if (response.success) {
      message.success('Image saved successfully!');
    } else {
      message.error(`Failed to save images: ${response.error}`);
    }
  };

  const toggleSidebarAndPrompt = useCallback(() => {
    setIsSidebarVisible(!isSidebarVisible);
  }, [isSidebarVisible]);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const showFormatModal = () => {
    setIsFormatModalVisible(true);
  };

  const handleFormatModalOk = () => {
    setIsFormatModalVisible(false);
    handleDownloadImages(); // 형식 선택 후 다운로드 함수 호출
  };

  const handleFormatModalCancel = () => {
    setIsFormatModalVisible(false);
  };

  const routeToActionMap: { [key: string]: (images: string[]) => void } = {
    '/generation/image-to-image': (images) => dispatch(setImg2ImgImages(images)),
    '/generation/inpainting': (images) => dispatch(setInpaintingImages(images)),
    '/generation/remove-background': (images) => dispatch(setRemoveBgImages(images)),
    '/generation/cleanup': (images) => dispatch(setCleanupImages(images))
  };

  const goToPage = useCallback(
    (path: string) => {
      const action = routeToActionMap[path];
      if (action) {
        action(selectedImages);
      }
      navigate(path);
      setIsModalVisible(false);
    },
    [navigate, selectedImages]
  );

  return (
    <div className="flex h-full pt-4 pb-6">
      {/* 사이드바 */}
      {isSidebarVisible && (
        <div className="w-[360px] pl-8 h-full hidden md:block">
          <Sidebar />
        </div>
      )}

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex flex-col px-8 w-full h-full">
        <div className="flex-1 overflow-y-auto custom-scrollbar py-4 pl-4 flex">
          {/* 이미지 디스플레이 */}
          <div className="flex-1">
            <Txt2ImgDisplay selectedImages={selectedImages} setSelectedImages={setSelectedImages} />
          </div>

          {/* 생성된 이미지 도구모음 */}
          <div className="flex flex-col items-center gap-6 w-[46px] text-[#222] py-10 bg-white rounded-[20px] shadow-md border border-gray-300 dark:bg-gray-600 dark:border-none ml-8 overflow-y-auto custom-scrollbar">
            <RiFolderDownloadLine
              className="flex-shrink-0 w-[22px] h-[22px] dark:text-gray-300 hover:text-blue-500 dark:hover:text-white"
              onClick={showFormatModal}
            />
            <MdMoveUp
              className="flex-shrink-0 w-[22px] h-[22px] dark:text-gray-300 cursor-pointer  hover:text-blue-500 dark:hover:text-white"
              onClick={showModal}
            />
            {isIconFilled ? (
              <RiCheckboxMultipleBlankLine
                className={`flex-shrink-0 w-[22px] h-[22px] dark:text-gray-300 cursor-pointer  hover:text-blue-500 dark:hover:text-white ${allSelected ? 'text-blue-500' : ''}`}
                onClick={handleSelectAllImages}
              />
            ) : (
              <RiCheckboxMultipleBlankFill
                className={`flex-shrink-0 w-[22px] h-[22px] dark:text-gray-300 cursor-pointer  hover:text-blue-500 dark:hover:text-white ${allSelected ? 'text-blue-500' : ''}`}
                onClick={handleSelectAllImages}
              />
            )}

            {isSidebarVisible ? (
              <AiOutlineEye
                className="flex-shrink-0 w-[22px] h-[22px] dark:text-gray-300 cursor-pointer hover:text-blue-500 dark:hover:text-white"
                onClick={toggleSidebarAndPrompt}
              />
            ) : (
              <AiOutlineEyeInvisible
                className="flex-shrink-0 w-[22px] h-[22px] dark:text-gray-300 cursor-pointer hover:text-blue-500 dark:hover:text-white"
                onClick={toggleSidebarAndPrompt}
              />
            )}
          </div>
        </div>

        {/* 프롬프트 영역 */}
        {isSidebarVisible && (
          <div className="w-full flex-none mt-6">
            <PromptParams
              prompt={prompt}
              negativePrompt={negativePrompt}
              updatePrompt={updatePrompt}
              updateNegativePrompt={updateNegativePrompt}
              isNegativePrompt={isNegativePrompt}
              handleNegativePromptChange={handleNegativePromptChange}
            />
          </div>
        )}
      </div>

      {/* Generate 버튼 */}
      {isSidebarVisible && (
        <div className="fixed bottom-[50px] right-[56px]">
          <GenerateButton onClick={handleGenerate} disabled={isLoading} />
        </div>
      )}

      {/* 이미지 형식 선택 모달 */}
      <Modal open={isFormatModalVisible} closable={false} onOk={handleFormatModalOk} onCancel={handleFormatModalCancel}>
        <div className="text-[20px] mb-[20px] font-semibold dark:text-gray-300">
          Select the format for saving images
        </div>
        <Select value={selectedImageFormat} onChange={setSelectedImageFormat} className="w-full mt-4 mb-10">
          {imageFormats.map((format) => (
            <Select.Option key={format.value} value={format.value}>
              {format.label}
            </Select.Option>
          ))}
        </Select>
      </Modal>

      {/* 액션 선택 모달 */}
      <Modal open={isModalVisible} onCancel={handleCancel} footer={null}>
        <div className="text-[20px] mb-[20px] font-semibold dark:text-gray-300">Select a tab to navigate</div>
        <div className="flex flex-col gap-4 my-10">
          <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-4">
            <Button onClick={() => goToPage('/generation/image-to-image')}>Img2Img</Button>
            <Button onClick={() => goToPage('/generation/inpainting')}>Inpainting</Button>
            <Button onClick={() => goToPage('/generation/remove-background')}>Remove Background</Button>
            <Button onClick={() => goToPage('/generation/cleanup')}>Cleanup</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Txt2ImgLayout;
