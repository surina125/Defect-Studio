import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface TxtToImgState {
  model: string;
  prompt: string;
  negativePrompt: string;
  width: number;
  height: number;
  samplingSteps: number;
  guidanceScale: number;
  seed: number;
  isRandomSeed: boolean;
  batchCount: number;
  batchSize: number;
  outputPath: string;
  isNegativePrompt: boolean; 
  imageUrls: string[]; // 생성된 이미지 URL 리스트
  samplingMethod: string;
}

const initialState: TxtToImgState = {
  model: 'CompVis/stable-diffusion-v1-4',
  prompt: '',
  negativePrompt: '',
  width: 512,
  height: 512,
  samplingSteps: 50,
  guidanceScale: 7.5,
  seed: -1,
  isRandomSeed: false,
  batchCount: 1,
  batchSize: 1,
  outputPath: '',
  isNegativePrompt: false, 
  imageUrls: [], 
  samplingMethod: ''
};

const txtToImgSlice = createSlice({
  name: 'txtToImg',
  initialState,
  reducers: {
    setModel: (state, action: PayloadAction<string>) => {
      state.model = action.payload;
    },
    setPrompt: (state, action: PayloadAction<string>) => {
      state.prompt = action.payload;
    },
    setNegativePrompt: (state, action: PayloadAction<string>) => {
      state.negativePrompt = action.payload;
    },
    setWidth: (state, action: PayloadAction<number>) => {
      state.width = action.payload;
    },
    setHeight: (state, action: PayloadAction<number>) => {
      state.height = action.payload;
    },
    setSamplingSteps: (state, action: PayloadAction<number>) => {
      state.samplingSteps = action.payload;
    },
    setGuidanceScale: (state, action: PayloadAction<number>) => {
      state.guidanceScale = action.payload;
    },
    setSeed: (state, action: PayloadAction<number>) => {
      state.seed = action.payload;
    },
    setIsRandomSeed: (state, action: PayloadAction<boolean>) => {
      state.isRandomSeed = action.payload;
      if (state.isRandomSeed) {
        state.seed = -1; // 랜덤 시드가 활성화되면 시드를 -1로 설정
      }
    },
    setBatchCount: (state, action: PayloadAction<number>) => {
      state.batchCount = action.payload;
    },
    setBatchSize: (state, action: PayloadAction<number>) => {
      state.batchSize = action.payload;
    },
    setOutputPath: (state, action: PayloadAction<string>) => {
      state.outputPath = action.payload;
    },
    setIsNegativePrompt: (state, action: PayloadAction<boolean>) => {
      state.isNegativePrompt = action.payload;
      if (!state.isNegativePrompt) {
        state.negativePrompt = ''; // 네거티브 프롬프트 비활성화 시 초기화
      }
    },
    setImageUrls: (state, action: PayloadAction<string[]>) => {
      state.imageUrls = action.payload;
    },
    setSamplingMethod: (state, action: PayloadAction<string>) => {
      state.outputPath = action.payload;
    },
  }
});

export const {
  setModel,
  setPrompt,
  setNegativePrompt,
  setWidth,
  setHeight,
  setSamplingSteps,
  setGuidanceScale,
  setSeed,
  setIsRandomSeed,
  setBatchCount,
  setBatchSize,
  setOutputPath,
  setIsNegativePrompt,
  setImageUrls,
  setSamplingMethod,
} = txtToImgSlice.actions;

export default txtToImgSlice.reducer;
