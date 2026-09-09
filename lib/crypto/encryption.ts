/** AES-GCM encryption with WebCrypto and Ed25519 signatures. */
import { sign, verify } from '@stablelib/ed25519';

export interface EncryptedPayload {
  iv: string;
  ciphertext: string;
}

export interface SignedChatPayload {
  message: string;
  signature: string;
  senderDid: string;
}

export function bytesToBase64(input: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < input.length; i += 1) binary += String.fromCharCode(input[i] as number);
  return btoa(binary);
}

export function base64ToBytes(input: string): Uint8Array {
  const binary = atob(input);
  const output = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) output[i] = binary.charCodeAt(i);
  return output;
}

export async function deriveRoomKey(roomId: string, saltText = 'gotoap-room-key-v1'): Promise<CryptoKey> {
  try {
    const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(roomId), { name: 'PBKDF2' }, false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: new TextEncoder().encode(saltText), iterations: 100000, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  } catch (error) {
    console.error('Failed to derive the room key:', error);
    throw error instanceof Error ? error : new Error('Failed to derive the room key');
  }
}

export async function encryptText(plaintext: string, key: CryptoKey): Promise<EncryptedPayload> {
  try {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext)));
    return { iv: bytesToBase64(iv), ciphertext: bytesToBase64(ciphertext) };
  } catch (error) {
    console.error('Failed to encrypt the message:', error);
    throw error instanceof Error ? error : new Error('Failed to encrypt the message');
  }
}

export async function decryptText(payload: EncryptedPayload, key: CryptoKey): Promise<string> {
  try {
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: base64ToBytes(payload.iv) }, key, base64ToBytes(payload.ciphertext));
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Failed to decrypt the message:', error);
    throw error instanceof Error ? error : new Error('Failed to decrypt the message');
  }
}

export function signMessageText(message: string, secretKey: Uint8Array): string {
  try {
    return bytesToBase64(sign(secretKey, new TextEncoder().encode(message)));
  } catch (error) {
    console.error('Failed to sign the message:', error);
    throw error instanceof Error ? error : new Error('Failed to sign the message');
  }
}

export function verifyMessageText(message: string, signatureBase64: string, publicKey: Uint8Array): boolean {
  try {
    return verify(publicKey, new TextEncoder().encode(message), base64ToBytes(signatureBase64));
  } catch (error) {
    console.error('Message signature verification error:', error);
    return false;
  }
}
