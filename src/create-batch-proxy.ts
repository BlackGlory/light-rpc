import { isntString } from '@blackglory/prelude'
import { FunctionKeys, KeysExtendType } from 'hotypes'
import { ParameterValidators, IRequestForBatchRequest } from '@src/types'
import { tryGetProp } from 'object-path-operator'
import { createRequestForBatchRequest } from '@utils/create-batch-request'
import { CallableObject } from '@utils/callable-object'

type BatchClientProxy<Obj, DataType> = {
  [Key in FunctionKeys<Obj> | KeysExtendType<Obj, object>]:
    Obj[Key] extends (...args: infer Args) => infer Result
      ? (...args: Args) => IRequestForBatchRequest<Awaited<Result>, DataType>
      : BatchClientProxy<Obj[Key], DataType>
}

export function createBatchProxy<API extends object, DataType = unknown>(
  parameterValidators: ParameterValidators<API> = {}
): BatchClientProxy<API, DataType> {
  return new Proxy(Object.create(null), {
    get(target: any, prop: string | symbol) {
      if (isntString(prop)) return
      if (['then'].includes(prop)) return
      return createCallableNestedProxy([prop])
    }
  , has(target, prop) {
      if (isntString(prop)) return false
      if (['then'].includes(prop)) return false
      return true
    }
  })

  function createCallableNestedProxy(path: [string, ...string[]]): BatchClientProxy<API, DataType> {
    return new Proxy(new CallableObject(), {
      get(target, prop) {
        if (isntString(prop)) return
        if (['then'].includes(prop)) return
        return createCallableNestedProxy([...path, prop])
      }
    , apply(target, thisArg, args) {
        const validate = tryGetProp(
          parameterValidators
        , path
        ) as ((...args: unknown[]) => void) | undefined
        validate?.(...args)

        return createRequestForBatchRequest(path, args)
      }
    , has(target, prop) {
        if (isntString(prop)) return false
        if (['then'].includes(prop)) return false
        return true
      }
    }) as unknown as BatchClientProxy<API, DataType>
  }
}
