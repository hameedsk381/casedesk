import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/permissions';
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/notifications/service';
import { unauthorized } from '@/lib/api/guards';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const notifications = await getUserNotifications(user.id);
    return NextResponse.json({ notifications });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await request.json();

    if (body.markAll) {
      await markAllNotificationsAsRead(user.id);
      return NextResponse.json({ success: true });
    }

    if (body.id) {
      await markNotificationAsRead(body.id, user.id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
