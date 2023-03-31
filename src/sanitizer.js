/* eslint-disable complexity */
/* eslint-disable no-restricted-syntax */
const { get } = require("lodash");

/**
 * Sanitizes the data payload by retrieving and parsing the specified settings
 * based on the AESI module selected.
 *
 * @param {Object} data - The payload containing the data to be sanitized.
 * @param {Array} moduleAuditSettings - An array of settings to be audited for the
 * AESI module.
 * @returns {Object} - An object containing the sanitized data based on the specified
 * AESI module settings.
 */

function sanitizeData(data, moduleAuditSettings) {
  const sanitizedData = {};
  if (data && moduleAuditSettings) {
    // Iterate through each module setting to be audited
    moduleAuditSettings.forEach((field) => {
      if (typeof field === "string" && data[field]) {
        // If the field is a string, retrieve the data for that field
        sanitizedData[field] = get(data, field);
      } else if (typeof field === "object") {
        // If the field is an object, iterate through each key-value pair
        // to retrieve the nested data.
        for (const [key, lineItemFields] of Object.entries(field)) {
          if (data[key]) {
            if (typeof lineItemFields === "string") {
              // If the line item field is a string, retrieve the data for that field
              sanitizedData[lineItemFields] = get(data, key);
            } else {
              // If the line item field is an array, iterate through each item in the array
              // to retrieve the nested data for each item.
              sanitizedData[key] = [];

              data[key].forEach((lineItem) => {
                const sanitizedLineItem = {};

                // Iterate through each line item field to retrieve the nested data
                lineItemFields.forEach((lineItemField) => {
                  sanitizedLineItem[lineItemField] = get(
                    lineItem,
                    lineItemField
                  );
                });

                sanitizedData[key].push(sanitizedLineItem);
              });
            }
          }
        }
      }
    });
  }

  return sanitizedData;
}

module.exports = {
  sanitizeData,
};
