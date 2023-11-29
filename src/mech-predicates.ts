import type { MechData } from './data-types';


export function isAir(mech: MechData): boolean {
    return mech.location.includes("air");
}


export function isGround(mech: MechData): boolean {
    return mech.location.includes("ground");
}


export function calculateMechDPS(mech: MechData): Map<string, number> {
    let dpsTypes = new Map<string, number>([
        ["DPS", Math.round(mech.atk / mech.interval)],
    ]);

    if (mech.projectiles > 1) {
        dpsTypes.set("Full projectile DPS", dpsTypes.get("DPS")! * mech.projectiles);
    }

    if (mech.units > 1) {
        dpsTypes.set("Full pack DPS", dpsTypes.get("DPS")! * mech.projectiles * mech.units);
    }

    return dpsTypes;
}

export function calculateSurvival(mech: MechData): Map<string, string> {
    let survivals = new Map<string, string>([
        ["Seconds in fire", displayValue(secondsSurvivedInFire(mech))],
        ["Sentry Missile", displayValue(survivesSentryMissile(mech))],
        ["Missile Strike", displayValue(survivesMissileStrike(mech))],
        ["Orbital Strike", displayValue(survivesOrbitalStrike(mech))],
    ]);
    return survivals;
}


export function secondsSurvivedInFire(mech: MechData): number {
    if (isAir(mech)) return NaN;

    const fireDPS = 350 - mech.regeneration;
    if (fireDPS <= 0) {
        return NaN;
    }
    return mech.hp / fireDPS;
}


export function survivesSentryMissile(mech: MechData): boolean {
    return mech.hp > 5000 || mech.shielded === true;
}


export function survivesMissileStrike(mech: MechData): boolean {
    return mech.hp > 3000 || mech.shielded === true;
}


export function survivesOrbitalStrike(mech: MechData): boolean {
    // Orbital strike ignores shields.
    return mech.hp > 70000;
}


export function displayValue(value: number | boolean): string {
    if (value === true) return "Yes";
    if (value === false) return "No";
    if (isNaN(value)) return "Forever";
    return value.toFixed(2)
}


export function shiledBreak(mech: MechData) {
    return Math.round(40000 / (mech.atk * mech.projectiles * mech.units / mech.interval)) + " seconds"
}


export function towerKill(mech: MechData) {
    return Math.ceil(3400 / mech.atk) + " hits / " + Math.ceil(3400)
}


export function healthPerSupply(mech: MechData): string {
    const health = mech.shielded ? mech.hp * 2 : mech.hp;
    const cost = (mech.level - 1) * mech.upgrade + mech.cost;
    return ((mech.units * health) / cost).toFixed(2);

}
