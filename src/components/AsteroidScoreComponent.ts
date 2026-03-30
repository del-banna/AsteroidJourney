/** 
    Released under MIT License
    Copyright (c) 2025 Del Elbanna
*/

import { Fluid } from "fluidengine";

export interface AsteroidScoreComponent {
    score: number;
}

export const AsteroidScore = Fluid.defineComponentType<AsteroidScoreComponent>("AsteroidScore");