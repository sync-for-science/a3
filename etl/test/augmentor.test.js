const augmentor = require("../src/augmentor");

describe("dates", () => {

	test("year to range", () => {
		expect(
			augmentor.transformDate("2019")
		).toEqual({
			start: "2019-01-01 00:00:00.000Z",
			end: "2019-12-31 23:59:59.999Z"
		});
	});

	test("month to range", () => {
		expect(
			augmentor.transformDate("2019-02")
		).toEqual({
			start: "2019-02-01 00:00:00.000Z",
			end: "2019-02-28 23:59:59.999Z"
		});
	});

	test("date to range", () => {
		expect(
			augmentor.transformDate("2019-02-03")
		).toEqual({
			start: "2019-02-03 00:00:00.000Z",
			end: "2019-02-03 23:59:59.999Z"
		});
	});

	test("dateTime to range", () => {
		expect(
			augmentor.transformDate("2019-02-03T03:22:00")
		).toEqual({
			start: "2019-02-03 03:22:00.000Z",
			end: "2019-02-03 03:22:00.999Z"
		});
	});

	test("instant to range", () => {
		expect(
			augmentor.transformDate("2019-02-03T03:22:00.00Z")
		).toEqual({
			start: "2019-02-03 03:22:00.000Z",
			end: "2019-02-03 03:22:00.009Z"
		});
	});

	test("inject tz offset if passed in", () => {
		expect(
			augmentor.transformDate("2019-02", "-5:00")
		).toEqual({
			start: "2019-02-01 00:00:00.000-5:00",
			end: "2019-02-28 23:59:59.999-5:00"
		});
	});

});

describe("references", () => {
	const definitions = {
		"Reference.reference": {type: "string"},
		"Reference.type": {type: "uri"},
		"Reference.display": {type: "string"}
	}

	test("convert a full url", () => {
		expect(
			augmentor.transformReference({reference: "http://example.com/fhir/Patient/123"}, null, [], definitions)
		).toEqual({
			reference: "Patient/6521715c6076989744a0cbedc0133341054f0264",
			reference_id_aa: "6521715c6076989744a0cbedc0133341054f0264",
			reference_prev_aa: "http://example.com/fhir/Patient/123",
			type: "Patient"
		});
	});

	test("ignore protocol", () => {
		expect(
			augmentor.transformReference({reference: "https://example.com/fhir/Patient/123"}, null, [], definitions).reference_id_aa
		).toEqual(
			augmentor.transformReference({reference: "http://example.com/fhir/Patient/123"}, null, [], definitions).reference_id_aa
		);
	});

	test("convert a relative url ", () => {
		expect(
			augmentor.transformReference({reference: "Patient/123"}, "http://example.com/fhir/", [], definitions)
		).toEqual({
			reference: "Patient/6521715c6076989744a0cbedc0133341054f0264",
			reference_id_aa: "6521715c6076989744a0cbedc0133341054f0264",
			reference_prev_aa: "Patient/123",
			type: "Patient"
		});
	});

	test("convert a contained url ", () => {
		const containedResources = [{
			id_prev_aa: "123#p1", 
			resourceType: "Patient", 
			id: "6521715c6076989744a0cbedc0133341054f0264"
		}];
		expect(
			augmentor.transformReference({reference: "#p1"}, "http://example.com/fhir/", containedResources, definitions)
		).toEqual({
			reference: "Patient/6521715c6076989744a0cbedc0133341054f0264",
			reference_id_aa: "6521715c6076989744a0cbedc0133341054f0264",
			reference_prev_aa: "#p1",
			type: "Patient"
		});
	});

	test("retain non-url elements", () => {
		expect(
			augmentor.transformReference({
				reference: "http://example.com/fhir/Patient/123",
				display: "test"
			}, null, [], definitions)
		).toEqual({
			reference: "Patient/6521715c6076989744a0cbedc0133341054f0264",
			reference_id_aa: "6521715c6076989744a0cbedc0133341054f0264",
			reference_prev_aa: "http://example.com/fhir/Patient/123",
			type: "Patient",
			display: "test",
			display_aa: "TEST"

		});
	});

});

describe("text", () => {

	test("capitalize and remove diacritics", () => {
		expect(
			augmentor.transformText("Crème Brulée")
		).toEqual("CREME BRULEE");
	});

});

describe("extensions", () => {

	test("promote extensions", () => {
		const definitions = {
			"Extension.valueCode": {type: "code"}
		};
		const extension = [{
			url: "http://hl7.org/fhir/StructureDefinition/iso-21090-EN-use",
			valueCode: "I"
		}];
		const includeExtensions = ["Extension.valueCode"];
		const augmented = augmentor.transformExtension(extension, definitions, {includeExtensions});
		expect(augmented).toEqual([{
			url: "http://hl7.org/fhir/StructureDefinition/iso-21090-EN-use",
			valueCode: "I",
			parent: null,
		}]);
	});

	test("don't support extensions on a complex type in an extension", () => {
		const definitions = {
			"Extension.valueHumanName": {type: "HumanName"},
			"HumanName.given": {type: "string"},
			"HumanName.extension": {type: "Extension"},
		};
		const extension = [{
			url: "url1",
			valueHumanName: { 
				given: "Dan",
				extension: [{
					url: "url2",
					valueHumanName: { given: "Dan2" },
				}]
			}
		}];
		const includeExtensions = ["Extension.valueHumanName"];
		expect(
			augmentor.transformExtension(extension, definitions, {includeExtensions, suppressExtensionErrors: true})
		).toEqual([{
			url: "url1",
			valueHumanName: { given: "Dan", given_aa: "DAN"},
			parent: null
		}]);
		expect( () => {
			augmentor.transformExtension(extension, definitions, {includeExtensions})
		}).toThrow();
	});

	test("promote nested extensions", () => {
		const definitions = {
			"Extension.valueCoding": {type: "Coding"},
			"Extension.valueString": {type: "string"},
			"Extension.valueCode": {type: "code"},
			"Extension.url": {type: "fhirid"},
			"Coding.code": {type: "code"}
		}
		const includeExtensions = ["Extension.valueCoding", "Extension.valueCode", "Extension.valueString"];
		const extension = [{
			"url" : "http://fhir.org/guides/argonaut/StructureDefinition/argo-ethnicity",
			"extension" : [{
				"url" : "ombCategory",
				"valueCoding" : {"code" : "2135-2"}
			},{
				"url" : "ombCategory",
				"valueCoding" : {"code" : "1002-5"}
			},{
				"url" : "text",
				"valueString" : "Hispanic"
			}]
		},{
			"url" : "http://fhir.org/guides/argonaut/StructureDefinition/argo-birthsex",
			"valueCode" : "M"
		}];
		expect(
			augmentor.transformExtension(extension, definitions,  {includeExtensions})
		).toEqual([{
			url: "http://fhir.org/guides/argonaut/StructureDefinition/argo-ethnicity/ombCategory",
			valueCoding: { code: '2135-2' },
			parent: "0"
		},{
			url: 'http://fhir.org/guides/argonaut/StructureDefinition/argo-ethnicity/ombCategory',
			valueCoding: { code: '1002-5' },
			parent: "0"
		},{
			parent: "0",
			url: "http://fhir.org/guides/argonaut/StructureDefinition/argo-ethnicity/text",
			valueString_aa: "HISPANIC",
			valueString: "Hispanic"
		},{
			url: "http://fhir.org/guides/argonaut/StructureDefinition/argo-birthsex",
			valueCode: "M",
			parent: null
		}]);

	})


});

describe("resource", () => {

	test("augment simple type", () => {
		const resource = {
			id: "1234",
			resourceType: "Patient",
			birthDate: "2020-01-01"
		};
		const definitions = {
			"Patient.id": {type: "fhirid"},
			"Patient.birthDate": {type: "date"}
		}
		const augmented = augmentor.transformResource(resource, definitions);
		expect(augmented).toEqual({
			id: '5682339ef3d7267c8401338d3190869dbebf663f',
			id_prev_aa: "1234",
			resourceType: 'Patient',
			birthDate: "2020-01-01",
			birthDate_aa: {
				start: "2020-01-01 00:00:00.000Z",
				end: "2020-01-01 23:59:59.999Z"
			}
		});
	});

	test("fail on missing definition", () => {
		const resource = {
			id: "1234",
			resourceType: "Patient",
			birthDate: "2020-01-01"
		};
		const definitions = {
			"Patient.id": {type: "fhirid"},
		}
		expect(() => {
			augmentor.transformResource(resource, definitions)
		}).toThrow();
	});


	test("augment array of simple types", () => {
		const resource = {
			id: "1234",
			resourceType: "Patient",
			name: [{given: ["Patricia"]}]
		};
		const definitions = {
			"Patient.id": {type: "fhirid"},
			"Patient.name": {type: "HumanName"},
			"HumanName.given": {type: "string"},
		}
		const augmented = augmentor.transformResource(resource, definitions);
		expect(augmented).toEqual({
			id: '5682339ef3d7267c8401338d3190869dbebf663f',
			id_prev_aa: "1234",
			resourceType: 'Patient',
			name: [{
				given: ["Patricia"],
				given_aa: ["PATRICIA"]
			}]
		});
	});

	test("augment array of complex types", () => {
		const resource = {
			id: "1234",
			resourceType: "Patient",
			name: [{
				use: "official",
				given: ["Patricia"]
			},{
				use: "nickname",
				given: ["Pat"]
			}]
		};
		const definitions = {
			"Patient.id": {type: "fhirid"},
			"Patient.name": {type: "HumanName"},
			"HumanName.given": {type: "string"},
			"HumanName.use": {type: "code"}
		}
		const augmented = augmentor.transformResource(resource, definitions);
		expect(augmented).toEqual({
			id: '5682339ef3d7267c8401338d3190869dbebf663f',
			id_prev_aa: "1234",
			resourceType: 'Patient',
			name: [{
				use: "official",
				given: ["Patricia"],
				given_aa: ["PATRICIA"]
			},{
				use: "nickname",
				given: ["Pat"],
				given_aa: ["PAT"]
			}]
		});
	});

	test("augment contained resource", () => {
		const resource = {
			id: "1234",
			resourceType: "Patient",
			contained: [{
				id: "gp",
				resourceType: "Practitioner",
				name: [{
					family: "Person",
				}]
			}],
			generalPractitioner: [{reference: "#gp"}]
		};
		const definitions = {
			"Practitioner.id": {type: "fhirid"},
			"Patient.id": {type: "fhirid"},
			"Patient.generalPractitioner": {type: "Reference"},
			"Reference.reference": {type: "string"},
			"Reference.type": {type: "uri"},
			"Practitioner.name": {type: "HumanName"},
			"HumanName.family": {type: "string"},
			"Patient.contained": {type: "Resource"}
		}
		const augmented = augmentor.transformResource(resource, definitions);
		expect(augmented).toEqual([{
			id: "2482f970c5e50741a77981cec2d1dd06788e7f88",
			id_prev_aa: "1234#gp",
			resourceType: "Practitioner",
			name: [{
				family: "Person",
				family_aa: "PERSON"
			}]
		},{
			id: '5682339ef3d7267c8401338d3190869dbebf663f',
			id_prev_aa: "1234",
			resourceType: 'Patient',
			generalPractitioner: [{
				reference: "Practitioner/2482f970c5e50741a77981cec2d1dd06788e7f88",
				reference_id_aa: "2482f970c5e50741a77981cec2d1dd06788e7f88",
				type: "Practitioner",
				reference_prev_aa: "#gp"
			}]
		}]);
	});

	test("augment contained resource that references parent resource", () => {
		const resource = {
			id: "1234",
			resourceType: "Patient",
			contained: [{
				id: "p1",
				resourceType: "Provenance",
				target: [{reference: "#"}]
			}],
		};
		const definitions = {
			"Provenance.id": {type: "fhirid"},
			"Patient.contained": {type: "Resource"},
			"Provenance.target": {type: "Reference"},
			"Reference.reference": {type: "string"},
			"Reference.type": {type: "uri"},
			"Patient.id": {type: "fhirid"}
		}
		const augmented = augmentor.transformResource(resource, definitions);
		expect(augmented).toEqual([{
			id: "2e6e153e24e9b680b6dfd6eaed182f4e9433d373",
			id_prev_aa: "1234#p1",
			resourceType: "Provenance",
			target: [{
				reference: "Patient/5682339ef3d7267c8401338d3190869dbebf663f",
				reference_id_aa: "5682339ef3d7267c8401338d3190869dbebf663f",
				type: "Patient",
				reference_prev_aa: "#"
			}]
		},{
			id: '5682339ef3d7267c8401338d3190869dbebf663f',
			id_prev_aa: "1234",
			resourceType: 'Patient'
		}]);
	});


	test("augment extension", () => {
		const resource = {
			id: "1234",
			resourceType: "Patient",
			extension: [{
				"url" : "http://fhir.org/guides/argonaut/StructureDefinition/argo-ethnicity",
				"extension" : [{
					"url" : "ombCategory",
					"valueCoding" : {"code" : "2135-2"}
				},{
					"url" : "ombCategory",
					"valueCoding" : {"code" : "1002-5",}
				}]
			}]
		};
		const definitions = {
			"Patient.extension": {type: "Extension"},
			"Extension.valueCoding": {type: "Coding"},
			"Coding.code": {type: "code"},
			"Patient.id": {type: "fhirid"}
		}
		const includeExtensions = ["Patient.extension.valueCoding"];
		const augmented = augmentor.transformResource(resource, definitions, "", null, {includeExtensions});
		expect(augmented).toEqual({
			id: '5682339ef3d7267c8401338d3190869dbebf663f',
			id_prev_aa: "1234",
			resourceType: 'Patient',
			extension: [{
				url: "http://fhir.org/guides/argonaut/StructureDefinition/argo-ethnicity/ombCategory",
				valueCoding: { code: '2135-2' },
				parent: '0'
			},{
				url: 'http://fhir.org/guides/argonaut/StructureDefinition/argo-ethnicity/ombCategory',
				valueCoding: { code: '1002-5' },
				parent: '0' 
			}]
		});
	});

	test("limit extensions to defined elements", () => {
		const resource = {
			id: "1234",
			resourceType: "Patient",
			extension: [{
				"url" : "http://fhir.org/guides/argonaut/StructureDefinition/argo-ethnicity",
				"extension" : [{
					"url" : "ombCategory",
					"valueCoding" : {"code" : "2135-2"}
				},{
					"url" : "ombCategory",
					"valueString" : "text"
				}]
			}]
		};
		const definitions = {
			"Patient.extension": {type: "Extension"},
			"Extension.valueCoding": {type: "Coding"},
			"Extension.valueString": {type: "string"},
			"Coding.code": {type: "code"},
			"Patient.id": {type: "fhirid"}
		}
		const includeExtensions = ["Patient.extension.valueCoding"];
		const augmented = augmentor.transformResource(resource, definitions, "", null, {includeExtensions, suppressExtensionErrors:true});
		expect(augmented).toEqual({
			id: '5682339ef3d7267c8401338d3190869dbebf663f',
			id_prev_aa: "1234",
			resourceType: 'Patient',
			extension: [{
				url: "http://fhir.org/guides/argonaut/StructureDefinition/argo-ethnicity/ombCategory",
				valueCoding: { code: '2135-2' },
				parent: '0'
			}]
		});
		//fail if error on undefined extension is true
		expect( () => {
			augmentor.transformResource(resource, definitions, "", null, {includeExtensions});
		}).toThrow();
	});

	test("augment Backbone Elements", () =>  {
		const resource = {
			resourceType: "Questionnaire",
			item: [{id: "0"}]
		}
		const definitions = {
			"Questionnaire.item": {type: "BackboneElement", isArray: true},
			"Questionnaire.item.id": {type: "fhirid"}
		}
		const augmented = augmentor.transformResource(resource, definitions);
		expect(augmented).toEqual({
			resourceType: "Questionnaire",
			item: [{id: "0"}]
		});
	});

	test("limit recursive elements (contentReference)", () => {
		const resource = {
			resourceType: "Questionnaire",
			item: [{
				id: "0", item: [{
					id: "0.0", item: [{
						id: "0.0.0", item: [{
							id: "0.0.0.0", item: [{
								id: "0.0.0.0.0"
							}]
						}]
					}]
				}]
			}]
		}
		const definitions = {
			"Questionnaire.item": {type: "BackboneElement", isArray: true},
			"Questionnaire.item.item": {type: "ContentReference", contentReference: "Questionnaire.item"},
			"Questionnaire.item.id": {type: "fhirid"}
		}
		const augmented = augmentor.transformResource(resource, definitions, null, null, {defaultRecursionLimit: 2, suppressRecursionErrors: true});
		expect(augmented).toEqual({
			resourceType: "Questionnaire",
			item: [{
				id: "0", item: [{
					id: "0.0"
				}]
			}]
		});
		//fail if error on recursion is true
		expect( () => {
			augmentor.transformResource(
				resource, definitions, null, null
			)
		}).toThrow();
	});

	test("limit recursive elements by path (contentReference)", () => {
		const resource = {
			resourceType: "Questionnaire",
			item: [{
				id: "0", item: [{
					id: "0.0", item: [{
						id: "0.0.0", item: [{
							id: "0.0.0.0", item: [{
								id: "0.0.0.0.0"
							}]
						}]
					}]
				}]
			}]
		}
		const definitions = {
			"Questionnaire.item": {type: "BackboneElement", isArray: true},
			"Questionnaire.item.item": {type: "ContentReference", contentReference: "Questionnaire.item"},
			"Questionnaire.item.id": {type: "fhirid"}
		}
		const recursionLimits = {"Questionnaire.item": 2}
		const augmented = augmentor.transformResource(resource, definitions, null, null, {recursionLimits, suppressRecursionErrors: true});
		expect(augmented).toEqual({
			resourceType: "Questionnaire",
			item: [{
				id: "0", item: [{
					id: "0.0"
				}]
			}]
		});
		//fail if error on recursion is true
		expect( () => {
			augmentor.transformResource(resource, definitions)
		}).toThrow();
	});

	test("limit recursive elements (complex types)", () => {
		const resource = {
			resourceType: "Patient",
			managingOrganization: {
				identifier: {
					value: "0", assigner: {
						identifier: {
							value: "0.0", assigner: {
								identifier: {
									value: "0.0.0", assigner: {
										identifier: {value: "0.0.0.0"}
									}
								}
							}
						}
					}
				}
			}
		}
		const definitions = {
			"Patient.managingOrganization": {type: "Reference"},
			"Reference.identifier": {type: "Identifier"},
			"Identifier.assigner": {type: "Reference"},
			"Identifier.value": {type: "string"}
		}
		const augmented = augmentor.transformResource(resource, definitions, null, null, {suppressRecursionErrors: true});
		expect(augmented).toEqual({
			resourceType: "Patient",
			managingOrganization: {
				identifier: {
					value: "0", value_aa: "0", assigner: {
						identifier: {
							value: "0.0", value_aa: "0.0", assigner: {
								identifier: {
									value: "0.0.0", value_aa:"0.0.0", 
									assigner: {}
								}
							}
						}
					}
				}
			}
		});
		//fail if error on recursion is true
		expect( () => {
			augmentor.transformResource(resource, definitions)
		}).toThrow();
	});

});