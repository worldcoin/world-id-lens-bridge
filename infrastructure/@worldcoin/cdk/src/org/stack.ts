import * as cdk from 'aws-cdk-lib'
import {IConstruct} from 'constructs'

export type StackProps = cdk.StackProps

/**
 * Stack
 *
 * Requires explicit account and region.
 * Provides three availability zones.
 * Fixes NestedStack logical ids.
 */
export class Stack extends cdk.Stack {
  public constructor(scope: IConstruct, id: string, props?: StackProps) {
    super(scope, id, props)

    if (cdk.Token.isUnresolved(this.account)) {
      throw new Error(`Stack "${this.node.path}" needs explicit account.`)
    }
    if (cdk.Token.isUnresolved(this.region)) {
      throw new Error(`Stack "${this.node.path}" needs explicit region.`)
    }
  }

  public override get availabilityZones(): string[] {
    return [`${this.region}a`, `${this.region}b`, `${this.region}c`]
  }

  public override getLogicalId(element: cdk.CfnElement): string {
    const logicalId = super.getLogicalId(element)

    if (element.node.id.endsWith('.NestedStackResource')) {
      const hash = logicalId.slice(-8)
      const sourceId = element.node.id.slice(0, -'.NestedStackResource'.length)

      return `${sourceId}${hash}`
    } else {
      return logicalId
    }
  }
}
