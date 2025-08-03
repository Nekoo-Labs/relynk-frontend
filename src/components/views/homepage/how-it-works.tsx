"use client";

import { fadeInUp, staggerContainer } from "@/lib/motion-variant";
import { CreditCard, Download, FileText, Globe, Wallet } from "lucide-react";
import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function HowItWorksSection() {
  const howItWorksRef = useRef(null);

  const howItWorksInView = useInView(howItWorksRef, {
    once: true,
    margin: "-100px",
  });

  return (
    <section id="how-it-works" className="w-full py-24 bg-white relative overflow-hidden">
      <motion.div
        className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 5, repeat: Infinity }}
      />

      <div className="max-w-6xl mx-auto px-6 md:px-8 lg:px-12 relative z-10">
        <motion.div
          ref={howItWorksRef}
          initial="initial"
          animate={howItWorksInView ? "animate" : "initial"}
          variants={staggerContainer}
        >
          <motion.div className="text-center mb-20" variants={fadeInUp}>
            <motion.h2
              className="text-4xl lg:text-5xl font-bold mb-4 text-main"
              whileInView={{ scale: [0.9, 1] }}
              transition={{ duration: 0.5 }}
            >
              How It Works
            </motion.h2>
            <motion.p
              className="text-lg text-gray-600 mt-6 max-w-2xl mx-auto"
              variants={fadeInUp}
            >
              From creation to payment in just 5 simple steps
            </motion.p>
          </motion.div>

          {/* Bento Grid Layout */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-8"
            variants={staggerContainer}
          >
            {/* Step 1 - Large card */}
            <motion.div
              className="md:col-span-2 lg:col-span-2"
              variants={fadeInUp}
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="border-2 border-blue-200 shadow-blue-200 group hover:shadow-xl transition-all duration-300 h-full bg-gradient-to-br from-blue-50 to-blue-100">
                  <CardContent className="p-10 text-center h-full flex flex-col justify-center">
                    <motion.div
                      className="w-20 h-20 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Wallet className="w-10 h-10 text-white" />
                    </motion.div>
                    <h3 className="font-bold mb-4 text-2xl group-hover:text-blue-600 transition-colors duration-300">
                      1. Login
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      Connect via wallet or social login (Gmail, Telegram) for
                      instant access
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Step 2 - Large card */}
            <motion.div
              className="md:col-span-2 lg:col-span-2"
              variants={fadeInUp}
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="h-full"
              >
                <Card className="border-2 border-green-200 shadow-green-200 group hover:shadow-xl transition-all duration-300 h-full bg-gradient-to-br from-green-50 to-green-100">
                  <CardContent className="p-10 text-center h-full flex flex-col justify-center">
                    <motion.div
                      className="w-20 h-20 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <FileText className="w-10 h-10 text-white" />
                    </motion.div>
                    <h3 className="font-bold mb-4 text-2xl group-hover:text-green-600 transition-colors duration-300">
                      2. Create
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      Upload your digital product, set price, and add
                      description
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Step 3 - Large card */}
            <motion.div
              className="md:col-span-2 lg:col-span-2"
              variants={fadeInUp}
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="h-full"
              >
                <Card className="border-2 border-purple-200 shadow-purple-200 group hover:shadow-xl transition-all duration-300 h-full bg-gradient-to-br from-purple-50 to-purple-100">
                  <CardContent className="p-10 text-center h-full flex flex-col justify-center">
                    <motion.div
                      className="w-20 h-20 bg-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Globe className="w-10 h-10 text-white" />
                    </motion.div>
                    <h3 className="font-bold mb-4 text-2xl group-hover:text-purple-600 transition-colors duration-300">
                      3. Share
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      Share your payment link across social media and platforms
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Step 4 - Wide card */}
            <motion.div
              className="md:col-span-2 lg:col-span-3"
              variants={fadeInUp}
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="border-2 border-orange-200 shadow-orange-200 group hover:shadow-xl transition-all duration-300 h-full bg-gradient-to-br from-orange-50 to-orange-100">
                  <CardContent className="p-10 text-center h-full flex flex-col justify-center">
                    <motion.div
                      className="w-20 h-20 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <CreditCard className="w-10 h-10 text-white" />
                    </motion.div>
                    <h3 className="font-bold mb-4 text-2xl group-hover:text-orange-600 transition-colors duration-300">
                      4. Customer Pays
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      Buyer connects wallet and pays with supported tokens (USDC,
                      USDT, IDRX)
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Step 5 - Wide card */}
            <motion.div
              className="md:col-span-2 lg:col-span-3"
              variants={fadeInUp}
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="border-2 border-teal-200 shadow-teal-200 group hover:shadow-xl transition-all duration-300 h-full bg-gradient-to-br from-teal-50 to-teal-100">
                  <CardContent className="p-10 text-center h-full flex flex-col justify-center">
                    <motion.div
                      className="w-20 h-20 bg-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Download className="w-10 h-10 text-white" />
                    </motion.div>
                    <h3 className="font-bold mb-4 text-2xl group-hover:text-teal-600 transition-colors duration-300">
                      5. Instant Access
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      Content delivered automatically or access granted
                      instantly
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
