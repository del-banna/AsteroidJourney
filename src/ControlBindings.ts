import { ECSComponent, FluidEngine } from "fluidengine";
import { MovementControlComponent } from "./components/MovementControlComponent";
import { ClientContext } from "./client/Client";
import { FireControlComponent } from "./components/FireControlComponent";

export function mouseButtonToString(button: number): string {
    return `mouse${button}`;
}

export function createControlBinding(
    controlBindingProperties: ControlBindingProperties = {
        keys: [],
        action: () => { }
    }
): ControlBinding {
    return new ControlBinding(controlBindingProperties);
}

export interface ControlBindingAction {
    (self: ControlBinding): void;
}

export interface ControlBindingProperties {
    keys: string[];
    name?: string;
    description?: string;
    onTrigger?: ControlBindingAction;
    action?: ControlBindingAction;
    onRelease?: ControlBindingAction;
    continuous?: boolean;
    enabled?: boolean;
}

export class ControlBinding {
    public name: string;
    public description: string;
    public keys: string[];
    public onTrigger: ControlBindingAction;
    public action: ControlBindingAction;
    public onRelease: ControlBindingAction;
    public continuous: boolean;
    public enabled: boolean;
    public active: boolean;
    public sustained: boolean;
    public metadata: Record<string, any> = {};

    constructor(
        props: ControlBindingProperties = {
            keys: [],
            action: () => { }
        }) {
        this.name = props.name || "Unnamed Control Binding";
        this.description = props.description || "";
        this.onTrigger = props.onTrigger || (() => { });
        this.action = props.action || (() => { });
        this.onRelease = props.onRelease || (() => { });
        this.continuous = props.continuous || false;
        this.enabled = props.enabled !== undefined ? props.enabled : true;

        this.active = false;
        this.sustained = false;

        const keys = props.keys || [];
        this.keys = keys.map(k => k.toLowerCase());
    }
}

export type KeyStateMap = Map<string, boolean>;

export class ControlBinder {
    private discreetBindings: ControlBinding[] = [];
    private continuousBindings: ControlBinding[] = [];
    private keyStates: KeyStateMap = new Map();

    constructor() {
    }

    static processBindings(bindings: ControlBinding[], keyStates: KeyStateMap): void {
        for (const binding of bindings) {
            if (!binding.enabled) continue;

            const triggered = binding.keys.some(k => keyStates.get(k));

            if (!triggered) {
                binding.active = false;
                binding.sustained = false;
                continue
            }

            if (!binding.active) {
                binding.active = true;
                binding.sustained = false;
                binding.onTrigger(binding);
            } else {
                binding.sustained = true;
            }

            binding.action(binding);
        }
    }

    processDiscreetBindings(): ControlBinder {
        ControlBinder.processBindings(this.discreetBindings, this.keyStates);
        return this;
    }

    processContinuousBindings(): ControlBinder {
        ControlBinder.processBindings(this.continuousBindings, this.keyStates);
        return this;
    }

    onKeyDeactivation(key: string) {
        key = key.toLowerCase();
        for (const binding of this.getBindings()) {
            const isRelevant = binding.keys.some(k => k === key);
            const isTriggered = binding.keys.some(k => this.keyStates.get(k));
            if (!binding.enabled || !isRelevant || isTriggered)
                continue;

            binding.onRelease(binding);

            binding.active = false;
            binding.sustained = false;
        }
    }

    registerBinding(binding: ControlBinding): ControlBinder {
        (binding.continuous ? this.continuousBindings : this.discreetBindings).push(binding);
        return this;
    }

    getBindings(): ControlBinding[] {
        return [...this.discreetBindings, ...this.continuousBindings];
    }

    getActiveBindings(): ControlBinding[] {
        return this.getBindings().filter(b => b.enabled && b.keys.some(k => this.keyStates.get(k)));
    }

    setKeyState(key: string, pressed: boolean): void {
        this.keyStates.set(key, pressed);
    }

    getKeyState(key: string): boolean {
        return this.keyStates.get(key) || false;
    }

    clearKeyStates(): ControlBinder {
        this.keyStates.clear();
        return this;
    }

    registerKeyActivation(key: string) {
        this.setKeyState(key.toLowerCase(), true);
        this.processDiscreetBindings();
    }

    registerKeyDeactivation(key: string) {
        key = key.toLowerCase();
        this.setKeyState(key, false);
        this.onKeyDeactivation(key);
    }

    registerKeyboardListeners(element: HTMLElement = window.document.body): ControlBinder {
        element.addEventListener("keydown", (event) => {
            event.preventDefault();
            this.registerKeyActivation(event.key);
        });

        element.addEventListener("keyup", (event) => {
            this.registerKeyDeactivation(event.key);
        });
        return this;
    }

    registerMouseListeners(element: HTMLElement = window.document.body): ControlBinder {
        element.addEventListener("mousedown", (event: MouseEvent) => {
            this.registerKeyActivation(mouseButtonToString(event.button));
        });

        element.addEventListener("mouseup", (event: MouseEvent) => {
            this.registerKeyDeactivation(mouseButtonToString(event.button));
        });
        return this;
    }

    registerDefaultListeners(): ControlBinder {
        this.registerKeyboardListeners();
        this.registerMouseListeners();
        return this;
    }
}

export function createDefaultControlBindings(
    engine: FluidEngine,
    clientContext: ClientContext,
    movementControlComponent: ECSComponent<MovementControlComponent>,
    fireControlComponent: ECSComponent<FireControlComponent>
): Record<string, ControlBinding> {
    return {
        // Movement controls
        up: createControlBinding({
            name: "Move Up",
            keys: ["w"],
            action: () => {
                movementControlComponent.data.accelerationInput.y += 1;
            },
            continuous: true
        }),
        // down: createControlBinding({
        //     name: "Move Down",
        //     keys: ["s"],
        //     action: () => {
        //         movementControlComponent.data.accelerationInput.y += -1;
        //     },
        //     continuous: true
        // }),
        // left: createControlBinding({
        //     name: "Move Left",
        //     keys: ["a"],
        //     action: () => {
        //         movementControlComponent.data.accelerationInput.x += -1;
        //     },
        //     continuous: true
        // }),
        // right: createControlBinding({
        //     name: "Move Right",
        //     keys: ["d"],
        //     action: () => {
        //         movementControlComponent.data.accelerationInput.x += 1;
        //     },
        //     continuous: true
        // }),
        yawLeft: createControlBinding({
            name: "Yaw Left",
            keys: ["a"],
            action: () => {
                movementControlComponent.data.yawInput -= 1;
            },
            continuous: true
        }),
        yawRight: createControlBinding({
            name: "Yaw Right",
            keys: ["d"],
            action: () => {
                movementControlComponent.data.yawInput += 1;
            },
            continuous: true
        }),
        // Fire control
        fire_keyboard: createControlBinding({
            name: "Fire",
            keys: [" ", mouseButtonToString(0)],
            action: () => {
                fireControlComponent.data.fireIntent = true;
            },
            continuous: true
        }),
        // Hotkeys
        pause: createControlBinding({
            name: "Pause",
            keys: ["escape"],
            action: () => {
                engine.toggleAnimation();
            }
        }),
        eagle_eye_zoom: createControlBinding({
            name: "Far Zoom",
            keys: ["v"],
            action: () => clientContext.setZoomLevel(5)
        }),
        reset_zoom: createControlBinding({
            name: "Reset Zoom",
            keys: ["x"],
            action: () => clientContext.setZoomLevel(30)
        }),
        decrease_zoom: createControlBinding({
            name: "Decrease Zoom",
            keys: ["z"],
            action: () => {
                const decrement = 10;
                const max = 100;
                const min = decrement;
                const next = (clientContext.getZoomLevel() - decrement);
                clientContext.setZoomLevel(next < min ? max : next);
            }
        }),
        increase_zoom: createControlBinding({
            name: "Increase Zoom",
            keys: ["c"],
            action: () => {
                const increment = 10;
                const max = 100;
                const min = increment;
                const next = (clientContext.getZoomLevel() + increment);
                clientContext.setZoomLevel(next > max ? min : next);
            }
        }),
        focus: createControlBinding({
            name: "Focus",
            keys: ["shift"],
            onTrigger: (self) => {
                const oZ = clientContext.getZoomLevel();
                const oTS = clientContext.getSimulationSpeed();
                self.metadata.originalZoom = oZ;
                self.metadata.originalTimeScale = oTS;
                clientContext.setZoomLevel(oZ * 2.25);
                clientContext.setSimulationSpeed(oTS * 0.5);
            },
            onRelease: (self) => {
                clientContext.setZoomLevel(self.metadata.originalZoom);
                clientContext.setSimulationSpeed(self.metadata.originalTimeScale);
            }
        }),
        slow_time: createControlBinding({
            name: "Slow Time",
            keys: ["["],
            action: () => clientContext.setSimulationSpeed(clientContext.getSimulationSpeed() / 2)
        }),
        speed_time: createControlBinding({
            name: "Speed Time",
            keys: ["]"],
            action: () => clientContext.setSimulationSpeed(clientContext.getSimulationSpeed() * 2)
        }),
        reset_simulation_speed: createControlBinding({
            name: "Reset Simulation Speed",
            keys: ["-"],
            action: () => clientContext.setSimulationSpeed(1)
        }),
        toggle_debug_info: createControlBinding({
            name: "Toggle Debug Info",
            keys: ["f1"],
            action: () => {
                clientContext.displayDebugInfo = !clientContext.displayDebugInfo;
            }
        }),
        toggle_colliders: createControlBinding({
            name: "Toggle Colliders",
            keys: ["f2"],
            action: () => {
                clientContext.displayBoundingBoxes = !clientContext.displayBoundingBoxes;
            }
        }),
        toggle_display_axes: createControlBinding({
            name: "Toggle Display Axes",
            keys: ["f3"],
            action: () => {
                clientContext.displayEntityAxes = !clientContext.displayEntityAxes;
            }
        }),
        toggle_display_chunks: createControlBinding({
            name: "Toggle Display Chunks",
            keys: ["f4"],
            action: () => {
                clientContext.displayChunks = !clientContext.displayChunks;
            }
        })
    };
}

export function registerDefaultBindings(
    controlBinder: ControlBinder,
    engine: FluidEngine,
    clientContext: ClientContext,
    movementControlComponent: ECSComponent<MovementControlComponent>,
    fireControlComponent: ECSComponent<FireControlComponent>
): ControlBinder {
    const bindings = createDefaultControlBindings(engine, clientContext, movementControlComponent, fireControlComponent);
    Object.values(bindings).forEach(binding => {
        controlBinder.registerBinding(binding);
    });
    return controlBinder;
}