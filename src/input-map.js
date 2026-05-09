import { clamp } from "./math.js";

/*
 * This module translates tracked motion into game-facing signals. It stays pure
 * so we can tweak the feel of the interaction without touching DOM or camera code.
 */
export function describeMotion(horizontal, vertical, strength) {
    const horizontalLabel = horizontal > 0.16 ? "Right" : horizontal < -0.16 ? "Left" : "";
    const verticalLabel = vertical > 0.16 ? "Down" : vertical < -0.16 ? "Up" : "";
    const description = [verticalLabel, horizontalLabel].filter(Boolean).join(" ");

    return description ? `${description} ${Math.round(strength * 100)}%` : "Idle";
}

export function getMotionHit(smoothedCenter, lastCenter, activePixels, config) {
    if (!lastCenter) {
        return null;
    }

    const deltaX = smoothedCenter.x - lastCenter.x;
    const deltaY = smoothedCenter.y - lastCenter.y;
    const normalizedHitX = clamp(deltaX / config.motionHitDeltaDivisor, -1, 1);
    const normalizedHitY = clamp(deltaY / config.motionHitDeltaDivisor, -1, 1);
    const deltaMagnitude = Math.hypot(normalizedHitX, normalizedHitY);

    if (deltaMagnitude < config.motionHitMinDelta) {
        return null;
    }

    const activity = clamp(activePixels / config.activePixelActivityDivisor, 0, 1);
    const strength = clamp(activity * config.activityWeight + deltaMagnitude * config.motionHitStrengthWeight, 0, 1);

    return {
        x: normalizedHitX,
        y: normalizedHitY,
        strength,
    };
}
