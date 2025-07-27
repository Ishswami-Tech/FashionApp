import React, { ForwardedRef } from "react";
import { Button } from "@/components/ui/button";

interface GarmentsSummaryProps {
  garments: any[];
  onEdit: (idx: number) => void;
  onRemove: (idx: number) => void;
  summaryRef?: ForwardedRef<HTMLDivElement>;
}

export const GarmentsSummary: React.FC<GarmentsSummaryProps> = ({ garments, onEdit, onRemove, summaryRef }) => (
  <div ref={summaryRef} className="bg-gray-50 border border-gray-200 rounded-lg p-2 sm:p-3">
    <h3 className="text-base font-semibold mb-2">Garments in Order</h3>
    {garments.length === 0 ? (
      <p className="text-gray-500 text-center py-2 text-sm">No garments added yet</p>
    ) : (
      <div className="space-y-2">
        {garments.map((g, idx) => (
          <div key={idx} className="bg-white border border-gray-200 rounded-lg p-2 flex flex-col gap-1">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
              <div>
                <h4 className="font-medium text-sm">{g.orderType}</h4>
                <p className="text-xs text-gray-600">Qty: {g.quantity} • Variant: {g.variant}</p>
              </div>
              <div className="flex gap-1 w-full sm:w-auto mt-2 sm:mt-0">
                <Button type="button" variant="outline" size="sm" className="flex-1 sm:flex-none px-2 py-1 text-xs" onClick={() => onEdit(idx)}>
                  Edit
                </Button>
                <Button type="button" variant="destructive" size="sm" className="flex-1 sm:flex-none px-2 py-1 text-xs" onClick={() => onRemove(idx)}>
                  Remove
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
); 