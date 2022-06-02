const { get } = require("lodash");
const moduleSettings = require("./auditSettings.json");


function sanitizeData(data, booksModule) {

    if (data && booksModule) {
        const sanitizedData = {};

        if (moduleSettings[booksModule]) {
            moduleSettings[booksModule].forEach(field => {
                if (typeof (field) === "string") {
                    sanitizedData[field] = get(data, field);
                }

                if (typeof (field) === "object") {

                    for (let [key, lineItemFields] of Object.entries(field)) {

                        if (typeof (lineItemFields) === "string") {
                            sanitizedData[lineItemFields] = get(data, lineItemFields)
                        } else {
                            sanitizedData[key] = [];

                            data[key].forEach((lineItem) => {

                                let sanitizedLineItem = {};

                                lineItemFields.forEach((lineItemField) => {
                                    sanitizedLineItem[lineItemField] = get(lineItem, lineItemField);
                                })

                                sanitizedData[key].push(sanitizedLineItem)

                            })
                        }


                    }

                }
            });
        }

        console.log(JSON.stringify(sanitizedData));

        return sanitizedData
    }


}


module.exports = {
    sanitizeData
}