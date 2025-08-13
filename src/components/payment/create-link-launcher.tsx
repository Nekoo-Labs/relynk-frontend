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
import { Zap, Gift, ShoppingBag, FileText, Plus, X } from "lucide-react";

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
        <DialogContent className="max-w-[95vw] max-h-[85vh] sm:max-w-2xl md:max-w-3xl p-3 sm:p-6 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
          <DialogHeader className="space-y-2 pb-4 relative">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-0 top-0 p-2 rounded-lg hover:bg-secondary/80 transition-colors sm:hidden"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </button>
            <DialogTitle className="text-xl sm:text-2xl font-bold text-foreground pr-8 sm:pr-0">
              Select your payment type
            </DialogTitle>
            <DialogDescription className="text-sm text-foreground/70">
              Create your payment in 3 easy steps
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 max-h-[55vh] overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent p-1">
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
    className="group w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-main focus:ring-offset-2 disabled:opacity-60"
  >
    <Card className="relative overflow-hidden rounded-lg border-2 border-border/80 bg-secondary-background/40 transition-all duration-200 transform group-hover:-translate-y-0.5 group-hover:border-main/50 group-hover:shadow-lg group-active:scale-95">
      <div className="flex flex-col items-center justify-center p-3 sm:p-4 min-h-[110px] sm:min-h-[130px]">
        {/* Icon */}
        <div className="flex items-center justify-center mb-2 sm:mb-3">
          <div className="flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-lg sm:rounded-xl border border-border bg-background text-main group-hover:text-main/80 transition-colors">
            <div className="h-5 w-5 sm:h-7 sm:w-7">{icon}</div>
          </div>
        </div>

        {/* Text content */}
        <div className="text-center space-y-0.5 sm:space-y-1">
          <div className="text-xs sm:text-sm font-semibold text-foreground leading-tight">{title}</div>
          <div className="text-[10px] sm:text-xs text-foreground/70 leading-tight px-1">{description}</div>
        </div>
      </div>
    </Card>
  </button>
);

export default CreateLinkLauncher;
