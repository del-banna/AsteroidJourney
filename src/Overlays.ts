import { CanvasRenderer } from "./client/renderer/Renderer";
import { ControlBinder, ControlBinding } from "./ControlBindings";
import { drawComplexText } from "./Utils";

export function drawPauseScreen(
    renderContext: CanvasRenderingContext2D,
    renderer: CanvasRenderer
) {
    renderContext.save();

    renderContext.globalAlpha = 0.5;
    renderer.clear();
    renderContext.globalAlpha = 0.5;
    renderContext.font = "bold 256px calibri"
    renderContext.fillStyle = "white";
    renderContext.fillText("⏸", (renderer.getWidth() - 256) / 2, renderer.getHeight() / 2);

    renderContext.font = "bold 48px calibri"
    renderContext.fillText("Press 'Escape' or click to start", (renderer.getWidth() - 48 * 12) / 2, renderer.getHeight() * 0.65);

    renderContext.restore();
}


export function drawControlGuide(
    controlBinder: ControlBinder,
    renderContext: CanvasRenderingContext2D,
    renderer: CanvasRenderer
) {
    renderContext.save();
    renderContext.globalAlpha = 1;
    renderContext.font = "16px calibri"
    renderContext.fillStyle = "white";
    renderContext.textAlign = "left";

    const bindings = controlBinder.getBindings().filter(b => b.name && b.keys.length > 0 && b.enabled);
    const groups: Map<string, ControlBinding[]> = new Map();
    bindings.forEach(b => {
        if (!groups.get(b.group))
            groups.set(b.group, []);
        else
            groups.get(b.group).push(b);
    });

    const keysString = (keys: string[]) => `[ ${keys.map(k => `'${k.toUpperCase()}'`).join(" / ")} ]`;

    const lines = bindings.map(b =>
        `${keysString(b.keys)}\t\t\t\t ${b.name}${b.continuous ? " (hold)" : ""}${b.description ? ` :${b.description}` : ""}\n`
    );

    const pairings = lines.map(line => [line, "white"] as [string, string]);

    drawComplexText(renderContext, 10, 20, pairings, 4);


    renderContext.restore();
}