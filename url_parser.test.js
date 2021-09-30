const url_parser = require("./url_parser")
// TODO: tests for urls with non-ascii characters
// TODO: tests for format url with non-ascii characters
// TODO: tests for encoded urls
// TODO: tests for malformed options object

const validExampleFormatUrl = '/:version/api/:collection/:id'
const validUrls = [
    [
        '/6/api/listings/3?sort=desc&limit=10',
        {
            version: '6',
            collection: 'listings',
            id: '3',
            sort: 'desc',
            limit: '10'
        },
    ],
    [
        '/4/api/listings/344?sort=desc&limit=10',
        {
            version: '4',
            collection: 'listings',
            id: '344',
            sort: 'desc',
            limit: '10'
        }
    ],
    [
        '/2/api/list/555?sort=desc&limit=10',
        {
            version: '2',
            collection: 'list',
            id: '555',
            sort: 'desc',
            limit: '10',
        }
    ],
]

describe('[-- Success cases --]', () => {
    test.each(validUrls)("should parse simple url with default options %p ", (url, expectedResult) => {
        const result = url_parser(validExampleFormatUrl, url)
        expect(result).toEqual(expectedResult)
    })
    test.each(validUrls)("constant part 'api' should not be in hash ", (url, expectedResult) => {
        const result = url_parser(validExampleFormatUrl, url)
        expect(result.api).toBeUndefined()
    })
    it('should parse numbers and booleans when option is given', () => {
        const result = url_parser(validExampleFormatUrl, '/2/api/list/555?sort=desc&limit=10&bool=true', {
            parseNumbers: true,
            parseBooleans: true
        })
        expect(result).toEqual({
            version: 2,
            collection: 'list',
            id: 555,
            sort: 'desc',
            limit: 10,
            bool: true
        })
    })
    it('should not fail with trailing/leading slashes', () => {
        const result = url_parser(validExampleFormatUrl + "/", '/2/api/list/555?sort=desc&limit=10')
        expect(result).toEqual({
            version: '2',
            collection: 'list',
            id: '555',
            sort: 'desc',
            limit: '10',
        })
    })
    it('should parse values that contains "=" in querystring', () => {
        const result = url_parser(validExampleFormatUrl, '/2/api/list/555?sort=desc&limit=10&foo=bar=baz')
        expect(result).toEqual({
            version: '2',
            collection: 'list',
            id: '555',
            sort: 'desc',
            limit: '10',
            foo: 'bar=baz'
        })
    })

    it('should parse duplicates as array in querystring', () => {
        const path = '/2/api/list/555'
        const querystring = '?sort=desc&limit=10&brand=apple&brand=samsung&brand=xiaomi&brand=motorola'
        const result = url_parser(validExampleFormatUrl, path + querystring)
        expect(result).toEqual({
            version: '2',
            collection: 'list',
            id: '555',
            sort: 'desc',
            limit: '10',
            brand: ["apple", "samsung", "xiaomi", "motorola",]
        })
    })

    it('should parse duplicates as csv in querystring when option is given', () => {
        const path = '/2/api/list/555'
        const querystring = '?sort=desc&limit=10&brand=apple&brand=samsung&brand=xiaomi&brand=motorola'
        const result = url_parser(validExampleFormatUrl, path + querystring, { arrayFormat: 'csv' })
        expect(result).toEqual({
            version: '2',
            collection: 'list',
            id: '555',
            sort: 'desc',
            limit: '10',
            brand: "apple,samsung,xiaomi,motorola"
        })
    })
    it('should not fail if no querystring is provided', () => {
        const path = '/2/api/list/555'
        const result = url_parser(validExampleFormatUrl, path)
        expect(result).toEqual({
            version: '2',
            collection: 'list',
            id: '555',
        })
    })
})

describe('[-- Malformed format url string --]', () => {
    it('should throw when duplicates are found', () => {
        // version is duplicated
        const formatUrlString = '/:version/api/:collection/:version'
        const path = '/2/api/listings/5'
        expect(() => url_parser(formatUrlString, path))
            .toThrowError('Url format string has duplicates')

    })
    it('should throw when there are empties parts (double slashes)', () => {
        const formatUrlString = '/:version//api/:collection'
        const path = '/2/api/listings/5'
        expect(() => url_parser(formatUrlString, path))
            .toThrowError('Empties parts (double slashes) are present in url')

    })
    it('should throw when there are two semicolons in a parts', () => {
        const formatUrlString = '/:version:subversion/api/:collection/:id'
        const path = '/2/api/listings/5'
        expect(() => url_parser(formatUrlString, path))
            .toThrowError('Multiple variables in part (two semicolons) in url format string')

    })
    it('should throw when there is a length mismatch between url and format string', () => {
        const formatUrlString = '/:version/api/:collection/:id'
        const path = '/2/api'
        expect(() => url_parser(formatUrlString, path))
            .toThrowError('Url mismatch with format string provided')

    })
})

describe('[-- Malformed url string --]', () => {
    it('should throw when there are empties parts (double slashes)', () => {
        const formatUrlString = '/:version/api/:collection/:id'
        const path = '/2/api//5'
        expect(() => url_parser(formatUrlString, path))
            .toThrowError('Empties parts are present in url')

    })
    it('should throw when there is a length mismatch between url and format string', () => {
        const formatUrlString = '/:version/api/:collection/:id'
        const path = '/2/api/listings/4/best?foo=bar'
        expect(() => url_parser(formatUrlString, path))
            .toThrowError('Url mismatch with format string provided')

    })
})