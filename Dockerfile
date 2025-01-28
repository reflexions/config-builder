FROM node:lts AS base

WORKDIR /workspace
ENV NODE_ENV=production

COPY package.json yarn.lock ./

RUN yarn install \
	--frozen-lockfile \
	--non-interactive

COPY . .


# =================================================
FROM base AS eslint

ENV NODE_ENV=development

RUN $(yarn bin)/eslint .


# =================================================
FROM base AS circular-dependency-check

RUN $(yarn bin)/madge --circular ./ConfigBuilder.mjs

# todo fix the circular reference found here:
#RUN $(yarn bin)/madge --circular ./plugin-sets/ReactSsrPlugin.mjs
