/** Верифікація DID та підписів Ed25519. */
import { sign, verify } from '@stablelib/ed25519';
import { publicKeyFromDid } from './keyGenerator';

export interface DidDocument {
  id: string;
  publicKey: Uint8Array;
  createdAt?: number;
}

export function resolveDid(did: string): DidDocument {
  try {
    return { id: did, publicKey: publicKeyFromDid(did) };
  } catch (error) {
    console.error('Не вдалося розпізнати DID:', error);
    throw error instanceof Error ? error : new Error('Не вдалося розпізнати DID');
  }
}

export function signDidMessage(message: string, secretKey: Uint8Array): Uint8Array {
  try {
    return sign(secretKey, new TextEncoder().encode(message));
  } catch (error) {
    console.error('Не вдалося підписати повідомлення DID:', error);
    throw error instanceof Error ? error : new Error('Не вдалося підписати повідомлення DID');
  }
}

export function verifyDidSignature(did: string, message: string, signature: Uint8Array): boolean {
  try {
    const publicKey = publicKeyFromDid(did);
    return verify(publicKey, new TextEncoder().encode(message), signature);
  } catch (error) {
    console.error('Помилка перевірки підпису DID:', error);
    return false;
  }
}
