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
      return NextResponse.json({ error: 'The did, message, and signature (base64) fields are required' }, { status: 400 });
    }
    let signature: Uint8Array;
    try { signature = base64ToBytes(body.signature); }
    catch { return NextResponse.json({ error: 'The signature field must be valid base64' }, { status: 400 }); }
    const valid = verifyDidSignature(body.did, body.message, signature);
    return NextResponse.json({ valid, did: body.did });
  } catch (error) {
    console.error('DID verification error:', error);
    return NextResponse.json({ error: 'Failed to verify the DID' }, { status: 500 });
  }
}
