FROM node:18-alpine
WORKDIR /app

COPY package*.json ./
# 如果有 package-lock.json 就会用 npm ci；否则用 npm install
RUN npm ci || npm install

COPY . .

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["npm","start"]
