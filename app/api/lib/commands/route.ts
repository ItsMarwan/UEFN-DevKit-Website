import { NextResponse } from 'next/server';
import { commands } from '@/lib/commands';

export async function GET() {
  return NextResponse.json(commands);
}