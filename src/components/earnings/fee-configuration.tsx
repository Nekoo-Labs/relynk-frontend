"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useProfileRegistry } from "@/hooks/use-profile-registry";
import { Settings, CheckCircle, Loader2, User } from "lucide-react";
import { toast } from "sonner";

export function FeeConfiguration() {
  const { address } = useAccount();
  const {
    useGetProfileByOwner,
    useGetProfileFeeConfig,
    setProfileFeeConfig,
    isPending,
    isConfirming,
    isSuccess,
    hash
  } = useProfileRegistry();

  const [useCustomFees, setUseCustomFees] = useState(false);
  const [feePercent, setFeePercent] = useState([2.5]); // Default 2.5%
  const [hasChanges, setHasChanges] = useState(false);

  // Get profile to get username
  const { data: profileResult } = useGetProfileByOwner(address || "0x0000000000000000000000000000000000000000");
  const [profile, username] = (profileResult as [unknown, string] | undefined) || [null, ""];

  // Get current fee configuration
  const feeConfig = useGetProfileFeeConfig(username || "");

  // Update local state when data loads
  useEffect(() => {
    const configData = feeConfig.data as { useCustomFees?: boolean; platformFeePercent?: number } | undefined;
    if (configData && configData.useCustomFees !== undefined && configData.platformFeePercent !== undefined) {
      try {
        setUseCustomFees(Boolean(configData.useCustomFees));
        const feePercentValue = Number(configData.platformFeePercent) / 100; // Convert from basis points
        setFeePercent([isNaN(feePercentValue) ? 2.5 : feePercentValue]);
        setHasChanges(false);
      } catch (error) {
        console.error("Error parsing fee config data:", error);
        // Set defaults on error
        setUseCustomFees(false);
        setFeePercent([2.5]);
        setHasChanges(false);
      }
    }
  }, [feeConfig.data]);

  // Track changes
  useEffect(() => {
    const configData = feeConfig.data as { useCustomFees?: boolean; platformFeePercent?: number } | undefined;
    if (configData && configData.useCustomFees !== undefined && configData.platformFeePercent !== undefined) {
      try {
        const currentUseCustom = Boolean(configData.useCustomFees);
        const currentPercent = Number(configData.platformFeePercent) / 100;

        if (!isNaN(currentPercent)) {
          const hasCustomFeeChange = useCustomFees !== currentUseCustom;
          const hasPercentChange = Math.abs(feePercent[0] - currentPercent) > 0.01;

          setHasChanges(hasCustomFeeChange || hasPercentChange);
        }
      } catch (error) {
        console.error("Error tracking fee config changes:", error);
        setHasChanges(false);
      }
    }
  }, [useCustomFees, feePercent, feeConfig.data]);

  const handleSave = async () => {
    try {
      // Convert percentage to basis points (multiply by 100)
      const feePercentBasisPoints = Math.round(feePercent[0] * 100);
      
      setProfileFeeConfig(useCustomFees, BigInt(feePercentBasisPoints));
      
      toast.success("Fee configuration updated! Please confirm the transaction.");
    } catch (error) {
      console.error("Fee configuration error:", error);
      toast.error("Failed to update fee configuration");
    }
  };

  const handleReset = () => {
    const configData = feeConfig.data as { useCustomFees?: boolean; platformFeePercent?: number } | undefined;
    if (configData && configData.useCustomFees !== undefined && configData.platformFeePercent !== undefined) {
      try {
        setUseCustomFees(Boolean(configData.useCustomFees));
        const feePercentValue = Number(configData.platformFeePercent) / 100;
        setFeePercent([isNaN(feePercentValue) ? 2.5 : feePercentValue]);
        setHasChanges(false);
      } catch (error) {
        console.error("Error resetting fee config:", error);
        // Reset to defaults on error
        setUseCustomFees(false);
        setFeePercent([2.5]);
        setHasChanges(false);
      }
    }
  };

  // Calculate fee examples
  const calculateFeeExample = (amount: number) => {
    const currentFee = useCustomFees ? feePercent[0] : 2.5; // Default platform fee
    const feeAmount = (amount * currentFee) / 100;
    const netAmount = amount - feeAmount;
    return { feeAmount, netAmount };
  };

  const example100 = calculateFeeExample(100);
  const example1000 = calculateFeeExample(1000);

  // Don't show anything if no address
  if (!address) {
    return null;
  }

  // Show loading state
  if (profile && feeConfig.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Fee Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show message if no profile exists
  if (!username) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Fee Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-foreground/60">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No profile found.</p>
            <p className="text-sm">Create a profile first to configure fees.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Personal Fee Configuration
        </CardTitle>
        <p className="text-sm text-foreground/60 mt-2">
          Configure your individual platform fees. These settings only apply to your profile and earnings - they don't affect other users.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Custom Fee Toggle */}
        <div className="p-6 border border-border rounded-base bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Label className="text-lg font-semibold text-foreground">Set Your Own Fee Rate</Label>
              <p className="text-sm text-foreground/70 max-w-md">
                Choose your personal withdrawal fee instead of the default 2.5%
              </p>
            </div>
            <Switch
              checked={useCustomFees}
              onCheckedChange={setUseCustomFees}
              disabled={isPending || isConfirming}
              className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-300 scale-125"
            />
          </div>

          {!useCustomFees && (
            <div className="mt-4 p-3 bg-white/80 rounded-base border border-blue-200">
              <p className="text-sm text-blue-700">
                💡 <strong>Turn on to save money</strong> - Set a lower fee rate for your withdrawals
              </p>
            </div>
          )}
        </div>

        {/* Fee Percentage Slider */}
        {useCustomFees && (
          <div className="space-y-4 p-4 bg-white border border-green-300 rounded-base">
            <div className="text-center">
              <Label className="text-2xl font-bold text-green-600">
                {feePercent[0].toFixed(1)}%
              </Label>
              <p className="text-sm text-foreground/60 mt-1">
                Your withdrawal fee rate
              </p>
            </div>

            <div className="px-4">
              <Slider
                value={feePercent}
                onValueChange={setFeePercent}
                max={5.0}
                min={1.0}
                step={0.1}
                className="w-full"
                disabled={isPending || isConfirming}
              />
              <div className="flex justify-between text-xs text-foreground/60 mt-2">
                <span>1.0%</span>
                <span>5.0%</span>
              </div>
            </div>
          </div>
        )}

        {/* Current Status */}
        <div className="p-4 bg-gray-50 rounded-base border border-gray-200">
          <div className="text-center">
            <p className="text-sm text-foreground/70">Currently using:</p>
            <p className="text-lg font-semibold text-foreground">
              {useCustomFees ? `${feePercent[0].toFixed(1)}% (Custom)` : "2.5% (Default)"}
            </p>
          </div>
        </div>

        {/* Fee Examples */}
        <div className="p-4 bg-blue-50 rounded-base border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-3">Examples</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Withdraw $100:</span>
              <span className="font-medium">You get ${example100.netAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Withdraw $1,000:</span>
              <span className="font-medium">You get ${example1000.netAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Info Box */}
        

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isPending || isConfirming}
            className="flex-1"
          >
            {isPending || isConfirming ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isPending ? "Confirming..." : "Processing..."}
              </>
            ) : (
              <>
                <User className="h-4 w-4 mr-2" />
                Save My Personal Settings
              </>
            )}
          </Button>
          
          {hasChanges && (
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isPending || isConfirming}
            >
              Reset
            </Button>
          )}
        </div>

        {/* Transaction Status */}
        {isSuccess && hash && (
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-base border border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-800">
              Your personal fee configuration updated successfully!
              <a
                href={`https://sepolia-blockscout.lisk.com/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 underline hover:no-underline"
              >
                View transaction
              </a>
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
