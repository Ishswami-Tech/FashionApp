import React from "react";
import { useOrderFormContext } from "@/context/OrderFormContext";
import { CustomerInfoForm } from "./CustomerInfoForm";
import { OrderDetailsForm } from "./OrderDetailsForm";
import { DeliveryPaymentForm } from "./DeliveryPaymentForm";
import { OrderSummaryTable } from "./OrderSummaryTable";
import { GarmentsSummary } from "./GarmentsSummary";
import { formatDisplayDate } from "@/lib/orderUtils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerInfoSchema } from "@/types/orderSchemas";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Separator } from "../ui/separator";
import { Alert, AlertDescription } from "../ui/alert";
import { 
  CheckCircle, 
  ShoppingCart, 
  User, 
  FileText, 
  CreditCard, 
  CheckSquare,
  ArrowRight,
  ArrowLeft,
  Plus,
  Printer,
  Share2,
  Download,
  Home,
  Loader2,
  X,
  Search
} from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "../ui/table";

// Enhanced Stepper Component with better accessibility
function EnhancedStepper() {
  const { step, stepLabels, garments, setStep } = useOrderFormContext();
  
  const steps = [
    { id: 1, label: "Customer Info", icon: User, description: "Enter your details" },
    { id: 2, label: "Order Details", icon: FileText, description: "Select garments & measurements" },
    { id: 3, label: "Payment", icon: CreditCard, description: "Delivery & payment" },
    { id: 4, label: "Confirmation", icon: CheckSquare, description: "Review & confirm" },
  ];

  return (
    <Card className="w-full max-w-[576px] mx-auto mb-4 shadow border-0 bg-white/90 backdrop-blur-sm">
      <CardContent className="p-2">
        {/* Progress Bar */}
        <div className="mb-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-gray-600">
              Step {step} of {steps.length}
            </span>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5">
              {Math.round((step / steps.length) * 100)}% Complete
            </Badge>
          </div>
          <Progress value={(step / steps.length) * 100} className="h-1" />
        </div>

        {/* Stepper */}
        <nav aria-label="Order form progress">
          <ol className="flex items-center justify-between gap-x-1">
            {steps.map((stepItem, index) => {
              const Icon = stepItem.icon;
              const isActive = step === stepItem.id;
              const isCompleted = step > stepItem.id;
              const isClickable = step > stepItem.id;

              return (
                <li key={stepItem.id} className="flex-1 relative">
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => isClickable && setStep(stepItem.id)}
                      disabled={!isClickable}
                      className={`
                        group relative flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-200
                        ${isActive 
                          ? 'border-blue-600 bg-blue-600 text-white shadow scale-105' 
                          : isCompleted 
                          ? 'border-green-500 bg-green-500 text-white cursor-pointer hover:bg-green-600' 
                          : 'border-gray-300 bg-white text-gray-400 cursor-not-allowed'
                        }
                      `}
                      aria-current={isActive ? 'step' : undefined}
                      aria-label={`Go to step ${stepItem.id}: ${stepItem.label}`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </button>
                    <div className="mt-1 text-center">
                      <p className={`text-xs font-medium transition-colors ${
                        isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {stepItem.label}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5 hidden sm:block">
                        {stepItem.description}
                      </p>
                    </div>
                  </div>
                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className="absolute top-4 left-1/2 w-full h-0.5 bg-gray-200 -z-10" />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Cart Summary */}
        <div className="mt-2 flex justify-between items-center text-xs">
          <div className="flex items-center gap-1">
            <ShoppingCart className="h-4 w-4 text-gray-600" />
            <span>Items in cart:</span>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-2 py-0.5 text-xs">
              {garments.length} {garments.length === 1 ? 'item' : 'items'}
            </Badge>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setStep(2)}
            className="flex items-center gap-1 px-2 py-1 text-xs h-7"
            disabled={garments.length === 0}
          >
            <ShoppingCart className="h-4 w-4" />
            View Cart
            {garments.length > 0 && (
              <Badge className="ml-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.5">
                {garments.length}
              </Badge>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Step 1: Customer Info with enhanced UI
const CustomerInfoStep = () => {
  const { 
    customerData, 
    setCustomerData, 
    setStep, 
    submitLoading, 
    submitError 
  } = useOrderFormContext();
  
  const form = useForm({
    resolver: zodResolver(customerInfoSchema),
    mode: "onChange",
    defaultValues: customerData || {
      fullName: "",
      contactNumber: "",
      sameForWhatsapp: false,
      email: "",
      fullAddress: "",
    },
  });

  // Only reset form when customerData changes
  React.useEffect(() => {
    if (customerData) {
      const defaultValues = {
        fullName: customerData.fullName || "",
        contactNumber: customerData.contactNumber || "",
        sameForWhatsapp: customerData.sameForWhatsapp || false,
        email: customerData.email || "",
        fullAddress: customerData.fullAddress || "",
      };
      form.reset(defaultValues);
    }
  }, [customerData]); // Remove form from dependencies

  const handleSubmit = (data: any) => {
    setCustomerData(data);
    setStep(2);
    toast.success("Customer information saved successfully!", {
      description: "Proceeding to order details...",
      duration: 3000,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-4 px-2">
      <Card className="w-full max-w-[576px] shadow-xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center pb-3">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3">
            <User className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-base font-bold text-gray-900">
            Customer Information
          </CardTitle>
          <p className="text-gray-600 mt-1">
            Please provide your details to proceed with the order
          </p>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {submitError && (
            <Alert variant="destructive">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}
          
          <CustomerInfoForm
            form={form}
            onSubmit={handleSubmit}
            loading={submitLoading}
            error={submitError}
          />
        </CardContent>
      </Card>
    </div>
  );
};

// Step 2: Order Details with enhanced UI
const OrderDetailsStep = () => {
  const {
    orderForm,
    measurementForm,
    garmentOptions,
    garmentType,
    setGarmentType,
    selectedVariant,
    setSelectedVariant,
    variantOptions,
    measurementFields,
    unit,
    handleUnitToggle,
    designs,
    setDesigns,
    quantity,
    setQuantity,
    handleAddGarment,
    handleBack,
    editingIndex,
    showGarmentForm,
    garments,
    handleEditGarment,
    handleRemoveGarment,
    garmentsSummaryRef,
    setShowGarmentForm,
    setStep,
    orderFormReset,
    measurementFormReset,
    setEditingIndex,
  } = useOrderFormContext();

  // Memoize the submit handler to prevent recreation on every render
  const handleGarmentSubmit = React.useCallback(() => {
    if (!garmentType || !selectedVariant) {
      toast.error("Please select a garment type and variant.");
      return;
    }
    if (quantity <= 0) {
      toast.error("Quantity must be at least 1.");
      return;
    }
    handleAddGarment();
    toast.success("Garment added to order!", {
      description: `Added ${garmentType} (${selectedVariant})`,
      duration: 3000,
    });
  }, [garmentType, selectedVariant, quantity, handleAddGarment]);

  return (
    <div className="min-h-screen py-4 px-2">
      <div className="w-full max-w-[576px] mx-auto">
        {showGarmentForm ? (
          <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center pb-3">
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle className="text-base font-bold text-gray-900">
                {editingIndex !== null ? 'Edit Garment' : 'Add New Garment'}
              </CardTitle>
              <p className="text-gray-600 mt-1">
                Select garment type, add measurements, and upload design references
              </p>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <OrderDetailsForm
                orderForm={orderForm}
                measurementForm={measurementForm}
                garmentOptions={garmentOptions || []}
                garmentType={garmentType}
                setGarmentType={setGarmentType}
                selectedVariant={selectedVariant}
                setSelectedVariant={setSelectedVariant}
                variantOptions={variantOptions || []}
                measurementFields={measurementFields || []}
                unit={unit}
                handleUnitToggle={handleUnitToggle}
                designs={designs || []}
                setDesigns={setDesigns}
                quantity={quantity}
                setQuantity={setQuantity}
                handleAddGarment={handleGarmentSubmit}
                handleBack={handleBack}
                editingIndex={editingIndex}
                showGarmentForm={showGarmentForm}
              />
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center pb-3">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3">
                <ShoppingCart className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-base font-bold text-gray-900">
                Order Summary
              </CardTitle>
              <p className="text-gray-600 mt-1">
                Review your selected garments and measurements
              </p>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <GarmentsSummary
                garments={garments}
                onEdit={handleEditGarment}
                onRemove={handleRemoveGarment}
                summaryRef={garmentsSummaryRef}
              />
              
              <Separator />
              
              <div className="flex flex-col sm:flex-row gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    orderFormReset();
                    measurementFormReset();
                    setSelectedVariant(undefined);
                    setEditingIndex(null);
                    setShowGarmentForm(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Another Garment
                </Button>
                
                <Button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={garments.length === 0}
                  className="flex items-center gap-2"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

// Step 3: Delivery & Payment with enhanced UI
const DeliveryPaymentStep = () => {
  const {
    deliveryForm,
    handleDeliverySubmit,
    submitLoading,
    submitError,
    setStep,
    garments,
    customerData,
    progressStates,
  } = useOrderFormContext();

  const totalAmount = React.useMemo(() => 
    garments.reduce((sum: number, g: any) => 
      sum + (g.designs?.reduce((dSum: number, d: any) => dSum + (Number(d.amount) || 0), 0) || 0), 0
    ), [garments]
  );

  // Memoize the submit handler
  const onSubmit = React.useCallback(async (data: any) => {
    try {
      if (!deliveryForm.formState.isValid) {
        toast.error("Please fill in all required fields");
        return;
      }

      if (data.payment === 'advance' && (!data.advanceAmount || Number(data.advanceAmount) <= 0)) {
        toast.error("Please enter a valid advance amount");
        return;
      }

      if (!data.deliveryDate) {
        toast.error("Please select a delivery date");
        return;
      }

      await handleDeliverySubmit(data);
      
      // Success toast will be shown after the submission is complete
      toast.success("Order submitted successfully!", {
        description: "Processing your order...",
        duration: 3000,
      });
    } catch (error) {
      console.error('Order submission error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to submit order");
    }
  }, [handleDeliverySubmit, deliveryForm.formState.isValid]);

  return (
    <div className="min-h-screen py-4 px-2">
      <div className="w-full max-w-[576px] mx-auto">
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-3">
            <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-3">
              <FileText className="h-8 w-8 text-orange-600" />
            </div>
            <CardTitle className="text-base font-bold text-gray-900">
              Order Summary & Payment
            </CardTitle>
            <p className="text-gray-600 mt-1">
              Review your order and complete payment & delivery details
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Customer Info */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <User className="h-4 w-4 text-gray-600" />
                Customer Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-sm">
                <div><span className="font-medium">Name:</span> {customerData?.fullName}</div>
                <div><span className="font-medium">Contact:</span> {customerData?.contactNumber}</div>
                <div className="md:col-span-2"><span className="font-medium">Address:</span> {customerData?.fullAddress}</div>
                {customerData?.email && <div><span className="font-medium">Email:</span> {customerData.email}</div>}
              </div>
            </div>
            <Separator />
            {/* Garments Summary */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-gray-600" />
                Garments ({garments.length})
              </h3>
              <div className="space-y-1">
                {garments.map((garment: any, idx: number) => {
                  const garmentTotal = garment.designs?.reduce((sum: number, design: any) => sum + (Number(design.amount) || 0), 0) || 0;
                  return (
                    <div key={idx} className="flex justify-between items-center p-1 bg-white rounded border">
                      <div>
                        <span className="font-medium">{garment.orderType}</span>
                        <span className="text-gray-500 ml-1">({garment.variant})</span>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        ₹{garmentTotal.toFixed(2)}
                      </Badge>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between items-center">
                <span className="font-semibold text-gray-900">Total Amount:</span>
                <span className="text-base font-bold text-blue-600">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
            <Separator />
            {/* Error Alert */}
            {submitError && (
              <Alert variant="destructive">
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}
            {/* Delivery & Payment Form */}
            <DeliveryPaymentForm
              deliveryForm={deliveryForm}
              totalAmount={totalAmount}
              onSubmit={onSubmit}
              loading={submitLoading}
              error={submitError}
            />
            {/* Beautiful Loading Overlay */}
            {submitLoading && (
              <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
                <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4">
                  <div className="text-center space-y-4">
                    {/* Animated Spinner */}
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-pulse"></div>
                      <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="w-8 h-8 bg-blue-600 rounded-full animate-ping opacity-75"></div>
                      </div>
                    </div>
                    
                    {/* Loading Text */}
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-gray-900">Processing Your Order</h3>
                      <p className="text-sm text-gray-600">Please wait while we submit your order...</p>
                    </div>
                    
                    {/* Progress Steps */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`${progressStates.orderData === 'completed' ? 'text-green-600 font-medium' : progressStates.orderData === 'processing' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                          Processing order data...
                        </span>
                        {progressStates.orderData === 'completed' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : progressStates.orderData === 'processing' ? (
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                        ) : (
                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className={`${progressStates.fileUpload === 'completed' ? 'text-green-600 font-medium' : progressStates.fileUpload === 'processing' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                          Uploading files to cloud...
                        </span>
                        {progressStates.fileUpload === 'completed' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : progressStates.fileUpload === 'processing' ? (
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                        ) : (
                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className={`${progressStates.pdfGeneration === 'completed' ? 'text-green-600 font-medium' : progressStates.pdfGeneration === 'processing' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                          Generating invoices...
                        </span>
                        {progressStates.pdfGeneration === 'completed' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : progressStates.pdfGeneration === 'processing' ? (
                          <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
                        ) : (
                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className={`${progressStates.whatsapp === 'completed' ? 'text-green-600 font-medium' : progressStates.whatsapp === 'processing' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                          Sending WhatsApp confirmation...
                        </span>
                        {progressStates.whatsapp === 'completed' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : progressStates.whatsapp === 'processing' ? (
                          <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                        ) : (
                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Back Button */}
            <div className="flex justify-end mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(2)}
                className="flex items-center gap-2"
                disabled={submitLoading}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Enhanced OrderConfirmationStep
const OrderConfirmationStep = () => {
  const {
    submittedOrder,
    orderOid,
    orderDate,
    customerData,
    garments,
    deliveryForm,
    handleStartNewOrder,
    setStep,
  } = useOrderFormContext();

  const [modalImage, setModalImage] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<'summary' | 'details'>('summary');
  // Simplified invoice status - PDFs are always ready on-demand
  const invoiceStatus = {
    customerInvoiceUrl: `/api/proxy-pdf?type=customer&oid=${orderOid}`,
    tailorInvoiceUrl: `/api/proxy-pdf?type=tailor&oid=${orderOid}`,
    pdfsGenerated: true,
    checking: false
  };

  // Use submitted order data as primary source, with fallbacks to context data
  const displayCustomerData = submittedOrder || customerData;
  const displayGarments = submittedOrder?.garments || garments;
  const displayDeliveryData = submittedOrder || deliveryForm?.getValues();
  
  const totalAmount = displayGarments.reduce((sum: number, g: any) => 
    sum + (g.designs?.reduce((dSum: number, d: any) => dSum + (Number(d.amount) || 0), 0) || 0), 0
  );

  if (!submittedOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-[576px] shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="text-center p-8">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <CheckSquare className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-base font-bold text-red-600 mb-2">
              Order Not Found
            </CardTitle>
            <p className="text-gray-600 mb-6">No order confirmation data available.</p>
            <Button onClick={handleStartNewOrder} className="w-full">
              Start New Order
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if PDFs are already generated (no background generation needed)
  React.useEffect(() => {
    if (orderOid && submittedOrder) {
      console.log('[OrderFormSteps] Order confirmation page loaded, PDFs should be ready from order processing');
      
      // Check if PDFs are already generated
      if (submittedOrder.pdfsGenerated) {
        console.log('[OrderFormSteps] PDFs already generated during order processing');
      } else {
        console.log('[OrderFormSteps] PDFs not found, will generate on-demand if needed');
      }
    }
  }, [orderOid, submittedOrder]);

    // Smart PDF access utility - use existing PDFs when available
  const generatePDF = async (type: 'customer' | 'tailor', action: 'print' | 'download') => {
    if (!orderOid || !submittedOrder) {
      toast.error('Order data not available for PDF access');
      return;
    }
    
    // Check if PDF is already generated
    const pdfUrl = type === 'customer' ? submittedOrder.customerInvoiceUrl : submittedOrder.tailorInvoiceUrl;
    
    if (pdfUrl && submittedOrder.pdfsGenerated) {
      console.log(`[OrderFormSteps] Using existing ${type} PDF from Cloudinary:`, pdfUrl);
      
      // Show loading state
      toast.loading(`Opening ${type} PDF...`, { id: `pdf-${type}-${action}` });
      
      try {
        // Fetch existing PDF from Cloudinary
        const response = await fetch(pdfUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status}`);
        }
        
        const pdfBlob = await response.blob();
        
        if (pdfBlob.size === 0) {
          throw new Error('PDF is empty');
        }
        
        console.log(`[OrderFormSteps] Existing PDF fetched successfully, size: ${pdfBlob.size} bytes`);
        
        // Dismiss loading toast
        toast.dismiss(`pdf-${type}-${action}`);
        
        if (action === 'print') {
          // Create object URL and open in new window for printing
          const objectUrl = URL.createObjectURL(pdfBlob);
          const win = window.open(objectUrl, '_blank');
          
          if (win) {
            // Wait for PDF to load then print
            win.onload = () => {
              setTimeout(() => {
                win.print();
                // Clean up object URL after printing
                setTimeout(() => {
                  URL.revokeObjectURL(objectUrl);
                }, 2000);
              }, 1000);
            };
          } else {
            // Fallback: download if popup blocked
            const link = document.createElement('a');
            link.href = objectUrl;
            link.download = `${type}_invoice_${orderOid}.pdf`;
            link.click();
            setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
          }
        } else if (action === 'download') {
          // Create download link
          const objectUrl = URL.createObjectURL(pdfBlob);
          const link = document.createElement('a');
          link.href = objectUrl;
          link.download = `${type}_invoice_${orderOid}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clean up
          setTimeout(() => {
            URL.revokeObjectURL(objectUrl);
          }, 1000);
        }
        
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} PDF ${action === 'print' ? 'opened' : 'downloaded'} successfully!`);
        return;
        
      } catch (error) {
        console.error(`[OrderFormSteps] Failed to fetch existing ${type} PDF:`, error);
        toast.dismiss(`pdf-${type}-${action}`);
        // Fall through to on-demand generation
      }
    }
    
    // Fallback: Generate PDF on-demand if not available
    console.log(`[OrderFormSteps] Generating ${type} PDF on-demand for order ${orderOid}`);
    
    // Show loading state
    toast.loading(`Generating ${type} PDF...`, { id: `pdf-${type}-${action}` });
    
    try {
      const url = `/api/proxy-pdf?type=${type}&oid=${orderOid}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order: submittedOrder }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`PDF generation failed: ${response.status} - ${errorText}`);
      }
      
      // Get the PDF blob
      const pdfBlob = await response.blob();
      
      if (pdfBlob.size === 0) {
        throw new Error('Generated PDF is empty');
      }
      
      console.log(`[OrderFormSteps] PDF generated successfully, size: ${pdfBlob.size} bytes`);
      
      // Dismiss loading toast
      toast.dismiss(`pdf-${type}-${action}`);
      
      if (action === 'print') {
        // Create object URL and open in new window for printing
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const win = window.open(pdfUrl, '_blank');
        
        if (win) {
          // Wait for PDF to load then print
          win.onload = () => {
            setTimeout(() => {
              win.print();
              // Clean up object URL after printing
              setTimeout(() => {
                URL.revokeObjectURL(pdfUrl);
              }, 2000);
            }, 1000);
          };
        } else {
          // Fallback: download if popup blocked
          const link = document.createElement('a');
          link.href = pdfUrl;
          link.download = `${type}_invoice_${orderOid}.pdf`;
          link.click();
          setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
        }
      } else if (action === 'download') {
        // Create download link
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `${type}_invoice_${orderOid}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        setTimeout(() => {
          URL.revokeObjectURL(pdfUrl);
        }, 1000);
      }
      
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} PDF ${action === 'print' ? 'opened' : 'downloaded'} successfully!`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.dismiss(`pdf-${type}-${action}`);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to ${action} PDF: ${errorMessage}`);
    }
  };

  const handlePrint = async (type: 'customer' | 'tailor') => {
    await generatePDF(type, 'print');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My Sony Fashion Order',
        text: `Check out my fashion order! Order ID: ${orderOid}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen py-4 px-2">
      <div className="w-full max-w-[576px] mx-auto">
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-3">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-xl font-bold text-gray-900 mb-2">
              Order Confirmed!
            </CardTitle>
            <p className="text-gray-600">
              Thank you for choosing Sony Fashion. We'll start working on your order right away.
            </p>
            <div className="mt-4 space-y-1">
              <p className="text-sm text-gray-500">
                Order ID: <span className="font-mono text-blue-600">{orderOid}</span>
              </p>
              {orderDate && (
                <p className="text-sm text-gray-500">
                  Date: {orderDate}
                </p>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Tab Navigation */}
            <div className="flex rounded-lg bg-gray-100 p-1">
              <button
                onClick={() => setActiveTab('summary')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'summary'
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Order Summary
              </button>
              <button
                onClick={() => setActiveTab('details')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'details'
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Detailed View
              </button>
            </div>

            {activeTab === 'summary' ? (
              <>
                {/* Customer Details Card */}
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-600" />
                        Customer Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm">
                      <div><span className="font-medium">Name:</span> {displayCustomerData?.fullName || '-'}</div>
                      <div><span className="font-medium">Contact:</span> {displayCustomerData?.contactNumber || '-'}</div>
                      <div><span className="font-medium">Address:</span> {displayCustomerData?.fullAddress || '-'}</div>
                    {displayCustomerData?.email && <div><span className="font-medium">Email:</span> {displayCustomerData.email}</div>}
                    </CardContent>
                  </Card>

                {/* Detailed Order Summary Table */}
                <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 text-purple-600" />
                      Detailed Order Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-purple-100/50">
                            <TableHead className="font-semibold text-purple-900">Item</TableHead>
                            <TableHead className="font-semibold text-purple-900">Variant</TableHead>
                            <TableHead className="font-semibold text-purple-900">Qty</TableHead>
                            <TableHead className="font-semibold text-purple-900">Designs</TableHead>
                            <TableHead className="font-semibold text-purple-900 text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {displayGarments.map((g: any, idx: number) => {
                            const garmentTotal = g.designs?.reduce((sum: number, design: any) => sum + (Number(design.amount) || 0), 0) || 0;
                            return (
                              <React.Fragment key={idx}>
                                <TableRow className="bg-white/60">
                                  <TableCell className="font-medium text-gray-900">
                                    {g.orderType}
                                  </TableCell>
                                  <TableCell className="text-gray-600">
                                    {g.variant}
                                  </TableCell>
                                  <TableCell className="text-gray-600">
                                    {g.quantity}
                                  </TableCell>
                                  <TableCell className="text-gray-600">
                                    {g.designs?.length || 0} design{g.designs?.length !== 1 ? 's' : ''}
                                  </TableCell>
                                  <TableCell className="text-right font-medium text-green-600">
                                    ₹{garmentTotal.toFixed(2)}
                                  </TableCell>
                                </TableRow>
                                {/* Design Details Sub-rows */}
                                {g.designs && g.designs.map((design: any, designIdx: number) => (
                                  <TableRow key={`${idx}-${designIdx}`} className="bg-gray-50/50">
                                    <TableCell className="pl-8 text-sm text-gray-600">
                                      • {design.name}
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-500">
                                      Design #{designIdx + 1}
                                    </TableCell>
                                    <TableCell></TableCell>
                                    <TableCell></TableCell>
                                    <TableCell className="text-right text-sm text-gray-600">
                                      ₹{Number(design.amount).toFixed(2)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </React.Fragment>
                            );
                          })}
                        </TableBody>
                        <TableFooter>
                          <TableRow className="bg-green-100/50 border-t-2 border-green-200">
                            <TableCell colSpan={4} className="text-right font-bold text-green-900">
                              Total Amount:
                            </TableCell>
                            <TableCell className="text-right font-bold text-green-900 text-lg">
                              ₹{totalAmount.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        </TableFooter>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment & Delivery Details Card */}
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-green-600" />
                      Payment & Delivery Details
                      </CardTitle>
                    </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Payment Section */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-green-800 border-b border-green-200 pb-1">Payment Information</h4>
                        <div className="space-y-2">
                                                  <div className="flex justify-between items-center">
                          <span className="font-medium text-sm">Payment Method:</span>
                          <Badge variant="outline" className="bg-green-50 text-green-700 capitalize text-xs">
                            {displayDeliveryData?.payment || deliveryForm?.watch('payment') || 'Not specified'}
                          </Badge>
                      </div>
                      {(displayDeliveryData?.payment === 'advance' || deliveryForm?.watch('payment') === 'advance') && (
                        <>
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-sm">Advance Amount:</span>
                                <span className="text-green-600 font-medium">
                                  ₹{Number(displayDeliveryData?.advanceAmount || deliveryForm?.watch('advanceAmount') || 0).toFixed(2)}
                                </span>
                          </div>
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-sm">Balance Due:</span>
                                <span className="text-rose-600 font-bold">
                              ₹{(totalAmount - Number(displayDeliveryData?.advanceAmount || deliveryForm?.watch('advanceAmount') || 0)).toFixed(2)}
                            </span>
                          </div>
                        </>
                      )}
                        </div>
                </div>

                      {/* Delivery Section */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-green-800 border-b border-green-200 pb-1">Delivery Information</h4>
                        <div className="space-y-2">
                          {(displayDeliveryData?.deliveryDate || deliveryForm?.watch('deliveryDate')) && (
                        <div className="flex justify-between items-center">
                              <span className="font-medium text-sm">Delivery Date:</span>
                              <span className="text-gray-600 text-sm">
                                {formatDisplayDate(displayDeliveryData?.deliveryDate || deliveryForm?.watch('deliveryDate'))}
                              </span>
                          </div>
                          )}
                          {(displayDeliveryData?.urgency || deliveryForm?.watch('urgency')) && (
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-sm">Urgency:</span>
                              <Badge variant="outline" className={`text-xs ${
                                (displayDeliveryData?.urgency || deliveryForm?.watch('urgency')) === 'urgent' 
                                  ? 'bg-red-50 text-red-700 border-red-200' 
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              } capitalize`}>
                                {displayDeliveryData?.urgency || deliveryForm?.watch('urgency')}
                          </Badge>
                        </div>
                          )}
                          {(displayDeliveryData?.specialInstructions || deliveryForm?.watch('specialInstructions')) && (
                            <div className="flex justify-between items-start">
                              <span className="font-medium text-sm">Special Instructions:</span>
                              <span className="text-gray-600 text-sm text-right max-w-[200px]">
                                {displayDeliveryData?.specialInstructions || deliveryForm?.watch('specialInstructions')}
                              </span>
                      </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                {/* Detailed View */}
                <div className="space-y-4">
                  {displayGarments.map((g: any, idx: number) => (
                    <Card key={idx} className="bg-gradient-to-br from-rose-50 to-pink-50 border-rose-100">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-rose-600" />
                            {g.orderType} ({g.variant})
                          </span>
                          <Badge variant="outline" className="bg-rose-50">
                            Qty: {g.quantity}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Measurements */}
                        {g.measurements && Object.keys(g.measurements).length > 0 && (
                          <div className="bg-white/60 rounded-lg p-3">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Measurements</h4>
                            <div className="grid grid-cols-3 gap-2">
                              {Object.entries(g.measurements).map(([key, value]) => (
                                <div key={key} className="bg-white rounded p-2 text-xs">
                                  <span className="block font-medium text-gray-700">{key}</span>
                                  <span className="text-gray-600">{value as string}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Designs */}
                        {g.designs && g.designs.length > 0 && (
                          <div className="space-y-3">
                            {g.designs.map((d: any, dIdx: number) => (
                              <div key={dIdx} className="bg-white/60 rounded-lg p-3">
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="text-sm font-medium text-rose-600">
                                    Design #{dIdx + 1}: {d.name}
                                  </h4>
                                  <span className="text-sm font-medium text-green-600">
                                    ₹{Number(d.amount).toFixed(2)}
                                  </span>
                                </div>
                                {d.designDescription && (
                                  <p className="text-xs text-gray-600 mb-2">{d.designDescription}</p>
                                )}
                                <div className="flex flex-wrap gap-2">
                                  {/* Design Reference Images */}
                                  {d.designReferencePreviews && d.designReferencePreviews.map((img: string, imgIdx: number) => (
                                    <div key={imgIdx} className="relative group">
                                      <img
                                        src={img}
                                        alt={`Design Ref ${imgIdx + 1}`}
                                        className="w-16 h-16 object-cover rounded-lg cursor-pointer border transition-transform duration-200 group-hover:scale-105"
                                        onClick={() => setModalImage(img)}
                                      />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                                        <Search className="w-4 h-4 text-white" />
                                      </div>
                                    </div>
                                  ))}
                                  {/* Canvas Image */}
                                  {d.canvasImage && (
                                    <div className="relative group">
                                      <img
                                        src={d.canvasImage}
                                        alt="Canvas Drawing"
                                        className="w-16 h-16 object-contain rounded-lg cursor-pointer border transition-transform duration-200 group-hover:scale-105"
                                        onClick={() => setModalImage(d.canvasImage)}
                                      />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                                        <Search className="w-4 h-4 text-white" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {/* Invoice Status */}
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Printer className="h-5 w-5 text-amber-600" />
                  Invoice Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">PDF Generation:</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Ready
                  </Badge>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  ✅ PDFs are generated during order processing! Click print to view your invoice instantly.
                </p>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 pt-4">
              <Button
                onClick={() => handlePrint('customer')}
                variant="outline"
                className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700"
              >
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline">Customer</span> Copy
              </Button>
              
              <Button
                onClick={() => handlePrint('tailor')}
                variant="outline"
                className="flex items-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700"
              >
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline">Tailor</span> Copy
              </Button>
              
              <Button
                onClick={handleShare}
                variant="outline"
                className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              
              <Button
                onClick={() => generatePDF('customer', 'download')}
                variant="outline"
                className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              
              <Button
                onClick={handleStartNewOrder}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white"
              >
                <Plus className="h-4 w-4" />
                New Order
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Image Preview Modal */}
      {modalImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setModalImage(null)}
        >
          <div className="relative max-w-[90vw] max-h-[80vh]">
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-white text-gray-600 hover:text-gray-900"
              onClick={() => setModalImage(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            <img 
              src={modalImage} 
              alt="Preview" 
              className="rounded-lg shadow-2xl"
              style={{ maxHeight: '80vh', maxWidth: '90vw', objectFit: 'contain' }} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export function OrderFormSteps() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <EnhancedStepper />
      
      {(() => {
        const { step } = useOrderFormContext();
        switch (step) {
          case 1:
            return <CustomerInfoStep />;
          case 2:
            return <OrderDetailsStep />;
          case 3:
            return <DeliveryPaymentStep />;
          case 4:
            return <OrderConfirmationStep />;
          default:
            return null;
        }
      })()}
    </div>
  );
} 