import * as cdk from 'aws-cdk-lib'
import {NagSuppressions} from 'cdk-nag'
import {Construct} from 'constructs'
import {MonitorProps} from './types'

export class DatadogMonitor extends Construct {
  constructor(scope: Construct, id: string, props: MonitorProps) {
    super(scope, id)

    // Needs to activate manually cloud formation public extension "arn:aws:cloudformation:us-east-1::type/resource/7171b96e5d207b947eb72ca9ce05247c246de623/Datadog-Monitors-Monitor"
    new cdk.CfnResource(this, `${id}Monitor`, {
      type: 'Datadog::Monitors::Monitor',
      properties: props,
    })

    NagSuppressions.addResourceSuppressions(this, [{id: 'AwsSolutions-IAM4', reason: 'Allow access'}], true)

    NagSuppressions.addResourceSuppressions(
      this,
      [
        {
          appliesTo: ['Resource::*'],
          id: 'AwsSolutions-IAM5',
          reason: 'DatadogMonitor can not be applied to a certain resource and thus is applied to [Resource::*].',
        },
      ],
      true,
    )
  }
}
