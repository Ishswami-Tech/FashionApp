"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useQueryData } from "@/hooks/useQueryData";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";

// --- Types ---
type FileData = {
  url: string;
  originalname: string | { filename?: string };
};

type Design = {
  name?: string;
  amount?: number | string;
  designDescription?: string;
  canvasImage?: string;
  designReference?: (FileData | string)[];
  designReferenceFiles?: FileData[];
  clothImages?: (FileData | string)[];
  clothImageFiles?: FileData[];
};

type Measurement = {
  designDescription?: string;
  measurements?: Record<string, string | number>;
  canvasImageFile?: FileData;
  designReferenceFiles?: FileData[];
  voiceNoteFile?: FileData;
};

type Garment = {
  variant?: string;
  order?: {
    orderType?: string;
    urgency?: string;
    quantity?: number;
  };
  measurement?: Measurement;
  measurements?: Record<string, string | number>;
  category?: string;
  designs?: Design[];
};

type Order = {
  _id?: string;
  oid?: string;
  orderDate?: string;
  fullName?: string;
  email?: string;
  contactNumber?: string;
  fullAddress?: string;
  deliveryDate?: string;
  deliveryMethod?: string;
  totalAmount?: string;
  payment?: string;
  specialInstructions?: string;
  createdAt?: string;
  preferredCommunication?: string;
  sameForWhatsapp?: boolean;
  garments?: Garment[];
  invoiceLinks?: {
    customer?: string;
    tailor?: string;
    admin?: string;
  };
};

function getImageSrc(file: FileData | undefined): string {
  if (!file || !file.url) return "";
  return file.url;
}

// Simple SVG Icons
const SearchIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const CalendarIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const PackageIcon = () => (
  <svg
    className="w-4 h-4"
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
);

const EyeIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);

const FilterIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"
    />
  </svg>
);

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <span className="ml-3 text-gray-600">Loading orders...</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
        <PackageIcon />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No orders found
      </h3>
      <p className="text-gray-500">
        Orders will appear here once customers start placing them.
      </p>
    </div>
  );
}

function OrderCard({
  order,
  isExpanded,
  onToggle,
  onImageClick,
}: {
  order: Order;
  isExpanded: boolean;
  onToggle: () => void;
  onImageClick: (src: string, alt: string) => void;
}) {
  const garmentCount = order.garments?.length || 0;
  const hasImages = order.garments?.some(
    (g) =>
      g.measurement?.canvasImageFile?.url ||
      (g.measurement?.designReferenceFiles &&
        g.measurement.designReferenceFiles.length > 0) ||
      (g.designs &&
        g.designs.some(
          (d) => d.designReferenceFiles && d.designReferenceFiles.length > 0
        ))
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 w-full">
      <button
        className="w-full p-4 sm:p-6 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-xl"
        onClick={onToggle}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between w-full gap-4">
          <div className="flex items-start space-x-4 w-full min-w-0">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {order.oid?.slice(-3)}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2">
                <h3 className="text-lg font-semibold text-gray-900 break-words">
                  Order #{order.oid}
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Tailor View
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <CalendarIcon />
                  <span className="truncate">
                    {formatDisplayDate(order.orderDate)}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <PackageIcon />
                  <span>
                    {garmentCount} garment{garmentCount !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <CalendarIcon />
                  <span className="truncate">
                    Delivery: {formatDisplayDate(order.deliveryDate)}
                  </span>
                </div>
                {hasImages && (
                  <div className="flex items-center space-x-1">
                    <EyeIcon />
                    <span className="text-green-600">Has images</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div
            className={`transform transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
          >
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 sm:px-6 pb-6 border-t border-gray-100 bg-gray-50/50">
          <div className="pt-6 space-y-6">
            {/* Order ID Header */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-green-900 mb-1">
                    Order ID: {order.oid}
                  </h4>
                  <p className="text-sm text-green-700">
                    Created: {formatDisplayDate(order.createdAt)}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
                  <div className="text-right">
                    <div className="text-sm text-green-700">Delivery Date</div>
                    <div className="text-lg font-bold text-green-900">
                      {formatDisplayDate(order.deliveryDate)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Special Instructions */}
            {order.specialInstructions && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  Special Instructions
                </h4>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    {order.specialInstructions}
                  </p>
                </div>
              </div>
            )}

            {/* Garments */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Garments
              </h4>
              <div className="space-y-4">
                {(order.garments || []).map((g, gidx) => (
                  <div
                    key={gidx}
                    className="bg-white rounded-lg border border-gray-200 p-4"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-green-600 font-semibold text-sm">
                            {gidx + 1}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-gray-900 truncate">
                            {g.category || g.order?.orderType || "Garment"}
                          </h5>
                          <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                            {g.variant && (
                              <span className="truncate">
                                Variant: {g.variant}
                              </span>
                            )}
                            <span>Quantity: {g.order?.quantity || 1}</span>
                            <span>Urgency: {g.order?.urgency || "Normal"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 flex-shrink-0">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {g.variant || "Standard"}
                        </span>
                      </div>
                    </div>

                    {/* Design Description */}
                    {g.measurement?.designDescription && (
                      <div className="mb-4">
                        <h6 className="text-sm font-medium text-gray-700 mb-2">
                          Design Description
                        </h6>
                        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                          {g.measurement.designDescription}
                        </p>
                      </div>
                    )}

                    {/* Measurements */}
                    {(g.measurements &&
                      Object.keys(g.measurements).length > 0) ||
                    (g.measurement?.measurements &&
                      Object.keys(g.measurement.measurements).length > 0) ? (
                      <div className="mb-4">
                        <h6 className="text-sm font-medium text-gray-700 mb-2">
                          Measurements
                        </h6>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {Object.entries(
                            g.measurements || g.measurement?.measurements || {}
                          ).map(([key, value]) => (
                            <div
                              key={key}
                              className="bg-gray-50 rounded-lg p-2"
                            >
                              <div className="text-xs font-medium text-gray-600 capitalize">
                                {key.replace(/([A-Z])/g, " $1").trim()}
                              </div>
                              <div className="text-sm font-semibold text-gray-900">
                                {String(value)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {/* Designs Section */}
                    {g.designs &&
                      Array.isArray(g.designs) &&
                      g.designs.length > 0 && (
                        <div className="space-y-4">
                          <h6 className="text-sm font-medium text-purple-700 mb-2">
                            Designs
                          </h6>
                          <div className="space-y-4">
                            {g.designs.map((design: any, dIdx: number) => (
                              <div
                                key={dIdx}
                                className="bg-white border border-purple-100 rounded-lg p-3"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-semibold text-purple-900">
                                    {design.name || `Design ${dIdx + 1}`}
                                  </span>
                                </div>
                                {design.designDescription && (
                                  <div className="mb-2 text-gray-700 text-sm">
                                    {design.designDescription}
                                  </div>
                                )}

                                {/* All Images - Responsive Layout */}
                                <div className="mt-3">
                                  <div className="text-xs text-gray-500 mb-2">
                                    All Images:
                                  </div>
                                  {/* Desktop: Single horizontal row */}
                                  <div className="hidden md:flex flex-nowrap overflow-x-auto pb-2">
                                    {/* Canvas Image */}
                                    {design.canvasImage && (
                                      <img
                                        src={design.canvasImage}
                                        alt="Canvas Design"
                                        className="w-20 h-20 object-cover border rounded cursor-pointer flex-shrink-0 mr-2"
                                        onClick={() =>
                                          onImageClick(
                                            design.canvasImage,
                                            "Canvas Design"
                                          )
                                        }
                                      />
                                    )}

                                    {/* Design Reference Images */}
                                    {(
                                      design.designReferenceFiles ||
                                      design.designReference ||
                                      []
                                    ).map((file: any, imgIdx: number) => {
                                      let src = "";
                                      if (typeof file === "string") {
                                        src = file;
                                      } else if (file instanceof File) {
                                        src = URL.createObjectURL(file);
                                      } else if (file?.url) {
                                        src = file.url;
                                      }
                                      return src ? (
                                        <img
                                          key={`ref-${imgIdx}`}
                                          src={src}
                                          alt={`Reference ${imgIdx + 1}`}
                                          className="w-20 h-20 object-cover border rounded cursor-pointer flex-shrink-0 mr-2"
                                          onClick={() =>
                                            onImageClick(
                                              src,
                                              `Reference ${imgIdx + 1}`
                                            )
                                          }
                                        />
                                      ) : null;
                                    })}

                                    {/* Cloth Images */}
                                    {(
                                      design.clothImageFiles ||
                                      design.clothImages ||
                                      []
                                    ).map((file: any, imgIdx: number) => {
                                      let src = "";
                                      if (typeof file === "string") {
                                        src = file;
                                      } else if (file instanceof File) {
                                        src = URL.createObjectURL(file);
                                      } else if (file?.url) {
                                        src = file.url;
                                      }
                                      return src ? (
                                        <img
                                          key={`cloth-${imgIdx}`}
                                          src={src}
                                          alt={`Cloth ${imgIdx + 1}`}
                                          className="w-20 h-20 object-cover border rounded cursor-pointer flex-shrink-0 mr-2"
                                          onClick={() =>
                                            onImageClick(
                                              src,
                                              `Cloth ${imgIdx + 1}`
                                            )
                                          }
                                        />
                                      ) : null;
                                    })}
                                  </div>

                                  {/* Mobile: Grid layout */}
                                  <div className="md:hidden grid grid-cols-3 gap-2">
                                    {/* Canvas Image */}
                                    {design.canvasImage && (
                                      <img
                                        src={design.canvasImage}
                                        alt="Canvas Design"
                                        className="w-full h-20 object-cover border rounded cursor-pointer"
                                        onClick={() =>
                                          onImageClick(
                                            design.canvasImage,
                                            "Canvas Design"
                                          )
                                        }
                                      />
                                    )}

                                    {/* Design Reference Images */}
                                    {(
                                      design.designReferenceFiles ||
                                      design.designReference ||
                                      []
                                    ).map((file: any, imgIdx: number) => {
                                      let src = "";
                                      if (typeof file === "string") {
                                        src = file;
                                      } else if (file instanceof File) {
                                        src = URL.createObjectURL(file);
                                      } else if (file?.url) {
                                        src = file.url;
                                      }
                                      return src ? (
                                        <img
                                          key={`ref-${imgIdx}`}
                                          src={src}
                                          alt={`Reference ${imgIdx + 1}`}
                                          className="w-full h-20 object-cover border rounded cursor-pointer"
                                          onClick={() =>
                                            onImageClick(
                                              src,
                                              `Reference ${imgIdx + 1}`
                                            )
                                          }
                                        />
                                      ) : null;
                                    })}

                                    {/* Cloth Images */}
                                    {(
                                      design.clothImageFiles ||
                                      design.clothImages ||
                                      []
                                    ).map((file: any, imgIdx: number) => {
                                      let src = "";
                                      if (typeof file === "string") {
                                        src = file;
                                      } else if (file instanceof File) {
                                        src = URL.createObjectURL(file);
                                      } else if (file?.url) {
                                        src = file.url;
                                      }
                                      return src ? (
                                        <img
                                          key={`cloth-${imgIdx}`}
                                          src={src}
                                          alt={`Cloth ${imgIdx + 1}`}
                                          className="w-full h-20 object-cover border rounded cursor-pointer"
                                          onClick={() =>
                                            onImageClick(
                                              src,
                                              `Cloth ${imgIdx + 1}`
                                            )
                                          }
                                        />
                                      ) : null;
                                    })}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Canvas Image from measurement (if no designs) */}
                    {(!g.designs || g.designs.length === 0) &&
                      getImageSrc(g.measurement?.canvasImageFile) && (
                        <div className="mt-4">
                          <h6 className="text-sm font-medium text-gray-700 mb-2">
                            Canvas Drawing
                          </h6>
                          <div className="flex justify-center items-center">
                            <img
                              src={getImageSrc(g.measurement?.canvasImageFile)}
                              alt="Canvas Drawing"
                              className="rounded-lg border border-gray-200 shadow-md cursor-pointer hover:scale-105 transition-transform duration-200"
                              style={{
                                width: "100%",
                                maxWidth: "350px",
                                height: "auto",
                                aspectRatio: "4/3",
                                objectFit: "contain",
                                background: "#fff",
                                display: "block",
                              }}
                              onClick={() =>
                                onImageClick(
                                  getImageSrc(g.measurement?.canvasImageFile),
                                  "Canvas Drawing"
                                )
                              }
                            />
                          </div>
                        </div>
                      )}

                    {/* Design Reference Images from measurement (if no designs) */}
                    {(!g.designs || g.designs.length === 0) &&
                      Array.isArray(g.measurement?.designReferenceFiles) &&
                      g.measurement.designReferenceFiles.length > 0 && (
                        <div className="mt-4">
                          <h6 className="text-sm font-medium text-gray-700 mb-3">
                            Design References
                          </h6>
                          <div className="flex flex-nowrap overflow-x-auto pb-2">
                            {g.measurement.designReferenceFiles.map(
                              (file, i) =>
                                getImageSrc(file) && (
                                  <img
                                    key={`measurement-${i}`}
                                    src={getImageSrc(file)}
                                    alt={`Design Reference ${i + 1}`}
                                    className="w-20 h-20 object-cover border rounded cursor-pointer flex-shrink-0 mr-2"
                                    onClick={() =>
                                      onImageClick(
                                        getImageSrc(file),
                                        `Design Reference ${i + 1}`
                                      )
                                    }
                                  />
                                )
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const pages = [];
  const maxVisiblePages = 5;

  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center space-x-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Previous
      </button>

      {startPage > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            1
          </button>
          {startPage > 2 && <span className="px-2 text-gray-500">...</span>}
        </>
      )}

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-2 text-sm font-medium rounded-md ${
            currentPage === page
              ? "text-white bg-green-600 border border-green-600"
              : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
          }`}
        >
          {page}
        </button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && (
            <span className="px-2 text-gray-500">...</span>
          )}
          <button
            onClick={() => onPageChange(totalPages)}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
  );
}

function formatDisplayDate(dateStr?: string) {
  if (!dateStr) return "No date set";

  // Handle DD/MM/YYYY format
  if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const d = new Date(
        parseInt(parts[2]),
        parseInt(parts[1]) - 1,
        parseInt(parts[0])
      );
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      }
    }
  }

  // Try standard date parsing
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    return "Invalid date";
  }

  return d.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function TailorOrdersPage() {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [modalImg, setModalImg] = useState<{ src: string; alt: string } | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  // Use useQueryData for fetching orders
  const { data, isPending, isFetched, isFetching, refetch } = useQueryData(
    ["tailor-orders"],
    () => fetch("/api/admin/orders").then((res) => res.json())
  );
  const orders = data?.orders || [];
  const loading = isPending;
  const error = data?.error;

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleDateFilter = (e: ChangeEvent<HTMLInputElement>) => {
    setDateFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleImageClick = (src: string, alt: string) => {
    setModalImg({ src, alt });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setExpanded(null);
  };

  const filteredOrders = orders.filter((order: Order) => {
    const q = search.toLowerCase();
    const dateMatch = !dateFilter || order.orderDate === dateFilter;

    if (!dateMatch) return false;

    if (!q) return true;

    return (
      (order.oid && order.oid.toLowerCase().includes(q)) ||
      (order.garments &&
        order.garments.some(
          (g: Garment) =>
            g.order?.orderType && g.order.orderType.toLowerCase().includes(q)
        ))
    );
  });

  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const endIndex = startIndex + ordersPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  if (loading) return <LoadingSpinner />;
  if (error)
    return (
      <div className="p-8 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <div className="text-red-600 font-medium mb-2">
            Error loading orders
          </div>
          <div className="text-red-500 text-sm">{error}</div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl w-full mx-auto px-2 sm:px-4 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div className="w-full">
              <h1 className="text-3xl font-bold text-gray-900 break-words">
                Tailor Orders
              </h1>
              <p className="text-gray-600 mt-1 break-words">
                View and manage work orders (Recent 50 orders)
              </p>
            </div>
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <div className="bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-200 w-full sm:w-auto">
                <span className="text-sm text-gray-600">Total Orders:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  {orders.length}
                </span>
              </div>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6 w-full">
            <div className="relative flex-1 max-w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon />
              </div>
              <input
                type="text"
                value={search}
                onChange={handleSearch}
                placeholder="Search orders by order ID or garment type..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm"
              />
            </div>
            <div className="relative w-full sm:w-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FilterIcon />
              </div>
              <input
                type="date"
                value={dateFilter}
                onChange={handleDateFilter}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm"
                placeholder="Filter by date"
                aria-label="Filter orders by date"
              />
            </div>
          </div>

          {/* Results Summary */}
          <div className="bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-200 inline-block w-full sm:w-auto">
            <span className="text-sm text-gray-600">
              Showing {startIndex + 1}-
              {Math.min(endIndex, filteredOrders.length)} of{" "}
              {filteredOrders.length} orders
            </span>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4 w-full">
          {currentOrders.length === 0 ? (
            <EmptyState />
          ) : (
            currentOrders.map((order: Order, idx: number) => (
              <OrderCard
                key={order._id || idx}
                order={order}
                isExpanded={expanded === (order._id || idx.toString())}
                onToggle={() =>
                  setExpanded(
                    expanded === (order._id || idx.toString())
                      ? null
                      : order._id || idx.toString()
                  )
                }
                onImageClick={handleImageClick}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      {/* Image Modal */}
      <Dialog open={!!modalImg} onOpenChange={() => setModalImg(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-auto">
          <DialogClose className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:shadow-xl transition-all">
            ×
          </DialogClose>
          {modalImg && (
            <div className="text-center">
              <img
                src={modalImg.src}
                alt={modalImg.alt}
                className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl max-h-[80vh] rounded-lg shadow-lg object-contain mx-auto"
              />
              <p className="mt-4 text-sm text-gray-600 break-words">
                {modalImg.alt}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
