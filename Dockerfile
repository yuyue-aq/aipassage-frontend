######### 运维文件，开发时请不要删除 ##########
FROM node:24-alpine AS builder

ARG vue_source_path=.

WORKDIR /app

COPY ${vue_source_path}/package*.json ./

# 安装依赖
RUN npm config set registry https://mirrors.cloud.tencent.com/npm/ \
    && npm install

# 复制源代码
COPY ${vue_source_path} .

# 构建生产版本
RUN npm run build

FROM caddy:2.10.2

COPY --from=builder /app/dist /srv

# 复制自定义 caddy 配置
COPY ./Caddyfile /srv/Caddyfile

WORKDIR /srv

EXPOSE 80

CMD ["caddy", "run"]
