/*
 * This module owns DOM lookup and DOM mutation. The rest of the game should be
 * able to ask for UI changes without needing to remember selectors or class names.
 */
export function getDomElements() {
    return {
        startButton: document.getElementById("startButton"),
        resetButton: document.getElementById("resetButton"),
        cameraStatus: document.getElementById("cameraStatus"),
        motionStatus: document.getElementById("motionStatus"),
        scoreValue: document.getElementById("scoreValue"),
        cameraHint: document.getElementById("cameraHint"),
        playfieldHint: document.getElementById("playfieldHint"),
        localhostLink: document.getElementById("localhostLink"),
        cameraPreview: document.getElementById("cameraPreview"),
        playfieldCamera: document.getElementById("playfieldCamera"),
        playfield: document.getElementById("playfield"),
        motionMarker: document.getElementById("motionMarker"),
        debugChip: document.getElementById("debugChip"),
        ball: document.getElementById("ball"),
        goal: document.getElementById("goal"),
    };
}

export function createUi(elements) {
    function setCameraStatus(message) {
        elements.cameraStatus.textContent = message;
    }

    function setMotionStatus(message) {
        elements.motionStatus.textContent = message;
    }

    function setCameraHint(message) {
        elements.cameraHint.textContent = message;
    }

    function setPlayfieldHint(message) {
        elements.playfieldHint.textContent = message;
    }

    function setScore(score) {
        elements.scoreValue.textContent = String(score);
    }

    function setLocalhostLinkText(message) {
        elements.localhostLink.textContent = message;
    }

    function setPlayfieldCameraVisible(isVisible) {
        elements.playfieldCamera.classList.toggle("playfield-camera-live", isVisible);
    }

    function setMotionMarkerVisible(isVisible) {
        elements.motionMarker.classList.toggle("motion-marker-live", isVisible);
    }

    function updateBall(position) {
        elements.ball.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;
    }

    function updateGoal(position) {
        elements.goal.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;
    }

    function updateMotionMarker(position, ballSize) {
        elements.motionMarker.style.transform = `translate3d(${position.x + ballSize / 2 - 21}px, ${position.y + ballSize / 2 - 21}px, 0)`;
        setMotionMarkerVisible(true);
    }

    function setDebugText(message) {
        elements.debugChip.textContent = message;
    }

    return {
        setCameraStatus,
        setMotionStatus,
        setCameraHint,
        setPlayfieldHint,
        setScore,
        setLocalhostLinkText,
        setPlayfieldCameraVisible,
        setMotionMarkerVisible,
        updateBall,
        updateGoal,
        updateMotionMarker,
        setDebugText,
    };
}
