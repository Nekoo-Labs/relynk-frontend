"use client";

import { useState, useRef } from "react";
import { Palette } from "lucide-react";
import { Button } from "./ui/button";
import {
  ColorPicker,
  ColorPickerAlpha,
  ColorPickerEyeDropper,
  ColorPickerFormat,
  ColorPickerHue,
  ColorPickerOutput,
  ColorPickerSelection,
} from "./ui/color-picker";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import Color from "color";

interface ProfileColorPickerProps {
  /**
   * The initial color value
   */
  defaultColor?: string;
  /**
   * Callback function called when color changes
   */
  onColorChange?: (color: string) => void;
  /**
   * Whether the popover should close when a color is selected
   */
  closeOnSelect?: boolean;
  label?: string;
}

export default function ProfileColorPicker({
  defaultColor = "#3b82f6",
  onColorChange,
  closeOnSelect = false,
  label,
}: ProfileColorPickerProps) {
  console.log(defaultColor);
  const [selectedColor, setSelectedColor] = useState<string>(defaultColor);
  const [isOpen, setIsOpen] = useState(false);
  // Use ref to track if this is the initial render to avoid infinite loops
  const initialRender = useRef(true);

  const handleColorChange = (value: Parameters<typeof Color.rgb>[0]) => {
    // The ColorPicker passes RGBA values where RGB are 0-255 and A is 0-1
    const [r, g, b, a] = value as [number, number, number, number];

    // Convert to hex with proper rounding and padding
    const toHex = (value: number) => {
      const rounded = Math.round(Math.max(0, Math.min(255, value)));
      return rounded.toString(16).padStart(2, "0");
    };

    // Create hex color (always include alpha if not fully opaque)
    const hexColor =
      a >= 1
        ? `#${toHex(r)}${toHex(g)}${toHex(b)}`
        : `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(a * 255)}`;

    // Only update if the color actually changed to avoid infinite loops
    if (hexColor !== selectedColor || initialRender.current) {
      setSelectedColor(hexColor);
      initialRender.current = false;

      // Call the parent callback if provided
      onColorChange?.(hexColor);

      // Close popover if configured to do so
      if (closeOnSelect) {
        setIsOpen(false);
      }
    }
  };

  console.log(selectedColor);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Palette className="h-4 w-4" />
          <div
            className="h-4 w-4 rounded-full border border-border"
            style={{ backgroundColor: selectedColor }}
          />
          <span className="hidden sm:inline">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <ColorPicker
          defaultValue={selectedColor}
          onChange={handleColorChange}
          className="w-64"
        >
          <div className="space-y-3">
            {/* Color selection area */}
            <ColorPickerSelection className="h-32 w-full" />

            {/* Hue and alpha sliders */}
            <div className="flex items-center gap-3">
              <ColorPickerEyeDropper />
              <div className="flex-1 space-y-2">
                <ColorPickerHue />
                <ColorPickerAlpha />
              </div>
            </div>

            {/* Format selector and color output */}
            <div className="flex items-center gap-2">
              <ColorPickerOutput />
              <ColorPickerFormat className="flex-1" />
            </div>
          </div>
        </ColorPicker>
      </PopoverContent>
    </Popover>
  );
}
