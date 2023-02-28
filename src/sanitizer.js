const { get } = require("lodash");

/**
 * sanitizeData - retrieve / parse settings value based on aesi module selected
 * @param {Object} data - the sns payload
 * @param {String} moduleAuditSettings - aesi module to be audited
 * @returns {Object}
 */
function sanitizeData(data, moduleAuditSettings) {

    if (data && moduleAuditSettings) {
        const sanitizedData = {};

        moduleAuditSettings.forEach(field => {
            
            if (typeof (field) === "string" && data[field]) {
                sanitizedData[field] = get(data, field);
            }

            if (typeof (field) === "object") {

                for (let [key, lineItemFields] of Object.entries(field)) {

                    if(data[key]) {
                        if (typeof (lineItemFields) === "string") {
                            sanitizedData[lineItemFields] = get(data, key);
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

            }
        });
        

        //console.log(JSON.stringify(sanitizedData));

        return sanitizedData
    }


}


module.exports = {
    sanitizeData
}