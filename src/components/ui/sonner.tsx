"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

function Toaster({ ...props }: React.ComponentProps<typeof Sonner>) {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background! group-[.toaster]:text-foreground! group-[.toaster]:border! group-[.toaster]:border-border! group-[.toaster]:shadow-shadow! group-[.toaster]:rounded-base group-[.toaster]:font-base group-[.toaster]:transition-all group-[.toaster]:duration-300 group-[.toaster]:hover:shadow-lg! group-[.toaster]:hover:scale-[1.02]",
          description:
            "group-[.toast]:text-foreground! group-[.toast]:font-base",
          title: "group-[.toast]:font-heading group-[.toast]:text-foreground",
          actionButton:
            "group-[.toast]:bg-main group-[.toast]:text-main-foreground group-[.toast]:rounded-base group-[.toast]:font-base group-[.toast]:transition-all group-[.toast]:duration-300 group-[.toast]:hover:shadow-lg group-[.toast]:hover:scale-[1.02] group-[.toast]:hover:brightness-110 group-[.toast]:active:scale-[0.98] group-[.toast]:border group-[.toast]:border-border group-[.toast]:shadow-shadow",
          cancelButton:
            "group-[.toast]:bg-secondary-background group-[.toast]:text-foreground group-[.toast]:rounded-base group-[.toast]:font-base group-[.toast]:transition-all group-[.toast]:duration-300 group-[.toast]:hover:bg-secondary-background/80 group-[.toast]:hover:scale-[1.01] group-[.toast]:border group-[.toast]:border-border group-[.toast]:shadow-shadow",
          closeButton:
            "group-[.toast]:bg-secondary-background group-[.toast]:text-foreground group-[.toast]:rounded-base group-[.toast]:transition-all group-[.toast]:duration-300 group-[.toast]:hover:bg-secondary-background/80 group-[.toast]:hover:scale-[1.05] group-[.toast]:border group-[.toast]:border-border group-[.toast]:shadow-shadow",
          success:
            "group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-border group-[.toaster]:shadow-shadow",
          error:
            "group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-border group-[.toaster]:shadow-shadow",
          warning:
            "group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-border group-[.toaster]:shadow-shadow",
          info: "group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-border group-[.toaster]:shadow-shadow",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
