import { ListChunk } from './interfaces';

async function* emptyIterator<T>(): AsyncIterableIterator<T> { return [] }

async function* untilEnd<T>(start: ListChunk<T>): AsyncIterableIterator<T> {
    let cur: (() => Promise<ListChunk<T>>) | null = () => new Promise<ListChunk<T>>((resolve, reject) => resolve(start));
    while (cur) {
        const curAwaited: ListChunk<T> = await cur();
        yield* curAwaited.elements;
        cur = curAwaited.next;
    }
}

export interface Control<PageType, DataType> {
    hasNext: (page: PageType) => boolean;
    next: (page: PageType) => Promise<PageType>;
    parse: (page: PageType) => Promise<DataType[]>;
}

export async function parse<PageType, DataType>(control: Control<PageType, DataType>, curPage: PageType): Promise<ListChunk<DataType>> {
    let nextPromise: Promise<ListChunk<DataType>> | null = null;

    async function nextFn(): Promise<ListChunk<DataType>> {
        if (nextPromise == null) {
            const nextPage = await control.next(curPage);
            return parse(control, nextPage);
        } else {
            return nextPromise;
        }
    }
    const parsed = await control.parse(curPage);

    const ret: ListChunk<DataType> = {
        next: control.hasNext(curPage) ? nextFn : null,
        elements: parsed,
        untilEnd: () => { throw new Error(); }
    };
    ret.untilEnd = () => untilEnd(ret);

    return ret;
}

export async function* iterate<DataType>(parsed: Promise<ListChunk<DataType>>) {
    return (await parsed).untilEnd();
}
