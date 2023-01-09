import {Construct, IConstruct} from 'constructs'

export class Microservice extends Construct {
  public readonly service: string

  constructor(scope: Construct, id: string) {
    super(scope, id)
  }

  public static of(construct: IConstruct): Microservice {
    const microservice = construct.node.scopes.slice(0, -1).reverse().find(Microservice.isMicroservice)

    if (!microservice) {
      throw new Error(`Construct "${construct.node.path}" is outside of Microservice.`)
    }

    return microservice
  }

  public static isMicroservice(x: IConstruct | Microservice): x is Microservice {
    return x instanceof Microservice
  }
}
