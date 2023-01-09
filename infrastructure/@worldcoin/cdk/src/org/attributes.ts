import * as cdk from 'aws-cdk-lib'

type Mapping<T> = {
  readonly [K: string]: (source: T) => string
}

type Imports<T, M extends Mapping<T>> = {
  readonly [K in keyof M]: ReturnType<M[K]>
}

/**
 * Helper for exporting/importing attributes
 */
export class Attributes<T, M extends Mapping<T> = Mapping<T>> {
  private readonly mapper: M

  public constructor(mapping: M) {
    this.mapper = mapping
  }

  public export(params: {readonly stack: cdk.Stack; readonly prefix: string; readonly source: T}): void {
    for (const [key, cb] of Object.entries(this.mapper)) {
      params.stack.exportValue(cb(params.source), {
        name: `${params.prefix}:${key}`,
      })
    }
  }

  public import(params: {readonly prefix: string}): Imports<T, M> {
    return Object.fromEntries(
      Object.keys(this.mapper).map((key) => [key, cdk.Fn.importValue(`${params.prefix}:${key}`)]),
    ) as Imports<T, M>
  }
}
