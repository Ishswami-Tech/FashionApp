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
import { Calendar as CalendarIcon } from "lucide-react";
import { CanvasPaint } from "@/components/CanvasPaint";
import measurementData from "@/app/measurement2.js";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

const phoneRegex = /^((\+91)?|91)?[6-9][0-9]{9}$/;
const pinCodeRegex = /^[1-9][0-9]{5}$/;

const customerInfoSchema = z.object({
  fullName: z.string().min(2, "Full Name is required"),
  contactNumber: z.string().min(10, "Enter a valid contact number"),
  sameForWhatsapp: z.boolean().optional(),
  email: z.string().optional(),
  fullAddress: z.string().min(10, "Address is required"),
});

// Dynamically generate all garment types from measurement2.js
const allGarmentTypes = Array.from(
  new Set(measurementData.measurement_new.map((form: any) => form.category))
) as [string, ...string[]];

const orderDetailsSchema = z.object({
  orderType: z.enum(allGarmentTypes, {
    required_error: "Select a garment type",
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
  deliveryDate: z.date().refine(
    (date) => {
      // Use a fixed reference date for validation to avoid hydration issues
      const minDate = new Date();
      minDate.setDate(minDate.getDate() + 3);
      return date && date >= minDate;
    },
    {
      message: "Delivery date must be at least 3 days from today",
    }
  ),
  urgency: z.enum(["regular", "priority", "express"], {
    required_error: "Select urgency",
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
  const [unit, setUnit] = useState<"in" | "cm">("in");
  // Add garments array state
  const [garments, setGarments] = useState<any[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  // 2. Add variant state for the garment form
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>(
    undefined
  );
  // Add a ref for the garments summary section
  const garmentsSummaryRef = useRef<HTMLDivElement | null>(null);
  // Add a state to control whether the garment form is visible
  const [showGarmentForm, setShowGarmentForm] = useState(true);
  const [orderOid, setOrderOid] = useState<string | null>(null);
  const [orderDate, setOrderDate] = useState<string | null>(null);
  // Store the full submitted order from backend
  const [submittedOrder, setSubmittedOrder] = useState<any | null>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);
  // Add state for multiple designs per quantity
  const [designs, setDesigns] = useState<any[]>([]);
  // Add state for current date to avoid hydration issues
  const [currentDate, setCurrentDate] = useState<string>("");

  // Set current date on client side only
  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString());
  }, []);

  // Print functions for different sections
  const printCustomerCopy = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print the customer copy");
      return;
    }

    // Get the actual data from component state
    const customerData = submittedOrder || {
      fullName: form.getValues().fullName,
      contactNumber: form.getValues().contactNumber,
      email: form.getValues().email,
      fullAddress: form.getValues().fullAddress,
    };

    const garmentsData = submittedOrder?.garments || garments;
    const deliveryData = submittedOrder || deliveryForm.getValues();
    const orderTotalAmount = submittedOrder?.totalAmount || totalAmount;

    const customerContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Customer Order Copy</title>
        <style>
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          @media print {
            @page {
              margin: 0.5in;
              size: A4;
            }
            body { 
              margin: 0; 
              padding: 10px; 
              font-family: Arial, sans-serif; 
              font-size: 10px;
              line-height: 1.2;
            }
            .header { 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important; 
              color: white !important; 
              padding: 15px; 
              text-align: center; 
              margin-bottom: 15px; 
              border-radius: 8px;
            }
            .section { 
              margin-bottom: 15px; 
              padding: 12px; 
              border: 1px solid #e0e0e0; 
              border-radius: 6px; 
              background: #fafafa;
            }
            .section-title { 
              font-weight: bold; 
              color: #333; 
              margin-bottom: 8px; 
              font-size: 12px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 4px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              font-size: 10px; 
              margin-top: 6px;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 6px 8px; 
              text-align: left; 
            }
            th { 
              background: #f5f5f5; 
              font-weight: bold; 
              color: #333;
            }
            .total-section { 
              margin-top: 10px; 
              border-top: 2px solid #333; 
              padding-top: 8px;
            }
            .total-row { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 4px; 
              font-size: 10px;
            }
            .final-total { 
              font-weight: bold; 
              font-size: 12px; 
              color: #333;
              border-top: 1px solid #ddd;
              padding-top: 4px;
            }
            .highlight { 
              background: #fff3cd; 
              border: 1px solid #ffeaa7; 
            border-radius: 4px; 
            padding: 8px; 
              margin-top: 8px;
              font-size: 10px;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0; font-size: 16px;">📋 Your Order Confirmation With Sony Fashion </h1>
          <p style="margin: 5px 0; font-size: 10px;">Order ID: ${
            orderId || submittedOrder?.oid
          }</p>
          <p style="margin: 5px 0; font-size: 10px;">Date: ${currentDate}</p>
        </div>

        <div class="section">
          <div class="section-title">👤 Customer Information</div>
          <table>
            <tr><th>Name</th><td>${customerData.fullName}</td></tr>
            <tr><th>Phone</th><td>${customerData.contactNumber}</td></tr>
            <tr><th>Email</th><td>${customerData.email}</td></tr>
            <tr><th>Address</th><td>${customerData.fullAddress}</td></tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">👕 Order Summary</div>
          <table>
            <tr><th>Total Garments</th><td>${garmentsData.length}</td></tr>
            <tr><th>Delivery Date</th><td>${
              deliveryData.deliveryDate?.toLocaleDateString?.() ||
              String(deliveryData.deliveryDate)
            }</td></tr>
            <tr><th>Payment Method</th><td>${deliveryData.payment}</td></tr>
            <tr><th>Special Instructions</th><td>${
              deliveryData.specialInstructions || "None"
            }</td></tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">💰 Order Summary & Payment</div>
          <div class="total-section">
            <div class="total-row final-total">
              <span>Total Amount:</span>
              <span>₹${orderTotalAmount}</span>
            </div>
          </div>
          <div class="highlight">
            <strong>Payment Method:</strong> ${deliveryData.payment}<br>
            <strong>Payment Status:</strong> Pending
          </div>
        </div>

        <div class="section">
          <div class="section-title">📝 Order Notes</div>
          <div class="highlight">
            <p style="margin: 2px 0;"><strong>What you ordered:</strong></p>
            <p style="margin: 2px 0;">• ${
              garmentsData.length
            } garment(s) with custom designs</p>
            <p style="margin: 2px 0;">• Delivery on ${
              deliveryData.deliveryDate?.toLocaleDateString?.() ||
              String(deliveryData.deliveryDate)
            }</p>
            <p style="margin: 2px 0;">• Total amount: ₹${orderTotalAmount}</p>
            <p style="margin: 2px 0;">• Payment method: ${
              deliveryData.payment
            }</p>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(customerContent);
    printWindow.document.close();

    // Ensure the window is ready before printing
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      // Do not auto-close; let the user close the window after printing
    };

    // Fallback if onload doesn't fire
    setTimeout(() => {
      if (!printWindow.closed) {
        printWindow.focus();
        printWindow.print();
        setTimeout(() => {
          printWindow.close();
        }, 1000);
      }
    }, 500);
  };

  const printTailorCopy = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print the tailor copy");
      return;
    }

    const garmentsData = submittedOrder?.garments || garments;
    const deliveryData = submittedOrder || deliveryForm.getValues();
    const orderIdValue = orderId || submittedOrder?.oid || "";
    const garment = garmentsData[0]; // Only first garment for now
    const design =
      garment?.designs &&
      Array.isArray(garment.designs) &&
      garment.designs.length > 0
        ? garment.designs[0]
        : null;

    // Helper to render up to 3 valid images per design, 300px wide
    function renderDesignImages(design: any) {
      let images: string[] = [];
      if (
        design.canvasImage &&
        typeof design.canvasImage === "string" &&
        design.canvasImage.startsWith("data:image/")
      ) {
        images.push(
          `<img src="${design.canvasImage}" alt="Canvas Drawing" class="canvas-image" />`
        );
      }
      // Support both base64 and URL for designReference and designReferenceFiles
      const refs = [
        ...(Array.isArray(design.designReference)
          ? design.designReference
          : []),
        ...(Array.isArray(design.designReferenceFiles)
          ? design.designReferenceFiles
          : []),
      ];
      images = images.concat(
        refs
          .map((img, idx) => {
            if (typeof img === "string")
              return `<img src="${img}" alt="Reference ${
                idx + 1
              }" class="canvas-image" />`;
            if (img && img.url)
              return `<img src="${img.url}" alt="Reference ${
                idx + 1
              }" class="canvas-image" />`;
            return "";
          })
          .filter(Boolean)
      );
      return images.slice(0, 4).join("");
    }

    const tailorContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tailor Work Order</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 13px; background: #fafbfc; margin: 0; padding: 0; }
          .main-container { max-width: 1000px; margin: 24px auto; background: #fff; border: 2px solid #388e3c; border-radius: 10px; box-shadow: 0 2px 8px #0001; padding: 32px 24px; }
          .order-id { font-size: 18px; font-weight: bold; color: #388e3c; margin-bottom: 18px; letter-spacing: 1px; }
          .two-col { display: grid; grid-template-columns: 1fr 1.2fr; gap: 32px; align-items: flex-start; }
          .section-title { font-weight: bold; color: #388e3c; margin-bottom: 10px; font-size: 16px; border-bottom: 1.5px solid #388e3c; padding-bottom: 4px; }
          .measurement-list { list-style: none; padding: 0; margin: 0; }
          .measurement-list li { margin-bottom: 4px; padding: 4px 6px; font-size: 11px; }
          .measurement-label { font-weight: bold; color: #222; margin-right: 8px; }
          .canvas-image { max-width: 300px; max-height: 300px; width: 300px; height: auto; object-fit: contain; border: 2px solid #388e3c; border-radius: 6px; background: #f8f9fa; box-shadow: 0 1px 4px #0001; margin-bottom: 10px; }
          .design-images { display: flex; gap: 16px; margin: 18px 0; }
          .right-col-section { margin-bottom: 24px; }
          .work-instructions { background: #e8f5e8; border-left: 4px solid #388e3c; border-radius: 6px; padding: 16px 14px; font-size: 14px; color: #222; margin-top: 18px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 8px; }
          th, td { border: 1.5px solid #e0e0e0; padding: 8px 10px; text-align: left; }
        </style>
      </head>
      <body>
        <div class="main-container">
          <div class="order-id">Order ID: ${orderIdValue}</div>
          <div class="two-col">
            <div>
              <div class="section-title">Measurements</div>
              <ul class="measurement-list">
                ${
                  garment &&
                  garment.measurement?.measurements &&
                  Object.keys(garment.measurement.measurements).length > 0
                    ? Object.entries(garment.measurement.measurements)
                        .map(
                          ([key, value]: [string, any]) => `
                    <li><span class="measurement-label">${key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (str) =>
                        str.toUpperCase()
                      )}:</span> ${value}</li>
                  `
                        )
                        .join("")
                    : "<li>No measurements</li>"
                }
              </ul>
            </div>
            <div>
              <div class="right-col-section">
                <div class="section-title">Design Reference</div>
                ${
                  design
                    ? `
                  <div><strong>${garment.order?.orderType || ""} - ${
                        garment.variant || ""
                      }</strong></div>
                  <div><strong>Design 1:</strong> ${
                    design.name || "Design 1"
                  }</div>
                  <div>${design.designDescription || "Custom design"}</div>
                  <div class="design-images">${
                    renderDesignImages(design) || "<span>No images</span>"
                  }</div>
                `
                    : "<div>No design data</div>"
                }
              </div>
                                <div class="right-col-section">
                    <div class="section-title">Delivery Details</div>
                    <table>
                      <tr><th>Delivery Date</th><td>${
                        deliveryData.deliveryDate?.toLocaleDateString?.() ||
                        String(deliveryData.deliveryDate)
                      }</td></tr>
                    </table>
                  </div>
              <div class="work-instructions">
                <div style="font-weight:bold; margin-bottom:6px;">Work Instructions</div>
                ${
                  garment
                    ? `
                  <div>• ${garment.order?.orderType || ""} in ${
                        garment.variant || ""
                      } variant</div>
                  <div>• Quantity: ${garment.order?.quantity || ""}</div>
                  <div>• Urgency: ${garment.order?.urgency || ""}</div>
                  <div>• Follow the design references provided</div>
                  <div>• Use the exact measurements provided</div>
                  <div>• Special instructions: ${
                    deliveryData.specialInstructions || "None"
                  }</div>
                  <div>• Complete by: ${
                    deliveryData.deliveryDate?.toLocaleDateString?.() ||
                    String(deliveryData.deliveryDate)
                  }</div>
                `
                    : "<div>No garment data</div>"
                }
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(tailorContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      // Do not auto-close; let the user close the window after printing
    };
    setTimeout(() => {
      if (!printWindow.closed) {
        printWindow.focus();
        printWindow.print();
        setTimeout(() => {
          printWindow.close();
        }, 1000);
      }
    }, 500);
  };

  const printAdminCopy = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print the admin copy");
      return;
    }

    // Get the actual data from component state
    const customerData = submittedOrder || {
      fullName: form.getValues().fullName,
      contactNumber: form.getValues().contactNumber,
      email: form.getValues().email,
      fullAddress: form.getValues().fullAddress,
    };

    const garmentsData = submittedOrder?.garments || garments;
    const deliveryData = submittedOrder || deliveryForm.getValues();
    const orderTotalAmount = submittedOrder?.totalAmount || totalAmount;

    const adminContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Admin Order Copy</title>
        <style>
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          @media print {
            @page {
              margin: 0.5in;
              size: A4;
            }
            body { 
              margin: 0; 
              padding: 10px; 
              font-family: Arial, sans-serif; 
              font-size: 10px;
              line-height: 1.2;
            }
            .header { 
              background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%) !important; 
              color: white !important; 
              padding: 15px; 
              text-align: center; 
              margin-bottom: 15px; 
            }
            .section { 
              margin-bottom: 15px; 
              page-break-inside: avoid; 
            }
            .section-title { 
              background: #f8f9fa !important; 
              padding: 8px; 
              border-left: 4px solid #ff9800 !important; 
              margin-bottom: 10px; 
              font-weight: bold; 
              font-size: 11px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 10px; 
              font-size: 9px;
            }
            th, td { 
              border: 1px solid #ddd !important; 
              padding: 6px; 
              text-align: left; 
            }
            th { 
              background-color: #f8f9fa !important; 
              font-weight: bold; 
            }
            .total-section { 
              background: #fff3e0 !important; 
              padding: 12px; 
              border-radius: 4px; 
              margin-top: 10px; 
            }
            .total-row { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 5px; 
              font-size: 9px;
            }
            .final-total { 
              font-size: 12px; 
              font-weight: bold; 
              color: #d32f2f !important; 
            }
            .highlight { 
              background: #fff3e0 !important; 
              padding: 10px; 
              border-radius: 4px; 
              border-left: 4px solid #ff9800 !important; 
              font-size: 9px;
            }
            .design-grid { 
              display: grid; 
              grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); 
              gap: 10px; 
              margin-top: 10px; 
            }
            .design-item { 
              border: 1px solid #ddd !important; 
              padding: 8px; 
              border-radius: 4px; 
              font-size: 9px;
            }
          }
          
          body { 
            font-family: Arial, sans-serif; 
            margin: 10px; 
            font-size: 10px;
            line-height: 1.2;
          }
          .header { 
            background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); 
            color: white; 
            padding: 15px; 
            text-align: center; 
            margin-bottom: 15px; 
            border-radius: 4px; 
          }
          .section { 
            margin-bottom: 15px; 
          }
          .section-title { 
            background: #f8f9fa; 
            padding: 8px; 
            border-left: 4px solid #ff9800; 
            margin-bottom: 10px; 
            font-weight: bold; 
            font-size: 11px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 10px; 
            font-size: 9px;
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 6px; 
            text-align: left; 
          }
          th { 
            background-color: #f8f9fa; 
            font-weight: bold; 
          }
          .total-section { 
            background: #fff3e0; 
            padding: 12px; 
            border-radius: 4px; 
            margin-top: 10px; 
          }
          .total-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 5px; 
            font-size: 9px;
          }
          .final-total { 
            font-size: 12px; 
            font-weight: bold; 
            color: #d32f2f; 
          }
          .highlight { 
            background: #fff3e0; 
            padding: 10px; 
            border-radius: 4px; 
            border-left: 4px solid #ff9800; 
            font-size: 9px;
          }
          .design-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); 
            gap: 10px; 
            margin-top: 10px; 
          }
          .design-item { 
            border: 1px solid #ddd; 
            padding: 8px; 
            border-radius: 4px; 
            font-size: 9px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0; font-size: 16px;">📊 Admin Order Copy</h1>
          <p style="margin: 5px 0; font-size: 10px;">Order ID: ${
            orderId || submittedOrder?.oid
          }</p>
          <p style="margin: 5px 0; font-size: 10px;">Date: ${currentDate}</p>
        </div>

        <div class="section">
          <div class="section-title">👤 Customer Information</div>
          <table>
            <tr><th>Name</th><td>${customerData.fullName}</td></tr>
            <tr><th>Phone</th><td>${customerData.contactNumber}</td></tr>
            <tr><th>Email</th><td>${customerData.email}</td></tr>
            <tr><th>Address</th><td>${customerData.fullAddress}</td></tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">👕 Order Details</div>
          <table>
            <tr><th>Total Garments</th><td>${garmentsData.length}</td></tr>
            <tr><th>Delivery Date</th><td>${
              deliveryData.deliveryDate?.toLocaleDateString?.() ||
              String(deliveryData.deliveryDate)
            }</td></tr>
            <tr><th>Payment Method</th><td>${deliveryData.payment}</td></tr>
            <tr><th>Special Instructions</th><td>${
              deliveryData.specialInstructions || "None"
            }</td></tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">🎨 Design References</div>
          <div class="design-grid">
            ${garmentsData
              .map((garment: any, garmentIdx: number) =>
                garment.designs && Array.isArray(garment.designs)
                  ? garment.designs
                      .map(
                        (design: any, designIdx: number) => `
                  <div class="design-item">
                    <p style="margin: 2px 0;"><strong>${
                      garment.order?.orderType
                    } - ${garment.variant}</strong></p>
                    <p style="margin: 2px 0;"><strong>Design ${
                      designIdx + 1
                    }:</strong> ${design.name || `Design ${designIdx + 1}`}</p>
                    <p style="margin: 2px 0;">${
                      design.designDescription || "Custom design"
                    }</p>
                    <p style="margin: 2px 0;"><strong>Amount:</strong> ₹${
                      design.amount
                    }</p>
                  </div>
                `
                      )
                      .join("")
                  : ""
              )
              .join("")}
          </div>
        </div>

        <div class="section">
          <div class="section-title">💰 Pricing Breakdown</div>
          <div class="total-section">
            <div class="total-row final-total">
              <span>Total Amount:</span>
              <span>₹${orderTotalAmount}</span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">💳 Payment Information</div>
          <table>
            <tr><th>Payment Method</th><td>${deliveryData.payment}</td></tr>
            <tr><th>Payment Status</th><td>Pending</td></tr>
            <tr><th>Order Status</th><td>Confirmed</td></tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">🚚 Delivery Information</div>
          <table>
            <tr><th>Delivery Date</th><td>${
              deliveryData.deliveryDate?.toLocaleDateString?.() ||
              String(deliveryData.deliveryDate)
            }</td></tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">📈 Business Summary</div>
          <div class="highlight">
            <p style="margin: 2px 0;"><strong>Order Summary:</strong></p>
            <p style="margin: 2px 0;">• Customer: ${customerData.fullName} (${
      customerData.contactNumber
    })</p>
            <p style="margin: 2px 0;">• Total Garments: ${
              garmentsData.length
            }</p>
            <p style="margin: 2px 0;">• Revenue: ₹${orderTotalAmount}</p>
            <p style="margin: 2px 0;">• Payment: ${deliveryData.payment}</p>
            <p style="margin: 2px 0;">• Delivery: ${
              deliveryData.deliveryDate?.toLocaleDateString?.() ||
              String(deliveryData.deliveryDate)
            }</p>
            <p style="margin: 2px 0;">• Order ID: ${
              orderId || submittedOrder?.oid
            }</p>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(adminContent);
    printWindow.document.close();

    // Ensure the window is ready before printing
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      // Do not auto-close; let the user close the window after printing
    };

    // Fallback if onload doesn't fire
    setTimeout(() => {
      if (!printWindow.closed) {
        printWindow.focus();
        printWindow.print();
        setTimeout(() => {
          printWindow.close();
        }, 1000);
      }
    }, 500);
  };

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
      fullAddress: "",
    },
  });

  // Section 2: Order Details
  const orderForm = useForm<OrderDetails>({
    resolver: zodResolver(orderDetailsSchema),
    mode: "onChange",
    defaultValues: {
      orderType: undefined,
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

  // 1. Extract garment options from measurement2.js
  const garmentOptions = measurementData.measurement_new.map((form: any) => ({
    value: form.category,
    label: form.category,
  }));

  // 2. Compute measurement fields with types
  const orderType = orderForm.watch("orderType") as string | undefined;
  const garmentType = orderType;
  // 5. Use garmentType and selectedVariant for measurement fields
  const measurementFields: string[] = useMemo(() => {
    if (!garmentType) return [];

    // Find the form that matches the selected category
    const form = measurementData.measurement_new.find(
      (f: any) => f.category === garmentType
    );

    if (!form) return [];

    // For categories with variants, use the selected variant's measurements
    if (form.variants && form.variants.length > 0 && selectedVariant) {
      const variant = form.variants.find((v: any) =>
        typeof v === "string"
          ? v === selectedVariant
          : v.type === selectedVariant
      );
      if (variant && typeof variant === "object" && variant.measurements) {
        return variant.measurements.map((m: any) => m.key);
      }
    }

    // For categories without variants (like Saree), use the measurements directly
    if (form.measurements) {
      return form.measurements.map((m: any) => m.key);
    }

    return [];
  }, [garmentType, selectedVariant]);

  // 3. Conversion helpers with types
  const convertValue = (
    val: string | number,
    from: "in" | "cm",
    to: "in" | "cm"
  ): string => {
    if (!val || isNaN(Number(val))) return String(val);
    if (from === to) return String(val);
    return from === "in"
      ? (Number(val) * 2.54).toFixed(2)
      : (Number(val) / 2.54).toFixed(2);
  };

  const handleUnitToggle = (newUnit: "in" | "cm") => {
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
      variant: selectedVariant,
      order: orderForm.getValues(),
      measurement: { ...rawMeasurement, measurements },
      designs:
        designs.length > 0
          ? designs
          : [
              {
                name: "",
                designReference: undefined,
                designDescription: "",
                canvasImage: undefined,
                canvasJson: undefined,
                amount: "",
              },
            ],
    };
    if (editingIndex !== null) {
      setGarments((prev) =>
        prev.map((g, i) => (i === editingIndex ? garmentData : g))
      );
      setEditingIndex(null);
    } else {
      setGarments((prev) => [...prev, garmentData]);
    }
    orderForm.reset();
    measurementForm.reset();
    setSelectedVariant(undefined);
    setShowGarmentForm(false);
    setDesigns([]);
  };

  // Handler to edit a garment
  const handleEditGarment = (idx: number) => {
    const g = garments[idx];
    setSelectedVariant(g.variant);
    orderForm.reset(g.order);
    measurementForm.reset(g.measurement);
    setDesigns(g.designs || []); // Reset designs for editing
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
    setSubmittedOrder(null);
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
        if (g.designs && Array.isArray(g.designs) && g.designs.length > 0) {
          g.designs.forEach((design: any, i: number) => {
            if (
              design.designReference &&
              Array.isArray(design.designReference)
            ) {
              design.designReference.forEach((file: File, j: number) => {
                if (file instanceof File) {
                  formData.append(`designReference_${idx}_${i}_${j}`, file);
                }
              });
            }
            // Canvas Image (base64 string as file)
            if (
              design.canvasImage &&
              typeof design.canvasImage === "string" &&
              design.canvasImage.startsWith("data:image/")
            ) {
              const arr = design.canvasImage.split(",");
              const mime = arr[0].match(/:(.*?);/)[1];
              const bstr = atob(arr[1]);
              let n = bstr.length;
              const u8arr = new Uint8Array(n);
              while (n--) u8arr[n] = bstr.charCodeAt(n);
              const file = new File([u8arr], `canvas_${idx}_${i}.png`, {
                type: mime,
              });
              formData.append(`canvasImage_${idx}_${i}`, file);
            }
            // Voice Note (file)
            if (design.voiceNote && design.voiceNote instanceof File) {
              formData.append(`voiceNote_${idx}_${i}`, design.voiceNote);
            }
          });
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
      console.log("Order API result:", result);
      if (result.success) {
        setOrderOid(result.oid);
        setOrderDate(result.orderDate);
        setOrderId(result.oid); // for backward compatibility
        setSubmitSuccess("Order submitted successfully!");
        setSubmittedOrder(result.order || null);
        setGarments([]); // clear cart after submit
        setStep(4); // Move to confirmation step after successful submission
        // WhatsApp message sending - This is now handled automatically in the backend
        // The backend API (/api/orders) automatically sends WhatsApp message after order is saved
        console.log(
          "Order submitted successfully! WhatsApp message will be sent automatically."
        );
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
  };

  // Progress indicator
  const steps = [
    "Customer Info",
    "Order Details & Measurements",
    "Delivery & Payment",
    "Order Confirmation",
  ];

  // Watch quantity
  const quantity = orderForm.watch("quantity") || 1;

  // When quantity changes, adjust designs array
  useEffect(() => {
    setDesigns((prev) => {
      const arr = [...prev];
      if (arr.length < quantity) {
        for (let i = arr.length; i < quantity; i++) {
          arr.push({
            name: "",
            designReference: undefined,
            designDescription: "",
            canvasImage: undefined,
            canvasJson: undefined,
            amount: "",
          });
        }
      } else if (arr.length > quantity) {
        arr.length = quantity;
      }
      return arr;
    });
  }, [quantity]);

  // Calculate total amount for all garments
  const totalAmount = garments.reduce((sum: number, g: any) => {
    if (g.designs && Array.isArray(g.designs)) {
      return (
        sum +
        g.designs.reduce(
          (dsum: number, d: any) => dsum + (parseFloat(d.amount) || 0),
          0
        )
      );
    }
    return sum;
  }, 0);

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
              : step === 3
              ? "Delivery & Payment"
              : "Order Confirmation"}
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
                      <FormLabel>Email Address </FormLabel>
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
                  <FormField
                    control={orderForm.control}
                    name="orderType"
                    render={({ field }) => (
                      <FormItem className="flex-1 w-full">
                        <FormLabel>Garment Category *</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select garment category" />
                            </SelectTrigger>
                            <SelectContent>
                              {garmentOptions.map(
                                (opt: { value: string; label: string }) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Variant Selection */}
                  {garmentType && (
                    <FormItem className="flex-1 w-full">
                      <FormLabel>Variant *</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={setSelectedVariant}
                          value={selectedVariant}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select variant" />
                          </SelectTrigger>
                          <SelectContent>
                            {(() => {
                              const form = measurementData.measurement_new.find(
                                (f: any) => f.category === garmentType
                              );
                              if (form && form.variants) {
                                return form.variants.map((variant: any) => (
                                  <SelectItem
                                    key={
                                      typeof variant === "string"
                                        ? variant
                                        : variant.type
                                    }
                                    value={
                                      typeof variant === "string"
                                        ? variant
                                        : variant.type
                                    }
                                  >
                                    {typeof variant === "string"
                                      ? variant
                                      : variant.type}
                                  </SelectItem>
                                ));
                              }
                              return [];
                            })()}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
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

                {garmentType && (
                  <div className="my-4">
                    {/* Move Measurement Unit toggle below Quantity */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-semibold">Measurement Unit:</span>
                      <Button
                        type="button"
                        size="sm"
                        variant={unit === "in" ? "default" : "outline"}
                        onClick={() => handleUnitToggle("in")}
                      >
                        Inches
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={unit === "cm" ? "default" : "outline"}
                        onClick={() => handleUnitToggle("cm")}
                      >
                        Centimeters
                      </Button>
                    </div>
                    {measurementFields.length === 0 ? (
                      <div className="text-gray-500 italic">
                        No measurements required for this garment type.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3">
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
                {/* Design Section - Always show when garment type is selected */}
                {garmentType && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center mb-4">
                      <svg
                        className="w-5 h-5 mr-2 text-purple-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"
                        />
                      </svg>
                      <h3 className="text-lg font-semibold text-purple-900">
                        Designs for Each Item
                      </h3>
                    </div>
                    <p className="text-sm text-purple-700 mb-4">
                      Create {quantity} design{quantity > 1 ? "s" : ""} for your{" "}
                      {garmentType.toLowerCase()}. Each design can have its own
                      name, reference images, description, and price.
                    </p>
                    {designs.map((d, idx) => (
                      <div
                        key={idx}
                        className="mb-6 p-4 border border-purple-200 rounded-lg bg-white shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-purple-100">
                          <h4 className="font-semibold text-purple-900">
                            Design #{idx + 1}
                          </h4>
                          <span className="text-sm text-purple-600">
                            Item {idx + 1} of {quantity}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block font-medium mb-1 text-sm text-gray-700">
                              Design Name *
                            </label>
                            <Input
                              type="text"
                              placeholder="e.g., Traditional Kurta, Party Wear"
                              value={designs[idx].name || ""}
                              onChange={(e) => {
                                setDesigns((prev) => {
                                  const arr = [...prev];
                                  arr[idx].name = e.target.value;
                                  return arr;
                                });
                              }}
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="block font-medium mb-1 text-sm text-gray-700">
                              Amount (₹) *
                            </label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              value={designs[idx].amount || ""}
                              onChange={(e) => {
                                setDesigns((prev) => {
                                  const arr = [...prev];
                                  arr[idx].amount = e.target.value;
                                  return arr;
                                });
                              }}
                              className="w-full"
                            />
                          </div>
                        </div>
                        <div className="mt-4">
                          <label className="block font-medium mb-1 text-sm text-gray-700">
                            Design Reference Images
                          </label>
                          <Input
                            type="file"
                            accept="image/jpeg,image/png"
                            multiple
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              setDesigns((prev) => {
                                const arr = [...prev];
                                arr[idx].designReference = files;
                                return arr;
                              });
                            }}
                            className="w-full"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Upload reference images for this design (optional)
                          </p>
                        </div>
                        <div className="mt-4">
                          <label className="block font-medium mb-1 text-sm text-gray-700">
                            Design Description
                          </label>
                          <Textarea
                            placeholder="Describe the style, embellishments, special requirements, etc."
                            value={designs[idx].designDescription}
                            onChange={(e) => {
                              setDesigns((prev) => {
                                const arr = [...prev];
                                arr[idx].designDescription = e.target.value;
                                return arr;
                              });
                            }}
                            rows={3}
                          />
                        </div>
                        <div className="mt-4">
                          <label className="block font-medium mb-1 text-sm text-gray-700">
                            Custom Drawing
                          </label>
                          <div className="border border-gray-200 rounded-lg p-2">
                            <CanvasPaint
                              onSave={(data) => {
                                setDesigns((prev) => {
                                  const arr = [...prev];
                                  arr[idx].canvasImage = data.image;
                                  arr[idx].canvasJson = data.json;
                                  return arr;
                                });
                              }}
                              initialData={designs[idx].canvasJson}
                            />
                            <p className="text-xs text-gray-500 mt-2">
                              Draw or annotate your design here. Click Save to
                              attach it to this design.
                            </p>
                          </div>
                        </div>
                        {designs[idx].canvasImage && (
                          <div className="mt-3">
                            <label className="block text-xs text-gray-500 mb-1">
                              Saved Drawing Preview:
                            </label>
                            <img
                              src={designs[idx].canvasImage}
                              alt="Canvas Drawing Preview"
                              className="border rounded shadow-sm max-w-full h-auto"
                              style={{ maxHeight: 150 }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
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
                  setSelectedVariant(undefined);
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
                className="space-y-8"
              >
                {submitLoading && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-lg font-semibold text-gray-700">
                      Submitting your order...
                    </p>
                    <p className="text-sm text-gray-500">
                      Please wait while we process your order.
                    </p>
                  </div>
                )}
                <div
                  className={
                    submitLoading ? "opacity-50 pointer-events-none" : ""
                  }
                >
                  {/* Order Summary Card */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6">
                    <h3 className="text-lg font-bold mb-4 text-gray-800">
                      Order Summary
                    </h3>
                    <Table className="mb-0 rounded overflow-hidden">
                      <TableHeader>
                        <TableRow className="bg-gray-100">
                          <TableHead className="font-bold">
                            Garment Type
                          </TableHead>
                          <TableHead className="font-bold">Variant</TableHead>
                          <TableHead className="font-bold">Design #</TableHead>
                          <TableHead className="font-bold">
                            Amount (₹)
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {garments.map((g, idx) =>
                          g.designs &&
                          Array.isArray(g.designs) &&
                          g.designs.length > 0 ? (
                            g.designs.map((design: any, i: number) => (
                              <TableRow key={`${idx}-${i}`}>
                                <TableCell>{g.order.orderType}</TableCell>
                                <TableCell>{g.variant}</TableCell>
                                <TableCell>
                                  {design.name || `Design ${i + 1}`}
                                </TableCell>
                                <TableCell>₹{design.amount}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow key={idx}>
                              <TableCell>{g.order.orderType}</TableCell>
                              <TableCell>{g.variant}</TableCell>
                              <TableCell>-</TableCell>
                              <TableCell>₹0</TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="font-bold text-right"
                          >
                            Total Amount
                          </TableCell>
                          <TableCell className="font-bold">
                            ₹{totalAmount.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </div>

                  {/* Payment Details Card */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
                    <h3 className="text-lg font-bold mb-4 text-gray-800">
                      Payment Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={deliveryForm.control}
                        name="payment"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment Preference *</FormLabel>
                            <FormControl>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select payment method" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="cod">
                                    Cash on Delivery/Pickup
                                  </SelectItem>
                                  <SelectItem value="upi">
                                    UPI/Digital Payment
                                  </SelectItem>
                                  <SelectItem value="bank">
                                    Bank Transfer
                                  </SelectItem>
                                </SelectContent>
                              </Select>
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
                            <FormLabel>
                              Special Instructions (optional)
                            </FormLabel>
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
                    </div>
                  </div>

                  {/* Delivery & Urgency Card */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
                    <h3 className="text-lg font-bold mb-4 text-gray-800">
                      Delivery & Urgency
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={deliveryForm.control}
                        name="deliveryDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preferred Delivery Date *</FormLabel>
                            <FormControl>
                              <DatePicker
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Select delivery date"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={deliveryForm.control}
                        name="urgency"
                        render={({ field }) => (
                          <FormItem>
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
                  </div>
                </div>
                <CardFooter className="flex flex-col sm:flex-row gap-3 sm:gap-0 justify-between pt-4 w-full">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setStep(2)}
                    disabled={submitLoading}
                    className="w-full sm:w-auto px-6 py-2 rounded-lg font-semibold"
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    disabled={submitLoading || !deliveryForm.formState.isValid}
                    onClick={() =>
                      deliveryForm.handleSubmit(handleDeliverySubmit)()
                    }
                    className="w-full sm:w-auto px-6 py-2 rounded-lg font-semibold shadow-md"
                  >
                    {submitLoading ? "Submitting..." : "Submit Order"}
                  </Button>
                  {!deliveryForm.formState.isValid && (
                    <div className="text-red-600 text-sm mt-2">
                      Please fill in all required fields correctly.
                    </div>
                  )}
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
          {step === 4 && submittedOrder && (
            <div className="p-4 sm:p-6 bg-white rounded shadow max-w-4xl mx-auto print:max-w-full print:shadow-none print:bg-white print:p-0">
              {/* Print Styles */}
              <style jsx>{`
                @media print {
                  * {
                    -webkit-print-color-adjust: exact !important;
                    color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }

                  .print\:break-after-page {
                    page-break-after: always;
                    break-after: page;
                  }

                  .print\:hidden {
                    display: none !important;
                  }

                  .print\:bg-white {
                    background-color: white !important;
                  }

                  .print\:shadow-none {
                    box-shadow: none !important;
                  }

                  .print\:max-w-full {
                    max-width: 100% !important;
                  }

                  .print\:p-0 {
                    padding: 0 !important;
                  }

                  /* Ensure icons display in print */
                  svg {
                    display: inline-block !important;
                    visibility: visible !important;
                  }

                  /* Ensure colors print */
                  .bg-green-50,
                  .bg-blue-50,
                  .bg-purple-50,
                  .bg-orange-50 {
                    background-color: #f0fdf4 !important;
                  }

                  .bg-green-100,
                  .bg-blue-100,
                  .bg-purple-100,
                  .bg-orange-100 {
                    background-color: #dcfce7 !important;
                  }

                  .border-green-200,
                  .border-blue-200,
                  .border-purple-200,
                  .border-orange-200 {
                    border-color: #bbf7d0 !important;
                  }

                  .text-green-600,
                  .text-blue-600,
                  .text-purple-600,
                  .text-orange-600 {
                    color: #16a34a !important;
                  }

                  .text-green-700,
                  .text-blue-700,
                  .text-purple-700,
                  .text-orange-700 {
                    color: #15803d !important;
                  }

                  .text-green-800,
                  .text-blue-800,
                  .text-purple-800,
                  .text-orange-800 {
                    color: #166534 !important;
                  }

                  .text-green-900,
                  .text-blue-900,
                  .text-purple-900,
                  .text-orange-900 {
                    color: #14532d !important;
                  }

                  /* Ensure table borders print */
                  table,
                  th,
                  td {
                    border: 1px solid #d1d5db !important;
                  }

                  /* Page margins for print */
                  @page {
                    margin: 1in;
                    size: A4;
                  }
                }
              `}</style>

              {/* SECTION 1: ORDER ID & CUSTOMER INFORMATION (Customer Copy) */}
              <div className="print:break-after-page">
                <div className="text-center mb-6 pb-4 border-b-2 border-green-200">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full mb-3">
                    <svg
                      className="w-6 h-6 sm:w-8 sm:h-8 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                    Order Confirmed!
                  </h2>
                  <p className="text-gray-600 mb-3">
                    Your order has been successfully submitted
                  </p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 inline-block">
                    <div className="text-sm text-green-700 mb-1">Order ID</div>
                    <div className="text-xl sm:text-2xl font-mono font-bold text-green-800">
                      {submittedOrder?.oid || orderOid}
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      Order Date: {submittedOrder?.orderDate || orderDate}
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="mb-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 flex items-center">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Customer Information
                  </h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <div className="text-sm font-medium text-blue-700 mb-1">
                          Full Name
                        </div>
                        <div className="text-gray-900 font-semibold">
                          {submittedOrder?.fullName || customerData?.fullName}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-blue-700 mb-1">
                          Contact Number
                        </div>
                        <div className="text-gray-900 font-semibold">
                          {submittedOrder?.contactNumber ||
                            customerData?.contactNumber}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-blue-700 mb-1">
                          Email Address
                        </div>
                        <div className="text-gray-900 font-semibold">
                          {submittedOrder?.email || customerData?.email}
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <div className="text-sm font-medium text-blue-700 mb-1">
                          Full Address
                        </div>
                        <div className="text-gray-900 font-semibold">
                          {submittedOrder?.fullAddress ||
                            customerData?.fullAddress}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: DESIGNS & MEASUREMENTS (Tailor Copy) */}
              <div className="print:break-after-page">
                <div className="text-center mb-6 pb-4 border-b-2 border-purple-200">
                  <h2 className="text-2xl sm:text-3xl font-bold text-purple-900 mb-2">
                    Tailor Copy
                  </h2>
                  <p className="text-purple-600 mb-3">Designs & Measurements</p>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 inline-block">
                    <div className="text-sm text-purple-700 mb-1">Order ID</div>
                    <div className="text-xl sm:text-2xl font-mono font-bold text-purple-800">
                      {submittedOrder?.oid || orderOid}
                    </div>
                    <div className="text-xs text-purple-600 mt-1">
                      Customer:{" "}
                      {submittedOrder?.fullName || customerData?.fullName}
                    </div>
                  </div>
                </div>

                {/* Garments & Designs */}
                <div className="mb-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 flex items-center">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                    Garments & Designs
                  </h3>

                  {(submittedOrder?.garments || garments).map(
                    (garment: any, garmentIdx: number) => (
                      <div
                        key={garmentIdx}
                        className="mb-4 bg-purple-50 border border-purple-200 rounded-lg p-4 sm:p-6"
                      >
                        {/* Garment Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 pb-3 border-b border-purple-200">
                          <div>
                            <h4 className="text-base sm:text-lg font-semibold text-purple-900">
                              {garment.order?.orderType} - {garment.variant}
                            </h4>
                            <p className="text-xs sm:text-sm text-purple-600">
                              Quantity: {garment.order?.quantity} • Urgency:{" "}
                              {garment.order?.urgency}
                            </p>
                          </div>
                          <div className="text-right mt-2 sm:mt-0">
                            <div className="text-xs sm:text-sm text-purple-600">
                              Total for this garment
                            </div>
                            <div className="text-lg sm:text-xl font-bold text-purple-900">
                              ₹
                              {garment.designs
                                ?.reduce(
                                  (sum: number, d: any) =>
                                    sum + (parseFloat(d.amount) || 0),
                                  0
                                )
                                .toFixed(2)}
                            </div>
                          </div>
                        </div>

                        {/* Designs */}
                        {garment.designs &&
                          Array.isArray(garment.designs) &&
                          garment.designs.length > 0 && (
                            <div className="space-y-3">
                              {garment.designs.map(
                                (design: any, designIdx: number) => (
                                  <div
                                    key={designIdx}
                                    className="bg-white rounded-lg border border-purple-200 p-3 sm:p-4"
                                  >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 sm:mb-3">
                                      <h5 className="font-semibold text-purple-900 text-sm sm:text-base">
                                        {design.name ||
                                          `Design ${designIdx + 1}`}
                                      </h5>
                                      <div className="text-base sm:text-lg font-bold text-green-600 mt-1 sm:mt-0">
                                        ₹{design.amount}
                                      </div>
                                    </div>

                                    {/* Design Description */}
                                    {design.designDescription && (
                                      <div className="mb-2 sm:mb-3">
                                        <div className="text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                          Description
                                        </div>
                                        <div className="text-gray-600 bg-gray-50 rounded p-2 text-sm">
                                          {design.designDescription}
                                        </div>
                                      </div>
                                    )}

                                    {/* Design Images */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-2 sm:mb-3">
                                      {/* Canvas Drawing */}
                                      {design.canvasImage && (
                                        <div>
                                          <div className="text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                            Canvas Drawing
                                          </div>
                                          <img
                                            src={design.canvasImage}
                                            alt="Canvas Drawing"
                                            className="w-full h-32 sm:h-48 object-contain bg-white border rounded-lg shadow-sm"
                                          />
                                        </div>
                                      )}

                                      {/* Design Reference Images */}
                                      {(design.designReferenceFiles &&
                                      Array.isArray(
                                        design.designReferenceFiles
                                      ) &&
                                      design.designReferenceFiles.length > 0
                                        ? design.designReferenceFiles
                                        : design.designReference &&
                                          Array.isArray(design.designReference)
                                        ? design.designReference
                                        : []
                                      ).length > 0 && (
                                        <div>
                                          <div className="text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                            Reference Images (
                                            {(design.designReferenceFiles &&
                                              design.designReferenceFiles
                                                .length) ||
                                              (design.designReference &&
                                                design.designReference.length)}
                                            )
                                          </div>
                                          <div className="grid grid-cols-2 gap-2">
                                            {(design.designReferenceFiles &&
                                            design.designReferenceFiles.length >
                                              0
                                              ? design.designReferenceFiles
                                              : design.designReference
                                            ).map(
                                              (file: any, imgIdx: number) => {
                                                let src = "";
                                                if (typeof file === "string") {
                                                  src = file;
                                                } else if (
                                                  typeof window !==
                                                    "undefined" &&
                                                  file instanceof File
                                                ) {
                                                  src =
                                                    URL.createObjectURL(file);
                                                } else if (file?.url) {
                                                  src = file.url;
                                                }
                                                return src ? (
                                                  <img
                                                    key={imgIdx}
                                                    src={src}
                                                    alt={`Reference ${
                                                      imgIdx + 1
                                                    }`}
                                                    className="w-full h-20 sm:h-24 object-cover bg-white border rounded-lg shadow-sm"
                                                  />
                                                ) : null;
                                              }
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          )}

                        {/* Measurements */}
                        {garment.measurement?.measurements &&
                          Object.keys(garment.measurement.measurements).length >
                            0 && (
                            <div className="mt-3 pt-3 border-t border-purple-200">
                              <h5 className="font-semibold text-purple-900 mb-2 sm:mb-3 text-sm sm:text-base">
                                Measurements
                              </h5>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                                {Object.entries(
                                  garment.measurement.measurements
                                ).map(([key, value]) => (
                                  <div
                                    key={key}
                                    className="bg-white rounded-lg border border-purple-200 p-2 sm:p-3"
                                  >
                                    <div className="text-xs font-medium text-purple-600 uppercase tracking-wide">
                                      {key.replace(/([A-Z])/g, " $1").trim()}
                                    </div>
                                    <div className="text-xs sm:text-sm font-semibold text-gray-900">
                                      {String(value)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    )
                  )}

                  {/* Total Amount */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 text-center">
                    <div className="text-sm text-green-700 mb-1">
                      Total Order Amount
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-green-800">
                      ₹{submittedOrder?.totalAmount || totalAmount.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: PRICING & PAYMENT (Admin Copy) */}
              <div className="print:break-after-page">
                <div className="text-center mb-6 pb-4 border-b-2 border-orange-200">
                  <h2 className="text-2xl sm:text-3xl font-bold text-orange-900 mb-2">
                    Admin Copy
                  </h2>
                  <p className="text-orange-600 mb-3">
                    Pricing & Payment Details
                  </p>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 inline-block">
                    <div className="text-sm text-orange-700 mb-1">Order ID</div>
                    <div className="text-xl sm:text-2xl font-mono font-bold text-orange-800">
                      {submittedOrder?.oid || orderOid}
                    </div>
                    <div className="text-xs text-orange-600 mt-1">
                      Customer:{" "}
                      {submittedOrder?.fullName || customerData?.fullName}
                    </div>
                  </div>
                </div>

                {/* Delivery & Payment */}
                <div className="mb-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 flex items-center">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-orange-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    Delivery & Payment Details
                  </h3>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 sm:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <h4 className="font-semibold text-orange-900 mb-2 sm:mb-3 text-sm sm:text-base">
                          Delivery Information
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-orange-700 text-sm">
                              Delivery Date:
                            </span>
                            <span className="font-semibold text-sm">
                              {submittedOrder?.deliveryDate ||
                                deliveryForm
                                  .getValues()
                                  .deliveryDate?.toLocaleDateString?.() ||
                                String(deliveryForm.getValues().deliveryDate)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-orange-900 mb-2 sm:mb-3 text-sm sm:text-base">
                          Payment Information
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-orange-700 text-sm">
                              Payment Method:
                            </span>
                            <span className="font-semibold capitalize text-sm">
                              {submittedOrder?.payment ||
                                deliveryForm.getValues().payment}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-orange-700 text-sm">
                              Amount:
                            </span>
                            <span className="font-semibold text-green-600 text-sm">
                              ₹$
                              {submittedOrder?.totalAmount ||
                                totalAmount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Special Instructions */}
                    {(submittedOrder?.specialInstructions ||
                      deliveryForm.getValues().specialInstructions) && (
                      <div className="mt-3 pt-3 border-t border-orange-200">
                        <h4 className="font-semibold text-orange-900 mb-2 text-sm sm:text-base">
                          Special Instructions
                        </h4>
                        <div className="bg-white rounded-lg p-3 border border-orange-200">
                          <p className="text-gray-700 text-sm">
                            {submittedOrder?.specialInstructions ||
                              deliveryForm.getValues().specialInstructions}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Summary Table */}
                <div className="mb-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 flex items-center">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Order Summary
                  </h3>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Garment
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Variant
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Designs
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {(submittedOrder?.garments || garments).map(
                          (garment: any, garmentIdx: number) => (
                            <tr key={garmentIdx}>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                {garment.order?.orderType}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">
                                {garment.variant}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">
                                {garment.designs?.length || 0} design
                                {garment.designs?.length !== 1 ? "s" : ""}
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                                ₹
                                {garment.designs
                                  ?.reduce(
                                    (sum: number, d: any) =>
                                      sum + (parseFloat(d.amount) || 0),
                                    0
                                  )
                                  .toFixed(2)}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td
                            colSpan={3}
                            className="px-4 py-3 text-sm font-semibold text-gray-900 text-right"
                          >
                            Total Amount:
                          </td>
                          <td className="px-4 py-3 text-lg font-bold text-green-600 text-right">
                            ₹
                            {submittedOrder?.totalAmount ||
                              totalAmount.toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="print:hidden">
                <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Print Options:
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <button
                      type="button"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition-colors flex items-center justify-center text-sm"
                      onClick={async () => {
                        if (submittedOrder?.oid) {
                          const response = await fetch(
                            `/api/proxy-pdf?type=customer&oid=${submittedOrder.oid}`
                          );
                          if (!response.ok) {
                            if (response.status === 404) {
                              alert(
                                "Invoice is being generated. Please try again in a few moments."
                              );
                            } else {
                              alert(
                                "Invoice not available yet. Please contact support if this issue persists."
                              );
                            }
                            return;
                          }
                          const blob = await response.blob();
                          const blobUrl = URL.createObjectURL(blob);
                          const printWindow = window.open(blobUrl, "_blank");
                          if (printWindow) {
                            printWindow.onload = () => {
                              printWindow.focus();
                              printWindow.print();
                              // Do not auto-close; let the user close the window after printing
                            };
                          } else {
                            alert("Please allow popups to print the invoice.");
                          }
                        } else {
                          alert("Invoice not available yet.");
                        }
                      }}
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      Customer Copy
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold shadow hover:bg-purple-700 transition-colors flex items-center justify-center text-sm"
                      onClick={async () => {
                        if (submittedOrder?.oid) {
                          const response = await fetch(
                            `/api/proxy-pdf?type=tailor&oid=${submittedOrder.oid}`
                          );
                          if (!response.ok) {
                            if (response.status === 404) {
                              alert(
                                "Invoice is being generated. Please try again in a few moments."
                              );
                            } else {
                              alert(
                                "Invoice not available yet. Please contact support if this issue persists."
                              );
                            }
                            return;
                          }
                          const blob = await response.blob();
                          const blobUrl = URL.createObjectURL(blob);
                          const printWindow = window.open(blobUrl, "_blank");
                          if (printWindow) {
                            printWindow.onload = () => {
                              printWindow.focus();
                              printWindow.print();
                              // Do not auto-close; let the user close the window after printing
                            };
                          } else {
                            alert("Please allow popups to print the invoice.");
                          }
                        } else {
                          alert("Invoice not available yet.");
                        }
                      }}
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                      Tailor Copy
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold shadow hover:bg-orange-700 transition-colors flex items-center justify-center text-sm"
                      onClick={async () => {
                        if (submittedOrder?.oid) {
                          const response = await fetch(
                            `/api/proxy-pdf?type=admin&oid=${submittedOrder.oid}`
                          );
                          if (!response.ok) {
                            if (response.status === 404) {
                              alert(
                                "Invoice is being generated. Please try again in a few moments."
                              );
                            } else {
                              alert(
                                "Invoice not available yet. Please contact support if this issue persists."
                              );
                            }
                            return;
                          }
                          const blob = await response.blob();
                          const blobUrl = URL.createObjectURL(blob);
                          const printWindow = window.open(blobUrl, "_blank");
                          if (printWindow) {
                            printWindow.onload = () => {
                              printWindow.focus();
                              printWindow.print();
                              // Do not auto-close; let the user close the window after printing
                            };
                          } else {
                            alert("Please allow popups to print the invoice.");
                          }
                        } else {
                          alert("Invoice not available yet.");
                        }
                      }}
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      Admin Copy
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold shadow hover:bg-green-700 transition-colors flex items-center justify-center text-sm"
                      onClick={() => {
                        console.log("All Copies button clicked");
                        window.print();
                      }}
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                        />
                      </svg>
                      All Copies
                    </button>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                  <button
                    type="button"
                    className="px-6 sm:px-8 py-2 sm:py-3 bg-gray-600 text-white rounded-lg font-semibold shadow-lg hover:bg-gray-700 transition-colors flex items-center justify-center text-sm sm:text-base"
                    onClick={() => {
                      setStep(1);
                      resetAll();
                    }}
                  >
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Place New Order
                  </button>
                </div>
              </div>

              {/* Success Message */}
              <div className="mt-4 sm:mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Thank you for your order! We'll contact you soon to confirm
                  the details.
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Order ID: {submittedOrder?.oid || orderOid} • Date:{" "}
                  {submittedOrder?.orderDate || orderDate}
                </p>
              </div>
            </div>
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
              setSelectedVariant(undefined);
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
