export interface ListChunk<T> {
    next: (() => Promise<ListChunk<T>>) | null,
    elements: T[],
    untilEnd: () => AsyncIterableIterator<T>
}