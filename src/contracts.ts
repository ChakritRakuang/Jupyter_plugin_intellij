import * as intellij from 'intellij';

export interface ParsedIOMessage {
    data: { [key: string]: any } | string;
    type: string;
    stream: string;
    message?: string;
}

export interface Cell {
    range: intellij.Range;
    title: string;
}