import { ECSComponent, Vec2 } from "fluidengine";
import { CanvasRenderer } from "./client/renderer/Renderer";
import { PositionComponent } from "./components/PositionComponent";
import { VelocityComponent } from "./components/VelocityComponent";

export abstract class HUDItem {
    /**
     * 
     * @param normalizedScreenPosition A pair of values, each between -1 and 1, indicating the position on the screen relative to the center along either axis respectively.
     */
    constructor(
        private normalizedScreenPosition: Vec2 = { x: 0, y: 0 }
    ) {
        this.setNormalizedScreenPosition(normalizedScreenPosition);
    }

    private static clipNormalizedScreenPosition(normalizedScreenPosition: Vec2): Vec2 {
        return {
            x: Math.max(-1, Math.min(1, normalizedScreenPosition.x)),
            y: Math.max(-1, Math.min(1, normalizedScreenPosition.y))
        };
    }

    public setNormalizedScreenPosition(normalizedScreenPosition: Vec2) {
        this.normalizedScreenPosition = HUDTextItem.clipNormalizedScreenPosition(normalizedScreenPosition);
    }

    public getNormalizedScreenPosition(): Vec2 {
        return this.normalizedScreenPosition;
    }

    public getScreenPosition(renderer: CanvasRenderer): Vec2 {
        const width = renderer.getWidth();
        const height = renderer.getHeight();
        return {
            x: (this.normalizedScreenPosition.x + 1) * width / 2,
            y: (this.normalizedScreenPosition.y + 1) * height / 2
        };
    }

    abstract render(renderer: CanvasRenderer): void;
}

export interface HUDTextItemOptions {
    font?: string;
    color?: string;
    textAlign?: CanvasTextAlign;
    textBaseline?: CanvasTextBaseline;
    opacity?: number;
    renderCallback?: (renderer: CanvasRenderer, hudTextItem: HUDTextItem) => void;
}

export const defaultHUDTextItemOptions: HUDTextItemOptions = {
    font: "28px DigitalFont",
    color: "#288bed",
    textAlign: "left",
    textBaseline: "middle",
    opacity: 0.75
};

export class HUDTextItem extends HUDItem {

    /**
     * 
     * @param normalizedScreenPosition A pair of values, each between -1 and 1, indicating the position on the screen relative to the center along either axis respectively.
     * @param resolveValue 
     * @param font 
     * @param color 
     */
    constructor(
        normalizedScreenPosition: Vec2 = { x: 0, y: 0 },
        private resolveValue: () => string | number | boolean | null | undefined | object | symbol | bigint | void = () => "",
        private options: HUDTextItemOptions = defaultHUDTextItemOptions
    ) {
        super(normalizedScreenPosition);
        this.options = { ...defaultHUDTextItemOptions, ...options };
    }

    render(renderer: CanvasRenderer): void {
        const ctx = renderer.renderContext;
        const text = String(this.resolveValue());
        const position = this.getScreenPosition(renderer);

        const { font, color, textAlign, textBaseline, opacity } = this.options;

        ctx.save();
        if (font)
            ctx.font = font;
        if (color)
            ctx.fillStyle = color;
        if (opacity !== undefined)
            ctx.globalAlpha = opacity;
        if (textAlign)
            ctx.textAlign = textAlign;
        if (textBaseline)
            ctx.textBaseline = textBaseline;

        if (this.options.renderCallback) {
            this.options.renderCallback(renderer, this);
        }

        ctx.fillText(text, position.x, position.y);

        ctx.fillStyle = "red";
        ctx.fillText(".", position.x, position.y);

        ctx.restore();
    }
}

export class HUD {
    public static createDefaultHUD(
        positionComponent: ECSComponent<PositionComponent>,
        velocityComponent: ECSComponent<VelocityComponent>
    ): HUD {
        return new HUD([
            new HUDTextItem(
                { x: 0.98, y: 0.95 },
                () => `${positionComponent.data.rotation.toFixed(2)} RAD`,
                { textAlign: "right" }
            ),
            new HUDTextItem(
                { x: 0.98, y: 0.88 },
                () => `${Math.hypot(...Object.values(velocityComponent.data.velocity)).toFixed(2)} M/S`,
                { textAlign: "right" }
            )
        ]);
    }

    constructor(
        private items: HUDItem[] = []
    ) { }

    public addItem(item: HUDItem): void {
        this.items.push(item);
    }

    public removeItem(item: HUDItem): void {
        const index = this.items.indexOf(item);
        if (index !== -1) {
            this.items.splice(index, 1);
        }
    }

    public render(renderer: CanvasRenderer): void {
        for (const item of this.items) {
            item.render(renderer);
        }
    }
}