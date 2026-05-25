export default [
  {
    path: '/',
    component: '@/layouts/BasicLayout',
    routes: [
      { path: '/', component: './HomePage', name: '首页' },
      { path: '/create', component: './article/ArticleCreatePage', name: '创作文章' },
      { path: '/article/list', component: './article/ArticleListPage', name: '文章列表' },
      { path: '/article/:taskId', component: './article/ArticleDetailPage', name: '文章详情' },
      { path: '/vip', component: './VipPage', name: '会员购买' },
      { path: '/user/login', component: './User/UserLoginPage', name: '用户登录' },
      { path: '/user/register', component: './User/UserRegisterPage', name: '用户注册' },
      { path: '/admin/userManage', component: './Admin/UserManagePage', access: 'canAdmin', name: '用户管理' },
      { path: '/admin/statistics', component: './Admin/StatisticsPage', access: 'canAdmin', name: '数据分析' },
      { path: '*', component: './404' },
    ],
  },
];
