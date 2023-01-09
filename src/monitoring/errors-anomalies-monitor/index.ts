import * as cdk from 'aws-cdk-lib'
import {DatadogMonitor} from '@worldcoin/cdk/monitoring/monitor'
import {DatadogMetric} from '@worldcoin/cdk/monitoring/metric'
import {MonitorType} from '@worldcoin/cdk/monitoring/monitor/types'
import {Construct} from 'constructs'

export class ErrorsAnomaliesMonitor extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: {
      readonly apiKeySecret: cdk.aws_secretsmanager.ISecret
      readonly appKeySecret: cdk.aws_secretsmanager.ISecret
      readonly stackId: string
    },
  ) {
    super(scope, id)
    const app = this.node.tryGetContext('app')
    const env = this.node.tryGetContext('stage') || this.node.tryGetContext('env:id')
    const service = props.stackId.toLocaleLowerCase()
    const metricId = `consumer_backend_error_and_warn_logs_${service}.count`.replaceAll('-', '_')

    const logsMetric = new DatadogMetric(this, `ErrorLogsMetric-${service}`, {
      metric: {
        attributes: {
          compute: {aggregation_type: 'count'},
          filter: {query: `env:${env} service:${service} app:${app} status:(error OR warn)`},
        },

        id: metricId,
        type: 'logs_metrics',
      },

      apiKeySecret: props.apiKeySecret,
      applicationKeySecret: props.appKeySecret,
    })

    new DatadogMonitor(this, `ErrorsAnomaliesMonitor-${service}`, {
      Type: MonitorType.QUERY_ALERT,
      Tags: [`app:${app}`, `env:${env}`, `service:${service}`],
      Options: {Thresholds: {Critical: 1, CriticalRecovery: 0.8, Warning: 0.7, WarningRecovery: 0.1}},
      Query: `avg(last_1h):anomalies(avg:${metricId}{*}, 'agile', 3, direction='both', interval=20, alert_window='last_5m', count_default_zero='true', seasonality='weekly') >= 1`,
      Name: `Errors anomaly in "${service}"`,
      Message:
        'Observing unusual number of warns and errors in the service logs\n\n\n@slack-ottofeller-worldcoin-alerts',
    }).node.addDependency(logsMetric)
  }
}
