import * as cdk from 'aws-cdk-lib'
import {Construct} from 'constructs'
import {Monitors} from './monitors'

export class Monitoring extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,

    props: cdk.StackProps & {
      dataDogApiKeySecret: cdk.aws_secretsmanager.ISecret
      dataDogAppKeySecret: cdk.aws_secretsmanager.ISecret
    },
  ) {
    super(scope, id, props)
    cdk.Tags.of(this).add('service', id)

    new Monitors(this, 'Monitors', {
      dataDogApiKeySecret: props.dataDogApiKeySecret,
      dataDogAppKeySecret: props.dataDogAppKeySecret,
      serviceId: id,
    })
  }
}
