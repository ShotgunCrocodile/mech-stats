export type MechData = {
    gameid: number;
    name: string;
    location: string;
    hp: number;
    atk: number;
    level: number;
    cost: number;
    unlock: number;
    upgrade: number;
    upkeep: number;
    tags: string[];
    interval: number;
    projectiles: number;
    units: number;
    regeneration: number;
    dimension: {
        width: number,
        height: number,
    };
    shielded?: boolean;
};


export type ModEffect = {
    property: string;
    operation: "mul" | "add" | "set" | "pop";
    value: string;
    target?: string;
};


export type ModData = {
    name: string;
    price?: string;
    tags?: string[];
    effects: ModEffect[];
    transactions?: any[];
    hooks?: HookHandler[];
};


export type HookHandler = {
    turn?: string;
    name: string;
    operation: string;
    value: any;
    persist?: boolean;
}
