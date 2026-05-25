import React, { useMemo, useState } from 'react';
import { Button, Input, Radio } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import './TitleSelectingStage.less';

export interface TitleOption {
  mainTitle: string;
  subTitle: string;
}

interface TitleSelectingStageProps {
  titleOptions: TitleOption[];
  loading?: boolean;
  onConfirm: (data: { mainTitle: string; subTitle: string; userDescription: string }) => void;
}

const TitleSelectingStage: React.FC<TitleSelectingStageProps> = ({
  titleOptions,
  loading = false,
  onConfirm,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [customMainTitle, setCustomMainTitle] = useState('');
  const [customSubTitle, setCustomSubTitle] = useState('');
  const [userDescription, setUserDescription] = useState('');

  const canConfirm = useMemo(() => {
    if (selectedIndex === -1) {
      return customMainTitle.trim() && customSubTitle.trim();
    }
    return selectedIndex >= 0 && selectedIndex < titleOptions.length;
  }, [customMainTitle, customSubTitle, selectedIndex, titleOptions.length]);

  const handleConfirm = () => {
    let mainTitle = '';
    let subTitle = '';

    if (selectedIndex === -1) {
      mainTitle = customMainTitle;
      subTitle = customSubTitle;
    } else {
      const selected = titleOptions[selectedIndex];
      mainTitle = selected.mainTitle;
      subTitle = selected.subTitle;
    }

    onConfirm({
      mainTitle,
      subTitle,
      userDescription,
    });
  };

  return (
    <div className="title-selecting-stage">
      <div className="stage-header">
        <h2 className="stage-title">选择标题方案</h2>
        <p className="stage-subtitle">AI 为您生成了以下标题，请选择一个或自定义</p>
      </div>

      <Radio.Group value={selectedIndex} onChange={(e) => setSelectedIndex(e.target.value)} className="title-options">
        {titleOptions.map((option, index) => (
          <div key={index} className="title-option">
            <Radio value={index}>
              <div className="title-content">
                <div className="title-main">{option.mainTitle}</div>
                <div className="title-sub">{option.subTitle}</div>
              </div>
            </Radio>
          </div>
        ))}
        <div className="title-option custom">
          <Radio value={-1}>
            <div className="title-content">
              <div className="title-main">自定义标题</div>
            </div>
          </Radio>
          {selectedIndex === -1 && (
            <div className="custom-inputs">
              <Input
                value={customMainTitle}
                onChange={(event) => setCustomMainTitle(event.target.value)}
                placeholder="输入主标题"
                className="custom-input"
              />
              <Input
                value={customSubTitle}
                onChange={(event) => setCustomSubTitle(event.target.value)}
                placeholder="输入副标题"
                className="custom-input"
              />
            </div>
          )}
        </div>
      </Radio.Group>

      <div className="description-section">
        <label className="section-label">补充描述（可选）</label>
        <p className="section-tip">补充您对文章的期望、重点强调的内容等</p>
        <Input.TextArea
          value={userDescription}
          onChange={(event) => setUserDescription(event.target.value)}
          placeholder="例如：请重点强调技术原理，用通俗的语言讲解..."
          rows={4}
          maxLength={500}
          showCount
          className="description-textarea"
        />
      </div>

      <div className="actions">
        <Button
          type="primary"
          size="large"
          loading={loading}
          disabled={!canConfirm}
          onClick={handleConfirm}
          className="confirm-btn"
        >
          <CheckOutlined />
          确认并生成大纲
        </Button>
      </div>
    </div>
  );
};

export default TitleSelectingStage;

