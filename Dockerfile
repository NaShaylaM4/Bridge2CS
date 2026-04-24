FROM node:22-bookworm

WORKDIR /app

RUN apt-get update && apt-get install -y r-base && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

RUN Rscript -e "install.packages(c('dplyr','jsonlite'), repos='https://cloud.r-project.org')"

COPY . .

ENV RSCRIPT_BIN=Rscript
ENV PORT=4000

EXPOSE 4000

CMD ["node", "server.js"]