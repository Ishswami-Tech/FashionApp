"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useEffect, useState, useRef } from "react";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";

const phoneRegex = /^((\+91)?|91)?[6-9][0-9]{9}$/;
const pinCodeRegex = /^[1-9][0-9]{5}$/;

const customerInfoSchema = z.object({
  fullName: z.string().min(2, "Full Name is required"),
  phone: z.string().regex(phoneRegex, "Enter a valid Indian mobile number"),
  whatsapp: z.string().optional(),
  email: z.string().email("Enter a valid email address"),
  address: z.string().min(10, "Address is required"),
  pinCode: z.string().regex(pinCodeRegex, "Enter a valid 6-digit pin code"),
  preferredCommunication: z.enum(["whatsapp", "phone", "email"], { required_error: "Select a communication method" }),
});

const orderDetailsSchema = z.object({
  orderType: z.enum([
    "blouse_choli",
    "kurti_kameez",
    "lehenga",
    "saree_blouse",
    "palazzo_pants",
    "dupatta_scarf",
    "alterations",
    "custom_design",
  ], { required_error: "Select an order type" }),
  quantity: z.coerce.number().min(1, "Minimum 1").max(10, "Maximum 10"),
  fabricDetails: z.string().min(2, "Fabric details required"),
  urgency: z.enum(["regular", "priority", "express"], { required_error: "Select urgency" }),
});

const measurementSchema = z.object({
  measurementMethod: z.enum([
    "provide_measurements",
    "send_sample",
    "visit",
    "video_call",
  ], { required_error: "Select a measurement method" }),
  designReference: z
    .any()
    .refine(
      (files) => {
        if (!files || files.length === 0) return true; // optional
        if (files.length > 5) return false;
        for (const file of files) {
          if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) return false;
          if (file.size > 5 * 1024 * 1024) return false;
        }
        return true;
      },
      { message: "Max 5 files. Only JPG, PNG, PDF. Max 5MB each." }
    ),
  designDescription: z.string().min(2, "Design description required"),
});

const deliverySchema = z.object({
  deliveryDate: z.date().refine(
    (date) => date && date >= addDays(new Date(), 3),
    { message: "Delivery date must be at least 3 days from today" }
  ),
  deliveryMethod: z.enum(["home", "pickup", "courier"], { required_error: "Select a delivery method" }),
  budgetAmount: z
    .string()
    .refine((val) => /^\d+(\.\d{1,2})?$/.test(val) && parseFloat(val) > 0, {
      message: "Enter a valid positive amount",
    }),
  payment: z.enum(["cod", "upi", "bank"], { required_error: "Select a payment preference" }),
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

  // Section 1: Customer Info
  const form = useForm<CustomerInfo>({
    resolver: zodResolver(customerInfoSchema),
    mode: "onChange",
    defaultValues: {
      fullName: "",
      phone: "",
      whatsapp: "",
      email: "",
      address: "",
      pinCode: "",
      preferredCommunication: undefined,
    },
  });

  // Auto-fill WhatsApp number from phone
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "phone" && value.phone && !value.whatsapp) {
        form.setValue("whatsapp", value.phone);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Section 2: Order Details
  const orderForm = useForm<OrderDetails>({
    resolver: zodResolver(orderDetailsSchema),
    mode: "onChange",
    defaultValues: {
      orderType: undefined,
      quantity: 1,
      fabricDetails: "",
      urgency: undefined,
    },
  });

  const handleCustomerSubmit = (data: CustomerInfo) => {
    setCustomerData(data);
    setStep(2);
  };

  const handleOrderSubmit = (data: OrderDetails) => {
    setStep(3);
  };

  // Section 3: Measurements & Design
  const measurementForm = useForm<MeasurementDesign>({
    resolver: zodResolver(measurementSchema),
    mode: "onChange",
    defaultValues: {
      measurementMethod: undefined,
      designReference: undefined,
      designDescription: "",
    },
  });

  const handleMeasurementSubmit = (data: MeasurementDesign) => {
    setStep(4);
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
    try {
      const payload = {
        customer: customerData,
        order: orderForm.getValues(),
        measurement: measurementForm.getValues(),
        delivery: data,
      };
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success) {
        setOrderId(result.orderId);
        setSubmitSuccess("Order submitted successfully!");
        // Optionally reset form or redirect here
      } else {
        setSubmitError(result.error || "Failed to submit order.");
      }
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to submit order.");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Progress indicator
  const steps = [
    "Customer Info",
    "Order Details",
    "Measurements & Design",
    "Delivery & Payment",
  ];

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 py-8 px-2">
      {/* Progress Indicator */}
      <div className="w-full max-w-xl mb-6 px-2 sm:px-0">
        <div className="flex items-center justify-between mb-2">
          {steps.map((label, idx) => (
            <div key={label} className="flex-1 flex flex-col items-center">
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
              <span className={cn("text-xs mt-1 font-medium", step === idx + 1 ? "text-blue-700" : "text-gray-500")}>{label}</span>
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
      <Card className="w-full max-w-xl shadow-2xl transition-all duration-500 animate-fade-in px-2 sm:px-0">
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {step === 1
              ? "Customer Information"
              : step === 2
              ? "Order Details"
              : step === 3
              ? "Measurements & Design"
              : "Delivery & Payment"}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          {step === 1 && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCustomerSubmit)} className="space-y-5">
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
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="whatsapp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp Number (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter WhatsApp number" {...field} />
                      </FormControl>
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
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complete Address *</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter complete address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pinCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pin Code *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter 6-digit pin code" {...field} />
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
                <CardFooter className="flex flex-col sm:flex-row gap-3 sm:gap-0 justify-end pt-4">
                  <Button type="submit" disabled={!form.formState.isValid} className="w-full sm:w-auto px-6 py-2 rounded-lg font-semibold shadow-md">
                    Next
                  </Button>
                </CardFooter>
              </form>
            </Form>
          )}
          {step === 2 && (
            <Form {...orderForm}>
              <form onSubmit={orderForm.handleSubmit(handleOrderSubmit)} className="space-y-5">
                <FormField
                  control={orderForm.control}
                  name="orderType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order Type *</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select order type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="blouse_choli">Blouse/Choli</SelectItem>
                            <SelectItem value="kurti_kameez">Kurti/Kameez</SelectItem>
                            <SelectItem value="lehenga">Lehenga</SelectItem>
                            <SelectItem value="saree_blouse">Saree Blouse</SelectItem>
                            <SelectItem value="palazzo_pants">Palazzo/Pants</SelectItem>
                            <SelectItem value="dupatta_scarf">Dupatta/Scarf</SelectItem>
                            <SelectItem value="alterations">Alterations</SelectItem>
                            <SelectItem value="custom_design">Custom Design</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={orderForm.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity *</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={10} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={orderForm.control}
                  name="fabricDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fabric Details *</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Type, color preferences, special requirements" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={orderForm.control}
                  name="urgency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Urgency Level *</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-row gap-4"
                        >
                          <FormItem>
                            <FormControl>
                              <RadioGroupItem value="regular" />
                            </FormControl>
                            <FormLabel>Regular (7-10 days)</FormLabel>
                          </FormItem>
                          <FormItem>
                            <FormControl>
                              <RadioGroupItem value="priority" />
                            </FormControl>
                            <FormLabel>Priority (4-6 days)</FormLabel>
                          </FormItem>
                          <FormItem>
                            <FormControl>
                              <RadioGroupItem value="express" />
                            </FormControl>
                            <FormLabel>Express (2-3 days)</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <CardFooter className="flex flex-col sm:flex-row gap-3 sm:gap-0 justify-between pt-4">
                  <Button type="button" variant="secondary" onClick={() => setStep(1)} className="w-full sm:w-auto px-6 py-2 rounded-lg font-semibold">
                    Back
                  </Button>
                  <Button type="submit" disabled={!orderForm.formState.isValid} className="w-full sm:w-auto px-6 py-2 rounded-lg font-semibold shadow-md">
                    Next
                  </Button>
                </CardFooter>
              </form>
            </Form>
          )}
          {step === 3 && (
            <Form {...measurementForm}>
              <form onSubmit={measurementForm.handleSubmit(handleMeasurementSubmit)} className="space-y-5">
                <FormField
                  control={measurementForm.control}
                  name="measurementMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Measurement Method *</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-row gap-4"
                        >
                          <FormItem>
                            <FormControl>
                              <RadioGroupItem value="provide_measurements" />
                            </FormControl>
                            <FormLabel>Provide measurements</FormLabel>
                          </FormItem>
                          <FormItem>
                            <FormControl>
                              <RadioGroupItem value="send_sample" />
                            </FormControl>
                            <FormLabel>Send sample</FormLabel>
                          </FormItem>
                          <FormItem>
                            <FormControl>
                              <RadioGroupItem value="visit" />
                            </FormControl>
                            <FormLabel>Visit for measurement</FormLabel>
                          </FormItem>
                          <FormItem>
                            <FormControl>
                              <RadioGroupItem value="video_call" />
                            </FormControl>
                            <FormLabel>Video call guidance</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={measurementForm.control}
                  name="designReference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Design Reference (JPG, PNG, PDF, max 5MB, up to 5 files)</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/jpeg,image/png,application/pdf"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            setMeasurementFiles(files);
                            field.onChange(files);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                      {measurementFiles.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {measurementFiles.map((file, idx) => (
                            <div key={idx} className="text-xs">
                              {file.type.startsWith("image/") ? (
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={file.name}
                                  className="inline-block h-12 w-12 object-cover rounded mr-2 border"
                                />
                              ) : (
                                <span className="inline-block h-12 w-12 bg-gray-200 rounded mr-2 flex items-center justify-center border">
                                  PDF
                                </span>
                              )}
                              {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
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
                        <Textarea placeholder="Style requirements, embellishments, special instructions" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <CardFooter className="flex flex-col sm:flex-row gap-3 sm:gap-0 justify-between pt-4">
                  <Button type="button" variant="secondary" onClick={() => setStep(2)} className="w-full sm:w-auto px-6 py-2 rounded-lg font-semibold">
                    Back
                  </Button>
                  <Button type="submit" disabled={!measurementForm.formState.isValid} className="w-full sm:w-auto px-6 py-2 rounded-lg font-semibold shadow-md">
                    Next
                  </Button>
                </CardFooter>
              </form>
            </Form>
          )}
          {step === 4 && (
            <Form {...deliveryForm}>
              <form onSubmit={deliveryForm.handleSubmit(handleDeliverySubmit)} className="space-y-5">
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
                              {field.value ? format(field.value, "PPP") : <span>Select a date</span>}
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
                          <span className="text-lg font-semibold text-gray-500">₹</span>
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
                        <Textarea placeholder="Any special instructions?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <CardFooter className="flex flex-col sm:flex-row gap-3 sm:gap-0 justify-between pt-4">
                  <Button type="button" variant="secondary" onClick={() => setStep(3)} className="w-full sm:w-auto px-6 py-2 rounded-lg font-semibold">
                    Back
                  </Button>
                  <Button type="submit" disabled={!deliveryForm.formState.isValid || submitLoading} className="w-full sm:w-auto px-6 py-2 rounded-lg font-semibold shadow-md">
                    {submitLoading ? "Submitting..." : "Submit"}
                  </Button>
                </CardFooter>
                {submitSuccess && (
                  <div className="text-green-700 font-bold text-center mt-4 text-lg flex flex-col items-center gap-2">
                    <span>{submitSuccess}</span>
                    {orderId && (
                      <span className="bg-green-100 text-green-800 px-4 py-2 rounded-lg border border-green-300 mt-2">
                        Your Order ID: <span className="font-mono font-bold">{orderId}</span>
                      </span>
                    )}
                  </div>
                )}
                {submitError && <div className="text-red-600 font-semibold text-center mt-4">{submitError}</div>}
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 