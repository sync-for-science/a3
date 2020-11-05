const sqlite = require("better-sqlite3");
const _ = require("lodash");
import sqliteGen from "../sqlite-gen";

function getPatientCount(blocks, data, blockId="result") {
	const sql = sqliteGen.buildSql(blocks, true);
	const result = runQuery(sql, data);
	return result.find( b => b.block.toString() === blockId.toString()).patients;
}

function runQuery(query, data = []) {
	let result;
	const db = new sqlite(":memory:");
	const dataStatements = _.chain(data)
		.groupBy("resourceType")
		.mapValues( (resources, rType) => {
			const resourceStrings = resources.map( r => "('" +JSON.stringify(r) + "')")
			return [
				`DROP TABLE IF EXISTS ${rType}`,
				`CREATE TEMPORARY TABLE ${rType}(json)`,
				`INSERT INTO ${rType} VALUES ${resourceStrings.join(",")}`
			]
		}).values().flatten().value();	
	const statements = dataStatements.concat(
		query.replace(/;\s*$/, "").split(";")
	);
	// console.log(statements.join(";\n"))
	statements.forEach( (s, i) => {
		if (i < statements.length-1) {
			db.prepare(s+";").run();
		} else {
			result = db.prepare(s+";").all();
		}
	});
	db.close();
	return result;
}

describe("simple query", () => {

	test("no conditions", () => {
		const data = [
			{resourceType: "Patient", id:"1"},
			{resourceType: "Patient", id:"2"},
			{resourceType: "Observation", id:"3"}
		];
		const blocks = [{
			id: "root",
			definition: {
				tableName: "Patient",
				patientIdField: "id"
			}
		}];
		const sql = sqliteGen.buildSql(blocks, true);
		const result = runQuery(sql, data);
		expect(result).toEqual([ 
			{ block: 'root', patients: 2 },
			{ block: 'result', patients: 2 }
		])
	});

	test("coding", () => {
		const data = [
			{resourceType: "Condition", id:"2", patientId: "1", code: {
				coding: [{code: "1234", system: "http://test"}]
			}},
			{resourceType: "Patient", id:"1"}
		];
		let blocks = [{
			parentId: "root",
			id: 1,
			definition: {
				tableName: "Condition",
				patientIdField: "patientId",
				fields: [{id: "code", field: "code.coding[]", type: "coding"}]
			},
			rules: [{
				fieldId: "code",
				restrictions: [{
					code: "1234", system: "http://test"
				}]
			}]
		}]

		expect(getPatientCount(blocks, data)).toEqual(1);

		//wrong system
		blocks[0].rules[0].restrictions[0].system = "http://test1";
		expect(getPatientCount(blocks, data)).toEqual(0);
		
		//wrong code
		blocks[0].rules[0].restrictions[0] = {system: "http://test", code: "wrong"}
		expect(getPatientCount(blocks, data)).toEqual(0);

		//or options
		blocks[0].rules[0].restrictions = [
			{system: "http://test", code: "1234"},
			{system: "http://test", code: "wrong"}
		]
		expect(getPatientCount(blocks, data)).toEqual(1);
	});

	test("code", () => {
		const data = [
			{resourceType: "Condition", id:"2", patientId: "1", verificationStatus: "confirmed"},
			{resourceType: "Patient", id:"1"}
		];
		let blocks = [{
			parentId: "root",
			id: 1,
			definition: {
				tableName: "Condition",
				patientIdField: "patientId",
				fields: [{id: "verificationStatus", field: "verificationStatus", type: "code"}]
			},
			rules: [{
				fieldId: "verificationStatus",
				restrictions: [{code: "confirmed"}]
			}]
		}]

		expect(getPatientCount(blocks, data)).toEqual(1);

		//wrong code
		blocks[0].rules[0].restrictions[0].code = "refuted";
		expect(getPatientCount(blocks, data)).toEqual(0);
		
		//or options
		blocks[0].rules[0].restrictions = [
			{code: "confirmed"}, {code: "provisional"}
		]
		expect(getPatientCount(blocks, data)).toEqual(1);
	});

	test("absolute quantity", () => {
		const data = [
			{resourceType: "Observation", id:"3", patientId: "1", valueQuantity: {
				value: 6.3,
				system: "http://unitsofmeasure.org",
				code: "mmol/L"
			}},
			{resourceType: "Observation", id:"4", patientId: "2", valueQuantity: {
				value: 4,
				system: "http://unitsofmeasure.org",
				code: "mmol/L"
			}},
			{resourceType: "Patient", id:"1"},
			{resourceType: "Patient", id:"2"}
		];
		let blocks = [{
			parentId: "root",
			id: 1,
			definition: {
				tableName: "Observation",
				patientIdField: "patientId",
				fields: [{id: "valueQuantity", field: "valueQuantity", type: "quantity"}]
			},
			rules: [{
				fieldId: "valueQuantity",
				restrictions: [{
					comparator: "gt",
					compareTo: "fixed",
					fixedValue: 6
				}]
			}]
		}]

		expect(getPatientCount(blocks, data)).toEqual(1);
		
		//broader expression
		blocks[0].rules[0].restrictions[0].fixedValue = 3
		expect(getPatientCount(blocks, data)).toEqual(2);

		// //incorrect code
		blocks[0].rules[0].restrictions[0].unitCode = "mmHg";
		expect(getPatientCount(blocks, data)).toEqual(0);

		// //incorrect system
		blocks[0].rules[0].restrictions[0].unitCode = "mmol/L";
		blocks[0].rules[0].restrictions[0].unitSystem = "http://unitsofmeasure.org/1";
		expect(getPatientCount(blocks, data)).toEqual(0);
	});

	test("populated quantity", () => {
		const data = [
			{resourceType: "Observation", id:"3", patientId: "1", valueQuantity: {
				value: 6.3,
				system: "http://unitsofmeasure.org",
				code: "mmol/L"
			}},
			{resourceType: "Observation", id:"4", patientId: "2"},
			{resourceType: "Observation", id:"5", patientId: "3"},
			{resourceType: "Patient", id:"1"},
			{resourceType: "Patient", id:"2"},
			{resourceType: "Patient", id:"3"}
		];
		let blocks = [{
			parentId: "root",
			id: 1,
			definition: {
				tableName: "Observation",
				patientIdField: "patientId",
				fields: [{id: "valueQuantity", field: "valueQuantity", type: "quantity"}]
			},
			rules: [{
				fieldId: "valueQuantity",
				restrictions: [{comparator: "populated"}]
			}]
		}]

		expect(getPatientCount(blocks, data)).toEqual(1);
		
		//not populated
		blocks[0].rules[0].restrictions[0].comparator = "not_populated"
		expect(getPatientCount(blocks, data)).toEqual(2);
	});


	test("absolute date", () => {
		const data = [
			{resourceType: "Observation", id:"3", patientId: "1", effectiveDateTime: "2020-01-01"},
			{resourceType: "Observation", id:"4", patientId: "2", effectiveDateTime: "2020-06-01"},
			{resourceType: "Patient", id:"1"},
			{resourceType: "Patient", id:"2"}
		];
		let blocks = [{
			parentId: "root",
			id: 1,
			definition: {
				tableName: "Observation",
				patientIdField: "patientId",
				fields: [{id: "effectiveDateTime", field: "effectiveDateTime", type: "date"}]
			},
			rules: [{
				fieldId: "effectiveDateTime",
				restrictions: [{
					comparator: "gt",
					compareTo: "fixed",
					fixedValue: "2020-02-01"
				}]
			}]
		}]

		expect(getPatientCount(blocks, data)).toEqual(1);
		
		//broader expression
		blocks[0].rules[0].restrictions[0].fixedValue = "2019-01-01"
		expect(getPatientCount(blocks, data)).toEqual(2);
	});

	test("populated date", () => {
		const data = [
			{resourceType: "Observation", id:"3", patientId: "1", effectiveDateTime: "2020-01-01"},
			{resourceType: "Observation", id:"4", patientId: "2"},
			{resourceType: "Observation", id:"4", patientId: "3"},
			{resourceType: "Patient", id:"1"},
			{resourceType: "Patient", id:"2"},
			{resourceType: "Patient", id:"3"}
		];
		let blocks = [{
			parentId: "root",
			id: 1,
			definition: {
				tableName: "Observation",
				patientIdField: "patientId",
				fields: [{id: "effectiveDateTime", field: "effectiveDateTime", type: "date"}]
			},
			rules: [{
				fieldId: "effectiveDateTime",
				restrictions: [{comparator: "populated"}]
			}]
		}]

		expect(getPatientCount(blocks, data)).toEqual(1);
		
		//not populated
		blocks[0].rules[0].restrictions[0].comparator = "not_populated"
		expect(getPatientCount(blocks, data)).toEqual(2);
	});

	test("retention", () => {
		const data = [
			{resourceType: "Observation", id:"3", patientId: "1", effectiveDateTime: "2020-01-01"},
			{resourceType: "Observation", id:"4", patientId: "1", effectiveDateTime: "2020-06-01"},
			{resourceType: "Observation", id:"5", patientId: "2", effectiveDateTime: "2020-06-01"},
			{resourceType: "Patient", id:"1"},
			{resourceType: "Patient", id:"2"}
		];
		let blocks = [{
			parentId: "root",
			id: 1,
			definition: {
				tableName: "Observation",
				patientIdField: "patientId",
				fields: [{id: "effectiveDateTime", field: "effectiveDateTime", type: "date"}]
			},
			retention: {
				retentionSortField: "effectiveDateTime",
				retentionType: "earliest"
			}
		}]
		
		expect(getPatientCount(blocks, data)).toEqual(2);
	});

});

describe("block interactions", () => {

	test("retention with relative date", () => {
		const data = [
			{resourceType: "Observation", id:"3", patientId: "1", effectiveDateTime: "2020-01-01"},
			{resourceType: "Observation", id:"4", patientId: "1", effectiveDateTime: "2020-06-01"},
			{resourceType: "Patient", id:"1"}
		];
		const definition =  {
			tableName: "Observation",
			patientIdField: "patientId",
			fields: [{id: "effectiveDateTime", field: "effectiveDateTime", type: "date"}]
		};
		let blocks = [{
			parentId: "root", id: 1, definition,
			retention: {
				retentionSortField: "effectiveDateTime",
				retentionType: "earliest"
			}
		},{
			parentId: 1, id: 2, definition,
			rules: [{
				fieldId: "effectiveDateTime",
				restrictions: [{
					comparator: "lt",
					compareTo: "1.effectiveDateTime",
				}]
			}]
		}]

		//retain earliest
		expect(getPatientCount(blocks, data)).toEqual(0);

		//retain latest
		blocks[0].retention.retentionType = "latest";
		expect(getPatientCount(blocks, data)).toEqual(1);
	});

	test("retention with relative quantity", () => {
		const data = [
			{resourceType: "Observation", id:"3", patientId: "1", effectiveDateTime: "2020-01-01", valueQuantity: {
				value: 10,
				system: "http://test"
			}},
			{resourceType: "Observation", id:"4", patientId: "1", effectiveDateTime: "2020-06-01", valueQuantity: {
				value: 20,
				system: "http://test"
			}},
			{resourceType: "Patient", id:"1"}
		];
		const definition = {
			tableName: "Observation",
			patientIdField: "patientId",
			fields: [
				{id: "effectiveDateTime", field: "effectiveDateTime", type: "date"},
				{id: "valueQuantity", field: "valueQuantity", type: "quantity"}
			]
		};
		let blocks = [{
			parentId: "root", id: 1, definition,
			retention: {
				retentionSortField: "effectiveDateTime",
				retentionType: "earliest"
			}
		},{
			parentId: 1, id: 2, definition,
			rules: [{
				fieldId: "valueQuantity",
				restrictions: [{
					comparator: "lt",
					compareTo: "1.valueQuantity",
				}]
			}]
		}]

		//retain earliest
		expect(getPatientCount(blocks, data)).toEqual(0);

		//retain latest
		blocks[0].retention.retentionType = "latest";
		expect(getPatientCount(blocks, data)).toEqual(1);
	});

	test("id linkages", () => {
		const data = [
			{resourceType: "Observation", id:"3", patientId: "1", effectiveDateTime: "2020-01-01", valueQuantity: {
				value: 10,
				system: "http://test"
			}},
			{resourceType: "Observation", id:"4", patientId: "1", effectiveDateTime: "2020-06-01", valueQuantity: {
				value: 20,
				system: "http://test"
			}},
			{resourceType: "Patient", id:"1"}
		];
		const definition = {
			tableName: "Observation",
			patientIdField: "patientId",
			fields: [
				{id: "effectiveDateTime", field: "effectiveDateTime", type: "date"},
				{id: "valueQuantity", field: "valueQuantity", type: "quantity"},
				{id: "id", field: "id", type: "fhirId"}
			]
		};
		let blocks = [{
			parentId: "root", id: 1, definition,
			retention: {
				retentionSortField: "effectiveDateTime",
				retentionType: "earliest"
			}
		},{
			parentId: 1, id: 2, definition,
			rules: [{
				fieldId: "id",
				restrictions: [{
					target: "1.resourceId",
				}]
			}]
		}]

		expect(getPatientCount(blocks, data)).toEqual(1);
	});

});

describe("patient list", () => {

	test("inclusion blocks - include union", () => {
		const data = [
			{resourceType: "Patient", id:"1", birthDate: "2020-01-01"},
			{resourceType: "Patient", id:"2", birthDate: "2019-01-01"},
			{resourceType: "Patient", id:"3", birthDate: "2018-01-01"}
		];
		const definition = {
			tableName: "Patient",
			patientIdField: "id",
			fields: [{id: "birthDate", field: "birthDate", type: "date"}]
		};
		let blocks = [{
			parentId: "root", id: 1, definition,
			rules: [{
				fieldId: "birthDate",
				restrictions: [{
					comparator: "gt",
					compareTo: "fixed",
					fixedValue: "2019-12-31"
				}]
			}]
		},{
			parentId: "root", id: 2, definition,
			rules: [{
				fieldId: "birthDate",
				restrictions: [{
					comparator: "gt",
					compareTo: "fixed",
					fixedValue: "2018-12-31"
				}]
			}]
		}]
		expect(getPatientCount(blocks, data)).toEqual(2);
	});

	test("exclusion blocks - filter patients", () => {
		const data = [
			{resourceType: "Patient", id:"1", birthDate: "2020-01-01"},
			{resourceType: "Patient", id:"2", birthDate: "2019-01-01"},
			{resourceType: "Patient", id:"3", birthDate: "2018-01-01"}
		];
		const definition = {
			tableName: "Patient",
			patientIdField: "id",
			fields: [{id: "birthDate", field: "birthDate", type: "date"}]
		};
		let blocks = [{
			parentId: "root", id: 1, definition,
			exclude: true,
			rules: [{
				fieldId: "birthDate",
				restrictions: [{
					comparator: "gt",
					compareTo: "fixed",
					fixedValue: "2019-12-31"
				}]
			}]
		},{
			parentId: "root", id: 2, definition,
			exclude: true,
			rules: [{
				fieldId: "birthDate",
				restrictions: [{
					comparator: "gt",
					compareTo: "fixed",
					fixedValue: "2018-12-31"
				}]
			}]
		}]
		expect(getPatientCount(blocks, data)).toEqual(1);
	});

	test("overlapping exclusion and inclusion blocks", () => {
		const data = [
			{resourceType: "Patient", id:"1", birthDate: "2020-01-01"},
			{resourceType: "Patient", id:"2", birthDate: "2019-01-01"},
			{resourceType: "Patient", id:"3", birthDate: "2018-01-01"}
		];
		const definition = {
			tableName: "Patient",
			patientIdField: "id",
			fields: [{id: "birthDate", field: "birthDate", type: "date"}]
		};
		let blocks = [{
			parentId: "root", id: 1, definition,
			exclude: false,
			rules: [{
				fieldId: "birthDate",
				restrictions: [{
					comparator: "gt",
					compareTo: "fixed",
					fixedValue: "2018-12-31"
				}]
			}]
		},{
			parentId: "root", id: 2, definition,
			exclude: true,
			rules: [{
				fieldId: "birthDate",
				restrictions: [{
					comparator: "gt",
					compareTo: "fixed",
					fixedValue: "2019-12-31"
				}]
			}]
		}]
		expect(getPatientCount(blocks, data)).toEqual(1);
	});


});

