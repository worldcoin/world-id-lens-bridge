export type Metric = {
  attributes: {
    compute: {
      aggregation_type: 'count' | 'distribution'
      path?: string
    }

    filter?: {
      query?: string
    }

    group_by?: Array<{
      path: string
      tag_name?: string
    }>
  }

  id: string
  type: 'logs_metrics'
}
