import * as interfaces from './interfaces';
import * as implementation from './implementation';

export type ListChunk<T> = interfaces.ListChunk<T>;
export type Parser<DataType> = interfaces.Parser<DataType>;
export type Control<PageType, DataType> = implementation.Control<PageType, DataType>;
export const parse = implementation.parse;
export const iterate = implementation.iterate;

export const map = implementation.map;

