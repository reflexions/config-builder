FROM node:lts as base

WORKDIR /workspace
ENV NODE_ENV=production

COPY package.json yarn.lock ./

RUN yarn install \
	--frozen-lockfile \
	--non-interactive

COPY . .


# =================================================
FROM base as eslint

ENV NODE_ENV=development

RUN $(yarn bin)/eslint .


# =================================================
FROM base as circular-dependency-check

RUN $(yarn bin)/madge --circular ./ConfigBuilder.mjs
