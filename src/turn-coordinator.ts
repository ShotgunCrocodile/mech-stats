import { CURRENT_VERSION } from './consts';
import type { Ref } from 'vue';
import type { DataDir } from './data-loader';
import { modAppliesToMech } from './data-loader';
import type { ModData, MechData, ModEffect, HookHandler } from './data-types';
import { deepCopy, isDefined, partition, numberSequence, encode } from './utils';
import { modifyMech } from './mech-updater';


interface Transaction {
    turn: string;
    name: string;
    price: string;
}

function transactionAppliesToTurn(params: {
    transaction: Transaction,
    turnAdded: number,
    currentTurn: number,
}): boolean {
    if (params.transaction.turn === "*") return true;
    if (params.transaction.turn === params.currentTurn.toString()) return true;

    let result = appliesToTurn(
        params.transaction.turn,
        params.turnAdded,
        params.currentTurn,
    );
    return result;
}

function appliesToTurn(expr: string, turnAdded: number, currentTurn: number): boolean {
    if (expr.indexOf('n') === -1) return false;
    expr = expr.replace("n", turnAdded.toString());
    expr = currentTurn.toString() + expr;
    return Function(`return (${expr})`)();

}

function turnGrantTransaction(turn: number): Transaction {
    return {
        "name": `Turn ${turn} Supply Grant`,
        "price": `${turn * -200}`,
        "turn": turn.toString(),
    }
}

function purchaseModTransaction(mod: ModData, turn: number): Transaction {
    return {
        "name": mod.name,
        "price": mod.price || "0",
        "turn": turn.toString(),
    }

}

export class TurnState {
    turn: number;
    reinforcement: string;
    startingSupply: number;
    leftoverSupply: number;
    transactions: Transaction[];
    towerButtons: Object;
    mechSlots: string[];
    totalMechSlots: number;
    army: ArmySnapshot;
    recoveredUnit: string;
    techs: TechSnapshot;
    unitUnlock: string;

    constructor() {
        this.turn = 1;
        this.reinforcement = "";
        this.startingSupply = 0;
        this.leftoverSupply = 0;
        this.transactions = [turnGrantTransaction(this.turn)];
        this.towerButtons = {};
        this.mechSlots = [];
        this.totalMechSlots = 2;
        this.army = new ArmySnapshot();
        this.recoveredUnit = "";
        this.techs = {};
        this.unitUnlock = "";
    }

    restoreDefaults() {
        this.totalMechSlots = 2;
    }

    tallyTransactions() {
        this.leftoverSupply = this.transactions.reduce((accumulator, transaction) => {
            return accumulator + parseFloat(transaction.price) * -1;
        }, this.startingSupply);
    }

    nextTurnState() {
        this.turn += 1;
        this.startingSupply = this.leftoverSupply;
    }

    snapshot(): TurnState {
        let snapshot = deepCopy(this);
        snapshot.army = undefined;
        return snapshot;
    }
}


export class MechabellumTurnInterface {
    turnNumber: number;
    update: ((state: TurnState) => void);
    reinforcement: Ref<string>;
    unitUnlock: Ref<string>;
    startingUnits: Ref<string>;
    towerButtons: Ref<Object>;
    mechSlots: Ref<string[]>;
    recoveredUnit: Ref<string>;
    levelUps: Ref<Set<number>>;
    techs: Ref<TechSnapshot>;
    devices: Object;

    constructor(params: {
        turnNumber: number,
        update: ((state: TurnState) => void),
        reinforcement: Ref<string>,
        transactions: Transaction[],
        unitUnlock: Ref<string>,
        startingUnits: Ref<string>,
        towerButtons: Ref<Object>,
        mechSlots: Ref<string[]>,
        recoveredUnit: Ref<string>;
        levelUps: Ref<Set<number>>;
        techs: Ref<TechSnapshot>;
        devices: Object;
    }) {
        this.turnNumber = params.turnNumber;
        this.update = params.update;
        this.reinforcement = params.reinforcement;
        this.unitUnlock = params.unitUnlock;
        this.startingUnits = params.startingUnits;
        this.towerButtons = params.towerButtons;
        this.mechSlots = params.mechSlots;
        this.recoveredUnit = params.recoveredUnit;
        this.levelUps = params.levelUps;
        this.techs = params.techs;
        this.devices = params.devices;
    }

    activeTowerOptions(): string[] {
        return Object.entries(this.towerButtons.value)
            .filter(([_, active]) => active)
            .map(([name, _]) => name);
    }

    snapshot(): Object {
        return deepCopy(Object.entries({
            turnNumber: this.turnNumber,
            reinforcement: this.reinforcement.value,
            towerButtons: Object.entries(this.towerButtons.value)
                .filter(([_, value]) => value)
                .map(([key, _]) => key),
            unitUnlock: this.unitUnlock.value,
            startingUnits: this.startingUnits.value ? this.startingUnits.value : null,
            mechSlots: this.mechSlots.value,
            recoveredUnit: this.recoveredUnit.value,
            levelUps: Array.from(this.levelUps.value),
            devices: Object.fromEntries(Object
                .entries(this.devices)
                .map(([key, value]) => [key, value.value])
                .filter(([_, value]) => value > 0)),
        }).reduce((a: any, [k, v]) => (v == null ? a : (a[k] = v, a)), {}));
    }
}

type Handler = (hook: HookHandler, state: TurnState, eventName: string) => void;

class EventHandler {
    hooks: HookHandler[];
    handlers: Map<string, Handler>

    constructor(mods: ModTracker, army: Army) {
        this.hooks = [];
        this.handlers = new Map([
            ["removeMod", (hook: HookHandler, state: TurnState, _eventName: string) => {
                mods.deleteMod(hook.value, state.turn);
            }],
            ["addMod", (hook: HookHandler, state: TurnState, _eventName: string) => {
                mods.addModNamed({ name: hook.value, turn: state.turn, free: false });
            }],
            ["unlock", (hook: HookHandler, _state: TurnState, _eventName: string) => {
                army.unlockUnit(hook.value);
            }],
            ["recruitUnit", (hook: HookHandler, state: TurnState, _eventName: string) => {
                army.addPurchasedUnits([hook.value], state.turn);
                army.deploymentOpportunities += 1;
            }],
            ["editBuildSlots", (hook: HookHandler, _state: TurnState, _eventName: string) => {
                army.buildSlots += parseInt(hook.value);
            }],
            ["setMinLevel", (hook: HookHandler, _state: TurnState, _eventName: string) => {
                army.setMinimumLevelFor(hook.value);
            }],

        ]);
    }

    addHooks(hooks: HookHandler[]) {
        this.hooks = this.hooks.concat(hooks);
    }

    preArmySnapshot(state: TurnState) {
        this.executeFor(state, "preArmySnapshot");
    }

    preRecruit(state: TurnState) {
        this.executeFor(state, "preRecruit");
    }

    nextTurnBegin(state: TurnState) {
        this.executeFor(state, "nextTurnBegin");
    }

    turnEnd(state: TurnState) {
        this.executeFor(state, "turnEnd");
    }

    executeFor(state: TurnState, eventName: string) {
        const [hooksToExecute, leftoverHooks] = partition(
            this.hooks,
            this.shouldExecuteHook.bind(this, state, eventName),
        )

        hooksToExecute.forEach((hook) => this.execute(hook, state, eventName));
        this.hooks = leftoverHooks
            .concat(hooksToExecute.filter((hook: HookHandler) => hook.persist));
    }

    shouldExecuteHook(state: TurnState, eventName: string, hook: HookHandler): boolean {
        return (
            hook.name === eventName &&
            (hook.turn === undefined || hook.turn === state.turn.toString())
        )
    }

    execute(hook: HookHandler, state: TurnState, eventName: string) {
        const handler = this.getHandler(hook.operation);
        handler(hook, state, eventName);
    }

    getHandler(name: string): Handler {
        const handler = this.handlers.get(name);
        if (handler === undefined) {
            throw new Error("Cannot find handler for " + name);
        }
        return handler;
    }

}

class TrackedMod {
    data: ModData;
    turnAdded: number;
    free: boolean;

    constructor(params: {
        data: ModData,
        turnAdded: number,
        free?: boolean,
    }) {
        this.data = params.data;
        this.turnAdded = params.turnAdded;
        this.free = params.free ? params.free : false;
    }

}

class ModTracker {
    dataDir: DataDir;
    mods: TrackedMod[][];

    constructor(params: { dataDir: DataDir }) {
        this.dataDir = params.dataDir;
        this.mods = [];
    }

    deleteMod(name: string, turn: number) {
        this.mods[turn] = this
            .modsOnTurn(turn)
            .filter((mod) => mod.data.name !== name);
    }

    modsOnTurn(turn: number): TrackedMod[] {
        return this.mods[turn] || [];
    }

    addModsFromTurn(turn: MechabellumTurnInterface): void {
        const priorModNames: string[] = this
            .modsAffectingTurn(turn.turnNumber)
            .map((mod) => mod.name);
        this.addModForTurn({
            mod: this.dataDir.modForName(turn.reinforcement.value)!,
            turn: turn.turnNumber,
            free: turn.turnNumber === 1,
        });

        turn
            .activeTowerOptions()
            .filter((modName) => !priorModNames.includes(modName))
            .map((modName) => this.dataDir.modForName(modName))
            .filter(isDefined)
            .forEach((mod) => this.addModForTurn({ mod: mod, turn: turn.turnNumber }));
    }

    addModNamed(param: { name: string, turn: number, free?: boolean }) {
        const mod = this.dataDir.modForName(param.name);
        if (mod === undefined) {
            throw new Error("No mod definition for name: " + param.name);
        }
        this.addModForTurn({
            mod: mod,
            turn: param.turn,
            free: param.free,
        })
    }

    addModForTurn(param: { mod: ModData, turn: number, free?: boolean }) {
        this.mods[param.turn] = (this.mods[param.turn] || [])
            .concat(new TrackedMod({
                data: param.mod,
                turnAdded: param.turn,
                free: param.free ? true : false,
            }));
    }

    applyModsToTurnState(state: TurnState) {
        this.modsAffectingTurn(state.turn)
            .map((mod) => mod.effects)
            .flat()
            .filter((effect) => effect)
            .forEach((effect) => {
                this.applyModEffectToTurnState(state, effect);
            });
    }

    applyModEffectToTurnState(state: TurnState, effect: ModEffect) {
        if (effect.operation === "add") {
            if (state.hasOwnProperty(effect.property)) {
                state[effect.property] += parseFloat(effect.value);
            }
        }
    }

    effectDoesTargetTurn(state: TurnState, effect: ModEffect): boolean {
        if (effect.target === undefined || !effect.target.startsWith("turn")) return false;
        return true;
    }

    trackedModsAffectingTurn(turn: number): TrackedMod[] {
        const mods = this.mods
            .slice(1, turn + 1)
            .flat()
            .filter(isDefined)
        return mods;

    }

    modsAffectingTurn(turn: number): ModData[] {
        const mods = this
            .trackedModsAffectingTurn(turn)
            .map((trackedMod) => trackedMod.data)
        return mods;
    }

    modsPurchasedOnTurn(turn: number): ModData[] {
        let mods = this.mods
            .slice(1, turn + 1)
            .flat()
            .filter(isDefined)
            .filter((trackedMod) => trackedMod.turnAdded === turn && !trackedMod.free)
            .map((trackedMod) => trackedMod.data);
        return mods;
    }

    transactionsForModPurchases(turn: number): Transaction[] {
        return this
            .modsPurchasedOnTurn(turn)
            .map((mod) => purchaseModTransaction(mod, turn));
    }


    transactionsForTurn(turn: number): Transaction[] {
        let transactions = this.trackedModsAffectingTurn(turn)
            .filter((mod) => mod.data.hasOwnProperty("transactions"))
            .map((mod) => {
                return (mod
                    .data
                    .transactions || [])
                    .map((transaction) => {
                        return {
                            transaction: transaction,
                            turnAdded: mod.turnAdded,
                            currentTurn: turn,
                        }
                    });
            })
            .flat()
            .filter(transactionAppliesToTurn)
            .map((obj) => obj.transaction);
        return transactions;
    }

}

export class ArmySnapshot {
    units: Unit[];
    buildSlots: number;
    lockedUnits: string[];
    unlockedUnits: string[];
    valueOnBoard: number;
    deploymentOpportunities: number;
    unitCount: number;

    constructor(params?: {
        units?: Unit[],
        buildSlots?: number,
        lockedUnits?: string[],
        unlockedUnits?: string[],
        deploymentOpportunities?: number;
        recoveredUnit?: string,
    }) {
        params = params || {};
        this.units = params.units || [];
        this.buildSlots = params.buildSlots || 2;
        this.lockedUnits = params.lockedUnits || [];
        this.unlockedUnits = params.unlockedUnits || [];
        this.valueOnBoard = this.units
            .reduce((acc, unit) => acc + (unit.ident !== params?.recoveredUnit ? unit.value : 0), 0);
        this.deploymentOpportunities = params.deploymentOpportunities || 0;
        this.unitCount = this.units.length - (params?.recoveredUnit !== "" ? 1 : 0);
    }
}

export class Unit {
    static MaxLevel = 9;

    baseModel: MechData;
    turnPurchased: number;
    levelMod: ModData;
    level: number;
    ident: string;
    value: number;

    constructor(params: {
        model: MechData,
        turnPurchased: number,
        level: number,
        ident: string;
    }) {
        this.baseModel = params.model;
        this.turnPurchased = params.turnPurchased;
        this.levelMod = this.levelModForLevel(params.level);
        this.level = params.level;
        this.ident = params.ident;
        this.value = this.calculateValue();
    }

    levelUp(params?: { times?: number }) {
        const times = params?.times || 1;
        const newLevel = this.level + times;
        this.setLevel(newLevel);
    }

    setLevel(level: number) {
        level = Math.min(level, Unit.MaxLevel);
        this.level = level;
        this.levelMod = this.levelModForLevel(level);
        this.calculateValue();
    }

    calculateValue(): number {
        this.value = this.baseModel.cost + this.baseModel.upgrade * (this.level - 1);
        return this.value;
    }

    levelModForLevel(level: number): ModData {
        return {
            "name": "Level",
            "effects": [
                {
                    "property": "level",
                    "operation": "set",
                    "value": level.toString(),
                },
                {
                    "property": "atk",
                    "operation": "mul",
                    "value": (level - 1).toString(),
                },
                {
                    "property": "hp",
                    "operation": "mul",
                    "value": (level - 1).toString(),
                }
            ]
        }
    }
}




class Army {
    dataDir: DataDir;
    unlockedUnits: string[];
    buildSlots: number;
    units: { [k: string]: Unit };
    minimumLevel: { [k: string]: number };
    identGenerator: Generator<number>;
    deploymentOpportunities: number;

    constructor(params: { dataDir: DataDir }) {
        this.dataDir = params.dataDir;
        this.unlockedUnits = [];
        this.buildSlots = 2;
        this.units = {};
        this.minimumLevel = {};
        this.identGenerator = numberSequence(0);
        this.deploymentOpportunities = 5;
    }

    snapshot(unlockSlot: string, recoveredUnit: string): ArmySnapshot {
        const [unlockedUnits, lockedUnits] = partition(
            this.dataDir.mechNames(),
            (v) => this.unlockedUnits.includes(v)
        );

        return new ArmySnapshot({
            units: Object.values(this.units).map((unit) => deepCopy(unit)),
            buildSlots: this.buildSlots,
            lockedUnits: lockedUnits.concat(unlockSlot).sort(),
            unlockedUnits: unlockedUnits.concat("").sort(),
            deploymentOpportunities: this.deploymentOpportunities,
            recoveredUnit: recoveredUnit,
        });
    }

    incrementOpportunities(turn: MechabellumTurnInterface) {
        const extras = turn?.towerButtons.value["Mass Recruitment"] ? 0 : 1;
        this.deploymentOpportunities += this.buildSlots + extras;
    }

    minimumLevelFor(name: string): number {
        return this.minimumLevel[name] || this.minimumLevel['*'] || 1;
    }

    setMinimumLevelFor(params: { name: string, level: number, overwrite?: boolean }) {
        params.overwrite = params.overwrite || false;
        let value = params.level;
        if (!params.overwrite) {
            value = Math.max(params.level, this.minimumLevelFor(params.name));
        }
        this.minimumLevel[params.name] = value;
    }

    applyLevelUps(turn: MechabellumTurnInterface) {
        Array.from(turn.levelUps.value)
            .map((ident: number) => this.units[ident])
            .flat()
            .filter(isDefined)
            .forEach((unit: Unit) => unit.levelUp())
    }

    unitNames(value: string): string[] {
        return value.split('/')
            .map((part) => part.trim())
            .filter((part) => part.length > 0);
    }

    addUnitUnlocks(units: string | null) {
        if (units === null) return;
        this
            .unitNames(units)
            .forEach((name) => this.unlockUnit(name));
    }

    isUnitUnlocked(name: string): boolean {
        return this.unlockedUnits.includes(name);
    }

    unlockUnit(name: string) {
        if (!this.isUnitUnlocked(name)) {
            this.unlockedUnits.push(name);
        }
    }

    addStartingUnits(units: string) {
        if (units === "") return;
        const unlocks = this.unitNames(units);

        const lowTierMech = this.dataDir.mechForName(unlocks[0])!;
        const highTierMech = this.dataDir.mechForName(unlocks[1])!;

        this.addUnits(lowTierMech, 3, 1, 1);
        this.addUnits(highTierMech, 2, 1, 1);
    }

    parseUnitShorthand(shorthand: string): { name: string, level: number } | undefined {
        if (shorthand === "") return undefined;
        // Example:
        // shorthand: MARKSMAN(3)
        // result: ["MARKSMAN(3)", "MARKSMAN", "(3)", "3"]
        // We want element 1 and 3 for the name and level.
        // If level is not present we default to 1.
        const result = shorthand.match(/([A-Z ]+)(\((\d)\))?/);
        if (result === null) return undefined;

        return { name: result[1], level: parseInt(result[3]) || this.minimumLevelFor(result[1]) };
    }

    addPurchasedUnits(slots: string[], turn: number): string[] {
        return slots
            .map((slot: string) => this.parseUnitShorthand(slot))
            .filter(isDefined)
            .map((obj) => {
                return {
                    mech: this.dataDir.mechForName(obj.name)!,
                    ...obj,
                }
            })
            .map((obj) => {
                return this.addUnit(obj.mech, turn, obj.level);
            })
    }

    addUnits(mech: MechData, count: number, turn: number, level: number): string[] {
        return Array(count).fill('').map(() => this.addUnit(mech, turn, level));
    }

    addUnit(data: MechData, turn: number, level: number): string {
        const ident = this.identGenerator.next().value!.toString();
        const unit = new Unit({
            model: data,
            turnPurchased: turn,
            level: level,
            ident: ident,
        });
        this.units[ident] = unit;
        return unit.ident;
    }

    removeUnit(ident: number | string) {
        if (typeof ident === "string") ident = parseInt(ident);
        delete this.units[ident];
    }
}


type MechName = string;
type TechName = string;
class TechInfo {
    static defaultBoughtTurn = 999;

    name: TechName;
    price: number;
    boughtOn: number;

    constructor(params: {
        name: TechName;
        price: number;
        boughtOn?: number;

    }) {
        this.name = params.name;
        this.price = params.price;
        this.boughtOn = params?.boughtOn || TechInfo.defaultBoughtTurn;
    }
}
type TechMap = { [k: TechName]: TechInfo };
type FullTechMap = { [k: MechName]: TechMap };
export type TechSnapshot = FullTechMap;

export class TechState {
    dataDir: DataDir;
    techs: FullTechMap;

    constructor(params: { dataDir: DataDir }) {
        this.dataDir = params.dataDir;
        this.techs = this.initializeTechs();
    }

    initializeTechs(): FullTechMap {
        let techs = Object.fromEntries(this
            .dataDir
            .mechNames()
            .map((mechName) => [mechName, this.techMapForMech(mechName)]));
        techs[""] = {};
        return techs;
    }

    techMapForMech(mechName: MechName): TechMap {
        return Object.fromEntries(this
            .dataDir
            .techsAndPricesForMech(mechName)
            .map((info) => {
                return [info.name, { ...info, boughtOn: TechInfo.defaultBoughtTurn }]
            }));
    }

    snapshot(): TechSnapshot {
        return deepCopy(this.techs);
    }

    sparseSnapshot(): TechSnapshot {
        return Object.fromEntries(
            Object
                .entries(this.techs)
                .map(([mechName, techMap]: [MechName, TechMap]) => {
                    return [
                        mechName,
                        Object.fromEntries(
                            Object.entries(techMap)
                                .filter(([_, techInfo]) => {
                                    return techInfo.boughtOn !== TechInfo.defaultBoughtTurn;
                                })
                        )
                    ];
                })
                .filter(([_, techMap]) => Object.keys(techMap).length > 0)
        )
    }
}

export class TurnCoordinator {
    dataDir: DataDir;
    turns: MechabellumTurnInterface[];
    techs: TechState;
    updateExportString: (_: string) => void;
    loadTurn: (_: MechabellumTurnInterface) => void;

    constructor(params: {
        dataDir: DataDir,
        updateExportString: (_: string) => void,
        loadTurn: (_: MechabellumTurnInterface) => void,
    }) {
        this.dataDir = params.dataDir;
        this.turns = [];
        this.techs = new TechState({ dataDir: this.dataDir });
        this.updateExportString = params.updateExportString;
        this.loadTurn = params.loadTurn;
    }

    addTurn(turn: MechabellumTurnInterface) {
        this.turns.push(turn);
        this.loadTurn(turn);
    }

    generateTurns() {
        let mods = new ModTracker({ dataDir: this.dataDir });
        let army = new Army({ dataDir: this.dataDir });
        let state: TurnState = new TurnState();
        let turnSnapshots = [];
        const eventHandler = new EventHandler(mods, army);

        for (const [index, turn] of this.turns.entries()) {
            const turnNumber = index + 1;
            state.restoreDefaults()
            state.reinforcement = turn.reinforcement.value.slice();
            state.unitUnlock = this.copyUnitUnlock(turn.unitUnlock.value, army);

            this.ensureTowerButtonsSelected(mods, state, turn);
            state.recoveredUnit = turn.recoveredUnit.value;

            mods.addModsFromTurn(turn);
            eventHandler.addHooks(
                mods
                    .modsOnTurn(turnNumber)
                    .map((modWrapper) => modWrapper.data)
                    .filter(isDefined)
                    .map((mod) => mod.hooks)
                    .filter(isDefined)
                    .flat()
            )

            eventHandler.preArmySnapshot(state);
            army.addUnitUnlocks(turn.unitUnlock.value);
            army.addUnitUnlocks(turn.startingUnits.value);
            state.mechSlots = this.copyMechSlots(turn, army);

            eventHandler.preRecruit(state);
            army.addStartingUnits(turn.startingUnits.value);
            const newUnitIdents = army.addPurchasedUnits(state.mechSlots, turnNumber);
            army.applyLevelUps(turn);
            army.incrementOpportunities(turn);
            state.army = army.snapshot(turn.unitUnlock.value, state.recoveredUnit);

            state.transactions = Array()
                .concat([turnGrantTransaction(turnNumber)])
                .concat(mods.transactionsForTurn(turnNumber))
                .concat(mods.transactionsForModPurchases(turnNumber))
                .concat(this.transactionsForDevices(turn))
                .concat(this.transactionsForUnitUnlock(state.unitUnlock, turnNumber, mods))
                .concat(this.transactionsForUnitPurchases(turnNumber, mods, newUnitIdents, army))
                .concat(this.transactionsForUnitUpgrades(turn, army))
                .concat(this.transactionsForUnitRecovery(state, turnNumber, mods, army))
                .concat(this.transactionsForUnitTech(turn.turnNumber))
                .concat(this.transactionsForUnitUpkeep(army, turn.turnNumber));
            state.tallyTransactions();
            army.removeUnit(state.recoveredUnit);

            mods.applyModsToTurnState(state);
            this.ensureCorrectMechSlotsCount(state, army);

            turnSnapshots.push(turn.snapshot());
            turn.update(state);

            eventHandler.turnEnd(state);
            state.nextTurnState()
            eventHandler.nextTurnBegin(state);
        }

        this.updateExportString(this.generateExportString(turnSnapshots))
    }

    private copyUnitUnlock(unitName: string, army: Army): string {
        return army.isUnitUnlocked(unitName) ? "" : unitName;
    }

    copyMechSlots(turn: MechabellumTurnInterface, army: Army): string[] {
        return turn.mechSlots.value.map((value) => army.unlockedUnits.includes(value) ? value : "");
    }

    setTechs(techs: FullTechMap) {
        Object.entries(techs).forEach(([mechName, techTree]) => {
            Object.entries(techTree).forEach(([techName, techInfo]) => {
                this.techs.techs[mechName][techName] = techInfo;
            })
        });
    }

    generateExportString(turnSnapshots: Object[]): string {
        const saveState = {
            version: CURRENT_VERSION,
            techs: this.techs.sparseSnapshot(),
            turns: turnSnapshots,
        };
        return encode(JSON.stringify(saveState));
    }

    transactionsForDevices(turn: MechabellumTurnInterface): Transaction[] {
        return Object.entries(turn.devices)
            .map(([deviceName, count]) => {
                if (count.value === 0) return undefined;
                const device = this.dataDir.deviceForName(deviceName)!;
                return {
                    "name": `Place ${deviceName} x ${count.value}`,
                    "price": `${device.price * count.value}`,
                    "turn": turn.turnNumber.toString(),
                }
            })
            .filter(isDefined);
    }

    transactionsForUnitUpkeep(army: Army, turn: number): Transaction[] {
        return Object.values(army.units)
            .filter((unit: Unit) => unit.baseModel.upkeep > 0 && unit.turnPurchased < turn)
            .map((unit: Unit) => {
                // This is unfortunatly a special case where efficient maintenance only
                // applies AFTER the turn its selected so our normal way of selecting
                // techs and blanket applying them will wind up giving the discount a turn
                // early. So we just hardcode it here. If they add more upkeep mechanics
                // this will need to be addressed.
                let mech = deepCopy(unit.baseModel);
                let mod = this.techs.techs[unit.baseModel.name]["Efficient Maintenance"];
                if (mod && mod.boughtOn < turn) {
                    mech = modifyMech(mech, [this.dataDir.modForName(mod.name)!]);
                }
                return {
                    "name": `${mech.name} Upkeep`,
                    "price": `${mech.upkeep}`,
                    "turn": turn.toString(),
                }
            })
    }

    transactionsForUnitTech(turn: number): Transaction[] {
        const transactions = Object.entries(this.techs.techs)
            .map(([mechName, techMap]) => {
                let surcharge = 0;
                return Object.entries(techMap)
                    .map(([techName, info]) => {
                        if (info.boughtOn === turn) {
                            const transaction = {
                                "name": `Tech ${mechName} ${techName}`,
                                "price": `${info.price + surcharge}`,
                                "turn": turn.toString(),
                            }
                            surcharge += 200;
                            return transaction;
                        }
                        else if (info.boughtOn < turn) {
                            surcharge += 200;
                        }
                        return undefined;
                    })
            })
            .flat()
            .filter(isDefined);
        return transactions;
    }

    ensureTowerButtonsSelected(mods: ModTracker, state: TurnState, turn: MechabellumTurnInterface) {
        // state.towerButtons = deepCopy(turn.towerButtons.value);
        const modNames: string[] = mods.modsAffectingTurn(turn.turnNumber).map((mod) => mod.name);
        Object
            .entries(turn.towerButtons.value)
            .map(([button, pressed]) => {
                return [button, pressed || modNames.includes(button)]
            })
            .forEach(([button, pressed]) => {
                state.towerButtons[button] = pressed;
            });
    }

    ensureCorrectMechSlotsCount(state: TurnState, army: Army) {
        const slotDiff = army.buildSlots - state.mechSlots.length;
        if (slotDiff < 0) {
            state.mechSlots = state.mechSlots.slice(0, slotDiff);
        } else if (slotDiff > 0) {
            state.mechSlots = state.mechSlots.concat(Array(slotDiff).fill(""));
        }
    }

    transactionsForUnitUnlock(unlock: string, turn: number, mods: ModTracker): Transaction[] {
        let mech = this.dataDir.mechForName(unlock);
        if (!isDefined(mech)) return [];
        let activeMods = mods
            .modsAffectingTurn(turn)
            .filter((mod) => modAppliesToMech(mod, mech));
        mech = modifyMech(mech, activeMods);
        return [{
            "name": `Unlock ${mech.name}`,
            "price": mech.unlock.toString(),
            "turn": turn.toString(),
        }];
    }

    transactionsForUnitPurchases(
        turnNumber: number,
        mods: ModTracker,
        idents: string[],
        army: Army,
    ): Transaction[] {
        const activeMods = mods.modsAffectingTurn(turnNumber);
        const transactions = idents
            .map((ident) => army.units[ident])
            .map((unit: Unit) => {
                const relevantMods = activeMods.filter((mod) => modAppliesToMech(mod, unit.baseModel));
                const mech = modifyMech(unit.baseModel, relevantMods);
                return {
                    "name": `Buy ${mech.name} (lvl ${unit.level})`,
                    "price": unit.value.toString(),
                    "turn": turnNumber.toString(),
                }
            });
        return transactions;
    }

    transactionsForUnitUpgrades(turn: MechabellumTurnInterface, army: Army): Transaction[] {
        return Array.from(turn.levelUps.value.values())
            .map((ident) => army.units[ident])
            .map((unit) => {
                return {
                    "name": `Upgrade ${unit.baseModel.name} ${unit.ident}`,
                    "price": `${unit.baseModel.upgrade}`,
                    "turn": turn.turnNumber.toString(),
                };
            })
    }

    transactionsForUnitRecovery(turn: TurnState, turnNumber: number, mods: ModTracker, army: Army): Transaction[] {
        if (turn.recoveredUnit === "") return [];

        const unit = army.units[parseInt(turn.recoveredUnit)];
        let mech = unit.baseModel;
        const activeMods = mods
            .modsAffectingTurn(turnNumber)
            .filter((mod) => modAppliesToMech(mod, mech))
            .concat(unit.levelMod);
        mech = modifyMech(mech, activeMods);

        return [{
            "name": `Recover ${mech.name} ${unit.ident}`,
            "price": `-${mech.cost + mech.upgrade * (unit.level - 1)}`,
            "turn": turnNumber.toString(),
        }];
    }
}
