import * as org from '@worldcoin/cdk/org'
import * as cdk from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as elb2 from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as s3 from 'aws-cdk-lib/aws-s3'
import {Construct} from 'constructs'

import {IPlatform} from '../interface'

export abstract class Base extends Construct implements IPlatform {
  protected static attributes = new org.Attributes<IPlatform>({
    ZoneId: (p) => p.zone.hostedZoneId,
    ZoneName: (p) => p.zone.zoneName,
    LogsBucketName: (p) => p.logsBucket.bucketName,
    LogsBucketKeyArn: (p) => p.logsBucket.encryptionKey!.keyArn,
    VpcId: (p) => p.vpc.vpcId,
    VpcCidr: (p) => p.vpc.vpcCidrBlock,
    VpcAz1: (p) => p.vpc.availabilityZones[0],
    VpcAz2: (p) => p.vpc.availabilityZones[1],
    VpcAz3: (p) => p.vpc.availabilityZones[2],
    VpcPublicSubnetId1: (p) => p.vpc.publicSubnets[0].subnetId,
    VpcPublicSubnetId2: (p) => p.vpc.publicSubnets[1].subnetId,
    VpcPublicSubnetId3: (p) => p.vpc.publicSubnets[2].subnetId,
    VpcPrivateSubnetId1: (p) => p.vpc.privateSubnets[0].subnetId,
    VpcPrivateSubnetId2: (p) => p.vpc.privateSubnets[1].subnetId,
    VpcPrivateSubnetId3: (p) => p.vpc.privateSubnets[2].subnetId,
    VpcIsolatedSubnetId1: (p) => p.vpc.isolatedSubnets[0].subnetId,
    VpcIsolatedSubnetId2: (p) => p.vpc.isolatedSubnets[1].subnetId,
    VpcIsolatedSubnetId3: (p) => p.vpc.isolatedSubnets[2].subnetId,
    VpcPublicRouteTableId1: (p) => p.vpc.publicSubnets[0].routeTable.routeTableId,
    VpcPublicRouteTableId2: (p) => p.vpc.publicSubnets[1].routeTable.routeTableId,
    VpcPublicRouteTableId3: (p) => p.vpc.publicSubnets[2].routeTable.routeTableId,
    VpcPrivateRouteTableId1: (p) => p.vpc.privateSubnets[0].routeTable.routeTableId,
    VpcPrivateRouteTableId2: (p) => p.vpc.privateSubnets[1].routeTable.routeTableId,
    VpcPrivateRouteTableId3: (p) => p.vpc.privateSubnets[2].routeTable.routeTableId,
    VpcIsolatedRouteTableId1: (p) => p.vpc.isolatedSubnets[0].routeTable.routeTableId,
    VpcIsolatedRouteTableId2: (p) => p.vpc.isolatedSubnets[1].routeTable.routeTableId,
    VpcIsolatedRouteTableId3: (p) => p.vpc.isolatedSubnets[2].routeTable.routeTableId,
    AlbArn: (p) => p.alb.loadBalancerArn,
    AlbDnsName: (p) => p.alb.loadBalancerDnsName,
    AlbCanonicalHostedZoneId: (p) => p.alb.loadBalancerCanonicalHostedZoneId,
    AlbSecurityGroupId: (p) => p.alb.connections.securityGroups[0].securityGroupId,
    ListenerArn: (p) => p.listener.listenerArn,
  })

  public abstract readonly zone: route53.IHostedZone
  public abstract readonly logsBucket: s3.IBucket
  public abstract readonly vpc: ec2.IVpc
  public abstract readonly alb: elb2.IApplicationLoadBalancer
  public abstract readonly listener: elb2.IApplicationListener

  public exportAttributes(params: {readonly stack: cdk.Stack; readonly prefix: string}): void {
    Base.attributes.export({
      stack: params.stack,
      prefix: params.prefix,
      source: this,
    })
  }
}
