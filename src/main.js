import { CAMERA_REQUEST_CONSTRAINTS, GAME_CONFIG } from "./config.js";
import { createCameraController, isFilePreviewMode } from "./camera.js";
import { formatDebugState } from "./debug.js";
import { getDomElements, createUi } from "./dom.js";
import { describeMotion, getMotionHit } from "./input-map.js";
import { clamp } from "./math.js";
import { createPhysics } from "./physics.js";
import { createVisionEngine } from "./vision.js";

/*
 * The main module is intentionally small orchestration glue. It wires together
 * camera lifecycle, motion analysis, physics, and DOM updates without owning the
 * heavy implementation details of any one concern.
 */
const elements = getDomElements();
const ui = createUi(elements);
const physics = createPhysics(elements, GAME_CONFIG, ui);
const camera = createCameraController(elements, CAMERA_REQUEST_CONSTRAINTS);
const vision = createVisionEngine(elements.cameraPreview, elements.playfield, GAME_CONFIG, GAME_CONFIG.inputBallSize);

let animationFrame = 0;
let lastFrameAt = 0;
let lastVisionAt = 0;
let previousMotionCenter = null;

function setVisionReadyState() {
    vision.setReady(true);
    ui.setPlayfieldHint("Lightweight motion tracking is ready. Start the camera and move sharply to hit the ball.");
}

function configureInitialModeHints() {
    if (isFilePreviewMode()) {
        ui.setCameraStatus("File Mode");
        ui.setCameraHint("Camera preview is usually blocked on file:// pages. Use Open Localhost for a permission prompt.");
        ui.setPlayfieldHint("Use arrow keys or WASD to test the ball while you remain on file mode.");
        ui.setLocalhostLinkText("Open Localhost For Camera");
    } else {
        ui.setPlayfieldHint("Arrow keys or WASD remain available as a fallback while the camera engine is being tuned.");
    }

    setVisionReadyState();
    ui.setCameraHint("Camera is ready to request permission.");
}

function resetTrackingState() {
    previousMotionCenter = null;
    lastFrameAt = 0;
    lastVisionAt = 0;
    vision.resetFrameHistory();
}

function resetGame() {
    resetTrackingState();
    ui.setMotionStatus("Idle");
    physics.resetGame();
    physics.hideInputBall();
    updateDebugDisplay("target --", "strength 0.00", "tiny-js");
}

function updateDebugDisplay(targetText, strengthText, mode) {
    ui.setDebugText(formatDebugState({
        targetText,
        ball: physics.state.ball,
        strengthText,
        mode,
    }));
}

function sampleMotionFrame() {
    const now = performance.now();
    const deltaSeconds = lastFrameAt ? clamp((now - lastFrameAt) / 1000, 0.008, 0.034) : 1 / 60;
    lastFrameAt = now;
    physics.advanceBallMotion(deltaSeconds);

    const hasLiveVisionInput = camera.getStream() && vision.isReady() && elements.cameraPreview.readyState >= 2;
    if (!hasLiveVisionInput) {
        animationFrame = window.requestAnimationFrame(sampleMotionFrame);
        return;
    }
    
    // Vision runs on a slower cadence than rendering so the page can stay
    // responsive while the tiny motion sampler still provides intermittent hits.
    if (now - lastVisionAt < GAME_CONFIG.visionFrameIntervalMs) {
        animationFrame = window.requestAnimationFrame(sampleMotionFrame);
        return;
    }

    const visionDeltaSeconds = lastVisionAt
        ? clamp((now - lastVisionAt) / 1000, 0.03, 0.2)
        : GAME_CONFIG.visionFrameIntervalMs / 1000;
    lastVisionAt = now;
    const motionCenter = vision.captureMotionCenter();
    if (motionCenter) {
        const smoothedCenter = vision.smoothMotionCenter(motionCenter, previousMotionCenter);
        const motionTarget = vision.getMotionTarget(smoothedCenter);

        if (!vision.isFiniteMotionTarget(motionTarget)) {
            previousMotionCenter = null;
            ui.setMotionStatus("Math Error");
            physics.hideInputBall();
            updateDebugDisplay("target invalid", "strength invalid", "hit");
            animationFrame = window.requestAnimationFrame(sampleMotionFrame);
            return;
        }

        const motionHit = getMotionHit(smoothedCenter, previousMotionCenter, motionCenter.activePixels, GAME_CONFIG);
        if (motionHit && motionHit.strength > GAME_CONFIG.minStrengthToMove) {
            ui.setMotionStatus(describeMotion(motionHit.x, motionHit.y, motionHit.strength));
            physics.updateInputBall(
                { x: motionTarget.targetX, y: motionTarget.targetY },
                visionDeltaSeconds,
                motionHit.strength
            );
            updateDebugDisplay(
                `target ${Math.round(motionTarget.targetX)}, ${Math.round(motionTarget.targetY)}`,
                `strength ${motionHit.strength.toFixed(2)}`,
                "tiny-js"
            );
        } else {
            ui.setMotionStatus("Tracking");
            physics.updateInputBall(
                { x: motionTarget.targetX, y: motionTarget.targetY },
                visionDeltaSeconds,
                0
            );
            updateDebugDisplay(
                `target ${Math.round(motionTarget.targetX)}, ${Math.round(motionTarget.targetY)}`,
                "strength 0.00",
                "tiny-js"
            );
        }

        previousMotionCenter = smoothedCenter;
    } else {
        previousMotionCenter = null;
        ui.setMotionStatus("Idle");
        physics.hideInputBall();
        updateDebugDisplay("target --", "strength 0.00", "tiny-js");
    }

    animationFrame = window.requestAnimationFrame(sampleMotionFrame);
}

async function startCamera() {
    if (isFilePreviewMode()) {
        ui.setCameraStatus("File Mode");
        ui.setCameraHint("Camera preview is usually blocked on file:// pages. Use the Open Localhost button for camera access.");
        ui.setPlayfieldHint("The ball still works with arrow keys or WASD while you stay on file mode.");
        return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        ui.setCameraStatus("Unsupported");
        ui.setCameraHint("This browser context does not expose camera access.");
        console.error("Camera access is not supported in this browser.");
        return;
    }

    try {
        ui.setCameraStatus("Requesting");
        ui.setCameraHint("Waiting for browser camera permission...");
        await camera.start();
        vision.initializeProcessing();
        resetTrackingState();
        ui.setCameraStatus("Live");
        ui.setMotionStatus("Tracking");
        ui.setCameraHint("Camera is live and the lightweight motion engine is tracking frame changes.");
        ui.setPlayfieldHint("Move sharply to create hits. The shadow and cyan marker show what the motion engine sees.");
        ui.setPlayfieldCameraVisible(true);

        if (animationFrame) {
            window.cancelAnimationFrame(animationFrame);
        }

        animationFrame = window.requestAnimationFrame(sampleMotionFrame);
    } catch (error) {
        const cameraError = error && error.name ? error.name : "UnknownError";
        ui.setCameraStatus(cameraError.replace("Error", "") || "Blocked");

        if (cameraError === "NotAllowedError") {
            ui.setCameraHint("Camera permission was denied or blocked by this browser. Try http://localhost:4173 or reset the site camera permission.");
        } else if (cameraError === "NotFoundError") {
            ui.setCameraHint("No camera was found for this browser session.");
        } else if (cameraError === "NotReadableError") {
            ui.setCameraHint("The camera exists but is already in use by another app or browser tab.");
        } else {
            ui.setCameraHint(`Camera start failed: ${cameraError}.`);
        }

        console.error("Unable to start the camera for the move game.", error);
    }
}

function stopCamera() {
    if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
    }

    camera.stop();
    resetTrackingState();
    vision.disposeProcessing();
    ui.setCameraStatus("Stopped");
    ui.setMotionStatus("Idle");
    ui.setPlayfieldCameraVisible(false);
    physics.hideInputBall();
}

function handleKeyboardControl(event) {
    if (event.repeat) {
        return;
    }

    const key = event.key.toLowerCase();
    if (key === "arrowleft" || key === "a") {
        physics.moveBallWithKeyboard(-1, 0);
        ui.setMotionStatus("Keyboard");
    } else if (key === "arrowright" || key === "d") {
        physics.moveBallWithKeyboard(1, 0);
        ui.setMotionStatus("Keyboard");
    } else if (key === "arrowup" || key === "w") {
        physics.moveBallWithKeyboard(0, -1);
        ui.setMotionStatus("Keyboard");
    } else if (key === "arrowdown" || key === "s") {
        physics.moveBallWithKeyboard(0, 1);
        ui.setMotionStatus("Keyboard");
    }
}

elements.startButton.addEventListener("click", startCamera);
elements.resetButton.addEventListener("click", resetGame);
window.addEventListener("keydown", handleKeyboardControl);
window.addEventListener("resize", physics.resetPositions);
window.addEventListener("beforeunload", stopCamera);

configureInitialModeHints();
physics.resetPositions();
ui.setScore(physics.state.score);
updateDebugDisplay("target --", "strength 0.00", "tiny-js");
