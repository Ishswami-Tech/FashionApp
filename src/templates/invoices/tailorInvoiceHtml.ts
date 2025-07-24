// Shared enhanced tailor invoice HTML template for Sony Fashion
// This function is used by both order creation and PDF generation endpoints

export function getTailorInvoiceHtml(order: any) {
  const garmentsData = order.garments || [];
  const deliveryData = order;
  const paymentMethod = deliveryData.payment || '';
  const advanceAmount = order.advanceAmount ? Number(order.advanceAmount) : 0;
  const dueAmount = order.dueAmount !== undefined ? Number(order.dueAmount) : undefined;
  const orderIdValue = order.oid;

  function renderDesignImages(design: any) {
    let images: string[] = [];
    if (design && design.canvasImage && typeof design.canvasImage === "string" && design.canvasImage.startsWith("data:image/")) {
      images.push(`<img src="${design.canvasImage}" alt="Canvas Drawing" class="canvas-image" />`);
    }
    const refs = [
      ...(Array.isArray(design?.designReference) ? design.designReference : []),
      ...(Array.isArray(design?.designReferenceFiles) ? design.designReferenceFiles : []),
    ];
    images = images.concat(
      refs
        .map((img, idx) => {
          if (typeof img === "string") return `<img src="${img}" alt="Reference ${idx + 1}" class="canvas-image" />`;
          if (img && img.url) return `<img src="${img.url}" alt="Reference ${idx + 1}" class="canvas-image" />`;
          return "";
        })
        .filter(Boolean)
    );
    return images.length > 0 ? images.join("") : "<span>No images</span>";
  }

  function formatDisplayDate(dateStr: string | undefined) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  return `<!DOCTYPE html>
<html>
<head>
  <title>Tailor Work Order</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 11px; background: #fafbfc; margin: 0; padding: 0; }
    .main-container { max-width: 900px; margin: 12px auto; background: #fff; border: 1.5px solid #388e3c; border-radius: 8px; box-shadow: 0 1px 4px #0001; padding: 16px 10px; }
    .order-id { font-size: 14px; font-weight: bold; color: #388e3c; margin-bottom: 10px; letter-spacing: 1px; }
    .garment-section { border: 1.5px solid #388e3c; border-radius: 8px; margin-bottom: 28px; padding: 18px 14px; background: #f6fff6; }
    .garment-title { font-size: 15px; font-weight: bold; color: #2e7d32; margin-bottom: 8px; }
    .two-col { display: grid; grid-template-columns: 1fr 1.2fr; gap: 12px; align-items: flex-start; }
    .section-title { font-weight: bold; color: #388e3c; margin-bottom: 6px; font-size: 13px; border-bottom: 1px solid #388e3c; padding-bottom: 2px; }
    .measurement-list { list-style: none; padding: 0; margin: 0; }
    .measurement-list li { margin-bottom: 2px; padding: 2px 4px; font-size: 13px; }
    .measurement-label { font-size: 13px; font-weight: bold; color: #222; margin-right: 6px; }
    .measurement-value { font-size: 14px; font-weight: bold; color: #1565c0; }
    .canvas-image, .design-image { max-width: 340px; max-height: 340px; width: 100%; height: auto; object-fit: contain; border: 1.5px solid #388e3c; border-radius: 6px; background: #f8f9fa; box-shadow: 0 1px 4px #0001; margin-bottom: 6px; }
    .design-images { display: flex; flex-direction: column; gap: 8px; margin: 0; }
    .right-col-section { margin-bottom: 10px; }
    .work-instructions { background: #e8f5e8; border-left: 3px solid #388e3c; border-radius: 4px; padding: 8px 8px; font-size: 11px; color: #222; margin-top: 10px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 4px; }
    th, td { border: 1px solid #e0e0e0; padding: 4px 6px; text-align: left; }
  </style>
</head>
<body>
  <div class="main-container">
    <div class="order-id" style="font-size:20px;font-weight:bold;">Order ID: ${orderIdValue}</div>
    ${garmentsData.map((garment: any, gIdx: number) => `
      <div class="garment-section">
        <div class="garment-title">Garment ${gIdx + 1}: ${garment.order?.orderType || ""} ${garment.variant ? `- ${garment.variant}` : ""}</div>
        <div class="two-col">
          <div>
            <div class="section-title">Measurements</div>
            <ul class="measurement-list">
              ${garment.measurement && garment.measurement.measurements && Object.keys(garment.measurement.measurements).length > 0
                ? Object.entries(garment.measurement.measurements)
                    .map(
                      ([key, value]) => `<li><span class="measurement-label">${key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}:</span> <span class="measurement-value">${value}</span></li>`
                    )
                    .join("")
                : "<li>No measurements</li>"}
            </ul>
          </div>
          <div>
            <div class="right-col-section">
              <div class="section-title">Design References</div>
              ${Array.isArray(garment.designs) && garment.designs.length > 0
                ? garment.designs.map((design: any, idx: number) => `
                    <div style="margin-bottom:14px;">
                      <div><strong>Design ${idx + 1}:</strong> ${design.name || `Design ${idx + 1}`}</div>
                      <div>${design.designDescription || "Custom design"}</div>
                      <div class="design-images">${renderDesignImages(design)}</div>
                    </div>
                  `).join("")
                : "<div>No design data</div>"}
            </div>
            <div class="right-col-section">
              <div class="section-title">Delivery Details</div>
              <table>
                <tr><th>Delivery Date</th><td>${formatDisplayDate(deliveryData.deliveryDate)}</td></tr>
                ${paymentMethod === 'advance' && advanceAmount ? `<tr><th>Advance Paid</th><td>₹${advanceAmount.toLocaleString('en-IN')}</td></tr>` : ''}
                ${paymentMethod === 'advance' && dueAmount !== undefined ? `<tr><th>Amount Due</th><td><b>₹${dueAmount.toLocaleString('en-IN')}</b></td></tr>` : ''}
              </table>
            </div>
            <div class="work-instructions">
              <div style="font-weight:bold; margin-bottom:4px;">Work Instructions</div>
              <div>• ${garment.order?.orderType || ""} ${garment.variant ? `in ${garment.variant} variant` : ""}</div>
              <div>• Quantity: ${garment.order?.quantity || ""}</div>
              <div>• Urgency: ${garment.order?.urgency || ""}</div>
              <div>• Follow the design references provided</div>
              <div>• Use the exact measurements provided</div>
              <div>• Special instructions: ${deliveryData.specialInstructions || "None"}</div>
              <div>• Complete by: ${deliveryData.deliveryDate || ''}</div>
            </div>
          </div>
        </div>
      </div>
    `).join("")}
  </div>
</body>
</html>`;
} 