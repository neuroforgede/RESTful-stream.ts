import { parse, Control, ListChunk } from "../lib/index"
import * as _ from 'lodash';

describe('test lazy loading list', () => {
    const tenPages: Control<number, string> = {
        hasNext(page: number | null) {
            if(page != null) {
                return page < 9;
            } else {
                return true;
            }
        },
        next(page: number | null) {
            if(page != null) {
                return Promise.resolve(page + 1);
            } else {
                return Promise.resolve(0);
            }
        },
        parse(page: number) {
            return Promise.resolve(_.repeat(`${page}`, 10).split(''));
        }
    };

    it('test 10 pages with next', () => {        
        return parse(tenPages).then(async listChunk => {
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
        return parse(tenPages).then(async listChunk => {
            const expected = _.flatten(_.map([0,1,2,3,4,5,6,7,8,9], page => _.repeat(`${page}`, 10).split('')));
            let idx = 0;
            for await(const elem of listChunk.untilEnd()) {
                expect(elem).toEqual(expected[idx]);
                idx = idx + 1;
            }
        })
    })

})