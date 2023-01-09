import * as cdk from 'aws-cdk-lib'
import {Size} from 'aws-cdk-lib'
import {NagSuppressions} from 'cdk-nag'
import {LambdaFunction} from '@worldcoin/cdk/lambda/lambda-function'
import {Construct} from 'constructs'
import {Architecture} from 'aws-cdk-lib/aws-lambda'

export class ScheduledLambdaTask extends Construct {
  public readonly lambda: cdk.aws_lambda_nodejs.NodejsFunction

  constructor(
    scope: Construct,
    id: string,
    props: {
      readonly functionName?: string
      readonly multiEnvFunctionName?: string
      readonly service?: string
      readonly environment: Record<string, string>
      readonly options?: {
        architecture?: Architecture
        memorySize?: Size
        timeout?: cdk.Duration
        reservedConcurrentExecutions?: number
      }
      readonly path: string
      readonly schedule: cdk.aws_events.Schedule
      readonly staticPosthogSecret?: cdk.aws_secretsmanager.ISecret
      readonly vpc?: cdk.aws_ec2.IVpc
    },
  ) {
    super(scope, id)

    this.lambda = new LambdaFunction(this, `${id}ScheduledLambda`, {
      architecture: props.options?.architecture || Architecture.X86_64,
      functionName: props.multiEnvFunctionName
      ? props.multiEnvFunctionName +
        (scope.node.tryGetContext('stage') === 'dev' ? `-${scope.node.tryGetContext('env:id')}` : '')
      : props.functionName,

      memorySize: props.options?.memorySize?.toMebibytes() ?? 2048,
      timeout: props.options?.timeout ?? cdk.Duration.minutes(5),
      entry: require.resolve(props.path),
      environment: props.environment,
      service: props.service,

      // TODO Make VPC deployment optional
      // The lambda needs to request hasura from within private subnet
      vpc: props.vpc,

      ...(props.options?.reservedConcurrentExecutions
        ? {reservedConcurrentExecutions: props.options?.reservedConcurrentExecutions}
        : {}),
    })

    const eventRule = new cdk.aws_events.Rule(this, `schedule-${id}`, {
      schedule: props.schedule,
      enabled: Boolean(props.schedule),
    })

    eventRule.addTarget(new cdk.aws_events_targets.LambdaFunction(this.lambda))

    NagSuppressions.addResourceSuppressions(
      this.lambda,
      [
        {id: 'AwsSolutions-IAM4', reason: 'Lambda role purposely using AWS managed policies'},
        {
          appliesTo: ['Resource::*'],
          id: 'AwsSolutions-IAM5',
          reason: 'Lambda logs permission is applied to [Resource::*].',
        },
      ],
      true,
    )
  }
}
