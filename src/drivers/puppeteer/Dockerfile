FROM node:12-alpine

MAINTAINER Wappalyzer <info@wappalyzer.com>

ENV WAPPALYZER_ROOT /opt/wappalyzer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV CHROME_BIN /usr/bin/chromium-browser

RUN apk update && apk add --no-cache \
	nodejs \
	nodejs-npm \
  udev \
  chromium \
  ttf-freefont

RUN mkdir -p "$WAPPALYZER_ROOT/browsers"

WORKDIR "$WAPPALYZER_ROOT"

ADD apps.json .
ADD browser.js .
ADD browsers/zombie.js ./browsers
ADD browsers/puppeteer.js ./browsers
ADD cli.js .
ADD driver.js .
ADD index.js .
ADD package.json .
ADD wappalyzer.js .

RUN npm i && npm i puppeteer

RUN /usr/bin/chromium-browser --version

ENTRYPOINT ["node", "cli.js"]
