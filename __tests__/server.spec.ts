import { createResponse } from '@src/server'
import { IRequest } from '@src/types'
import '@blackglory/jest-matchers'

describe('createResponse', () => {
  describe('with expectedVersion', () => {
    describe('match', () => {
      it('return IResult', async () => {
        const method = jest.fn(async (message: string) => message)
        const api = { echo: method }
        const request: IRequest<unknown> = {
          protocol: 'delight-rpc'
        , version: '1.1'
        , expectedVersion: '1.0.0'
        , id: 'id'
        , method: ['echo']
        , params: ['message']
        }

        const result = createResponse(api, request, undefined, '1.1.0')
        const proResult = await result

        expect(result).toBePromise()
        expect(proResult).toStrictEqual({
          protocol: 'delight-rpc'
        , version: '1.1'
        , id: 'id'
        , result: 'message'
        })
      })
    })

    describe('mismatch', () => {
      it('return IError', async () => {
        const method = jest.fn(async (message: string) => message)
        const api = { echo: method }
        const request: IRequest<unknown> = {
          protocol: 'delight-rpc'
        , version: '1.1'
        , expectedVersion: '1.1.0'
        , id: 'id'
        , method: ['echo']
        , params: ['message']
        }

        const result = createResponse(api, request, undefined, '1.0.0')
        const proResult = await result

        expect(result).toBePromise()
        expect(proResult).toStrictEqual({
          protocol: 'delight-rpc'
        , version: '1.1'
        , id: 'id'
        , error: {
            type: 'VersionMismatch'
          , message: 'The expected version is ^1.1.0, but the server version is 1.0.0.'
          }
        })
      })
    })
  })

  describe('create a response without a validator', () => {
    describe('success', () => {
      it('return IResult', async () => {
        const method = jest.fn(async (message: string) => message)
        const api = { echo: method }
        const request: IRequest<unknown> = {
          protocol: 'delight-rpc'
        , version: '1.1'
        , id: 'id'
        , method: ['echo']
        , params: ['message']
        }

        const result = createResponse(api, request)
        const proResult = await result

        expect(result).toBePromise()
        expect(proResult).toStrictEqual({
          protocol: 'delight-rpc'
        , version: '1.1'
        , id: 'id'
        , result: 'message'
        })
      })
    })

    describe('method not available', () => {
      it('return IError', async () => {
        const api = {}
        const request: IRequest<unknown> = {
          protocol: 'delight-rpc'
        , version: '1.1'
        , id: 'id'
        , method: ['notFound']
        , params: ['message']
        }

        const result = createResponse(api, request)
        const proResult = await result

        expect(result).toBePromise()
        expect(proResult).toStrictEqual({
          protocol: 'delight-rpc'
        , version: '1.1'
        , id: 'id'
        , error: {
            type: 'MethodNotAvailable'
          , message: 'The method is not available.'
          }
        })
      })
    })

    describe('method throws error', () => {
      it('return IError', async () => {
        const method = jest.fn(async () => {
          throw new Error('message')
        })
        const api = { throws: method }
        const request: IRequest<unknown> = {
          protocol: 'delight-rpc'
        , version: '1.1'
        , id: 'id'
        , method: ['throws']
        , params: []
        }

        const result = createResponse(api, request)
        const proResult = await result

        expect(result).toBePromise()
        expect(proResult).toStrictEqual({
          protocol: 'delight-rpc'
        , version: '1.1'
        , id: 'id'
        , error: {
            type: 'Error'
          , message: 'message'
          }
        })
      })
    })

    test('with namespace', async () => {
      const method = jest.fn(async (message: string) => message)
      const api = {
        namespace: { echo: method }
      }
      const request: IRequest<unknown> = {
        protocol: 'delight-rpc'
      , version: '1.1'
      , id: 'id'
      , method: ['namespace', 'echo']
      , params: ['message']
      }

      const result = createResponse(api, request)
      const proResult = await result

      expect(result).toBePromise()
      expect(method).toBeCalledTimes(1)
      expect(proResult).toStrictEqual({
        protocol: 'delight-rpc'
      , version: '1.1'
      , id: 'id'
      , result: 'message'
      })
    })
  })

  describe('create a response with a validator', () => {
    it('pass', async () => {
      const method = jest.fn(async (message: string) => message)
      const api = {
        namespace: {
          echo: method
        }
      }
      const request: IRequest<unknown> = {
        protocol: 'delight-rpc'
      , version: '1.1'
      , id: 'id'
      , method: ['namespace', 'echo']
      , params: ['message']
      }
      const validator = jest.fn()
      const validators = {
        namespace: {
          echo: validator
        }
      }

      const result = createResponse(api, request, validators)
      const proResult = await result

      expect(validator).toBeCalledWith('message')
      expect(result).toBePromise()
      expect(proResult).toStrictEqual({
        protocol: 'delight-rpc'
      , version: '1.1'
      , id: 'id'
      , result: 'message'
      })
    })

    it('not pass', async () => {
      const method = jest.fn(async (message: string) => message)
      const api = {
        namespace: {
          echo: method
        }
      }
      const request: IRequest<unknown> = {
        protocol: 'delight-rpc'
      , version: '1.1'
      , id: 'id'
      , method: ['namespace', 'echo']
      , params: ['message']
      }
      const customError = new Error('custom error')
      const validator = jest.fn(() => {
        throw customError
      })
      const validators = {
        namespace: {
          echo: validator
        }
      }

      const result = createResponse(api, request, validators)
      const proResult = await result

      expect(validator).toBeCalledWith('message')
      expect(result).toBePromise()
      expect(proResult).toStrictEqual({
        protocol: 'delight-rpc'
      , version: '1.1'
      , id: 'id'
      , error: {
          type: 'ParameterValidationError'
        , message: 'Error: custom error'
        }
      })
    })
  })
})
