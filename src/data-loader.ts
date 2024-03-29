import type { MechData, ModData } from './data-types';
import { deepCopy, isDefined } from './utils';

export class DataDir {
    mechData: Map<string, MechData>;
    modData: { [k: string]: ModData };
    startData: string[][];
    priceData: Map<string, Map<string, number>>;
    deviceData: { [k: string]: Object };

    constructor(
        mechData: Map<string, MechData>,
        modData: { [k: string]: ModData },
        startData: string[][],
        priceData: Object,
        deviceData: { [k: string]: Object },
    ) {
        this.mechData = mechData;
        this.modData = modData;
        this.startData = startData;
        this.priceData = new Map(
            Object.entries(priceData).map(([key, value]) => [key, new Map(Object.entries(value))]));
        this.deviceData = deviceData;
    }

    mechNames(): string[] {
        return Object.keys(this.mechData).sort();
    }

    allMechs(): { [k: string]: MechData } {
        return Object.fromEntries(this.mechNames()
            .map((name) => [name, this.mechForName(name)!]));
    }

    mechTags(name: string): string[] {
        const mech = this.mechData[name];
        if (mech === undefined) {
            throw new Error("Could not find mech named " + name);
        }
        return [name, "Mech"].concat(mech.tags);
    }

    modsForTags(tags: string[]): ModData[] {
        return Object.values(this.modData)
            .filter((mod) => {
                if (mod.tags === undefined) return false;
                if (mod.tags[0] === '*') return true;
                let result = mod.tags.some((modTag: string) => tags.includes(modTag))
                return result;
            });
    }

    modForName(name: string): ModData | undefined {
        for (const mod of Object.values(this.modData)) {
            if (mod.name === name) {
                return mod;
            }
        }
        return undefined;
    }

    modsForNames(names: string[]): ModData[] {
        return names
            .map((name) => this.modForName(name))
            .filter(isDefined);
    }

    mechForName(name: string): MechData | undefined {
        for (const mech of Object.values(this.mechData)) {
            if (mech.name === name) {
                return deepCopy(mech);
            }
        }
        return undefined;
    }

    techsAndPricesForMech(name: string): { name: string, price: number }[] {
        const entry = this.priceData.get(name);
        if (entry === undefined) {
            throw new Error("Could not find price data for " + name);
        }

        return [...entry]
            .map(([name, price]) => {
                const mod = this.modData[name];
                return {
                    "name": mod?.name || name,
                    "price": price,
                }
            });
    }

    deviceForName(name: string): Object | undefined {
        return this.deviceData[name];
    }

    objectForGameId(gameID: number): Object | undefined {
        const mods = Object.values(this.modData).filter((m: any) => m.gameid === gameID);
        if (mods.length === 1) {
            return mods[0];
        }
        const mechs = Object.values(this.mechData).filter((m: any) => m.gameid === gameID);
        if (mechs.length === 1) {
            return mechs[0];
        }
        return undefined;
    }
}


export async function loadDataDir(version: string): Promise<DataDir> {
    const [
        mechData,
        unitData,
        specData,
        techData,
        itemData,
        reinforceData,
        otherData,
        startData,
        priceData,
        deviceData,
    ] = await Promise.all([
        fetch(`/data/${version}/mechs.json`).then((r) => r.json()),
        fetch(`/data/${version}/unit-upgrades.json`).then((r) => r.json()),
        fetch(`/data/${version}/specialists.json`).then((r) => r.json()),
        fetch(`/data/${version}/techs.json`).then((r) => r.json()),
        fetch(`/data/${version}/items.json`).then((r) => r.json()),
        fetch(`/data/${version}/reinforcments.json`).then((r) => r.json()),
        fetch(`/data/${version}/other.json`).then((r) => r.json()),
        fetch(`/data/${version}/starts.json`).then((r) => r.json()),
        fetch(`/data/${version}/prices.json`).then((r) => r.json()),
        fetch(`/data/${version}/devices.json`).then((r) => r.json()),
    ]);

    const modData = {
        ...unitData,
        ...specData,
        ...techData,
        ...itemData,
        ...reinforceData,
        ...otherData,
    };

    return new Promise<DataDir>((resolve) => {
        resolve(new DataDir(mechData, modData, startData, priceData, deviceData));
    }).then(d => { return d; });
}


export function modAppliesToMech(mod: ModData, mech: MechData): boolean {
    const tags = mech.tags.concat([mech.name]);
    if (mod.tags === undefined) return false;
    if (mod.tags[0] === "*") return true;
    return mod.tags.some((modTag: string) => tags.includes(modTag));
}
