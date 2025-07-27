import React from "react";
import { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell } from "@/components/ui/table";

interface OrderSummaryTableProps {
  garments: any[];
  totalAmount: number;
  advanceAmount: number;
  payment: string;
}

export const OrderSummaryTable: React.FC<OrderSummaryTableProps> = ({ garments, totalAmount, advanceAmount, payment }) => (
  <Table className="min-w-full">
    <TableHeader>
      <TableRow className="bg-gray-100">
        <TableHead className="font-bold whitespace-nowrap">Garment Type</TableHead>
        <TableHead className="font-bold whitespace-nowrap">Variant</TableHead>
        <TableHead className="font-bold whitespace-nowrap">Design #</TableHead>
        <TableHead className="font-bold text-right whitespace-nowrap">Amount (₹)</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {garments.map((g, idx) =>
        g.designs && Array.isArray(g.designs) && g.designs.length > 0 ? (
          g.designs.map((design: any, i: number) => (
            <TableRow key={`${idx}-${i}`}>
              <TableCell className="whitespace-nowrap">{g.orderType}</TableCell>
              <TableCell className="whitespace-nowrap">{g.variant}</TableCell>
              <TableCell className="whitespace-nowrap">{design.name || `Design ${i + 1}`}</TableCell>
              <TableCell className="text-right whitespace-nowrap">₹{design.amount}</TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow key={idx}>
            <TableCell className="whitespace-nowrap">{g.orderType}</TableCell>
            <TableCell className="whitespace-nowrap">{g.variant}</TableCell>
            <TableCell className="whitespace-nowrap">-</TableCell>
            <TableCell className="text-right whitespace-nowrap">₹0</TableCell>
          </TableRow>
        )
      )}
    </TableBody>
    <TableFooter>
      <TableRow>
        <TableCell colSpan={3} className="font-bold text-right whitespace-nowrap">Total Amount:</TableCell>
        <TableCell className="font-bold text-right whitespace-nowrap">₹{Number(totalAmount || 0).toFixed(2)}</TableCell>
      </TableRow>
      {payment === 'advance' ? (
        <>
          <TableRow>
            <TableCell colSpan={3} className="text-right">Advance Paid:</TableCell>
            <TableCell className="text-right">₹{Number(advanceAmount || 0).toFixed(2)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell colSpan={3} className="font-bold text-right whitespace-nowrap">Amount Due:</TableCell>
            <TableCell className="font-bold text-right whitespace-nowrap">₹{Math.max(0, Number(totalAmount || 0) - Number(advanceAmount || 0)).toFixed(2)}</TableCell>
          </TableRow>
        </>
      ) : null}
    </TableFooter>
  </Table>
); 