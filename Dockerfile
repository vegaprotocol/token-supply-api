FROM mhart/alpine-node:16

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY *.js ./

EXPOSE 8080
CMD [ "node", "index.js" ]
