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
    
    // Render actual design reference images
    if (Array.isArray(design?.designReferenceFiles)) {
      design.designReferenceFiles.forEach((file: any) => {
        if (file?.url) {
          images.push(`<img src="${file.url}" alt="Reference" class="design-image" />`);
        } else if (file?.secure_url) {
          images.push(`<img src="${file.secure_url}" alt="Reference" class="design-image" />`);
        }
      });
    }
    
    // Also check for designReferenceFiles in garment level
    if (Array.isArray(garment?.designReferenceFiles)) {
      garment.designReferenceFiles.forEach((file: any) => {
        if (file?.url) {
          images.push(`<img src="${file.url}" alt="Reference" class="design-image" />`);
        } else if (file?.secure_url) {
          images.push(`<img src="${file.secure_url}" alt="Reference" class="design-image" />`);
        }
      });
    }
    
    // Render canvas image
    if (design?.canvasImage) {
      images.push(`<img src="${design.canvasImage}" alt="Canvas" class="canvas-image" />`);
    } else if (garment?.measurement?.canvasImageFile?.url) {
      images.push(`<img src="${garment.measurement.canvasImageFile.url}" alt="Canvas" class="canvas-image" />`);
    } else if (garment?.measurement?.canvasImageFile?.secure_url) {
      images.push(`<img src="${garment.measurement.canvasImageFile.secure_url}" alt="Canvas" class="canvas-image" />`);
    }
    
    // Fallback placeholders if no images
    if (images.length === 0) {
      images.push('<div class="image-placeholder">No Reference Images</div>');
      images.push('<div class="image-placeholder canvas">No Canvas</div>');
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
      padding: 8px;
      border: 1px solid #1e40af;
      margin-top: 8px;
      font-size: 12px;
    }
    
    .delivery-instructions div {
      margin-bottom: 4px;
    }
    
    .delivery-instructions div:last-child {
      margin-bottom: 0;
    }
    
    .content-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    
    .measurements-column, .designs-column {
      border: 2px solid #2563eb;
      padding: 10px;
    }
    
    .measurements-title, .designs-title {
      font-size: 16px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 8px;
      text-align: center;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 4px;
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
    
    .design-section {
      margin-bottom: 8px;
      border: 1px solid #e2e8f0;
      padding: 8px;
    }
    
    .design-header {
      font-size: 14px;
      font-weight: bold;
      color: #374151;
      margin-bottom: 4px;
      padding: 4px 8px;
      background: #f3f4f6;
      border: 1px solid #d1d5db;
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
      margin-top: 8px;
    }
    
    .design-image, .canvas-image {
      width: 150px;
      height: 100px;
      object-fit: cover;
      border: 2px solid #2563eb;
      margin: 2px;
    }
    
    .canvas-image {
      border-color: #dc2626;
    }
    
    .image-placeholder {
      width: 150px;
      height: 100px;
      border: 2px solid #2563eb;
      text-align: center;
      padding: 10px;
      margin: 2px;
      color: #64748b;
      font-size: 10px;
      font-weight: bold;
    }
    
    .image-placeholder.canvas {
      border-color: #dc2626;
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
    <div class="content-layout">
      <!-- Left Column: Measurements -->
      <div class="measurements-column">
        <div class="measurements-title">📏 Measurements</div>
            <ul class="measurement-list">
              ${(() => {
                               // Ultra-simple measurement extraction for fastest PDF generation
               let measurements = {};
               
               if (garmentsData.length > 0) {
                 const garment = garmentsData[0];
                 if (garment?.measurement?.measurements) {
                   measurements = garment.measurement.measurements;
                 } else if (garment?.measurements) {
                   measurements = garment.measurements;
                 } else if (garment?.measurement) {
                   measurements = garment.measurement;
                 }
                 
                 // Simple filtering and formatting
                 const validMeasurements = Object.entries(measurements)
                   .filter(([key, value]) => {
                     if (!value || value === '') return false;
                     if (key === 'canvasImageFile' || key === 'voiceNoteFile' || key === 'canvasImage') return false;
                     if (typeof value === 'object') return false;
                     return true;
                   })
                   .slice(0, 10) // Limit to first 10 measurements for speed
                   .map(([key, value]) => {
                     const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()).trim();
                     return `<li><span class="measurement-label">${label}</span> <span class="measurement-value">${value}</span></li>`;
                   });
                 
                 if (validMeasurements.length > 0) {
                   return validMeasurements.join("");
                 }
               }
               
               return "<li><span class='measurement-label'>No measurements</span> <span class='measurement-value'>Available</span></li>";
              })()}
            </ul>
          </div>
      
             <!-- Right Column: Design References -->
       <div class="designs-column">
         <div class="designs-title">🎨 Design References</div>
                 ${garmentsData.map((garment: any, gIdx: number) => {
           return Array.isArray(garment.designs) && garment.designs.length > 0
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
                    </div>
                  `).join("")
                          : `<div class="design-section">
                 <div class="design-header">Design ${gIdx + 1}: ${garment.order?.orderType || "Custom Garment"}</div>
                 <div class="design-description">Custom design with standard specifications</div>
                 ${garment.variant ? `<div class="design-variant">Variant: ${garment.variant}</div>` : ''}
                 <div class="design-images">
                   <div class="image-placeholder">Reference</div>
                   <div class="image-placeholder canvas">Canvas</div>
                 </div>
               </div>`;
         }).join("")}
        
        
      </div>
    </div>
  </div>
  

</body>
</html>`;
} 