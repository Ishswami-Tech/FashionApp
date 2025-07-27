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
import { CustomerInfoForm } from "@/components/orderform/CustomerInfoForm";
import { OrderDetailsForm } from "@/components/orderform/OrderDetailsForm";
import { GarmentsSummary } from "@/components/orderform/GarmentsSummary";
import { DeliveryPaymentForm } from "@/components/orderform/DeliveryPaymentForm";
import { OrderSummaryTable } from "@/components/orderform/OrderSummaryTable";
import { customerInfoSchema, orderDetailsSchema, measurementSchema, deliverySchema, CustomerInfo, OrderDetails, MeasurementDesign, DeliveryPayment } from "@/types/orderSchemas";
import { formatDisplayDate } from "@/lib/orderUtils";
import { OrderFormProvider } from '@/context/OrderFormContext';
import { OrderFormSteps } from '@/components/orderform/OrderFormSteps';

const phoneRegex = /^((\+91)?|91)?[6-9][0-9]{9}$/;
const pinCodeRegex = /^[1-9][0-9]{5}$/;

// Dynamically generate all garment types from measurement2.js
const allGarmentTypes = Array.from(
  new Set(measurementData.measurement_new.map((form: any) => form.category))
) as [string, ...string[]];

export default function OrderFormPage() {
      return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <OrderFormProvider>
        <OrderFormSteps />
      </OrderFormProvider>
    </main>
  );
}