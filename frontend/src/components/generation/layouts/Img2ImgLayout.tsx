import Sidebar from '../sidebar/Img2ImgSidebar';
import PromptParams from '../params/PromptParams';
import Img2ImgDisplay from '../outputDisplay/Img2ImgDisplay';
import { setIsNegativePrompt, setClipData } from '../../../store/slices/generation/img2ImgSlice';
import {
  setIsLoading,
  setTaskId,
  setOutputImgsCnt,
  setOutputImgsUrl,
  setAllOutputsInfo,
  setIsCheckedOutput
} from '../../../store/slices/generation/outputSlice';
import { useDispatch, useSelector } from 'react-redux';
import { postImg2ImgGeneration, getClip, getTaskStatus } from '../../../api/generation';
import { convertStringToFile } from '../../../utils/convertStringToFile';
import GenerateButton from '../common/GenerateButton';
import { useImg2ImgParams } from '../../../hooks/generation/params/useImg2ImgParams';
import { RootState } from '../../../store/store';
import { message } from 'antd';
import OutputToolbar from '../outputTool/OutputToolbar';
import { useImg2ImgOutputs } from '../../../hooks/generation/outputs/useImg2ImgOutputs';
import { useEffect, useCallback } from 'react';
import { useClipOutputs } from '@/hooks/generation/outputs/useClipOutputs';

const Img2ImgLayout = () => {
  const dispatch = useDispatch();
  const { params, gpuNum } = useSelector((state: RootState) => state.img2Img);
  const { isLoading, taskId, output, allOutputs, isSidebarVisible } = useImg2ImgOutputs();
  const { isLoading: clipIsLoading, taskId: clipTaskId } = useClipOutputs();
  const { prompt, negativePrompt, isNegativePrompt, updatePrompt, updateNegativePrompt } = useImg2ImgParams();

  const handleNegativePromptChange = () => {
    dispatch(setIsNegativePrompt(!isNegativePrompt));
  };

  let files;

  const handleGenerate = async () => {
    if (params.uploadImgParams.mode === 'manual') {
      files = params.uploadImgParams.imageList.map((base64Img, index) =>
        convertStringToFile(base64Img, `image_${index}.png`, 'image/png')
      );
      dispatch(
        setOutputImgsCnt({ tab: 'img2Img', value: params.batchParams.batchCount * params.batchParams.batchSize })
      );
    } else {
      const fileDataArray = await window.electron.getFilesInFolder(params.uploadImgParams.inputPath);
      dispatch(
        setOutputImgsCnt({
          tab: 'img2Img',
          value: fileDataArray.length * params.batchParams.batchCount * params.batchParams.batchSize
        })
      );

      files = fileDataArray.map((fileData) => {
        return convertStringToFile(fileData.data, fileData.name, fileData.type);
      });
    }

    let gpuNumber: number;
    if (gpuNum) {
      gpuNumber = gpuNum;
    } else {
      gpuNumber = 1; // settings 기본값 가져오기
    }

    const data = {
      gpu_device: gpuNumber,
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
      strength: params.strengthParams.strength,
      image_list: files,
      input_path: params.uploadImgParams.inputPath,
      output_path: '' // 추후 settings 페이지 경로 넣을 예정
    };

    try {
      dispatch(setIsLoading({ tab: 'img2Img', value: true }));
      const newTaskId = await postImg2ImgGeneration('remote', data);

      dispatch(setTaskId({ tab: 'img2Img', value: newTaskId }));
    } catch (error) {
      message.error(`Error generating image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      dispatch(setIsLoading({ tab: 'img2Img', value: false }));
    }
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;

    const fetchTaskStatus = async () => {
      if (isLoading && taskId) {
        try {
          const response = await getTaskStatus(taskId);
          if (response.task_status === 'SUCCESS') {
            clearInterval(intervalId); // 성공 시 상태 확인 중지
            dispatch(setOutputImgsUrl({ tab: 'img2Img', value: response.result_data }));

            window.electron
              .saveImgsWithZip(
                response.result_data,
                params.uploadImgParams.outputPath,
                'png', // 파일 형식 (png로 고정)
                params.uploadImgParams.isZipDownload
              )
              .then((result) => {
                if (result.success) {
                  console.log('이미지가 성공적으로 저장되었습니다:', result.success);
                } else {
                  console.error('이미지 저장 중 오류 발생:', result.error);
                }
              })
              .catch((error) => {
                console.error('이미지 저장 오류:', error);
              });

            const outputsCnt = allOutputs.outputsCnt + output.imgsCnt;
            const outputsInfo = [
              {
                id: response.result_data_log.id,
                imgsUrl: response.result_data,
                prompt: response.result_data_log.prompt
              },
              ...allOutputs.outputsInfo
            ];
            dispatch(setAllOutputsInfo({ tab: 'img2Img', outputsCnt, outputsInfo }));

            dispatch(setIsLoading({ tab: 'img2Img', value: false }));
            dispatch(setIsCheckedOutput({ tab: 'img2Img', value: false }));
            dispatch(setTaskId({ tab: 'img2Img', value: null }));
          }
        } catch (error) {
          console.error('Failed to get task status:', error);
          dispatch(setIsLoading({ tab: 'img2Img', value: false }));
          clearInterval(intervalId);
        }
      }
    };

    if (taskId) {
      fetchTaskStatus();
      intervalId = setInterval(fetchTaskStatus, 1000); // 1초마다 상태 확인
    }

    return () => clearInterval(intervalId); // 컴포넌트 언마운트 시 정리
  }, [taskId, isLoading, dispatch, allOutputs.outputsCnt, output.imgsCnt, allOutputs.outputsInfo]);

  // Clip아이콘 클릭
  const handleClipClick = useCallback(async () => {
    if (params.uploadImgParams.clipData.length === 0) {
      try {
        if (params.uploadImgParams.imageList.length > 0) {
          const file = convertStringToFile(params.uploadImgParams.imageList[0], 'image.png', 'image/png');

          const gpuNumber = gpuNum || 1; // GPU 번호 설정 간소화

          const clipData = {
            gpu_device: gpuNumber,
            image_list: [file]
          };
          const newClipId = await getClip(clipData);
          dispatch(setIsLoading({ tab: 'clip', value: true }));
          dispatch(setTaskId({ tab: 'clip', value: newClipId }));
          console.log('clip 갱신: ', newClipId);
        } else {
          console.error('No image available for clip generation');
        }
      } catch (error) {
        message.error(`Error generating clip data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        dispatch(setIsLoading({ tab: 'clip', value: false }));
      }
    }
  }, [params.uploadImgParams.clipData.length, params.uploadImgParams.imageList, gpuNum, dispatch]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;

    const fetchTaskStatus = async () => {
      console.log(clipIsLoading, clipTaskId);
      if (clipIsLoading && clipTaskId) {
        try {
          const response = await getTaskStatus(clipTaskId);
          if (response.task_status === 'SUCCESS') {
            clearInterval(intervalId); // 성공 시 상태 확인 중지
            dispatch(setClipData(response.result_data));

            dispatch(setIsLoading({ tab: 'clip', value: false }));
            dispatch(setTaskId({ tab: 'clip', value: null }));
          }
        } catch (error) {
          console.error('Failed to get task status:', error);
          dispatch(setIsLoading({ tab: 'clip', value: false }));
          clearInterval(intervalId);
        }
      }
    };

    if (clipTaskId) {
      fetchTaskStatus();
      intervalId = setInterval(fetchTaskStatus, 1000); // 1초마다 상태 확인
    }

    return () => clearInterval(intervalId); // 컴포넌트 언마운트 시 정리
  }, [isLoading, dispatch, clipIsLoading, clipTaskId]);

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
            <Img2ImgDisplay />
          </div>
          <OutputToolbar type="img2Img" />
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
              // 메뉴얼 모드일 때만 props로 전달(batch에서는 clip실행 안함)
              clipData={params.uploadImgParams.mode === 'manual' ? params.uploadImgParams.clipData : []}
              handleClipClick={params.uploadImgParams.mode === 'manual' ? handleClipClick : undefined}
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
    </div>
  );
};

export default Img2ImgLayout;
