export interface Profile {
  owner: string;
  ipfsHash: string;
  createdAt: bigint;
  updatedAt: bigint;
}

export interface ProfileData {
  name: string;
  bio: string;
  avatar?: string;
  links: ProfileLink[];
  theme?: ProfileTheme;
  socialLinks?: SocialLinks;
}

export interface ProfileLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  order: number;
  type: 'link' | 'payment' | 'donation' | 'product' | 'content';
}

export interface SocialLinks {
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  github?: string;
  discord?: string;
  telegram?: string;
  youtube?: string;
  tiktok?: string;
}

export interface ProfileTheme {
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  buttonStyle: 'rounded' | 'square' | 'pill';
  backgroundType: 'solid' | 'gradient' | 'image';
  backgroundImage?: string;
}

export interface ProfileFeeConfig {
  useCustomFees: boolean;
  platformFeePercent: bigint;
}

export interface CreatorEarnings {
  totalEarned: bigint;
  totalWithdrawn: bigint;
  availableToWithdraw: bigint;
}

// Form types for profile creation/editing
export interface ProfileFormData {
  username: string;
  name: string;
  bio: string;
  avatar?: File;
  links: Omit<ProfileLink, 'id'>[];
  theme: ProfileTheme;
  socialLinks: SocialLinks;
}

export interface LinkFormData {
  title: string;
  url: string;
  description?: string;
  icon?: string;
  type: ProfileLink['type'];
}
