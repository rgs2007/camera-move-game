/*
 * Debug output lives in its own file so we can keep the game loop readable while
 * still exposing enough state to tune the motion engine.
 */
export function formatDebugState({ targetText, ball, strengthText, mode }) {
    return [
        "Debug",
        targetText,
        `ball ${Math.round(ball.x)}, ${Math.round(ball.y)}`,
        strengthText,
        `mode ${mode}`,
    ].join("\n");
}
