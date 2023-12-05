import { XMLParser } from "fast-xml-parser";
import { REPLAY } from './consts';
import { objectMap, isDefined } from './utils';
import { loadDataDir, DataDir } from './data-loader';


export enum UnitSource {
    NewUnitData = 1,
    BoughtUnit,
};

export class Replay {
    players: PlayerRecord[];
    metadata: BattleInfo;

    constructor(data: any) {
        this.players = data
            .BattleRecord
            .playerRecords
            .PlayerRecord
            .map((record: any) => PlayerRecord.fromJSON(record));
        this.metadata = new BattleInfo(data.BattleRecord.BattleInfo);
    }

    static fromXML(xmlDoc: string): Replay {
        const parser = new XMLParser({ ignoreAttributes: false });
        let jObj = parser.parse(xmlDoc);
        return new Replay(jObj);
    }
}


export class PlayerRecord {
    name: string;
    roundRecords: PlayerRoundRecord[];

    constructor(params: { name: string, records: PlayerRoundRecord[] }) {
        this.name = params.name;
        this.roundRecords = params.records;
    }

    static fromJSON(obj: any): PlayerRecord {
        return new PlayerRecord({
            name: obj.name,
            records: obj
                .playerRoundRecords
                .PlayerRoundRecord
                .map((record: any) => PlayerRoundRecord.fromJSON(record)),
        });
    }

    // .BattleRecord.playerRecords.PlayerRecord[0].playerRoundRecords.PlayerRoundRecord[1].actionRecords.MatchActionData
}

export class MoveAction {
    type: string = "move";
    unitIndex: number;
    position: Position;
    rotated: boolean;

    constructor(unitIndex: number, position: Position, rotated: boolean) {
        this.unitIndex = unitIndex;
        this.position = position;
        this.rotated = rotated;
    }

    static fromJSON(obj: any): Action[] | Action | undefined {
        if (obj.hasOwnProperty("moveUnitDatas")) {
            if (Array.isArray(obj.moveUnitDatas.MoveUnitData)) {
                return obj.moveUnitDatas.MoveUnitData.map(MoveAction.fromJSON);
            }
            obj = obj.moveUnitDatas.MoveUnitData;
        }
        return new MoveAction(
            obj.unitIndex,
            obj.position,
            obj.isRotate,
        );
    }

    /**
     * This removes all non-terminal moves in a turn.
     * We don't care about where the units were moved before their final
     * placement.
     */
    static removePriorMoves(actions: Action[]): Action[] {
        const seen = new Set<number>([]);
        return actions
            .reverse()
            .filter((a) => {
                const hasBeenSeen = seen.has(a.unitIndex);
                seen.add(a.unitIndex);
                return !hasBeenSeen;
            })
    }
}


export class BuyAction {
    type: string = "buy"
    unitID: number;

    constructor(unitID: number) {
        this.unitID = unitID;
    }

    static fromJSON(obj: any): Action {
        return new BuyAction(obj.UID);
    }
}

type Action = MoveAction | BuyAction;
const actionFromJSON = (obj: any): Action[] | Action | undefined => {
    if (obj["@_xsi:type"] === "PAD_MoveUnit") {
        return MoveAction.fromJSON(obj);
    }
    if (obj["@_xsi:type"] === "PAD_BuyUnit") {
        return BuyAction.fromJSON(obj);
    }
};


export class PlayerRoundRecord {
    round: number;
    playerData: PlayerData;
    actions: Action[];

    constructor(params: { round: number, playerData: PlayerData, actions: Action[] }) {
        this.round = params.round;
        this.playerData = params.playerData;
        this.actions = params.actions;
    }

    static fromJSON(obj: any): PlayerRoundRecord {
        let actions = obj.actionRecords.MatchActionData;
        if (!Array.isArray(actions)) {
            actions = [];
        }
        return new PlayerRoundRecord({
            round: obj.round,
            playerData: PlayerData.fromJSON(obj.playerData),
            actions: actions.map(actionFromJSON).flat(),
        });
    }

}

export interface Position {
    x: number;
    y: number;
}


export class UnitData {
    id: number;
    rotated: boolean;
    position: Position;
    level: number;
    index: number;
    source: UnitSource;

    constructor(params: { id: number, rotated: boolean, position: Position, level: number, index: number, source: UnitSource }) {
        this.id = params.id;
        this.rotated = params.rotated;
        this.position = params.position;
        this.level = params.level;
        this.index = params.index;
        this.source = params.source;
    }

    static fromJSON(params: { obj: any, source: UnitSource }): UnitData {
        return new UnitData({
            id: parseInt(params.obj.id),
            rotated: params.obj.IsRotate,
            position: objectMap(
                params.obj.Position,
                ([key, value]: [string, any]) => [key, parseInt(value)]) as Position,
            level: parseInt(params.obj.Level),
            index: parseInt(params.obj.Index),
            source: params.source,
        });
    }
}

export class UnitStore {
    units: UnitData[]

    constructor(params: { units: UnitData[] }) {
        this.units = [];
        params.units.forEach((unit) => this.addUnit(unit));
    }

    addUnit(unit: UnitData) {
        this.units[unit.index] = unit;
    }

    applyActions(actions: Action[]) {
        actions
            .filter(isDefined)
            .forEach((action) => this.applyAction(action))
    }

    applyAction(action: Action) {
        if (action.type === "move") {
            this.applyMoveAction(action as MoveAction);
        }
        if (action.type === "buy") {
            this.applyBuyAction(action as BuyAction);
        }
    }

    applyMoveAction(action: MoveAction) {
        if (action.unitIndex === undefined) return;
        if (action.position === undefined) return;

        const unit = this.units[action.unitIndex];
        unit.position = action.position;
        unit.rotated = action.rotated;
    }

    applyBuyAction(action: BuyAction) {
        const index = this.units.length;
        const newUnit = new UnitData({
            id: action.unitID,
            rotated: false,
            position: {
                x: 0,
                y: 0,
            },
            level: 1,
            index: index,
            source: UnitSource.BoughtUnit,
        });
        this.addUnit(newUnit);
    }

}

export class PlayerData {
    // preRoundFightResult: string;
    // unlockedUnits: number[];
    units: UnitData[];
    officers: number[];

    constructor(params: {
        officers: number[],
        units: UnitData[],
    }) {
        this.officers = params.officers;
        this.units = params.units;
    }

    static fromJSON(obj: any): PlayerData {
        return new PlayerData({
            // obj.preRoundFightResult,
            // obj.shop.unlockedUnits,
            officers: PlayerData.loadOfficers(obj.officers),
            units: obj
                .units
                .NewUnitData
                ?.map((unitData: any) => UnitData.fromJSON({ obj: unitData, source: UnitSource.NewUnitData })) || []
        });
    }

    static loadOfficers(officers: string | { int: number } | { int: number[] }): number[] {
        if (typeof officers === "string") {
            return [];
        }
        if (typeof officers.int === "number") {
            return [officers.int];
        }
        return officers.int;
    }
}

export class BattleInfo {
    startTime: number;
    map: string;
    gameMode: string;
    matchMode: string;

    constructor(data: any) {
        this.startTime = data.StartTime;
        this.map = new Map<number, string>([
            [1001, "Railway Town 1"],
            [1011, "Forest Eye"],
        ]).get(data.MapID) || "Unknown";
        this.matchMode = data.MatchMode;
        this.gameMode = data.GameMode;
    }
}
