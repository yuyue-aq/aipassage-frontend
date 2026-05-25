import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Input, message } from 'antd';
import { CheckOutlined, CrownOutlined, DeleteOutlined, PlusOutlined, RobotOutlined } from '@ant-design/icons';
import Sortable from 'sortablejs';
import { Link, useModel } from '@umijs/max';
import { aiModifyOutlineUsingPost } from '@/services/backend/articleController';
import { isVip as checkIsVip } from '@/utils/permission';
import './OutlineEditingStage.less';

interface OutlineSection {
  section: number;
  title: string;
  points: string[];
}

interface OutlineEditingStageProps {
  outline: API.OutlineSection[];
  taskId: string;
  loading?: boolean;
  onConfirm: (outline: OutlineSection[]) => void;
}

const OutlineEditingStage: React.FC<OutlineEditingStageProps> = ({ outline, taskId, loading = false, onConfirm }) => {
  const { initialState } = useModel('@@initialState');
  const isVip = useMemo(() => checkIsVip(initialState?.currentUser), [initialState?.currentUser]);
  const [outlineSections, setOutlineSections] = useState<OutlineSection[]>([]);
  const [modifySuggestion, setModifySuggestion] = useState('');
  const [aiModifying, setAiModifying] = useState(false);
  const outlineListRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setOutlineSections(
      outline.map((item, index) => ({
        section: item.section ?? index + 1,
        title: item.title ?? '',
        points: item.points ?? [],
      })),
    );
  }, [outline]);

  useEffect(() => {
    if (!outlineListRef.current) return;
    const sortable = Sortable.create(outlineListRef.current, {
      animation: 150,
      handle: '.drag-handle',
      onEnd: (evt) => {
        const { oldIndex, newIndex } = evt;
        if (oldIndex === undefined || newIndex === undefined) return;
        setOutlineSections((prev) => {
          const updated = [...prev];
          const [item] = updated.splice(oldIndex, 1);
          updated.splice(newIndex, 0, item);
          return updated.map((sectionItem, idx) => ({
            ...sectionItem,
            section: idx + 1,
          }));
        });
      },
    });

    return () => {
      sortable.destroy();
    };
  }, []);

  const canConfirm = useMemo(
    () =>
      outlineSections.length > 0 &&
      outlineSections.every(
        (section) => section.title.trim() && section.points.length > 0 && section.points.every((point) => point.trim()),
      ),
    [outlineSections],
  );

  const addSection = () => {
    setOutlineSections((prev) => [
      ...prev,
      {
        section: prev.length + 1,
        title: '',
        points: [''],
      },
    ]);
  };

  const deleteSection = (index: number) => {
    setOutlineSections((prev) =>
      prev
        .filter((_, idx) => idx !== index)
        .map((section, idx) => ({
          ...section,
          section: idx + 1,
        })),
    );
  };

  const addPoint = (sectionIndex: number) => {
    setOutlineSections((prev) => {
      const updated = [...prev];
      updated[sectionIndex].points = [...updated[sectionIndex].points, ''];
      return updated;
    });
  };

  const deletePoint = (sectionIndex: number, pointIndex: number) => {
    setOutlineSections((prev) => {
      const updated = [...prev];
      if (updated[sectionIndex].points.length > 1) {
        updated[sectionIndex].points = updated[sectionIndex].points.filter((_, idx) => idx !== pointIndex);
      }
      return updated;
    });
  };

  const updateSectionTitle = (sectionIndex: number, value: string) => {
    setOutlineSections((prev) => {
      const updated = [...prev];
      updated[sectionIndex].title = value;
      return updated;
    });
  };

  const updatePoint = (sectionIndex: number, pointIndex: number, value: string) => {
    setOutlineSections((prev) => {
      const updated = [...prev];
      const points = [...updated[sectionIndex].points];
      points[pointIndex] = value;
      updated[sectionIndex].points = points;
      return updated;
    });
  };

  const handleAiModify = async () => {
    if (!modifySuggestion.trim()) {
      message.warning('请输入修改建议');
      return;
    }

    setAiModifying(true);
    try {
      const res = await aiModifyOutlineUsingPost({
        taskId,
        modifySuggestion,
      });
      if (res?.data) {
        setOutlineSections(
          res.data.map((item, index) => ({
            section: item.section ?? index + 1,
            title: item.title ?? '',
            points: item.points ?? [],
          })),
        );
        setModifySuggestion('');
        message.success('AI 已根据您的建议修改大纲');
      }
    } catch (error: any) {
      message.error(error?.message || 'AI 修改失败');
    } finally {
      setAiModifying(false);
    }
  };

  return (
    <div className="outline-editing-stage">
      <div className="stage-header">
        <h2 className="stage-title">编辑文章大纲</h2>
        <p className="stage-subtitle">您可以编辑、调整章节顺序，或添加新章节</p>
      </div>

      <div className="outline-list" ref={outlineListRef}>
        {outlineSections.map((section, index) => (
          <div key={section.section} className="outline-section" data-section-id={section.section}>
            <div className="section-header">
              <span className="drag-handle" title="拖动排序">
                ⋮⋮
              </span>
              <span className="section-number">{index + 1}</span>
              <Input
                value={section.title}
                onChange={(event) => updateSectionTitle(index, event.target.value)}
                placeholder="章节标题"
                className="section-title-input"
              />
              <Button type="text" danger onClick={() => deleteSection(index)} className="delete-btn">
                <DeleteOutlined />
              </Button>
            </div>

            <div className="section-points">
              {section.points.map((point, pointIdx) => (
                <div key={pointIdx} className="point-item">
                  <span className="point-bullet">•</span>
                  <Input
                    value={point}
                    onChange={(event) => updatePoint(index, pointIdx, event.target.value)}
                    placeholder="要点内容"
                    className="point-input"
                  />
                  <Button type="text" size="small" onClick={() => deletePoint(index, pointIdx)} className="delete-point-btn">
                    ×
                  </Button>
                </div>
              ))}
              <Button type="dashed" onClick={() => addPoint(index)} className="add-point-btn" icon={<PlusOutlined />}>
                添加要点
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className={`ai-chat-section${isVip ? '' : ' vip-only'}`}>
        <div className="chat-header">
          <RobotOutlined />
          <span>AI 助手修改大纲</span>
          {!isVip && (
            <span className="vip-badge-small">
              <CrownOutlined />
              VIP
            </span>
          )}
        </div>
        {isVip ? (
          <div className="chat-input-wrapper">
            <Input.TextArea
              value={modifySuggestion}
              onChange={(event) => setModifySuggestion(event.target.value)}
              placeholder="告诉 AI 如何修改大纲，例如：请在第二章节后增加一个关于实践案例的章节"
              rows={3}
              maxLength={500}
              showCount
              className="chat-textarea"
            />
            <Button
              type="primary"
              loading={aiModifying}
              disabled={!modifySuggestion.trim()}
              onClick={handleAiModify}
              className="ai-modify-btn"
              icon={<RobotOutlined />}
            >
              AI 修改大纲
            </Button>
          </div>
        ) : (
          <div className="vip-upgrade-notice">
            <CrownOutlined className="vip-icon" />
            <p>AI 修改大纲功能仅限 VIP 会员使用</p>
            <Link to="/vip" className="upgrade-btn">
              立即升级 VIP
            </Link>
          </div>
        )}
      </div>

      <div className="actions">
        <Button size="large" onClick={addSection} className="add-section-btn" icon={<PlusOutlined />}>
          添加章节
        </Button>

        <Button
          type="primary"
          size="large"
          loading={loading}
          disabled={!canConfirm}
          onClick={() => onConfirm(outlineSections)}
          className="confirm-btn"
          icon={<CheckOutlined />}
        >
          确认并生成正文
        </Button>
      </div>
    </div>
  );
};

export default OutlineEditingStage;

