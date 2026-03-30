
/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine";
import { Transform } from "fluidengine";
import { ProjectileType } from "../Projectiles";


export interface ProjectileWeaponComponent {
    transform?: Transform;
    muzzleSpeed: number;
    fireRate: number;
    lastFireTime: number;
    projectileWidth: number;
    projectileType: ProjectileType;
}

export const ProjectileWeapon = Fluid.defineComponentType<ProjectileWeaponComponent>("Projectile Source");
