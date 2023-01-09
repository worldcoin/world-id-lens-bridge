import {MonitorType} from './monitor-type'
import {MonitorOptions} from './monitor-options'

/**
 * Datadog Monitor 4.4.0
 */
export interface MonitorProps {
  Creator?: {
    /**
     * Name of the creator of the monitor
     */
    Name?: string
    /**
     * Handle of the creator of the monitor
     */
    Handle?: string
    /**
     * Email of the creator of the monitor
     */
    Email?: string
  }
  /**
   * ID of the monitor
   */
  Id?: number
  /**
   * A message to include with notifications for the monitor
   */
  Message?: string
  /**
   * Name of the monitor
   */
  Name?: string
  /**
   * Tags associated with the monitor
   */
  Tags?: string[]
  /**
   * Integer from 1 (high) to 5 (low) indicating alert severity.
   */
  Priority?: number
  Options?: MonitorOptions
  /**
   * The monitor query
   */
  Query: string
  /**
   * The type of the monitor
   */
  Type: MonitorType
  /**
   * Whether or not the monitor is multi alert
   */
  Multi?: boolean
  /**
   * Date of creation of the monitor
   */
  Created?: string
  /**
   * Date of deletion of the monitor
   */
  Deleted?: string
  /**
   * Date of modification of the monitor
   */
  Modified?: string
  /**
   * A list of unique role identifiers to define which roles are allowed to edit the monitor. The unique identifiers for all roles can be pulled from the [Roles API](https://docs.datadoghq.com/api/latest/roles/#list-roles) and are located in the `data.id` field. Editing a monitor includes any updates to the monitor configuration, monitor deletion, and muting of the monitor for any amount of time. `restricted_roles` is the successor of `locked`. For more information about `locked` and `restricted_roles`, see the [monitor options docs](https://docs.datadoghq.com/monitors/guide/monitor_api_options/#permissions-options).
   */
  RestrictedRoles?: string[]
}
