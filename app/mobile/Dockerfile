FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

ARG EXPO_PUBLIC_API_URL=http://localhost:8000
ENV EXPO_PUBLIC_API_URL=${EXPO_PUBLIC_API_URL}
ENV CI=1

EXPOSE 8081

CMD ["npx", "expo", "start", "--host", "lan", "--port", "8081"]
