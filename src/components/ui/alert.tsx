"use client";

import * as React from "react";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AlertProps {
  variant?: "success" | "error" | "warning" | "info";
  title?: string;
  description?: string;
  onClose?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
  className?: string;
  children?: React.ReactNode;
}

const alertVariants = {
  success: {
    container: "bg-green-50 border-green-200 text-green-800",
    icon: CheckCircle,
    iconColor: "text-green-500",
  },
  error: {
    container: "bg-red-50 border-red-200 text-red-800",
    icon: XCircle,
    iconColor: "text-red-500",
  },
  warning: {
    container: "bg-yellow-50 border-yellow-200 text-yellow-800",
    icon: AlertCircle,
    iconColor: "text-yellow-500",
  },
  info: {
    container: "bg-blue-50 border-blue-200 text-blue-800",
    icon: Info,
    iconColor: "text-blue-500",
  },
};

export function Alert({
  variant = "info",
  title,
  description,
  onClose,
  autoClose = false,
  autoCloseDelay = 3000,
  className,
  children,
}: AlertProps) {
  const [isVisible, setIsVisible] = React.useState(true);
  const variantConfig = alertVariants[variant];
  const IconComponent = variantConfig.icon;

  React.useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300); // Allow fade out animation
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, onClose]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        "relative rounded-base border-2 p-4 shadow-shadow transition-all duration-300",
        "animate-in slide-in-from-top-2 fade-in-0",
        variantConfig.container,
        !isVisible && "animate-out slide-out-to-top-2 fade-out-0",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <IconComponent className={cn("h-5 w-5 flex-shrink-0 mt-0.5", variantConfig.iconColor)} />
        
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="text-sm font-medium mb-1">
              {title}
            </h4>
          )}
          
          {description && (
            <p className="text-sm opacity-90">
              {description}
            </p>
          )}
          
          {children && (
            <div className="mt-2">
              {children}
            </div>
          )}
        </div>

        {onClose && (
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => onClose(), 300);
            }}
            className="flex-shrink-0 rounded-base p-1 hover:bg-black/5 transition-colors"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        )}
      </div>
    </div>
  );
}

// Toast-style alert that appears at the top of the screen
export interface ToastAlertProps extends AlertProps {
  isOpen: boolean;
}

export function ToastAlert({ isOpen, className, ...props }: ToastAlertProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
      <Alert
        className={cn("glow-soft", className)}
        autoClose={true}
        autoCloseDelay={4000}
        {...props}
      />
    </div>
  );
}
