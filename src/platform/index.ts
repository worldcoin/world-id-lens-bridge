import * as cdk from 'aws-cdk-lib'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as elb2 from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as route53targets from 'aws-cdk-lib/aws-route53-targets'
import * as s3 from 'aws-cdk-lib/aws-s3'
import {IConstruct} from 'constructs'

import {Base} from './private/base'
import {Import} from './private/import'
import {IPlatform} from './interface'
import {PlatformProps} from './props'

export * from './interface'
export * from './props'

export class Platform extends Base {
  public static fromExportedAttributes(
    scope: cdk.Stack,
    id: string,
    params: {
      readonly prefix: string
    },
  ): IPlatform {
    return new Import(scope, id, params)
  }

  public readonly zone: route53.IHostedZone
  public readonly logsBucket: s3.Bucket
  public readonly vpc: ec2.Vpc
  public readonly alb: elb2.ApplicationLoadBalancer
  public readonly listener: elb2.ApplicationListener

  public constructor(scope: IConstruct, id: string, props: PlatformProps) {
    super(scope, id)

    // ANCHOR Zone
    this.zone = route53.HostedZone.fromHostedZoneAttributes(this, 'Zone', {
      zoneName: props.zone.zoneName,
      hostedZoneId: props.zone.hostedZoneId,
    })

    // ANCHOR LogsBucket
    this.logsBucket = new s3.Bucket(this, id, {
      encryption: s3.BucketEncryption.KMS,
      enforceSSL: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: props.logsRemovalPolicy,
    })

    this.logsBucket.addLifecycleRule({
      abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
      transitions: [
        {storageClass: s3.StorageClass.INFREQUENT_ACCESS, transitionAfter: props.logsInfrequentAccessTransition},
        {storageClass: s3.StorageClass.GLACIER, transitionAfter: props.logsGlacierTransition},
      ],
    })

    // ANCHOR Vpc
    this.vpc = new ec2.Vpc(this, id, {
      cidr: props.vpcCidr,
      availabilityZones: cdk.Stack.of(this).availabilityZones.slice(0, 3),
      natGateways: {DEDICATED: 3, SHARED: 1}[props.vpcNatType],
      subnetConfiguration: [
        {cidrMask: 18, subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, name: ec2.SubnetType.PRIVATE_WITH_EGRESS},
        {cidrMask: 20, subnetType: ec2.SubnetType.PUBLIC, name: ec2.SubnetType.PUBLIC},
        {cidrMask: 22, subnetType: ec2.SubnetType.PRIVATE_ISOLATED, name: ec2.SubnetType.PRIVATE_ISOLATED},
      ],
    })

    this.vpc.addFlowLog('FlowLogS3', {
      destination: ec2.FlowLogDestination.toS3(this.logsBucket, this.vpc.node.path),
    })

    // ANCHOR Alb
    this.alb = new elb2.ApplicationLoadBalancer(this, 'Alb', {
      internetFacing: true,
      vpc: this.vpc,
    })

    const albRecord = new route53.ARecord(this, 'AlbRecord', {
      recordName: `${props.albSubdomain}.${this.zone.zoneName}`,
      zone: this.zone,
      target: route53.RecordTarget.fromAlias(new route53targets.LoadBalancerTarget(this.alb)),
    })

    const albCertificate = new acm.Certificate(this, 'AlbCertificate', {
      domainName: albRecord.domainName,
      validation: acm.CertificateValidation.fromDns(this.zone),
    })

    // ANCHOR Listener
    this.listener = new elb2.ApplicationListener(this, 'Listener', {
      loadBalancer: this.alb,
      protocol: elb2.ApplicationProtocol.HTTPS,
      certificates: [albCertificate],
      defaultAction: elb2.ListenerAction.fixedResponse(404, {messageBody: 'No route.'}),
    })
  }
}
