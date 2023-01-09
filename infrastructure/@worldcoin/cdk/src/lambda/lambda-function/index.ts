import * as cdk from 'aws-cdk-lib'
import {NagSuppressions} from 'cdk-nag'
import {Construct} from 'constructs'
import {Datadog} from 'datadog-cdk-constructs-v2'

export class LambdaFunction extends cdk.aws_lambda_nodejs.NodejsFunction {
  constructor(
    scope: Construct,
    id: string,
    props: cdk.aws_lambda_nodejs.NodejsFunctionProps & {service?: string; multiEnvFunctionName?: string},
  ) {
    const {service, multiEnvFunctionName, bundling = {}, ...lambdaProps} = props

    const functionName = multiEnvFunctionName
      ? multiEnvFunctionName +
        (scope.node.tryGetContext('stage') === 'dev' ? `-${scope.node.tryGetContext('env:id')}` : '')
      : lambdaProps.functionName

    super(scope, id, {
      runtime: cdk.aws_lambda.Runtime.NODEJS_16_X,
      bundling: {
        target: 'node16.15', // version from lambda runtime
        minify: true,
        sourceMap: true,
        externalModules: ['aws-sdk', 'pg-native'],
        sourcesContent: false,
        ...bundling,
      },
      tracing: cdk.aws_lambda.Tracing.ACTIVE,
      insightsVersion: cdk.aws_lambda.LambdaInsightsVersion.VERSION_1_0_135_0,
      ...lambdaProps,
      functionName, //NOTE - Should be under <lambdaProps>
    })

    this.addEnvironment('NODE_OPTIONS', '--enable-source-maps --experimental-abortcontroller --experimental-fetch')
    this.addEnvironment('DEPLOYMENT_ENV', this.node.tryGetContext('env').id)
    const stack = cdk.Stack.of(scope)

    const datadogSecret = cdk.aws_secretsmanager.Secret.fromSecretCompleteArn(
      this,
      'DatadogSecret',
      this.node.tryGetContext('dataDogApiKeySecretArn'),
    )

    // REVIEW Try to deploy a single DataDog layer, will probably require set up the service property
    // at the level of lambda envs — DD_SERVICE
    const datadog = new Datadog(stack, `${id}Datadog`, {
      apiKeySecretArn: datadogSecret.secretFullArn,
      env: this.node.tryGetContext('env').id,
      captureLambdaPayload: true,
      extensionLayerVersion: 27,
      injectLogContext: true,
      logLevel: 'warn',
      nodeLayerVersion: 81, // https://github.com/DataDog/datadog-lambda-js/releases
      service,
      tags: `app:${this.node.tryGetContext('app')}`,
    })

    datadog.addLambdaFunctions([this])
    datadogSecret.grantRead(this)

    NagSuppressions.addResourceSuppressions(
      this,
      [
        {
          id: 'AwsSolutions-IAM4',
          reason: 'Lambda purposely uses AWS managed policies',
        },
      ],
      true,
    )
  }
}
