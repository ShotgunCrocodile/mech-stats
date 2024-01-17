// Applying modifiers is done in 3 stages:
//
// 1. Negative additive and multiplicitive modifiers are applied.
//    Once this is done the result is used as the new base.
//
// 2. Positive additive and multiplicitive modifiers are applied.
//    Positive modifiers are applied to the base from the previous step.
//    Once this is done the result is used as the new base.
//
// 3. The level ups are applied to the base from the previous step.
//    The final result of this is the stats of the mech.
//
import type { MechData, ModData, ModEffect } from './data-types';
import { partition } from './utils';

/*
 * Generate a description of a mod from its effects.
 */
export function describeMod(mod: ModData): string {
    const propertyNames = new Map<string, string>([
        ["atk", "Damage"],
        ["hp", "Health"],
        ["range", "Range"],
        ["speed", "Speed"],
        ["cost", "Cost"],
        ["unlock", "Unlock Cost"],
        ["regeneration", "Regeneration"],
        ["upgrade", "Upgrade Cost"],
        ["interval", "Attack Interval"],
        ["reduction", "Damage Reduction"],
    ]);
    return mod.effects.map((effect: ModEffect) => {
        let verb = effect.value[0] === "-" ? "decreased by" : "increased by";
        if (effect.operation === "set") {
            verb = "set to";
        }
        const statName = propertyNames.get(effect.property);
        const amt = ((property: string, value: string, operation: string) => {
            let suffix = [];
            if (value[0] === "-") {
                value = value.slice(1);
            }
            if (value.slice(-1) === "L") {
                value = value.slice(0, -1);
                suffix.push(' per level');
            }
            if (operation === "mul" || property === "regeneration") {
                suffix.unshift("%");
                value = (parseFloat(value) * 100).toString();
            }
            if (property === "regeneration") {
                suffix.push("hp per second");
            }
            return value + suffix.join(' ');
        })(effect.property, effect.value, effect.operation);
        return `${statName} ${verb} ${amt}`.replace("  ", " ");
    }).join('\n');
}

/*
 * Take mech data and apply a list of modifications to it.
 */
export function modifyMech(baseStats: MechData, mods: ModData[], level: number): MechData {
    let base: MechData;
    let mech: MechData = cloneMech(baseStats);

    const stages = stagesFromMods(mods);
    for (const stage of stages) {
        base = cloneMech(mech);
        for (const modEffect of stage) {
            applyMod(base, mech, modEffect, level);
        }

    }
    mech.hp = Math.floor(mech.hp)
    mech.atk = Math.floor(mech.atk)
    return mech;
}

function stagesFromMods(mods: ModData[]): ModEffect[][] {
    const [levels, newMods] = partition(mods, (mod: ModData) => mod.name === "Level");
    const levelEffects = levels.length >= 1 ? levels[0].effects : [];

    const [negativeEffects, positiveEffects] = partition(
        newMods.map((mod: ModData) => mod.effects).flat(),
        (effect: ModEffect) => effect.value[0] === '-'
    );
    const stages: ModEffect[][] = [
        negativeEffects,
        positiveEffects,
        levelEffects,
    ];
    return stages;
}


function applyMod(baseMech: MechData, mech: MechData, effect: ModEffect, level: number): void {
    if (effect.operation !== "set" && !mech.hasOwnProperty(effect.property)) {
        throw Error('Mech does not have property ' + effect.property);
    }
    console.log(`applying ${effect.operation} ${effect.property} ${effect.value}`);
    operations[effect.operation](baseMech, mech, effect.property, effect.value, level);
}


function cloneMech(mech: MechData): MechData {
    let newMech = JSON.parse(JSON.stringify(mech));
    return newMech;
}

function parseValue(baseMech: MechData, property: string, value: string, level: number): number | string | boolean {
    if (property === "targets") {
        return value;
    }
    if (value === "true") return true;
    if (value === "false") return false;
    /// Replace L with the value of the mech's level and multiply.
    var result = value.split("L")
        .map((p) => p !== "" ? parseFloat(p) : level)
        .reduce((a, c) => a * c, 1);
    return result;
}

const operations = {
    "mul": (baseMech: MechData, mech: MechData, property: string, value: string, level: number) => {
        const parsedValue = parseValue(baseMech, property, value, level);
        const oldValue = mech[property];
        const baseValue = baseMech[property];
        mech[property] = oldValue + baseValue * parsedValue;
    },
    "add": (baseMech: MechData, mech: MechData, property: string, value: string, level: number) => {
        mech[property] += parseValue(baseMech, property, value, level);
    },
    "set": (baseMech: MechData, mech: MechData, property: string, value: string, level: number) => {
        mech[property] = parseValue(baseMech, property, value, level);
    },
};
