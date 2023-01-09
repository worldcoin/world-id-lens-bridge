import * as cdk from 'aws-cdk-lib'
import {IConstruct} from 'constructs'

/**
 * Environment Cloud Assembly (e.g. Production, Staging, JohnSmith)
 *
 * - Contains information about organization accounts.
 * - Isolates resources from different environments during `cdk synth`.
 * - Provides methods to select environment-specific parameters.
 * - Must be immediate child of {@link cdk.App}.
 *
 * Applications go through three stages during development `dev->staging->production`.
 * Environments with id `'Production'/'Staging'` select `production/staging` configuration respectively.
 * Environment with any other id selects `dev` configuration.
 *
 * @example
 * import * as cdk from 'aws-cdk-lib'
 * import * as org from '@worldcoin/cdk/org'
 *
 * class Environment extends org.Environment {
 *   public constructor(scope: cdk.App, id: string) {
 *     super(scope, id)
 *
 *     new ConsumerApp(this, 'ConsumerApp', {
 *       env: {
 *         account: this.accounts.consumer,
 *         region: 'us-east-1',
 *       },
 *
 *       logLevel: this.select({
 *          production: 'INFO',
 *          staging: 'INFO',
 *          dev: 'DEBUG',
 *       }),
 *     })
 *   }
 * }
 *
 * const app = new cdk.App()
 * new Environment(app, app.tryGetContext('env:id'))
 * app.synth()
 */
export abstract class Environment extends cdk.Stage {
  /**
   * Test whether the given construct is {@link Environment}.
   */
  public static isEnvironment(x: IConstruct | Environment): x is Environment {
    return x instanceof Environment
  }

  /**
   * Return {@link Environment} of construct.
   */
  public static of(construct: IConstruct): Environment {
    const environment = construct.node.scopes.slice(0, -1).reverse().find(Environment.isEnvironment)
    if (!environment) throw new Error(`Construct ${construct.node.path} isn't descendant of ${Environment.name}.`)
    return environment
  }

  /**
   * AWS Account ids where applications are to be deployed.
   */
  public readonly accounts: {
    readonly analytics: string
    readonly operator: string
    readonly consumer: string
  }

  public constructor(scope: cdk.App, id: string, props?: cdk.StageProps) {
    super(scope, id, props)

    this.accounts = this.select({
      production: {analytics: '261207205690', operator: '906266994114', consumer: '906266994114'},
      staging: {analytics: '797615431886', operator: '505538374473', consumer: '505538374473'},
      dev: {analytics: '926986201233', operator: '926986201233', consumer: '926986201233'},
    })
  }

  public select<T>(params: {readonly production: T; readonly staging: T; readonly dev: T}): T {
    if (this.node.id === 'Production') return params.production
    if (this.node.id === 'Staging') return params.staging
    return params.dev
  }
}
