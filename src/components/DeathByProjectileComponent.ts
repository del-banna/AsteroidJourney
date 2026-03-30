/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine";
import ProjectileComponent from "./ProjectileComponent";

export interface DeathByProjectileComponent {
    projectileData: ProjectileComponent;
}

export const DeathByProjectile = Fluid.defineComponentType<DeathByProjectileComponent>("DeathByProjectile");