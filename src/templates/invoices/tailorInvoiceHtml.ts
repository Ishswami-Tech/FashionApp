// Shared enhanced tailor invoice HTML template for Sony Fashion
// This function is used by both order creation and PDF generation endpoints

export function getTailorInvoiceHtml(order: any) {
  // Robust data extraction with comprehensive fallbacks
  const garmentsData = Array.isArray(order?.garments) ? order.garments : [];
  const deliveryData = order || {};
  
  // Ensure numeric values are properly parsed
  const paymentMethod = deliveryData?.payment || 'Cash on Delivery';
  const advanceAmount = typeof order?.advanceAmount === 'number' ? order.advanceAmount :
                       typeof order?.advanceAmount === 'string' ? parseFloat(order.advanceAmount) || 0 : 0;
  const dueAmount = typeof order?.dueAmount === 'number' ? order.dueAmount :
                   typeof order?.dueAmount === 'string' ? parseFloat(order.dueAmount) : undefined;
  const orderIdValue = order?.oid || 'N/A';
  
  console.log(`[Tailor Invoice] Processing order ${orderIdValue} with ${garmentsData.length} garments`);

  function renderDesignImages(design: any, garment: any) {
    let images: string[] = [];
    let hasReferenceImages = false;
    let hasCanvasImage = false;
    
    // Handle design reference images - prioritize Cloudinary URLs
    if (design?.designReferenceFiles?.length > 0) {
      design.designReferenceFiles.forEach((file: any) => {
        const url = file?.secure_url || file?.url || file;
        if (url && !url.startsWith('blob:')) {
          images.push(`<img src="${url}" alt="Reference" class="design-image" />`);
          hasReferenceImages = true;
        }
      });
    } else if (garment?.designReferenceFiles?.length > 0) {
      garment.designReferenceFiles.forEach((file: any) => {
        const url = file?.secure_url || file?.url || file;
        if (url && !url.startsWith('blob:')) {
          images.push(`<img src="${url}" alt="Reference" class="design-image" />`);
          hasReferenceImages = true;
        }
      });
    } else if (design?.designReferencePreviews?.length > 0) {
      design.designReferencePreviews.forEach((preview: string) => {
        if (!preview.startsWith('blob:')) {
          images.push(`<img src="${preview}" alt="Reference" class="design-image" />`);
          hasReferenceImages = true;
        }
      });
    }
    
    // Use canvas image - prioritize Cloudinary URLs
    if (garment?.measurement?.canvasImageFile?.url) {
      images.push(`<img src="${garment.measurement.canvasImageFile.url}" alt="Canvas" class="canvas-image" />`);
      hasCanvasImage = true;
    } else if (garment?.measurement?.canvasImageFile?.secure_url) {
      images.push(`<img src="${garment.measurement.canvasImageFile.secure_url}" alt="Canvas" class="canvas-image" />`);
      hasCanvasImage = true;
    } else if (design?.canvasImagePreview && !design.canvasImagePreview.startsWith('blob:')) {
      images.push(`<img src="${design.canvasImagePreview}" alt="Canvas" class="canvas-image" />`);
      hasCanvasImage = true;
    } else if (design?.canvasImage && !design.canvasImage.startsWith('blob:')) {
      images.push(`<img src="${design.canvasImage}" alt="Canvas" class="canvas-image" />`);
      hasCanvasImage = true;
    }
    
    // Add placeholders only if specific type of image is missing
    if (!hasReferenceImages) {
      images.push('<div class="image-placeholder">No Reference Images</div>');
    }
    if (!hasCanvasImage) {
      images.push('<div class="image-placeholder canvas">No Canvas</div>');
    }
    
    return images.join("");
  }

  function renderClothImages(design: any, garment: any) {
    let images: string[] = [];
    let hasClothImages = false;
    
    // Handle cloth images - prioritize Cloudinary URLs
    if (design?.clothImageFiles?.length > 0) {
      design.clothImageFiles.forEach((file: any) => {
        const url = file?.secure_url || file?.url || file;
        if (url && !url.startsWith('blob:')) {
          images.push(`<img src="${url}" alt="Cloth" class="cloth-image" />`);
          hasClothImages = true;
        }
      });
    } else if (garment?.clothImageFiles?.length > 0) {
      garment.clothImageFiles.forEach((file: any) => {
        const url = file?.secure_url || file?.url || file;
        if (url && !url.startsWith('blob:')) {
          images.push(`<img src="${url}" alt="Cloth" class="cloth-image" />`);
          hasClothImages = true;
        }
      });
    } else if (design?.clothImagePreviews?.length > 0) {
      design.clothImagePreviews.forEach((preview: string) => {
        if (!preview.startsWith('blob:')) {
          images.push(`<img src="${preview}" alt="Cloth" class="cloth-image" />`);
          hasClothImages = true;
        }
      });
    }
    
    // Add placeholder only if no cloth images found
    if (!hasClothImages) {
      images.push('<div class="image-placeholder cloth">No Cloth Images</div>');
    }
    
    return images.join("");
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
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 10px;
      background: white;
      color: #333;
      line-height: 1.2;
    }
    
    .main-container {
      border: 2px solid #2563eb;
      padding: 10px;
    }
    
    .header-section {
      background: #2563eb;
      color: white;
      padding: 10px;
      text-align: center;
      border: 2px solid #1d4ed8;
      margin-bottom: 10px;
    }
    
    .order-id {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 4px;
      color: white;
    }
    
    .delivery-instructions {
      background: #1d4ed8;
      padding: 6px;
      border: 1px solid #1e40af;
      margin-top: 6px;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 4px;
      font-size: 11px;
    }
    
    .delivery-instructions div {
      margin: 0;
      padding: 2px;
    }
    
    .garments-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .garment-section {
      border: 2px solid #2563eb;
      background: white;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .garment-header {
      background: #2563eb;
      color: white;
      padding: 12px;
      border-bottom: 2px solid #1d4ed8;
    }

    .garment-title {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 4px;
    }

    .garment-variant {
      font-size: 14px;
      opacity: 0.9;
    }

    .garment-content {
      display: grid;
      grid-template-columns: 30% 70%;
      gap: 8px;
      padding: 8px;
    }

    .measurements-column {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 8px;
      border-radius: 4px;
    }

    .designs-column {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 8px;
      border-radius: 4px;
    }

    .measurements-title, .designs-title {
      font-size: 14px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 8px;
      text-align: center;
      border-bottom: 1px solid #2563eb;
      padding-bottom: 2px;
    }
    
    .measurement-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px;
    }
    
    .measurement-list li {
      padding: 4px 8px;
      border: 1px solid #2563eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
    }
    
    .measurement-label {
      font-weight: bold;
      color: #374151;
    }
    
    .measurement-value {
      color: #059669;
      font-weight: bold;
    }
    
    .garment-measurements {
      margin-bottom: 16px;
      border: 1px solid #e2e8f0;
      padding: 8px;
      background: #f8fafc;
    }
    
    .garment-measurements:last-child {
      margin-bottom: 0;
    }
    
    .garment-title {
      font-size: 14px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 8px;
      padding: 4px 8px;
      background: #e0e7ff;
      border-radius: 4px;
    }
    
    .design-section {
      margin-bottom: 16px;
      border: 1px solid #e2e8f0;
      padding: 16px;
      background: white;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      border-radius: 4px;
    }
    
    .design-section:last-child {
      margin-bottom: 0;
    }
    
    .design-header {
      font-size: 16px;
      font-weight: bold;
      color: #1d4ed8;
      margin-bottom: 8px;
      padding: 8px 12px;
      background: #e0e7ff;
      border-radius: 4px;
      border: 1px solid #c7d2fe;
    }
    
    .design-description {
      color: #6b7280;
      margin-bottom: 4px;
      font-size: 12px;
    }
    
    .design-amount, .design-quantity, .design-fabric, .design-color, .design-variant {
      color: #374151;
      margin-bottom: 2px;
      font-size: 11px;
      font-weight: bold;
    }
    
    .design-amount {
      color: #059669;
    }
    
    .design-images {
      margin-top: 12px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 8px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
    }
    
    .cloth-images {
      margin-top: 12px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 8px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
    }
    

    
    .image-placeholder {
      width: 120px;
      height: 80px;
      border: 2px solid #2563eb;
      text-align: center;
      padding: 8px;
      margin: 2px;
      color: #64748b;
      font-size: 9px;
      font-weight: bold;
      display: inline-block;
    }
    
    .design-image, .cloth-image {
      width: 100px;
      height: 70px;
      object-fit: cover;
      border: 1px solid #2563eb;
      margin: 1px;
      display: inline-block;
    }
    
    .canvas-image {
      width: 240px;
      height: 160px;
      object-fit: cover;
      border: 2px solid #dc2626;
      margin: 1px;
      display: inline-block;
    }
    
    .cloth-image {
      border-color: #059669;
    }
    
    .image-placeholder {
      width: 100px;
      height: 70px;
      border: 1px solid #2563eb;
      text-align: center;
      padding: 4px;
      margin: 1px;
      color: #64748b;
      font-size: 9px;
      font-weight: bold;
      display: inline-block;
    }
    
    .image-placeholder.canvas {
      width: 240px;
      height: 160px;
      border: 2px solid #dc2626;
    }
    
    .image-placeholder.cloth {
      border-color: #059669;
    }
    
    .no-images {
      color: #9ca3af;
      text-align: center;
      padding: 10px;
      border: 1px dashed #d1d5db;
    }
     

  </style>
</head>
<body>
  <div class="main-container">
         <!-- Header Section: Order ID and Delivery Instructions -->
     <div class="header-section">
       <div class="order-id">Order ID: ${orderIdValue}</div>
       <div class="delivery-instructions">
         <div>Delivery Date: ${formatDisplayDate(deliveryData.deliveryDate)}</div>
         <div>Quantity: ${garmentsData.reduce((total: number, g: any) => total + (Array.isArray(g.designs) ? g.designs.length : 1), 0)} items</div>
         <div>Special Instructions: ${deliveryData.specialInstructions || "None"}</div>
         <div>Urgency: ${garmentsData[0]?.order?.urgency || "Standard"}</div>
       </div>
     </div>
    
        <!-- Main Content Layout -->
    <div class="garments-container">
    ${garmentsData.map((garment: any, gIdx: number) => {
        // Get measurements
                let measurements = {};
        if (garment?.measurement?.measurements) {
                  measurements = garment.measurement.measurements;
        } else if (garment?.measurements) {
                  measurements = garment.measurements;
        } else if (garment?.measurement) {
                  measurements = garment.measurement;
                }
                
                const validMeasurements = Object.entries(measurements)
                  .filter(([key, value]) => {
                    if (!value || value === '') return false;
                    if (key === 'canvasImageFile' || key === 'voiceNoteFile' || key === 'canvasImage') return false;
            if (typeof value === 'object') return false;
                    return true;
                  })
                  .map(([key, value]) => {
            const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()).trim();
            return `<li><span class="measurement-label">${label}</span> <span class="measurement-value">${value}</span></li>`;
          });

        return `
          <div class="garment-section">
            <div class="garment-header">
              <div class="garment-title">Garment ${gIdx + 1}: ${garment.orderType || garment.order?.orderType || "Custom Garment"}</div>
              ${garment.variant ? `<div class="garment-variant">Variant: ${garment.variant}</div>` : ''}
            </div>
            
            <div class="garment-content">
              <!-- Measurements Column -->
              <div class="measurements-column">
                <div class="measurements-title">📏 Measurements</div>
                <ul class="measurement-list">
                  ${validMeasurements.length > 0 
                    ? validMeasurements.join("")
                    : "<li><span class='measurement-label'>No measurements</span> <span class='measurement-value'>Available</span></li>"
                  }
            </ul>
          </div>

              <!-- Designs Column -->
              <div class="designs-column">
                <div class="designs-title">🎨 Design Details</div>
              ${Array.isArray(garment.designs) && garment.designs.length > 0
                ? garment.designs.map((design: any, idx: number) => `
                    <div class="design-section">
                      <div class="design-header">Design ${idx + 1}: ${design.name || `Design ${idx + 1}`}</div>
                      <div class="design-description">${design.designDescription || "Custom design"}</div>
                      ${design.amount ? `<div class="design-amount">Amount: ₹${design.amount}</div>` : ''}
                      ${design.quantity ? `<div class="design-quantity">Quantity: ${design.quantity}</div>` : ''}
                      ${design.fabric ? `<div class="design-fabric">Fabric: ${design.fabric}</div>` : ''}
                      ${design.color ? `<div class="design-color">Color: ${design.color}</div>` : ''}
                      <div class="design-images">
                        ${renderDesignImages(design, garment)}
                      </div>
                      <div class="cloth-images">
                        ${renderClothImages(design, garment)}
                      </div>
                    </div>
                  `).join("")
                  : `<div class="design-section">
                      <div class="design-header">Standard Design</div>
                      <div class="design-description">Custom design with standard specifications</div>
                      <div class="design-images">
                        ${renderDesignImages({}, garment)}
                      </div>
                    </div>`
                }
              </div>
            </div>
          </div>
        `;
      }).join("")}
    </div>

    <!-- Footer Summary -->
    <div class="footer-summary">
      <div class="footer-title">Order Summary</div>
      <div class="garments-summary">
        ${garmentsData.map((garment: any, gIdx: number) => `
          <div class="garment-summary">
            <div class="garment-summary-header">
              <div class="order-id-section">Order ID: ${orderIdValue}</div>
              <div class="garment-info-section">
                <div class="garment-name">${garment.orderType || garment.order?.orderType || "Custom Garment"}</div>
                ${garment.variant ? `<div class="garment-variant">${garment.variant}</div>` : ''}
              </div>
              ${Array.isArray(garment.designs) && garment.designs.length > 0
                ? garment.designs.map((design: any, dIdx: number) => `
                    <div class="design-name-section">
                      Design ${dIdx + 1}${design.name ? `: ${design.name}` : ''}
            </div>
                  `).join("")
                : '<div class="design-name-section">Standard Design</div>'
              }
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  </div>

  <style>
    .footer-summary {
      margin-top: 24px;
      border-top: 2px solid #2563eb;
      padding: 16px;
      background: #f8fafc;
    }

    .footer-title {
      font-size: 16px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 12px;
      text-align: center;
      border: 2px dashed #2563eb;
      padding: 8px;
      margin: 0 auto 16px;
      max-width: 200px;
      border-radius: 4px;
    }

    .garments-summary {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .garment-summary {
      width: 250px;
      margin: 0 auto;
      padding: 12px;
      background: white;
      border: 2px dashed #2563eb;
      position: relative;
      margin-bottom: 24px;
    }

    .garment-summary:last-child {
      margin-bottom: 0;
    }

    /* Scissor icon for cut lines */
    .garment-summary::before {
      content: "✂️";
      position: absolute;
      top: -12px;
      left: 8px;
      font-size: 16px;
      background: #f8fafc;
      padding: 0 4px;
    }

    .garment-summary-header {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .order-id-section {
      font-size: 14px;
      font-weight: bold;
      color: #1d4ed8;
      padding: 4px 8px;
      border-bottom: 1px solid #e5e7eb;
    }

    .garment-info-section {
      padding: 4px 8px;
      border-bottom: 1px solid #e5e7eb;
    }

    .garment-name {
      font-size: 13px;
      font-weight: bold;
      color: #374151;
    }

    .garment-variant {
      font-size: 12px;
      color: #6b7280;
    }

    .design-name-section {
      font-size: 13px;
      color: #374151;
      padding: 4px 8px;
    }
  </style>

</body>
</html>`;
} 