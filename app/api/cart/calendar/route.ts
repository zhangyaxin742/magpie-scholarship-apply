import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { scholarships, user_scholarships } from '@/lib/db/schema';

const getUser = async (clerkId: string) =>
  db.query.users.findFirst({
    where: (u, { eq }) => eq(u.clerk_id, clerkId)
  });

const formatDate = (value: Date | string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10).replace(/-/g, '');
};

const formatTimestamp = (value: Date) => {
  const iso = value.toISOString().replace(/[-:]/g, '').split('.')[0];
  return `${iso}Z`;
};

const escapeText = (value: string) => value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,');

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await getUser(userId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const rows = await db
    .select({
      scholarship: scholarships
    })
    .from(user_scholarships)
    .innerJoin(scholarships, eq(user_scholarships.scholarship_id, scholarships.id))
    .where(
      and(eq(user_scholarships.user_id, user.id), eq(user_scholarships.status, 'in_cart'))
    );

  const now = new Date();
  const dtstamp = formatTimestamp(now);

  const events = rows
    .map(({ scholarship }) => {
      if (!scholarship.deadline) return null;
      const deadline = formatDate(scholarship.deadline);
      if (!deadline) return null;
      const amountText = scholarship.amount ? `$${scholarship.amount.toLocaleString()}` : 'Amount unknown';
      return [
        'BEGIN:VEVENT',
        `UID:${scholarship.id}@magpie`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART;VALUE=DATE:${deadline}`,
        `SUMMARY:${escapeText(`Apply: ${scholarship.name}`)}`,
        `DESCRIPTION:${escapeText(`${scholarship.name} - ${amountText} - ${scholarship.application_url ?? ''}`)}`,
        `URL:${escapeText(scholarship.application_url ?? '')}`,
        'BEGIN:VALARM',
        `DESCRIPTION:${escapeText(`7 days until ${scholarship.name} deadline`)}`,
        'TRIGGER:-P7D',
        'ACTION:DISPLAY',
        'END:VALARM',
        'BEGIN:VALARM',
        `DESCRIPTION:${escapeText(`3 days until ${scholarship.name} deadline`)}`,
        'TRIGGER:-P3D',
        'ACTION:DISPLAY',
        'END:VALARM',
        'BEGIN:VALARM',
        `DESCRIPTION:${escapeText(`Tomorrow: ${scholarship.name} deadline`)}`,
        'TRIGGER:-P1D',
        'ACTION:DISPLAY',
        'END:VALARM',
        'END:VEVENT'
      ].join('\n');
    })
    .filter(Boolean)
    .join('\n');

  const calendar = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Magpie//Scholarship Tracker//EN',
    events,
    'END:VCALENDAR'
  ]
    .filter(Boolean)
    .join('\n');

  return new NextResponse(calendar, {
    headers: {
      'Content-Type': 'text/calendar',
      'Content-Disposition': 'attachment; filename="magpie-deadlines.ics"'
    }
  });
}
