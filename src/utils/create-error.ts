import { IError } from '@src/types'

export function createError(
  id: string
, type: string
, message: string
): IError {
  return {
    protocol: 'delight-rpc'
  , version: '1.1'
  , id
  , error: {
      type
    , message
    }
  }
}
