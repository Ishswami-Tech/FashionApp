// Shared enhanced customer invoice HTML template for Sony Fashion
// This function is used by both order creation and PDF generation endpoints

export function getCustomerInvoiceHtml(order: any) {
  const customerData = order;
  const garmentsData = order.garments || [];
  const deliveryData = order;
  const orderTotalAmount = parseFloat(order.totalAmount || 0);
  const currentDate = order.orderDate || new Date().toLocaleDateString();
  const orderId = order.oid || '';

  // Format date for display (e.g., July 20, 2025)
  function formatDisplayDate(dateStr: string) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  // Build garments table rows
  let garmentsRows = '';
  let subtotal = 0;
  let totalQuantity = 0;
  garmentsData.forEach((garment: any) => {
    const itemName = garment.order?.orderType || garment.name || 'Custom Garment';
    const type = garment.variant || garment.type || '-';
    const quantity = garment.order?.quantity || garment.quantity || 1;
    let price = 0;
    if (Array.isArray(garment.designs)) {
      price = garment.designs.reduce((sum: number, d: any) => sum + (parseFloat(d.amount) || 0), 0);
    } else if (garment.amount) {
      price = parseFloat(garment.amount) || 0;
    }
    subtotal += price * quantity;
    totalQuantity += quantity;
    garmentsRows += `
      <tr>
        <td>${itemName}</td>
        <td>${type}</td>
        <td>${quantity}</td>
        <td>₹${(price * quantity).toLocaleString('en-IN')}</td>
      </tr>`;
  });

  // Charges (use dummy values if not present)
  let stitchingCharges = order.stitchingCharges !== undefined ? parseFloat(order.stitchingCharges) : 300;
  let deliveryCharges = order.deliveryCharges !== undefined ? parseFloat(order.deliveryCharges) : 50;
  let gst = Math.round(0.18 * subtotal);
  let total = subtotal + stitchingCharges + gst + deliveryCharges;

  // If orderTotalAmount is set and different, use it as total
  if (orderTotalAmount && Math.abs(orderTotalAmount - total) > 1) {
    total = orderTotalAmount;
  }

  // Payment method
  const paymentMethod = deliveryData.payment || 'Cash on Delivery';
  const specialInstructions = deliveryData.specialInstructions || 'None';
  const deliveryDate = formatDisplayDate(deliveryData.deliveryDate);
  const advanceAmount = order.advanceAmount ? Number(order.advanceAmount) : 0;
  const dueAmount = order.dueAmount !== undefined ? Number(order.dueAmount) : (total - advanceAmount);

  // Customer info
  const customerName = customerData.fullName || '-';
  const customerPhone = customerData.contactNumber ? `+91 ${customerData.contactNumber}` : '-';
  const customerEmail = customerData.email || '-';
  const customerAddress = customerData.fullAddress || '-';

  // Status
  const status = 'Order Confirmed';

  // Shop info (footer)
  const shopAddress = '456 Fashion Street, Mumbai';
  const shopPhone = '+91 12345 67890';
  const shopEmail = 'info@sonyfashion.com';

  return `<!DOCTYPE html>
<html>
<head>
  <title>Enhanced Customer Invoice Preview</title>
  <style>
    * {
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
      print-color-adjust: exact !important;
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      min-height: 100vh;
      padding: 8px;
      font-size: 10px;
    }
    .invoice-container {
      max-width: 700px;
      margin: 0 auto;
      background: white;
      border-radius: 10px;
      box-shadow: 0 8px 20px rgba(0,0,0,0.08);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: repeating-linear-gradient(
        45deg,
        transparent,
        transparent 10px,
        rgba(255,255,255,0.1) 10px,
        rgba(255,255,255,0.1) 20px
      );
      animation: shimmer 20s linear infinite;
    }
    @keyframes shimmer {
      0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
      100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
    }
    .header h1 {
      font-size: 28px;
      margin-bottom: 10px;
      position: relative;
      z-index: 1;
    }
    .header p {
      font-size: 14px;
      opacity: 0.9;
      position: relative;
      z-index: 1;
    }
    .content {
      padding: 12px;
    }
    .section {
      margin-bottom: 10px;
      border-radius: 6px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.03);
    }
    .section-title {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      color: white;
      padding: 8px 12px;
      font-weight: 600;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .section-content {
      background: #fafafa;
      padding: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: 8px;
      overflow: hidden;
    }
    th, td {
      padding: 6px 8px;
      text-align: left;
      border-bottom: 1px solid #eee;
      font-size: 13px;
    }
    th {
      background: #f8f9fa;
      font-weight: 600;
      color: #333;
    }
    tr:last-child td {
      border-bottom: none;
    }
    tr:hover {
      background: #f8f9ff;
    }
    .garments-table {
      margin-top: 6px;
    }
    .garment-image {
      width: 60px;
      height: 60px;
      object-fit: cover;
      border-radius: 8px;
      border: 2px solid #e0e0e0;
    }
    .total-section {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      color: white;
      padding: 20px;
      border-radius: 10px;
      margin-top: 20px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 16px;
    }
    .final-total {
      font-weight: bold;
      font-size: 24px;
      border-top: 2px solid rgba(255,255,255,0.3);
      padding-top: 15px;
      margin-top: 15px;
    }
    .highlight {
      background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
      border: 2px solid #ffd700;
      border-radius: 10px;
      padding: 15px;
      margin-top: 15px;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .status-pending {
      background: #fff3cd;
      color: #856404;
      border: 1px solid #ffeaa7;
    }
    .footer {
      background: #2c3e50;
      color: white;
      padding: 10px;
      text-align: center;
      font-size: 11px;
    }
    .total-amount-cell {
      background: #1976d2;
      color: #fff;
      font-weight: bold;
      font-size: 17px;
      border-radius: 6px;
      padding: 10px 18px;
      text-align: right;
    }
    @media print {
      @page { margin: 0.5in; size: A4; }
      body { background: white; padding: 0; }
      .invoice-container { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <h1>🎯 Your Order Confirmation</h1>
      <h2 style="margin: 10px 0; font-size: 18px;">Sony Fashion</h2>
      <p>Order ID: ${orderId}</p>
      <p>Date: ${formatDisplayDate(currentDate)}</p>
    </div>
    <div class="content">
      <div class="section">
        <div class="section-title">
          👤 Customer Information
        </div>
        <div class="section-content">
          <table>
            <tr><th>Name</th><td>${customerName}</td></tr>
            <tr><th>Phone</th><td>${customerPhone}</td></tr>
            <tr><th>Email</th><td>${customerEmail}</td></tr>
            <tr><th>Address</th><td>${customerAddress}</td></tr>
          </table>
        </div>
      </div>
      <div class="section">
        <div class="section-title">
          👕 Garment Details
        </div>
        <div class="section-content">
          <table class="garments-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              ${garmentsRows}
            </tbody>
          </table>
        </div>
      </div>
      <div class="section">
        <div class="section-title">
          📦 Order Summary
        </div>
        <div class="section-content">
          <table>
            <tr><th>Total Garments</th><td>${totalQuantity} item${totalQuantity > 1 ? 's' : ''}</td></tr>
            <tr><th>Delivery Date</th><td>${deliveryDate}</td></tr>
            <tr><th>Payment Method</th><td>${paymentMethod}</td></tr>
            <tr><th>Special Instructions</th><td>${specialInstructions}</td></tr>
            <tr><th>Status</th><td><span class="status-badge status-pending">${status}</span></td></tr>
            <tr><th>Total Amount</th><td class="total-amount-cell">₹${total.toLocaleString('en-IN')}</td></tr>
            ${paymentMethod === 'advance' && advanceAmount ? `<tr><th>Advance Paid</th><td>₹${advanceAmount.toLocaleString('en-IN')}</td></tr>` : ''}
            ${paymentMethod === 'advance' && advanceAmount ? `<tr><th>Amount Due</th><td><b>₹${dueAmount.toLocaleString('en-IN')}</b></td></tr>` : ''}
          </table>
        </div>
      </div>
    </div>
    <div class="footer">
      <p>Thank you for choosing Sony Fashion! 🙏</p>
      <p>📍 Shop Address: ${shopAddress} | 📞 ${shopPhone} | 📧 ${shopEmail}</p>
    </div>
  </div>
  <script>
    // Add some interactivity for demo
    document.addEventListener('DOMContentLoaded', function() {
      const sections = document.querySelectorAll('.section');
      sections.forEach((section, index) => {
        setTimeout(() => {
          section.style.opacity = '0';
          section.style.transform = 'translateY(20px)';
          section.style.transition = 'all 0.6s ease';
          setTimeout(() => {
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
          }, 100);
        }, index * 100);
      });
    });
  </script>
</body>
</html>`;
} 