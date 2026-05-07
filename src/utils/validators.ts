export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(email: string): string | undefined {
    const trimmed = email.trim();
    if (!trimmed) return 'El correo electrónico es obligatorio.';
    if (trimmed.length > 254) return 'El correo es demasiado largo.';
    if (!EMAIL_REGEX.test(trimmed)) return 'Ingresa un correo electrónico válido.';
    return undefined;
}

export function validatePassword(password: string, minLength = 6): string | undefined {
    if (!password) return 'La contraseña es obligatoria.';
    if (password.length < minLength) return `La contraseña debe tener al menos ${minLength} caracteres.`;
    if (password.length > 128) return 'La contraseña es demasiado larga.';
    return undefined;
}

export function validateRequired(value: string, fieldName: string, minLength = 1): string | undefined {
    const trimmed = value.trim();
    if (!trimmed) return `${fieldName} es obligatorio.`;
    if (trimmed.length < minLength) return `${fieldName} es demasiado corto.`;
    return undefined;
}
