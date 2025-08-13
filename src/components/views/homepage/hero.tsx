"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import GridPattern from "@/components/ui/grid-pattern";
import {
  fadeInUp,
  floatingAnimation,
  scaleOnHover,
  staggerContainer,
} from "@/lib/motion-variant";
import {
  CreditCard,
  FileText,
  MousePointer,
  Star,
  TrendingUp,
} from "lucide-react";
import { motion, useTransform, useInView, useScroll } from "motion/react";
import { useRef, useState } from "react";

import { ConnectButton } from "@xellar/kit";
import { useRouter } from "next/navigation";

export default function HeroSection() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const [username, setUsername] = useState("");

  const router = useRouter();

  const heroInView = useInView(heroRef, { once: true, margin: "-100px" });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  const handleUsernameChange = (value: string) => {
    // Only allow alphanumeric characters and hyphens, convert to lowercase
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setUsername(sanitized);
  };



  return (
    <section className="relative min-h-[600px] lg:min-h-[700px] flex flex-col pt-[calc(4rem+40px)] pb-20 items-center overflow-hidden mt-8">
      <motion.div style={{ y }} className="absolute inset-0">
        <GridPattern className="opacity-30 z-[-1]" />
      </motion.div>

      <motion.div
        ref={heroRef}
        className="relative max-w-4xl mx-auto px-6 md:px-8 lg:px-12 z-10"
        initial="initial"
        animate={heroInView ? "animate" : "initial"}
        variants={staggerContainer}
      >
        <motion.div className="space-y-8 text-center" variants={fadeInUp}>
          <motion.div className="relative">
            <motion.h1
              className="text-5xl lg:text-7xl font-bold relative leading-tight"
              variants={fadeInUp}
            >
               The Future of
              <br />
              <span className="text-6xl">
                <motion.span
                  className="text-main relative"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  Creator Economy.
                  <motion.div
                    className="absolute -top-2 -right-2"
                    variants={floatingAnimation}
                  >
                    <Star className="w-6 h-6 text-yellow-400 fill-current" />
                  </motion.div>
                </motion.span>
              </span>
            </motion.h1>
            <motion.div
              className="absolute right-0 top-4 text-main"
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
              }}
            >
              <MousePointer className="w-8 h-8" />
            </motion.div>
          </motion.div>

          <motion.h2 className="text-lg md:text-xl text-foreground/80 max-w-3xl mx-auto leading-relaxed">
            <motion.span
              className="font-bold text-main"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              All-in-one Web3 platform for creators to sell, share, and get paid with full ownership.
            </motion.span>{" "}
          </motion.h2>
        </motion.div>

        <motion.div className="relative group w-full mt-16" variants={fadeInUp}>
          <motion.div
            className="relative"
            whileHover="hover"
            initial="rest"
            animate="rest"
          >
            <motion.div
              variants={{
                rest: { rotate: 0, scale: 1 },
                hover: { scale: 1.25 },
              }}
              transition={{ duration: 0.3 }}
            >
              <Card className="w-full max-w-xs gap-2 mx-auto bg-white shadow-xl border-2 border-main/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-4 text-lg">
                    <motion.div
                      className="p-3 bg-main/10 rounded-lg"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <FileText className="w-5 h-5 text-main" />
                    </motion.div>
                    Notion Template
                    <motion.div
                      className="ml-auto"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    </motion.div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1 w-full">
                      <motion.p
                        className="text-sm text-gray-600 font-medium"
                        whileHover={{ scale: 1.05 }}
                      >
                        Price: $25 USDC
                      </motion.p>
                      <motion.code
                        className="text-xs text-gray-500 p-2 bg-gray-100/50 rounded-md block w-full"
                        whileHover={{ backgroundColor: "rgb(243 244 246)" }}
                      >
                        rely.ink/notion-template
                      </motion.code>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <motion.div {...scaleOnHover} className="ml-auto">
                    <Button className="bg-main text-white hover:bg-main/90 shadow-lg px-6 py-3">
                      Buy Now
                    </Button>
                  </motion.div>
                </CardFooter>
              </Card>
            </motion.div>

            <motion.div
              className="absolute top-0 -translate-x-1/2 left-1/2 z-[-1]"
              variants={{
                rest: { rotate: -8, scale: 0.95, x: "-40%" },
                hover: { rotate: -8, scale: 1, x: "-60%" },
              }}
              transition={{ duration: 0.3 }}
            >
              <Card className="w-full gap-2 max-w-xs min-w-[240px] bg-white shadow-blue-200 border-2 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-4 text-lg">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                    </div>
                    Payment Link
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6">
                  <div className="flex justify-between items-center">
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600 font-medium">
                        Tip: Any amount
                      </p>
                      <code className="text-xs text-gray-500 p-3 bg-gray-100/50 rounded-md block">
                        rely.ink/tip456
                      </code>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <motion.div {...scaleOnHover} className="ml-auto">
                    <Button className="bg-main text-white hover:bg-main/90 shadow-lg px-6 py-3">
                      Buy Now
                    </Button>
                  </motion.div>
                </CardFooter>
              </Card>
            </motion.div>
            <motion.div
              className="absolute top-0 -translate-x-1/2 left-1/2 z-[-2] scale-105"
              variants={{
                rest: { rotate: 12, scale: 0.95, x: "25%" },
                hover: { scale: 1, x: "40%" },
              }}
              transition={{ duration: 0.3 }}
            >
              <Card className="w-full gap-2 max-w-xs min-w-[240px] bg-white shadow-green-200 border-2 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-4 text-lg">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                    </div>
                    Payment Link
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6">
                  <div className="flex justify-between items-center">
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600 font-medium">
                        Tip: Any amount
                      </p>
                      <code className="text-xs text-gray-500 p-3 bg-gray-100/50 rounded-md block">
                        rely.ink/tip456
                      </code>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <motion.div {...scaleOnHover} className="ml-auto">
                    <Button className="bg-main text-white hover:bg-main/90 shadow-lg px-6 py-3">
                      Buy Now
                    </Button>
                  </motion.div>
                </CardFooter>
              </Card>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Username Call-to-Action Section */}
        <motion.div
          className="relative mt-20 mb-20 text-center px-6"
          variants={fadeInUp}
        >
          <motion.div
            className="flex flex-col items-center space-y-8 max-w-2xl mx-auto"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            {/* Decorative diamond */}
            <motion.div
              animate={{
                rotate: [0, 180, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="mb-4"
            >
              <div className="w-4 h-4 bg-main rotate-45 rounded-sm"></div>
            </motion.div>

            {/* Main Text */}
            <motion.div className="space-y-4" variants={fadeInUp}>
              <motion.h3
                className="text-4xl lg:text-5xl font-bold text-foreground/80"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                Claim your
              </motion.h3>
              <motion.h3
                className="text-5xl lg:text-6xl font-bold text-main"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                digital identity
              </motion.h3>
              <motion.p
                className="text-xl text-foreground/60 max-w-lg mx-auto leading-relaxed"
                variants={fadeInUp}
              >
                Get your personalized rely.ink link and start earning today
              </motion.p>
            </motion.div>

            {/* Username Input Section */}
            <motion.div
              className="w-full max-w-2xl mx-auto"
              variants={fadeInUp}
            >
              <motion.div
                className="bg-white rounded-3xl p-3 shadow-2xl border border-main/10"
                whileHover={{
                  boxShadow: "0 25px 50px -12px rgba(209, 100, 156, 0.25)"
                }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-main/10 rounded-2xl px-6 py-4 border border-main/20">
                    <span className="text-main font-bold text-xl">
                      rely.ink/
                    </span>
                  </div>

                  <input
                    type="text"
                    placeholder="your-username"
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    className="flex-1 bg-transparent border-0 outline-none text-foreground font-medium text-xl placeholder:text-foreground/40 px-4 py-4"
                    maxLength={20}
                  />

                  {/* Get Relynk Button */}
                  <ConnectButton.Custom>
                    {({ isConnected, openConnectModal }) => (
                      <Button
                        className="bg-main text-white hover:bg-main/90 text-xl font-semibold px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 min-w-[140px]"
                        onClick={() => {
                          if (isConnected) {
                            if (username.trim()) {
                              router.push(`/dashboard/profile/setup?username=${username}`);
                            } else {
                              router.push("/dashboard/profile/setup");
                            }
                          } else {
                            openConnectModal();
                          }
                        }}
                        disabled={!username.trim() || username.length < 3}
                      >
                        <motion.span
                          animate={{
                            scale: username.length >= 3 ? [1, 1.05, 1] : 1
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          Get Relynk
                        </motion.span>
                      </Button>
                    )}
                  </ConnectButton.Custom>
                </div>
              </motion.div>

              {/* Username validation feedback */}
              <motion.div
                className="mt-4 text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: username.length > 0 ? 1 : 0,
                  y: username.length > 0 ? 0 : 10
                }}
                transition={{ duration: 0.3 }}
              >
                {username.length > 0 && username.length < 3 && (
                  <p className="text-red-500 text-sm font-medium">
                    Username must be at least 3 characters
                  </p>
                )}
                {username.length >= 3 && (
                  <p className="text-green-500 text-sm font-medium">
                    ✓ Username looks good!
                  </p>
                )}
              </motion.div>
            </motion.div>

            {/* Decorative elements */}
            <motion.div
              className="absolute -top-8 -right-8 opacity-60"
              animate={{
                rotate: [0, 360],
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Star className="w-6 h-6 text-yellow-400 fill-current" />
            </motion.div>
            <motion.div
              className="absolute -bottom-6 -left-8 opacity-40"
              animate={{
                rotate: [360, 0],
                scale: [1, 1.3, 1]
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2
              }}
            >
              <Star className="w-4 h-4 text-main fill-current" />
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
