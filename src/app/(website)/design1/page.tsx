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
  MousePointer2,
  Smile,
} from "lucide-react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  hue: number;
}

const ModernFashionStudio = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [isVisible, setIsVisible] = useState<Record<string, boolean>>({});
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [cursorText, setCursorText] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const cursorRef = useRef<HTMLDivElement>(null);

  // Mouse movement effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      }
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

  // Intersection Observer for animations
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

  // Cursor hover effect
  useEffect(() => {
    const handleElementHover = (text: string) => {
      setCursorText(text);
      if (cursorRef.current) {
        cursorRef.current.classList.add("cursor-hover");
      }
    };

    const handleElementLeave = () => {
      setCursorText("");
      if (cursorRef.current) {
        cursorRef.current.classList.remove("cursor-hover");
      }
    };

    const buttons = document.querySelectorAll("button, a");
    buttons.forEach((button) => {
      button.addEventListener("mouseenter", () => handleElementHover("Click"));
      button.addEventListener("mouseleave", handleElementLeave);
    });

    return () => {
      buttons.forEach((button) => {
        button.removeEventListener("mouseenter", () =>
          handleElementHover("Click")
        );
        button.removeEventListener("mouseleave", handleElementLeave);
      });
    };
  }, []);

  const stats = [
    {
      icon: <Users className="w-6 h-6" />,
      number: "2.5K+",
      label: "Happy Clients",
      color: "from-violet-500 to-purple-500",
    },
    {
      icon: <Award className="w-6 h-6" />,
      number: "10+",
      label: "Years Experience",
      color: "from-fuchsia-500 to-pink-500",
    },
    {
      icon: <Palette className="w-6 h-6" />,
      number: "5K+",
      label: "Designs Created",
      color: "from-rose-500 to-orange-500",
    },
    {
      icon: <Smile className="w-6 h-6" />,
      number: "100%",
      label: "Satisfaction",
      color: "from-amber-500 to-yellow-500",
    },
  ];

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 overflow-x-hidden selection:bg-fuchsia-200 selection:text-fuchsia-900">
      {/* Custom Cursor */}
      <div
        ref={cursorRef}
        className="fixed w-8 h-8 pointer-events-none z-50 -translate-x-1/2 -translate-y-1/2 mix-blend-difference transition-transform duration-100 ease-out"
      >
        <div className="relative w-full h-full">
          <div className="absolute inset-0 bg-white rounded-full scale-50 opacity-50 blur-sm" />
          <div className="absolute inset-0 bg-white rounded-full scale-[0.2] transition-transform duration-300 ease-out cursor-dot" />
          {cursorText && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 text-white text-sm font-medium whitespace-nowrap">
              {cursorText}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-40 !mb-10 transition-all  duration-300">
        <div className="absolute inset-0 bg-white/80 backdrop-blur-xl -z-10" />
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-fuchsia-500 to-pink-500 rounded-xl flex items-center justify-center transform hover:rotate-12 transition-all duration-300">
                  <Scissors className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-pink-500 rounded-xl blur-xl opacity-30 animate-pulse" />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
                  SONY
                </span>
                <div className="text-[10px] sm:text-xs text-neutral-500 font-medium tracking-wider">
                  FASHION STUDIO
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-1">
              {["home", "services", "gallery", "testimonials", "contact"].map(
                (item) => (
                  <button
                    key={item}
                    onClick={() => scrollToSection(item)}
                    className={`relative px-6 py-2 capitalize font-medium transition-all duration-300 rounded-full ${
                      activeSection === item
                        ? "text-neutral-900"
                        : "text-neutral-600 hover:text-neutral-900"
                    }`}
                  >
                    {activeSection === item && (
                      <div className="absolute inset-0 bg-neutral-100 rounded-full -z-10" />
                    )}
                    <span className="relative z-10">{item}</span>
                  </button>
                )
              )}
            </div>

            {/* Book Now Button */}
            <button
              onClick={() => scrollToSection("contact")}
              className="hidden md:flex items-center space-x-2 bg-neutral-900 text-white px-6 py-2 rounded-full font-medium hover:bg-neutral-800 transition-colors duration-300"
            >
              <span>Book Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden relative w-10 h-10 flex items-center justify-center"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <div className="absolute inset-0 bg-neutral-100 rounded-xl transition-transform duration-300 hover:scale-110" />
              {isMenuOpen ? (
                <X className="w-5 h-5 relative z-10" />
              ) : (
                <Menu className="w-5 h-5 relative z-10" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`md:hidden absolute top-full left-0 w-full bg-white/80 backdrop-blur-xl border-t border-neutral-200 transition-all duration-300 ${
            isMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col space-y-1">
              {["home", "services", "gallery", "testimonials", "contact"].map(
                (item) => (
                  <button
                    key={item}
                    onClick={() => scrollToSection(item)}
                    className={`px-4 py-3 capitalize font-medium text-left rounded-xl transition-all duration-300 ${
                      activeSection === item
                        ? "bg-neutral-100 text-neutral-900"
                        : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                    }`}
                  >
                    {item}
                  </button>
                )
              )}
              <button
                onClick={() => scrollToSection("contact")}
                className="flex items-center justify-between bg-neutral-900 text-white px-4 py-3 rounded-xl font-medium hover:bg-neutral-800 transition-colors duration-300 mt-2"
              >
                <span>Book Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        id="home"
        className="min-h-[100vh] sm:min-h-[90vh] flex items-center pt-24 sm:pt-28 pb-16 relative overflow-hidden"
      >
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 -left-20 w-72 h-72 sm:w-96 sm:h-96 bg-fuchsia-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
          <div className="absolute top-1/3 -right-20 w-72 h-72 sm:w-96 sm:h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
          <div className="absolute -bottom-32 left-1/3 w-72 h-72 sm:w-96 sm:h-96 bg-violet-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
        </div>

        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 relative w-full">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-20 items-center">
            {/* Content */}
            <div className="relative text-center lg:text-left">
              <div
                className={`transition-all duration-1000 delay-300 ${
                  isVisible.home
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-12"
                }`}
              >
                <div className="inline-flex items-center space-x-2 bg-neutral-900 text-white rounded-full pl-2 pr-4 py-1 text-xs sm:text-sm font-medium mb-4 sm:mb-6">
                  <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white text-neutral-900 flex items-center justify-center">
                    ✨
                  </span>
                  <span>Premium Fashion Studio</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-7xl xl:text-8xl font-black text-neutral-900 leading-none mb-4 sm:mb-6">
                  Craft Your
                  <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
                    Style Story
                  </span>
                </h1>

                <p className="text-base sm:text-lg lg:text-xl text-neutral-600 max-w-xl mx-auto lg:mx-0 mb-6 sm:mb-8 lg:mb-10">
                  Where timeless elegance meets contemporary design. Experience
                  bespoke fashion crafted with precision and passion.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                  <button
                    onClick={() => scrollToSection("contact")}
                    className="group relative overflow-hidden bg-neutral-900 text-white px-5 sm:px-6 lg:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-sm sm:text-base font-medium inline-flex items-center justify-center hover:bg-neutral-800 transition-colors duration-300"
                  >
                    <span className="relative z-10 flex items-center space-x-2">
                      <span>Start Your Journey</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                  </button>
                  <button
                    onClick={() => scrollToSection("gallery")}
                    className="relative overflow-hidden bg-neutral-100 text-neutral-900 px-5 sm:px-6 lg:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-sm sm:text-base font-medium inline-flex items-center justify-center hover:bg-neutral-200 transition-colors duration-300"
                  >
                    <span className="relative z-10 flex items-center space-x-2">
                      <span>View Collection</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mt-10 sm:mt-12 lg:mt-16">
                  {stats.map((stat, index) => (
                    <div
                      key={index}
                      className={`transition-all duration-700 ${
                        isVisible.home
                          ? "opacity-100 translate-y-0"
                          : "opacity-0 translate-y-12"
                      }`}
                      style={{ transitionDelay: `${index * 100 + 600}ms` }}
                    >
                      <div className="flex flex-col items-center text-center group">
                        <div
                          className={`w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-r ${stat.color} flex items-center justify-center mb-2 sm:mb-3 transform group-hover:rotate-12 transition-transform duration-300`}
                        >
                          <div className="text-white w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6">
                            {stat.icon}
                          </div>
                        </div>
                        <div className="text-base sm:text-lg lg:text-2xl font-bold text-neutral-900 mb-0.5 sm:mb-1">
                          {stat.number}
                        </div>
                        <div className="text-[10px] sm:text-xs lg:text-sm text-neutral-600">
                          {stat.label}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div
              className={`relative transition-all duration-1000 delay-500 ${
                isVisible.home
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-12"
              }`}
            >
              <div className="relative aspect-[4/3] sm:aspect-square rounded-2xl sm:rounded-3xl overflow-hidden bg-neutral-100">
                {/* Add your hero image here */}
                <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-100 to-pink-100" />
                <div className="absolute inset-3 sm:inset-4 lg:inset-6 rounded-xl sm:rounded-2xl overflow-hidden">
                  {/* Replace this div with an Image component when you have the actual image */}
                  <div className="w-full h-full bg-neutral-200 animate-pulse" />
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-3 sm:-top-4 lg:-top-8 left-3 sm:left-4 lg:left-8 bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-2.5 sm:p-3 lg:p-4 transform -rotate-6 animate-float">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-lg sm:rounded-xl bg-neutral-100 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-fuchsia-500" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-medium">
                      Premium Quality
                    </div>
                    <div className="text-[8px] sm:text-[10px] lg:text-xs text-neutral-600">
                      Finest materials used
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-3 sm:-bottom-4 lg:-bottom-8 right-3 sm:right-4 lg:right-8 bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-2.5 sm:p-3 lg:p-4 transform rotate-6 animate-float animation-delay-2000">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-lg sm:rounded-xl bg-neutral-100 flex items-center justify-center">
                    <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-pink-500" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-medium">
                      Crafted with Love
                    </div>
                    <div className="text-[8px] sm:text-[10px] lg:text-xs text-neutral-600">
                      Attention to detail
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-3 sm:bottom-4 lg:bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-1.5 sm:space-y-2">
          <div className="text-xs sm:text-sm text-neutral-600 font-medium">
            Scroll to explore
          </div>
          <div className="w-4 h-7 sm:w-5 sm:h-8 lg:w-6 lg:h-10 rounded-full border-2 border-neutral-300 flex items-center justify-center">
            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-neutral-500 animate-scroll" />
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes blob {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(20px, -30px) scale(1.1);
          }
          50% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          75% {
            transform: translate(30px, 30px) scale(1.05);
          }
        }

        @keyframes scroll {
          0% {
            transform: translateY(0);
            opacity: 1;
          }
          50% {
            transform: translateY(10px);
            opacity: 0.5;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0) rotate(-6deg);
          }
          50% {
            transform: translateY(-10px) rotate(-6deg);
          }
        }

        .animate-blob {
          animation: blob 10s infinite;
        }

        .animate-scroll {
          animation: scroll 2s infinite;
        }

        .animate-float {
          animation: float 4s ease-in-out infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .cursor-hover .cursor-dot {
          transform: scale(1);
        }

        .selection-fuchsia::selection {
          background-color: rgba(219, 39, 119, 0.2);
          color: rgb(219, 39, 119);
        }
      `}</style>
    </div>
  );
};

export default ModernFashionStudio;
