import {CriticalsMonitor} from '@worldcoin/cdk/monitoring/criticals-monitor'
import {ErrorsAnomaliesMonitor} from '@worldcoin/cdk/monitoring/errors-anomalies-monitor'
import * as cdk from 'aws-cdk-lib'
import {Construct} from 'constructs'

export class Monitors extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: {
      dataDogApiKeySecret: cdk.aws_secretsmanager.ISecret
      dataDogAppKeySecret: cdk.aws_secretsmanager.ISecret
      serviceId: string
    },
  ) {
    super(scope, id)

    new CriticalsMonitor(this, `CriticalsMonitor-${props.serviceId}`, {stackId: props.serviceId})

    new ErrorsAnomaliesMonitor(this, `ErrorsAnomaliesMonitor-${props.serviceId}`, {
      apiKeySecret: props.dataDogApiKeySecret,
      appKeySecret: props.dataDogAppKeySecret,
      stackId: props.serviceId,
    })
  }
}
