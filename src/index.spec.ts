import { parse, Control, ListChunk } from "../lib/index"
import * as _ from 'lodash';
import { iterate } from "../lib/implementation";

function pages(pageCount: number) {
    const ret: Control<number, string> = {
        hasNext(page: number) {
            return page < (pageCount - 1);
        },
        next(page: number) {
            return Promise.resolve(page + 1);
        },
        parse(page: number) {
            if(page == pageCount) {
                return Promise.resolve([]);
            } else {
                return Promise.resolve(_.repeat(`${page}`, 10).split(''));
            }
        }
    };
    return ret;
}

describe('test lazy loading list', () => {
    const tenPages = pages(10);

    it('test 10 pages with next', () => {        
        return parse(tenPages, 0).then(async listChunk => {
            let curChunk: ListChunk<string> | null = listChunk;
            let page = 0;
            while(page < 10) {
                expect(curChunk.elements).toEqual(_.repeat(`${page}`, 10).split(''));
                if(page < 9) {
                    expect(curChunk.next).toEqual(expect.anything());
                    if(curChunk.next) {
                        curChunk = await curChunk.next();
                        page = page + 1;
                    } else {
                        throw new Error("curChunk was unexpectedly null");
                    }
                } else {
                    expect(curChunk.next).toEqual(null);
                    page = page + 1;
                }             
            }
        });
    });

    it('test 10 pages as lazy stream', () => {
        return parse(tenPages, 0).then(async listChunk => {
            const expected = _.flatten(_.map([0,1,2,3,4,5,6,7,8,9], page => _.repeat(`${page}`, 10).split('')));
            let idx = 0;
            for await(const elem of listChunk.untilEnd()) {
                expect(elem).toEqual(expected[idx]);
                idx = idx + 1;
            }
            expect(idx).toEqual(100);
        })
    });

    it('test iterate flat object as first page', async () => {
        const expected = _.flatten(_.map([0,1,2,3,4,5,6,7,8,9], page => _.repeat(`${page}`, 10).split('')));
        let idx = 0;
        for await(const elem of iterate(parse(tenPages, 0))) {
            expect(elem).toEqual(expected[idx]);
            idx = idx + 1;
        }
        expect(idx).toEqual(100);
    });

    it('test iterate Promise object as first page', async () => {
        const expected = _.flatten(_.map([0,1,2,3,4,5,6,7,8,9], page => _.repeat(`${page}`, 10).split('')));
        let idx = 0;
        for await(const elem of iterate(parse(tenPages, Promise.resolve(0)))) {
            expect(elem).toEqual(expected[idx]);
            idx = idx + 1;
        }
        expect(idx).toEqual(100);
    });

    it('test iterate Promise closure as first page', async () => {
        const expected = _.flatten(_.map([0,1,2,3,4,5,6,7,8,9], page => _.repeat(`${page}`, 10).split('')));
        let idx = 0;
        for await(const elem of iterate(parse(tenPages, () => Promise.resolve(0)))) {
            expect(elem).toEqual(expected[idx]);
            idx = idx + 1;
        }
        expect(idx).toEqual(100);
    });

});

describe('edge cases', () => {
    it('empty list', () => {
        return parse(pages(0), 0).then(async listChunk => {
            expect(listChunk.elements).toEqual([]);
            expect(listChunk.next).toEqual(null);

            let once = false;
            for await(const elem of listChunk.untilEnd()) {
                once = true;
            }
            expect(once).toBeFalsy();
        });
    });
});