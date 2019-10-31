# RESTful-stream.ts

This repository contains a small library function that allows to convert paginated RESTful data into a `AsyncIterableIterator`
which chunks the pages into memory as soon as they are requested (and caches them) and serves the elements on the page one by one
in a stream.

This is particularly useful if you want to consume paginated REST apis in e.g. a nodejs program. Given two methods:

```typescript
function queryInitial(): Promise<PageType> {
    // use your asynchronous rest library of choice here
}

function querySubsequent(link: string): Promise<PageType> {
    // use your asynchronous rest library of choice here
}

function parseFn(obj: PageType): DataType {
    // convert a JSON page into 
}
```

instead of writing

```typescript
const page = await queryInitial();
while(page) {
    // do stuff with page
    const parsed = await parseFn(page);

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

const initialLink: string = // url to the initial link
const ctrl: Control<PageType, DataType> = {
    hasNext(page: PageType) {
        return page.nextLink && page.nextLink != null;
    },
    next(page: PageType) {
        return querySubsequent(page.nextLink);
    },
    parse(page: PageType) {
        return parseFn(initialLink);
    }
};

for await(const elem of iterate(parse(ctrl))) {
    // do stuff with element
}
```

We can even go further and define a utility method `ctrlGen` specific to our REST API:

```typescript
type PageType = // generic PageType for our API
function ctrlGen<DataType>(initialLink: string, parseFn: (page: PageType) => Promise<DataType>) {
    const ctrl: Control<PageType, DataType> = {
        hasNext(page: PageType) {
            return page.nextLink && page.nextLink != null;
        },
        next(page: PageType) {
            return querySubsequent(page.initialLink);
        },
        parse(page: PageType) {
            return parseFn(initialLink);
        }
    };
};
```

This allows us to define the parse function for each Entity type, and can then use it:

```typescript
function parse1(page: PageType): Promise<Type1> {
    const ret = ...;
    return ret;
}

function parse2(page: PageType): Promise<Type1> {
    const ret = ...;
    return ret;
}

for await(const elem1 of iterate(parse(ctrlGen('https://url.to.rest.api/type1', parse1)))) {
    for await(const elem2 of iterate(parse(ctrlGen(`https://url.to.rest.api/${type1.id}/type2`, parse2)))) {
        // do stuff
    }
}
```

If you like this project, consider leaving a star on the repository at [GitHub](https://github.com/neuroforgede/RESTful-stream.ts).

Proudly made by [NeuroForge](https://neuroforge.de/) in Bayreuth, Germany.