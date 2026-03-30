/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine";
import { ECSNode } from "fluidengine";
import { FluidSystem } from "fluidengine/internal";
import { Asteroid, AsteroidComponent } from "../../components/AsteroidComponent";
import { DeathByProjectile } from "../../components/DeathByProjectileComponent";
import { AsteroidScore } from "../../components/AsteroidScoreComponent";


const schema = {
    asteroid: Asteroid,
    deathByProjectile: DeathByProjectile
}

type Schema = typeof schema;
const nodeMeta = Fluid.registerNodeSchema(schema, "AsteroidDeathByProjectile");

export class AsteroidKillScoreSystem extends FluidSystem<Schema> {
    constructor(
    ) {
        super("Asteroid Kill Score System", nodeMeta);
    }

    calculateScore(asteroidData: AsteroidComponent) {
        return Math.sqrt(asteroidData.area) * Math.SQRT2 * 10;
    }

    updateNode(node: ECSNode<Schema>): void {
        const {
            asteroid,
            deathByProjectile
        } = node;
        const projectileData = deathByProjectile.projectileData;

        if (!projectileData.source || !Fluid.entityHasComponent(projectileData.source, AsteroidScore))
            return;

        Fluid.getEntityComponent(projectileData.source!, AsteroidScore).data.score += this.calculateScore(asteroid);
    }
}