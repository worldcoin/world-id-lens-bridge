import {DatadogMonitor} from '@worldcoin/cdk/monitoring/monitor'
import {MonitorType} from '@worldcoin/cdk/monitoring/monitor/types'
import {Construct} from 'constructs'

export class CriticalsMonitor extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: {
      readonly stackId: string
    },
  ) {
    super(scope, id)
    const app = this.node.tryGetContext('app')
    const env = this.node.tryGetContext('stage') || this.node.tryGetContext('env:id')
    const service = props.stackId

    const monitorBasicProperties = {
      Type: MonitorType.LOG_ALERT,
      Tags: [`app:${app}`, `env:${env}`, `service:${service}`],
      Options: {Thresholds: {Critical: 5, Warning: 3}},
    }

    // ANCHOR Vested/verified users ratio monitor
    new DatadogMonitor(this, id, {
      ...monitorBasicProperties,
      Query: `logs("env:${env} service:${service} status:critical").index("*").rollup("count").last("5m") > 5`,
      Name: `Increased number of criticals in "${service}"`,
      Message: '{{value}} criticals in the past 5 minutes\n\n\n@slack-ottofeller-worldcoin-alerts',
    })
  }
}
