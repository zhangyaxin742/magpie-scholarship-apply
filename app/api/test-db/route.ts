import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

export async function GET() {
  try {
    const result = await db.select().from(users).limit(1);
    return NextResponse.json({ 
      success: true, 
      message: 'Database connected!',
      users: result 
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: String(error) 
    }, { status: 500 });
  }
}