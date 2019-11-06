export type Parser<DataType> = () => Promise<ListChunk<DataType>>;

export interface ListChunk<T> {
    next: Parser<T> | null,
    elements: T[],
    untilEnd: () => AsyncIterableIterator<T>
}