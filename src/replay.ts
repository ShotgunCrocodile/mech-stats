import * as fs from 'fs';
import { XMLParser } from "fast-xml-parser";


export function createReplay(data: string): Replay {
    const parser = new XMLParser();
    let jObj = parser.parse(data);
    return new Replay(jObj);

}

export class Replay {
    data: any;
    players: PlayerRecord[];

    constructor(data: any) {
        this.data = data;

        this.players = data
            .BattleRecord
            .playerRecords
            .PlayerRecord
            .map((record: any) => new PlayerRecord(record));
    }

    metadata(): any {
        return this.data.BattleInfo
    }
}


export class PlayerRecord {
    name: string;

    constructor(record: any) {
        this.name = record.name;
    }
}
