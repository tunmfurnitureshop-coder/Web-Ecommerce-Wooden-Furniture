export interface CustomerProfileViewModel {
  id: string;
  email: string;
  fullName?: string | null;
  phone?: string | null;
  isEmailVerified: boolean;
}
