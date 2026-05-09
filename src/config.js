/*
 * Centralized tuning values keep the game predictable to edit. This file is the
 * first place to look when we want to change sensitivity, speed, or vision
 * thresholds without digging through the runtime logic.
 */
export const GAME_CONFIG = {
    sampleWidth: 48,
    sampleHeight: 36,
    visionFrameIntervalMs: 90,
    pixelDifferenceThreshold: 28,
    minActivePixels: 26,
    activePixelActivityDivisor: 340,
    activityWeight: 0.68,
    motionHitDeltaDivisor: 5.2,
    motionHitMinDelta: 0.035,
    motionHitStrengthWeight: 0.86,
    minStrengthToMove: 0.01,
    minFollowStrength: 0.35,
    smoothingPreviousWeight: 0.42,
    smoothingCurrentWeight: 0.58,
    ballSize: 72,
    goalSize: 120,
    ballInitialSpeedX: 220,
    ballInitialSpeedY: 150,
    ballMinSpeed: 180,
    ballMaxSpeed: 900,
    ballKeyboardSpeed: 24,
    ballDragPerSecond: 0.985,
    ballBounceDamping: 0.94,
    ballShotImpulse: 260,
    goalCollisionDistance: 72,
    directFollowDebug: false,
};

/*
 * Camera constraints stay explicit so browser compatibility tradeoffs are easy to
 * read and update.
 */
export const CAMERA_REQUEST_CONSTRAINTS = {
    video: {
        facingMode: "user",
        width: { ideal: 640 },
        height: { ideal: 480 },
    },
    audio: false,
};
