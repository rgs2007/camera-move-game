import { clamp, normalizeVector } from "./math.js";

/*
 * The physics module owns ball and goal state. Keeping that state here means the
 * rest of the app can ask for "advance" or "apply hit" instead of rewriting box
 * physics inside UI or camera code.
 */
export function createPhysics(elements, config, ui) {
    const state = {
        score: 0,
        ball: {
            x: 0,
            y: 0,
            size: config.ballSize,
            vx: config.ballInitialSpeedX,
            vy: config.ballInitialSpeedY,
        },
        goal: {
            x: 0,
            y: 0,
            size: config.goalSize,
        },
    };

    function getBounds() {
        return {
            width: elements.playfield.clientWidth,
            height: elements.playfield.clientHeight,
        };
    }

    function renderBall() {
        ui.updateBall(state.ball);
    }

    function renderGoal() {
        ui.updateGoal(state.goal);
    }

    function keepBallSpeedHealthy() {
        const speed = Math.hypot(state.ball.vx, state.ball.vy);
        if (speed >= config.ballMinSpeed) {
            return;
        }

        const direction = normalizeVector(state.ball.vx, state.ball.vy, 1, 0.68);
        state.ball.vx = direction.x * config.ballMinSpeed;
        state.ball.vy = direction.y * config.ballMinSpeed;
    }

    function repositionGoalRandomly() {
        const bounds = getBounds();
        state.goal.x = Math.round(Math.random() * Math.max(bounds.width - state.goal.size, 0));
        state.goal.y = Math.round(Math.random() * Math.max(bounds.height - state.goal.size, 0));
        renderGoal();
    }

    function checkGoalCollision() {
        const ballCenterX = state.ball.x + state.ball.size / 2;
        const ballCenterY = state.ball.y + state.ball.size / 2;
        const goalCenterX = state.goal.x + state.goal.size / 2;
        const goalCenterY = state.goal.y + state.goal.size / 2;
        const distance = Math.hypot(ballCenterX - goalCenterX, ballCenterY - goalCenterY);

        if (distance < config.goalCollisionDistance) {
            state.score += 1;
            ui.setScore(state.score);
            repositionGoalRandomly();
        }
    }

    function resetPositions() {
        const bounds = getBounds();

        state.ball.x = Math.round(bounds.width * 0.18);
        state.ball.y = Math.round(bounds.height * 0.42);
        state.ball.vx = config.ballInitialSpeedX;
        state.ball.vy = config.ballInitialSpeedY;
        state.goal.x = Math.round(bounds.width * 0.7);
        state.goal.y = Math.round(bounds.height * 0.24);

        renderBall();
        renderGoal();
    }

    function resetGame() {
        state.score = 0;
        ui.setScore(state.score);
        resetPositions();
    }

    function advanceBallMotion(deltaSeconds) {
        const bounds = getBounds();
        const maxX = bounds.width - state.ball.size;
        const maxY = bounds.height - state.ball.size;

        state.ball.x += state.ball.vx * deltaSeconds;
        state.ball.y += state.ball.vy * deltaSeconds;

        if (state.ball.x <= 0 || state.ball.x >= maxX) {
            state.ball.x = clamp(state.ball.x, 0, maxX);
            state.ball.vx *= -config.ballBounceDamping;
        }

        if (state.ball.y <= 0 || state.ball.y >= maxY) {
            state.ball.y = clamp(state.ball.y, 0, maxY);
            state.ball.vy *= -config.ballBounceDamping;
        }

        const dragFactor = Math.pow(config.ballDragPerSecond, deltaSeconds * 60);
        state.ball.vx *= dragFactor;
        state.ball.vy *= dragFactor;
        keepBallSpeedHealthy();
        renderBall();
        checkGoalCollision();
    }

    function moveBallWithKeyboard(horizontal, vertical) {
        state.ball.vx += horizontal * config.ballKeyboardSpeed * 12;
        state.ball.vy += vertical * config.ballKeyboardSpeed * 12;
    }

    function applyMotionHit(hitX, hitY, strength) {
        if (config.directFollowDebug) {
            const bounds = getBounds();
            state.ball.x = clamp(state.ball.x + hitX * 80 * strength, 0, bounds.width - state.ball.size);
            state.ball.y = clamp(state.ball.y + hitY * 80 * strength, 0, bounds.height - state.ball.size);
            state.ball.vx = 0;
            state.ball.vy = 0;
            renderBall();
            checkGoalCollision();
            return;
        }

        const followStrength = Math.max(config.minFollowStrength, strength);
        const shotForce = config.ballShotImpulse * followStrength;

        state.ball.vx += hitX * shotForce;
        state.ball.vy += hitY * shotForce;

        const speed = Math.hypot(state.ball.vx, state.ball.vy);
        if (speed > config.ballMaxSpeed) {
            const limitedDirection = normalizeVector(state.ball.vx, state.ball.vy, hitX, hitY);
            state.ball.vx = limitedDirection.x * config.ballMaxSpeed;
            state.ball.vy = limitedDirection.y * config.ballMaxSpeed;
        }
    }

    return {
        state,
        resetPositions,
        resetGame,
        advanceBallMotion,
        moveBallWithKeyboard,
        applyMotionHit,
    };
}
