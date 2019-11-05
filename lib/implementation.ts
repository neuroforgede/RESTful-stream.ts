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

type FirstPage<PageType> = (() => Promise<PageType>) | Promise<PageType> | PageType;

export type Parser<DataType> = () => Promise<ListChunk<DataType>>;

export function parse<PageType, DataType>(control: Control<PageType, DataType>, curPage: FirstPage<PageType>): Parser<DataType> {
    return () => parseInternal(control, curPage);
}

async function parseInternal<PageType, DataType>(control: Control<PageType, DataType>, curPage: FirstPage<PageType>): Promise<ListChunk<DataType>> {
    let nextPromise: Promise<ListChunk<DataType>> | null = null;
    
    let _curPage: PageType;

    if(curPage instanceof Function) {
        _curPage = await curPage();
    } else {
        _curPage = await curPage;
    }

    async function nextFn(): Promise<ListChunk<DataType>> {
        if (nextPromise == null) {
            const nextPage = await control.next(_curPage);
            return await parseInternal(control, nextPage);
        } else {
            return nextPromise;
        }
    }
    const parsed = await control.parse(_curPage);

    const ret: ListChunk<DataType> = {
        next: control.hasNext(_curPage) ? nextFn : null,
        elements: parsed,
        untilEnd: () => { throw new Error(); }
    };
    ret.untilEnd = () => untilEnd(ret);

    return ret;
}

export async function* iterate<DataType>(parsed: Parser<DataType>): AsyncIterableIterator<DataType> {
    yield* (await parsed()).untilEnd();
}
