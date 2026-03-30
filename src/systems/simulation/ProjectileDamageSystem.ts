
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine";
import { ECSNode } from "fluidengine";
import { FluidSystem } from "fluidengine/internal";
import { Collision } from "../../components/CollisionComponent";
import { EntityDeath } from "../../components/EntityDeathComponent";
import { Health } from "../../components/HealthComponent";
import { Projectile } from "../../components/ProjectileComponent";
import { Asteroid } from "../../components/AsteroidComponent";
import { PropertyAnimation } from "../../components/PropertyAnimationComponent";
import { Sprite } from "../../components/SpriteComponent";
import { DeathByProjectile } from "../../components/DeathByProjectileComponent";

const schema = {
    projectile: Projectile,
    collision: Collision
}

type Schema = typeof schema;

const nodeMeta = Fluid.registerNodeSchema(schema, "Projectile Damage");

export class ProjectileDamageSystem extends FluidSystem<Schema> {
    constructor() {
        super("Projectile Damage System", nodeMeta);
    }

    updateNode(node: ECSNode<Schema>): void {
        const { collision, entityId: projectileEntityId, projectile: projectileData } = node;
        const otherEntity = Fluid.getEntityProxy(collision.collidedEntity);

        if (!otherEntity.hasComponent(Health))
            return;

        const healthData = otherEntity.getComponent(Health).data;
        const health = Math.max(0, healthData.currentHealth - projectileData.damage);
        healthData.currentHealth = health;

        // Temp for testing
        if (otherEntity.hasComponent(Asteroid) && otherEntity.hasComponent(PropertyAnimation)) {
            const animations = otherEntity.getComponent(PropertyAnimation).data.animations;
            const anim = animations.get(Sprite.getId().getSymbol())?.get('transform');
            if (anim) {
                if (anim.completed) {
                    anim.elapsed = 0;
                    anim.completed = false;
                }
            }
        }

        if (health === 0)
            if (!otherEntity.hasComponent(EntityDeath)) {
                otherEntity.addComponent(EntityDeath.createComponent({ readyToRemove: false }));
                otherEntity.addComponent(DeathByProjectile.createComponent({ projectileData: projectileData }))
            }

        Fluid.removeEntity(projectileEntityId);
        otherEntity.removeComponent(Collision);
    }
}