"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Zap, Gift, ShoppingBag, FileText, Plus } from "lucide-react";

type CreateLinkLauncherProps = {
  className?: string;
  size?: React.ComponentProps<typeof Button>["size"];
  variant?: React.ComponentProps<typeof Button>["variant"];
};

function CreateLinkLauncher({
  className,
  size,
  variant,
}: CreateLinkLauncherProps) {
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const goToCreateLink = (
    type: "payment" | "donation" | "product" | "content"
  ) => {
    startTransition(() => {
      router.push(`/dashboard/links/create?type=${type}`);
      setOpen(false);
    });
  };

  return (
    <>
      <Button
        variant={variant || "neutral"}
        size={size || "sm"}
        className={className}
        onClick={() => setOpen(true)}
      >
        <Plus className="h-4 w-4 mr-2" />
        Create Link
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-full sm:max-w-3xl md:max-w-4xl lg:max-w-5xl">
          <DialogHeader>
            <DialogTitle className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Select your payment type
            </DialogTitle>
            <DialogDescription className="text-foreground/70">
              Create your payment in 3 easy steps
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch max-h-[calc(100vh-200px)] overflow-auto py-2">
            <Option
              icon={<Zap className="h-full w-full" />}
              title="Payment Link"
              description="Fixed amount payment"
              onClick={() => goToCreateLink("payment")}
            />
            <Option
              icon={<Gift className="h-full w-full" />}
              title="Donation Link"
              description="Flexible amount donation"
              onClick={() => goToCreateLink("donation")}
            />
            <Option
              icon={<ShoppingBag className="h-full w-full" />}
              title="Product Link"
              description="Product or service sale"
              onClick={() => goToCreateLink("product")}
            />
            <Option
              icon={<FileText className="h-full w-full" />}
              title="Content Link"
              description="Digital content access"
              onClick={() => goToCreateLink("content")}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

const Option = ({
  icon,
  title,
  description,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
  disabled?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="group h-full w-full rounded-xl focus:outline-none focus:ring-2 focus:ring-main focus:ring-offset-2 disabled:opacity-60"
  >
    <Card className="relative h-full overflow-hidden rounded-[20px] border-2 border-border/80 bg-secondary-background/40 transition-all duration-300 transform group-hover:-translate-y-0.5 group-hover:border-main/50">
      <div className="flex h-full flex-col items-center justify-between p-6">
        {/* Top visual */}
        <div className="flex flex-1 items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-background text-main">
            <div className="h-8 w-8">{icon}</div>
          </div>
        </div>

        {/* Bottom pill */}
        <div className="mt-6 w-full rounded-xl border border-border bg-background/80 px-4 py-3 backdrop-blur">
          <div className="text-foreground font-semibold">{title}</div>
          <div className="text-sm text-foreground/70">{description}</div>
        </div>
      </div>
    </Card>
  </button>
);

export default CreateLinkLauncher;
