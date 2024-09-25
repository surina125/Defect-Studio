import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  ModelParams,
  BatchParams,
  ImgDimensionParams,
  GuidanceParams,
  PromptParams,
  SamplingParams,
  SeedParams
} from '../../../types/generation';

export interface Txt2ImgState {
  params: {
    modelParams: ModelParams;
    batchParams: BatchParams;
    imgDimensionParams: ImgDimensionParams;
    guidanceParams: GuidanceParams;
    promptParams: PromptParams;
    samplingParams: SamplingParams;
    seedParams: SeedParams;
  };
  isLoading: boolean;
  output: {
    outputPath: string;
    processedImgsCnt: number;
    firstProcessedImg: string | null;
  };
}

const initialState: Txt2ImgState = {
  params: {
    modelParams: {
      model: 'stable-diffusion-2'
    },
    samplingParams: {
      scheduler: 'DPM++ 2M',
      numInferenceSteps: 50
    },
    promptParams: {
      prompt: '',
      negativePrompt: '',
      isNegativePrompt: false
    },
    guidanceParams: {
      guidanceScale: 7.5
    },
    imgDimensionParams: {
      width: 512,
      height: 512
    },
    seedParams: {
      seed: -1,
      isRandomSeed: false
    },
    batchParams: {
      batchCount: 1,
      batchSize: 1
    }
  },
  isLoading: false,
  output: {
    outputPath: '',
    processedImgsCnt: 0,
    firstProcessedImg: null
  }
};

const txt2ImgSlice = createSlice({
  name: 'txt2Img',
  initialState,
  reducers: {
    // promptParams는 자주 업데이트 될 수 있으므로 개별 처리
    setPrompt: (state, action: PayloadAction<string>) => {
      state.params.promptParams.prompt = action.payload;
    },
    setNegativePrompt: (state, action: PayloadAction<string>) => {
      state.params.promptParams.negativePrompt = action.payload;
    },
    setIsNegativePrompt: (state, action: PayloadAction<boolean>) => {
      state.params.promptParams.isNegativePrompt = action.payload;
      if (!state.params.promptParams.isNegativePrompt) {
        state.params.promptParams.negativePrompt = '';
      }
    },

    setModelParams: (state, action: PayloadAction<string>) => {
      state.params.modelParams.model = action.payload;
    },
    setSamplingParams: (state, action: PayloadAction<{ scheduler: string; numInferenceSteps: number }>) => {
      state.params.samplingParams = action.payload;
    },
    setGuidancetParams: (state, action: PayloadAction<number>) => {
      state.params.guidanceParams.guidanceScale = action.payload;
    },
    setImgDimensionParams: (state, action: PayloadAction<{ width: number; height: number }>) => {
      state.params.imgDimensionParams = action.payload;
    },
    setSeedParams: (state, action: PayloadAction<{ seed: number; isRandomSeed: boolean }>) => {
      state.params.seedParams = action.payload;
    },
    setBatchParams: (state, action: PayloadAction<{ batchCount: number; batchSize: number }>) => {
      state.params.batchParams = action.payload;
    },

    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setOutputPath: (state, action: PayloadAction<string>) => {
      state.output.outputPath = action.payload;
    },
    setProcessedImgsCount: (state, action: PayloadAction<number>) => {
      state.output.processedImgsCnt = action.payload;
    },
    setFirstProcessedImg: (state, action: PayloadAction<string | null>) => {
      state.output.firstProcessedImg = action.payload;
    },

    // params 초기화
    resetState: (state) => {
      Object.assign(state.params, initialState.params);
    }
  }
});

export const {
  setPrompt,
  setNegativePrompt,
  setIsNegativePrompt,
  setModelParams,
  setSamplingParams,
  setGuidancetParams,
  setImgDimensionParams,
  setSeedParams,
  setBatchParams,
  setIsLoading,
  setOutputPath,
  setProcessedImgsCount,
  setFirstProcessedImg,
  resetState
} = txt2ImgSlice.actions;

export default txt2ImgSlice.reducer;
