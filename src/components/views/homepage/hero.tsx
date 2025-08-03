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
import { useRef } from "react";

export default function HeroSection() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll();

  const heroInView = useInView(heroRef, { once: true, margin: "-100px" });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  return (
    <section className="relative min-h-[600px] lg:min-h-[700px] flex flex-col pt-[calc(4rem+40px)] pb-20 items-center overflow-hidden">
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
              Create. Share.
              <br />
              Get Paid.
              <br />
              <span className="text-6xl">
                All{" "}
                <motion.span
                  className="text-main relative"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  Onchain
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

          <motion.p
            className="text-lg md:text-xl text-foreground/80 max-w-3xl mx-auto leading-relaxed"
            variants={fadeInUp}
          >
            <motion.span
              className="font-bold text-main"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              Relynk
            </motion.span>{" "}
            is a Web3-native monetization tool for creators, freelancers, and
            digital hustlers.
            <br />
            Create payment links, sell digital products, and unlock content
            access — all without Web2 gatekeepers.
          </motion.p>
        </motion.div>

        <motion.div className="relative group w-full mt-16" variants={fadeInUp}>
          {/* Enhanced Demo Cards with better animations */}
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
                        relynk.app/template123
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
                        relynk.app/tip456
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
                        relynk.app/tip456
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

        <motion.div
          className="flex items-center mt-20 gap-8 justify-center flex-wrap"
          variants={fadeInUp}
        >
          <motion.div {...scaleOnHover}>
            <Button
              className="bg-main text-white hover:bg-main/90 text-lg px-10 py-5 shadow-xl"
              onClick={() => (window.location.href = "/dashboard/links/create")}
            >
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Create Your Link
              </motion.span>
            </Button>
          </motion.div>
          <motion.div {...scaleOnHover}>
            <Button
              variant="neutral"
              className="text-lg px-10 py-5 border-2 border-main/20 shadow-main/20! shadow-sm"
              onClick={() => (window.location.href = "/dashboard")}
            >
              View Dashboard
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
