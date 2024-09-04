import { Typography, Row, Col, Divider, Checkbox, Input } from 'antd';

const { Title, Text } = Typography;

const PresetContent = () => {
  return (
    <div className="p-4">
      <Title level={4}>Preset settings</Title>
      <Text type="secondary">
        The following settings will be saved in the preset. If you would like a setting to be editable, deselect them in
        the list below.
      </Text>

      <Input placeholder="Enter preset name" className="mb-4" />

      <Divider />

      <Row gutter={[16, 16]} className="mt-4">
        {/* 왼쪽 열 */}
        <Col span={12}>
          <div>
            <Checkbox>
              <Text strong>Model</Text>
            </Checkbox>
            <br />
            <Text type="secondary">Stable Diffusion v1-5</Text>
          </div>
          <div className="mt-3">
            <Checkbox>
              <Text strong>Width</Text>
            </Checkbox>
            <br />
            <Text type="secondary">512</Text>
          </div>
          <div className="mt-3">
            <Checkbox>
              <Text strong>Height</Text>
            </Checkbox>
            <br />
            <Text type="secondary">512</Text>
          </div>
          <div className="mt-3">
            <Checkbox>
              <Text strong>Guidance Scale</Text>
            </Checkbox>
            <br />
            <Text type="secondary">7.5</Text>
          </div>
          <div className="mt-3">
            <Checkbox>
              <Text strong>Sampling Steps</Text>
            </Checkbox>
            <br />
            <Text type="secondary">50</Text>
          </div>
          <div className="mt-3">
            <Checkbox>
              <Text strong>Seed</Text>
            </Checkbox>
            <br />
            <Text type="secondary">-1</Text>
          </div>
        </Col>

        {/* 오른쪽 열 */}
        <Col span={12}>
          <div>
            <Checkbox>
              <Text strong>Prompt</Text>
            </Checkbox>
            <br />
            <Text type="secondary">Generate a high-resolution image of a defective metal product with ...</Text>
          </div>
          <div className="mt-3">
            <Checkbox>
              <Text strong>Negative Prompt</Text>
            </Checkbox>
            <br />
            <Text type="secondary">Do not include any smooth, undamaged surfaces, pristine ...</Text>
          </div>
          <div className="mt-3">
            <Checkbox>
              <Text strong>Batch Count</Text>
            </Checkbox>
            <br />
            <Text type="secondary">1</Text>
          </div>
          <div className="mt-3">
            <Checkbox>
              <Text strong>Batch Size</Text>
            </Checkbox>
            <br />
            <Text type="secondary">1</Text>
          </div>
          <div className="mt-3">
            <Checkbox>
              <Text strong>Sampling Method</Text>
            </Checkbox>
            <br />
            <Text type="secondary">DPM++ 2M</Text>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default PresetContent;
