// Biometric authentication backed by expo-local-authentication.
// API-compatible with the reference biometric-service.ts from react-native-biometrics.
import * as LocalAuthentication from 'expo-local-authentication';

export type BiometryType = 'FaceID' | 'TouchID' | 'Biometrics' | null;

const MAX_ATTEMPTS = 3;

export const biometricService = {
  async getAvailableBiometryType(): Promise<BiometryType> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) return null;

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) return null;

      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        return 'FaceID';
      }
      if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        return 'TouchID';
      }
      if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        return 'Biometrics';
      }
      return null;
    } catch {
      return null;
    }
  },

  async authenticate(promptMessage: string = 'Verify your identity'): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
      });
      return result.success;
    } catch {
      return false;
    }
  },

  /**
   * Attempt biometric auth with retry up to MAX_ATTEMPTS.
   * Returns true on success, false if all attempts fail.
   */
  async authenticateWithRetry(promptMessage: string = 'Verify your identity'): Promise<boolean> {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const success = await this.authenticate(promptMessage);
      if (success) return true;
    }
    return false;
  },
};
