const bq = require("../src/bigquery");

describe("schema", () => {

	test("simple types", () => {
		const definitions = {
			"Patient.gender": {type: "code"}
		}
		expect(
			bq.buildSchema("Patient", definitions)
		).toEqual([{
			name: "gender", type: "STRING"
		}]);
	});

	test("repeating simple types", () => {
		const definitions = {
			//yeah, this isn't valid FHIR
			"Patient.gender": {type: "code", isArray: true}
		}
		expect(
			bq.buildSchema("Patient", definitions)
		).toEqual([{
			name: "gender", type: "STRING", mode: "REPEATED"
		}]);
	});

	test("backbone element", () => {
		const definitions = {
			//yeah, this isn't valid FHIR
			"Patient.contact": {type: "BackboneElement", isArray: true},
			"Patient.contact.code": {type: "code"}
		}
		expect(
			bq.buildSchema("Patient", definitions)
		).toEqual([{
			name: "contact", type: "RECORD", mode: "REPEATED", fields: [{
				name: "code", type: "STRING"
			}]
		}]);
	});

	test("complex types", () => {
		const definitions = {
			"Patient.name": {type: "HumanName", isArray: true},
			"HumanName.given": {type: "string", isArray: true},
			"HumanName.use": {type: "code"},
			"HumanName.period": {type: "Period"},
			"Period.start": {type: "dateTime"},
			"Period.end": {type: "dateTime"}
		}
		expect(
			bq.buildSchema("Patient", definitions)
		).toEqual([
			{"name": "name", "type": "RECORD", mode: "REPEATED", "fields": [
				{"mode": "REPEATED", "name": "given","type": "STRING"},
				{"name": "period",  "type": "RECORD", "fields": [
					{"name": "end", "type": "STRING"},
					{"name": "start", "type": "STRING"}
				]},
				{"name": "use","type": "STRING"}
			]}
		]);
	});

	test("limit recursive elements (contextReferences)", () => {
		const definitions = {
			"Questionnaire.item": {type: "BackboneElement", isArray: true},
			"Questionnaire.item.item": {type: "ContentReference", contentReference: "Questionnaire.item"},
			"Questionnaire.item.id": {type: "fhirid"}
		}
		expect(
			bq.buildSchema("Questionnaire", definitions, {})
		).toEqual([
			{"name": "item", "type": "RECORD", mode: "REPEATED", "fields": [
				{"name": "id", "type": "STRING"},
				{"name": "item", "type": "RECORD", mode: "REPEATED", "fields": [
					{"name": "id", "type": "STRING"},
					{"name": "item", "type": "RECORD", mode: "REPEATED", "fields": [
						{"name": "id", "type": "STRING"}
					]}
				]}
			]}
		]);
	});

	test("limit recursive elements by path (contextReferences)", () => {
		const definitions = {
			"Questionnaire.item": {type: "BackboneElement", isArray: true},
			"Questionnaire.item.item": {type: "ContentReference", contentReference: "Questionnaire.item"},
			"Questionnaire.item.id": {type: "fhirid"}
		}
		const recursionLimits = {"Questionnaire.item": 2}
		expect(
			bq.buildSchema("Questionnaire", definitions, {recursionLimits})
		).toEqual([
			{"name": "item", "type": "RECORD", mode: "REPEATED", "fields": [
				{"name": "id", "type": "STRING"},
				{"name": "item", "type": "RECORD", mode: "REPEATED", "fields": [
					{"name": "id", "type": "STRING"},
				]}
			]}
		]);
	});

	test("limit recursive elements (complex types)", () => {
		const definitions = {
			"Patient.managingOrganization": {type: "Reference"},
			"Reference.identifier": {type: "Identifier"},
			"Identifier.assigner": {type: "Reference"}
		}
		expect(
			bq.buildSchema("Patient", definitions)
		).toEqual([
			{"name": "managingOrganization", "type": "RECORD", "fields": [
				{"name": "identifier", "type": "RECORD", "fields": [
					{"name": "assigner", "type": "RECORD", "fields": [
						{"name": "identifier", "type": "RECORD", "fields": [
							{"name": "assigner", "type": "RECORD", "fields": [
								{"name": "identifier", "type": "RECORD", "fields": [
									{"name": "assigner", "type": "RECORD", "fields": [
									]}
								]}
							]}
						]}
					]}
				]}
			]}
		]);
	});

	test("limit recursive element by path (complex types)", () => {
		const definitions = {
			"Patient.managingOrganization": {type: "Reference"},
			"Reference.identifier": {type: "Identifier"},
			"Identifier.assigner": {type: "Reference"}
		}
		const recursionLimits = {"Identifier.assigner": 2}
		expect(
			bq.buildSchema("Patient", definitions, {recursionLimits})
		).toEqual([
			{"name": "managingOrganization", "type": "RECORD", "fields": [
				{"name": "identifier", "type": "RECORD", "fields": [
					{"name": "assigner", "type": "RECORD", "fields": [
						{"name": "identifier", "type": "RECORD", "fields": [
							{"name": "assigner", "type": "RECORD", "fields": [
								{"name": "identifier", "type": "RECORD", "fields": [
								]}
							]}
						]}
					]}
				]}
			]}
		]);
	});

	test("don't add extensions to elements in extensions", () => {
		const definitions = {
			"Patient.extension": {type: "Extension"},
			"Extension.valueHumanName": {type: "HumanName"},
			"HumanName.family": {type: "string"},
			"HumanName.extension": {type: "Extension"}
		};
		const includeExtensions = ["Patient.extension.valueHumanName"];
		expect(
			bq.buildSchema("Patient", definitions, {includeExtensions})
		).toEqual([
			{"name": "extension", "type": "RECORD", "fields": [
				{"name": "valueHumanName", "type": "RECORD", "fields": [
					{"name": "family", "type": "STRING"}
				]},
				{"name": "parent", "type": "STRING"},
				{"name": "url", "type": "STRING"}
			]}
		]);
	});

	test("only include specified extension elements", () => {
		const definitions = {
			"Patient.extension": {type: "Extension"},
			"Extension.valueHumanName": {type: "HumanName"},
			"HumanName.family": {type: "string"},
			"HumanName.use": {type: "code"},
			"Extension.valueString": {type: "string"},
		};
		const includeExtensions = [
			"Patient.extension.valueHumanName"
		];
		expect(
			bq.buildSchema("Patient", definitions, {includeExtensions})
		).toEqual([
			{"name": "extension", "type": "RECORD", "fields": [
				{"name": "valueHumanName", "type": "RECORD", "fields": [
					{"name": "family", "type": "STRING"},
					{"name": "use", "type": "STRING"}
				]},
				{"name": "parent", "type": "STRING"},
				{"name": "url", "type": "STRING"}				
			]}
		]);
	});

	test("don't include extension without a value", () => {
		const definitions = {
			"Patient.name": {type: "HumanName"},
			"HumanName.family": {type: "string"},
			"HumanName.extension": {type: "Extension"},
			"Extension.valueString": {type: "string"},
			"Extension.url": {type: "string"},
			"Extension.extension": {type: "Extension"}
		};
		expect(
			bq.buildSchema("Patient", definitions, {includeExtensions:[], includeAA:true})
		).toEqual([
			{"name": "name", "type": "RECORD", "fields": [
				{"name": "family", "type": "STRING"},
				{"name": "family_aa", "type": "STRING"},
			]}
		]);
	});

	test("skip non-analytical elements", () => {
		const definitions = {
			"Patient.gender": {type: "code"},
			"Patient.text": {type: "Narrative"}
		}
		expect(
			bq.buildSchema("Patient", definitions)
		).toEqual([{
			name: "gender", type: "STRING"
		}]);
	})

	test("augment Extension", () => {
		const definitions = {
			"Patient.extension": {type: "Extension", isArray: true},
			"Extension.extension": {type: "Extension", isArray: true},
			"Extension.url": {type: "url"},
			"Extension.valueString": {type: "string"}
		}
		const includeExtensions = [
			"Patient.extension.valueString"
		]
		expect(
			bq.buildSchema("Patient", definitions, {includeAA: true, includeExtensions})
		).toEqual([
			{"name": "extension", "type": "RECORD", mode: "REPEATED", "fields": [
				{"name": "valueString","type": "STRING"},
				{"name": "valueString_aa","type": "STRING"},
				{"name": "parent", "type": "STRING"},
				{"name": "url", "type": "STRING"}			
			]},
		]);
	})

	test("augment Reference", () => {
		const definitions = {
			"Patient.managingOrganization": {type: "Reference"},
			"Reference.reference": {type: "string"},
			"Reference.display": {type: "string"},
		}
		expect(
			bq.buildSchema("Patient", definitions, {includeAA: true})
		).toEqual([
			{"name": "managingOrganization", "type": "RECORD", "fields": [
				{"name": "display","type": "STRING"},
				{"name": "display_aa","type": "STRING"},
				{"name": "reference","type": "STRING"},
				{"name": "reference_id_aa", "type": "STRING"},
				{"name": "reference_prev_aa", "type": "STRING"},
			]}
		]);
	})

	test("augment dateTime", () => {
		const definitions = {
			"Patient.birthDate": {type: "dateTime"}
		}
		expect(
			bq.buildSchema("Patient", definitions, {includeAA: true})
		).toEqual([
			{name: "birthDate", type: "STRING"},
			{name: "birthDate_aa", type: "RECORD", fields: [
				{name: "start", type: "TIMESTAMP"},
				{name: "end", type: "TIMESTAMP"}
			]}
		]);
	})

	test("augment string", () => {
		const definitions = {
			//yeah, this isn't valid FHIR
			"Patient.comment": {type: "string"}
		}
		expect(
			bq.buildSchema("Patient", definitions, {includeAA: true})
		).toEqual([
			{name: "comment", type: "STRING"},
			{name: "comment_aa", type: "STRING"}
		]);
	})

	test("augment base resource", () => {
		const definitions = {
			//yeah, this isn't valid FHIR
			"Patient.resourceType": {type: "string"}
		}
		expect(
			bq.buildSchema("Patient", definitions, {includeAA: true})
		).toEqual([
			{name: "resourceType", type: "STRING"},
			{name: "id_prev_aa", type: "STRING"}
		]);
	});

});