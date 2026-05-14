// Ensures the ISO string is treated as UTC before converting to local time
const toUtc = (isoString) => {
    if (!isoString) return null;
    // If no timezone info, assume UTC and append Z
    return isoString.endsWith('Z') || isoString.includes('+') 
        ? isoString 
        : isoString + 'Z';
};

export const formatLocalTime = (isoString, options = {}) => {
    if (!isoString) return '-';
    const defaults = {
        timeZone: 'Europe/Istanbul',
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    };
    return new Date(toUtc(isoString)).toLocaleString('tr-TR', { ...defaults, ...options });
};

export const formatLocalDate = (isoString) => {
    if (!isoString) return '-';
    return new Date(toUtc(isoString)).toLocaleDateString('tr-TR', {
        timeZone: 'Europe/Istanbul',
        day: '2-digit', month: '2-digit', year: 'numeric',
    });
};

export const formatLocalTimeOnly = (isoString) => {
    if (!isoString) return '-';
    return new Date(toUtc(isoString)).toLocaleTimeString('tr-TR', {
        timeZone: 'Europe/Istanbul',
        hour: '2-digit', minute: '2-digit',
    });
};