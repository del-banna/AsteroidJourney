import { ImageUtils } from "fluidengine";
import { renderSingleNeonLaserSprite } from "./Sprites";

export type Sprites = {
    backgroundTileImage: HTMLImageElement;
    asteroidImage: HTMLImageElement;
    shipImage: HTMLImageElement;
    laserShotImage: HTMLImageElement;
    artilleryShellImage: HTMLImageElement;
}

export type SpriteKey = keyof Sprites;

export function loadImg(assetPath: string) {
    return ImageUtils.loadImage(`${assetRoot}/${assetPath}`);
}

export const assetRoot = "/assets";

export async function loadSprites(): Promise<Sprites> {
    const backgroundTileImage = await loadImg("background/space_background_tile.png");
    const asteroidImage = await loadImg("asteroid/asteroid1.png");
    const shipImage = await loadImg("ship/ship1.png");
    const laserShotCanvas = renderSingleNeonLaserSprite();
    const laserShotImage = ImageUtils.canvasToImage(laserShotCanvas);
    const artilleryShellImage = await loadImg("projectile/shell3.png");

    return {
        backgroundTileImage,
        asteroidImage,
        shipImage,
        laserShotImage,
        artilleryShellImage
    };
}

export type AssetData = {
    sprites: Sprites;
}

class AssetRepository {
    constructor(
        private assets: AssetData | undefined
    ) {
    }

    async loadAssets(): Promise<AssetData> {
        const sprites = await loadSprites();
        this.assets = { sprites };
        return this.assets;
    }

    getAssets(): AssetData | undefined {
        return this.assets;
    }

    getSprite(key: SpriteKey): HTMLImageElement | undefined {
        return this.assets?.sprites?.[key];
    }
}

export default new AssetRepository(undefined);