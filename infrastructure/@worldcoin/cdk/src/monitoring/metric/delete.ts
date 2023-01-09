import {Metric} from '@worldcoin/cdk/monitoring/metric/types'

export const deleteMetric = async (params: {
  id: string
  config: {
    'DD-API-KEY': string
    'DD-APPLICATION-KEY': string
  }
}): Promise<Metric | null> => {
  const result = await fetch(`https://api.datadoghq.com/api/v2/logs/config/metrics/${params.id}`, {
    method: 'DELETE',
    headers: {
      ...params.config,
      Accept: 'application/json',
    },
  })

  const textResponse = await result.text()
  console.debug(`Received response headers from DataDog: ${JSON.stringify(result.headers)}`)
  console.debug(`Received response status from DataDog: ${result.status}, ${result.statusText}`)
  console.debug(`Received response from DataDog: ${textResponse}`)

  const response: {
    errors?: Array<string>
    data: Metric
  } = JSON.parse(textResponse)

  if (response.errors && response.errors.length > 0) {
    throw new TypeError(`Cannot delete metric: ${response.errors[0]}`)
  }

  return response.data
}