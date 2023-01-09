import * as cdk from 'aws-cdk-lib'
import {Construct} from 'constructs'

// REVIEW The stack is provisioned for each task definition, revisit **the budget** and resources
// unnecessary created multiple times

// Augment the service with logging properties and spin up DataDog agent
export class DatadogAgent extends cdk.NestedStack {
  constructor(
    scope: Construct,
    id: string,
    props: cdk.NestedStackProps & {
      readonly taskDefinition: cdk.aws_ecs.TaskDefinition
      readonly dataDogApiKeySecret: cdk.aws_secretsmanager.ISecret
    },
  ) {
    super(scope, id, props)
    const logging = cdk.aws_ecs.LogDrivers.awsLogs({streamPrefix: 'operator-app'})

    // FIXME confusingly adds container to the parent scope
    props.taskDefinition.addContainer('datadog', {
      image: cdk.aws_ecs.ContainerImage.fromRegistry('public.ecr.aws/datadog/agent:latest'),
      essential: true,

      environment: {
        DD_SITE: 'datadoghq.com',
        DD_APM_NON_LOCAL_TRAFFIC: 'true',
        ECS_FARGATE: 'true',
        DD_APM_ENABLED: 'true',
      },

      secrets: {DD_API_KEY: cdk.aws_ecs.Secret.fromSecretsManager(props.dataDogApiKeySecret)},
      portMappings: [{containerPort: 8126, hostPort: 8126}],
      logging,
    })

    new cdk.aws_ecs.FirelensLogRouter(this, 'LogRouter', {
      containerName: 'log-router',
      firelensConfig: {type: cdk.aws_ecs.FirelensLogRouterType.FLUENTBIT},
      taskDefinition: props.taskDefinition,
      image: cdk.aws_ecs.ContainerImage.fromRegistry('amazon/aws-for-fluent-bit:stable'),
      essential: true,
      logging,
    })
  }
}
