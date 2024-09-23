import { Row, Col, Button } from 'antd';
import TrainingParams from './trainingStartTab/TrainingParams';
import CurrentTrainings from './trainingStartTab/CurrentTrainings';

interface TrainingStartTabProps {
  trainProgress: { name: string; progress: number }[];
  handleStopTraining: (modelName: string) => void;
}

const TrainingStartTab = ({ trainProgress, handleStopTraining }: TrainingStartTabProps) => {
  return (
    <Row gutter={40}>
      <Col xs={24} lg={18}>
        <div className="bg-white p-4 rounded-lg shadow-lg h-full border border-gray-300 overflow-hidden dark:bg-gray-600 dark:border-none">
          <TrainingParams />
          <div className="mt-4 flex justify-end">
            <Button type="primary">Start Training</Button>
          </div>
        </div>
      </Col>

      {/* Training Progress only visible on larger screens */}
      <Col xs={0} lg={6}>
        <CurrentTrainings trainProgress={trainProgress} handleStopTraining={handleStopTraining} />
      </Col>
    </Row>
  );
};

export default TrainingStartTab;
