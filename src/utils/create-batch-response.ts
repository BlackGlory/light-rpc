import { IBatchResponse, IResultForBatchResponse, IErrorForBatchResponse } from '@src/types'
import { version } from './version'
import { normalize } from '@blackglory/errors'
import { isntUndefined } from '@blackglory/prelude'

export function createBatchResponse<DataType>(
  id: string
, responses: Array<
  | IResultForBatchResponse<DataType>
  | IErrorForBatchResponse
  >
, channel?: string
): IBatchResponse<DataType> {
  const batchResponse: IBatchResponse<DataType> = {
    protocol: 'delight-rpc'
  , id
  , version
  , responses
  }
  if (isntUndefined(channel)) {
    batchResponse.channel = channel
  }

  return batchResponse
}

export function createErrorForBatchResponse(
  error: Error
): IErrorForBatchResponse {
  return { error: normalize(error) }
}

export function createResultForBatchResponse<DataType>(
  result: DataType
): IResultForBatchResponse<DataType> {
  return { result }
}
