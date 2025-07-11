"use client";

import { useEffect, useState, ChangeEvent } from "react";

// --- Types ---
type FileData = {
  url: string;
  originalname: string | { filename?: string };
};

type Measurement = {
  designDescription?: string;
  measurements?: Record<string, string | number>;
  canvasImageFile?: FileData;
  designReferenceFiles?: FileData[];
  voiceNoteFile?: FileData;
};

type Garment = {
  gender?: string;
  order?: {
    orderType?: string;
    urgency?: string;
    quantity?: number;
  };
  measurement?: Measurement;
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
  budgetAmount?: string;
  payment?: string;
  specialInstructions?: string;
  createdAt?: string;
  preferredCommunication?: string;
  sameForWhatsapp?: boolean;
  garments?: Garment[];
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

const UserIcon = () => (
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
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

const MailIcon = () => (
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
      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

const PhoneIcon = () => (
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
      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
    />
  </svg>
);

const MapPinIcon = () => (
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
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
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

function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 max-w-[95vw] max-h-[95vh] overflow-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
          onClick={onClose}
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

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
        g.measurement.designReferenceFiles.length > 0)
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
      <button
        className="w-full p-6 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-xl"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {order.oid?.slice(-3)}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {order.fullName}
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {order.oid}
                </span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <MailIcon />
                  <span className="truncate">{order.email}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CalendarIcon />
                  <span>{order.orderDate}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <PackageIcon />
                  <span>
                    {garmentCount} garment{garmentCount !== 1 ? "s" : ""}
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
          <div className="flex items-center space-x-2">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {order.budgetAmount}
              </div>
              <div className="text-xs text-gray-500">{order.payment}</div>
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
        </div>
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 border-t border-gray-100 bg-gray-50/50">
          <div className="pt-6 space-y-6">
            {/* Order ID Header */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-bold text-blue-900">
                    Order ID: {order.oid}
                  </h4>
                  <p className="text-sm text-blue-700">
                    Created:{" "}
                    {order.createdAt &&
                      new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-900">
                    {order.budgetAmount}
                  </div>
                  <div className="text-sm text-blue-700">{order.payment}</div>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  Customer Details
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <UserIcon />
                    <span className="text-sm text-gray-600">
                      {order.fullName}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MailIcon />
                    <span className="text-sm text-gray-600">{order.email}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <PhoneIcon />
                    <span className="text-sm text-gray-600">
                      {order.contactNumber}
                    </span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <MapPinIcon />
                    <span className="text-sm text-gray-600">
                      {order.fullAddress}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  Delivery & Payment
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      Delivery Date:
                    </span>
                    <span className="text-sm font-medium">
                      {order.deliveryDate}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Method:</span>
                    <span className="text-sm font-medium">
                      {order.deliveryMethod}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Budget:</span>
                    <span className="text-sm font-medium text-green-600">
                      {order.budgetAmount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Payment:</span>
                    <span className="text-sm font-medium">{order.payment}</span>
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
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">
                            {gidx + 1}
                          </span>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900">
                            {g.order?.orderType || "Garment"}
                          </h5>
                          <p className="text-sm text-gray-500">
                            Quantity: {g.order?.quantity || 1} • Urgency:{" "}
                            {g.order?.urgency || "Normal"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {g.gender || "Unspecified"}
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

                    {/* Images Gallery */}
                    <div className="space-y-6">
                      {/* Canvas Image */}
                      {getImageSrc(g.measurement?.canvasImageFile) && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h6 className="text-sm font-medium text-gray-700 mb-3">
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

                      {/* Design Reference Images */}
                      {Array.isArray(g.measurement?.designReferenceFiles) &&
                        g.measurement.designReferenceFiles.length > 0 && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h6 className="text-sm font-medium text-gray-700 mb-3">
                              Design References (
                              {g.measurement.designReferenceFiles.length})
                            </h6>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {g.measurement.designReferenceFiles.map(
                                (file, i) =>
                                  getImageSrc(file) && (
                                    <img
                                      key={i}
                                      src={getImageSrc(file)}
                                      alt={`Design Reference ${i + 1}`}
                                      className="rounded-lg border border-gray-200 shadow-md cursor-pointer hover:scale-105 transition-transform duration-200 mx-auto"
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

                    {/* Measurements */}
                    {g.measurement?.measurements &&
                      Object.keys(g.measurement.measurements).length > 0 && (
                        <div className="mt-4">
                          <h6 className="text-sm font-medium text-gray-700 mb-2">
                            Measurements
                          </h6>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {Object.entries(g.measurement.measurements).map(
                              ([key, value]) => (
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
              ? "text-white bg-blue-600 border border-blue-600"
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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [modalImg, setModalImg] = useState<{ src: string; alt: string } | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched orders:", data.orders);
        // Sort by creation date (most recent first) and limit to recent orders
        const sortedOrders = (data.orders || [])
          .sort((a: Order, b: Order) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return dateB.getTime() - dateA.getTime();
          })
          .slice(0, 50); // Show only last 50 orders
        setOrders(sortedOrders);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleDateFilter = (e: ChangeEvent<HTMLInputElement>) => {
    setDateFilter(e.target.value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleImageClick = (src: string, alt: string) => {
    setModalImg({ src, alt });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setExpanded(null); // Close expanded cards when changing pages
  };

  const filteredOrders = orders.filter((order) => {
    const q = search.toLowerCase();
    const dateMatch = !dateFilter || order.orderDate === dateFilter;

    if (!dateMatch) return false;

    if (!q) return true;

    return (
      (order.fullName && order.fullName.toLowerCase().includes(q)) ||
      (order.email && order.email.toLowerCase().includes(q)) ||
      (order.oid && order.oid.toLowerCase().includes(q)) ||
      (order.garments &&
        order.garments.some(
          (g) =>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Order Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage and track all customer orders (Recent 50 orders)
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-200">
                <span className="text-sm text-gray-600">Total Orders:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  {orders.length}
                </span>
              </div>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon />
              </div>
              <input
                type="text"
                value={search}
                onChange={handleSearch}
                placeholder="Search orders by name, email, or order ID..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FilterIcon />
              </div>
              <input
                type="date"
                value={dateFilter}
                onChange={handleDateFilter}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Filter by date"
                aria-label="Filter orders by date"
              />
            </div>
          </div>

          {/* Results Summary */}
          <div className="bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-200 inline-block">
            <span className="text-sm text-gray-600">
              Showing {startIndex + 1}-
              {Math.min(endIndex, filteredOrders.length)} of{" "}
              {filteredOrders.length} orders
            </span>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {currentOrders.length === 0 ? (
            <EmptyState />
          ) : (
            currentOrders.map((order, idx) => (
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
      <Modal open={!!modalImg} onClose={() => setModalImg(null)}>
        {modalImg && (
          <div className="text-center">
            <img
              src={modalImg.src}
              alt={modalImg.alt}
              className="max-w-full max-h-[80vh] rounded-lg shadow-lg"
            />
            <p className="mt-4 text-sm text-gray-600">{modalImg.alt}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
