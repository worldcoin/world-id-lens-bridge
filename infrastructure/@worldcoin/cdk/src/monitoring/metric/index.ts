import * as cdk from 'aws-cdk-lib'
import {NagSuppressions} from 'cdk-nag'
import {Metric} from '@worldcoin/cdk/monitoring/metric/types'
import {LambdaFunction} from '@worldcoin/cdk/lambda/lambda-function'
import type {Construct} from 'constructs'

export class DatadogMetric extends cdk.CustomResource {
  public readonly id: string

  constructor(
    scope: Construct,
    id: string,
    props: {
      readonly metric: Metric
      readonly apiKeySecret: cdk.aws_secretsmanager.ISecret
      readonly applicationKeySecret: cdk.aws_secretsmanager.ISecret
    },
  ) {
    let provider = cdk.Stack.of(scope).node.tryFindChild('DatadogMetricResourceProvider') as
      | cdk.custom_resources.Provider
      | undefined

    if (!provider) {
      const onEventHandler = new LambdaFunction(cdk.Stack.of(scope), 'CreateOrUpdateDatadogMetricLambda', {
        entry: require.resolve('./provider.lambda.ts'),
        environment: {
          DD_API_KEY_ARN: props.apiKeySecret.secretArn,
          DD_APPLICATION_KEY_ARN: props.applicationKeySecret.secretArn,
        },
        timeout: cdk.Duration.minutes(1),
      })

      provider = new cdk.custom_resources.Provider(cdk.Stack.of(scope), 'DatadogMetricResourceProvider', {
        onEventHandler,
        logRetention: cdk.aws_logs.RetentionDays.FIVE_DAYS,
      })
    }

    super(scope, id, {
      resourceType: 'Custom::DatadogMetric',
      serviceToken: provider.serviceToken,
      properties: {metric: props.metric},
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    this.id = props.metric.id
    props.apiKeySecret.grantRead(provider.onEventHandler)
    props.applicationKeySecret.grantRead(provider.onEventHandler)

    NagSuppressions.addResourceSuppressions(
      cdk.Stack.of(scope),
      [
        {id: 'AwsSolutions-IAM4', reason: 'Lambda role purposely using AWS managed policies'},
        {
          appliesTo: ['Resource::*', 'Resource::<CreateOrUpdateDatadogMetricLambda7A1E8A96.Arn>:*'],
          id: 'AwsSolutions-IAM5',
          reason: 'Lambda logs permission is applied to [Resource::*].',
        },
      ],
      true,
    )
  }
}
