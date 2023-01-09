import * as cdk from 'aws-cdk-lib'
import {Monitoring} from 'monitoring'
export class App extends cdk.App {
  constructor(props: cdk.AppProps) {
    super(props)
    cdk.Tags.of(this).add('app', this.node.tryGetContext('app'))

    const stageName = this.node.tryGetContext('stage') || 'dev'
    const stageContext = this.node.tryGetContext(stageName)

    const dataDogApiKeySecret = cdk.aws_secretsmanager.Secret.fromSecretCompleteArn(
      this,
      'DatadogSecret',
      this.node.tryGetContext('dataDogApiKeySecretArn'),
    )

    const dataDogAppKeySecret = cdk.aws_secretsmanager.Secret.fromSecretCompleteArn(
      this,
      'DatadogAppKeySecret',
      this.node.tryGetContext('dataDogAppKeySecretArn'),
    )

    new Monitoring(this, 'monitoring', {
      env: stageContext.env,
      dataDogApiKeySecret: dataDogApiKeySecret,
      dataDogAppKeySecret: dataDogAppKeySecret,
    })
  }
}
