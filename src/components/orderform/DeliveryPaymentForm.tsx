import React from "react";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DeliveryPaymentFormProps {
  deliveryForm: any;
  totalAmount: number;
  onSubmit: (data: any) => void;
  loading?: boolean;
  error?: string | null;
}

export const DeliveryPaymentForm: React.FC<DeliveryPaymentFormProps> = ({ 
  deliveryForm, 
  totalAmount, 
  onSubmit, 
  loading, 
  error 
}) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = deliveryForm.getValues();
    
    // Convert the date to DD/MM/YYYY format to match API expectations
    if (formData.deliveryDate instanceof Date) {
      formData.deliveryDate = format(formData.deliveryDate, 'dd/MM/yyyy');
    }

    // Ensure advance amount is a number
    if (formData.payment === 'advance') {
      formData.advanceAmount = Number(formData.advanceAmount);
    }

    await onSubmit(formData);
  };

  return (
    <Form {...deliveryForm}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className={loading ? "opacity-50 pointer-events-none" : ""}>
          {/* Payment Details Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={deliveryForm.control}
                name="payment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Preference *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cod">Cash on Delivery/Pickup</SelectItem>
                        <SelectItem value="upi">UPI/Digital Payment</SelectItem>
                        <SelectItem value="bank">Bank Transfer</SelectItem>
                        <SelectItem value="advance">Advance Payment</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {deliveryForm.watch('payment') === 'advance' && (
                <FormField
                  control={deliveryForm.control}
                  name="advanceAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Advance Amount *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={totalAmount}
                          placeholder="Enter advance amount"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Delivery & Urgency Card */}
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Delivery & Urgency</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={deliveryForm.control}
                name="deliveryDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Preferred Delivery Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={deliveryForm.control}
                name="urgency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Urgency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select urgency (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="regular">Regular (7-10 days)</SelectItem>
                        <SelectItem value="priority">Priority (4-6 days)</SelectItem>
                        <SelectItem value="express">Express (2-3 days)</SelectItem>
                      </SelectContent>
                    </Select>
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
                        className="min-h-[80px] resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        {error && <div className="text-red-600 text-sm mt-2">{error}</div>}

        <div className="flex justify-end gap-2">
          <Button
            type="submit"
            disabled={loading || !deliveryForm.formState.isValid}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              "Submit Order"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}; 