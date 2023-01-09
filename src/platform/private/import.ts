import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as elb2 from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import * as kms from 'aws-cdk-lib/aws-kms'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as s3 from 'aws-cdk-lib/aws-s3'
import {IConstruct} from 'constructs'

import {Base} from './base'

export class Import extends Base {
  public readonly zone: route53.IHostedZone
  public readonly logsBucket: s3.IBucket
  public readonly vpc: ec2.IVpc
  public readonly alb: elb2.IApplicationLoadBalancer
  public readonly listener: elb2.IApplicationListener

  public constructor(scope: IConstruct, id: string, params: {readonly prefix: string}) {
    super(scope, id)

    const attrs = Import.attributes.import(params)

    this.zone = route53.HostedZone.fromHostedZoneAttributes(this, 'Zone', {
      hostedZoneId: attrs.ZoneId,
      zoneName: attrs.ZoneName,
    })

    this.logsBucket = s3.Bucket.fromBucketAttributes(this, 'Bucket', {
      bucketName: attrs.LogsBucketName,
      encryptionKey: kms.Key.fromKeyArn(this, 'BucketKey', attrs.LogsBucketKeyArn),
    })

    this.vpc = ec2.Vpc.fromVpcAttributes(this, 'Vpc', {
      vpcId: attrs.VpcId,
      vpcCidrBlock: attrs.VpcCidr,
      availabilityZones: [attrs.VpcAz1, attrs.VpcAz2, attrs.VpcAz3],
      publicSubnetIds: [attrs.VpcPublicSubnetId1, attrs.VpcPublicSubnetId2, attrs.VpcPublicSubnetId3],
      privateSubnetIds: [attrs.VpcPrivateSubnetId1, attrs.VpcPrivateSubnetId2, attrs.VpcPrivateSubnetId3],
      isolatedSubnetIds: [attrs.VpcIsolatedSubnetId1, attrs.VpcIsolatedSubnetId2, attrs.VpcIsolatedSubnetId3],
      publicSubnetRouteTableIds: [
        attrs.VpcPublicRouteTableId1,
        attrs.VpcPublicRouteTableId2,
        attrs.VpcPublicRouteTableId3,
      ],
      privateSubnetRouteTableIds: [
        attrs.VpcPrivateRouteTableId1,
        attrs.VpcPrivateRouteTableId2,
        attrs.VpcPrivateRouteTableId3,
      ],
      isolatedSubnetRouteTableIds: [
        attrs.VpcIsolatedRouteTableId1,
        attrs.VpcIsolatedRouteTableId2,
        attrs.VpcIsolatedRouteTableId3,
      ],
    })

    this.alb = elb2.ApplicationLoadBalancer.fromApplicationLoadBalancerAttributes(this, 'Alb', {
      loadBalancerArn: attrs.AlbArn,
      loadBalancerDnsName: attrs.AlbDnsName,
      loadBalancerCanonicalHostedZoneId: attrs.AlbCanonicalHostedZoneId,
      securityGroupId: attrs.AlbSecurityGroupId,
      securityGroupAllowsAllOutbound: false,
      vpc: this.vpc,
    })

    this.listener = elb2.ApplicationListener.fromApplicationListenerAttributes(this, 'Listener', {
      defaultPort: 443,
      listenerArn: attrs.ListenerArn,
      securityGroup: this.alb.connections.securityGroups[0],
    })
  }
}
