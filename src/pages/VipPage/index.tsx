import React, { useEffect, useMemo, useState } from 'react';
import { Button, message, Modal } from 'antd';
import {
  AppstoreOutlined,
  CheckCircleOutlined,
  CrownOutlined,
  EditOutlined,
  GiftOutlined,
  PictureOutlined,
  QuestionCircleOutlined,
  RocketOutlined,
  SafetyOutlined,
  StarOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useLocation, useModel, useNavigate } from '@umijs/max';
import { createVipPaymentSessionUsingPost } from '@/services/backend/paymentController';
import { getLoginUserUsingGet } from '@/services/backend/userController';
import { isVip as checkIsVip } from '@/utils/permission';
import './index.less';

const VipPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { initialState, setInitialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const [purchasing, setPurchasing] = useState(false);

  const isVip = useMemo(() => checkIsVip(currentUser), [currentUser]);

  const features = useMemo(
    () => [
      {
        icon: <RocketOutlined />,
        title: '无限创作配额',
        desc: '无限次使用文章创作功能，告别配额限制',
      },
      {
        icon: <PictureOutlined />,
        title: 'AI 智能生图',
        desc: '使用 Nano Banana AI 生成独特配图',
      },
      {
        icon: <AppstoreOutlined />,
        title: 'SVG 图表生成',
        desc: '自动生成精美的概念示意图和思维导图',
      },
      {
        icon: <EditOutlined />,
        title: 'AI 大纲编辑',
        desc: '使用 AI 助手快速优化文章大纲',
      },
      {
        icon: <StarOutlined />,
        title: '优先队列',
        desc: '享受更快的生成速度和优先服务',
      },
      {
        icon: <GiftOutlined />,
        title: '终身有效',
        desc: '一次购买，永久使用，无需续费',
      },
    ],
    [],
  );

  const pricingFeatures = useMemo(
    () => ['无限创作配额', '全部高级配图功能', 'AI 大纲智能编辑', '优先生成队列', '终身有效'],
    [],
  );

  const faqs = useMemo(
    () => [
      {
        question: '支付后多久生效？',
        answer: '支付成功后立即生效，您将立即获得永久会员权限，刷新页面即可看到变化。',
      },
      {
        question: '如何申请退款？',
        answer: '购买后 7 天内，如不满意可申请退款，退款后会员权限将被取消。',
      },
      {
        question: '会员是否需要续费？',
        answer: '不需要。永久会员一次购买，终身有效，无需任何续费。',
      },
      {
        question: '支付安全吗？',
        answer: '我们使用 Stripe 国际支付平台，全程加密传输，安全可靠。',
      },
    ],
    [],
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const success = params.get('success');
    const cancelled = params.get('cancelled');

    if (success === 'true') {
      (async () => {
        const res = await getLoginUserUsingGet();
        if (res?.data) {
          setInitialState({
            ...(initialState || {}),
            currentUser: res.data,
          });
        }
        Modal.success({
          title: '支付成功！',
          content: '恭喜您成为永久会员，已解锁全部高级功能！',
          okText: '开始创作',
          onOk: () => navigate('/create'),
        });
        navigate('/vip', { replace: true });
      })();
    } else if (cancelled === 'true') {
      message.info('支付已取消');
      navigate('/vip', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const handlePurchase = async () => {
    if (!currentUser?.id) {
      message.warning('请先登录');
      navigate('/user/login');
      return;
    }

    if (isVip) {
      message.info('您已经是永久会员');
      return;
    }

    setPurchasing(true);
    try {
      const res = await createVipPaymentSessionUsingPost();
      if (res?.data) {
        window.location.href = res.data;
      } else {
        message.error(res?.message || '创建支付失败');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('创建支付失败:', error);
      message.error('创建支付失败，请稍后重试');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="vip-page">
      <div className="vip-container">
        <div className="page-header">
          <div className="header-badge">
            <CrownOutlined />
            <span>会员专属</span>
          </div>
          <h1 className="page-title">升级永久会员</h1>
          <p className="page-subtitle">解锁全部高级功能，无限创作配额，终身有效</p>
        </div>

        <div className="main-section">
          <div className="pricing-card">
            <div className="pricing-badge">限时优惠</div>
            <div className="pricing-header">
              <div className="plan-icon">
                <CrownOutlined />
              </div>
              <h2 className="plan-name">永久会员</h2>
              <div className="price-display">
                <span className="currency">$</span>
                <span className="price">199</span>
                <span className="period">/永久</span>
              </div>
              <div className="original-price">
                <span className="original-label">原价</span>
                <span className="original-value">$299</span>
              </div>
            </div>

            <div className="pricing-divider" />

            <div className="pricing-features">
              {pricingFeatures.map((item) => (
                <div key={item} className="pricing-feature">
                  <CheckCircleOutlined className="feature-check" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <Button
              type="primary"
              size="large"
              loading={purchasing}
              disabled={isVip}
              onClick={handlePurchase}
              className="purchase-btn"
            >
              <ThunderboltOutlined />
              {isVip ? '您已是永久会员' : '立即升级'}
            </Button>

            <div className="security-notice">
              <SafetyOutlined />
              <span>安全支付 · 7天无理由退款</span>
            </div>
          </div>

          <div className="features-section">
            <h3 className="features-title">
              <GiftOutlined />
              会员特权
            </h3>
            <div className="features-grid">
              {features.map((feature) => (
                <div key={feature.title} className="feature-card">
                  <div className="feature-icon-wrapper">{feature.icon}</div>
                  <div className="feature-content">
                    <h4 className="feature-title">{feature.title}</h4>
                    <p className="feature-desc">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="faq-section">
          <div className="section-header">
            <QuestionCircleOutlined className="section-icon" />
            <h2 className="section-title">常见问题</h2>
          </div>
          <div className="faq-grid">
            {faqs.map((faq) => (
              <div key={faq.question} className="faq-card">
                <h4 className="faq-question">{faq.question}</h4>
                <p className="faq-answer">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VipPage;

