import layerLockfile from './layer/package-lock.json'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import {Construct} from 'constructs'
import {createHash} from 'crypto'
import * as path from 'path'

// An AWS Lambda layer that includes the NPM dependencies `node-ffi` and `ref-napi`.
export class NodeFfiLayer extends lambda.LayerVersion {
  constructor(scope: Construct, id: string) {
    super(scope, id, {
      code: lambda.Code.fromAsset(path.join(__dirname, 'layer.zip'), {
        // we hash the package-lock.json (it contains versions) because hashing the zip is non-deterministic
        assetHash: createHash('sha256').update(JSON.stringify(layerLockfile)).digest('hex'),
      }),
      description: '/opt/nodejs/node_modules/node-ffi',
    })
  }
}
