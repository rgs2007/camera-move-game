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
        inputBall: {
            x: 0,
            y: 0,
            size: config.inputBallSize,
            vx: 0,
            vy: 0,
            visible: false,
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

    function renderInputBall() {
        ui.updateInputBall(state.inputBall);
    }

    function getCircleCenter(circle) {
        return {
            x: circle.x + circle.size / 2,
            y: circle.y + circle.size / 2,
        };
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
        state.inputBall.x = Math.round(bounds.width * 0.5);
        state.inputBall.y = Math.round(bounds.height * 0.5);
        state.inputBall.vx = 0;
        state.inputBall.vy = 0;
        state.inputBall.visible = false;
        state.goal.x = Math.round(bounds.width * 0.7);
        state.goal.y = Math.round(bounds.height * 0.24);

        renderBall();
        renderInputBall();
        ui.setInputBallVisible(false);
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

    /*
     * The blue input ball is controlled by the camera and behaves like a
     * kinematic object. It does not bounce around freely, but its measured
     * velocity is used to strike the pink ball when the circles overlap.
     */
    function updateInputBall(target, deltaSeconds, strength) {
        const bounds = getBounds();
        const maxX = bounds.width - state.inputBall.size;
        const maxY = bounds.height - state.inputBall.size;
        const nextX = clamp(target.x, 0, maxX);
        const nextY = clamp(target.y, 0, maxY);
        const safeDeltaSeconds = Math.max(deltaSeconds, 0.016);

        if (!state.inputBall.visible) {
            state.inputBall.x = nextX;
            state.inputBall.y = nextY;
            state.inputBall.vx = 0;
            state.inputBall.vy = 0;
            state.inputBall.visible = true;
            renderInputBall();
            return;
        }

        state.inputBall.vx = (nextX - state.inputBall.x) / safeDeltaSeconds;
        state.inputBall.vy = (nextY - state.inputBall.y) / safeDeltaSeconds;

        const speed = Math.hypot(state.inputBall.vx, state.inputBall.vy);
        if (speed > config.inputBallMaxSpeed) {
            const direction = normalizeVector(state.inputBall.vx, state.inputBall.vy);
            state.inputBall.vx = direction.x * config.inputBallMaxSpeed;
            state.inputBall.vy = direction.y * config.inputBallMaxSpeed;
        }

        state.inputBall.x = nextX;
        state.inputBall.y = nextY;
        renderInputBall();
        resolveInputBallCollision(strength);
    }

    /*
     * Circle collision is intentionally simple: the camera ball is treated as a
     * moving striker, so only the pink ball receives the resulting impulse.
     */
    function resolveInputBallCollision(strength) {
        if (!state.inputBall.visible) {
            return;
        }

        const ballCenter = getCircleCenter(state.ball);
        const inputCenter = getCircleCenter(state.inputBall);
        const deltaX = ballCenter.x - inputCenter.x;
        const deltaY = ballCenter.y - inputCenter.y;
        const distance = Math.hypot(deltaX, deltaY);
        const minimumDistance = state.ball.size / 2 + state.inputBall.size / 2;

        if (distance <= 0 || distance >= minimumDistance) {
            return;
        }

        const normal = {
            x: deltaX / distance,
            y: deltaY / distance,
        };
        const inputVelocityAlongNormal = state.inputBall.vx * normal.x + state.inputBall.vy * normal.y;
        const ballVelocityAlongNormal = state.ball.vx * normal.x + state.ball.vy * normal.y;
        const incomingSpeed = inputVelocityAlongNormal - ballVelocityAlongNormal;

        if (incomingSpeed <= 0) {
            return;
        }

        const impulse = incomingSpeed
            * config.inputBallCollisionRestitution
            * config.inputBallCollisionInfluence
            * Math.max(config.minFollowStrength, strength);

        state.ball.vx += normal.x * impulse;
        state.ball.vy += normal.y * impulse;

        const overlap = minimumDistance - distance;
        state.ball.x += normal.x * overlap;
        state.ball.y += normal.y * overlap;

        const speed = Math.hypot(state.ball.vx, state.ball.vy);
        if (speed > config.ballMaxSpeed) {
            const limitedDirection = normalizeVector(state.ball.vx, state.ball.vy, normal.x, normal.y);
            state.ball.vx = limitedDirection.x * config.ballMaxSpeed;
            state.ball.vy = limitedDirection.y * config.ballMaxSpeed;
        }

        renderBall();
        checkGoalCollision();
    }

    function hideInputBall() {
        state.inputBall.visible = false;
        state.inputBall.vx = 0;
        state.inputBall.vy = 0;
        ui.setInputBallVisible(false);
    }

    function moveBallWithKeyboard(horizontal, vertical) {
        state.ball.vx += horizontal * config.ballKeyboardSpeed * 12;
        state.ball.vy += vertical * config.ballKeyboardSpeed * 12;
    }

    return {
        state,
        resetPositions,
        resetGame,
        advanceBallMotion,
        updateInputBall,
        hideInputBall,
        moveBallWithKeyboard,
    };
}
