# RESTful-stream.ts

This repository contains a small library function that allows to convert paginated RESTful data into a `AsyncIterableIterator`.
This is particularly useful if you want to consume paginated REST apis in e.g. a nodejs program. Given two methods:

```typescript
function queryInitial() {
    //
}

function querySubsequent(link: string) {
    //
}

function parse(obj: any) {
    //
}
```

instead of writing

```typescript
const page = await queryInitial();
while(page) {
    // do stuff with page
    const parsed = parse(page);

    for(elem in parsed) {
        // do stuff with element
    }

    if(page.nextLink && page.nextLink != null) {
        page = await querySubsequent(page.nextLink);
    }
}
```

we can now write:

```typescript
type PageType = ...;
type DataType = ...;
const ctrl: Control<PageType, DataType> = {
    hasNext(page: PageType) {
        return page.nextLink && page.nextLink != null;
    },
    next(page: PageType) {
        return querySubsequent(page.nextLink);
    },
    parse(page: PageType) {
        return pase(page);
    }
};

const startChunk = await parse(ctrl);

for await(const elem of startChunk.untilEnd()) {
    // do stuff with element
}
```