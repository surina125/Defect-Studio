import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import React from 'react';

interface Txt2ImgDisplayProps {
  selectedImages: string[];
  setSelectedImages: React.Dispatch<React.SetStateAction<string[]>>;
}

const Txt2ImgDisplay = ({ selectedImages, setSelectedImages }: Txt2ImgDisplayProps) => {
  const { output, params, isLoading, allOutputs } = useSelector((state: RootState) => state.txt2Img);

  // 생성할 이미지 가로세로 비율 계산
  const aspectRatio = params.imgDimensionParams.width / params.imgDimensionParams.height;

  const handleImageClick = (url: string) => {
    console.log('이미지수 체크: ', output.imgsCnt);
    setSelectedImages((prevSelected: string[]) => {
      if (prevSelected.includes(url)) {
        // 이미 선택된 경우 -> 선택 해제
        return prevSelected.filter((imageUrl: string) => imageUrl !== url);
      } else {
        // 선택되지 않은 경우 -> 선택 추가
        return [...prevSelected, url];
      }
    });
  };

  return (
    <div className="h-full image-display grid gap-4 overflow-y-auto custom-scrollbar2">
      {isLoading ? (
        <div
          className="grid gap-4 mr-[16px]"
          style={{
            gridTemplateColumns:
              allOutputs.outputsCnt + output.imgsCnt <= 4
                ? 'repeat(4, 1fr)' // 이미지가 4개 이하일 때는 4열 고정
                : 'repeat(auto-fit, minmax(200px, 1fr))' // 4개 이상일 때는 부모 요소 크기에 맞춰 조정
          }}
        >
          {Array.from({ length: output.imgsCnt }).map((_, index) => (
            <div
              key={index}
              className="relative w-full h-0"
              style={{
                paddingBottom: `${100 / aspectRatio}%`
              }}
            >
              <div className="absolute top-0 left-0 w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded-xl border border-gray-300 dark:border-gray-700" />
            </div>
          ))}
          {allOutputs.outputsInfo.map((outputInfo) =>
            outputInfo.imgsUrl.map((url, imgIndex) => (
              <div
                key={imgIndex}
                className="relative w-full h-0 cursor-pointer"
                onClick={() => handleImageClick(url)} // 클릭 시 해당 이미지의 URL 전달
                style={{
                  paddingBottom: `100%`
                }}
              >
                <img
                  src={url}
                  alt={`Generated image ${imgIndex}`} // 이미지 인덱스 반영
                  className={`absolute top-0 left-0 w-full h-full object-cover rounded-xl ${
                    selectedImages.includes(url)
                      ? 'border-4 border-blue-500'
                      : 'border border-gray-300 dark:border-gray-700'
                  }`}
                  style={{
                    boxSizing: 'border-box' // 이미지 안쪽에 테두리 적용
                  }}
                />
              </div>
            ))
          )}
        </div>
      ) : allOutputs.outputsCnt > 0 ? (
        <div
          className="grid gap-4 mr-[16px]"
          style={{
            gridTemplateColumns:
              allOutputs.outputsCnt <= 4
                ? 'repeat(4, 1fr)' // 이미지가 4개 이하일 때는 4열 고정
                : 'repeat(auto-fit, minmax(200px, 1fr))' // 4개 이상일 때는 부모 요소 크기에 맞춰 조정
          }}
        >
          {allOutputs.outputsInfo.map((outputInfo) =>
            outputInfo.imgsUrl.map((url, imgIndex) => (
              <div
                key={imgIndex}
                className="relative w-full h-0 cursor-pointer"
                onClick={() => handleImageClick(url)} // 클릭 시 해당 이미지의 URL 전달
                style={{
                  paddingBottom: `100%`
                }}
              >
                <img
                  src={url}
                  alt={`Generated image ${imgIndex}`} // 이미지 인덱스 반영
                  className={`absolute top-0 left-0 w-full h-full object-cover rounded-xl ${
                    selectedImages.includes(url)
                      ? 'border-4 border-blue-500'
                      : 'border border-gray-300 dark:border-gray-700'
                  }`}
                  style={{
                    boxSizing: 'border-box' // 이미지 안쪽에 테두리 적용
                  }}
                />
              </div>
            ))
          )}
        </div>
      ) : (
        <p>No images generated yet.</p>
      )}
    </div>
  );
};

export default React.memo(Txt2ImgDisplay);
