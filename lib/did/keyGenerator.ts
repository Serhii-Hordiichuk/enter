/**
 * Генерація та зберігання Ed25519-ключів і DID `did:peer`.
 *
 * Формат DID: `did:peer:z<base58btc(publicKey)>`, де `z` — префікс multibase
 * для кодування base58btc, а `publicKey` — 32-байтовий Ed25519-ключ.
 */
import { generateKeyPair, PUBLIC_KEY_LENGTH, SECRET_KEY_LENGTH } from '@stablelib/ed25519';

export const DID_METHOD_PREFIX = 'did:peer:';
export const MULTIBASE_BASE58BTC_PREFIX = 'z';
export const LOCAL_STORAGE_KEY = 'gotoap.did.keypair.v1';

export interface DIDKeyPair {
  did: string;
  publicKey: Uint8Array;
  secretKey: Uint8Array;
  createdAt: number;
}

interface SerializedDIDKeyPair {
  did: string;
  publicKey: string;
  secretKey: string;
  createdAt: number;
}

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export function encodeBase58Btc(input: Uint8Array): string {
  if (input.length === 0) return '';
  let leadingZeroes = 0;
  while (leadingZeroes < input.length && input[leadingZeroes] === 0) leadingZeroes += 1;
  const digits: number[] = [0];
  for (let i = 0; i < input.length; i += 1) {
    let carry = input[i] as number;
    for (let j = 0; j < digits.length; j += 1) {
      const value = (digits[j] as number) * 256 + carry;
      digits[j] = value % 58;
      carry = Math.floor(value / 58);
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }
  let result = '';
  for (let i = 0; i < leadingZeroes; i += 1) result += '1';
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    if (i === digits.length - 1 && digits[i] === 0) continue;
    result += BASE58_ALPHABET[digits[i] as number];
  }
  return result === '' ? '1' : result;
}

export function decodeBase58Btc(input: string): Uint8Array {
  if (input.length === 0) return new Uint8Array(0);
  let leadingOnes = 0;
  while (leadingOnes < input.length && input[leadingOnes] === '1') leadingOnes += 1;
  const bytes: number[] = [0];
  for (let i = 0; i < input.length; i += 1) {
    const digit = BASE58_ALPHABET.indexOf(input[i] as string);
    if (digit < 0) throw new Error('Недопустимий символ base58btc: ' + String(input[i]));
    let carry = digit;
    for (let j = 0; j < bytes.length; j += 1) {
      const value = (bytes[j] as number) * 58 + carry;
      bytes[j] = value & 0xff;
      carry = value >> 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  while (bytes.length > 1 && bytes[bytes.length - 1] === 0) bytes.pop();
  const decoded = new Uint8Array(leadingOnes + bytes.length);
  for (let i = 0; i < bytes.length; i += 1) {
    decoded[leadingOnes + i] = bytes[bytes.length - 1 - i] as number;
  }
  return decoded;
}

export function encodePublicKeyMultibase(publicKey: Uint8Array): string {
  return MULTIBASE_BASE58BTC_PREFIX + encodeBase58Btc(publicKey);
}

export function didFromPublicKey(publicKey: Uint8Array): string {
  return DID_METHOD_PREFIX + encodePublicKeyMultibase(publicKey);
}

export function publicKeyFromDid(did: string): Uint8Array {
  if (!did.startsWith(DID_METHOD_PREFIX)) throw new Error('Непідтримуваний DID-метод: ' + did);
  const multibaseValue = did.slice(DID_METHOD_PREFIX.length);
  if (!multibaseValue.startsWith(MULTIBASE_BASE58BTC_PREFIX)) throw new Error('DID має використовувати multibase base58btc (префікс z)');
  const publicKey = decodeBase58Btc(multibaseValue.slice(1));
  if (publicKey.length !== PUBLIC_KEY_LENGTH) throw new Error('Неправильна довжина публічного ключа: ' + String(publicKey.length));
  return publicKey;
}

export function generateDIDKeyPair(): DIDKeyPair {
  try {
    const keyPair = generateKeyPair();
    if (keyPair.publicKey.length !== PUBLIC_KEY_LENGTH || keyPair.secretKey.length !== SECRET_KEY_LENGTH) {
      throw new Error('Згенеровано ключі Ed25519 неправильної довжини');
    }
    return { did: didFromPublicKey(keyPair.publicKey), publicKey: keyPair.publicKey.slice(), secretKey: keyPair.secretKey.slice(), createdAt: Date.now() };
  } catch (error) {
    console.error('Не вдалося згенерувати пару DID-ключів:', error);
    throw error instanceof Error ? error : new Error('Не вдалося згенерувати пару DID-ключів');
  }
}

function bytesToBase64(input: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < input.length; i += 1) binary += String.fromCharCode(input[i] as number);
  return btoa(binary);
}

function base64ToBytes(input: string): Uint8Array {
  const binary = atob(input);
  const output = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) output[i] = binary.charCodeAt(i);
  return output;
}

export function serializeKeyPair(pair: DIDKeyPair): string {
  return JSON.stringify({ did: pair.did, publicKey: bytesToBase64(pair.publicKey), secretKey: bytesToBase64(pair.secretKey), createdAt: pair.createdAt } satisfies SerializedDIDKeyPair);
}

export function deserializeKeyPair(data: string): DIDKeyPair {
  try {
    const parsed = JSON.parse(data) as Partial<SerializedDIDKeyPair>;
    if (typeof parsed.did !== 'string' || typeof parsed.publicKey !== 'string' || typeof parsed.secretKey !== 'string' || typeof parsed.createdAt !== 'number') {
      throw new Error('Пошкоджені дані пари ключів DID');
    }
    const publicKey = base64ToBytes(parsed.publicKey);
    const secretKey = base64ToBytes(parsed.secretKey);
    if (publicKey.length !== PUBLIC_KEY_LENGTH || secretKey.length !== SECRET_KEY_LENGTH || didFromPublicKey(publicKey) !== parsed.did) {
      throw new Error('Пара ключів DID не пройшла перевірку цілісності');
    }
    return { did: parsed.did, publicKey, secretKey, createdAt: parsed.createdAt };
  } catch (error) {
    console.error('Не вдалося десеріалізувати пару ключів DID:', error);
    throw error instanceof Error ? error : new Error('Не вдалося десеріалізувати пару ключів DID');
  }
}

export function getStoredDIDKeyPair(): DIDKeyPair | null {
  try {
    if (typeof window === 'undefined' || !('localStorage' in window)) return null;
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    return deserializeKeyPair(raw);
  } catch (error) {
    console.error('Не вдалося завантажити збережену пару DID-ключів:', error);
    return null;
  }
}

export function storeDIDKeyPair(pair: DIDKeyPair): void {
  try {
    if (typeof window === 'undefined' || !('localStorage' in window)) throw new Error('localStorage недоступний у цьому середовищі');
    window.localStorage.setItem(LOCAL_STORAGE_KEY, serializeKeyPair(pair));
  } catch (error) {
    console.error('Не вдалося зберегти пару DID-ключів:', error);
    throw error instanceof Error ? error : new Error('Не вдалось зберегти пару DID-ключів');
  }
}

export function clearStoredDIDKeyPair(): void {
  try {
    if (typeof window === 'undefined' || !('localStorage' in window)) return;
    window.localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (error) {
    console.error('Не вдалося видалити пару DID-ключів:', error);
  }
}
