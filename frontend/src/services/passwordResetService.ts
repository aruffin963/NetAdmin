import apiClient from './api';

// ============= INTERFACES =============

export interface PasswordResetResponse {
  success: boolean;
  message: string;
}

export interface TokenValidationResponse {
  valid: boolean;
  email?: string;
}

export interface PasswordResetError {
  message: string;
  code?: string;
}

export interface OTPValidationResponse {
  success: boolean;
  resetToken?: string;
  message: string;
}

// ============= PASSWORD RESET SERVICE =============

class PasswordResetService {
  /**
   * Request password reset for an email address
   * Sends a password reset email with a reset link
   * @param email User email address
   * @returns Promise with success status and message
   */
  static async requestPasswordReset(email: string): Promise<PasswordResetResponse> {
    try {
      if (!email || !email.includes('@')) {
        throw new Error('Veuillez fournir une adresse email valide');
      }

      const response = await apiClient.post<PasswordResetResponse>(
        '/auth/forgot-password',
        { email }
      );

      return response || { success: false, message: 'Erreur lors de la requête' };
    } catch (error: any) {
      const message = error?.message || 'Erreur lors de l\'envoi du lien de réinitialisation';
      console.error('[PasswordResetService] requestPasswordReset error:', message);
      throw new Error(message);
    }
  }

  /**
   * Validate a password reset token
   * Checks if the token is valid and not expired
   * @param token Reset token from email link
   * @returns Promise with validation status and email if valid
   */
  static async validateResetToken(token: string): Promise<TokenValidationResponse> {
    try {
      if (!token) {
        throw new Error('Token manquant');
      }

      const response = await apiClient.post<TokenValidationResponse>(
        '/auth/validate-reset-token',
        { token }
      );

      return response || { valid: false };
    } catch (error: any) {
      const message = error?.message || 'Erreur lors de la validation du token';
      console.error('[PasswordResetService] validateResetToken error:', message);
      throw new Error(message);
    }
  }

  /**
   * Reset password with a valid reset token
   * @param token Reset token from email link
   * @param password New password (must be 8+ chars, uppercase, lowercase, number)
   * @param confirmPassword Password confirmation (must match password)
   * @returns Promise with success status and message
   */
  static async resetPassword(
    token: string,
    password: string,
    confirmPassword: string
  ): Promise<PasswordResetResponse> {
    try {
      if (!token) {
        throw new Error('Token manquant');
      }

      if (!password || !confirmPassword) {
        throw new Error('Veuillez fournir les deux champs de mot de passe');
      }

      if (password !== confirmPassword) {
        throw new Error('Les mots de passe ne correspondent pas');
      }

      // Client-side validation for password strength
      const passwordValidation = this.validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.message);
      }

      const response = await apiClient.post<PasswordResetResponse>(
        '/auth/reset-password',
        {
          token,
          password,
          confirmPassword,
        }
      );

      return response || { success: false, message: 'Erreur lors de la réinitialisation' };
    } catch (error: any) {
      const message = error?.message || 'Erreur lors de la réinitialisation du mot de passe';
      console.error('[PasswordResetService] resetPassword error:', message);
      throw new Error(message);
    }
  }

  /**
   * Validate password strength client-side
   * @param password Password to validate
   * @returns Object with isValid flag and message
   */
  static validatePasswordStrength(password: string): { isValid: boolean; message: string } {
    if (!password) {
      return { isValid: false, message: 'Le mot de passe est requis' };
    }

    if (password.length < 8) {
      return { isValid: false, message: 'Le mot de passe doit contenir au moins 8 caractères' };
    }

    if (!/[A-Z]/.test(password)) {
      return { isValid: false, message: 'Le mot de passe doit contenir une lettre majuscule' };
    }

    if (!/[a-z]/.test(password)) {
      return { isValid: false, message: 'Le mot de passe doit contenir une lettre minuscule' };
    }

    if (!/[0-9]/.test(password)) {
      return { isValid: false, message: 'Le mot de passe doit contenir un chiffre' };
    }

    return { isValid: true, message: 'Mot de passe valide' };
  }

  /**
   * Calculate password strength level
   * @param password Password to analyze
   * @returns Strength level: 'weak' | 'fair' | 'good' | 'strong'
   */
  static calculatePasswordStrength(
    password: string
  ): 'weak' | 'fair' | 'good' | 'strong' {
    let strength = 0;

    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*]/.test(password)) strength++;

    switch (strength) {
      case 0:
      case 1:
        return 'weak';
      case 2:
        return 'fair';
      case 3:
        return 'good';
      default:
        return 'strong';
    }
  }

  /**
   * Request password reset OTP for a username
   * Sends a password reset OTP request
   * @param username User username
   * @returns Promise with success status and message
   */
  static async requestPasswordResetOTP(username: string): Promise<PasswordResetResponse> {
    try {
      if (!username) {
        throw new Error('Veuillez fournir votre nom d\'utilisateur');
      }

      const response = await apiClient.post<PasswordResetResponse>(
        '/auth/forgot-password-otp',
        { username }
      );

      return response || { success: false, message: 'Erreur lors de la requête' };
    } catch (error: any) {
      const message = error?.message || 'Erreur lors de l\'envoi du code OTP';
      console.error('[PasswordResetService] requestPasswordResetOTP error:', message);
      throw new Error(message);
    }
  }

  /**
   * Validate a password reset OTP
   * @param username User username
   * @param otp OTP code (6 digits)
   * @returns Promise with validation status and reset token if valid
   */
  static async validateResetOTP(username: string, otp: string): Promise<OTPValidationResponse> {
    try {
      if (!username) {
        throw new Error('Nom d\'utilisateur requis');
      }

      if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
        throw new Error('Code OTP invalide (6 chiffres requis)');
      }

      const response = await apiClient.post<OTPValidationResponse>(
        '/auth/validate-reset-otp',
        { username, otp }
      );

      return response || { success: false, message: 'Erreur lors de la validation' };
    } catch (error: any) {
      const message = error?.message || 'Erreur lors de la validation du code OTP';
      console.error('[PasswordResetService] validateResetOTP error:', message);
      throw new Error(message);
    }
  }
}

export default PasswordResetService;
