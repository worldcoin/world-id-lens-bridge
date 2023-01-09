import * as cdk from 'aws-cdk-lib'
import * as route53 from 'aws-cdk-lib/aws-route53'

export type PlatformProps = {
  readonly zone: route53.IHostedZone
  readonly albSubdomain: string
  readonly vpcCidr: string
  readonly vpcNatType: 'DEDICATED' | 'SHARED'
  readonly logsRemovalPolicy: cdk.RemovalPolicy
  readonly logsInfrequentAccessTransition: cdk.Duration
  readonly logsGlacierTransition: cdk.Duration
}
