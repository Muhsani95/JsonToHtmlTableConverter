<script>
    const defaultTableStyle = 'border-spacing: 0 0; border-color: #808080; border-collapse: collapse;';
    const defaultTdStyle = 'border: 1px solid #2d2d2d; padding: 3px;';
    const defaultTdKeyStyle = 'background: #F6F4F0; ' + defaultTdStyle;
    const defaultThStyle = 'background: #F6F4F0;' + defaultTdStyle;
    const defaultTrStyle = '';

    function jsonToTableHtmlString (json, options) {
        let arr = isObject(json) ? objectToArray(json) : json;

        if (!Array.isArray(arr)) {
            arr = []
        }

        return arrayToTable(arr, options)
    }

    function isObject (obj) {
        return Object.prototype.toString.call(obj) === '[object Object]';
    }

    function objectToArray (json) {
        if (isObject(json)) {
            let arr = [];
            for (let key in json) {
                arr.push({ $_key: key, $_value: objectToArray(json[key]) })
            }
            return arr
        } else if (Array.isArray(json)) {
            let arr = [];
            for (let item of json) {
                if (isObject(json)) {
                    arr.push(objectToArray(json))
                } else {
                    arr.push(item)
                }
            }
            return arr
        }
        return json
    }

    function arrayToTable (array, options) {
        function _recur(arr, tableDepth = 1) {
            let fieldSet = new Set();
            for (let i = 0; i < arr.length; i++) {
                const item = arr[i];
                if (isObject(item)) {
                    Object.keys(item).forEach(i => fieldSet.add(i))
                } else if (Array.isArray(item)) {
                    return _recur(item, tableDepth + 1)
                }
            }

            let fields = Array.from(fieldSet);
            let rows = arr.map(() => []);
            for (let i = 0; i < arr.length; i++) {
                const item = arr[i];
                if (isObject(item)) {
                    for (let j = 0; j < fields.length; j++) {
                        let value = item[fields[j]];
                        if (Array.isArray(value)) {
                            rows[i][j] = _recur(value, tableDepth + 1)
                        } else if (isObject(value)) {
                            rows[i][j] = _recur(objectToArray(value), tableDepth + 1)
                        } else {
                            rows[i][j] = { isKey: fields[j] === '$_key', value }
                        }
                    }
                } else {
                    rows[i][fields.length] = { isKey: false, value: item }
                }
            }

            return tableToHtml(fields, rows, tableDepth, options)
        }

        return _recur(array)
    }

    function ensureSemicolon (style) {
        if (typeof style === 'string' && style.length > 0 && style[style.length -1] !== ';') {
            return style + ';'
        }
        return style
    }

    function getTableStyle(tableStyle, tableDepth) {
        return `${tableDepth > 1 ? 'width: 100%;' : ''}${tableStyle}`.replace(/\n\s*/g, '')
    }

    function getTdStyle (tdStyle, tdKeyStyle, isKey) {
        return `${isKey  && tdKeyStyle ? `${ensureSemicolon(tdKeyStyle)}` : ''}${tdStyle}`.replace(/\n\s*/g, '')
    }

    function getThStyle (thStyle) {
        return `${thStyle}`.replace(/\n\s*/g, '')
    }

    function tableToHtml (fields, rows, tableDepth, {
        tableStyle = defaultTableStyle,
        trStyle = defaultTrStyle,
        thStyle = defaultThStyle,
        tdKeyStyle = defaultTdKeyStyle,
        tdStyle = defaultTdStyle,
        formatCell,
    } = {}) {
        return `<table id="elastic_table" class="elastic_table" cellspacing="0" style="${getTableStyle(tableStyle, tableDepth)}">
  <thead class="elastic_table_head">${fields
            .filter(f => !f.startsWith('$_'))
            .map(f => `<th class="elastic_table_th" style="${getThStyle(thStyle)}">${f}</th>`)
            .join('')}</thead>
  <tbody class="elastic_table_body">${rows
            .map(row => {
                let tds = '';
                for (let i = 0; i < row.length; i++) {
                    const v = row[i] || '';
                    if (isObject(v)) {
                        tds += `<td class="elastic_table_td" style="${getTdStyle(tdStyle, tdKeyStyle, v.isKey)}">${
                            typeof formatCell === 'function' ? formatCell(v.value, v.isKey) : v.value
                            }</td>`
                    } else {
                        tds += `<td class="elastic_table_td" style="${getTdStyle(tdStyle)}">${v}</td>`
                    }
                }
                return `<tr class="elastic_table_tr" style="${trStyle}">${tds}</tr>`
            })
            .join('')}</tbody>
</table>`
    }
</script>
