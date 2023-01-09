#!/bin/bash
set -euo pipefail

cd $(dirname $0)

echo ">> Building AWS Lambda layer inside a docker image for ffi-napi and ref-napi..."

TAG='aws-lambda-node-ffi-napi'
export DOCKER_SCAN_SUGGEST=false
docker build --progress plain -t ${TAG} .

echo ">> Extrating layer.zip from the build container..."
CONTAINER=$(docker run -d ${TAG} false)
mkdir -p ../lib
docker cp ${CONTAINER}:/layer.zip ../lib/layer.zip

echo ">> Stopping container..."
docker rm -f ${CONTAINER}
echo ">> lib/layer.zip is ready"
