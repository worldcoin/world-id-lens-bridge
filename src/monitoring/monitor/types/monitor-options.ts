/**
 * The monitor options
 */
export interface MonitorOptions {
  /**
   * Whether or not to include a sample of the logs
   */
  EnableLogsSample?: boolean
  /**
   * Message to include with a re-notification when renotify_interval is set
   */
  EscalationMessage?: string
  /**
   * Time in seconds to delay evaluation
   */
  EvaluationDelay?: number
  /**
   * Whether or not to include triggering tags into notification title
   */
  IncludeTags?: boolean
  /**
   * Whether or not changes to this monitor should be restricted to the creator or admins
   */
  Locked?: boolean
  /**
   * Number of locations allowed to fail before triggering alert
   */
  MinLocationFailed?: number
  /**
   * Time in seconds to allow a host to start reporting data before starting the evaluation of monitor results
   */
  NewHostDelay?: number
  /**
   * Number of minutes data stopped reporting before notifying
   */
  NoDataTimeframe?: number
  /**
   * Whether or not to notify tagged users when changes are made to the monitor
   */
  NotifyAudit?: boolean
  /**
   * Whether or not to notify when data stops reporting
   */
  NotifyNoData?: boolean
  /**
   * Number of minutes after the last notification before the monitor re-notifies on the current status
   */
  RenotifyInterval?: number
  /**
   * Whether or not the monitor requires a full window of data before it is evaluated
   */
  RequireFullWindow?: boolean
  /**
   * ID of the corresponding synthetics check
   */
  SyntheticsCheckID?: number
  Thresholds?: {
    /**
     * Threshold value for triggering an alert
     */
    Critical?: number
    /**
     * Threshold value for recovering from an alert state
     */
    CriticalRecovery?: number
    /**
     * Threshold value for recovering from an alert state
     */
    OK?: number
    /**
     * Threshold value for triggering a warning
     */
    Warning?: number
    /**
     * Threshold value for recovering from a warning state
     */
    WarningRecovery?: number
  }
  ThresholdWindows?: {
    /**
     * How long a metric must be anomalous before triggering an alert
     */
    TriggerWindow?: string
    /**
     * How long an anomalous metric must be normal before recovering from an alert state
     */
    RecoveryWindow?: string
  }
  /**
   * Number of hours of the monitor not reporting data before it automatically resolves
   */
  TimeoutH?: number
  /**
   * The number of times re-notification messages should be sent on the current status at the provided re-notification interval.
   */
  RenotifyOccurrences?: number
  /**
   * The types of monitor statuses for which re-notification messages are sent.
   */
  RenotifyStatuses?: ('alert' | 'no data' | 'warn')[]
  /**
   * How long the test should be in failure before alerting (integer, number of seconds, max 7200).
   */
  MinFailureDuration?: number
  /**
   * Time (in seconds) to skip evaluations for new groups. For example, this option can be used to skip evaluations for new hosts while they initialize. Must be a non negative integer.
   */
  NewGroupDelay?: number
}
