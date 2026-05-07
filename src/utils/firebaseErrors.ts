import { FirebaseError } from 'firebase/app';

const ERROR_MAP: Record<string, string> = {
    'auth/invalid-email': 'El formato del correo electrónico no es válido.',
    'auth/user-disabled': 'Esta cuenta ha sido deshabilitada. Contacta al administrador.',
    'auth/user-not-found': 'No existe una cuenta con este correo.',
    'auth/wrong-password': 'La contraseña es incorrecta.',
    'auth/invalid-credential': 'Las credenciales son incorrectas.',
    'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde.',
    'auth/network-request-failed': 'Sin conexión. Verifica tu red e intenta nuevamente.',
    'auth/popup-closed-by-user': 'Cancelaste el inicio de sesión con Google.',
    'auth/popup-blocked': 'Tu navegador bloqueó la ventana emergente. Permítela e intenta nuevamente.',
    'auth/cancelled-popup-request': 'Inicio de sesión cancelado.',
    'auth/account-exists-with-different-credential': 'Ya existe una cuenta con este correo usando otro método de inicio de sesión.',
    'auth/email-already-in-use': 'Ya existe una cuenta con este correo electrónico.',
    'auth/operation-not-allowed': 'Este método de registro no está habilitado.',
    'auth/weak-password': 'La contraseña es demasiado débil. Usa al menos 6 caracteres.',
};

export function describeAuthError(err: unknown, fallback = 'Ocurrió un error inesperado. Intenta nuevamente.'): string {
    if (err instanceof FirebaseError) {
        return ERROR_MAP[err.code] ?? fallback;
    }
    return fallback;
}

export function isPopupCancellation(err: unknown): boolean {
    return err instanceof FirebaseError &&
        (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request');
}
