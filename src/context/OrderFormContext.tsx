import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  useRef,
} from "react";
import {
  CustomerInfo,
  OrderDetails,
  MeasurementDesign,
  DeliveryPayment,
} from "@/types/orderSchemas";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { orderDetailsSchema, measurementSchema } from "@/types/orderSchemas";
import measurementData from "@/app/measurement2.js";
import { toast } from "sonner";
import { analyzeOrderComplexity, logOrderDebugInfo, createFormDataDebugInfo } from "@/lib/orderDebugUtils";

const OrderFormContext = createContext<any>(null);

export const OrderFormProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [step, setStep] = useState(1);
  const [customerData, setCustomerData] = useState<CustomerInfo | null>(null);
  const [garments, setGarments] = useState<any[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>(
    undefined
  );
  const [showGarmentForm, setShowGarmentForm] = useState(true);
  const [orderOid, setOrderOid] = useState<string | null>(null);
  const [orderDate, setOrderDate] = useState<string | null>(null);
  const [submittedOrder, setSubmittedOrder] = useState<any | null>(null);
  const [designs, setDesigns] = useState<any[]>([]);
  const [unit, setUnit] = useState<"in" | "cm">("in");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [progressStates, setProgressStates] = useState({
    orderData: "pending", // 'pending', 'processing', 'completed', 'error'
    fileUpload: "pending",
    pdfGeneration: "pending",
    whatsapp: "pending",
  });
  const [garmentType, setGarmentType] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [variantOptions, setVariantOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [measurementFields, setMeasurementFields] = useState<string[]>([]);
  const [deliveryData, setDeliveryData] = useState<any>(null);

  // Step labels for stepper UI
  const stepLabels = [
    "Customer Info",
    "Order Details & Measurements",
    "Delivery & Payment",
    "Order Confirmation",
  ];

  // --- Add orderForm and measurementForm ---
  const orderForm = useForm({
    resolver: zodResolver(orderDetailsSchema),
    mode: "onChange",
    defaultValues: {
      orderType: "",
      quantity: 1,
    },
  });

  const measurementForm = useForm({
    resolver: zodResolver(measurementSchema),
    mode: "onChange",
    defaultValues: {},
  });

  const deliveryForm = useForm({
    resolver: zodResolver(require("@/types/orderSchemas").deliverySchema),
    mode: "onChange",
    defaultValues: {
      deliveryDate: deliveryData?.deliveryDate || undefined,
      urgency: deliveryData?.urgency || "regular",
      payment: deliveryData?.payment || undefined,
      advanceAmount: deliveryData?.advanceAmount || 0,
      specialInstructions: deliveryData?.specialInstructions || "",
    },
  });

  // Update delivery form when deliveryData changes
  useEffect(() => {
    if (deliveryData) {
      // Ensure deliveryDate is a valid Date object or undefined
      let validDeliveryDate = deliveryData.deliveryDate;
      if (validDeliveryDate && !(validDeliveryDate instanceof Date)) {
        const date = new Date(validDeliveryDate);
        validDeliveryDate = !isNaN(date.getTime()) ? date : undefined;
      }

      deliveryForm.reset({
        deliveryDate: validDeliveryDate,
        urgency: deliveryData.urgency || "regular",
        payment: deliveryData.payment || undefined,
        advanceAmount: deliveryData.advanceAmount || 0,
        specialInstructions: deliveryData.specialInstructions || "",
      });
    }
  }, [deliveryData, deliveryForm]);

  // --- Garment Options ---
  const garmentOptions = useMemo(() => {
    if (!measurementData?.measurement_new) return [];
    const unique = Array.from(
      new Set(measurementData.measurement_new.map((form: any) => form.category))
    );
    return unique.map((cat: string) => ({ value: cat, label: cat }));
  }, []);

  // --- Dynamic variantOptions and measurementFields ---
  useEffect(() => {
    if (!garmentType) {
      setVariantOptions([]);
      setMeasurementFields([]);
      return;
    }
    const found = measurementData.measurement_new.find(
      (form: any) => form.category === garmentType
    );
    if (found && Array.isArray(found.variants)) {
      // Only use object variants (not string)
      const variants = found.variants
        .map((v: any) =>
          typeof v === "string" ? { type: v, measurements: [] } : v
        )
        .map((v: any) => ({ value: v.type, label: v.type }));
      setVariantOptions(variants);
      // If a variant is already selected, update measurementFields
      const selected = selectedVariant || (variants[0] && variants[0].value);
      if (selected) {
        const variantObj = found.variants.find(
          (v: any) =>
            (typeof v === "object" && v.type === selected) || v === selected
        );
        if (
          variantObj &&
          typeof variantObj === "object" &&
          Array.isArray(variantObj.measurements)
        ) {
          setMeasurementFields(variantObj.measurements.map((m: any) => m.key));
        } else {
          setMeasurementFields([]);
        }
      } else {
        setMeasurementFields([]);
      }
    } else {
      setVariantOptions([]);
      setMeasurementFields([]);
    }
  }, [garmentType, selectedVariant]);

  // --- Order Submission Mutation with Enhanced Error Handling ---
  const { mutate: submitOrder, isPending: isSubmitting } = useMutation({
    mutationKey: ["submit-order"],
    mutationFn: async (formData: FormData) => {
      console.log("[OrderFormContext] Mutation function called with FormData");
      const entries = Array.from(formData.entries());
      console.log("[OrderFormContext] FormData entries count:", entries.length);

      // Enhanced fetch with timeout and better error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes
      
      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        console.log("[OrderFormContext] Response status:", res.status);
        console.log("[OrderFormContext] Response headers:", Object.fromEntries(res.headers.entries()));
        
        // Check if response is actually JSON
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const textResponse = await res.text();
          console.error("[OrderFormContext] Non-JSON response received:", textResponse);
          throw new Error("Server returned invalid response format. Please try again or contact support.");
        }
        
        const data = await res.json();
        console.log("[OrderFormContext] Response data:", data);

        if (!res.ok) {
          console.error("[OrderFormContext] Response not ok:", res.status, data);
          throw new Error(data.error || `Server error: ${res.status}`);
        }

        console.log(
          "[OrderFormContext] Order submission successful, returning data"
        );
        return data;
      } catch (fetchError: unknown) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('Request timed out. Large orders may take time to process. Please try again or contact support.');
        }
        throw fetchError;
      }
    },
    onSuccess: (data: any) => {
      console.log(
        "[OrderFormContext] submitOrder success callback data:",
        data
      );
      const resp = data as any;

      // Store the submitted order data
      setSubmittedOrder(resp.order);
      setOrderOid(resp.oid);
      setOrderDate(resp.orderDate);

      // Also update the context state with the submitted data to ensure consistency
      if (resp.order) {
        // Update customer data from the submitted order
        if (
          resp.order.fullName ||
          resp.order.contactNumber ||
          resp.order.email ||
          resp.order.fullAddress
        ) {
          setCustomerData({
            fullName: resp.order.fullName || customerData?.fullName || "",
            contactNumber:
              resp.order.contactNumber || customerData?.contactNumber || "",
            email: resp.order.email || customerData?.email || "",
            fullAddress:
              resp.order.fullAddress || customerData?.fullAddress || "",
            sameForWhatsapp: customerData?.sameForWhatsapp || false,
          });
        }

        // Update garments data from the submitted order
        if (resp.order.garments && Array.isArray(resp.order.garments)) {
          setGarments(resp.order.garments);
        }

        // Update delivery data from the submitted order
        if (
          resp.order.deliveryDate ||
          resp.order.urgency ||
          resp.order.payment ||
          resp.order.advanceAmount ||
          resp.order.specialInstructions
        ) {
          const deliveryData = {
            deliveryDate: resp.order.deliveryDate,
            urgency: resp.order.urgency,
            payment: resp.order.payment,
            advanceAmount: resp.order.advanceAmount,
            specialInstructions: resp.order.specialInstructions,
          };
          setDeliveryData(deliveryData);
          // Also update the delivery form
          deliveryForm.reset(deliveryData);
        }
      }

      setSubmitSuccess("Order placed successfully!");
      setSubmitLoading(false);
      setProgressStates({
        orderData: "completed",
        fileUpload: "completed",
        pdfGeneration: "completed",
        whatsapp: "completed",
      });
      setStep(4);

      // PDFs will be generated on-demand when needed (more reliable)
      console.log(
        "[OrderFormContext] Order submitted successfully, PDFs will be generated on-demand"
      );

      // --- Do NOT auto-reset form after submission ---
      // The form will only reset when the user clicks 'Start New Order' on the confirmation page
    },
    onError: (error: any) => {
      console.error("[OrderFormContext] submitOrder error:", error);
      
      let errorMessage = error.message || "Order submission failed";
      
      // Provide specific guidance based on error type
      if (errorMessage.includes('timeout')) {
        errorMessage = "Order submission timed out. For large orders with many designs, this can happen. Please try reducing the number of garments or contact support for assistance.";
      } else if (errorMessage.includes('network')) {
        errorMessage = "Network error occurred. Please check your internet connection and try again.";
      } else if (errorMessage.includes('invalid response format')) {
        errorMessage = "Server error occurred. Please try again in a few minutes or contact support.";
      }
      
      setSubmitError(errorMessage);
      setSubmitLoading(false);
      setProgressStates({
        orderData: "error",
        fileUpload: "error",
        pdfGeneration: "error",
        whatsapp: "error",
      });
    },
  });

  // PDF generation moved to on-demand approach for better reliability
  // No background generation needed - PDFs are generated when requested

  // --- Enhanced Payload Validation Helper ---
  const validateOrderPayload = (customerData: any, garments: any[], deliveryData: any) => {
    // Use the comprehensive analysis utility
    const debugInfo = analyzeOrderComplexity(garments);
    logOrderDebugInfo(debugInfo);
    
    const errors = [];
    
    // Basic validation
    if (garments.length === 0) {
      errors.push("Please add at least one garment to your order.");
    }
    
    // Add errors from debug analysis
    errors.push(...debugInfo.validationErrors);
    
    // Show warnings as toast notifications
    if (debugInfo.validationWarnings.length > 0) {
      debugInfo.validationWarnings.forEach(warning => {
        toast.warning(warning, { duration: 5000 });
      });
    }
    
    // Show estimated processing time for large orders
    if (debugInfo.estimatedProcessingTime > 120) {
      toast.info(`Large order detected. Estimated processing time: ${Math.round(debugInfo.estimatedProcessingTime / 60)} minutes`, {
        duration: 8000
      });
    }
    
    return { 
      errors, 
      totalDesigns: debugInfo.totalDesigns, 
      totalFiles: debugInfo.totalFiles,
      debugInfo 
    };
  };

  // --- Handler for Delivery & Payment Step ---
  const handleDeliverySubmit = async (deliveryData: any) => {
    setSubmitLoading(true);
    setSubmitError(null);
    
    // Validate payload before submission
    const validation = validateOrderPayload(customerData, garments, deliveryData);
    
    if (validation.errors.length > 0) {
      setSubmitError(validation.errors.join(' '));
      setSubmitLoading(false);
      return;
    }
    
    // Show warning for large orders
    if (validation.totalDesigns > 30) {
      console.log(`[OrderFormContext] Large order detected: ${validation.totalDesigns} designs, ${validation.totalFiles} files`);
    }
    
    // Reset progress states
    setProgressStates({
      orderData: "processing",
      fileUpload: "pending",
      pdfGeneration: "pending",
      whatsapp: "pending",
    });

    try {
      console.log(
        "[OrderFormContext] handleDeliverySubmit called with:",
        deliveryData
      );
      // Store delivery data for potential back navigation
      setDeliveryData(deliveryData);
      const formData = new FormData();
      formData.append("customer", JSON.stringify(customerData));
      formData.append("garments", JSON.stringify(garments));
      formData.append("delivery", JSON.stringify(deliveryData));

      // Append all files from garments
      console.log(
        "[OrderFormContext] Processing garments for file upload:",
        garments
      );
      console.log(
        "[OrderFormContext] Garments with file details:",
        garments.map((g, idx) => ({
          garmentIndex: idx,
          designs: g.designs?.map((d: any, dIdx: number) => ({
            designIndex: dIdx,
            name: d.name,
            designReference: d.designReference,
            clothImages: d.clothImages,
            designReferenceLength: d.designReference?.length || 0,
            clothImagesLength: d.clothImages?.length || 0,
          })),
        }))
      );

      garments.forEach((garment: any, garmentIndex: number) => {
        console.log(
          `[OrderFormContext] Processing garment ${garmentIndex}:`,
          garment
        );

        // Append canvas image if exists (check both measurements and designs)
        if (
          garment.measurements?.canvasImage &&
          garment.measurements.canvasImage.startsWith("data:image/")
        ) {
          console.log(
            `[OrderFormContext] Found canvas image in measurements for garment ${garmentIndex}`
          );
          const canvasBlob = dataURLtoBlob(garment.measurements.canvasImage);
          formData.append(
            `canvasImage_${garmentIndex}`,
            canvasBlob,
            `canvas_${garmentIndex}.png`
          );
        }

        // Append design reference files and canvas images
        if (garment.designs && Array.isArray(garment.designs)) {
          garment.designs.forEach((design: any, designIndex: number) => {
            console.log(
              `[OrderFormContext] Processing design ${designIndex} for garment ${garmentIndex}`
            );

            // Append design reference files
            console.log(
              `[OrderFormContext] DEBUG: design.designReference =`,
              design.designReference
            );
            if (
              design.designReference &&
              Array.isArray(design.designReference)
            ) {
              let validFiles = 0;
              design.designReference.forEach((file: any, fileIndex: number) => {
                console.log(
                  `[OrderFormContext] DEBUG: Processing file ${fileIndex}:`,
                  file
                );
                if (file instanceof File) {
                  formData.append(
                    `designReference_${garmentIndex}_${designIndex}_${fileIndex}`,
                    file
                  );
                  validFiles++;
                  console.log(
                    `[OrderFormContext] ✅ REF_FILE ${validFiles}: ${file.name} (${file.size}b)`
                  );
                } else if (
                  typeof file === "string" &&
                  file.startsWith("data:image/")
                ) {
                  const blob = dataURLtoBlob(file);
                  formData.append(
                    `designReference_${garmentIndex}_${designIndex}_${fileIndex}`,
                    blob,
                    `design_${garmentIndex}_${designIndex}_${fileIndex}.png`
                  );
                  validFiles++;
                  console.log(
                    `[OrderFormContext] ✅ REF_DATA ${validFiles}: ${file.length} chars`
                  );
                } else {
                  console.warn(
                    `[OrderFormContext] ❌ INVALID REF: ${typeof file}`
                  );
                }
              });
              console.log(
                `[OrderFormContext] REF TOTAL: ${validFiles}/${design.designReference.length}`
              );
            } else {
              console.log(
                `[OrderFormContext] ❌ No designReference found or not array:`,
                design.designReference
              );
            }

            // Append cloth images
            console.log(
              `[OrderFormContext] DEBUG: design.clothImages =`,
              design.clothImages
            );
            if (design.clothImages && Array.isArray(design.clothImages)) {
              let validCloth = 0;
              design.clothImages.forEach((file: any, fileIndex: number) => {
                console.log(
                  `[OrderFormContext] DEBUG: Processing cloth file ${fileIndex}:`,
                  file
                );
                if (file instanceof File) {
                  formData.append(
                    `clothImage_${garmentIndex}_${designIndex}_${fileIndex}`,
                    file
                  );
                  validCloth++;
                  console.log(
                    `[OrderFormContext] ✅ CLOTH_FILE ${validCloth}: ${file.name} (${file.size}b)`
                  );
                } else if (
                  typeof file === "string" &&
                  file.startsWith("data:image/")
                ) {
                  const blob = dataURLtoBlob(file);
                  formData.append(
                    `clothImage_${garmentIndex}_${designIndex}_${fileIndex}`,
                    blob,
                    `cloth_${garmentIndex}_${designIndex}_${fileIndex}.png`
                  );
                  validCloth++;
                  console.log(
                    `[OrderFormContext] ✅ CLOTH_DATA ${validCloth}: ${file.length} chars`
                  );
                } else {
                  console.warn(
                    `[OrderFormContext] ❌ INVALID CLOTH: ${typeof file}`
                  );
                }
              });
              console.log(
                `[OrderFormContext] CLOTH TOTAL: ${validCloth}/${design.clothImages.length}`
              );
            } else {
              console.log(
                `[OrderFormContext] ❌ No clothImages found or not array:`,
                design.clothImages
              );
            }

            // Append canvas image from design if exists
            if (
              design.canvasImage &&
              design.canvasImage.startsWith("data:image/")
            ) {
              const canvasBlob = dataURLtoBlob(design.canvasImage);
              formData.append(
                `canvasImage_${garmentIndex}`,
                canvasBlob,
                `design_canvas_${garmentIndex}_${designIndex}.png`
              );
              console.log(
                `[OrderFormContext] ✅ CANVAS: ${design.canvasImage.length} chars`
              );
            }
          });
        }
      });

      // Enhanced FormData debugging
      createFormDataDebugInfo(formData);

      // Call submitOrder - success will be handled by the onSuccess callback
      submitOrder(formData);
      console.log("[OrderFormContext] submitOrder called with files");

      // Simulate progress updates based on typical timing
      setTimeout(() => {
        setProgressStates((prev) => ({
          ...prev,
          orderData: "completed",
          fileUpload: "processing",
        }));
      }, 2000);

      setTimeout(() => {
        setProgressStates((prev) => ({
          ...prev,
          fileUpload: "completed",
          pdfGeneration: "processing",
        }));
      }, 4000);

      setTimeout(() => {
        setProgressStates((prev) => ({
          ...prev,
          pdfGeneration: "completed",
          whatsapp: "processing",
        }));
      }, 7000);
    } catch (err: any) {
      console.error(
        "[OrderFormContext] handleDeliverySubmit catch error:",
        err
      );
      setSubmitError(err.message || "Order submission failed");
      setSubmitLoading(false);
      setProgressStates({
        orderData: "error",
        fileUpload: "error",
        pdfGeneration: "error",
        whatsapp: "error",
      });
    }
  };

  // Helper function to convert data URL to blob
  const dataURLtoBlob = (dataURL: string): Blob => {
    const arr = dataURL.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  // --- Add Garment Handler ---
  const handleAddGarment = () => {
    // Validate forms
    const orderValid = orderForm.trigger();
    const measurementValid = measurementForm.trigger();
    Promise.all([orderValid, measurementValid]).then(
      ([isOrderValid, isMeasurementValid]) => {
        if (!isOrderValid || !isMeasurementValid) {
          toast.error(
            "Please fill all required fields for the garment and measurements."
          );
          return;
        }
        // Debug: Log designs array
        console.log("[Garment Validation] designs:", designs);
        console.log(
          "[Garment Validation] designs with files:",
          designs.map((d) => ({
            name: d.name,
            amount: d.amount,
            designReference: d.designReference,
            clothImages: d.clothImages,
            designReferenceLength: d.designReference?.length || 0,
            clothImagesLength: d.clothImages?.length || 0,
          }))
        );
        // Manual validation for designs array
        const hasIncompleteDesign = designs.some((d, idx) => {
          if (!d.name || typeof d.name !== "string" || d.name.trim() === "")
            return true;
          const amountNum = Number(d.amount);
          if (!d.amount || isNaN(amountNum) || amountNum <= 0) return true;
          return false;
        });
        if (hasIncompleteDesign) {
          toast.error(
            "Please fill in the name and a valid amount (> 0) for every design."
          );
          return;
        }
        const orderValues = orderForm.getValues();
        const measurementValues = measurementForm.getValues();
        const garment = {
          ...orderValues,
          measurements: measurementValues.measurements || {},
          designs: designs.map((design: any) => ({
            ...design,
            designReference: [...(design.designReference || [])],
            clothImages: [...(design.clothImages || [])],
            designReferencePreviews: [
              ...(design.designReferencePreviews || []),
            ],
            clothImagePreviews: [...(design.clothImagePreviews || [])],
          })),
          unit,
          variant: selectedVariant,
        };
        setGarments((prev) => {
          if (
            editingIndex !== null &&
            editingIndex >= 0 &&
            editingIndex < prev.length
          ) {
            // Update existing garment
            const arr = [...prev];
            arr[editingIndex] = garment;
            return arr;
          }
          return [...prev, garment];
        });
        // Reset forms and state
        orderForm.reset({ orderType: "", quantity: 1 });
        measurementForm.reset({ measurements: {} });
        setDesigns([]);
        setSelectedVariant(undefined);
        setEditingIndex(null);
        setShowGarmentForm(false);
      }
    );
  };

  // --- Edit Garment Handler ---
  const handleEditGarment = (idx: number) => {
    setEditingIndex(idx);
    const garment = garments[idx];
    if (garment) {
      orderForm.reset({
        orderType: garment.orderType,
        quantity: garment.quantity,
      });
      measurementForm.reset({ measurements: garment.measurements });
      setDesigns(
        garment.designs.map((design: any) => ({
          ...design,
          designReference: [...(design.designReference || [])],
          clothImages: [...(design.clothImages || [])],
          designReferencePreviews: [...(design.designReferencePreviews || [])],
          clothImagePreviews: [...(design.clothImagePreviews || [])],
        }))
      );
      setSelectedVariant(garment.variant);
      setShowGarmentForm(true);
    }
  };

  // --- Remove Garment Handler ---
  const handleRemoveGarment = (idx: number) => {
    setGarments((prev) => prev.filter((_, i) => i !== idx));
  };

  // --- Form Reset Handlers ---
  const orderFormReset = () => {
    orderForm.reset({ orderType: "", quantity: 1 });
  };

  const measurementFormReset = () => {
    measurementForm.reset({ measurements: {} });
  };

  // --- Back Step Handler ---
  const handleBack = () => {
    setStep((prev) => (prev > 1 ? prev - 1 : 1));
  };

  // --- Start New Order Handler ---
  const handleStartNewOrder = () => {
    setStep(1);
    setCustomerData(null);
    setGarments([]);
    setEditingIndex(null);
    setSelectedVariant(undefined);
    setShowGarmentForm(true);
    setOrderOid(null);
    setOrderDate(null);
    setSubmittedOrder(null);
    setDesigns([]);
    setUnit("in");
    setGarmentType("");
    setQuantity(1);
    setDeliveryData(null);
    orderForm.reset({ orderType: "", quantity: 1 });
    measurementForm.reset({ measurements: {} });
    deliveryForm.reset({
      deliveryDate: undefined,
      urgency: "regular",
      payment: undefined,
      advanceAmount: 0,
      specialInstructions: "",
    });
    // Only clear localStorage on new order
    localStorage.removeItem("orderFormState");
  };

  // --- Persist state to localStorage ---
  useEffect(() => {
    const stateToPersist = {
      step,
      customerData,
      garments,
      editingIndex,
      selectedVariant,
      showGarmentForm,
      orderOid,
      orderDate,
      submittedOrder,
      designs,
      unit,
      garmentType,
      quantity,
      deliveryData,
    };
    localStorage.setItem("orderFormState", JSON.stringify(stateToPersist));
  }, [
    step,
    customerData,
    garments,
    editingIndex,
    selectedVariant,
    showGarmentForm,
    orderOid,
    orderDate,
    submittedOrder,
    designs,
    unit,
    garmentType,
    quantity,
    deliveryData,
  ]);

  // --- Restore state from localStorage on mount ---
  const didRestore = useRef(false);
  useEffect(() => {
    if (didRestore.current) return;
    didRestore.current = true;
    const saved = localStorage.getItem("orderFormState");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.step) setStep(parsed.step);
        if (parsed.customerData) setCustomerData(parsed.customerData);
        if (parsed.garments) setGarments(parsed.garments);
        if (parsed.editingIndex !== undefined)
          setEditingIndex(parsed.editingIndex);
        if (parsed.selectedVariant) setSelectedVariant(parsed.selectedVariant);
        if (parsed.showGarmentForm !== undefined)
          setShowGarmentForm(parsed.showGarmentForm);
        if (parsed.orderOid) setOrderOid(parsed.orderOid);
        if (parsed.orderDate) setOrderDate(parsed.orderDate);
        if (parsed.submittedOrder) setSubmittedOrder(parsed.submittedOrder);
        if (parsed.designs) setDesigns(parsed.designs);
        if (parsed.unit) setUnit(parsed.unit);
        if (parsed.garmentType) setGarmentType(parsed.garmentType);
        if (parsed.quantity) setQuantity(parsed.quantity);
        if (parsed.deliveryData) {
          // Ensure deliveryDate is properly parsed as Date object
          const sanitizedDeliveryData = { ...parsed.deliveryData };
          if (
            sanitizedDeliveryData.deliveryDate &&
            typeof sanitizedDeliveryData.deliveryDate === "string"
          ) {
            const date = new Date(sanitizedDeliveryData.deliveryDate);
            if (!isNaN(date.getTime())) {
              sanitizedDeliveryData.deliveryDate = date;
            } else {
              sanitizedDeliveryData.deliveryDate = undefined;
            }
          }
          setDeliveryData(sanitizedDeliveryData);
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  return (
    <OrderFormContext.Provider
      value={{
        step,
        setStep,
        stepLabels,
        customerData,
        setCustomerData,
        garments,
        setGarments,
        editingIndex,
        setEditingIndex,
        selectedVariant,
        setSelectedVariant,
        showGarmentForm,
        setShowGarmentForm,
        orderOid,
        setOrderOid,
        orderDate,
        setOrderDate,
        submittedOrder,
        setSubmittedOrder,
        designs,
        setDesigns,
        unit,
        setUnit,
        submitLoading: submitLoading || isSubmitting,
        setSubmitLoading,
        submitSuccess,
        setSubmitSuccess,
        submitError,
        setSubmitError,
        progressStates,
        setProgressStates,
        handleDeliverySubmit,
        orderForm,
        measurementForm,
        deliveryForm,
        garmentOptions,
        garmentType,
        setGarmentType,
        variantOptions,
        measurementFields,
        quantity,
        setQuantity,
        handleAddGarment,
        handleEditGarment,
        handleRemoveGarment,
        orderFormReset,
        measurementFormReset,
        handleBack,
        handleStartNewOrder,
      }}
    >
      {children}
    </OrderFormContext.Provider>
  );
};

export const useOrderFormContext = () => useContext(OrderFormContext);
