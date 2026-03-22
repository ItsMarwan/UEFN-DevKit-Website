// app/api/dashboard/logout/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cookieStore = await cookies();
  cookieStore.delete('dashboard_session');
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/`);
}