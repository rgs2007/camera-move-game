import { clamp } from "./math.js";

/*
 * Vision stays in its own module because camera-frame analysis is a distinct
 * concern from both physics and browser camera setup. This active engine avoids
 * OpenCV/WebAssembly and reads only a tiny canvas, which keeps the browser much
 * more responsive than full-frame CPU readback.
 */
export function createVisionEngine(videoElement, playfieldElement, config, ballSize) {
    const captureCanvas = document.createElement("canvas");
    const captureContext = captureCanvas.getContext("2d", { willReadFrequently: true });

    let processingReady = false;
    let previousLuminance = null;

    function setReady(value) {
        processingReady = value;
    }

    function isReady() {
        return processingReady;
    }

    function initializeProcessing() {
        disposeProcessing();

        if (!videoElement.videoWidth || !videoElement.videoHeight) {
            throw new Error("Camera video dimensions are not ready for motion initialization.");
        }

        captureCanvas.width = config.sampleWidth;
        captureCanvas.height = config.sampleHeight;
        previousLuminance = null;
        processingReady = true;
    }

    function disposeProcessing() {
        previousLuminance = null;
        processingReady = false;
    }

    function resetFrameHistory() {
        previousLuminance = null;
    }

    /*
     * Draw directly into the tiny sample canvas. This is the key performance
     * choice: the browser scales the video while drawing, and JavaScript only
     * reads a 48x36 image instead of the full camera frame.
     */
    function captureMotionCenter() {
        if (!processingReady) {
            return null;
        }

        captureContext.save();
        captureContext.translate(config.sampleWidth, 0);
        captureContext.scale(-1, 1);
        captureContext.drawImage(videoElement, 0, 0, config.sampleWidth, config.sampleHeight);
        captureContext.restore();

        const imageData = captureContext.getImageData(0, 0, config.sampleWidth, config.sampleHeight);
        const pixels = imageData.data;
        const luminance = new Uint8ClampedArray(config.sampleWidth * config.sampleHeight);

        for (let pixelIndex = 0, luminanceIndex = 0; pixelIndex < pixels.length; pixelIndex += 4, luminanceIndex += 1) {
            luminance[luminanceIndex] = Math.round(
                pixels[pixelIndex] * 0.299
                + pixels[pixelIndex + 1] * 0.587
                + pixels[pixelIndex + 2] * 0.114
            );
        }

        if (!previousLuminance) {
            previousLuminance = luminance;
            return null;
        }

        let activePixels = 0;
        let weightedX = 0;
        let weightedY = 0;
        let totalWeight = 0;

        for (let index = 0; index < luminance.length; index += 1) {
            const difference = Math.abs(luminance[index] - previousLuminance[index]);

            if (difference >= config.pixelDifferenceThreshold) {
                const x = index % config.sampleWidth;
                const y = Math.floor(index / config.sampleWidth);
                activePixels += 1;
                totalWeight += difference;
                weightedX += x * difference;
                weightedY += y * difference;
            }
        }

        previousLuminance = luminance;

        if (activePixels <= config.minActivePixels || totalWeight <= 0) {
            return null;
        }

        return {
            activePixels,
            centerX: weightedX / totalWeight,
            centerY: weightedY / totalWeight,
        };
    }

    function smoothMotionCenter(nextCenter, lastCenter) {
        if (!lastCenter) {
            return {
                x: nextCenter.centerX,
                y: nextCenter.centerY,
            };
        }

        return {
            x: lastCenter.x * config.smoothingPreviousWeight + nextCenter.centerX * config.smoothingCurrentWeight,
            y: lastCenter.y * config.smoothingPreviousWeight + nextCenter.centerY * config.smoothingCurrentWeight,
        };
    }

    function getMotionTarget(smoothedCenter) {
        const normalizedX = smoothedCenter.x / (config.sampleWidth - 1);
        const normalizedY = smoothedCenter.y / (config.sampleHeight - 1);
        const availableWidth = playfieldElement.clientWidth - ballSize;
        const availableHeight = playfieldElement.clientHeight - ballSize;
        const targetX = clamp(normalizedX * availableWidth, 0, availableWidth);
        const targetY = clamp(normalizedY * availableHeight, 0, availableHeight);

        return {
            normalizedX,
            normalizedY,
            targetX,
            targetY,
        };
    }

    function isFiniteMotionTarget(motionTarget) {
        return Number.isFinite(motionTarget.normalizedX)
            && Number.isFinite(motionTarget.normalizedY)
            && Number.isFinite(motionTarget.targetX)
            && Number.isFinite(motionTarget.targetY);
    }

    return {
        setReady,
        isReady,
        initializeProcessing,
        disposeProcessing,
        resetFrameHistory,
        captureMotionCenter,
        smoothMotionCenter,
        getMotionTarget,
        isFiniteMotionTarget,
    };
}
