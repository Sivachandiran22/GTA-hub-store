import prisma from './db';

/**
 * Sends a notification to Discord (via Webhook) and Telegram (via Bot API)
 * when a new manual payment order is placed or updated.
 *
 * @param orderId The UUID of the order
 * @param isUpdate Whether this is a payment TxID reference update by the client
 */
export async function sendOrderNotification(orderId: string, isUpdate: boolean = false) {
  try {
    // 1. Fetch order details from the database along with user profile
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: { fullName: true, email: true }
        }
      }
    });

    if (!order) {
      console.warn(`[Notification Warning] Order not found for ID: ${orderId}`);
      return;
    }

    const orderNumber = order.orderNumber;
    const customerName = order.user?.fullName || 'Anonymous Customer';
    const customerEmail = order.user?.email || 'No Email';
    const amount = order.netAmount.toFixed(2);
    const method = order.paymentMethod;
    const refId = order.paymentIntentId || 'None';

    const title = isUpdate
      ? `🔄 Order Reference Updated (#${orderNumber})`
      : `🚨 New Order Request Awaiting Approval (#${orderNumber})`;

    // 2. Discord Webhook Notification
    const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (discordWebhookUrl && discordWebhookUrl.startsWith('http')) {
      const discordPayload = {
        username: "GTA Hub Bot",
        avatar_url: "https://gta-hub-store.vercel.app/favicon.ico",
        embeds: [
          {
            title: title,
            color: isUpdate ? 3447003 : 16753920, // Blue for updates, Orange for new orders
            fields: [
              { name: "Order Number", value: `#${orderNumber}`, inline: true },
              { name: "Net Amount", value: `₹${amount}`, inline: true },
              { name: "Payment Method", value: method, inline: true },
              { name: "Customer Details", value: `👤 **Name:** ${customerName}\n📧 **Email:** ${customerEmail}`, inline: false },
              { name: "UTR / Transaction Reference", value: `\`${refId}\``, inline: false }
            ],
            footer: {
              text: "GTA Hub Store System Console"
            },
            timestamp: new Date().toISOString()
          }
        ]
      };

      await fetch(discordWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discordPayload)
      })
      .then(res => {
        if (!res.ok) console.error(`Discord Webhook responded with status: ${res.status}`);
      })
      .catch(err => console.error('Error triggering Discord Webhook:', err));
    }

    // 3. Telegram Bot Notification
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.TELEGRAM_CHAT_ID;
    if (telegramBotToken && telegramChatId && telegramChatId.trim()) {
      const messageText = 
        `*${isUpdate ? '🔄 ORDER REFERENCE UPDATED' : '🚨 NEW ORDER REQUEST'}*\n\n` +
        `• *Order Number*: #${orderNumber}\n` +
        `• *Customer*: ${customerName} (${customerEmail})\n` +
        `• *Net Amount*: ₹${amount}\n` +
        `• *Method*: ${method}\n` +
        `• *Reference ID / UTR*: \`${refId}\`\n\n` +
        `👉 _Please log in to the admin panel to review and approve/deny this order._`;

      const telegramUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
      
      await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramChatId.trim(),
          text: messageText,
          parse_mode: 'Markdown'
        })
      })
      .then(async (res) => {
        if (!res.ok) {
          const errText = await res.text();
          console.error(`Telegram API responded with status: ${res.status}, response: ${errText}`);
        }
      })
      .catch(err => console.error('Error triggering Telegram Bot:', err));
    }
  } catch (err) {
    console.error('CRITICAL: Failed to dispatch order notification:', err);
  }
}
