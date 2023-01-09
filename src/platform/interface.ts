import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as elb2 from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as s3 from 'aws-cdk-lib/aws-s3'
import {IConstruct} from 'constructs'

export interface IPlatform extends IConstruct {
  readonly zone: route53.IHostedZone
  readonly logsBucket: s3.IBucket
  readonly vpc: ec2.IVpc
  readonly alb: elb2.IApplicationLoadBalancer
  readonly listener: elb2.IApplicationListener
}
