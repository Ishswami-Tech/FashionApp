import * as z from "zod";

export const customerInfoSchema = z.object({
  fullName: z.string().min(2, "Full Name is required"),
  contactNumber: z.string().min(10, "Enter a valid contact number"),
  sameForWhatsapp: z.boolean().optional(),
  email: z.string().optional(),
  fullAddress: z.string().min(10, "Address is required"),
});

// You must import measurementData and allGarmentTypes in the file that uses the schema
export const orderDetailsSchema = z.object({
  orderType: z.string(), // Refine in parent with allGarmentTypes
  quantity: z.coerce.number().min(1, "Minimum 1").max(10, "Maximum 10"),
});

export const measurementSchema = z.object({
  designReference: z.any().refine(
    (files) => {
      if (!files || files.length === 0) return true;
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
  // Make measurements object and all its keys/values optional
  measurements: z.record(z.string(), z.union([z.string(), z.number()]).optional()).optional(),
  voiceNote: z.any().optional(),
});

export const deliverySchema = z.object({
  deliveryDate: z.date().refine(
    (date) => {
      const minDate = new Date();
      minDate.setDate(minDate.getDate() + 3);
      return date && date >= minDate;
    },
    {
      message: "Delivery date must be at least 3 days from today",
    }
  ),
  urgency: z.enum(["regular", "priority", "express"]).optional(),
  payment: z.enum(["cod", "upi", "bank", "advance"], {
    required_error: "Select a payment preference",
  }),
  advanceAmount: z.coerce.number()
    .min(0, "Enter advance amount")
    .max(1000000, "Too high")
    .transform((val) => (isNaN(val) ? 0 : val)),
  specialInstructions: z.string().optional(),
}).refine(
  (data) => {
    if (data.payment === 'advance') {
      return typeof data.advanceAmount === 'number' && data.advanceAmount >= 0;
    }
    return true;
  },
  { message: 'Advance amount required', path: ['advanceAmount'] }
);

export type CustomerInfo = z.infer<typeof customerInfoSchema>;
export type OrderDetails = z.infer<typeof orderDetailsSchema>;
export type MeasurementDesign = z.infer<typeof measurementSchema>;
export type DeliveryPayment = z.infer<typeof deliverySchema>; 