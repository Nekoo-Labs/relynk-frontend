"use client";

import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { CreateLinkForm } from "@/components/create-link-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function CreateLinkPage() {
  const router = useRouter();

  const handleSuccess = (linkId: string) => {
    toast.success("Payment link created successfully! 🎉", {
      description: `Link ID: ${linkId}`,
      duration: 5000,
    });
    // router.push(`/dashboard/links?created=${linkId}`);
  };

  const handleCancel = () => {
    router.push("/dashboard/links");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <Link href="/dashboard/links">
            <Button
              variant="neutral"
              size="sm"
              className="border border-border shadow-shadow"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Links
            </Button>
          </Link>
          <div className="sr-only">
            <h1 className="text-3xl font-heading text-foreground">
              🔗 Create New Payment Link
            </h1>
            <p className="text-foreground/60 mt-1">
              Create secure payment links for payments, donations, products, and
              content access.
            </p>
          </div>
        </div>

        {/* Create Link Form */}
        <CreateLinkForm onSuccess={handleSuccess} />
      </div>
    </DashboardLayout>
  );
}
