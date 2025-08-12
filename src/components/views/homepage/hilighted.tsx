"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { Shield, CreditCard, Users, Zap, CheckCircle } from "lucide-react";
import { fadeInUp, scaleOnHover, staggerContainer } from "@/lib/motion-variant";
import GridPattern from "@/components/ui/grid-pattern";

import { ConnectButton } from "@xellar/kit";
import { useRouter } from "next/navigation";

export default function HilightedSection() {
  const useCasesRef = useRef(null);

  const useCasesInView = useInView(useCasesRef, {
    once: true,
    margin: "-100px",
  });
  const router = useRouter();

  return (
    <section className="w-full max-w-6xl mx-auto bg-white min-h-[400px] rounded-tr-4xl rounded-bl-4xl border-2 border-shadow shadow-shadow relative overflow-hidden my-12">
      <GridPattern />
      {/* Decorative elements */}
      <motion.div
        className="absolute top-0 right-0 w-32 h-32 bg-main/5 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      <div className="p-6 md:p-8 lg:p-12 relative z-10">
        {/* Use Cases Section - Simplified */}
        <motion.div
          ref={useCasesRef}
          className="mb-16"
          initial="initial"
          animate={useCasesInView ? "animate" : "initial"}
          variants={staggerContainer}
        >
          <motion.div className="text-center mb-16" variants={fadeInUp}>
            <motion.h2
              className="text-3xl lg:text-4xl font-bold mb-4 text-main"
              whileInView={{ scale: [0.9, 1] }}
              transition={{ duration: 0.5 }}
            >
              Perfect For
            </motion.h2>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 gap-8"
            variants={staggerContainer}
          >
            {[
              {
                icon: Users,
                title: "Content Creators",
                items: [
                  "Sell exclusive content",
                  "Monetize tutorials",
                  "Offer premium access",
                ],
                color: "text-blue-600",
                bgColor: "bg-blue-50",
              },
              {
                icon: CreditCard,
                title: "Freelancers",
                items: [
                  "Sell digital services",
                  "Offer consultations",
                  "Deliver work products",
                ],
                color: "text-green-600",
                bgColor: "bg-green-50",
              },
            ].map((useCase, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-2 border-border shadow-lg hover:shadow-xl transition-all duration-300 h-full group">
                  <CardContent className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <motion.div
                        className={`p-4 ${useCase.bgColor} rounded-xl group-hover:scale-110 transition-transform duration-300`}
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        <useCase.icon className={`w-8 h-8 ${useCase.color}`} />
                      </motion.div>
                      <h3 className="font-bold text-2xl group-hover:text-main transition-colors duration-300">
                        {useCase.title}
                      </h3>
                    </div>
                    <ul className="space-y-3">
                      {useCase.items.map((item, itemIndex) => (
                        <motion.li
                          key={itemIndex}
                          className="flex items-center gap-3 text-foreground/80"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * itemIndex }}
                        >
                          <motion.div
                            whileHover={{ scale: 1.2 }}
                            transition={{ duration: 0.2 }}
                          >
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                          </motion.div>
                          <span className="leading-relaxed">{item}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Why Relynk Section - Simplified */}
        <motion.div
          className="mb-20"
          initial="initial"
          whileInView="animate"
          variants={staggerContainer}
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div className="text-center mb-16" variants={fadeInUp}>
            <motion.h2
              className="text-3xl lg:text-4xl font-bold mb-4 text-main"
              whileInView={{ scale: [0.9, 1] }}
              transition={{ duration: 0.5 }}
            >
              Why Relynk?
            </motion.h2>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 gap-8"
            variants={staggerContainer}
          >
            {[
              {
                icon: Shield,
                title: "No Middleman",
                description:
                  "Direct payments to your wallet. You own your store and control your fees.",
                color: "text-red-600",
                bgColor: "bg-red-50",
              },
              {
                icon: Zap,
                title: "Instant Setup",
                description:
                  "Create payment links in minutes. No KYC or lengthy verification processes.",
                color: "text-yellow-600",
                bgColor: "bg-yellow-50",
              },
            ].map((benefit, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-2 border-border shadow-lg group hover:shadow-xl transition-all duration-300 h-full">
                  <CardContent className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <motion.div
                        className={`p-4 ${benefit.bgColor} rounded-xl group-hover:scale-110 transition-transform duration-300`}
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        <benefit.icon className={`w-8 h-8 ${benefit.color}`} />
                      </motion.div>
                      <h3 className="font-bold text-2xl group-hover:text-main transition-colors duration-300">
                        {benefit.title}
                      </h3>
                    </div>
                    <p className="text-foreground/80 leading-relaxed">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Enhanced CTA Section */}
        <motion.div
          className="text-center relative"
          initial="initial"
          whileInView="animate"
          variants={staggerContainer}
          viewport={{ once: true }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-main/5 to-purple-500/5 rounded-3xl"
            variants={fadeInUp}
          />
          <motion.div className="relative z-10 p-8 md:p-12" variants={fadeInUp}>
            <motion.h2
              className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-main to-purple-600 bg-clip-text text-transparent"
              whileInView={{ scale: [0.9, 1] }}
              transition={{ duration: 0.5 }}
            >
              Ready to Start Earning?
            </motion.h2>
            <motion.p
              className="text-lg md:text-xl text-foreground/80 mb-12 max-w-3xl mx-auto leading-relaxed"
              variants={fadeInUp}
            >
              Join thousands of creators who are already monetizing their
              content with Relynk. Create your first payment link in minutes.
            </motion.p>
            <motion.div
              className="flex items-center gap-6 justify-center flex-wrap"
              variants={fadeInUp}
            >
              <motion.div {...scaleOnHover}>
                <ConnectButton.Custom>
                  {({ isConnected, openConnectModal }) => (
                    <Button 
                      className="bg-main text-white hover:bg-main/90 text-xl px-12 py-6 shadow-xl"
                      onClick={() => {
                        if (isConnected) {
                          router.push("/dashboard");
                        } else {
                          openConnectModal();
                        }
                      }}
                    >
                      <motion.span
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        Get Started Now
                      </motion.span>
                    </Button>
                  )}
                </ConnectButton.Custom>
              </motion.div>
              <motion.div {...scaleOnHover}>
                <Button
                  variant="neutral"
                  className="text-xl px-12 py-6 border-2 border-main/20 shadow-main"
                  onClick={() => {
                    const howItWorksSection =
                      document.querySelector("#how-it-works");
                    if (howItWorksSection) {
                      howItWorksSection.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                >
                  Learn More
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
