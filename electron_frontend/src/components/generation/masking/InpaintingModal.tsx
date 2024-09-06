import { useCallback, useEffect, useRef } from 'react';
import { Button, Slider, Tooltip, InputNumber, Modal } from 'antd';
import * as fabric from 'fabric';
import { IoBrush } from 'react-icons/io5';
import { PiPolygonBold } from 'react-icons/pi';
import { GrSelect } from 'react-icons/gr';
import { useFabric } from '../../../contexts/FabricContext';

const RADIUS = 4;
const DEFAULT_COLOR = 'rgba(135, 206, 235, 0.5)';
const TOOLBAR_HEIGHT = 60;

interface Point {
  x: number;
  y: number;
}

type Lasso = Point[][];

// 곡선을 계산하는 함수 (Hermite 보간법 사용)
const calCurve = (points: number[], tension = 0.5, numOfSeg = 20, close = true): number[] => {
  let pts = points.slice(0); // 원본 배열을 복사하여 사용
  let res = []; // 결과 포인트를 저장할 배열
  let cachePtr = 4; // 캐시 배열의 시작 위치

  const l = points.length; // 제어점 배열의 길이
  const cache = new Float32Array((numOfSeg + 2) * 4); // 캐시 배열 생성

  // 닫힌 곡선일 경우, 첫 번째와 마지막 포인트를 추가하여 곡선을 연결
  if (close) {
    pts.unshift(points[l - 1], points[l - 2]);
    pts.push(points[0], points[1]);
  } else {
    // 열린 곡선일 경우, 끝점에 추가 포인트를 더하여 곡선 연장
    pts.unshift(points[1], points[0]);
    pts.push(points[l - 2], points[l - 1]);
  }

  cache[0] = 1; // 캐시 초기화

  // 세그먼트에 따른 텐서 계산 캐시 초기화
  for (let i = 1; i < numOfSeg; i++) {
    const st = i / numOfSeg,
      st2 = st * st,
      st3 = st2 * st,
      st23 = st3 * 2,
      st32 = st2 * 3;

    cache[cachePtr++] = st23 - st32 + 1;
    cache[cachePtr++] = st32 - st23;
    cache[cachePtr++] = st3 - 2 * st2 + st;
    cache[cachePtr++] = st3 - st2;
  }

  cache[++cachePtr] = 1; // 마지막 캐시 초기화

  // 제어점 간의 곡선 계산
  for (let i = 2; i < pts.length - 4; i += 2) {
    const pt1 = [pts[i], pts[i + 1]];
    const pt2 = [pts[i + 2], pts[i + 3]];
    const pt3 = [pts[i + 4], pts[i + 5]];

    for (let j = 0; j < numOfSeg; j++) {
      const t = j / numOfSeg;
      const t2 = t * t;
      const t3 = t2 * t;

      const h00 = 2 * t3 - 3 * t2 + 1;
      const h10 = t3 - 2 * t2 + t;
      const h01 = -2 * t3 + 3 * t2;
      const h11 = t3 - t2;

      const x = h00 * pt2[0] + h10 * tension * (pt3[0] - pt1[0]) + h01 * pt3[0] + h11 * tension * (pt3[0] - pt2[0]);
      const y = h00 * pt2[1] + h10 * tension * (pt3[1] - pt1[1]) + h01 * pt3[1] + h11 * tension * (pt3[1] - pt2[1]);

      res.push(x, y); // 계산된 x, y 포인트를 결과 배열에 추가
    }
  }

  // 닫힌 곡선일 경우 마지막 부분 곡선 처리
  if (close) {
    pts = [points[l - 4], points[l - 3], points[l - 2], points[l - 1], points[0], points[1], points[2], points[3]];
    res = res.concat(parse(pts, cache, 4, tension, numOfSeg));
  }

  return res; // 최종 계산된 곡선 포인트 반환
};

function parse(pts: number[], cache: Float32Array, l: number, tension: number, numOfSeg: number): number[] {
  const res: number[] = [];

  for (let i = 2; i < l; i += 2) {
    const pt1 = pts[i],
      pt2 = pts[i + 1],
      pt3 = pts[i + 2],
      pt4 = pts[i + 3],
      t1x = (pt3 - pts[i - 2]) * tension,
      t1y = (pt4 - pts[i - 1]) * tension,
      t2x = (pts[i + 4] - pt1) * tension,
      t2y = pts[i + 5] - pt2;

    for (let t = 0; t <= numOfSeg; t++) {
      const c = t * 4;

      res.push(
        cache[c] * pt1 + cache[c + 1] * pt3 + cache[c + 2] * t1x + cache[c + 3] * t2x,
        cache[c] * pt2 + cache[c + 1] * pt4 + cache[c + 2] * t1y + cache[c + 3] * t2y
      );
    }
  }

  return res;
}

// Point 배열을 숫자 배열로 변환하는 함수
const pointsObjToArray = (points: Point[]): number[] => {
  const flattenPoints: number[] = [];
  points.forEach((point) => {
    flattenPoints.push(point.x, point.y);
  });
  return flattenPoints;
};

// 숫자 배열을 Point 배열로 변환하는 함수
const pointsArrayToObj = (points: number[]): Point[] => {
  const curvePoints: Point[] = [];
  for (let i = 0; i <= points.length - 2; i += 2) {
    curvePoints.push({ x: points[i], y: points[i + 1] });
  }
  return curvePoints;
};

// 이전 요소들을 제거하는 함수
const clearPreviousElements = (drawCanvas: fabric.Canvas, curIndex: number): void => {
  const fabricObjects = drawCanvas.getObjects();
  fabricObjects.forEach((curElement) => {
    const element = curElement as fabric.Object & { lassoIndex?: number }; // 타입 단언을 사용하여 lassoIndex 속성을 추가
    if (element.lassoIndex === curIndex) {
      drawCanvas.remove(curElement);
    }
  });
};

// 윤곽선을 그리는 함수
const drawContour = (drawCanvas: fabric.Canvas, lassos: Lasso, curIndex: number): void => {
  const points = lassos[curIndex];
  if (points.length < 2) return;
  const newPoints = calCurve(pointsObjToArray(points));
  const curvePoints = pointsArrayToObj(newPoints);

  // 사용자 정의 속성을 추가한 타입 정의
  const polygon = new fabric.Polyline(curvePoints, {
    fill: DEFAULT_COLOR,
    selectable: false,
    hoverCursor: 'crosshair' // 마우스 커서를 항상 crosshair로 유지
  } as fabric.Polyline); // 여기에서 타입 단언을 통해 타입 지정

  // lassoIndex 속성을 안전하게 추가하기 위해 타입 단언 사용
  (polygon as fabric.Object & { lassoIndex?: number }).lassoIndex = curIndex;

  drawCanvas.add(polygon);
};

// 제어 점을 그리는 함수
const drawControlPoints = (drawCanvas: fabric.Canvas, lassos: Lasso, curIndex: number): void => {
  lassos[curIndex].forEach((point) => {
    const circle = new fabric.Circle({
      top: point.y - RADIUS,
      left: point.x - RADIUS,
      radius: RADIUS,
      fill: 'rgba(56, 189, 248, 0.9)',
      selectable: false
    });

    // 타입 단언을 통해 lassoIndex 속성을 추가
    (circle as fabric.Object & { lassoIndex?: number }).lassoIndex = curIndex;

    drawCanvas.add(circle);
  });
};

interface InpaintingModalProps {
  imageSrc: string;
  onClose: () => void;
}

// InpaintingModal 컴포넌트
const InpaintingModal = ({ imageSrc, onClose }: InpaintingModalProps) => {
  const {
    drawType,
    drawCanvas,
    setDrawType,
    penWidth,
    setPenWidth,
    lassos,
    setLassos,
    setActiveIndex,
    setImageDownloadUrl,
    setCanvasDownloadUrl,
    setMaskingResult
  } = useFabric();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 모달 창 크기에 맞게 캔버스 크기를 조정하는 함수
  const resizeCanvasToFit = useCallback(() => {
    if (!drawCanvas.current) {
      return; // drawCanvas.current가 null인 경우 함수를 종료합니다.
    }

    const modalHeight = window.innerHeight * 0.8 - TOOLBAR_HEIGHT; // 모달의 높이를 80%로 설정
    const modalWidth = window.innerWidth * 0.9;

    const img = drawCanvas.current.backgroundImage as fabric.Image; // 명시적으로 fabric.Image로 타입 캐스팅
    if (img) {
      // img가 존재하고 width와 height가 존재할 때
      const imgAspect = img.width / img.height;
      const modalAspect = modalWidth / modalHeight;

      let canvasWidth, canvasHeight;

      if (imgAspect > modalAspect) {
        canvasWidth = modalWidth;
        canvasHeight = modalWidth / imgAspect;
      } else {
        canvasHeight = modalHeight;
        canvasWidth = modalHeight * imgAspect;
      }

      drawCanvas.current.setWidth(canvasWidth);
      drawCanvas.current.setHeight(canvasHeight);
      drawCanvas.current.setZoom(canvasWidth / img.width);
    }

    drawCanvas.current.renderAll();
  }, [drawCanvas]);

  // 펜 크기가 변경될 때마다 브러쉬 크기를 조정하는 Effect
  useEffect(() => {
    if (canvasRef.current) {
      if (drawCanvas.current) {
        drawCanvas.current.dispose();
      }

      drawCanvas.current = new fabric.Canvas(canvasRef.current);

      const img = new Image();
      img.onload = () => {
        const fabricImg = new fabric.Image(img);

        // 모달 내부의 캔버스 크기를 모달 높이의 70%, 너비의 80%로 설정
        const modalHeight = window.innerHeight * 0.7; // 모달 높이의 70%
        const modalWidth = window.innerWidth * 0.8; // 모달 너비의 80%
        const imgAspectRatio = img.width / img.height;

        let canvasWidth, canvasHeight;

        if (imgAspectRatio > 1) {
          // 이미지가 가로로 더 긴 경우
          canvasWidth = modalWidth;
          canvasHeight = modalWidth / imgAspectRatio;
        } else {
          // 이미지가 세로로 더 긴 경우
          canvasHeight = modalHeight;
          canvasWidth = modalHeight * imgAspectRatio;
        }

        if (drawCanvas.current) {
          drawCanvas.current.setWidth(canvasWidth);
          drawCanvas.current.setHeight(canvasHeight);
          drawCanvas.current.setZoom(canvasWidth / img.width);

          // setBackgroundImage 대신 backgroundImage 속성을 직접 설정
          drawCanvas.current.backgroundImage = fabricImg;

          // 변경 사항을 렌더링
          drawCanvas.current.renderAll();
        }

        // 모달이 열리면 브러쉬가 자동으로 선택되도록 호출
        handleBrushSelect();
      };
      img.src = imageSrc;

      const resizeHandler = () => {
        if (drawCanvas.current) {
          resizeCanvasToFit();
        }
      };

      window.addEventListener('resize', resizeHandler);

      // 키보드 이벤트 추가
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Delete' || event.key === 'Backspace') {
          if (drawCanvas.current) {
            const activeObjects = drawCanvas.current.getActiveObjects();
            if (activeObjects.length > 0) {
              activeObjects.forEach((obj) => {
                drawCanvas.current!.remove(obj);
              });
              drawCanvas.current.discardActiveObject(); // 선택을 해제
              drawCanvas.current.renderAll();
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);

      return () => {
        window.removeEventListener('resize', resizeHandler);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [imageSrc, drawCanvas, resizeCanvasToFit]);

  // 선택을 초기화하는 함수
  const resetSelection = useCallback(() => {
    if (!drawCanvas.current) return; // drawCanvas.current가 null인지 확인

    drawCanvas.current.isDrawingMode = false;
    drawCanvas.current.selection = false;
    drawCanvas.current.off('mouse:down');

    // 객체 삭제할 때 점도 삭제되게 하기 위해서 처리
    const objectsToRemove = drawCanvas.current.getObjects().filter((obj) => {
      return obj.type === 'circle' && obj.fill === 'rgba(56, 189, 248, 0.9)';
    });

    objectsToRemove.forEach((obj) => {
      drawCanvas.current!.remove(obj); // !를 사용해 drawCanvas.current가 null이 아님을 명시적으로 알림
    });

    drawCanvas.current.forEachObject((obj) => {
      obj.selectable = false;
    });

    drawCanvas.current.renderAll();
  }, [drawCanvas]);

  // fabric.Circle을 확장하여 lassoIndex 속성을 포함하는 사용자 정의 타입 정의
  type LassoCircle = fabric.Circle & { lassoIndex?: number };

  // 폴리곤 선택 도구를 처리하는 함수
  const handlePolygonSelect = useCallback(() => {
    resetSelection(); // 선택을 초기화하는 함수 호출

    if (!drawCanvas.current) return; // drawCanvas.current가 null인지 확인

    if (drawType !== 'LASSO_DRAW') {
      setDrawType('LASSO_DRAW'); // 드로잉 타입을 LASSO_DRAW로 설정
      drawCanvas.current.isDrawingMode = false; // 드로잉 모드를 비활성화

      // 커서를 십자선(crosshair) 모양으로 변경
      drawCanvas.current.defaultCursor = 'crosshair';

      // 이전 폴리곤 점들을 초기화하지 않고 새로운 폴리곤을 시작
      const newLassos = [...lassos];
      const curIndex = newLassos.length;
      newLassos.push([]); // 새로운 폴리곤을 위한 빈 배열 추가
      setLassos(newLassos);
      setActiveIndex({ lassoIndex: curIndex, pointIndex: -1 }); // 활성 인덱스 설정

      drawCanvas.current.off('mouse:down'); // 기존 'mouse:down' 이벤트 핸들러 제거
      drawCanvas.current.on('mouse:down', function (options) {
        const pointer = drawCanvas.current!.getPointer(options.e); // 클릭한 위치의 좌표를 가져옴
        newLassos[curIndex].push({ x: pointer.x, y: pointer.y }); // 클릭한 위치를 현재 폴리곤에 추가

        // 각 점을 찍을 때마다 하늘색 원형 점을 추가
        const pointIndicator: LassoCircle = new fabric.Circle({
          left: pointer.x,
          top: pointer.y,
          radius: RADIUS,
          fill: 'rgba(56, 189, 248, 0.9)', // 하늘색으로 채움
          selectable: false // 선택 불가능하도록 설정
        }) as LassoCircle;

        pointIndicator.lassoIndex = curIndex; // lassoIndex 설정
        drawCanvas.current!.add(pointIndicator); // 캔버스에 원형 점 추가

        if (newLassos[curIndex].length > 2) {
          clearPreviousElements(drawCanvas.current!, curIndex); // 이전 요소들을 제거
          drawContour(drawCanvas.current!, newLassos, curIndex); // 폴리곤 윤곽선을 그림
          drawControlPoints(drawCanvas.current!, newLassos, curIndex); // 제어점을 그림
        }

        setLassos(newLassos); // 업데이트된 폴리곤 배열을 설정
        setActiveIndex({ lassoIndex: curIndex, pointIndex: -1 }); // 활성 인덱스를 업데이트
      });
    } else {
      setDrawType('NONE'); // 드로잉 타입을 NONE으로 설정
      drawCanvas.current.defaultCursor = 'default'; // 기본 커서로 복원
      drawCanvas.current.off('mouse:down'); // 'mouse:down' 이벤트 핸들러 제거
    }
  }, [setDrawType, drawCanvas, drawType, lassos, setLassos, setActiveIndex, resetSelection]);

  // 브러쉬 선택 도구를 처리하는 함수
  const handleBrushSelect = useCallback(() => {
    resetSelection();

    if (!drawCanvas.current) return; // drawCanvas.current가 null인지 확인

    if (drawType !== 'FREE_DRAW') {
      setDrawType('FREE_DRAW');
      drawCanvas.current.isDrawingMode = true;

      const brush = new fabric.PencilBrush(drawCanvas.current);
      brush.width = penWidth;
      brush.color = DEFAULT_COLOR;

      drawCanvas.current.freeDrawingBrush = brush;
    } else {
      setDrawType('NONE');
      drawCanvas.current.isDrawingMode = false;
    }
  }, [setDrawType, drawCanvas, penWidth, drawType, resetSelection]);

  // 객체 선택 도구를 처리하는 함수
  const handleObjectSelect = useCallback(() => {
    resetSelection();

    if (!drawCanvas.current) return; // drawCanvas.current가 null인지 확인

    if (drawType !== 'OBJECT_SELECT') {
      setDrawType('OBJECT_SELECT');
      drawCanvas.current.isDrawingMode = false;
      drawCanvas.current.selection = true;

      drawCanvas.current.forEachObject((obj) => {
        obj.selectable = true;
        obj.evented = true;

        obj.on('mousedown', function () {
          if (drawCanvas.current) {
            // drawCanvas.current가 null인지 다시 확인
            drawCanvas.current.defaultCursor = 'move';
          }
        });

        obj.setControlsVisibility({
          mt: true,
          mb: true,
          ml: true,
          mr: true,
          bl: true,
          br: true,
          tl: true,
          tr: true,
          mtr: true
        });

        obj.set({
          hoverCursor: 'move',
          cornerStyle: 'circle',
          cornerColor: 'blue',
          borderColor: 'blue',
          cornerSize: 12,
          transparentCorners: false,
          rotatingPointOffset: 20
        });
      });

      drawCanvas.current.on('selection:cleared', function () {
        if (drawCanvas.current) {
          // drawCanvas.current가 null인지 다시 확인
          drawCanvas.current.defaultCursor = 'default';
        }
      });
    } else {
      setDrawType('NONE');
      if (drawCanvas.current) {
        // drawCanvas.current가 null인지 확인
        drawCanvas.current.selection = false;
        drawCanvas.current.defaultCursor = 'default';
      }
    }
  }, [setDrawType, drawCanvas, drawType, resetSelection]);

  // 적용 버튼을 눌렀을 때의 처리 함수
  const handleApply = useCallback(() => {
    if (drawCanvas.current) {
      const canvasWidth = drawCanvas.current.getWidth();
      const canvasHeight = drawCanvas.current.getHeight();
      const zoom = drawCanvas.current.getZoom();

      // 최종 결과를 렌더링하기 위한 오프스크린 캔버스를 생성
      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = canvasWidth;
      offscreenCanvas.height = canvasHeight;
      const offscreenCtx = offscreenCanvas.getContext('2d');

      // 최종 결합 이미지를 위한 캔버스 생성
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = canvasWidth;
      finalCanvas.height = canvasHeight;
      const finalCtx = finalCanvas.getContext('2d');

      if (offscreenCtx && finalCtx) {
        // 오프스크린 캔버스를 지움
        offscreenCtx.clearRect(0, 0, canvasWidth, canvasHeight);
        finalCtx.clearRect(0, 0, canvasWidth, canvasHeight);

        // 현재 줌 레벨을 임시로 적용
        offscreenCtx.scale(zoom, zoom);

        // fabric 캔버스를 오프스크린 캔버스에 렌더링
        drawCanvas.current.renderAll();

        // 객체를 복제하고 오프스크린 캔버스에 렌더링
        const objects = drawCanvas.current.getObjects();

        objects.forEach(async (obj) => {
          const clone = await obj.clone(); // clone이 비동기 함수이므로 await 필요

          // 각 객체를 오프스크린 컨텍스트에 렌더링
          clone.set({
            globalCompositeOperation: 'source-over'
          });

          // 클론을 오프스크린 컨텍스트에 렌더링
          clone.render(offscreenCtx);
        });

        // 배경 이미지를 처리
        const backgroundImg = drawCanvas.current.backgroundImage as fabric.Image;
        if (backgroundImg) {
          const backgroundImgUrl = backgroundImg.getSrc();

          const img = new Image();
          img.onload = () => {
            // 배경 이미지를 먼저 그림
            finalCtx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

            // 투명 객체들을 그 위에 그림
            finalCtx.drawImage(offscreenCanvas, 0, 0);

            // 최종 캔버스를 데이터 URL로 변환하여 저장
            const finalImageDataUrl = finalCanvas.toDataURL('image/png');
            setMaskingResult(finalImageDataUrl); // 배경 이미지와 투명 객체를 결합한 이미지를 저장

            // 이제 오프스크린 캔버스를 흑백 변환 준비
            const imageData = offscreenCtx.getImageData(0, 0, canvasWidth, canvasHeight);
            const data = imageData.data;

            // 모든 픽셀을 순회하며 투명도에 따라 색상 변경
            for (let i = 0; i < data.length; i += 4) {
              const alpha = data[i + 3];

              if (alpha === 0) {
                // 완전히 투명: 검은색으로 변경
                data[i] = 0; // 빨간색
                data[i + 1] = 0; // 초록색
                data[i + 2] = 0; // 파란색
                data[i + 3] = 255; // 완전 불투명
              } else {
                // 불투명: 흰색으로 변경
                data[i] = 255; // 빨간색
                data[i + 1] = 255; // 초록색
                data[i + 2] = 255; // 파란색
                data[i + 3] = 255; // 완전 불투명
              }
            }

            // 수정된 이미지 데이터를 캔버스에 다시 넣음
            offscreenCtx.putImageData(imageData, 0, 0);

            // 오프스크린 캔버스를 데이터 URL로 변환하여 저장
            const canvasDataUrl = offscreenCanvas.toDataURL('image/png');
            setCanvasDownloadUrl(canvasDataUrl); // 흑백 버전을 저장 (투명 = 검은색, 색상 = 흰색)

            // `setImageDownloadUrl`을 `setCanvasDownloadUrl`의 가로세로 크기에 맞춰 변형
            const transformedImgCanvas = document.createElement('canvas');
            transformedImgCanvas.width = canvasWidth;
            transformedImgCanvas.height = canvasHeight;
            const transformedImgCtx = transformedImgCanvas.getContext('2d');

            if (transformedImgCtx) {
              transformedImgCtx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
              const transformedImgUrl = transformedImgCanvas.toDataURL('image/png');
              setImageDownloadUrl(transformedImgUrl);
            }
          };
          img.src = backgroundImgUrl;
        } else {
          // 배경 이미지가 없을 경우 투명 배경에 객체들만 저장
          const finalImageDataUrl = offscreenCanvas.toDataURL('image/png');
          setMaskingResult(finalImageDataUrl); // 캔버스 결과를 마스킹 결과로 저장
          setCanvasDownloadUrl(finalImageDataUrl); // 캔버스 다운로드 URL 업데이트
          setImageDownloadUrl(finalImageDataUrl); // 동일한 이미지 URL 설정
        }

        onClose(); // 모달을 닫음
      }
    }
  }, [drawCanvas, setCanvasDownloadUrl, setImageDownloadUrl, setMaskingResult, onClose]);

  // 캔버스를 초기화하는 함수
  const handleClearCanvasClick = useCallback(() => {
    if (!drawCanvas.current) return; // drawCanvas.current가 null인지 확인

    const background = drawCanvas.current.backgroundImage;

    drawCanvas.current.clear();
    drawCanvas.current.backgroundImage = background; // setBackgroundImage 대신 backgroundImage 속성을 직접 설정
    drawCanvas.current.renderAll(); // 변경 사항을 캔버스에 반영

    setLassos([]);
    setActiveIndex({ lassoIndex: -1, pointIndex: -1 });
    handleBrushSelect(); // Clear 후 브러쉬 모드 선택
  }, [drawCanvas, setLassos, setActiveIndex, handleBrushSelect]);

  // 펜 크기를 변경하는 함수
  const handlePenWidthChange = useCallback(
    (value: number | null) => {
      // number | null 타입을 처리할 수 있도록 수정
      if (value !== null) {
        setPenWidth(value);
        if (drawCanvas.current && drawCanvas.current.isDrawingMode && drawCanvas.current.freeDrawingBrush) {
          drawCanvas.current.freeDrawingBrush.width = value;
        }
      }
    },
    [setPenWidth, drawCanvas]
  );

  return (
    <Modal
      open={true}
      onCancel={onClose}
      footer={null} // 기본 푸터 제거하여 추가 버튼 방지
      width="90vw"
      style={{ top: 20 }} // 필요한 경우 위치 조정을 위한 인라인 스타일 사용
      styles={{ body: { height: '85vh', padding: 0 } }} // Body 스타일로 높이 조정 포함
    >
      <div className="h-[85vh] flex flex-col">
        <div className="flex-1 flex justify-center items-center overflow-hidden">
          <canvas ref={canvasRef} className="border border-gray-300 max-w-full max-h-full" />
        </div>
        <div className="h-[60px] flex items-center px-8" style={{ flexShrink: 0 }}>
          {' '}
          {/* 하단 도구 영역 고정 높이 및 좌우 여백 */}
          <div className="flex items-center mr-8">
            <p className="text-[16px] mr-2">Brush Size:</p>
            <Slider
              min={1}
              max={50}
              step={1}
              value={penWidth}
              onChange={handlePenWidthChange}
              style={{ width: 200, marginRight: 10 }}
            />
            <InputNumber
              min={1}
              max={50}
              step={1}
              value={penWidth}
              onChange={handlePenWidthChange}
              style={{ width: 80 }}
            />
          </div>
          <Tooltip title="Brush">
            <Button
              icon={<IoBrush className="w-[20px] h-[20px]" />}
              onClick={handleBrushSelect}
              type={drawType === 'FREE_DRAW' ? 'primary' : 'default'}
              className="ml-4 p-2 flex items-center justify-center"
            />
          </Tooltip>
          <Tooltip title="Polygon">
            <Button
              icon={<PiPolygonBold className="w-[20px] h-[20px]" />}
              onClick={handlePolygonSelect}
              type={drawType === 'LASSO_DRAW' ? 'primary' : 'default'}
              className="ml-4 p-2 flex items-center justify-center"
            />
          </Tooltip>
          <Tooltip title="Select">
            <Button
              icon={<GrSelect className="w-[20px] h-[20px]" />}
              onClick={handleObjectSelect}
              type={drawType === 'OBJECT_SELECT' ? 'primary' : 'default'}
              className="ml-4 p-2 flex items-center justify-center"
            />
          </Tooltip>
          <Button key="clear" onClick={handleClearCanvasClick} className="ml-auto text-[16px] w-[80px] h-[35px]">
            Clear
          </Button>
          <Button key="apply" type="primary" onClick={handleApply} className="ml-2 text-[16px] w-[80px] h-[35px]">
            Apply
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default InpaintingModal;
