// Order Debug Utilities for Large Order Troubleshooting

export interface OrderDebugInfo {
  garmentsCount: number;
  totalDesigns: number;
  totalFiles: number;
  totalFileSize: number;
  estimatedProcessingTime: number;
  validationWarnings: string[];
  validationErrors: string[];
}

export function analyzeOrderComplexity(garments: any[]): OrderDebugInfo {
  let totalDesigns = 0;
  let totalFiles = 0;
  let totalFileSize = 0;
  const warnings: string[] = [];
  const errors: string[] = [];

  garments.forEach((garment, gIndex) => {
    if (garment.designs) {
      totalDesigns += garment.designs.length;
      
      garment.designs.forEach((design: any, dIndex: number) => {
        // Count design reference files
        if (design.designReference && Array.isArray(design.designReference)) {
          totalFiles += design.designReference.length;
          design.designReference.forEach((file: any) => {
            if (file instanceof File) {
              totalFileSize += file.size;
            }
          });
        }
        
        // Count cloth images
        if (design.clothImages && Array.isArray(design.clothImages)) {
          totalFiles += design.clothImages.length;
          design.clothImages.forEach((file: any) => {
            if (file instanceof File) {
              totalFileSize += file.size;
            }
          });
        }
        
        // Check for canvas images
        if (design.canvasImage) {
          totalFiles += 1;
          // Estimate canvas image size (base64 data URL)
          if (typeof design.canvasImage === 'string') {
            totalFileSize += Math.ceil(design.canvasImage.length * 0.75); // rough base64 to byte conversion
          }
        }
      });
    }
  });

  // Generate warnings
  if (garments.length > 5) {
    warnings.push(`Large order: ${garments.length} garments may take longer to process`);
  }
  
  if (totalDesigns > 30) {
    warnings.push(`High design count: ${totalDesigns} designs may require extended processing time`);
  }
  
  if (totalFiles > 80) {
    warnings.push(`Many files: ${totalFiles} files may slow down upload`);
  }
  
  if (totalFileSize > 50 * 1024 * 1024) { // 50MB
    warnings.push(`Large payload: ${Math.round(totalFileSize / 1024 / 1024)}MB may require longer upload time`);
  }

  // Generate errors
  if (garments.length > 8) {
    errors.push(`Too many garments: ${garments.length} exceeds maximum of 8. Please split into multiple orders.`);
  }
  
  if (totalDesigns > 60) {
    errors.push(`Too many designs: ${totalDesigns} exceeds maximum of 60. Please reduce or split order.`);
  }
  
  if (totalFiles > 120) {
    errors.push(`Too many files: ${totalFiles} exceeds maximum of 120. Please reduce reference images.`);
  }
  
  if (totalFileSize > 100 * 1024 * 1024) { // 100MB
    errors.push(`Payload too large: ${Math.round(totalFileSize / 1024 / 1024)}MB exceeds maximum. Please reduce image sizes.`);
  }

  // Estimate processing time (rough calculation)
  let estimatedTime = 30; // base time in seconds
  estimatedTime += garments.length * 10; // 10s per garment
  estimatedTime += totalDesigns * 5; // 5s per design
  estimatedTime += Math.floor(totalFiles / 5) * 10; // 10s per 5 files

  return {
    garmentsCount: garments.length,
    totalDesigns,
    totalFiles,
    totalFileSize,
    estimatedProcessingTime: estimatedTime,
    validationWarnings: warnings,
    validationErrors: errors
  };
}

export function logOrderDebugInfo(debugInfo: OrderDebugInfo) {
  console.group('🔍 Order Analysis Debug Info');
  console.log(`📊 Summary:`, {
    garments: debugInfo.garmentsCount,
    designs: debugInfo.totalDesigns,
    files: debugInfo.totalFiles,
    sizeKB: Math.round(debugInfo.totalFileSize / 1024),
    estimatedTimeMin: Math.round(debugInfo.estimatedProcessingTime / 60)
  });
  
  if (debugInfo.validationWarnings.length > 0) {
    console.warn('⚠️ Warnings:', debugInfo.validationWarnings);
  }
  
  if (debugInfo.validationErrors.length > 0) {
    console.error('❌ Errors:', debugInfo.validationErrors);
  }
  
  console.log('⏱️ Processing Time Estimate:', `${Math.round(debugInfo.estimatedProcessingTime / 60)} minutes`);
  console.groupEnd();
}

export function createFormDataDebugInfo(formData: FormData): void {
  console.group('📋 FormData Analysis');
  
  let fileCount = 0;
  let totalSize = 0;
  const fileTypes: Record<string, number> = {};
  
  for (let [key, value] of formData.entries()) {
    if (value instanceof File) {
      fileCount++;
      totalSize += value.size;
      
      const fileType = key.includes('canvas') ? 'canvas' : 
                      key.includes('designReference') ? 'designRef' :
                      key.includes('clothImage') ? 'clothImage' : 'other';
      
      fileTypes[fileType] = (fileTypes[fileType] || 0) + 1;
      
      console.log(`📎 ${key}: ${value.name} (${Math.round(value.size / 1024)}KB)`);
    } else {
      console.log(`📝 ${key}: ${typeof value === 'string' ? value.substring(0, 100) + (value.length > 100 ? '...' : '') : value}`);
    }
  }
  
  console.log(`📊 File Summary:`, {
    totalFiles: fileCount,
    totalSizeKB: Math.round(totalSize / 1024),
    byType: fileTypes
  });
  
  console.groupEnd();
}

export function monitorRequestProgress(
  onProgress?: (progress: { stage: string; percent: number }) => void
) {
  const stages = [
    { name: 'Preparing data', duration: 5000 },
    { name: 'Uploading files', duration: 60000 },
    { name: 'Processing images', duration: 90000 },
    { name: 'Generating invoices', duration: 30000 },
    { name: 'Sending notifications', duration: 10000 }
  ];
  
  let currentStage = 0;
  let startTime = Date.now();
  
  const updateProgress = () => {
    if (currentStage >= stages.length) return;
    
    const elapsed = Date.now() - startTime;
    const currentStageDuration = stages[currentStage].duration;
    const stageProgress = Math.min(100, (elapsed / currentStageDuration) * 100);
    
    onProgress?.({
      stage: stages[currentStage].name,
      percent: stageProgress
    });
    
    if (stageProgress >= 100) {
      currentStage++;
      startTime = Date.now();
    }
    
    if (currentStage < stages.length) {
      setTimeout(updateProgress, 1000);
    }
  };
  
  updateProgress();
}