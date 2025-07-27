import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  User,
  Phone, 
  Mail, 
  MapPin, 
  MessageCircle, 
  ArrowRight,
  Info
} from "lucide-react";
import React from "react";

interface CustomerInfoFormProps {
  form: any;
  onSubmit: (data: any) => void;
  loading?: boolean;
  error?: string | null;
}

export const CustomerInfoForm: React.FC<CustomerInfoFormProps> = ({ 
  form, 
  onSubmit, 
  loading, 
  error 
}) => {
  const isFormValid = form.formState.isValid;
  const isDirty = form.formState.isDirty;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="text-xs px-2 py-1 mb-2">
            <Info className="h-3 w-3" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Required Fields Notice */}
        <Alert className="bg-blue-50 border-blue-200 text-xs px-2 py-1 mb-2">
          <Info className="h-3 w-3 text-blue-600" />
          <AlertDescription className="text-blue-800 flex items-center gap-2">
            Fields marked with <span className="text-red-500 font-medium">*</span> are required
          </AlertDescription>
        </Alert>

        {/* Full Name Field */}
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-600" />
                Full Name <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter your full name" 
                  {...field} 
                  autoComplete="name"
                  autoFocus
                  className="h-10"
                />
              </FormControl>
              <FormDescription>
                Enter your complete name as it appears on official documents
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Contact Number Field */}
        <FormField
          control={form.control}
          name="contactNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-600" />
                Contact Number <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter your contact number" 
                  {...field} 
                  autoComplete="tel"
                  className="h-10"
                />
              </FormControl>
              <FormDescription>
                Enter your primary contact number
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* WhatsApp Checkbox */}
        <FormField
          control={form.control}
          name="sameForWhatsapp"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-2 space-y-0 rounded-md border p-2 bg-gray-50">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="flex items-center gap-2 text-xs font-medium">
                  <MessageCircle className="h-4 w-4 text-green-600" />
                  Same number for WhatsApp
                </FormLabel>
                <FormDescription className="text-xs text-gray-600">
                  We'll use your contact number for WhatsApp communication
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <Separator />

        {/* Email Field */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-600" />
                Email Address
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter your email address" 
                  {...field} 
                  type="email"
                  autoComplete="email"
                  className="h-10"
                />
              </FormControl>
              <FormDescription>
                Optional: For order updates and receipts
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Address Field */}
        <FormField
          control={form.control}
          name="fullAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-600" />
                Full Address <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter your complete address including street, city, state, and pin code" 
                  {...field} 
                  autoComplete="street-address"
                  className="min-h-[80px] resize-none"
                />
              </FormControl>
              <FormDescription>
                Include street address, city, state, and pin code for accurate delivery
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Form Footer */}
        <CardFooter className="flex flex-col sm:flex-row gap-2 justify-between items-center pt-4 border-t">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Badge variant="outline" className="text-xs">
              Step 1 of 4
            </Badge>
            <span>Customer Information</span>
          </div>
          
          <Button
            type="submit"
            disabled={!isFormValid || loading || !isDirty}
            className="w-full sm:w-auto px-6 py-2 h-10 font-semibold shadow-md transition-all duration-200"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                Next Step
                <ArrowRight className="h-4 w-4" />
              </div>
            )}
          </Button>
        </CardFooter>
      </form>
    </Form>
  );
}; 