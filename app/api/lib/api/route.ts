import { NextResponse } from 'next/server';
import { apiEndpoints } from '@/lib/api';

export async function GET() {
  return NextResponse.json(apiEndpoints);
}