import { ECSEntityId } from "fluidengine";
import { Transform, Vec2, Vector2 } from "fluidengine";
import { Fluid } from "fluidengine";
import { transformScaleLerpId } from "./animation/Interpolators";
import { Asteroid } from "./components/AsteroidComponent";
import { BoundingBox, createBoundingBox } from "./components/BoundingBoxComponent";
import { ChunkOccupancy } from "./components/ChunkOccupancyComponent";
import { Health } from "./components/HealthComponent";
import { Physics } from "./components/PhysicsComponent";
import { createPropertyAnimationsComponent } from "./components/PropertyAnimationComponent";
import { Sprite } from "./components/SpriteComponent";
import { Velocity } from "./components/VelocityComponent";
import { calculateRectangleMomentOfInertia } from "./Utils";
import { LifeTime } from "./components/LifetimeComponent";
import { Particle } from "./components/ParticleComponent";
import Assets, { SpriteKey } from "./Assets";
import { createSpriteEntity } from "./Sprites";

export interface AsteroidCreationParameters {
    position: Vec2;
    rotation: number;
    velocity: Vec2;
    angularVelocity: number;
    width: number;
    options?: AsteroidCreationOptions;
}

export interface AsteroidCreationOptions {
    spriteImageKey?: SpriteKey;
    density?: number;
    health?: number;
    deriveHealth?: (mass: number, size: number) => number;
    damageAnimationScalePercent?: number;
    damageAnimationDuration?: number;
}

export function createAsteroid(
    {
        position,
        rotation,
        velocity,
        angularVelocity,
        width,
        options = {}
    }: AsteroidCreationParameters
): ECSEntityId {
    const
        {
            spriteImageKey = "asteroidImage",
            density = 3.2,
            health: optionalHealth,
            deriveHealth = (mass: number, area: number) => mass * area,
            damageAnimationScalePercent = 1.11,
            damageAnimationDuration = 0.15

        }: AsteroidCreationOptions = options;

    const spriteImage = Assets.getSprite(spriteImageKey);
    const aspectRatio = spriteImage.height / spriteImage.width;
    const height = width * aspectRatio;
    const area = width * height;
    const mass = density * area;
    const sizeTransform: Transform = { scale: 1 };
    const health = optionalHealth ? optionalHealth : deriveHealth(mass, area);
    const entity = createSpriteEntity(
        Vector2.copy(position),
        rotation,
        spriteImageKey,
        3,
        {
            x: width,
            y: height
        }
    );
    Fluid.addEntityComponents(entity,
        Asteroid.createComponent({ area }),
        Velocity.createComponent({
            velocity,
            angular: angularVelocity
        }),
        Physics.createComponent({
            mass,
            centerOfMassOffset: Vector2.zero(),
            area: width * height,
            momentOfInertia: calculateRectangleMomentOfInertia(mass, width, height)
        }),
        ChunkOccupancy.createComponent({ chunkKeys: new Set() }),
        BoundingBox.createComponent(createBoundingBox({ width, height })),
        Health.createComponent({ maxHealth: health, currentHealth: health, visible: true }),
        createPropertyAnimationsComponent(
            [
                [
                    // Sprite animations
                    Sprite,
                    [
                        // damaged animation
                        {
                            propertyName: 'transform',
                            beginningValue: sizeTransform,
                            endingValue: { scale: damageAnimationScalePercent },
                            completed: true,
                            duration: damageAnimationDuration,
                            elapsed: 0,
                            onComplete(entityId, propertyAnimationComponent) {
                                const transform = propertyAnimationComponent.animations.get(Sprite.getId().getSymbol()).get('transform');
                                transform.completed = true;
                            },
                            interpolationId: transformScaleLerpId
                        }
                    ]
                ]
            ]
        )
    );
    return entity;
}
export function createAsteroidParticle(
    position: Vec2,
    velocity: Vec2,
    rotation: number,
    angularVelocity: number,
    spawnTime: number,
    lifeTime: number,
    size: number
): ECSEntityId {
    // const entityId = createSpriteEntity(
    //     position,
    //     rotation,
    //     "asteroidImage",
    //     3,
    //     { x: size, y: size }
    // );

    const particleId = createAsteroid(
        { position, rotation, velocity, angularVelocity, width: size }
    );
    Fluid.addEntityComponents(particleId,
        Particle.createComponent({})
    )

    // Fluid.addEntityComponents(entityId,
    Velocity.createComponent({ velocity: velocity, angular: angularVelocity }),
        LifeTime.createComponent({ lifeDuration: lifeTime, spawnTime }),
        Particle.createComponent({})
    // )
    // return entityId;

    return particleId;
}
