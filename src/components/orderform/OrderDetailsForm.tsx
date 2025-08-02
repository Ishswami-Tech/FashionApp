import React, { useEffect } from "react";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { CardFooter } from "@/components/ui/card";
import { CanvasPaint } from "@/components/CanvasPaint";

interface OrderDetailsFormProps {
  orderForm: any;
  measurementForm: any;
  garmentOptions: { value: string; label: string }[];
  garmentType: string | undefined;
  setGarmentType: (v: string) => void;
  selectedVariant: string | undefined;
  setSelectedVariant: (v: string | undefined) => void;
  variantOptions: { value: string; label: string }[];
  measurementFields: string[];
  unit: "in" | "cm";
  handleUnitToggle: (u: "in" | "cm") => void;
  designs: any[];
  setDesigns: React.Dispatch<React.SetStateAction<any[]>>;
  quantity: number;
  setQuantity: (q: number) => void;
  handleAddGarment: () => void;
  handleBack: () => void;
  editingIndex: number | null;
  showGarmentForm: boolean;
}

export const OrderDetailsForm: React.FC<OrderDetailsFormProps> = ({
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
}) => {
  // Ensure designs array matches quantity
  useEffect(() => {
    if (quantity > 0) {
      setDesigns((prev) => {
        const arr = [...prev];
        if (arr.length < quantity) {
          // Add empty design objects
          for (let i = arr.length; i < quantity; i++) {
            arr.push({
              name: "",
              amount: "",
              designReference: [],
              designReferencePreviews: [],
              clothImages: [],
              clothImagePreviews: [],
              designDescription: "",
              canvasImage: "",
              canvasJson: undefined,
            });
          }
        } else if (arr.length > quantity) {
          // Remove extra designs
          arr.length = quantity;
        }
        return arr;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quantity]);

  return (
    <Form {...orderForm}>
      <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
        {/* Order Details fields */}
        <div className="space-y-4">
          <div className="flex flex-row flex-wrap self-center justify-start sm:flex-row gap-4 p-3">
            <FormField
              control={orderForm.control}
              name="orderType"
              render={({ field }) => (
                <FormItem className="flex-1 self-center">
                  <FormLabel className="text-sm font-medium">
                    Garment Category *
                  </FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(val) => {
                        field.onChange(val);
                        setGarmentType(val);
                      }}
                      value={field.value}
                    >
                      <SelectTrigger className="">
                        <SelectValue placeholder="Select garment category" />
                      </SelectTrigger>
                      <SelectContent>
                        {garmentOptions.map((opt) => (
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
            {/* Variant Selection */}
            {garmentType && (
              <FormItem className="flex-1">
                <FormLabel className="text-sm font-medium">Variant *</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={setSelectedVariant}
                    value={selectedVariant}
                  >
                    <SelectTrigger className="">
                      <SelectValue placeholder="Select variant" />
                    </SelectTrigger>
                    <SelectContent>
                      {variantOptions.map((opt) => (
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
            <FormField
              control={orderForm.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Quantity *
                  </FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        {...field}
                        value={field.value}
                        onChange={(e) => {
                          field.onChange(e);
                          setQuantity(Number(e.target.value));
                        }}
                        className="w-full max-w-[100px]"
                      />
                      <span className="text-sm text-gray-500 w-fit-content">
                        (Max: 10)
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        {/* Measurements & Design fields */}
        {!garmentType ? (
          <div className="p-4 text-center text-gray-500">
            Please select a Garment Category to continue.
          </div>
        ) : (
          <>
            <div className="mt-6 space-y-4">
              {/* Measurement Unit toggle and measurement fields here */}
              {/* Measurement Unit toggle */}
              <div className="flex flex-wrap items-center gap-2 p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="font-medium text-sm text-gray-700">
                  Measurement Unit:
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant={unit === "in" ? "default" : "outline"}
                  onClick={() => handleUnitToggle("in")}
                  className="h-8 px-3"
                >
                  Inches
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={unit === "cm" ? "default" : "outline"}
                  onClick={() => handleUnitToggle("cm")}
                  className="h-8 px-3"
                >
                  Centimeters
                </Button>
              </div>
              {/* Measurement Fields */}
              {measurementFields.length === 0 ? (
                <div className="text-gray-500 italic p-3 sm:p-4 bg-white border border-gray-200 rounded-lg">
                  No measurements required for this garment type.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 bg-white border border-gray-200 rounded-lg">
                  {measurementFields.map((fieldKey: string) => (
                    <FormField
                      key={fieldKey}
                      control={measurementForm.control}
                      name={`measurements.${fieldKey}`}
                      render={({ field }) => (
                        <FormItem className="gap-1">
                          <FormLabel className="text-sm font-medium text-gray-700">
                            {fieldKey
                              .replace(/([A-Z])/g, " $1")
                              .replace(/^./, (s: string) => s.toUpperCase())}
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
                                className="w-full border border-gray-200 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                              />
                              <span className="text-xs font-medium text-gray-500 w-6">
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
            <div className="mt-4 border border-purple-200 rounded-lg">
              {/* Designs for Each Item UI here */}
              <div className="flex items-center p-3 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-200">
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
              <p className="text-sm text-purple-700 p-3 bg-purple-50/50">
                Create {quantity} design{quantity > 1 ? "s" : ""} for your{" "}
                {garmentType.toLowerCase()}. Each design can have its own name,
                reference images, description, and price.
              </p>
              {designs.map((d, idx) => (
                <div key={idx} className="p-3 border-t border-purple-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-purple-900">
                      Design #{idx + 1}
                    </h4>
                    <span className="text-sm text-purple-600">
                      Item {idx + 1} of {quantity}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                  {/* Design Reference Images & Cloth Images */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    {/* Design Reference Images */}
                    <div>
                    <label className="block font-medium mb-1 text-sm text-gray-700">
                      Design Reference Images (max 5)
                    </label>
                    <div className="relative">
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setDesigns((prev) => {
                            const arr = [...prev];
                            arr[idx].designReference = files.slice(0, 5);
                            arr[idx].designReferencePreviews = files
                              .slice(0, 5)
                              .map((file) =>
                                typeof file === "string"
                                  ? file
                                  : URL.createObjectURL(file)
                              );
                            return arr;
                          });
                          e.target.value = ""; // Clear input to allow re-uploading the same file
                        }}
                        className="w-full cursor-pointer"
                        disabled={designs[idx].designReference?.length >= 5}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <span className="text-gray-400 text-sm">🎨</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-gray-500">
                          Design inspiration & style references
                      </p>
                      <span className="text-xs text-blue-600 font-medium">
                        ({designs[idx].designReference?.length || 0}/5)
                      </span>
                    </div>
                      {/* Design Reference Image Previews */}
                    {(designs[idx].designReferencePreviews || []).length > 0 ? (
                      <div className="mt-3">
                        <p className="text-xs text-gray-600 mb-2 font-medium">
                            🎨 Design References:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {(designs[idx].designReferencePreviews || []).map(
                            (url: string, i: number) => (
                              <div key={i} className="relative group">
                                <img
                                  src={url}
                                    alt={`Design Reference ${i + 1}`}
                                    className="w-16 h-16 object-cover border rounded-lg shadow-sm hover:shadow-md transition-shadow"
                                />
                                {/* Remove button */}
                                <button
                                  type="button"
                                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold transition-colors"
                                  onClick={() => {
                                    setDesigns((prev) => {
                                      const arr = [...prev];
                                      arr[idx].designReference = arr[
                                        idx
                                      ].designReference.filter(
                                        (item: any, j: number) => j !== i
                                      );
                                      arr[idx].designReferencePreviews = arr[
                                        idx
                                      ].designReferencePreviews.filter(
                                        (item: any, j: number) => j !== i
                                      );
                                      return arr;
                                    });
                                  }}
                                    aria-label="Remove design reference"
                                >
                                  ×
                                </button>
                                {/* Image number badge */}
                                <div className="absolute bottom-1 left-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
                                  {i + 1}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    ) : (
                        <div className="mt-3 p-2 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <p className="text-xs text-gray-500 text-center">
                            🎨 No design references yet
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Cloth Images */}
                    <div>
                      <label className="block font-medium mb-1 text-sm text-gray-700">
                        Cloth/Fabric Images (max 3)
                      </label>
                      <div className="relative">
                        <Input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            setDesigns((prev) => {
                              const arr = [...prev];
                              arr[idx].clothImages = files.slice(0, 3);
                              arr[idx].clothImagePreviews = files
                                .slice(0, 3)
                                .map((file) =>
                                  typeof file === "string"
                                    ? file
                                    : URL.createObjectURL(file)
                                );
                              return arr;
                            });
                            e.target.value = ""; // Clear input to allow re-uploading the same file
                          }}
                          className="w-full cursor-pointer"
                          disabled={designs[idx].clothImages?.length >= 3}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <span className="text-gray-400 text-sm">🧵</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-500">
                          Fabric samples & material photos
                        </p>
                        <span className="text-xs text-green-600 font-medium">
                          ({designs[idx].clothImages?.length || 0}/3)
                        </span>
                      </div>
                      {/* Cloth Image Previews */}
                      {(designs[idx].clothImagePreviews || []).length > 0 ? (
                        <div className="mt-3">
                          <p className="text-xs text-gray-600 mb-2 font-medium">
                            🧵 Cloth/Fabric Images:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {(designs[idx].clothImagePreviews || []).map(
                              (url: string, i: number) => (
                                <div key={i} className="relative group">
                                  <img
                                    src={url}
                                    alt={`Cloth ${i + 1}`}
                                    className="w-16 h-16 object-cover border rounded-lg shadow-sm hover:shadow-md transition-shadow"
                                  />
                                  {/* Remove button */}
                                  <button
                                    type="button"
                                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold transition-colors"
                                    onClick={() => {
                                      setDesigns((prev) => {
                                        const arr = [...prev];
                                        arr[idx].clothImages = arr[
                                          idx
                                        ].clothImages.filter(
                                          (item: any, j: number) => j !== i
                                        );
                                        arr[idx].clothImagePreviews = arr[
                                          idx
                                        ].clothImagePreviews.filter(
                                          (item: any, j: number) => j !== i
                                        );
                                        return arr;
                                      });
                                    }}
                                    aria-label="Remove cloth image"
                                  >
                                    ×
                                  </button>
                                  {/* Image number badge */}
                                  <div className="absolute bottom-1 left-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
                                    {i + 1}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 p-2 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                          <p className="text-xs text-gray-500 text-center">
                            🧵 No cloth images yet
                        </p>
                      </div>
                    )}
                    </div>
                  </div>
                  <div className="mt-3">
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
                  <div className="mt-3">
                    <label className="block font-medium mb-1 text-sm text-gray-700">
                      Custom Drawing
                    </label>
                    <div
                      className="border border-gray-200 rounded-lg flex flex-col items-center max-w-full"
                      style={{ maxWidth: "500px", margin: "0 auto" }}
                    >
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
                      <p className="text-xs text-gray-500 mt-1 p-2 text-center">
                        Draw or annotate your design here. Click Save to attach
                        it to this design.
                      </p>
                    </div>
                  </div>
                  {designs[idx].canvasImage && (
                    <div className="mt-2">
                      <label className="block text-xs text-gray-500 mb-1">
                        Saved Drawing Preview:
                      </label>
                      <img
                        src={designs[idx].canvasImage}
                        alt="Canvas Drawing Preview"
                        className="border rounded shadow-sm max-w-full h-auto"
                        style={{
                          maxHeight: 150,
                          width: "100%",
                          objectFit: "contain",
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
        <CardFooter className="flex flex-col sm:flex-row gap-3 sm:gap-0 justify-end pt-4 w-full">
          <Button
            type="button"
            onClick={handleAddGarment}
            className="w-full sm:w-auto px-6 py-2 rounded-lg font-semibold shadow-md"
          >
            {editingIndex !== null ? "Update Garment" : "Add Garment to Order"}
          </Button>
        </CardFooter>
      </form>
    </Form>
  );
};
