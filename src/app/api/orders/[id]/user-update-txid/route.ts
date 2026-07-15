import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUser } from '@/lib/jwt';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // 1. Authorize user
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const body = await request.json();
    const { transactionId } = body;

    if (!transactionId || !transactionId.trim()) {
      return NextResponse.json({ message: 'Transaction ID is required' }, { status: 400 });
    }

    // 2. Fetch order
    const order = await prisma.order.findUnique({
      where: { id }
    });

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // 3. Verify ownership
    if (order.userId !== authUser.id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // 4. Update order details. If it was CANCELLED/denied, set it back to PENDING review.
    const newStatus = order.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING';

    await prisma.order.update({
      where: { id },
      data: {
        paymentIntentId: transactionId,
        status: newStatus,
        rejectionReason: null // Clear rejection feedback since they updated the TxID
      }
    });

    return NextResponse.json({ message: 'Transaction reference updated successfully', status: newStatus });
  } catch (err) {
    console.error('User order TxID update error:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
