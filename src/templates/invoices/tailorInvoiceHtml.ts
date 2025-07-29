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
    const urlSet = new Set<string>();
    
    console.log(`[Tailor Invoice] Rendering images for design:`, design?.name || 'unnamed');
    console.log(`[Tailor Invoice] Design reference files:`, design?.designReferenceFiles);
    console.log(`[Tailor Invoice] Garment canvas image:`, garment?.measurement?.canvasImageFile);
    
    // Always include all designReferenceFiles (Cloudinary URLs)
    if (Array.isArray(design?.designReferenceFiles)) {
      design.designReferenceFiles.forEach((file: any) => {
        if (file?.url && !urlSet.has(file.url)) {
          console.log(`[Tailor Invoice] Adding design reference image:`, file.url);
          images.push(`<img src="${file.url}" alt="Reference" class="canvas-image" />`);
          urlSet.add(file.url);
        }
      });
    }
    
    // Canvas image - check both design level and garment level
    if (design?.canvasImage && typeof design.canvasImage === 'string' && !urlSet.has(design.canvasImage)) {
      console.log(`[Tailor Invoice] Adding design canvas image:`, design.canvasImage);
      images.push(`<img src="${design.canvasImage}" alt="Canvas Drawing" class="canvas-image" />`);
      urlSet.add(design.canvasImage);
    } else if (garment?.measurement?.canvasImageFile?.url && !urlSet.has(garment.measurement.canvasImageFile.url)) {
      console.log(`[Tailor Invoice] Adding garment canvas image:`, garment.measurement.canvasImageFile.url);
      images.push(`<img src="${garment.measurement.canvasImageFile.url}" alt="Canvas Drawing" class="canvas-image" />`);
      urlSet.add(garment.measurement.canvasImageFile.url);
    }
    // Other possible image fields
    const possibleArrays = [
      design?.designReference,
      design?.designReferencePreviews,
      design?.uploadedImages,
      design?.referenceImages,
      design?.images
    ];
    possibleArrays.forEach(arr => {
      if (Array.isArray(arr)) {
        arr.forEach((img: any) => {
          let url = '';
          if (typeof img === 'string') url = img;
          else if (img?.url) url = img.url;
          else if (img?.secure_url) url = img.secure_url;
          if (url && !urlSet.has(url)) {
            images.push(`<img src="${url}" alt="Reference" class="canvas-image" />`);
            urlSet.add(url);
          }
        });
      }
    });
    // Single image fields
    [design?.uploadedImage, design?.referenceImage].forEach(img => {
      let url = '';
      if (typeof img === 'string') url = img;
      else if (img?.url) url = img.url;
      else if (img?.secure_url) url = img.secure_url;
      if (url && !urlSet.has(url)) {
        images.push(`<img src="${url}" alt="Reference" class="canvas-image" />`);
        urlSet.add(url);
      }
    });
    // Fallback: check for any image-like fields
    Object.keys(design).forEach(key => {
      if (key.toLowerCase().includes('image') && design[key]) {
        const val = design[key];
        if (Array.isArray(val)) {
          val.forEach((img: any) => {
            let url = '';
            if (typeof img === 'string') url = img;
            else if (img?.url) url = img.url;
            else if (img?.secure_url) url = img.secure_url;
            if (url && !urlSet.has(url)) {
              images.push(`<img src="${url}" alt="Reference" class="canvas-image" />`);
              urlSet.add(url);
            }
          });
        } else {
          let url = '';
          if (typeof val === 'string') url = val;
          else if (val?.url) url = val.url;
          else if (val?.secure_url) url = val.secure_url;
          if (url && !urlSet.has(url)) {
            images.push(`<img src="${url}" alt="Reference" class="canvas-image" />`);
            urlSet.add(url);
          }
        }
      }
    });
    console.log(`[Tailor Invoice] Total images found: ${images.length}`);
    if (images.length === 0) {
      console.log(`[Tailor Invoice] No images found, showing placeholder`);
      images.push('<span style="color:#888">No images available</span>');
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
    ${garmentsData.map((garment: any, gIdx: number) => {
      const totalQty = (garment.quantity || 1) * (Array.isArray(garment.designs) && garment.designs.length > 0 ? garment.designs.length : 1);
      const qty = Array.isArray(garment.designs) ? garment.designs.length : (garment.quantity || 1);
      return `
      <div class="garment-section">
        <div class="garment-title">Garment ${gIdx + 1}: ${garment.order?.orderType || ""} ${garment.variant ? `- ${garment.variant}` : ""}</div>
        <div class="two-col">
          <div>
            <div class="section-title">Measurements</div>
            <ul class="measurement-list">
              ${(() => {
                // Enhanced robust measurement extraction with comprehensive logging
                let measurements = {};
                let measurementSource = 'none';
                
                // Try different measurement structures with logging
                if (garment?.measurement?.measurements && typeof garment.measurement.measurements === 'object') {
                  measurements = garment.measurement.measurements;
                  measurementSource = 'garment.measurement.measurements';
                } else if (garment?.measurements && typeof garment.measurements === 'object') {
                  measurements = garment.measurements;
                  measurementSource = 'garment.measurements';
                } else if (garment?.measurement && typeof garment.measurement === 'object') {
                  measurements = garment.measurement;
                  measurementSource = 'garment.measurement';
                }
                
                console.log(`[Tailor Invoice] Garment ${gIdx + 1} measurements from: ${measurementSource}`);
                console.log(`[Tailor Invoice] Raw measurements:`, measurements);
                
                // Filter and format measurements
                const validMeasurements = Object.entries(measurements)
                  .filter(([key, value]) => {
                    // Skip empty values and file references
                    if (!value || value === '') return false;
                    if (key === 'canvasImageFile' || key === 'voiceNoteFile' || key === 'canvasImage') return false;
                    if (typeof value === 'object') return false; // Skip objects
                    return true;
                  })
                  .map(([key, value]) => {
                    // Format the key for display
                    const label = key
                      .replace(/([A-Z])/g, " $1") // Add space before capital letters
                      .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
                      .replace(/\s+/g, ' ') // Clean up multiple spaces
                      .trim();
                    
                    return `<li><span class="measurement-label">${label}:</span> <span class="measurement-value">${value}</span></li>`;
                  });
                
                console.log(`[Tailor Invoice] Valid measurements count: ${validMeasurements.length}`);
                
                if (validMeasurements.length > 0) {
                  return validMeasurements.join("");
                } else {
                  return "<li>No measurements available</li>";
                }
              })()}
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
                      <div class="design-images">${renderDesignImages(design, garment)}</div>
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
              <div>• Quantity: ${totalQty}</div>
              <div>• Urgency: ${garment.order?.urgency || ""}</div>
              <div>• Follow the design references provided</div>
              <div>• Use the exact measurements provided</div>
              <div>• Special instructions: ${deliveryData.specialInstructions || "None"}</div>
              <div>• Complete by: ${deliveryData.deliveryDate || ''}</div>
            </div>
          </div>
        </div>
      </div>
    `;
    }).join("")}
  </div>
</body>
</html>`;
} 