
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid, Vec2 } from "fluidengine";
import { ECSNode } from "fluidengine";
import { FluidSystem } from "fluidengine/internal";
import { Vector2 } from "fluidengine";
import { ClientContext } from "../../client/Client";
import { Asteroid } from "../../components/AsteroidComponent";
import { EntityDeath } from "../../components/EntityDeathComponent";
import { Position, PositionComponent } from "../../components/PositionComponent";
import { Velocity } from "../../components/VelocityComponent";
import { createAsteroidParticle, DEFAULT_ASTEROID_CREATION_OPTIONS } from "../../Asteroids";

/** 
 * CONSTANTS
 */

const EXPLOSION_UNIT_FORCE = 0.08;
const ASTEROID_AREA_EXPLOSION_FORCE_RATIO = 10; // per unit area
const EXPLOSION_FORCE_VARIANCE = 0.5 * EXPLOSION_UNIT_FORCE;
const MIN_FRAGMENT_AREA = 0.02
const ASTEROID_DENSITY = DEFAULT_ASTEROID_CREATION_OPTIONS.density!;

// 
// 
// 

const schema = {
    asteroid: Asteroid,
    position: Position,
    velocity: Velocity,
    entityDeath: EntityDeath,
}

type Schema = typeof schema;
const nodeMeta = Fluid.registerNodeSchema(schema, "Asteroid Death");

function generateRandomUnitVector(componentCount: number, min = 0): number[] {
    let sumOfSquares = 0;
    const vector = Array.from({ length: componentCount }, () => {
        const random = min + (1 - min) * Math.random();
        sumOfSquares += random ** 2;
        return random;
    });

    const magnitude = Math.sqrt(sumOfSquares);

    if (magnitude === 0) {
        return new Array(componentCount).fill(0);
    }

    return vector.map((component) => component / magnitude);
}

function getSumRandomDistributionVector(sum: number, componentCount: number, minRandom: number = 0): number[] {
    /* 
    Pseudo-code explanation:
        Let S be the 'sum' parameter value;
        We want sum(v_i) = S

        We can take advantage of vector properties;
        |v| = sqrt(sum(v_i^2))
        |v|^2 = sum(v_i^2)

        Let k = |v|^2 = S
        Then |v| = sqrt(k) = sqrt(S)
        Then using a random unit vector, we simply scale it;
        Let r be a random unit vector, and u be its scaled counterpart;
        u = r * sqrt(S)
        The vector u has magnitude sqrt(S);
        sqrt(sum(u_i^2)) = sqrt(S)

        So the sum of the squared components of u is equal to S
        sum(u_i^2) = S
    */
    const magnitude = Math.sqrt(sum);
    const randomUnitVector = generateRandomUnitVector(componentCount, minRandom);
    return randomUnitVector.map(component => (component * magnitude) ** 2);
}

export class AsteroidDeathSystem extends FluidSystem<Schema> {
    constructor(
        public clientContext: ClientContext,

    ) {
        super("Asteroid Death System", nodeMeta);
    }

    createFragments(
        parentPosition: Vec2,
        parentVelocity: Vec2,
        parentRotation: number,
        parentAngularVelocity: number,
        parentArea: number
    ) {
        const countMin = 3;
        const countMax = 9;
        const count = countMin + Math.round(countMax * Math.random());

        const angleParts = getSumRandomDistributionVector(2 * Math.PI, count);
        const areas = getSumRandomDistributionVector(parentArea, count, 0.02);

        const explosionForceVariance = (Math.random() - 0.5) * EXPLOSION_FORCE_VARIANCE;
        const explosionForce = ASTEROID_AREA_EXPLOSION_FORCE_RATIO * parentArea * EXPLOSION_UNIT_FORCE + explosionForceVariance;

        let angle = 0;
        for (let i = 0; i < count; i++) {
            angle += angleParts[i];

            const area = areas[i];
            const size = Math.sqrt(area);

            const mass = area * ASTEROID_DENSITY;

            const accelMag = explosionForce / Math.sqrt(mass);
            const accelX = Math.cos(angle) * accelMag;
            const accelY = Math.sin(angle) * accelMag;
            createAsteroidParticle(
                Vector2.copy(parentPosition),
                Vector2.add(parentVelocity, { x: accelX, y: accelY }),
                parentRotation + angle,
                parentAngularVelocity + accelMag * Math.random(),
                this.clientContext.engineInstance.getGameTime(),
                5, // Lifetime; currently unused to experiment with new mechanics
                size
            );
        }
    }

    updateNode(node: ECSNode<Schema>): void {
        const {
            asteroid,
            position,
            velocity,
            entityDeath,
            entityId
        } = node;
        const { area: parentArea } = asteroid;

        if (entityDeath.readyToRemove) {
            Fluid.removeEntity(entityId);
            return;
        }

        if (parentArea > MIN_FRAGMENT_AREA) {
            this.createFragments(
                position.position,
                velocity.velocity,
                position.rotation,
                velocity.angular,
                parentArea
            );
        }

        entityDeath.readyToRemove = true;
    }
}