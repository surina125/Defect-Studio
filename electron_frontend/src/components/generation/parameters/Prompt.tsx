import { useState } from 'react';
import { RiSparkling2Fill } from 'react-icons/ri';
import { MdImageSearch } from 'react-icons/md';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { Input, Checkbox, Button, Modal, Tooltip } from 'antd';

const { TextArea } = Input;

const Prompt = () => {
  const [negativePrompt, setNegativePrompt] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [promptText, setPromptText] = useState('');
  const level = useSelector((state: RootState) => state.level) as 'Basic' | 'Advanced';

  const dummyData =
    'a man riding a horse on a planet, britsh propaganda poster, 2001 a space odissey, heraldry, pop surrealism, reddit vexilology, digital science diction realism, tres detaille, moon mission, imperial portrait, nationalist';
  const phrases = dummyData.split(', ');

  const handlePhraseClick = (phrase: string) => {
    setPromptText((prev) => (prev ? `${prev}, ${phrase}` : phrase));
  };

  const handleModalOk = () => {
    setIsModalVisible(false);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPromptText(e.target.value);
  };

  return (
    <div className="w-full p-6 bg-white rounded-[20px] shadow-md mx-auto border border-gray-300 dark:bg-gray-600 dark:border-none">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-left text-[#222] dark:text-gray-200">Prompt</p>
        </div>

        {level === 'Advanced' && (
          <Checkbox
            checked={negativePrompt}
            onChange={() => setNegativePrompt(!negativePrompt)}
            className="text-[14px] text-left text-[#464646]"
          >
            Add Negative Prompt
          </Checkbox>
        )}
      </div>

      <div className="relative mb-4">
        <TextArea
          rows={4}
          className="pr-10"
          placeholder="Enter your prompt here..."
          value={promptText}
          onChange={handlePromptChange}
        />
        {window.location.pathname !== '/generation/text-to-image' && (
          <Tooltip title="Uploaded image is converted to a text description to assist in prompt creation.">
            <Button
              type="link"
              className="absolute bottom-2 right-2 dark:text-gray-300"
              icon={<MdImageSearch className="text-xl" />}
              onClick={() => setIsModalVisible(true)}
            />
          </Tooltip>
        )}
      </div>

      {level === 'Advanced' && negativePrompt && (
        <>
          <p className="text-sm text-left text-[#222] mb-2 dark:text-gray-300">Negative Prompt</p>
          <TextArea rows={4} className="mb-4" placeholder="Enter your negative prompt here..." />
        </>
      )}

      <div className="flex justify-end">
        <Button type="primary" icon={<RiSparkling2Fill className="mr-2" />} shape="round" size="large">
          Generate
        </Button>
      </div>

      <Modal title="Select Inputs" open={isModalVisible} onOk={handleModalOk} onCancel={handleModalCancel}>
        <div className="flex flex-wrap gap-2">
          {phrases.map((phrase, index) => (
            <Button
              key={index}
              type={promptText.includes(phrase) ? 'primary' : 'default'}
              onClick={() => handlePhraseClick(phrase)}
            >
              {phrase}
            </Button>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default Prompt;
