import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Card, Divider, message, Spin } from 'antd';
import {
  BarChartOutlined,
  CheckCircleOutlined,
  CrownOutlined,
  FileTextOutlined,
  LineChartOutlined,
  ReloadOutlined,
  RiseOutlined,
  TeamOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import * as echarts from 'echarts';
import type { ECharts, EChartsOption } from 'echarts';
import { getStatisticsUsingGet } from '@/services/backend/statisticsController';
import './index.less';

const StatisticsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<API.StatisticsVO | null>(null);
  const trendChartRef = useRef<HTMLDivElement | null>(null);
  const userChartRef = useRef<HTMLDivElement | null>(null);
  const quotaChartRef = useRef<HTMLDivElement | null>(null);
  const trendChart = useRef<ECharts | null>(null);
  const userChart = useRef<ECharts | null>(null);
  const quotaChart = useRef<ECharts | null>(null);

  const renderTrendChart = useCallback(() => {
    if (!trendChartRef.current || !stats) return;
    if (!trendChart.current) {
      trendChart.current = echarts.init(trendChartRef.current);
    }

    const option: EChartsOption = {
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: ['今日', '本周', '本月', '总计'],
        axisLine: { lineStyle: { color: '#E2E8F0' } },
        axisLabel: { color: '#64748B' },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#F1F5F9' } },
        axisLabel: { color: '#64748B' },
      },
      series: [
        {
          name: '创作数量',
          type: 'bar',
          data: [stats.todayCount ?? 0, stats.weekCount ?? 0, stats.monthCount ?? 0, stats.totalCount ?? 0],
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#4ADE80' },
              { offset: 1, color: '#22C55E' },
            ]),
            borderRadius: [4, 4, 0, 0],
          },
          barWidth: '40%',
        },
      ],
    };

    trendChart.current.setOption(option);
  }, [stats]);

  const renderUserChart = useCallback(() => {
    if (!userChartRef.current || !stats) return;
    if (!userChart.current) {
      userChart.current = echarts.init(userChartRef.current);
    }

    const option: EChartsOption = {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: {
        orient: 'vertical',
        right: '10%',
        top: 'center',
        textStyle: { color: '#64748B' },
      },
      series: [
        {
          name: '用户分布',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
          data: [
            { value: stats.vipUserCount ?? 0, name: 'VIP 会员', itemStyle: { color: '#22C55E' } },
            { value: stats.activeUserCount ?? 0, name: '活跃用户', itemStyle: { color: '#3B82F6' } },
            {
              value:
                (stats.totalUserCount ?? 0) -
                (stats.activeUserCount ?? 0) -
                (stats.vipUserCount ?? 0),
              name: '其他用户',
              itemStyle: { color: '#94A3B8' },
            },
          ],
        },
      ],
    };

    userChart.current.setOption(option);
  }, [stats]);

  const renderQuotaChart = useCallback(() => {
    if (!quotaChartRef.current || !stats) return;
    if (!quotaChart.current) {
      quotaChart.current = echarts.init(quotaChartRef.current);
    }

    const totalQuota = (stats.totalUserCount ?? 0) * 5;
    const usedQuota = stats.quotaUsed ?? 0;
    const remainingQuota = Math.max(0, totalQuota - usedQuota);

    const option: EChartsOption = {
      tooltip: { trigger: 'item' },
      series: [
        {
          name: '配额统计',
          type: 'pie',
          radius: '70%',
          center: ['50%', '50%'],
          data: [
            { value: usedQuota, name: '已使用', itemStyle: { color: '#EF4444' } },
            { value: remainingQuota, name: '剩余', itemStyle: { color: '#22C55E' } },
          ],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
          label: { formatter: '{b}: {c}' },
        },
      ],
    };

    quotaChart.current.setOption(option);
  }, [stats]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getStatisticsUsingGet();
      setStats(res?.data || null);
      setTimeout(() => {
        renderTrendChart();
        renderUserChart();
        renderQuotaChart();
      }, 100);
    } catch (error: any) {
      message.error(error?.message || '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleResize = () => {
      trendChart.current?.resize();
      userChart.current?.resize();
      quotaChart.current?.resize();
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      trendChart.current?.dispose();
      userChart.current?.dispose();
      quotaChart.current?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="statistics-page">
      <div className="page-header">
        <div className="header-container">
          <div className="header-content">
            <h1 className="page-title">数据分析</h1>
            <p className="page-subtitle">系统运营数据概览</p>
          </div>
          <Button onClick={loadData} loading={loading} className="refresh-btn" icon={<ReloadOutlined />}>
            刷新数据
          </Button>
        </div>
      </div>

      <div className="container">
        <Spin spinning={loading} tip="加载中...">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
                <FileTextOutlined style={{ color: 'var(--color-primary)' }} />
              </div>
              <div className="stat-content">
                <div className="stat-label">今日创作</div>
                <div className="stat-value">{stats?.todayCount ?? 0}</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                <BarChartOutlined style={{ color: '#3B82F6' }} />
              </div>
              <div className="stat-content">
                <div className="stat-label">本周创作</div>
                <div className="stat-value">{stats?.weekCount ?? 0}</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(168, 85, 247, 0.1)' }}>
                <RiseOutlined style={{ color: '#A855F7' }} />
              </div>
              <div className="stat-content">
                <div className="stat-label">本月创作</div>
                <div className="stat-value">{stats?.monthCount ?? 0}</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(234, 179, 8, 0.1)' }}>
                <CheckCircleOutlined style={{ color: '#EAB308' }} />
              </div>
              <div className="stat-content">
                <div className="stat-label">成功率</div>
                <div className="stat-value">{(stats?.successRate ?? 0).toFixed(1)}%</div>
              </div>
            </div>
          </div>

          <div className="charts-grid">
            <Card bordered={false} className="chart-card">
              <h3 className="chart-title">
                <LineChartOutlined />
                创作趋势
              </h3>
              <div ref={trendChartRef} className="chart-container" />
            </Card>

            <Card bordered={false} className="chart-card">
              <h3 className="chart-title">
                <ThunderboltOutlined />
                性能统计
              </h3>
              <div className="performance-stats">
                <div className="perf-item">
                  <span className="perf-label">平均耗时</span>
                  <span className="perf-value">
                    {stats?.avgDurationMs && stats.avgDurationMs >= 1000
                      ? `${(stats.avgDurationMs / 1000).toFixed(1)}s`
                      : `${stats?.avgDurationMs ?? 0}ms`}
                  </span>
                </div>
                <Divider />
                <div className="perf-item">
                  <span className="perf-label">总创作数</span>
                  <span className="perf-value">{stats?.totalCount ?? 0}</span>
                </div>
              </div>
            </Card>
          </div>

          <div className="charts-grid">
            <Card bordered={false} className="chart-card">
              <h3 className="chart-title">
                <TeamOutlined />
                用户分析
              </h3>
              <div ref={userChartRef} className="chart-container" />
            </Card>

            <Card bordered={false} className="chart-card">
              <h3 className="chart-title">
                <CrownOutlined />
                配额使用情况
              </h3>
              <div ref={quotaChartRef} className="chart-container" />
            </Card>
          </div>
        </Spin>
      </div>
    </div>
  );
};

export default StatisticsPage;

