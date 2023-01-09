import type {CdkCustomResourceHandler} from 'aws-lambda'
import {SecretsManager} from 'aws-sdk'
import {createMetric} from './create'
import {deleteMetric} from './delete'
import {updateMetric} from './update'
const secretManager = new SecretsManager()

if (!process.env.DD_API_KEY_ARN) {
  throw new ReferenceError('Missing DD_API_KEY_ARN')
}

if (!process.env.DD_APPLICATION_KEY_ARN) {
  throw new ReferenceError('Missing DD_APP_KEY_ARN')
}

// Handler creates, updates or deletes Datadog logs metric
export const handler: CdkCustomResourceHandler = async (event) => {
  if (!event.ResourceProperties.metric) {
    throw new ReferenceError('Missing metric props')
  }

  const secrets = await Promise.all([
    secretManager.getSecretValue({SecretId: process.env.DD_API_KEY_ARN!}).promise(),
    secretManager.getSecretValue({SecretId: process.env.DD_APPLICATION_KEY_ARN!}).promise(),
  ])

  const [ddApiKey, ddApplicationKey] = secrets.map((secretResponse) => {
    if (secretResponse.$response.error) {
      throw secretResponse.$response.error
    }

    if (typeof secretResponse.SecretString !== 'string') {
      throw new TypeError(`Invalid secret value type for ${secretResponse.Name}`)
    }

    return secretResponse.SecretString
  }) as [string, string]

  const datadogConfig = {'DD-API-KEY': ddApiKey, 'DD-APPLICATION-KEY': ddApplicationKey} as const

  switch (event.RequestType) {
    case 'Create':
      await createMetric({metric: event.ResourceProperties.metric, config: datadogConfig})
      return {PhysicalResourceId: event.ResourceProperties.metric.id}

    case 'Update':
      await updateMetric({metric: event.ResourceProperties.metric, config: datadogConfig})
      return {PhysicalResourceId: event.PhysicalResourceId}

    case 'Delete':
      await deleteMetric({id: event.ResourceProperties.metric.id, config: datadogConfig})
      return {PhysicalResourceId: event.PhysicalResourceId}
  }
}
