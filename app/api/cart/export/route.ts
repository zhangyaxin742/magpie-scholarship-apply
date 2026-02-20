import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { scholarships, user_scholarships } from '@/lib/db/schema';

const getUser = async (clerkId: string) =>
  db.query.users.findFirst({
    where: (u, { eq }) => eq(u.clerk_id, clerkId)
  });

const escapeCsv = (value: string | null | undefined) => `"${(value ?? '').replace(/"/g, '""')}"`;

const formatDate = (value: Date | string | null | undefined) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().split('T')[0];
};

const formatDateTime = (value: Date | string | null | undefined) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString();
};

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await getUser(userId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const rows = await db
    .select({
      userScholarship: user_scholarships,
      scholarship: scholarships
    })
    .from(user_scholarships)
    .innerJoin(scholarships, eq(user_scholarships.scholarship_id, scholarships.id))
    .where(eq(user_scholarships.user_id, user.id));

  const header = [
    'Name',
    'Organization',
    'Amount',
    'Deadline',
    'Status',
    'Application URL',
    'Notes',
    'Applied At',
    'Decision Date',
    'Amount Won'
  ];

  const lines = [header.map((value) => escapeCsv(value)).join(',')];

  rows.forEach(({ userScholarship, scholarship }) => {
    lines.push(
      [
        scholarship.name,
        scholarship.organization ?? '',
        scholarship.amount?.toString() ?? '',
        formatDate(scholarship.deadline),
        userScholarship.status,
        scholarship.application_url ?? '',
        userScholarship.user_notes ?? '',
        formatDateTime(userScholarship.applied_at),
        formatDate(userScholarship.decision_date),
        userScholarship.amount_won?.toString() ?? ''
      ]
        .map((value) => escapeCsv(value))
        .join(',')
    );
  });

  const csv = lines.join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="magpie-scholarships.csv"'
    }
  });
}
