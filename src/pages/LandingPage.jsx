import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import SignIn from "../components/SignIn";
// import { motion } from "framer-motion";
import { Twitter, Facebook, Linkedin, Github, ArrowRight } from "lucide-react";

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center">
          Something went wrong. Please refresh the page.
        </div>
      );
    }
    return this.props.children;
  }
}

const LandingPage = () => {
  const navigate = useNavigate();
  const [upcomingContests, setUpcomingContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [currentContestIndex, setCurrentContestIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1 for right, -1 for left
  const autoRotateTimerRef = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auth modal state
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

  useEffect(() => {
    fetchContests();

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (autoRotateTimerRef.current) {
        clearTimeout(autoRotateTimerRef.current);
      }
    };
  }, []);

  // Auto-rotate contests
  useEffect(() => {
    if (upcomingContests.length > 1 && !loading) {
      startAutoRotate();
    }

    return () => {
      if (autoRotateTimerRef.current) {
        clearTimeout(autoRotateTimerRef.current);
      }
    };
  }, [upcomingContests, currentContestIndex, loading, activeTab]);

  // When activeTab changes, reset the carousel index
  useEffect(() => {
    setCurrentContestIndex(0);
  }, [activeTab]);

  // Make sure currentContestIndex is valid
  useEffect(() => {
    const filteredContests =
      activeTab === "all"
        ? upcomingContests
        : upcomingContests.filter(
            (c) => c.platform.toLowerCase() === activeTab.toLowerCase()
          );

    if (
      filteredContests.length > 0 &&
      currentContestIndex >= filteredContests.length
    ) {
      setCurrentContestIndex(0);
    }
  }, [upcomingContests, activeTab, currentContestIndex]);

  const startAutoRotate = () => {
    if (autoRotateTimerRef.current) {
      clearTimeout(autoRotateTimerRef.current);
    }

    autoRotateTimerRef.current = setTimeout(() => {
      const filteredContests =
        activeTab === "all"
          ? upcomingContests
          : upcomingContests.filter(
              (c) => c.platform.toLowerCase() === activeTab.toLowerCase()
            );

      if (filteredContests.length > 1) {
        setDirection(1);
        setCurrentContestIndex((prevIndex) =>
          prevIndex === filteredContests.length - 1 ? 0 : prevIndex + 1
        );
      }
    }, 5000);
  };

  const handlePrevContest = () => {
    if (autoRotateTimerRef.current) {
      clearTimeout(autoRotateTimerRef.current);
    }

    const filteredContests =
      activeTab === "all"
        ? upcomingContests
        : upcomingContests.filter(
            (c) => c.platform.toLowerCase() === activeTab.toLowerCase()
          );

    if (filteredContests.length > 1) {
      setDirection(-1);
      setCurrentContestIndex((prevIndex) =>
        prevIndex === 0 ? filteredContests.length - 1 : prevIndex - 1
      );
    }
  };

  const footerVariants = {
  hidden: { opacity: 0, y: 50 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 80,
      staggerChildren: 0.15, // Staggers the animation of child elements
    },
  },
};

const columnVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const linkListVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1, // Staggers each link in the list
    },
  },
};

const linkItemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 },
};

const socialIconContainerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const socialIconVariants = {
  hidden: { opacity: 0, scale: 0.5 },
  show: { opacity: 1, scale: 1 },
};

// --- Social Icons Data ---
// This makes it easier to manage the social links and their icons.
const socialLinks = [
  { name: "twitter", icon: <Twitter size={18} />, href: "#" },
  { name: "facebook", icon: <Facebook size={18} />, href: "#" },
  { name: "linkedin", icon: <Linkedin size={18} />, href: "#" },
  { name: "github", icon: <Github size={18} />, href: "#" },
];

  const handleNextContest = () => {
    if (autoRotateTimerRef.current) {
      clearTimeout(autoRotateTimerRef.current);
    }

    const filteredContests =
      activeTab === "all"
        ? upcomingContests
        : upcomingContests.filter(
            (c) => c.platform.toLowerCase() === activeTab.toLowerCase()
          );

    if (filteredContests.length > 1) {
      setDirection(1);
      setCurrentContestIndex((prevIndex) =>
        prevIndex === filteredContests.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  // Helper function to find the next occurrence of a specific day of the week
  const getNextDayOfWeek = (dayOfWeek, hour, minute) => {
    // 0=Sun, 1=Mon, ..., 6=Sat
    const now = new Date();
    const resultDate = new Date();

    // Calculate days until target day
    const currentDay = now.getDay();
    let daysUntilTarget = (dayOfWeek - currentDay + 7) % 7;

    // If it's the target day, check if the time has passed
    if (daysUntilTarget === 0) {
      const targetTime = new Date();
      targetTime.setHours(hour, minute, 0, 0); // Using local time

      // If time has passed today, schedule for next week
      if (now >= targetTime) {
        daysUntilTarget = 7;
      }
    }

    resultDate.setDate(now.getDate() + daysUntilTarget);
    resultDate.setHours(hour, minute, 0, 0); // Using local time

    return resultDate;
  };

  const generatePlaceholderContests = () => {
    const now = new Date();

    // LeetCode Weekly: Every Sunday at 08:00 AM IST (02:30 UTC)
    const leetcodeDate = getNextDayOfWeek(0, 8, 0);

    // AtCoder Beginner: Every Saturday at 05:30 PM IST (12:00 UTC)
    const atcoderDate = getNextDayOfWeek(6, 17, 30);

    // CodeChef Starters: Every Wednesday at 08:00 PM IST (14:30 UTC)
    const codechefDate = getNextDayOfWeek(3, 20, 0);

    // HackerRank Challenge: Every Friday at 07:00 PM IST (13:30 UTC)
    const hackerrankDate = getNextDayOfWeek(5, 19, 0);

    // Add some future Codeforces contests (placeholder)
    const cfDate1 = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days from now
    cfDate1.setHours(20, 35, 0, 0); // 8:35 PM local time

    const cfDate2 = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days from now
    cfDate2.setHours(17, 35, 0, 0); // 5:35 PM local time

    return [
      {
        id: "cf-placeholder-1",
        name: "Codeforces Round #835 (Div. 2)",
        platform: "Codeforces",
        date: new Intl.DateTimeFormat("en-GB").format(cfDate1),
        time: new Intl.DateTimeFormat("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }).format(cfDate1),
        duration: "2h 15m",
        url: "https://codeforces.com/contests",
        startTime: cfDate1.getTime(),
      },
      {
        id: "cf-placeholder-2",
        name: "Codeforces Educational Round #146",
        platform: "Codeforces",
        date: new Intl.DateTimeFormat("en-GB").format(cfDate2),
        time: new Intl.DateTimeFormat("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }).format(cfDate2),
        duration: "2h 0m",
        url: "https://codeforces.com/contests",
        startTime: cfDate2.getTime(),
      },
      {
        id: "lc-placeholder",
        name: "LeetCode Weekly Contest",
        platform: "LeetCode",
        date: new Intl.DateTimeFormat("en-GB").format(leetcodeDate),
        time: new Intl.DateTimeFormat("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }).format(leetcodeDate),
        duration: "1h 30m",
        url: "https://leetcode.com/contest/",
        startTime: leetcodeDate.getTime(),
      },
      {
        id: "ac-placeholder",
        name: "AtCoder Beginner Contest",
        platform: "AtCoder",
        date: new Intl.DateTimeFormat("en-GB").format(atcoderDate),
        time: new Intl.DateTimeFormat("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }).format(atcoderDate),
        duration: "1h 40m",
        url: "https://atcoder.jp/contests/",
        startTime: atcoderDate.getTime(),
      },
      {
        id: "cc-placeholder",
        name: "CodeChef Starters",
        platform: "CodeChef",
        date: new Intl.DateTimeFormat("en-GB").format(codechefDate),
        time: new Intl.DateTimeFormat("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }).format(codechefDate),
        duration: "3h 0m",
        url: "https://www.codechef.com/contests",
        startTime: codechefDate.getTime(),
      },
      {
        id: "hr-placeholder",
        name: "HackerRank Weekly Challenge",
        platform: "HackerRank",
        date: new Intl.DateTimeFormat("en-GB").format(hackerrankDate),
        time: new Intl.DateTimeFormat("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }).format(hackerrankDate),
        duration: "48h 0m",
        url: "https://www.hackerrank.com/contests",
        startTime: hackerrankDate.getTime(),
      },
    ];
  };

  const fetchContests = async () => {
    try {
      // Always start with placeholder contests to ensure something shows
      const placeholderContests = generatePlaceholderContests();
      setUpcomingContests(placeholderContests.slice(0, 8));
      setLoading(false);

      // Try to fetch from Codeforces API in the background
      try {
        const codeforcesResponse = await fetch(
          "https://codeforces.com/api/contest.list"
        );

        if (codeforcesResponse.ok) {
          const data = await codeforcesResponse.json();
          if (data.status === "OK") {
            const now = Date.now();
            const cfContests = data.result
              .filter(
                (contest) =>
                  contest.phase === "BEFORE" &&
                  contest.startTimeSeconds * 1000 > now
              )
              .slice(0, 4)
              .map((contest) => {
                const startTime = new Date(contest.startTimeSeconds * 1000);
                return {
                  id: `cf-${contest.id}`,
                  name: contest.name,
                  platform: "Codeforces",
                  date: new Intl.DateTimeFormat("en-GB").format(startTime),
                  time: new Intl.DateTimeFormat("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  }).format(startTime),
                  duration: `${Math.floor(
                    contest.durationSeconds / 3600
                  )}h ${Math.floor((contest.durationSeconds % 3600) / 60)}m`,
                  url: `https://codeforces.com/contest/${contest.id}`,
                  startTime: contest.startTimeSeconds * 1000,
                };
              });

            if (cfContests.length > 0) {
              const nonCfPlaceholders = placeholderContests.filter(
                (c) => c.platform !== "Codeforces"
              );
              let contests = [...cfContests, ...nonCfPlaceholders];
              contests.sort((a, b) => a.startTime - b.startTime);
              setUpcomingContests(contests.slice(0, 8));
            }
          }
        }
      } catch (apiError) {
        console.log(
          "Could not fetch from Codeforces API, using placeholder data:",
          apiError
        );
        // Placeholders are already set, no action needed
      }
    } catch (error) {
      console.error("Error in contests logic:", error);
      // Ensure we always show something
      const fallbackContests = generatePlaceholderContests();
      setUpcomingContests(fallbackContests.slice(0, 6));
      setLoading(false);
    }
  };

  const features = [
    {
      title: "Unified Dashboard",
      description:
        "Aggregate stats from LeetCode, Codeforces, CodeChef, AtCoder, and GitHub in one place",
    },
    {
      title: "Real-time Analytics",
      description:
        "Track your progress with detailed charts, heatmaps, and performance metrics",
    },
    {
      title: "AI Profile Summary",
      description:
        "Generate recruiter-ready summaries of your coding achievements with AI",
    },
    {
      title: "Contest Calendar",
      description:
        "Never miss a coding contest with our integrated calendar and reminders",
    },
    {
      title: "Social Feed",
      description:
        "Connect with other developers, share achievements, and stay motivated",
    },
    {
      title: "Portfolio Builder",
      description:
        "Create stunning portfolio pages to showcase your skills to recruiters",
    },
  ];

  const stats = [
    { value: "12K+", label: "Active Users" },
    { value: "150K+", label: "Problems Solved" },
    { value: "15+", label: "Platforms" },
    { value: "98.5%", label: "User Satisfaction" },
  ];

  const platforms = [
    "LeetCode",
    "Codeforces",
    "CodeChef",
    "AtCoder",
    "HackerRank",
    "GitHub",
  ];

  const filteredContests =
    activeTab === "all"
      ? upcomingContests
      : upcomingContests.filter(
          (c) => c.platform.toLowerCase() === activeTab.toLowerCase()
        );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  const buttonVariants = {
    hover: {
      scale: 1.05,
      boxShadow: "0px 8px 15px rgba(59, 130, 246, 0.3)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
      },
    },
    tap: {
      scale: 0.95,
    },
  };

  const cardVariants = {
    hover: {
      y: -8,
      boxShadow: "0px 12px 24px rgba(59, 130, 246, 0.2)",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 15,
      },
    },
  };

  const fadeInUpVariants = {
    hidden: {
      y: 40,
      opacity: 0,
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 50,
        damping: 20,
      },
    },
  };

  const slideVariants = {
    enter: (direction) => {
      return {
        x: direction > 0 ? 1000 : -1000,
        opacity: 0,
        scale: 0.8,
      };
    },
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.5 },
        scale: { type: "spring", stiffness: 300, damping: 30 },
      },
    },
    exit: (direction) => {
      return {
        x: direction > 0 ? -1000 : 1000,
        opacity: 0,
        scale: 0.8,
        transition: {
          x: { type: "spring", stiffness: 300, damping: 30 },
          opacity: { duration: 0.5 },
          scale: { duration: 0.5 },
        },
      };
    },
  };

  const getPlatformColor = (platform) => {
    switch (platform?.toLowerCase()) {
      case "codeforces":
        return "bg-red-500";
      case "leetcode":
        return "bg-yellow-500";
      case "codechef":
        return "bg-green-500";
      case "atcoder":
        return "bg-blue-500";
      case "hackerrank":
        return "bg-purple-500";
      default:
        return "bg-blue-500";
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Open the sign-in modal
  const openSignInModal = () => {
    setIsSignInModalOpen(true);
  };

  // Close the sign-in modal
  const closeSignInModal = () => {
    setIsSignInModalOpen(false);
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white overflow-hidden">
        <style>
          {`
            @keyframes float {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-10px); }
            }
            
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.8; }
            }
            
            @keyframes gradientBG {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            
            .animate-float {
              animation: float 6s ease-in-out infinite;
            }
            
            .animate-pulse-slow {
              animation: pulse 4s ease-in-out infinite;
            }
            
            .gradient-text {
              background: linear-gradient(90deg, #3B82F6, #8B5CF6);
              -webkit-background-clip: text;
              background-clip: text;
              color: transparent;
            }
            
            .gradient-bg {
              background: linear-gradient(135deg, #3B82F6, #8B5CF6, #3B82F6);
              background-size: 200% 200%;
              animation: gradientBG 15s ease infinite;
            }
            
            .glow {
              box-shadow: 0 0 15px rgba(59, 130, 246, 0.5);
            }
            
            .backdrop-blur {
              backdrop-filter: blur(8px);
              -webkit-backdrop-filter: blur(8px);
            }
            
            .carousel-container {
              perspective: 1000px;
            }

            @media (max-width: 640px) {
              .custom-scrollbar {
                scrollbar-width: none;
                -ms-overflow-style: none;
              }
              
              .custom-scrollbar::-webkit-scrollbar {
                display: none;
              }
            }
          `}
        </style>

        {/* Navigation */}
        <motion.nav
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur ${
            scrolled ? "bg-white/90 shadow-md" : "bg-white/80"
          }`}
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 20,
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16 sm:h-20">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-md">
                  CT
                </div>
                <span className="text-lg sm:text-xl font-bold text-gray-900">
                  CodeTrack<span className="text-blue-600">Pro</span>
                </span>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-10">
                <a
                  href="#features"
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-300"
                >
                  Features
                </a>
                <a
                  href="#contests"
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-300"
                >
                  Contests
                </a>
                <a
                  href="#testimonials"
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-300"
                >
                  Testimonials
                </a>
              </div>

              <div className="hidden md:flex space-x-4">
               
                <motion.button
                  className="px-5 py-2 bg-blue-500 text-white rounded-lg font-medium shadow-md text-sm sm:text-base"
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={openSignInModal}
                >
                  Get Started
                </motion.button>
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden flex items-center">
                <button
                  onClick={toggleMobileMenu}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 focus:outline-none"
                >
                  <span className="sr-only">Open main menu</span>
                  {!mobileMenuOpen ? (
                    <svg
                      className="block h-6 w-6"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="block h-6 w-6"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu, show/hide based on menu state */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                className="md:hidden bg-white shadow-lg"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="px-4 py-4 space-y-1">
                  <a
                    href="#features"
                    className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                  >
                    Features
                  </a>
                  <a
                    href="#contests"
                    className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                  >
                    Contests
                  </a>
                  <a
                    href="#testimonials"
                    className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                  >
                    Testimonials
                  </a>
                  <div className="pt-2 pb-1">
                    <div className="border-t border-gray-200 pt-4 flex flex-col space-y-3">
                      
                      <a
                        onClick={openSignInModal}
                        className="px-3 py-2 text-center rounded-md text-base font-medium text-white bg-blue-500 shadow-md hover:bg-blue-600 cursor-pointer"
                      >
                        Get Started
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.nav>

        {/* SignIn Component */}
        <AnimatePresence>
          {isSignInModalOpen && (
            <SignIn isOpen={isSignInModalOpen} onClose={closeSignInModal} />
          )}
        </AnimatePresence>

        {/* Hero Section */}
        <main className="pt-16">
          <div className="relative pt-12 sm:pt-16 md:pt-24 pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6 overflow-hidden">
            <motion.div
              className="absolute top-0 right-0 w-72 sm:w-96 h-72 sm:h-96 bg-blue-50 rounded-full filter blur-3xl opacity-50 -z-10"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.3, 0.5],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
            <motion.div
              className="absolute bottom-0 left-10 sm:left-20 w-52 sm:w-72 h-52 sm:h-72 bg-purple-50 rounded-full filter blur-3xl opacity-50 -z-10"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 0.4, 0.5],
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                repeatType: "reverse",
                delay: 1,
              }}
            />

            <div className="max-w-7xl mx-auto text-center">
              <motion.h1
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-4 sm:mb-6 leading-tight px-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
              >
                Track Your Coding Journey With{" "}
                <span className="text-blue-500">Precision</span>
              </motion.h1>
              <motion.p
                className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed px-4 sm:px-6 max-w-3xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                Unified dashboard for all your competitive programming profiles.
                Real-time analytics, AI insights, and career growth tools in one
                place.
              </motion.p>
              
              <motion.div
                className="flex flex-wrap justify-center gap-2 sm:gap-3 px-2 sm:px-0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.6 }}
              >
                <div className="flex flex-wrap justify-center gap-2 sm:gap-3 max-w-full overflow-x-auto py-2 custom-scrollbar">
                  {platforms.map((platform, i) => (
                    <motion.span
                      key={i}
                      className="px-3 sm:px-5 py-2 sm:py-2.5 bg-gray-50 text-gray-700 rounded-full text-xs sm:text-sm font-medium border border-gray-200 shadow-sm whitespace-nowrap"
                      whileHover={{
                        y: -3,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {platform}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Features Section */}
          <motion.div
            id="features"
            className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 bg-gray-50"
            variants={fadeInUpVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-10 sm:mb-16">
                <motion.h2
                  className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4"
                  variants={fadeInUpVariants}
                >
                  Powerful Features for{" "}
                  <span className="text-blue-600">Coding Professionals</span>
                </motion.h2>
                <motion.p
                  className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-2"
                  variants={fadeInUpVariants}
                >
                  Everything you need to track and grow your coding career, all
                  in one intuitive platform
                </motion.p>
              </div>
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-8"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
              >
                {features.map((feature, i) => (
                  <motion.div
                    key={i}
                    className="bg-white p-5 sm:p-6 md:p-8 rounded-xl border border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-xl transition-all duration-300"
                    variants={itemVariants}
                    whileHover={cardVariants.hover}
                  >
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>

          {/* Stats Section */}
          
           

          {/* Contests Section - Circular Carousel */}
          <motion.div
            id="contests"
            className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 bg-gray-50"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-8 sm:mb-12">
                <motion.h2
                  className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-3"
                  variants={fadeInUpVariants}
                >
                  Upcoming Coding Contests
                </motion.h2>
                <motion.p
                  className="text-base sm:text-lg md:text-xl text-gray-600"
                  variants={fadeInUpVariants}
                >
                  Never miss another competitive programming opportunity
                </motion.p>
              </div>

              <motion.div
                className="mb-8 sm:mb-10 overflow-x-auto custom-scrollbar"
                variants={fadeInUpVariants}
              >
                <div className="flex justify-start sm:justify-center gap-2 sm:gap-3 pb-2 sm:pb-0 min-w-max sm:min-w-0">
                  <motion.button
                    onClick={() => setActiveTab("all")}
                    className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all duration-300 text-xs sm:text-sm md:text-base ${
                      activeTab === "all"
                        ? "bg-blue-500 text-white shadow-md"
                        : "bg-white text-gray-700 border border-gray-300 hover:border-blue-600 hover:text-blue-600"
                    }`}
                    whileHover={{ y: -3 }}
                    whileTap={{ y: 0 }}
                  >
                    All Platforms
                  </motion.button>
                  {[
                    "LeetCode",
                    "Codeforces",
                    "CodeChef",
                    "AtCoder",
                    "HackerRank",
                  ].map((platform) => (
                    <motion.button
                      key={platform}
                      onClick={() => setActiveTab(platform)}
                      className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all duration-300 text-xs sm:text-sm md:text-base ${
                        activeTab.toLowerCase() === platform.toLowerCase()
                          ? "bg-blue-500 text-white shadow-md"
                          : "bg-white text-gray-700 border border-gray-300 hover:border-blue-600 hover:text-blue-600"
                      }`}
                      whileHover={{ y: -3 }}
                      whileTap={{ y: 0 }}
                    >
                      {platform}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {loading ? (
                <div className="text-center py-12 sm:py-16 md:py-20">
                  <motion.div
                    className="inline-block w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-600 border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1.5,
                      ease: "linear",
                      repeat: Infinity,
                    }}
                  ></motion.div>
                  <p className="mt-4 sm:mt-6 text-base sm:text-lg text-gray-600">
                    Loading upcoming contests...
                  </p>
                </div>
              ) : (
                <div className="carousel-container relative max-w-5xl mx-auto">
                  {filteredContests.length > 0 ? (
                    <div className="relative h-[340px] sm:h-[380px] md:h-[420px] flex justify-center items-center">
                      {/* Contest Carousel */}
                      <AnimatePresence
                        initial={false}
                        custom={direction}
                        mode="wait"
                      >
                        <motion.div
                          key={currentContestIndex}
                          custom={direction}
                          variants={slideVariants}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          className="absolute w-full max-w-3xl mx-auto px-4 sm:px-6"
                        >
                          {/* Contest Card */}
                          <div className="flex justify-center">
                            <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 md:p-10 border-2 border-gray-200 w-full max-w-3xl relative overflow-hidden">
                              <div className="absolute top-0 left-0 w-full h-2 gradient-bg"></div>

                              {filteredContests.length > 0 &&
                              currentContestIndex < filteredContests.length ? (
                                <>
                                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
                                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 pr-0 sm:pr-4 break-words">
                                      {
                                        filteredContests[currentContestIndex]
                                          .name
                                      }
                                    </h3>
                                    <span
                                      className={`px-3 sm:px-5 py-1.5 sm:py-2 text-white text-xs sm:text-sm font-bold rounded-full whitespace-nowrap ${getPlatformColor(
                                        filteredContests[currentContestIndex]
                                          .platform
                                      )}`}
                                    >
                                      {
                                        filteredContests[currentContestIndex]
                                          .platform
                                      }
                                    </span>
                                  </div>

                                  <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                                    <div className="space-y-3 sm:space-y-4">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                            className="text-blue-600"
                                          >
                                            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V9h14v10zM5 7V5h14v2H5z" />
                                          </svg>
                                        </div>
                                        <div>
                                          <p className="text-xs sm:text-sm text-gray-500">
                                            Date
                                          </p>
                                          <p className="font-semibold text-gray-800 text-sm sm:text-base">
                                            {
                                              filteredContests[
                                                currentContestIndex
                                              ].date
                                            }
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                            className="text-blue-600"
                                          >
                                            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                                          </svg>
                                        </div>
                                        <div>
                                          <p className="text-xs sm:text-sm text-gray-500">
                                            Time
                                          </p>
                                          <p className="font-semibold text-gray-800 text-sm sm:text-base">
                                            {
                                              filteredContests[
                                                currentContestIndex
                                              ].time
                                            }
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="space-y-3 sm:space-y-4">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                            className="text-blue-600"
                                          >
                                            <path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42C16.07 4.74 14.12 4 12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
                                          </svg>
                                        </div>
                                        <div>
                                          <p className="text-xs sm:text-sm text-gray-500">
                                            Duration
                                          </p>
                                          <p className="font-semibold text-gray-800 text-sm sm:text-base">
                                            {
                                              filteredContests[
                                                currentContestIndex
                                              ].duration
                                            }
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                            className="text-blue-600"
                                          >
                                            <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" />
                                          </svg>
                                        </div>
                                        <div>
                                          <p className="text-xs sm:text-sm text-gray-500">
                                            Status
                                          </p>
                                          <div className="flex items-center">
                                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                            <p className="font-semibold text-gray-800 text-sm sm:text-base">
                                              Upcoming
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {filteredContests[currentContestIndex]
                                    .url && (
                                    <div className="flex justify-center">
                                      <motion.a
                                        href={
                                          filteredContests[currentContestIndex]
                                            .url
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-5 sm:px-8 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm sm:text-lg shadow-md transition-colors flex items-center gap-2"
                                        whileHover={{
                                          scale: 1.05,
                                          boxShadow:
                                            "0px 8px 15px rgba(59, 130, 246, 0.3)",
                                        }}
                                        whileTap={{ scale: 0.97 }}
                                      >
                                        Register Now
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="16"
                                          height="16"
                                          viewBox="0 0 24 24"
                                          fill="currentColor"
                                        >
                                          <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z" />
                                        </svg>
                                      </motion.a>
                                    </div>
                                  )}

                                  {/* Contest Counter */}
                                  <div className="flex justify-center mt-6 sm:mt-8">
                                    <div className="flex gap-1 sm:gap-1.5">
                                      {filteredContests.map((_, i) => (
                                        <motion.div
                                          key={i}
                                          className={`w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full ${
                                            i === currentContestIndex
                                              ? "bg-blue-600"
                                              : "bg-gray-300"
                                          }`}
                                          whileHover={{ scale: 1.5 }}
                                          animate={{
                                            scale:
                                              i === currentContestIndex
                                                ? 1.2
                                                : 1,
                                          }}
                                        ></motion.div>
                                      ))}
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <div className="py-12 text-center text-gray-500">
                                  <p>Loading contest information...</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      </AnimatePresence>

                      {/* Navigation buttons */}
                      {filteredContests.length > 1 && (
                        <>
                          <motion.button
                            className="absolute left-1 sm:left-4 md:left-8 transform -translate-y-1/2 top-1/2 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-white shadow-lg flex items-center justify-center border border-gray-200 z-10"
                            onClick={handlePrevContest}
                            whileHover={{
                              scale: 1.1,
                              boxShadow: "0px 8px 15px rgba(0, 0, 0, 0.1)",
                            }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="text-gray-700"
                            >
                              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                            </svg>
                          </motion.button>

                          <motion.button
                            className="absolute right-1 sm:right-4 md:right-8 transform -translate-y-1/2 top-1/2 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-white shadow-lg flex items-center justify-center border border-gray-200 z-10"
                            onClick={handleNextContest}
                            whileHover={{
                              scale: 1.1,
                              boxShadow: "0px 8px 15px rgba(0, 0, 0, 0.1)",
                            }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="text-gray-700"
                            >
                              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                            </svg>
                          </motion.button>
                        </>
                      )}
                    </div>
                  ) : (
                    <motion.div
                      className="text-center py-12 sm:py-16 text-gray-600 bg-white rounded-xl border border-gray-200"
                      variants={fadeInUpVariants}
                    >
                      <svg
                        className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M0 0h24v24H0V0z" fill="none" />
                        <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />
                      </svg>
                      <p className="font-semibold text-lg sm:text-xl mb-2">
                        No upcoming contests found for {activeTab}.
                      </p>
                      <p className="text-sm sm:text-base">
                        Please check back later or select another platform.
                      </p>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Additional info about contests */}
              {filteredContests.length > 0 && (
                <motion.div
                  className="text-center mt-8 sm:mt-12"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <p className="text-sm sm:text-base text-gray-600 px-4 mt-14">
                    Stay ahead of the competition by setting up personalized
                    reminders for your favorite platforms.
                  </p>
                  <motion.button
                    className="mt-3 sm:mt-4 px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors text-sm sm:text-base"
                    whileHover={{ y: -3 }}
                    onClick={openSignInModal}
                  >
                    View All Contests
                  </motion.button>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Testimonials Section */}
          <motion.div
            id="testimonials"
            className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 bg-white"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-10 sm:mb-16">
                <motion.h2
                  className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4"
                  variants={fadeInUpVariants}
                >
                  What Developers Are Saying
                </motion.h2>
                <motion.p
                  className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto"
                  variants={fadeInUpVariants}
                >
                  Join thousands of developers who have transformed their coding
                  journey
                </motion.p>
              </div>

              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8"
                variants={containerVariants}
              >
                <motion.div
                  className="bg-white p-6 sm:p-8 rounded-xl shadow-md border border-gray-200"
                  variants={itemVariants}
                  whileHover={cardVariants.hover}
                >
                  <div className="flex items-center mb-4 sm:mb-6">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full mr-3 sm:mr-4 flex items-center justify-center font-bold text-blue-600 text-sm sm:text-base">
                      BR
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm sm:text-base">
                        Balaji 
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600">
                        Software Engineer at Zoho
                      </div>
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-gray-700 mb-4">
                    "CodeTrack Pro completely transformed my competitive
                    programming journey. The unified dashboard saves me hours
                    each week, and the analytics helped me identify weaknesses I
                    didn't know I had."
                  </p>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  className="bg-white p-6 sm:p-8 rounded-xl shadow-md border border-gray-200"
                  variants={itemVariants}
                  whileHover={cardVariants.hover}
                >
                  <div className="flex items-center mb-4 sm:mb-6">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full mr-3 sm:mr-4 flex items-center justify-center font-bold text-purple-600 text-sm sm:text-base">
                      PM
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm sm:text-base">
                        Praveen Mohan
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600">
                        CS Student at Stanford
                      </div>
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-gray-700 mb-4">
                    "The AI profile summary feature helped me showcase my coding
                    achievements to recruiters in a way that stood out. I
                    received interview calls from 3 FAANG companies within a
                    month!"
                  </p>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  className="bg-white p-6 sm:p-8 rounded-xl shadow-md border border-gray-200 sm:col-span-2 md:col-span-1"
                  variants={itemVariants}
                  whileHover={cardVariants.hover}
                >
                  <div className="flex items-center mb-4 sm:mb-6">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full mr-3 sm:mr-4 flex items-center justify-center font-bold text-green-600 text-sm sm:text-base">
                      H
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm sm:text-base">
                        Harish
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600">
                        Senior Developer at MindTree
                      </div>
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-gray-700 mb-4">
                    "I love the contest calendar and reminders. I've
                    participated in twice as many competitions this year and
                    climbed from Pupil to Candidate Master on Codeforces. The
                    analytics are simply game-changing."
                  </p>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 bg-gray-50"
            variants={fadeInUpVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            <div className="max-w-5xl mx-auto">
              <motion.div
                className="relative bg-blue-500 rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-12 text-center overflow-hidden shadow-xl"
                variants={itemVariants}
              >
                <div className="relative z-10">
                  <motion.h2
                    className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    viewport={{ once: true }}
                  >
                    Ready to Level Up Your Coding Career?
                  </motion.h2>
                  <motion.p
                    className="text-base sm:text-lg md:text-xl text-white/90  sm:mb-8 md:mb-10 max-w-2xl mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    viewport={{ once: true }}
                  >
                    Join thousands of developers who have transformed their
                    coding journey with our all-in-one platform.
                  </motion.p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </main>

        {/* Footer */}
       <motion.footer
      className="border-t border-gray-200 py-12 sm:py-16 px-4 sm:px-6 bg-white relative overflow-hidden"
      variants={footerVariants}
      initial="hidden"
      whileInView="show" // Animation triggers when the footer is in view
      viewport={{ once: true, amount: 0.2 }}
    >
      {/* Animated gradient border */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.5, ease: "circOut", delay: 0.2 }}
        style={{ transformOrigin: "center" }}
      />

      <div className="max-w-7xl mx-auto">
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 mb-8 md:mb-12"
          variants={footerVariants}
        >
          {/* Brand Column */}
          <motion.div
            className="col-span-2 sm:col-span-2 md:col-span-1"
            variants={columnVariants}
          >
            <div className="flex items-center space-x-2 mb-4 sm:mb-5">
              <motion.div
                className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs sm:text-base shadow-lg"
                whileHover={{ scale: 1.1, rotate: -10 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                CT
              </motion.div>
              <span className="text-lg sm:text-xl font-bold text-gray-900">
                CodeTrack<span className="text-blue-600">Pro</span>
              </span>
            </div>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              Empowering developers to track and grow their coding careers
              through unified analytics and insights.
            </p>
            <motion.div
              className="flex space-x-3 sm:space-x-4"
              variants={socialIconContainerVariants}
            >
              {socialLinks.map((social) => (
                <motion.a
                  key={social.name}
                  href={social.href}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                  whileHover={{ y: -4, scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  variants={socialIconVariants}
                  aria-label={social.name}
                >
                  {social.icon}
                </motion.a>
              ))}
            </motion.div>
          </motion.div>

          {/* Product Column */}
          <motion.div variants={columnVariants}>
            <h4 className="font-bold text-gray-900 mb-3 sm:mb-5 text-base sm:text-lg">
              For Students
            </h4>
            <motion.ul
              className="space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-600"
              variants={linkListVariants}
            >
              {[ "Dashboard", "LeaderBoard", "Messenger", "Activity"].map((link) => (
                <motion.li key={link} variants={linkItemVariants}>
                  <motion.a href="#" className="flex items-center group hover:text-blue-600 transition-colors" whileHover={{x: 5}}>
                    <ArrowRight className="w-3 h-3 mr-2 text-blue-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"/>
                    {link}
                  </motion.a>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>

          {/* Company Column */}
          <motion.div variants={columnVariants}>
            <h4 className="font-bold text-gray-900 mb-3 sm:mb-5 text-base sm:text-lg">
              For Admin
            </h4>
            <motion.ul
              className="space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-600"
              variants={linkListVariants}
            >
              {["Portal", "Chat Management", "User Analytics", "Scraping Status"].map((link) => (
                 <motion.li key={link} variants={linkItemVariants}>
                  <motion.a href="#" className="flex items-center group hover:text-blue-600 transition-colors" whileHover={{x: 5}}>
                    <ArrowRight className="w-3 h-3 mr-2 text-blue-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"/>
                    {link}
                  </motion.a>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>

          {/* Resources Column */}
          <motion.div variants={columnVariants}>
            <h4 className="font-bold text-gray-900 mb-3 sm:mb-5 text-base sm:text-lg">
              Resources
            </h4>
            <motion.ul
              className="space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-600"
              variants={linkListVariants}
            >
              {["Documentation", "Help Center", "Community", "Contact"].map((link) => (
                 <motion.li key={link} variants={linkItemVariants}>
                  <motion.a href="#" className="flex items-center group hover:text-blue-600 transition-colors" whileHover={{x: 5}}>
                    <ArrowRight className="w-3 h-3 mr-2 text-blue-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"/>
                    {link}
                  </motion.a>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div
          className="border-t border-gray-200 pt-6 sm:pt-8 flex flex-col md:flex-row justify-between items-center text-xs sm:text-sm text-gray-600"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <p>&copy; 2025 CodeTrack Pro. All rights reserved.</p>
          <div className="flex space-x-4 sm:space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-blue-600 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-blue-600 transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-blue-600 transition-colors">
              Cookie Policy
            </a>
          </div>
        </motion.div>
      </div>
    </motion.footer>
      </div>
    </ErrorBoundary>
  );
};

export default LandingPage;
