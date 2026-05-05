/*
  © 2026 UEFN DevKit.

  This file is part of the UEFN DevKit project and is intended
  for use only within uefndevkit.rweb.site and its official services.

  Unauthorized use, copying, modification, or redistribution
  of this file or its contents is strictly prohibited.
*/

import { NextResponse } from 'next/server';
import { apiEndpoints } from '@/lib/api';

export async function GET() {
  return NextResponse.json(apiEndpoints);
}