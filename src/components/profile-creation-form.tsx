"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useProfileRegistry } from "@/hooks/use-profile-registry";
import { useUserPaymentLinks } from "@/hooks/use-payment-links";
import {
  ProfileFormData,
  ProfileLink,
  ProfileTheme,
  SocialLinks,
} from "@/types/profile";
import { PaymentLink, LinkType } from "@/types/relynk";
import {
  Plus,
  X,
  Check,
  User,
  Link as LinkIcon,
  Palette,
  CreditCard,
  Heart,
  ShoppingBag,
  FileText,
} from "lucide-react";
import { useAccount } from "wagmi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import ProfileColorPicker from "./color-picker-popover";

const defaultTheme: ProfileTheme = {
  backgroundColor: "#ffffff",
  textColor: "#000000",
  accentColor: "#3b82f6",
  buttonStyle: "rounded",
  backgroundType: "solid",
};

const defaultSocialLinks: SocialLinks = {};

interface ProfileCreationFormProps {
  existingUsername?: string;
  isEditing?: boolean;
}

export function ProfileCreationForm({
  existingUsername,
  isEditing = false,
}: ProfileCreationFormProps) {
  const router = useRouter();
  const { address } = useAccount();
  const {
    createProfile,
    updateProfile,
    isPending,
    isSuccess,
    useIsUsernameAvailable,
  } = useProfileRegistry();

  // Fetch user's payment links
  const { data: paymentLinks = [], isLoading: isLoadingPaymentLinks } =
    useUserPaymentLinks();

  const [formData, setFormData] = useState<ProfileFormData>({
    username: existingUsername || "",
    name: existingUsername || "",
    bio: "",
    links: [],
    theme: defaultTheme,
    socialLinks: defaultSocialLinks,
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [usernameCheck, setUsernameCheck] = useState<string>("");
  const [selectedPaymentLinks, setSelectedPaymentLinks] = useState<Set<string>>(
    new Set()
  );

  // Helper function to convert PaymentLink to ProfileLink
  const convertPaymentLinkToProfileLink = (
    paymentLink: PaymentLink
  ): Omit<ProfileLink, "id"> => {
    const getTypeFromLinkType = (linkType: LinkType): ProfileLink["type"] => {
      switch (linkType) {
        case LinkType.PAYMENT:
          return "payment";
        case LinkType.DONATION:
          return "donation";
        case LinkType.PRODUCT:
          return "product";
        case LinkType.CONTENT:
          return "content";
        default:
          return "payment";
      }
    };

    return {
      title: paymentLink.title,
      url: `${window.location.origin}/pay/${paymentLink.id}`,
      description: paymentLink.description,
      icon: "",
      isActive: paymentLink.isActive && !paymentLink.isExpired,
      order: formData.links.length,
      type: getTypeFromLinkType(paymentLink.linkType),
    };
  };

  // Helper function to get icon for payment link type
  const getPaymentLinkIcon = (linkType: LinkType) => {
    switch (linkType) {
      case LinkType.PAYMENT:
        return <CreditCard className="w-4 h-4" />;
      case LinkType.DONATION:
        return <Heart className="w-4 h-4" />;
      case LinkType.PRODUCT:
        return <ShoppingBag className="w-4 h-4" />;
      case LinkType.CONTENT:
        return <FileText className="w-4 h-4" />;
      default:
        return <LinkIcon className="w-4 h-4" />;
    }
  };

  // Helper function to get type label
  const getPaymentLinkTypeLabel = (linkType: LinkType) => {
    switch (linkType) {
      case LinkType.PAYMENT:
        return "Payment";
      case LinkType.DONATION:
        return "Donation";
      case LinkType.PRODUCT:
        return "Product";
      case LinkType.CONTENT:
        return "Content";
      default:
        return "Payment";
    }
  };

  // Check username availability (only if not editing existing profile)
  const { data: isAvailable, isLoading: isCheckingUsername } =
    useIsUsernameAvailable(!isEditing ? usernameCheck : "");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.username.length >= 3) {
        setUsernameCheck(formData.username);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.username]);

  useEffect(() => {
    if (isSuccess) {
      router.push(`/${formData.username}`);
    }
  }, [isSuccess, formData.username, router]);

  const handleInputChange = (
    field: keyof ProfileFormData,
    value: string | Omit<ProfileLink, "id">[] | SocialLinks | ProfileTheme
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addLink = () => {
    const newLink: Omit<ProfileLink, "id"> = {
      title: "",
      url: "",
      description: "",
      icon: "",
      isActive: true,
      order: formData.links.length,
      type: "link",
    };
    handleInputChange("links", [...formData.links, newLink]);
  };

  const updateLink = (
    index: number,
    field: keyof Omit<ProfileLink, "id">,
    value: string | number | boolean
  ) => {
    const updatedLinks = [...formData.links];
    updatedLinks[index] = { ...updatedLinks[index], [field]: value };
    handleInputChange("links", updatedLinks);
  };

  const removeLink = (index: number) => {
    const updatedLinks = formData.links.filter((_, i) => i !== index);
    handleInputChange("links", updatedLinks);
  };

  // Handle payment link selection
  const togglePaymentLinkSelection = (paymentLinkId: string) => {
    const newSelected = new Set(selectedPaymentLinks);
    if (newSelected.has(paymentLinkId)) {
      newSelected.delete(paymentLinkId);
      // Remove from form data
      const paymentLink = paymentLinks.find((pl) => pl.id === paymentLinkId);
      if (paymentLink) {
        const linkUrl = `${window.location.origin}/pay/${paymentLink.id}`;
        const updatedLinks = formData.links.filter(
          (link) => link.url !== linkUrl
        );
        handleInputChange("links", updatedLinks);
      }
    } else {
      newSelected.add(paymentLinkId);
      // Add to form data
      const paymentLink = paymentLinks.find((pl) => pl.id === paymentLinkId);
      if (paymentLink) {
        const profileLink = convertPaymentLinkToProfileLink(paymentLink);
        handleInputChange("links", [...formData.links, profileLink]);
      }
    }
    setSelectedPaymentLinks(newSelected);
  };

  // Add selected payment links to form data
  const _addSelectedPaymentLinks = () => {
    const selectedLinks = paymentLinks
      .filter((pl) => selectedPaymentLinks.has(pl.id))
      .map((pl) => convertPaymentLinkToProfileLink(pl));

    handleInputChange("links", [...formData.links, ...selectedLinks]);
    setSelectedPaymentLinks(new Set());
  };

  const handleSubmit = async () => {
    if (!address) return;

    try {
      const profileData = {
        name: formData.name,
        bio: formData.bio,
        links: formData.links.map((link, index) => ({
          ...link,
          id: `link-${index}`,
        })),
        theme: formData.theme,
        socialLinks: formData.socialLinks,
      };

      if (isEditing) {
        await updateProfile(profileData);
      } else {
        await createProfile(formData.username, profileData);
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
    }
  };

  const isUsernameValid =
    isEditing || (formData.username.length >= 3 && isAvailable);
  const canProceedStep1 = isUsernameValid && formData.name.trim().length > 0;
  const canSubmit = canProceedStep1;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= step
                  ? "bg-main text-main-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {currentStep > step ? <Check className="w-4 h-4" /> : step}
            </div>
            {step < 3 && (
              <div
                className={`w-12 h-0.5 ${
                  currentStep > step ? "bg-main" : "bg-secondary"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {isEditing ? "Profile Information" : "Basic Information"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Show username field only if not editing */}
            {!isEditing && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Username *
                </label>
                <div className="relative">
                  <Input
                    placeholder="your-username"
                    value={formData.username}
                    onChange={(e) =>
                      handleInputChange(
                        "username",
                        e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                      )
                    }
                    className="pr-10"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isCheckingUsername ? (
                      <div className="w-4 h-4 border-2 border-main border-t-transparent rounded-full animate-spin" />
                    ) : formData.username.length >= 3 ? (
                      isAvailable ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <X className="w-4 h-4 text-red-500" />
                      )
                    ) : null}
                  </div>
                </div>
                {formData.username.length >= 3 && !isCheckingUsername && (
                  <p
                    className={`text-sm mt-1 ${
                      isAvailable ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {isAvailable
                      ? "✓ Username is available"
                      : "✗ Username is taken"}
                  </p>
                )}
              </div>
            )}

            {/* Show username as read-only if editing */}
            {isEditing && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Username
                </label>
                <div className="p-3 bg-secondary-background border border-border rounded-base text-foreground/60">
                  @{formData.username}
                </div>
                <p className="text-xs text-foreground/50 mt-1">
                  Username cannot be changed after creation
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                Display Name *
              </label>
              <Input
                placeholder="Your Name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Bio</label>
              <textarea
                className="w-full p-3 border border-border rounded-base bg-background text-foreground resize-none"
                rows={3}
                placeholder="Tell people about yourself..."
                value={formData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
              />
            </div>

            <Button
              onClick={() => setCurrentStep(2)}
              disabled={!canProceedStep1}
              className="w-full"
            >
              Continue to Links
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Links */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              Your Links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Payment Links Selection */}
            {paymentLinks.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Your Payment Links</h3>
                  <Badge variant="secondary">
                    {paymentLinks.length} available
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Select payment links you&apos;ve created to include in your
                  profile
                </p>

                {isLoadingPaymentLinks ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-main mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Loading payment links...
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3 max-h-60 overflow-y-auto">
                    {paymentLinks.map((paymentLink) => (
                      <div
                        key={paymentLink.id}
                        className={`border rounded-base p-3 cursor-pointer transition-colors ${
                          selectedPaymentLinks.has(paymentLink.id)
                            ? "border-main bg-main/5"
                            : "border-border hover:border-main/50"
                        }`}
                        onClick={() =>
                          togglePaymentLinkSelection(paymentLink.id)
                        }
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex items-center gap-2">
                              {getPaymentLinkIcon(paymentLink.linkType)}
                              <div>
                                <h4 className="font-medium text-sm">
                                  {paymentLink.title}
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  {getPaymentLinkTypeLabel(
                                    paymentLink.linkType
                                  )}{" "}
                                  • {paymentLink.formattedAmount}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!paymentLink.isActive && (
                              <Badge variant="secondary" className="text-xs">
                                Inactive
                              </Badge>
                            )}
                            {paymentLink.isExpired && (
                              <Badge variant="destructive" className="text-xs">
                                Expired
                              </Badge>
                            )}
                            <div
                              className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                selectedPaymentLinks.has(paymentLink.id)
                                  ? "border-main bg-main"
                                  : "border-border"
                              }`}
                            >
                              {selectedPaymentLinks.has(paymentLink.id) && (
                                <Check className="w-2.5 h-2.5 text-white" />
                              )}
                            </div>
                          </div>
                        </div>
                        {paymentLink.description && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {paymentLink.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Custom Links Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Custom Links</h3>
                {formData.links.length > 0 && (
                  <Badge variant="secondary">
                    {formData.links.length} added
                  </Badge>
                )}
              </div>
              {formData.links.map((link, index) => (
                <div
                  key={index}
                  className="border border-border rounded-base p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Link {index + 1}</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeLink(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Link Title"
                      value={link.title}
                      onChange={(e) =>
                        updateLink(index, "title", e.target.value)
                      }
                    />
                    <Select
                      value={link.type}
                      onValueChange={(value) =>
                        updateLink(index, "type", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Link Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="link">Link</SelectItem>
                        <SelectItem value="payment">Payment</SelectItem>
                        <SelectItem value="donation">Donation</SelectItem>
                        <SelectItem value="product">Product</SelectItem>
                        <SelectItem value="content">Content</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Input
                    placeholder="https://..."
                    value={link.url}
                    onChange={(e) => updateLink(index, "url", e.target.value)}
                  />

                  <Input
                    placeholder="Description (optional)"
                    value={link.description}
                    onChange={(e) =>
                      updateLink(index, "description", e.target.value)
                    }
                  />
                </div>
              ))}

              <Button onClick={addLink} variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Custom Link
              </Button>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="flex-1"
              >
                Back
              </Button>
              <Button onClick={() => setCurrentStep(3)} className="flex-1">
                Continue to Theme
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Theme & Submit */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Customize Theme
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col justify-between">
                <label className="block text-sm font-medium mb-2">
                  Background Color
                </label>
                <ProfileColorPicker
                  defaultColor={formData.theme.backgroundColor}
                  onColorChange={(color) =>
                    handleInputChange("theme", {
                      ...formData.theme,
                      backgroundColor: color,
                    })
                  }
                  label="Pick a Color"
                />
              </div>
              <div className="flex flex-col justify-between">
                <label className="block text-sm font-medium mb-2">
                  Accent Color
                </label>
                <ProfileColorPicker
                  defaultColor={formData.theme.accentColor}
                  onColorChange={(color) =>
                    handleInputChange("theme", {
                      ...formData.theme,
                      accentColor: color,
                    })
                  }
                  label="Pick a Color"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Button Style
              </label>
              <div className="flex gap-2">
                {(["rounded", "square", "pill"] as const).map((style) => (
                  <Button
                    key={style}
                    variant={
                      formData.theme.buttonStyle === style
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      handleInputChange("theme", {
                        ...formData.theme,
                        buttonStyle: style,
                      })
                    }
                  >
                    {style}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(2)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || isPending}
                className="flex-1"
              >
                {isPending ? "Creating Profile..." : "Create Profile"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
