"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useEffect, useState, useRef, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { CanvasPaint } from "@/components/CanvasPaint";
import measurementData from "@/app/measurement.json";

const phoneRegex = /^((\+91)?|91)?[6-9][0-9]{9}$/;
const pinCodeRegex = /^[1-9][0-9]{5}$/;

const customerInfoSchema = z.object({
  fullName: z.string().min(2, "Full Name is required"),
  contactNumber: z.string().min(10, "Enter a valid contact number"),
  sameForWhatsapp: z.boolean().optional(),
  email: z.string().email("Enter a valid email address"),
  preferredCommunication: z.enum(["whatsapp", "phone", "email"], {
    required_error: "Select a communication method",
  }),
  fullAddress: z.string().min(10, "Address is required"),
});

// Dynamically generate all garment types from measurement.json
const allGarmentTypes = Array.from(
  new Set([
    ...Object.keys((measurementData as any).male || {}),
    ...Object.keys((measurementData as any).female || {}),
  ])
) as [string, ...string[]];

const orderDetailsSchema = z.object({
  orderType: z.enum(allGarmentTypes, {
    required_error: "Select a garment type",
  }),
  urgency: z.enum(["regular", "priority", "express"], {
    required_error: "Select urgency",
  }),
  quantity: z.coerce.number().min(1, "Minimum 1").max(10, "Maximum 10"),
});

const measurementSchema = z.object({
  // No measurementMethod
  designReference: z.any().refine(
    (files) => {
      if (!files || files.length === 0) return true; // optional
      if (files.length > 5) return false;
      for (const file of files) {
        if (!["image/jpeg", "image/png"].includes(file.type)) return false;
        if (file.size > 5 * 1024 * 1024) return false;
      }
      return true;
    },
    { message: "Max 5 files. Only JPG, PNG. Max 5MB each." }
  ),
  designDescription: z.string().optional(),
  canvasImage: z.string().optional(),
  canvasJson: z.string().optional(),
  measurements: z.record(z.string(), z.string().or(z.number())).optional(),
  voiceNote: z.any().optional(), // for audio file
});

const deliverySchema = z.object({
  deliveryDate: z
    .date()
    .refine((date) => date && date >= addDays(new Date(), 3), {
      message: "Delivery date must be at least 3 days from today",
    }),
  deliveryMethod: z.enum(["home", "pickup", "courier"], {
    required_error: "Select a delivery method",
  }),
  budgetAmount: z
    .string()
    .refine((val) => /^\d+(\.\d{1,2})?$/.test(val) && parseFloat(val) > 0, {
      message: "Enter a valid positive amount",
    }),
  payment: z.enum(["cod", "upi", "bank"], {
    required_error: "Select a payment preference",
  }),
  specialInstructions: z.string().optional(),
});

type CustomerInfo = z.infer<typeof customerInfoSchema>;
type OrderDetails = z.infer<typeof orderDetailsSchema>;
type MeasurementDesign = z.infer<typeof measurementSchema>;
type DeliveryPayment = z.infer<typeof deliverySchema>;

export default function OrderFormPage() {
  const [step, setStep] = useState(1);
  const [customerData, setCustomerData] = useState<CustomerInfo | null>(null);
  const [measurementFiles, setMeasurementFiles] = useState<File[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [resetTimer, setResetTimer] = useState(15);
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [unit, setUnit] = useState<"inches" | "centimeters">("inches");
  // Add garments array state
  const [garments, setGarments] = useState<any[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  // 2. Add gender state for the garment form
  const [garmentGender, setGarmentGender] = useState<
    "male" | "female" | undefined
  >(undefined);
  const handleGarmentGenderChange = (value: string) =>
    setGarmentGender(value as "male" | "female");
  // Add a ref for the garments summary section
  const garmentsSummaryRef = useRef<HTMLDivElement | null>(null);
  // Add a state to control whether the garment form is visible
  const [showGarmentForm, setShowGarmentForm] = useState(true);
  const [orderOid, setOrderOid] = useState<string | null>(null);
  const [orderDate, setOrderDate] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);

  // Handler to scroll to garments summary
  const scrollToGarmentsSummary = () => {
    if (garmentsSummaryRef.current) {
      garmentsSummaryRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  // Section 1: Customer Info
  const form = useForm<CustomerInfo>({
    resolver: zodResolver(customerInfoSchema),
    mode: "onChange",
    defaultValues: {
      fullName: "",
      contactNumber: "",
      sameForWhatsapp: false,
      email: "",
      preferredCommunication: undefined,
      fullAddress: "",
    },
  });

  // Section 2: Order Details
  const orderForm = useForm<OrderDetails>({
    resolver: zodResolver(orderDetailsSchema),
    mode: "onChange",
    defaultValues: {
      orderType: undefined,
      urgency: undefined,
      quantity: 1,
    },
  });

  // Section 3: Measurements & Design
  const measurementForm = useForm<MeasurementDesign>({
    resolver: zodResolver(measurementSchema),
    mode: "onChange",
    defaultValues: {
      designReference: undefined,
      designDescription: "",
      canvasImage: undefined,
      canvasJson: undefined,
      measurements: {},
      voiceNote: undefined,
    },
  });

  // 1. Extract garment options from measurement.json for each gender
  const garmentOptions: Record<
    "male" | "female",
    { value: string; label: string }[]
  > = {
    male: Object.keys((measurementData as any).male || {}).map((key) => ({
      value: key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
    })),
    female: Object.keys((measurementData as any).female || {}).map((key) => ({
      value: key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
    })),
  };

  // 2. Compute measurement fields with types
  const orderType = orderForm.watch("orderType") as string | undefined;
  const garmentType = orderType;
  // 5. Use garmentGender and garmentType for measurement fields
  const measurementFields: string[] = useMemo(() => {
    if (!garmentGender || !garmentType) return [];
    // Type assertion to suppress TS error for dynamic lookup
    return (measurementData as any)[garmentGender]?.[garmentType] || [];
  }, [garmentGender, garmentType]);

  // 3. Conversion helpers with types
  const convertValue = (
    val: string | number,
    from: "inches" | "centimeters",
    to: "inches" | "centimeters"
  ): string => {
    if (!val || isNaN(Number(val))) return String(val);
    if (from === to) return String(val);
    return from === "inches"
      ? (Number(val) * 2.54).toFixed(2)
      : (Number(val) / 2.54).toFixed(2);
  };

  const handleUnitToggle = (newUnit: "inches" | "centimeters") => {
    if (unit === newUnit) return;
    const current =
      (measurementForm.getValues("measurements") as Record<
        string,
        string | number
      >) || {};
    const converted: Record<string, string> = {};
    for (const key of measurementFields) {
      converted[key] = convertValue(current[key], unit, newUnit);
    }
    measurementForm.setValue("measurements", converted);
    setUnit(newUnit);
  };

  const handleCustomerSubmit = (data: CustomerInfo) => {
    setCustomerData(data);
    setStep(2);
  };

  const handleOrderSubmit = (data: OrderDetails) => {
    setStep(3);
  };

  // Handler to add or update a garment
  const handleAddGarment = () => {
    // 6. When adding a garment, include gender
    const rawMeasurement = measurementForm.getValues();
    const measurements = { ...rawMeasurement.measurements };
    if (measurements) {
      for (const key of Object.keys(measurements)) {
        if (measurements[key] === undefined || measurements[key] === "") {
          measurements[key] = 0;
        }
      }
    }
    const garmentData = {
      gender: garmentGender,
      order: orderForm.getValues(),
      measurement: { ...rawMeasurement, measurements },
    };
    if (editingIndex !== null) {
      // Update existing
      setGarments((prev) =>
        prev.map((g, i) => (i === editingIndex ? garmentData : g))
      );
      setEditingIndex(null);
    } else {
      setGarments((prev) => [...prev, garmentData]);
    }
    orderForm.reset();
    measurementForm.reset();
    setGarmentGender(undefined);
    setShowGarmentForm(false); // hide form after add
  };

  // Handler to edit a garment
  const handleEditGarment = (idx: number) => {
    // 7. When editing a garment, restore gender
    const g = garments[idx];
    setGarmentGender(g.gender);
    orderForm.reset(g.order);
    measurementForm.reset(g.measurement);
    setEditingIndex(idx);
    setShowGarmentForm(true);
  };

  // Handler to remove a garment
  const handleRemoveGarment = (idx: number) => {
    setGarments((prev) => prev.filter((_, i) => i !== idx));
    if (editingIndex === idx) setEditingIndex(null);
  };

  // Section 4: Delivery & Payment
  const deliveryForm = useForm<DeliveryPayment>({
    resolver: zodResolver(deliverySchema),
    mode: "onChange",
    defaultValues: {
      deliveryDate: undefined,
      deliveryMethod: undefined,
      budgetAmount: "",
      payment: undefined,
      specialInstructions: "",
    },
  });

  const handleDeliverySubmit = async (data: DeliveryPayment) => {
    setSubmitLoading(true);
    setSubmitSuccess(null);
    setSubmitError(null);
    setOrderId(null);
    setOrderOid(null);
    setOrderDate(null);
    // Guard: must have customerData and at least one garment
    if (!customerData) {
      setSubmitError("Please fill out customer information before submitting.");
      setSubmitLoading(false);
      setTimeout(
        () =>
          errorRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          }),
        100
      );
      return;
    }
    if (!garments || garments.length === 0) {
      setSubmitError("Please add at least one garment to your order.");
      setSubmitLoading(false);
      setTimeout(
        () =>
          errorRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          }),
        100
      );
      return;
    }
    try {
      // Build FormData
      const formData = new FormData();
      formData.append("customer", JSON.stringify(customerData));
      formData.append("garments", JSON.stringify(garments));
      formData.append("delivery", JSON.stringify(data));
      // Append all files for each garment
      garments.forEach((g, idx) => {
        // Design Reference (array of files)
        if (
          g.measurement.designReference &&
          Array.isArray(g.measurement.designReference)
        ) {
          g.measurement.designReference.forEach((file: File, i: number) => {
            if (file instanceof File) {
              formData.append(`designReference_${idx}_${i}`, file);
            }
          });
        }
        // Canvas Image (base64 string as file)
        if (
          g.measurement.canvasImage &&
          typeof g.measurement.canvasImage === "string" &&
          g.measurement.canvasImage.startsWith("data:image/")
        ) {
          const arr = g.measurement.canvasImage.split(",");
          const mime = arr[0].match(/:(.*?);/)[1];
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) u8arr[n] = bstr.charCodeAt(n);
          const file = new File([u8arr], `canvas_${idx}.png`, { type: mime });
          formData.append(`canvasImage_${idx}`, file);
        }
        // Voice Note (file)
        if (
          g.measurement.voiceNote &&
          g.measurement.voiceNote instanceof File
        ) {
          formData.append(`voiceNote_${idx}`, g.measurement.voiceNote);
        }
      });
      // Only append top-level files if garments is empty (single-garment fallback)
      if (garments.length === 0) {
        if (measurementFiles && measurementFiles.length > 0) {
          measurementFiles.forEach((file, i) => {
            if (file instanceof File)
              formData.append(`designReference_0_${i}`, file);
          });
        }
        // --- FIX: Use local variable and safe checks for canvasImage ---
        const canvasImage = measurementForm.getValues().canvasImage;
        if (
          typeof canvasImage === "string" &&
          canvasImage.startsWith("data:image/")
        ) {
          const arr = canvasImage.split(",");
          if (arr.length > 1) {
            const mimeMatch = arr[0].match(/:(.*?);/);
            const mime = mimeMatch ? mimeMatch[1] : "image/png";
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) u8arr[n] = bstr.charCodeAt(n);
            const file = new File([u8arr], `canvas_0.png`, { type: mime });
            formData.append(`canvasImage_0`, file);
          }
        }
        const voiceNote = measurementForm.getValues().voiceNote;
        if (voiceNote && voiceNote instanceof File) {
          formData.append(`voiceNote_0`, voiceNote);
        }
      }
      // Submit
      const res = await fetch("/api/orders", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      if (result.success) {
        setOrderOid(result.oid);
        setOrderDate(result.orderDate);
        setOrderId(result.oid); // for backward compatibility
        setSubmitSuccess("Order submitted successfully!");
        setGarments([]); // clear cart after submit
        // Optionally reset form or redirect here
      } else {
        setSubmitError(result.error || "Failed to submit order.");
        setTimeout(
          () =>
            errorRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            }),
          100
        );
      }
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to submit order.");
      setTimeout(
        () =>
          errorRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          }),
        100
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  // Reset all forms and state
  const resetAll = () => {
    form.reset();
    orderForm.reset();
    measurementForm.reset();
    deliveryForm.reset();
    setCustomerData(null);
    setMeasurementFiles([]);
    setSubmitLoading(false);
    setSubmitSuccess(null);
    setSubmitError(null);
    setOrderId(null);
    setStep(1);
    setResetTimer(15);
  };

  // Start/reset timer after successful submit
  useEffect(() => {
    if (submitSuccess) {
      setResetTimer(15);
      if (resetTimeoutRef.current) clearInterval(resetTimeoutRef.current);
      resetTimeoutRef.current = setInterval(() => {
        setResetTimer((t) => {
          if (t <= 1) {
            clearInterval(resetTimeoutRef.current!);
            resetAll();
            return 15;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      if (resetTimeoutRef.current) clearInterval(resetTimeoutRef.current);
    }
    return () => {
      if (resetTimeoutRef.current) clearInterval(resetTimeoutRef.current);
    };
  }, [submitSuccess]);

  // Progress indicator
  const steps = [
    "Customer Info",
    "Order Details & Measurements",
    "Delivery & Payment",
    "Review & Submit",
  ];

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 py-8 px-2 sm:px-0">
      {/* Progress Indicator */}
      <div className="w-full max-w-xl mb-6 px-2 sm:px-0">
        <div className="flex items-center justify-between mb-2 gap-x-2 gap-y-2 flex-wrap">
          {steps.map((label, idx) => (
            <div
              key={label}
              className="flex-1 flex flex-col items-center min-w-[60px]"
            >
              <div
                className={cn(
                  "rounded-full w-8 h-8 flex items-center justify-center font-bold",
                  step === idx + 1
                    ? "bg-blue-600 text-white shadow-lg scale-110"
                    : step > idx + 1
                    ? "bg-green-500 text-white"
                    : "bg-gray-300 text-gray-600"
                )}
              >
                {idx + 1}
              </div>
              <span
                className={cn(
                  "text-xs mt-1 font-medium text-center",
                  step === idx + 1 ? "text-blue-700" : "text-gray-500"
                )}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
        <div className="h-1 w-full bg-gray-200 rounded-full relative">
          <div
            className="absolute h-1 bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
          />
        </div>
      </div>
      {/* Add cart button at the top */}
      <div className="w-full flex justify-end max-w-xl mb-2 px-2 sm:px-0">
        <Button
          type="button"
          variant="outline"
          className="relative w-full sm:w-auto"
          onClick={scrollToGarmentsSummary}
          aria-label="View Cart"
        >
          Cart
          <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
            {garments.length}
          </span>
        </Button>
      </div>
      <Card className="w-full max-w-xl shadow-2xl transition-all duration-500 animate-fade-in px-2 sm:px-0">
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight text-center sm:text-left">
            {step === 1
              ? "Customer Information"
              : step === 2
              ? "Order Details & Measurements"
              : "Delivery & Payment"}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          {step === 1 && (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleCustomerSubmit)}
                className="space-y-5"
              >
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter contact number" {...field} />
                      </FormControl>
                      <div className="flex items-center mt-1">
                        <input
                          type="checkbox"
                          id="sameForWhatsapp"
                          checked={form.watch("sameForWhatsapp") || false}
                          onChange={(e) =>
                            form.setValue("sameForWhatsapp", e.target.checked)
                          }
                        />
                        <label
                          htmlFor="sameForWhatsapp"
                          className="ml-2 text-xs"
                        >
                          Same for WhatsApp
                        </label>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fullAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Address *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter full address including pin code"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="preferredCommunication"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Communication *</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-row gap-4"
                        >
                          <FormItem>
                            <FormControl>
                              <RadioGroupItem value="whatsapp" />
                            </FormControl>
                            <FormLabel>WhatsApp</FormLabel>
                          </FormItem>
                          <FormItem>
                            <FormControl>
                              <RadioGroupItem value="phone" />
                            </FormControl>
                            <FormLabel>Phone</FormLabel>
                          </FormItem>
                          <FormItem>
                            <FormControl>
                              <RadioGroupItem value="email" />
                            </FormControl>
                            <FormLabel>Email</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <CardFooter className="flex flex-col sm:flex-row gap-3 sm:gap-0 justify-end pt-4 w-full">
                  <Button
                    type="submit"
                    disabled={!form.formState.isValid}
                    className="w-full sm:w-auto px-6 py-2 rounded-lg font-semibold shadow-md"
                  >
                    Next
                  </Button>
                </CardFooter>
              </form>
            </Form>
          )}
          {step === 2 && showGarmentForm && (
            <Form {...orderForm}>
              <form
                onSubmit={orderForm.handleSubmit((orderData) => {
                  // Save order details and move to next step
                  // Also handle measurements in this step
                  setStep(3);
                })}
                className="space-y-5"
              >
                {/* Order Details fields */}
                <div className="flex flex-col sm:flex-row gap-4 gap-y-2">
                  {/* 3. In the garment form, add gender select before garment type */}
                  <FormItem className="w-full">
                    <FormLabel>Gender *</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={handleGarmentGenderChange}
                        value={garmentGender}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                  <FormField
                    control={orderForm.control}
                    name="orderType"
                    render={({ field }) => (
                      <FormItem className="flex-1 w-full">
                        <FormLabel>Garment Type *</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={!garmentGender}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select garment type" />
                            </SelectTrigger>
                            <SelectContent>
                              {(garmentGender
                                ? garmentOptions[garmentGender]
                                : []
                              ).map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={orderForm.control}
                    name="urgency"
                    render={({ field }) => (
                      <FormItem className="flex-1 w-full">
                        <FormLabel>Urgency *</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select urgency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="regular">
                                Regular (7-10 days)
                              </SelectItem>
                              <SelectItem value="priority">
                                Priority (4-6 days)
                              </SelectItem>
                              <SelectItem value="express">
                                Express (2-3 days)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={orderForm.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Quantity *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={10}
                          {...field}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Measurements & Design fields (from previous step 3) */}

                {garmentGender && garmentType && (
                  <div className="my-4">
                    {/* Move Measurement Unit toggle below Quantity */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-semibold">Measurement Unit:</span>
                      <Button
                        type="button"
                        size="sm"
                        variant={unit === "inches" ? "default" : "outline"}
                        onClick={() => handleUnitToggle("inches")}
                      >
                        Inches
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={unit === "centimeters" ? "default" : "outline"}
                        onClick={() => handleUnitToggle("centimeters")}
                      >
                        Centimeters
                      </Button>
                    </div>
                    {measurementFields.length === 0 ? (
                      <div className="text-gray-500 italic">
                        No measurements required for this garment type.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {measurementFields.map((fieldKey: string) => (
                          <FormField
                            key={fieldKey}
                            control={measurementForm.control}
                            name={`measurements.${fieldKey}`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm">
                                  {fieldKey
                                    .replace(/([A-Z])/g, " $1")
                                    .replace(/^./, (s: string) =>
                                      s.toUpperCase()
                                    )}
                                </FormLabel>
                                <FormControl>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      {...field}
                                      value={
                                        field.value === undefined ||
                                        field.value === null
                                          ? ""
                                          : field.value
                                      }
                                      className="w-full px-2 py-1 text-base rounded"
                                    />
                                    <span className="text-xs text-gray-500">
                                      {unit}
                                    </span>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="mt-4 p-4 border rounded bg-gray-50">
                  <div className="font-semibold mb-2">Design Details</div>
                  <FormField
                    control={measurementForm.control}
                    name="designReference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Design Reference Images (JPG, PNG, max 5MB, up to 5
                          files)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept="image/jpeg,image/png"
                            multiple
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              setMeasurementFiles(files);
                              field.onChange(files);
                            }}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                        {measurementFiles.length > 0 && (
                          <div className="mt-2 space-y-1 flex flex-wrap gap-2">
                            {measurementFiles.map((file, idx) => (
                              <div
                                key={idx}
                                className="text-xs flex flex-col items-center"
                              >
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={file.name}
                                  className="inline-block h-12 w-12 object-cover rounded mr-2 border max-w-full"
                                />
                                {file.name} (
                                {(file.size / 1024 / 1024).toFixed(2)} MB)
                              </div>
                            ))}
                          </div>
                        )}
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={measurementForm.control}
                    name="designDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Design Description *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Style requirements, embellishments, special instructions"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="mt-2">
                    <CanvasPaint
                      onSave={(data) => {
                        measurementForm.setValue("canvasImage", data.image);
                        measurementForm.setValue("canvasJson", data.json);
                      }}
                      initialData={measurementForm.watch("canvasJson")}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      You can draw or annotate your design here. Click Save to
                      attach it to your order.
                    </p>
                  </div>
                  {measurementForm.watch("canvasImage") && (
                    <div className="mt-2">
                      <label className="block text-xs text-gray-500 mb-1">
                        Saved Drawing Preview:
                      </label>
                      <img
                        src={measurementForm.watch("canvasImage")}
                        alt="Canvas Drawing Preview"
                        className="border rounded shadow max-w-full h-auto"
                        style={{ maxHeight: 200 }}
                      />
                    </div>
                  )}
                </div>
                <FormField
                  control={measurementForm.control}
                  name="voiceNote"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Voice Note (optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="audio/*"
                          onChange={(e) => field.onChange(e.target.files?.[0])}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <CardFooter className="flex flex-col sm:flex-row gap-3 sm:gap-0 justify-between pt-4 w-full">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setStep(1)}
                    className="w-full sm:w-auto px-6 py-2 rounded-lg font-semibold"
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    disabled={
                      !garmentGender ||
                      !orderForm.watch("orderType") ||
                      !orderForm.watch("quantity")
                    }
                    onClick={handleAddGarment}
                    className="w-full sm:w-auto px-6 py-2 rounded-lg font-semibold shadow-md"
                  >
                    {editingIndex !== null
                      ? "Update Garment"
                      : "Add Garment to Order"}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          )}
          {step === 2 && !showGarmentForm && (
            <div className="flex flex-col sm:flex-row gap-3 justify-end mt-2 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  orderForm.reset();
                  measurementForm.reset();
                  setGarmentGender(undefined);
                  setEditingIndex(null);
                  setShowGarmentForm(true);
                }}
                className="w-full sm:w-auto px-6 py-2 rounded-lg font-semibold"
              >
                Add Another Garment
              </Button>
              <Button
                type="button"
                variant="default"
                onClick={() => setStep(3)}
                disabled={garments.length === 0}
                className="w-full sm:w-auto px-6 py-2 rounded-lg font-semibold shadow-md"
              >
                Continue
              </Button>
            </div>
          )}
          {step === 3 && (
            <Form {...deliveryForm}>
              <form
                onSubmit={deliveryForm.handleSubmit(handleDeliverySubmit)}
                className="space-y-5"
              >
                <FormField
                  control={deliveryForm.control}
                  name="deliveryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Delivery Date *</FormLabel>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className={cn(
                                "w-full sm:w-auto flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-left text-base shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Select a date</span>
                              )}
                              <CalendarIcon className="ml-2 h-5 w-5 text-gray-400" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              fromDate={addDays(new Date(), 3)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={deliveryForm.control}
                  name="deliveryMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Method *</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-row gap-4"
                        >
                          <FormItem>
                            <FormControl>
                              <RadioGroupItem value="home" />
                            </FormControl>
                            <FormLabel>Home Delivery</FormLabel>
                          </FormItem>
                          <FormItem>
                            <FormControl>
                              <RadioGroupItem value="pickup" />
                            </FormControl>
                            <FormLabel>Pickup from Shop</FormLabel>
                          </FormItem>
                          <FormItem>
                            <FormControl>
                              <RadioGroupItem value="courier" />
                            </FormControl>
                            <FormLabel>Courier Service</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={deliveryForm.control}
                  name="budgetAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget Amount (₹) *</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold text-gray-500">
                            ₹
                          </span>
                          <Input
                            type="number"
                            min={1}
                            step="0.01"
                            placeholder="Enter your budget"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={deliveryForm.control}
                  name="payment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Preference *</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-row gap-4"
                        >
                          <FormItem>
                            <FormControl>
                              <RadioGroupItem value="cod" />
                            </FormControl>
                            <FormLabel>Cash on Delivery/Pickup</FormLabel>
                          </FormItem>
                          <FormItem>
                            <FormControl>
                              <RadioGroupItem value="upi" />
                            </FormControl>
                            <FormLabel>UPI/Digital Payment</FormLabel>
                          </FormItem>
                          <FormItem>
                            <FormControl>
                              <RadioGroupItem value="bank" />
                            </FormControl>
                            <FormLabel>Bank Transfer</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={deliveryForm.control}
                  name="specialInstructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Special Instructions (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any special instructions?"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <CardFooter className="flex flex-col sm:flex-row gap-3 sm:gap-0 justify-between pt-4 w-full">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setStep(2)}
                    className="w-full sm:w-auto px-6 py-2 rounded-lg font-semibold"
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    disabled={
                      !deliveryForm.formState.isValid || garments.length === 0
                    }
                    onClick={() => setStep(4)}
                    className="w-full sm:w-auto px-6 py-2 rounded-lg font-semibold shadow-md"
                  >
                    Next
                  </Button>
                </CardFooter>
                {submitSuccess && (
                  <div className="text-green-700 font-bold text-center mt-4 text-lg flex flex-col items-center gap-2">
                    <span>{submitSuccess}</span>
                    {orderOid && orderDate && (
                      <span className="bg-green-100 text-green-800 px-4 py-2 rounded-lg border border-green-300 mt-2">
                        Your Order ID:{" "}
                        <span className="font-mono font-bold">{orderOid}</span>
                        <br />
                        Order Date:{" "}
                        <span className="font-mono">{orderDate}</span>
                      </span>
                    )}
                  </div>
                )}
                {submitError && (
                  <div
                    ref={errorRef}
                    className="text-red-700 font-bold text-center text-lg my-4 border-2 border-red-300 bg-red-50 rounded p-3 shadow-lg"
                  >
                    {submitError}
                  </div>
                )}
              </form>
            </Form>
          )}
          {step === 4 && (
            <Form {...deliveryForm}>
              <form
                onSubmit={deliveryForm.handleSubmit(handleDeliverySubmit)}
                className="space-y-5"
              >
                {submitSuccess ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="text-green-700 font-bold text-center text-lg flex flex-col items-center gap-2">
                      <span>{submitSuccess}</span>
                      {orderOid && orderDate && (
                        <span className="bg-green-100 text-green-800 px-4 py-2 rounded-lg border border-green-300 mt-2">
                          Your Order ID:{" "}
                          <span className="font-mono font-bold">
                            {orderOid}
                          </span>
                          <br />
                          Order Date:{" "}
                          <span className="font-mono">{orderDate}</span>
                        </span>
                      )}
                    </div>
                    <div className="mt-6 flex flex-col items-center gap-2">
                      <Button
                        type="button"
                        onClick={resetAll}
                        className="px-6 py-2 rounded-lg font-semibold shadow-md"
                      >
                        Submit another order
                      </Button>
                      <span className="text-xs text-gray-500">
                        or wait {resetTimer} seconds to reset
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-6 p-4">
                      <h2 className="text-xl font-bold mb-4">
                        Review Your Order
                      </h2>
                      <div className="space-y-4">
                        {/* Customer Info */}
                        <div>
                          <h3 className="font-semibold text-lg mb-1">
                            Customer Information
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm">
                            <div>
                              <span className="font-medium">Full Name:</span>{" "}
                              {customerData?.fullName}
                            </div>
                            <div>
                              <span className="font-medium">
                                Contact Number:
                              </span>{" "}
                              {customerData?.contactNumber}
                            </div>
                            <div>
                              <span className="font-medium">
                                Same for WhatsApp:
                              </span>{" "}
                              {customerData?.sameForWhatsapp ? "Yes" : "No"}
                            </div>
                            <div>
                              <span className="font-medium">Email:</span>{" "}
                              {customerData?.email}
                            </div>
                            <div className="sm:col-span-2">
                              <span className="font-medium">Full Address:</span>{" "}
                              {customerData?.fullAddress}
                            </div>
                            <div>
                              <span className="font-medium">
                                Preferred Communication:
                              </span>{" "}
                              {customerData?.preferredCommunication}
                            </div>
                          </div>
                        </div>
                        {/* Order Details */}
                        <div>
                          <h3 className="font-semibold text-lg mb-1">
                            Order Details
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm">
                            <div>
                              <span className="font-medium">Order Type:</span>{" "}
                              {orderForm.getValues().orderType}
                            </div>
                            <div>
                              <span className="font-medium">Urgency:</span>{" "}
                              {orderForm.getValues().urgency}
                            </div>
                            <div>
                              <span className="font-medium">Quantity:</span>{" "}
                              {orderForm.getValues().quantity}
                            </div>
                          </div>
                        </div>
                        {/* Measurements & Design */}
                        <div>
                          <h3 className="font-semibold text-lg mb-1">
                            Measurements & Design
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm">
                            {/* <div><span className="font-medium">Measurement Method:</span> {measurementForm.getValues().measurementMethod}</div> */}
                            <div>
                              <span className="font-medium">
                                Design Description:
                              </span>{" "}
                              {measurementForm.getValues().designDescription}
                            </div>
                          </div>
                          {measurementForm.getValues().designReference &&
                            Array.isArray(
                              measurementForm.getValues().designReference
                            ) &&
                            measurementForm.getValues().designReference.length >
                              0 && (
                              <div className="mt-2">
                                <div className="font-medium mb-1">
                                  Design Reference Files:
                                </div>
                                <div className="flex flex-wrap gap-4">
                                  {measurementForm
                                    .getValues()
                                    .designReference.map(
                                      (file: any, idx: number) => (
                                        <div
                                          key={idx}
                                          className="flex flex-col items-center"
                                        >
                                          {file.type &&
                                          file.type.startsWith("image/") ? (
                                            <img
                                              src={URL.createObjectURL(file)}
                                              alt={file.name}
                                              className="h-20 w-20 object-cover rounded border"
                                            />
                                          ) : (
                                            <span className=" h-20 w-20 bg-gray-200 rounded flex items-center justify-center border">
                                              PDF
                                            </span>
                                          )}
                                          <span className="text-xs mt-1">
                                            {file.name}
                                          </span>
                                        </div>
                                      )
                                    )}
                                </div>
                              </div>
                            )}
                          {measurementForm.getValues().canvasImage && (
                            <div className="mt-2">
                              <div className="font-medium mb-1">
                                Canvas Drawing:
                              </div>
                              <img
                                src={measurementForm.getValues().canvasImage}
                                alt="Canvas Drawing Preview"
                                className="border rounded shadow max-w-full h-auto"
                                style={{ maxHeight: 180 }}
                              />
                            </div>
                          )}
                        </div>
                        {/* Delivery & Payment */}
                        <div>
                          <h3 className="font-semibold text-lg mb-1">
                            Delivery & Payment
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm">
                            <div>
                              <span className="font-medium">
                                Delivery Date:
                              </span>{" "}
                              {deliveryForm
                                .getValues()
                                .deliveryDate?.toLocaleDateString?.() ||
                                String(deliveryForm.getValues().deliveryDate)}
                            </div>
                            <div>
                              <span className="font-medium">
                                Delivery Method:
                              </span>{" "}
                              {deliveryForm.getValues().deliveryMethod}
                            </div>
                            <div>
                              <span className="font-medium">
                                Budget Amount:
                              </span>{" "}
                              ₹{deliveryForm.getValues().budgetAmount}
                            </div>
                            <div>
                              <span className="font-medium">Payment:</span>{" "}
                              {deliveryForm.getValues().payment}
                            </div>
                            <div className="sm:col-span-2">
                              <span className="font-medium">
                                Special Instructions:
                              </span>{" "}
                              {deliveryForm.getValues().specialInstructions || (
                                <span className="text-gray-400">(none)</span>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* Garments Overview */}
                        <div>
                          <h3 className="font-semibold text-lg mb-1">
                            Garments in Order
                          </h3>
                          <ul className="space-y-2">
                            {garments.map((g, idx) => (
                              <li key={idx} className="border rounded p-2">
                                <div className="font-medium">
                                  {g.order.orderType.charAt(0).toUpperCase() +
                                    g.order.orderType.slice(1)}{" "}
                                  (Qty: {g.order.quantity})
                                </div>
                                {/* 8. In the review step, show gender per garment */}
                                <div className="text-xs text-gray-600">
                                  Gender:{" "}
                                  {g.gender
                                    ? g.gender.charAt(0).toUpperCase() +
                                      g.gender.slice(1)
                                    : ""}
                                </div>
                                <div className="text-xs text-gray-600">
                                  Urgency: {g.order.urgency}
                                </div>
                                {/* Show measurements summary */}
                                <div className="mt-1 grid grid-cols-2 gap-1 text-xs">
                                  {Array.isArray(g.measurement.measurements) ||
                                  !g.measurement.measurements
                                    ? null
                                    : Object.entries(
                                        g.measurement.measurements
                                      ).map(([k, v]) => (
                                        <div key={k}>
                                          <span className="font-medium">
                                            {k
                                              .replace(/([A-Z])/g, " $1")
                                              .replace(/^./, (s: string) =>
                                                s.toUpperCase()
                                              )}
                                            :
                                          </span>{" "}
                                          {String(v)}
                                        </div>
                                      ))}
                                </div>
                                {/* Show design reference images if present */}
                                {g.measurement.designReference &&
                                  Array.isArray(
                                    g.measurement.designReference
                                  ) &&
                                  g.measurement.designReference.length > 0 && (
                                    <div className="mt-2">
                                      <div className="font-medium mb-1">
                                        Design Reference Images:
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        {g.measurement.designReference.map(
                                          (file: any, i: number) => (
                                            <img
                                              key={i}
                                              src={
                                                typeof file === "string"
                                                  ? file
                                                  : URL.createObjectURL(file)
                                              }
                                              alt={
                                                file.name ||
                                                `Design Reference ${i + 1}`
                                              }
                                              className="h-16 w-16 object-cover rounded border"
                                            />
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )}
                                {/* Show canvas image if present */}
                                {g.measurement.canvasImage && (
                                  <div className="mt-2">
                                    <div className="font-medium mb-1">
                                      Canvas Drawing:
                                    </div>
                                    <img
                                      src={g.measurement.canvasImage}
                                      alt="Canvas Drawing Preview"
                                      className="border rounded shadow max-w-full h-auto"
                                      style={{ maxHeight: 120 }}
                                    />
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                    <CardFooter className="flex flex-col sm:flex-row gap-3 sm:gap-0 justify-between pt-4 w-full">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setStep(3)}
                        className="w-full sm:w-auto px-6 py-2 rounded-lg font-semibold"
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        className="w-full sm:w-auto px-6 py-2 rounded-lg font-semibold shadow-md"
                        disabled={submitLoading}
                      >
                        {submitLoading ? "Submitting..." : "Confirm & Submit"}
                      </Button>
                    </CardFooter>
                    {submitError && (
                      <div className="text-red-600 font-semibold text-center mt-4">
                        {submitError}
                      </div>
                    )}
                  </>
                )}
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
      {garments.length > 0 && (
        <div
          ref={garmentsSummaryRef}
          className="my-4 p-4 bg-slate-50 border rounded w-full max-w-xl overflow-x-auto"
        >
          <h3 className="font-semibold mb-2">Garments in Order:</h3>
          <ul className="space-y-2">
            {garments.map((g, idx) => (
              <li
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between border-b pb-2"
              >
                <div>
                  <span className="font-medium">
                    {g.order.orderType.charAt(0).toUpperCase() +
                      g.order.orderType.slice(1)}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">
                    Qty: {g.order.quantity}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditGarment(idx)}
                    className="w-full sm:w-auto"
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRemoveGarment(idx)}
                    className="w-full sm:w-auto"
                  >
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* Add Garment/Continue buttons below garments summary */}
      {garments.length > 0 && step === 2 ? (
        <div className="flex flex-col sm:flex-row gap-3 justify-end mt-2 w-full max-w-xl">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              orderForm.reset();
              measurementForm.reset();
              setGarmentGender(undefined);
              setEditingIndex(null);
              setShowGarmentForm(true);
            }}
            className="w-full sm:w-auto px-6 py-2 rounded-lg font-semibold"
          >
            Add Another Garment
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={() => setStep(3)}
            disabled={garments.length === 0}
            className="w-full sm:w-auto px-6 py-2 rounded-lg font-semibold shadow-md"
          >
            Continue
          </Button>
        </div>
      ) : null}
    </div>
  );
}
