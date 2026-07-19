import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUser } from '@/lib/jwt';
import { sendOrderNotification } from '@/lib/notifications';

export async function POST(request: Request) {
  try {
    const authPayload = getAuthUser(request);
    if (!authPayload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productIdList, couponCode, paymentMethod, paymentIntentId } = body;

    if (!productIdList || !Array.isArray(productIdList) || productIdList.length === 0) {
      return NextResponse.json({ message: 'No products in order' }, { status: 400 });
    }

    // Load products
    const products = await prisma.product.findMany({
      where: { id: { in: productIdList } },
    });

    if (products.length === 0) {
      return NextResponse.json({ message: 'Products not found' }, { status: 404 });
    }

    // Calculate subtotal
    const subtotal = products.reduce((sum, p) => {
      const price = p.salePrice !== null ? p.salePrice : p.price;
      return sum + price;
    }, 0);

    // Apply coupon if valid
    let discountAmount = 0;
    let coupon = null;
    if (couponCode) {
      coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase() },
      });
      if (coupon && coupon.active && (!coupon.expiresAt || new Date() < coupon.expiresAt)) {
        discountAmount = (subtotal * coupon.discountPercentage) / 100;
      }
    }

    const taxAmount = (subtotal - discountAmount) * 0.08; // 8% sales tax
    const totalAmount = subtotal - discountAmount + taxAmount;

    // Generate random order number
    const orderNumber = `GTA-${Math.floor(100000 + Math.random() * 900000)}-${Math.random()
      .toString(36)
      .substring(2, 5)
      .toUpperCase()}`;

    const isManual = paymentMethod === 'UPI' || paymentMethod === 'USDT';
    const initialStatus = isManual ? 'PENDING' : 'COMPLETED';
    const refId = isManual ? paymentIntentId : `ch_${Math.random().toString(36).substring(2, 10)}`;

    if (isManual && (!paymentIntentId || !paymentIntentId.trim())) {
      return NextResponse.json({ message: 'Payment transaction reference (UTR/TxID) is required.' }, { status: 400 });
    }

    // Create order inside a database transaction
    const order = await prisma.$transaction(async (tx) => {
      // 1. Create order
      const newOrder = await tx.order.create({
        data: {
          userId: authPayload.id,
          orderNumber,
          totalAmount: subtotal,
          discountAmount,
          taxAmount,
          netAmount: totalAmount,
          status: initialStatus,
          paymentMethod: paymentMethod || 'STRIPE',
          paymentIntentId: refId,
        },
      });

      // 2. Create order items and increment product downloadsCount (only if instant completed)
      for (const p of products) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: p.id,
            price: p.salePrice !== null ? p.salePrice : p.price,
          },
        });

        if (!isManual) {
          // Increment product downloads stats
          await tx.product.update({
            where: { id: p.id },
            data: { downloadsCount: { increment: 1 } },
          });

          // 3. Generate secure download token (expires in 6 hours)
          const expiry = new Date();
          expiry.setHours(expiry.getHours() + 6);

          await tx.downloadToken.create({
            data: {
              userId: authPayload.id,
              productId: p.id,
              token: `dl_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`,
              expiresAt: expiry,
            },
          });
        }
      }

      return newOrder;
    });

    if (isManual) {
      sendOrderNotification(order.id, false);
    }

    // Load download tokens to return
    let downloadsResponse: any[] = [];
    if (!isManual) {
      const downloadTokens = await prisma.downloadToken.findMany({
        where: {
          userId: authPayload.id,
          productId: { in: productIdList },
        },
        include: {
          product: {
            select: { title: true, slug: true },
          },
        },
      });
      downloadsResponse = downloadTokens.map((t) => ({
        title: t.product.title,
        slug: t.product.slug,
        token: t.token,
        expiresAt: t.expiresAt,
      }));
    }

    return NextResponse.json(
      {
        message: isManual
          ? 'Order created successfully and is awaiting manual verification'
          : 'Order created and paid successfully',
        orderId: order.id,
        orderNumber: order.orderNumber,
        netAmount: order.netAmount,
        status: order.status,
        downloads: downloadsResponse,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Order creation API error:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
