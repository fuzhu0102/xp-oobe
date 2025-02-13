// every ASCII char that will not be encoded in URL.
// DO NOT modify this string since this will break data reading and writing.
import { config } from './config'

// dot is used for splitter
export const digits = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_*-'.split('')
export const convertBase = (value: string, fromBase: number, toBase: number) => {
  const fromRange = digits.slice(0, fromBase)
  const toRange = digits.slice(0, toBase)
  const bigToBase = BigInt(toBase)

  let decValue = value.split('').reverse().reduce((carry, digit, index) => {
    if (!fromRange.includes(digit)) throw new Error(`Invalid digit ${digit} for base ${fromBase}`)
    carry += BigInt(fromRange.indexOf(digit)) * BigInt(Math.pow(fromBase, index))
    return carry
  }, BigInt(0))

  let newValue = ''
  while (decValue > 0) {
    newValue = toRange[Number(decValue % bigToBase)] + newValue
    decValue = (decValue - (decValue % bigToBase)) / bigToBase
  }
  return newValue !== '' ? newValue : '0'
}

export interface Data {
  protocolVersion: string
  items: Array<[string, number]>
}

// data should be a string where each single
// char is a digit, in the sequence of the above digit const:
// 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_~'()*-
export const encodeAndSave = async (data: Data) => {
  const sourceBitSize = config[data.protocolVersion].bitSize
  const dataSequence = config[data.protocolVersion].items.map(listItem => convertBase((data.items.find(el => el[0] === listItem)?.[1] ?? 0).toString(), 10, sourceBitSize)).join('')
  const encoded = `${data.protocolVersion}.${convertBase(dataSequence, sourceBitSize, digits.length)}`
  localStorage.setItem('data', encoded)
  const url = new URL(window.location.href)
  url.searchParams.set('d', encoded)
  window.history.pushState({}, 'title', url.toString())
  return {
    url,
    string: encoded
  }
}

export const read = async () => {
  return new URLSearchParams(window.location.search).get('d') ?? localStorage.getItem('data')
}

export const clear = () => {
  localStorage.removeItem('data')
  const url = new URL(window.location.href)
  url.searchParams.delete('d')
  window.history.pushState({}, '', url.toString())
}

export const decodeOrLoad = async () => {
  const encoded = await read()
  if (!encoded) return undefined
  const [protocolVersion, items] = encoded.split('.')
  if (!config[protocolVersion]) throw new Error(`Invalid protocol version: ${protocolVersion}`)
  const sourceBitSize = config[protocolVersion].bitSize
  console.log('out', Array.from(convertBase(items, digits.length, sourceBitSize)))
  return Array.from(convertBase(items, digits.length, sourceBitSize)).map((digit, index) => [config.v1.items[index], parseInt(convertBase(digit, sourceBitSize, 10))] as const)
}
