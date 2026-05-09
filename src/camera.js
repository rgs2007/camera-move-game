/*
 * Camera setup and teardown are isolated here because browser permission and
 * media-track behavior are some of the easiest parts of the app to break when
 * they are mixed into unrelated game logic.
 */
export function isFilePreviewMode() {
    return window.location.protocol === "file:";
}

export function createCameraController(elements, constraints) {
    let stream = null;

    async function start() {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        elements.cameraPreview.srcObject = stream;
        elements.playfieldCamera.srcObject = stream;
        await elements.cameraPreview.play();
        await elements.playfieldCamera.play();
        return stream;
    }

    function stop() {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            stream = null;
        }

        elements.cameraPreview.srcObject = null;
        elements.playfieldCamera.srcObject = null;
    }

    function getStream() {
        return stream;
    }

    return {
        start,
        stop,
        getStream,
    };
}
