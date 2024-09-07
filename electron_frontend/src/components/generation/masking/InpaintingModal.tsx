import React, { useState, useRef, useEffect } from 'react';
import { Modal, Button, Slider } from 'antd';
import { Stage, Layer, Line, Image as KonvaImage, Circle } from 'react-konva';
import useImage from 'use-image';
import Konva from 'konva';

interface InpaintingModalProps {
  onClose: () => void;
  imageSrc: string;
}

interface LineObject {
  tool: 'brush' | 'polygon';
  points: number[];
  strokeWidth?: number; // 브러쉬 크기 저장
  fill?: string; // 폴리곤의 색상을 지정
}

const InpaintingModal: React.FC<InpaintingModalProps> = ({ onClose, imageSrc }) => {
  const [tool, setTool] = useState<'brush' | 'polygon' | 'select' | null>(null); // 현재 선택된 도구
  const [isMovingPoints, setIsMovingPoints] = useState(false); // 꼭짓점 이동 모드
  const [brushSize, setBrushSize] = useState<number>(5); // 브러쉬 크기
  const [objects, setObjects] = useState<LineObject[]>([]); // 브러쉬나 폴리곤 객체 저장
  const [undoStack, setUndoStack] = useState<LineObject[][]>([]); // undo stack
  const [redoStack, setRedoStack] = useState<LineObject[][]>([]); // redo stack
  const [polygonPoints, setPolygonPoints] = useState<{ x: number; y: number }[]>([]);
  const [isPolygonComplete, setIsPolygonComplete] = useState(false); // 폴리곤이 닫혔는지 여부
  const [selectedObjectIndex, setSelectedObjectIndex] = useState<number | null>(null); // 선택된 객체 인덱스
  const isDrawing = useRef(false);

  const stageRef = useRef<Konva.Stage | null>(null);
  const stageWidth = 512;
  const stageHeight = 512;

  const [image] = useImage(imageSrc);

  // 작업 변경을 저장하는 함수
  const saveState = (newObjects: LineObject[]) => {
    setUndoStack([...undoStack, objects]); // 현재 상태를 undo 스택에 저장
    setRedoStack([]); // 새로운 작업이 추가되면 redo 스택 초기화
    setObjects(newObjects);
  };

  // Undo (되돌리기)
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previousState = undoStack.pop();
    if (previousState) {
      setRedoStack([objects, ...redoStack]); // 현재 상태를 redo 스택에 저장
      setObjects(previousState);
      setUndoStack([...undoStack]); // pop 이후 undoStack 업데이트
    }
  };

  // Redo (다시 실행)
  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const nextState = redoStack.shift();
    if (nextState) {
      setUndoStack([...undoStack, objects]); // 현재 상태를 undo 스택에 저장
      setObjects(nextState);
      setRedoStack([...redoStack]); // shift 이후 redoStack 업데이트
    }
  };

  // 폴리곤 클릭 처리
  const handlePolygonClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (tool === 'polygon') {
      const pos = e.target.getStage()?.getPointerPosition();
      if (!pos) return;

      setPolygonPoints([...polygonPoints, pos]); // 새 점 추가

      // 첫 점과 새 점이 근접할 경우 폴리곤을 닫고 저장
      if (
        polygonPoints.length > 0 &&
        Math.abs(pos.x - polygonPoints[0].x) < 10 &&
        Math.abs(pos.y - polygonPoints[0].y) < 10
      ) {
        const polygonPointsFlat = polygonPoints.flatMap((p) => [p.x, p.y]);
        saveState([...objects, { tool: 'polygon', points: polygonPointsFlat, fill: 'rgba(135, 206, 235, 0.5)' }]); // 객체로 저장하고 상태 저장
        setPolygonPoints([]); // 그리기 완료 후 초기화
        setIsPolygonComplete(true); // 폴리곤이 닫혔음을 표시
      } else {
        setIsPolygonComplete(false); // 폴리곤이 아직 닫히지 않았음을 표시
      }
    }
  };

  // 폴리곤 꼭짓점 드래그 처리
  const handlePointDrag = (e: Konva.KonvaEventObject<DragEvent>, objIndex: number, pointIndex: number) => {
    const newObjects = [...objects];
    const newPoints = [...newObjects[objIndex].points];
    newPoints[pointIndex * 2] = e.target.x(); // X 좌표 업데이트
    newPoints[pointIndex * 2 + 1] = e.target.y(); // Y 좌표 업데이트
    newObjects[objIndex] = { ...newObjects[objIndex], points: newPoints }; // 새로운 좌표로 업데이트
    saveState(newObjects); // 상태 저장
  };

  // 브러쉬 작업 처리
  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (tool === 'brush') {
      isDrawing.current = true;
      const pos = e.target.getStage()?.getPointerPosition();
      if (!pos) return;

      saveState([
        ...objects,
        { tool: 'brush', points: [pos.x, pos.y], strokeWidth: brushSize, fill: 'rgba(135, 206, 235, 0.5)' }
      ]); // 새 브러쉬 객체 추가
    }
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (tool === 'brush' && isDrawing.current) {
      const stage = e.target.getStage();
      const point = stage?.getPointerPosition();
      if (!point) return;

      const lastObject = objects[objects.length - 1];
      lastObject.points = lastObject.points.concat([point.x, point.y]);

      setObjects([...objects.slice(0, objects.length - 1), lastObject]); // 현재 그리는 브러쉬 객체 업데이트
    }
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  // 객체 선택 처리
  const handleObjectSelect = (index: number) => {
    if (tool === 'select') {
      setSelectedObjectIndex(index); // 객체 인덱스 설정
    }
  };

  // 객체 삭제 처리
  const deleteSelectedObject = () => {
    if (selectedObjectIndex !== null) {
      const newObjects = objects.filter((_, index) => index !== selectedObjectIndex); // 선택된 객체 삭제
      saveState(newObjects); // 상태 저장
      setSelectedObjectIndex(null); // 객체 선택 해제
    }
  };

  // 키보드 이벤트로 delete 키로 삭제하기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedObjectIndex !== null) {
        deleteSelectedObject();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown); // cleanup
    };
  }, [selectedObjectIndex, objects]);

  // 도구 선택 처리 및 상태 초기화
  const handleToolChange = (selectedTool: 'brush' | 'polygon' | 'select' | null) => {
    setTool(selectedTool);
    setIsMovingPoints(false); // 꼭짓점 이동 모드 비활성화
    setSelectedObjectIndex(null); // 객체 선택 해제
  };

  // Move Polygon Points 버튼 클릭 시 다른 도구 비활성화
  const handleMovePointsToggle = () => {
    setIsMovingPoints(!isMovingPoints);
    setTool(null); // 다른 도구는 비활성화
  };

  return (
    <Modal open={true} footer={null} width={600} closable={false}>
      <div className="p-4">
        {/* 도구 선택 버튼 */}
        <div className="flex mb-4 justify-center space-x-4">
          <Button
            onClick={() => handleToolChange('brush')}
            className={tool === 'brush' ? 'bg-blue-500 text-white' : ''}
          >
            Brush
          </Button>
          <Button
            onClick={() => handleToolChange('polygon')}
            className={tool === 'polygon' ? 'bg-blue-500 text-white' : ''}
          >
            Polygon
          </Button>
          <Button
            onClick={() => handleToolChange('select')}
            className={tool === 'select' ? 'bg-blue-500 text-white' : ''}
          >
            Select Object
          </Button>
          <Button onClick={handleMovePointsToggle} className={isMovingPoints ? 'bg-blue-500 text-white' : ''}>
            Move Polygon Points
          </Button>
        </div>

        {/* 브러쉬 크기 조절 슬라이더 */}
        {tool === 'brush' && (
          <div className="mb-4">
            <p>Brush Size:</p>
            <Slider
              min={1}
              max={20}
              defaultValue={brushSize}
              onChange={(value) => setBrushSize(value)}
              tooltipVisible
            />
          </div>
        )}

        {/* Undo / Redo 버튼 */}
        <div className="flex mb-4 justify-center space-x-4">
          <Button onClick={handleUndo} disabled={undoStack.length === 0}>
            Undo
          </Button>
          <Button onClick={handleRedo} disabled={redoStack.length === 0}>
            Redo
          </Button>
        </div>

        {/* Delete 버튼 */}
        {selectedObjectIndex !== null && (
          <div className="flex mb-4 justify-center">
            <Button onClick={deleteSelectedObject}>Delete Selected Object</Button>
          </div>
        )}

        {/* 이미지 및 작업 영역 */}
        <div className="flex justify-center">
          <Stage
            ref={stageRef}
            width={stageWidth}
            height={stageHeight}
            onMouseDown={handleMouseDown}
            onMousemove={handleMouseMove}
            onMouseup={handleMouseUp}
            onClick={handlePolygonClick} // 폴리곤 클릭 이벤트 처리
            className="border"
          >
            <Layer>
              {/* 이미지 렌더링 */}
              {image && <KonvaImage image={image} width={stageWidth} height={stageHeight} />}

              {/* 저장된 브러쉬 및 폴리곤 객체 렌더링 */}
              {objects.map((obj, objIndex) => (
                <React.Fragment key={objIndex}>
                  <Line
                    points={obj.points}
                    stroke={
                      // stroke는 여기에만 설정
                      selectedObjectIndex === objIndex
                        ? 'red'
                        : obj.tool === 'brush'
                          ? 'rgba(135, 206, 235, 0.5)'
                          : undefined
                    }
                    strokeWidth={obj.strokeWidth}
                    closed={obj.tool === 'polygon'}
                    fill={obj.tool === 'polygon' ? obj.fill : undefined}
                    lineCap="round"
                    onClick={() => handleObjectSelect(objIndex)} // 객체 선택 처리
                  />
                  {/* 꼭짓점 이동 모드일 때 점 렌더링 */}
                  {isMovingPoints &&
                    obj.tool === 'polygon' &&
                    obj.points.map((_, pointIndex) =>
                      pointIndex % 2 === 0 ? (
                        <Circle
                          key={pointIndex}
                          x={obj.points[pointIndex]}
                          y={obj.points[pointIndex + 1]}
                          radius={5}
                          fill="blue"
                          draggable
                          onDragMove={(e) => handlePointDrag(e, objIndex, pointIndex / 2)} // 드래그 처리
                        />
                      ) : null
                    )}
                </React.Fragment>
              ))}

              {/* 현재 진행 중인 폴리곤을 보여주는 점과 선 */}
              {polygonPoints.length > 0 && !isPolygonComplete && (
                <>
                  {/* 폴리곤 점 렌더링 */}
                  {polygonPoints.map((point, i) => (
                    <Circle key={i} x={point.x} y={point.y} radius={5} fill="blue" />
                  ))}

                  {/* 진행 중인 폴리곤 라인 렌더링 */}
                  <Line
                    points={polygonPoints.flatMap((p) => [p.x, p.y])}
                    stroke="blue"
                    strokeWidth={2}
                    dash={[10, 5]}
                    lineCap="round"
                  />
                </>
              )}
            </Layer>
          </Stage>
        </div>

        {/* 모달 닫기 및 인페인팅 시작 버튼 */}
        <div className="flex justify-between mt-4">
          <Button onClick={onClose}>Close</Button>
          <Button type="primary">Apply</Button>
        </div>
      </div>
    </Modal>
  );
};

export default InpaintingModal;
