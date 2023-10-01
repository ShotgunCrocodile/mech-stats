import { XMLParser } from "fast-xml-parser";
import { REPLAY } from './consts';
import { objectMap, isDefined } from './utils';
import { loadDataDir, DataDir } from './data-loader';


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

export class Action {
    unitIndex: number;
    position: Position;
    rotated: boolean;

    constructor(unitIndex: number, position: Position, rotated: boolean) {
        this.unitIndex = unitIndex;
        this.position = position;
        this.rotated = rotated;
    }

    static fromJSON(obj: any): Action | undefined {
        if (obj.hasOwnProperty("moveUnitDatas")) {
            return new Action(
                obj.moveUnitDatas.MoveUnitData.unitIndex,
                obj.moveUnitDatas.MoveUnitData.position,
                obj.moveUnitDatas.MoveUnitData.isRotate === "true",
            );
        }
        return undefined;
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


export class PlayerRoundRecord {
    round: number;
    playerData: PlayerData;
    // actions: Action[];

    constructor(params: { round: number, playerData: PlayerData }) {
        this.round = params.round;
        this.playerData = params.playerData;
    }

    static fromJSON(obj: any): PlayerRoundRecord {
        return new PlayerRoundRecord({
            round: obj.round,
            playerData: PlayerData.fromJSON(obj.playerData),
        });
        // let actions = obj.actionRecords.MatchActionData;
        // if (!Array.isArray(actions)) {
        //     actions = [];
        // }

        // return new PlayerRoundRecord(
        //     obj.round,
        //     PlayerData.fromJSON(obj.playerData),
        //     Action.removePriorMoves(actions
        //         .map((data: any) => Action.fromJSON(data))
        //         .filter(isDefined)) || [],
        // );
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

    constructor(params: { id: number, rotated: boolean, position: Position, level: number, index: number }) {
        this.id = params.id;
        this.rotated = params.rotated;
        this.position = params.position;
        this.level = params.level;
        this.index = params.index;
    }

    static fromJSON(obj: any): UnitData {
        return new UnitData({
            id: parseInt(obj.id),
            rotated: obj.IsRotate === "true",
            position: objectMap(
                obj.Position,
                ([key, value]: [string, any]) => [key, parseInt(value)]) as Position,
            level: parseInt(obj.Level),
            index: parseInt(obj.Index),
        });
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
            // obj.units.NewUnitData?.map((unitData: any) => UnitData.fromJSON(unitData)) || [],
            officers: PlayerData.loadOfficers(obj.officers),
            units: obj
                .units
                .NewUnitData
                ?.map((unitData: any) => UnitData.fromJSON(unitData)) || []
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
