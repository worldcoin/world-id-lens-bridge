# base lambda image
FROM public.ecr.aws/lambda/nodejs:16

USER root
RUN mkdir -p /opt
WORKDIR /tmp

#
# tools
#

RUN yum update -y \
    && yum -y groupinstall "Development Tools" \
    && yum install -y python3 python3-pip
RUN npm config set python "/usr/bin/python3"

#
# install nodejs dependencies
#

RUN mkdir -p /opt/nodejs
COPY package*.json .npmrc test.js /opt/nodejs/
RUN cd /opt/nodejs && npm ci && rm -rf ./node_modules/**/prebuilds && npm test && rm package*.json .npmrc test.js

#
# create the bundle
#

RUN cd /opt \
    && zip -9 --symlinks -r ../layer.zip * \
    && echo "/layer.zip is ready" \
    && ls -alh /layer.zip;

WORKDIR /
ENTRYPOINT [ "/bin/bash" ]
