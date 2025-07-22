"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  ChevronRight,
  Star,
  Scissors,
  Sparkles,
  Heart,
  Phone,
  MapPin,
  Clock,
  Instagram,
  Mail,
  Menu,
  X,
  ArrowRight,
  Check,
  Palette,
  Zap,
  Award,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Button as StatefulButton } from "@/components/ui/stateful-button";

const SonyFashionTailor = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  const [isVisible, setIsVisible] = useState<Record<string, boolean>>({});
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<
    Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      hue: number;
    }>
  >([]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Particle Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      hue: number;
    }> = [];

    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.3 + 0.1,
        hue: Math.random() * 60 + 300, // Purple to pink range
      });
    }
    particlesRef.current = particles;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${particle.hue}, 60%, 70%, ${particle.opacity})`;
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.2 }
    );

    document.querySelectorAll("section[id]").forEach((section) => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const services = [
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "Designer Kurtis",
      description:
        "Exquisite custom kurtis with intricate designs, perfect fitting, and premium fabrics for every occasion.",
      features: [
        "Custom Measurements",
        "Premium Fabrics",
        "Traditional & Modern Styles",
      ],
      color: "from-rose-500 to-pink-500",
      bgGradient: "from-rose-50 to-pink-50",
      border: "border-rose-200",
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Saree Blouses",
      description:
        "Beautifully crafted blouses that complement your precious sarees with perfect fit and elegant designs.",
      features: ["Expert Fitting", "Intricate Embroidery", "Quick Turnaround"],
      color: "from-purple-500 to-violet-500",
      bgGradient: "from-purple-50 to-violet-50",
      border: "border-purple-200",
    },
    {
      icon: <Scissors className="w-8 h-8" />,
      title: "Party Dresses",
      description:
        "Stunning party wear and formal dresses designed to make you look absolutely gorgeous on special occasions.",
      features: ["Unique Designs", "Luxury Fabrics", "Perfect Silhouettes"],
      color: "from-indigo-500 to-blue-500",
      bgGradient: "from-indigo-50 to-blue-50",
      border: "border-indigo-200",
    },
  ];

  const testimonials = [
    {
      name: "Priya Sharma",
      rating: 5,
      text: "Sony Fashion Tailor creates the most beautiful kurtis! The fit is perfect and the quality is outstanding.",
      location: "Mumbai",
      avatar: "PS",
    },
    {
      name: "Anjali Patel",
      rating: 5,
      text: "Amazing work on my saree blouses. The attention to detail and craftsmanship is simply superb!",
      location: "Delhi",
      avatar: "AP",
    },
    {
      name: "Meera Singh",
      rating: 5,
      text: "Best tailoring experience ever! Professional service and gorgeous designs. Highly recommend!",
      location: "Bangalore",
      avatar: "MS",
    },
  ];

  const stats = [
    {
      icon: <Users className="w-6 h-6" />,
      number: "5000+",
      label: "Happy Clients",
    },
    {
      icon: <Award className="w-6 h-6" />,
      number: "15+",
      label: "Years Experience",
    },
    {
      icon: <Palette className="w-6 h-6" />,
      number: "1000+",
      label: "Designs Created",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      number: "48hrs",
      label: "Quick Delivery",
    },
  ];

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
    setIsMenuOpen(false);
  };

  // Contact form state
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "loading" | "success"
  >("idle");

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus("loading");
    try {
      const now = new Date();
      const timestamp = now.toLocaleString("en-IN", { hour12: true });
      const cleanTimestamp = timestamp.replace(/[\n\t]+/g, " ");
      const cleanMessage = form.message.replace(/[\n\t]+/g, " ");
      const params = [
        form.name, // {{1}}
        form.phone, // {{2}}
        form.email, // {{3}}
        cleanTimestamp, // {{4}}
        cleanMessage, // {{5}}
      ];
      const res = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: "91986009677",
          params,
          templateName: "contact_form_lead",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          "Your message has been sent! We'll contact you soon on WhatsApp."
        );
        setForm({ name: "", phone: "", email: "", message: "" });
        setSubmitStatus("success");
        setTimeout(() => setSubmitStatus("idle"), 2000);
      } else {
        toast.error(
          "Failed to send message: " + (data.error || "Unknown error")
        );
        setSubmitStatus("idle");
      }
    } catch (err) {
      toast.error("Failed to send message. Please try again later.");
      setSubmitStatus("idle");
    } finally {
    }
  };

  // Gallery images
  const galleryImages = [
    "/gallery/design1.png",
    "/gallery/design2.png",
    "/gallery/design1.png",
    "/gallery/design2.png",
    "/gallery/design2.png",
    "/gallery/design1.png",
    "/gallery/design2.png",
    "/gallery/design1.png",
  ];

  // State for enlarged image dialog
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (dialogOpen) {
      setAnimateIn(false);
      setTimeout(() => setAnimateIn(true), 10);
    }
  }, [dialogOpen]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-rose-50/30 text-gray-900 overflow-x-hidden relative">
      {/* Animated Background Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
        style={{ opacity: 0.6 }}
      />

      {/* Cursor Glow Effect */}
      <div
        className="fixed w-96 h-96 pointer-events-none z-10 mix-blend-multiply"
        style={{
          background: `radial-gradient(circle, rgba(236, 72, 153, 0.08) 0%, transparent 50%)`,
          left: mousePosition.x - 192,
          top: mousePosition.y - 192,
          transition: "all 0.3s ease",
        }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-xl border-b border-gray-200/50 z-50 transition-all duration-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 rounded-2xl flex items-center justify-center transform rotate-12 hover:rotate-0 transition-transform duration-500 shadow-lg">
                  <Scissors className="w-6 h-6 text-white" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 rounded-2xl blur-xl opacity-20 animate-pulse"></div>
              </div>
              <div>
                <span className="text-2xl font-black bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                  Sony Fashion
                </span>
                <div className="text-xs text-gray-500 font-medium">TAILOR</div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-1">
              {["home", "services", "gallery", "testimonials", "contact"].map(
                (item) => (
                  <button
                    key={item}
                    onClick={() => scrollToSection(item)}
                    className={`relative px-6 py-3 capitalize font-semibold transition-all duration-500 rounded-full ${
                      activeSection === item
                        ? "text-gray-900"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {activeSection === item && (
                      <div className="absolute inset-0 bg-gradient-to-r from-rose-100/80 to-pink-100/80 rounded-full border border-rose-200/50 backdrop-blur-sm shadow-sm"></div>
                    )}
                    <span className="relative z-10">{item}</span>
                  </button>
                )
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-3 rounded-xl bg-gray-100/60 backdrop-blur-sm border border-gray-200/50"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-xl border-b border-gray-200/50 shadow-lg">
            <div className="flex flex-col p-6 space-y-2">
              {["home", "services", "gallery", "testimonials", "contact"].map(
                (item) => (
                  <button
                    key={item}
                    onClick={() => scrollToSection(item)}
                    className="capitalize text-left p-4 rounded-xl hover:bg-gray-100/60 transition-all duration-300 border border-transparent hover:border-rose-200/50 text-gray-700 hover:text-gray-900"
                  >
                    {item}
                  </button>
                )
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section
        id="home"
        className="min-h-screen flex items-center justify-center relative overflow-hidden"
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div
            className="absolute top-20 left-20 w-80 h-80 bg-gradient-to-r from-rose-200/40 to-pink-200/40 rounded-full blur-3xl animate-pulse"
            style={{ transform: `translateY(${scrollY * 0.5}px)` }}
          ></div>
          <div
            className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-purple-200/40 to-indigo-200/40 rounded-full blur-3xl animate-pulse delay-1000"
            style={{ transform: `translateY(${scrollY * -0.3}px)` }}
          ></div>
          <div
            className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-gradient-to-r from-pink-100/30 to-rose-100/30 rounded-full blur-3xl animate-spin"
            style={{
              transform: `translate(-50%, -50%) rotate(${scrollY * 0.1}deg)`,
              animationDuration: "20s",
            }}
          ></div>
        </div>

        <div className="relative z-10 text-center mt-36 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div
            className={`transition-all duration-1500 ${
              isVisible.home
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-20"
            }`}
          >
            {/* Floating Badge */}
            <div className="inline-flex items-center space-x-2 bg-white/70 backdrop-blur-sm rounded-full px-6 py-3 border border-rose-200/50 mb-8 hover:bg-white/80 transition-all duration-300 shadow-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">
                ✨ Premium Fashion Studio
              </span>
            </div>

            <h1 className="text-6xl sm:text-7xl lg:text-8xl xl:text-9xl font-black mb-8 leading-tight">
              <span className="block bg-gradient-to-r from-rose-600 via-pink-600 via-purple-600 to-rose-600 bg-clip-text text-transparent animate-gradient bg-300% relative">
                SONY
                <div className="absolute inset-0 bg-gradient-to-r from-rose-600 via-pink-600 via-purple-600 to-rose-600 bg-clip-text text-transparent blur-lg opacity-30 animate-pulse"></div>
              </span>
              <span className="block text-gray-900 mt-4 relative">
                FASHION
                <div className="absolute -inset-1 bg-gradient-to-r from-rose-300/30 to-purple-300/30 blur-xl"></div>
              </span>
            </h1>

            <p className="text-xl sm:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
              Where{" "}
              <span className="text-transparent bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text font-semibold">
                artistry meets precision
              </span>{" "}
              in every stitch. Crafting dreams into designer reality.
            </p>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center group">
                  <div className="flex justify-center mb-3">
                    <div className="p-3 rounded-2xl bg-gradient-to-r from-rose-100 to-pink-100 border border-rose-200/50 group-hover:from-rose-200 group-hover:to-pink-200 transition-all duration-300 shadow-sm">
                      <div className="text-rose-600">{stat.icon}</div>
                    </div>
                  </div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent mb-1">
                    {stat.number}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-10">
              <button
                onClick={() => scrollToSection("contact")}
                className="group relative bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 text-white px-10 py-5 rounded-2xl font-bold text-lg shadow-lg hover:shadow-rose-500/25 transform hover:scale-105 hover:-translate-y-2 transition-all duration-500 flex items-center space-x-3 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10">Book Consultation</span>
                <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-2 transition-transform duration-300" />
              </button>

              <button
                onClick={() => scrollToSection("gallery")}
                className="group relative border-2 border-rose-300 text-gray-700 px-10 py-5 rounded-2xl font-bold text-lg backdrop-blur-sm bg-white/60 hover:bg-white/80 hover:border-rose-400 transition-all duration-500 flex items-center space-x-3 overflow-hidden shadow-sm"
              >
                <Instagram className="w-5 h-5 group-hover:scale-110 transition-transform duration-300 text-rose-600" />
                <span>View Gallery</span>
              </button>
            </div>
          </div>
        </div>

        {/* Floating Geometric Elements */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-rose-400 to-pink-400 rounded-full opacity-40"
              style={{
                left: `${10 + i * 7}%`,
                top: `${20 + (i % 3) * 20}%`,
                animationDelay: `${i * 0.2}s`,
                transform: `translateY(${Math.sin(scrollY * 0.01 + i) * 20}px)`,
              }}
            ></div>
          ))}
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-10 sm:py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-rose-50/30 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div
            className={`text-center mb-20 transition-all duration-1000 ${
              isVisible.services
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-20"
            }`}
          >
            <div className="inline-block bg-gradient-to-r from-rose-100 to-pink-100 rounded-full px-8 py-3 border border-rose-200 mb-8 shadow-sm">
              <span className="text-rose-600 font-semibold">OUR SERVICES</span>
            </div>
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-gray-900 mb-6">
              Craft Your
              <span className="block bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                Dream Wardrobe
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Experience the perfect blend of traditional craftsmanship and
              contemporary design
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div
                key={index}
                className={`group relative overflow-hidden rounded-3xl p-8 backdrop-blur-xl border ${
                  service.border
                } hover:border-rose-300 hover:shadow-xl transform hover:-translate-y-4 hover:scale-105 transition-all duration-700 bg-white/60 hover:bg-white/80 ${
                  isVisible.services
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-20"
                }`}
                style={{
                  transitionDelay: `${index * 200}ms`,
                }}
              >
                {/* Animated Background Gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${service.bgGradient} opacity-0 group-hover:opacity-100 transition-all duration-700`}
                ></div>

                {/* Glowing Border Effect */}
                <div
                  className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${service.color} opacity-0 group-hover:opacity-10 blur-xl transition-all duration-700`}
                ></div>

                <div className="relative z-10">
                  <div
                    className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${service.color} mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg text-white`}
                  >
                    {service.icon}
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-rose-700 transition-colors duration-300">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                    {service.description}
                  </p>

                  <div className="space-y-3">
                    {service.features.map((feature, idx) => (
                      <div
                        key={idx}
                        className="flex items-center space-x-3 group/item"
                      >
                        <div
                          className={`w-6 h-6 rounded-full bg-gradient-to-r ${service.color} flex items-center justify-center group-hover/item:scale-110 transition-transform duration-300 shadow-sm`}
                        >
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-10 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50/30 via-transparent to-purple-50/30"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div
            className={`text-center mb-20 transition-all duration-1000 ${
              isVisible.gallery
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-20"
            }`}
          >
            <h2 className="text-5xl sm:text-6xl font-black text-gray-900 mb-6">
              Design
              <span className="bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                Showcase
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Witness the artistry that transforms fabric into fashion
              statements
            </p>
          </div>

          {/* 3D Grid Layout */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-16 perspective-1000">
            {galleryImages.map((src, index) => (
              <div
                key={index}
                className={`group relative aspect-square overflow-hidden rounded-2xl cursor-pointer transform-gpu transition-all duration-700 hover:scale-105 hover:-rotate-2 bg-white shadow-lg hover:shadow-xl border border-gray-200/50 hover:border-rose-300 ${
                  isVisible.gallery
                    ? "opacity-100 translate-y-0 rotate-0"
                    : "opacity-0 translate-y-20 rotate-12"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
                onClick={() => {
                  setEnlargedImage(src);
                  setDialogOpen(true);
                }}
              >
                <img
                  src={src}
                  alt={`Design ${index + 1}`}
                  className="w-full h-full object-cover rounded-2xl transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                {/* Glowing Border */}
                <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-rose-300/50 transition-all duration-500"></div>
              </div>
            ))}
          </div>

          {/* Enlarged Image Dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent
              showCloseButton
              className="max-w-2xl w-full p-0 bg-transparent border-none shadow-none flex items-center justify-center"
            >
              {enlargedImage && (
                <img
                  src={enlargedImage}
                  alt="Enlarged Design"
                  className={`w-full h-auto max-h-[80vh] rounded-2xl shadow-2xl object-contain transition-transform duration-500 ${
                    animateIn ? "scale-100" : "scale-75"
                  }`}
                />
              )}
            </DialogContent>
          </Dialog>

          <div className="text-center">
            <a
              href="https://www.instagram.com/sonyfashiontailor/"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center space-x-4 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 text-white px-12 py-6 rounded-2xl font-bold text-lg shadow-lg hover:shadow-rose-500/25 transform hover:scale-105 hover:-translate-y-2 transition-all duration-500 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <Instagram className="w-6 h-6 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
              <span className="relative z-10">Follow Our Journey</span>
              <ChevronRight className="w-6 h-6 relative z-10 group-hover:translate-x-2 transition-transform duration-300" />
            </a>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-10 sm:py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`text-center mb-20 transition-all duration-1000 ${
              isVisible.testimonials
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-20"
            }`}
          >
            <h2 className="text-5xl sm:text-6xl font-black text-gray-900 mb-6">
              Client
              <span className="bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                {" "}
                Love Stories
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Real experiences from women who trusted us with their fashion
              dreams
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className={`group relative p-8 rounded-3xl backdrop-blur-xl border border-gray-200/50 hover:border-rose-300 bg-white/70 hover:bg-white/90 hover:shadow-xl transform hover:-translate-y-4 hover:rotate-1 transition-all duration-700 ${
                  isVisible.testimonials
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-20"
                }`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                {/* Glowing Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-rose-50/80 to-pink-50/80 opacity-0 group-hover:opacity-100 transition-all duration-700"></div>

                {/* Content */}
                <div className="relative z-10">
                  {/* Avatar */}
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center font-bold text-white mr-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 group-hover:text-rose-600 transition-colors duration-300">
                        {testimonial.name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {testimonial.location}
                      </p>
                    </div>
                  </div>

                  {/* Stars */}
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-5 h-5 text-amber-400 fill-current group-hover:scale-110 transition-transform duration-300"
                        style={{ transitionDelay: `${i * 50}ms` }}
                      />
                    ))}
                  </div>

                  <p className="text-gray-600 group-hover:text-gray-900 italic leading-relaxed mb-4 transition-colors duration-300">
                    "{testimonial.text}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-10 sm:py-20 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-50 via-rose-50/30 to-pink-50/30"></div>
          <div className="absolute top-20 left-20 w-80 h-80 bg-rose-200/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div
            className={`text-center mb-20 transition-all duration-1000 ${
              isVisible.contact
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-20"
            }`}
          >
            <h2 className="text-5xl sm:text-6xl font-black text-gray-900 mb-6">
              Let's Create
              <span className="block bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent leading-[1.2] pb-1">
                Magic Together
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Ready to transform your fashion dreams into reality? Let's start
              this beautiful journey
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Contact Info */}
            <div
              className={`space-y-8 transition-all duration-1000 ${
                isVisible.contact
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-20"
              }`}
            >
              {[
                {
                  icon: <MapPin className="w-6 h-6" />,
                  title: "Visit Our Studio",
                  desc: (
                    <>
                      Shop No 13, Tulsi Ramsukh Market, Tulshibaug
                      <br />
                      Near Rupee Bank Near Tulsi Baug Ganpati Mandir,
                      <br />
                      Laxmi Road, Budhwar Peth-411002
                    </>
                  ),
                  color: "from-rose-500 to-pink-500",
                },
                {
                  icon: <Phone className="w-6 h-6" />,
                  title: "Call Us",
                  desc: " +91 986009677 / +91 93716 57322",
                  color: "from-purple-500 to-violet-500",
                },
                {
                  icon: <Clock className="w-6 h-6" />,
                  title: "Working Hours",
                  desc: "Tue-Sun: 10:00 AM - 8:00 PM",
                  color: "from-indigo-500 to-blue-500",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="group flex items-center space-x-6 p-6 rounded-2xl backdrop-blur-sm bg-white/80 hover:bg-white/95 border border-gray-200/50 hover:border-rose-200 transition-all duration-500 shadow-sm hover:shadow-lg"
                >
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${item.color} flex items-center justify-center text-white group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg`}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-rose-600 transition-colors duration-300">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 group-hover:text-gray-900 transition-colors duration-300">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}

              {/* Social Links */}
              <div className="pt-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Connect With Us
                </h3>
                <div className="flex space-x-4">
                  <a
                    href="https://www.instagram.com/sonyfashiontailor/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group w-14 h-14 bg-gradient-to-r from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center hover:from-rose-600 hover:to-pink-600 transform hover:scale-110 hover:-translate-y-1 transition-all duration-300 shadow-lg"
                  >
                    <Instagram className="w-6 h-6 text-white group-hover:rotate-12 transition-transform duration-300" />
                  </a>
                  <div className="group w-14 h-14 bg-gradient-to-r from-purple-500 to-violet-500 rounded-2xl flex items-center justify-center hover:from-purple-600 hover:to-violet-600 transform hover:scale-110 hover:-translate-y-1 transition-all duration-300 shadow-lg cursor-pointer">
                    <Mail className="w-6 h-6 text-white group-hover:rotate-12 transition-transform duration-300" />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div
              className={`transition-all duration-1000 ${
                isVisible.contact
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 translate-x-20"
              }`}
            >
              <form
                onSubmit={handleFormSubmit}
                className="backdrop-blur-xl bg-white/90 rounded-3xl p-8 border border-gray-200/50 relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500"
              >
                {/* Animated Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-rose-50/50 via-pink-50/50 to-purple-50/50 opacity-0 hover:opacity-100 transition-all duration-700"></div>

                <div className="relative z-10 space-y-6">
                  <div className="group">
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleFormChange}
                      placeholder="Your Name"
                      className="w-full px-6 py-4 bg-white/60 border border-gray-200/50 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-rose-400 focus:bg-white/80 transition-all duration-300 group-hover:bg-white/70"
                      required
                      disabled={submitting}
                    />
                  </div>
                  <div className="group">
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleFormChange}
                      placeholder="Phone Number"
                      className="w-full px-6 py-4 bg-white/60 border border-gray-200/50 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-rose-400 focus:bg-white/80 transition-all duration-300 group-hover:bg-white/70"
                      required
                      disabled={submitting}
                    />
                  </div>
                  <div className="group">
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleFormChange}
                      placeholder="Email Address"
                      className="w-full px-6 py-4 bg-white/60 border border-gray-200/50 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-rose-400 focus:bg-white/80 transition-all duration-300 group-hover:bg-white/70"
                      required
                      disabled={submitting}
                    />
                  </div>
                  <div className="group">
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleFormChange}
                      rows={4}
                      placeholder="Describe your dream outfit... (occasion, style, preferences)"
                      className="w-full px-6 py-4 bg-white/60 border border-gray-200/50 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-rose-400 focus:bg-white/80 transition-all duration-300 resize-none group-hover:bg-white/70"
                      required
                      disabled={submitting}
                    ></textarea>
                  </div>
                  <StatefulButton
                    type="submit"
                    status={submitStatus}
                    className="w-full bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 py-4 rounded-2xl font-bold text-lg shadow-lg hover:from-rose-600 hover:via-pink-600 hover:to-purple-600 transition-all duration-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={submitStatus === "loading"}
                  >
                    <span className="flex items-center justify-center space-x-2">
                      <Sparkles className="w-5 h-5" />
                      <span>
                        {submitStatus === "loading"
                          ? "Sending..."
                          : submitStatus === "success"
                          ? "Sent!"
                          : "Send Message"}
                      </span>
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  </StatefulButton>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 border-t border-gray-200/50">
        <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-rose-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Scissors className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                Sony Fashion Tailor
              </span>
            </div>
            <p className="text-gray-600 mb-4">
              Crafting dreams into designer reality since 2010
            </p>
            <p className="text-gray-500 text-sm">
              © 2024 Sony Fashion Tailor. Made with ❤️ for beautiful women
              everywhere.
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes gradient {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient {
          animation: gradient 8s ease infinite;
        }
        .bg-300\\% {
          background-size: 300% 300%;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </div>
  );
};

export default SonyFashionTailor;
