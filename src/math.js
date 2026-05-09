/*
 * These helpers are intentionally tiny and pure so the more interesting modules
 * can share them without dragging UI state into the calculation layer.
 */
export function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
}

export function normalizeVector(x, y, fallbackX = 1, fallbackY = 0) {
    const length = Math.hypot(x, y);
    if (length < 0.0001) {
        return { x: fallbackX, y: fallbackY };
    }

    return { x: x / length, y: y / length };
}
