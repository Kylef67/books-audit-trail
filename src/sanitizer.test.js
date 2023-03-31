const { sanitizeData } = require("./sanitizer");

describe("sanitizeData", () => {
  it("should not sanitize data when no data is supplied", () => {
    // arrange
    const moduleSettings = undefined;

    const data = {
      some_data: "Test Data",
    };

    // act
    const sanitizedData = sanitizeData(data, moduleSettings);

    // assert
    expect(sanitizedData).toBeUndefined();
  });

  it("should not sanitize data when no module settings is supplied", () => {
    // arrange
    const moduleSettings = ["sample_setting"];

    const data = undefined;

    // act
    const sanitizedData = sanitizeData(data, moduleSettings);

    // assert
    expect(sanitizedData).toBeUndefined();
  });

  it("should sanitize data correctly for strings", () => {
    // arrange
    const moduleSettings = ["some_name"];

    const data = {
      some_name: "Sample Value of String",
    };

    // act
    const sanitizedData = sanitizeData(data, moduleSettings);

    // assert
    expect(sanitizedData.some_name).toBe("Sample Value of String");
  });

  it("should sanitize data correctly for objects", () => {
    // arrange
    const moduleSettings = [{ sample_key: "sample_key_value" }];

    const data = {
      sample_key: "Sample Key Value",
    };

    // act
    const sanitizedData = sanitizeData(data, moduleSettings);

    // assert
    expect(sanitizedData.sample_key_value).toBe("Sample Key Value");
  });

  it("should sanitize data correctly for arrays", () => {
    // arrange
    const moduleSettings = [{ items: ["name", "size"] }];

    const data = {
      items: [
        {
          name: "Item 1",
          some_uncessary_field: "Unecessary Value",
          size: "small",
        },
        {
          name: "Item 2",
          some_uncessary_field: "Unecessary Value 2",
          size: "medium",
        },
      ],
    };

    // act
    const sanitizedData = sanitizeData(data, moduleSettings);

    // assert
    expect(sanitizedData.items[0].name).toBe("Item 1");
    expect(sanitizedData.items[0].size).toBe("small");
    expect(sanitizedData.items[0].some_uncessary_field).toBeUndefined();
    expect(sanitizedData.items[1].name).toBe("Item 2");
    expect(sanitizedData.items[1].size).toBe("medium");
    expect(sanitizedData.items[1].some_uncessary_field).toBeUndefined();
  });
});
