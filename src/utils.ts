import { Base64 } from 'js-base64';

export function sortByKey(key: string) {
    return ((a: any, b: any) => {
        if (a.name < b[key]) return -1;
        if (a.name > b[key]) return 1;
        return 0;

    });
}


export function deepCopy(obj: any): any {
    return JSON.parse(JSON.stringify(obj));
}

export function isDefined<T>(value: T | undefined): value is T { return value !== undefined; }


export function partition<T>(collection: T[], predicate: (value: T) => boolean): T[][] {
    return collection
        .reduce((acc: T[][], value: T) => {
            acc[predicate(value) ? 0 : 1].push(value);
            return acc;
        }, [[], []]);
}

export function* numberSequence(start: number): Generator<number> {
    while (true) {
        yield start;
        start++;
    }
}


export function encode(obj: Object): string {
    const value = JSON.stringify(obj);
    const result = Base64.encode(value);
    return result;
}


export function decode(encodedString: string): Object {
    const decoded = Base64.decode(encodedString);
    return JSON.parse(decoded);
}


export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
export const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);


export const objectMap = (obj: Object, mapper: ([key, value]: [string, any]) => [string, any]) => Object
    .fromEntries(Object
        .entries(obj)
        .map(mapper));
