import { BytesLike } from 'ethers'
import { Hexable, keccak256 } from 'ethers/lib/utils'
import { DataOptions, Bytes } from '@ethersproject/bytes'
import { Logger } from '@ethersproject/logger'
import errors from './errors.json'

const version = 'bytes/5.5.0'
const logger = new Logger(version)

function isInteger(value: number) {
  return typeof value === 'number' && value % 1 === 0
}

export function isHexString(value: any, length?: number): boolean {
  if (typeof value !== 'string' || !value.match(/^0x[0-9A-Fa-f]*$/)) {
    return false
  }
  if (length && value.length !== 2 + 2 * length) {
    return false
  }
  return true
}

function isHexable(value: any): value is Hexable {
  return !!value.toHexString
}

export function isBytes(value: any): value is Bytes {
  if (value == null) {
    return false
  }

  if (value.constructor === Uint8Array) {
    return true
  }
  if (typeof value === 'string') {
    return false
  }
  if (!isInteger(value.length) || value.length < 0) {
    return false
  }

  for (let i = 0; i < value.length; i++) {
    const v = value[i]
    if (!isInteger(v) || v < 0 || v >= 256) {
      return false
    }
  }
  return true
}

export function arrayify(
  value: BytesLike | Hexable | number,
  options?: DataOptions
): Uint8Array {
  if (!options) {
    options = {}
  }

  if (typeof value === 'number') {
    logger.checkSafeUint53(value, 'invalid arrayify value')

    const result = []
    while (value) {
      result.unshift(value & 0xff)
      value = parseInt(String(value / 256))
    }
    if (result.length === 0) {
      result.push(0)
    }

    return new Uint8Array(result)
  }

  if (
    options.allowMissingPrefix &&
    typeof value === 'string' &&
    value.substring(0, 2) !== '0x'
  ) {
    value = '0x' + value
  }

  if (isHexable(value)) {
    value = value.toHexString()
  }

  if (isHexString(value)) {
    let hex = (<string>value).substring(2)
    if (hex.length % 2) {
      if (options.hexPad === 'left') {
        hex = '0x0' + hex.substring(2)
      } else if (options.hexPad === 'right') {
        hex += '0'
      } else {
        logger.throwArgumentError('hex data is odd-length', 'value', value)
      }
    }

    const result = []
    for (let i = 0; i < hex.length; i += 2) {
      result.push(parseInt(hex.substring(i, i + 2), 16))
    }

    return new Uint8Array(result)
  }

  if (isBytes(value)) {
    return new Uint8Array(value)
  }

  return logger.throwArgumentError('invalid arrayify value', 'value', value)
}

function getChecksumAddress(address: string): string {
  if (!isHexString(address, 20)) {
    logger.throwArgumentError('invalid address', 'address', address)
  }

  address = address.toLowerCase()

  const chars = address.substring(2).split('')

  const expanded = new Uint8Array(40)
  for (let i = 0; i < 40; i++) {
    expanded[i] = chars[i].charCodeAt(0)
  }

  const hashed = arrayify(keccak256(expanded))

  for (let i = 0; i < 40; i += 2) {
    if (hashed[i >> 1] >> 4 >= 8) {
      chars[i] = chars[i].toUpperCase()
    }
    if ((hashed[i >> 1] & 0x0f) >= 8) {
      chars[i + 1] = chars[i + 1].toUpperCase()
    }
  }

  return '0x' + chars.join('')
}

const safeDigits = Math.floor(Math.log10(Number.MAX_SAFE_INTEGER))

const ibanLookup: { [character: string]: string } = {}
for (let i = 0; i < 10; i++) {
  ibanLookup[String(i)] = String(i)
}
for (let i = 0; i < 26; i++) {
  ibanLookup[String.fromCharCode(65 + i)] = String(10 + i)
}

function ibanChecksum(address: string): string {
  address = address.toUpperCase()
  address = address.substring(4) + address.substring(0, 2) + '00'

  let expanded = address
    .split('')
    .map(c => {
      return ibanLookup[c]
    })
    .join('')

  // Javascript can handle integers safely up to 15 (decimal) digits
  while (expanded.length >= safeDigits) {
    const block = expanded.substring(0, safeDigits)
    expanded = (parseInt(block, 10) % 97) + expanded.substring(block.length)
  }

  let checksum = String(98 - (parseInt(expanded, 10) % 97))
  while (checksum.length < 2) {
    checksum = '0' + checksum
  }

  return checksum
}

export function _base36To16(value: string): string {
  return parseInt(value).toString(16)
}

export function getAddress(address: string): string {
  let result = ''

  if (typeof address !== 'string') {
    logger.throwArgumentError('invalid address', 'address', address)
  }

  if (address.match(/^(0x)?[0-9a-fA-F]{40}$/)) {
    // Missing the 0x prefix
    if (address.substring(0, 2) !== '0x') {
      address = '0x' + address
    }

    result = getChecksumAddress(address)

    // It is a checksummed address with a bad checksum
    if (address.match(/([A-F].*[a-f])|([a-f].*[A-F])/) && result !== address) {
      logger.throwArgumentError('bad address checksum', 'address', address)
    }

    // Maybe ICAP? (we only support direct mode)
  } else if (address.match(/^XE[0-9]{2}[0-9A-Za-z]{30,31}$/)) {
    // It is an ICAP address with a bad checksum
    if (address.substring(2, 4) !== ibanChecksum(address)) {
      logger.throwArgumentError('bad icap checksum', 'address', address)
    }

    result = _base36To16(address.substring(4))
    while (result.length < 40) {
      result = '0' + result
    }
    result = getChecksumAddress('0x' + result)
  } else {
    logger.throwArgumentError('invalid address', 'address', address)
  }

  return result
}

export const error = (input: keyof typeof errors) => {
  const [error, message] = Object.entries(errors[input])

  return { error, message }
}
