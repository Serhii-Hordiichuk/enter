import { NextResponse } from 'next/server';
import { verifyDidSignature } from '@/lib/did/didResolver';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

interface VerifyBody { did?: unknown; message?: unknown; signature?: unknown; }

function base64ToBytes(input: string): Uint8Array {
  const binary = atob(input);
  const output = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) output[i] = binary.charCodeAt(i);
  return output;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as VerifyBody;
    if (typeof body.did !== 'string' || typeof body.message !== 'string' || typeof body.signature !== 'string') {
      return NextResponse.json({ error: 'Потрібні поля did, message та signature (base64)' }, { status: 400 });
    }
    let signature: Uint8Array;
    try { signature = base64ToBytes(body.signature); }
    catch { return NextResponse.json({ error: 'Поле signature має бути коректним base64' }, { status: 400 }); }
    const valid = verifyDidSignature(body.did, body.message, signature);
    return NextResponse.json({ valid, did: body.did });
  } catch (error) {
    console.error('Помилка верифікації DID:', error);
    return NextResponse.json({ error: 'Не вдалося верифікувати DID' }, { status: 500 });
  }
}
