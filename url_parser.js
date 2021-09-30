// TODO: handle url encoding
// TODO: handle non-ascii characters

const ERRORS = {
    format_string_empties_paths: 'Empties parts (double slashes) are present in url format string',
    url_format_string_mismatch: 'Url mismatch with format string provided',
    url_empties_paths: 'Empties parts are present in url',
    format_string_multiple_vars: 'Multiple variables in part (two semicolons) in url format string',
    format_string_duplicate_paths: 'Url format string has duplicates'
}

// trim *one* leading and/or trailing slash
function _trim_slashes(str) {
    const len = str.length
    if (str[0] === '/' && str[len - 1] === '/') {
        return str.substring(1, len - 1)
    }
    if (str[0] === '/') {
        return str.substring(1)
    }
    if (str[len - 1] === '/') {
        return str.substring(0, len - 1)
    }
    return str
}

// formatString shape example: '/:var1/constant/constant2/:var2/:var3'
function _parse_url_path(formatString, path, options) {
    // check for empties
    if (formatString.includes('//')) {
        throw new Error(ERRORS.format_string_empties_paths)
    }

    const splitedPath = _trim_slashes(path).split('/')
    const splitedFormatString = _trim_slashes(formatString).split('/')

    if (splitedPath.length !== splitedFormatString.length) {
        throw new Error(ERRORS.url_format_string_mismatch)
    }

    const hashPath = {}

    splitedPath.forEach((pathPart, i) => {
        const formatStringPart = splitedFormatString[i]
        // check for empties
        if (pathPart.length === 0) {
            throw new Error(ERRORS.url_empties_paths)
        }

        if (options.parseNumbers === true && !isNaN(pathPart)) {
            pathPart = Number(pathPart)
        }

        // check if the part is constant (and ignore) or variable (and assign)
        if (formatStringPart.includes(':')) {
            const nameArr = formatStringPart.split(':').filter(Boolean)
            if (nameArr.length > 1) {
                throw new Error(ERRORS.format_string_multiple_vars)
            }
            const name = nameArr[0]
            if (hashPath.hasOwnProperty(name)) {
                throw new Error(ERRORS.format_string_duplicate_paths)
            }
            hashPath[name] = pathPart
        }
    })
    return hashPath
}

function _parse_query_string(querystring, options) {
    if (!querystring) {
        return
    }
    const hashQuerystring = {}
    const splittedQueryString = querystring
        .split('&')
        // silently ignore duplicated '&'
        .filter(Boolean)
        .map(queryStringParam => {
            // this is for edge case: ...&name=foo=bar=baz&...
            const firstEqualIndex = queryStringParam.indexOf('=')
            const name = queryStringParam.substring(0, firstEqualIndex)

            // apply options if given
            let value = queryStringParam.substring(firstEqualIndex + 1)
            if (options.parseNumbers === true && !isNaN(value)) {
                value = Number(value)
            }
            if (options.parseBooleans === true && value === 'true') {
                value = true
            }
            if (options.parseBooleans === true && value === 'false') {
                value = false
            }

            return [name, value]
        })

    // process duplicated values as array
    splittedQueryString.forEach(([name, value]) => {
        // duplicated params. store in array
        if (hashQuerystring[name]) {
            if (Array.isArray(hashQuerystring[name])) {
                hashQuerystring[name].push(value)
            } else {
                hashQuerystring[name] = [hashQuerystring[name], value]
            }
            return
        }

        // empty values are save as empty strings, since url is a string
        hashQuerystring[name] = value || ''
    })
    Object.entries(hashQuerystring).forEach(([name, value]) => {
        if (options.arrayFormat === 'csv' && Array.isArray(value)) {
            hashQuerystring[name] = hashQuerystring[name].join(',')
        }
    })

    return hashQuerystring
}

function url_parser(formatString, urlString, options = {}) {
    const indexqs = urlString.indexOf('?')

    const path = indexqs === -1
        ? urlString
        : urlString.substring(0, indexqs)

    const querystring = indexqs === -1
        ? null
        : urlString.substring(indexqs + 1)

    const hashPath = _parse_url_path(formatString, path, options)
    const hashQuerystring = _parse_query_string(querystring, options) || {}

    const hash = {
        ...hashPath,
        ...hashQuerystring
    }

    return hash
}

module.exports = url_parser