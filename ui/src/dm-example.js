import definitions from "./definitions.js";

export default {
	"nextId": 7,
	"definitions": definitions,
	"blocks": [{
			"id": "root",
			"name": "All Patients",
			"parentId": null
	},{
		"name": "Demographics",
		"retention": { 
			"retentionType": "all",
			"retentionVar": "pt"
		},
		"definition": definitions[2],
		"parentId": "root",
		"id": 0,
		"nextRuleId": 0,
		"rules": []
	},{
		"name": "DM Dx",
		"definition": definitions[1],
		"retention": {
			"retentionType": "none",
		},
		"parentId": 0,
		"id": 1,
		"nextRuleId": 1,
		"rules": [{
			"id": 0,
			"fieldName": "code",
			"ruleSet": [{
				"name": "SNOMED DM",
				"system": "http://snomed.info/sct",
				"code": "105401000119101,106281000119103,10754881000119104,111307005,111552007,123763000,127012008,1481000119100,190330002,190331003,190368000,190372001,190389009,190406000,190407009,190410002,190411003,190412005,199223000,199225007,199226008,199227004,199228009,199229001,199230006,199231005,23045005,237599002,237600004,237601000,237604008,237613005,237618001,237619009,237627000,237651005,24203005,2751001,28032008,31321000119102,313435000,313436004,314771006,314893005,314902007,314903002,314904008,33559001,359642000,368521000119107,408539000,426705001,426875007,427089005,42954008,44054006,445260006,46635009,4783006,51002006,530558861000132104,57886004,59079001,5969009,609561005,609562003,609563008,609564002,609566000,609567009,609568004,609569007,609570008,609571007,609572000,609573005,609574004,609575003,609576002,609577006,609578001,70694009,709147009,710815001,716362006,71791000119104,719216001,720519003,722454003,724136006,73211009,733072002,734022008,75524006,75682002,76751001,81531005,8801005,91352004,9859006"
			}]
		}]
	},{
		"name": "Most Recent A1C",
		"retention": {
			"retentionType": "latest",
			"retentionSortField": "effectiveDateTimeEnd",
			"retentionVar": "a1c_2"
		},
		"definition": definitions[0],
		"parentId": 1,
		"id": 2,
		"nextRuleId": 2,
		"rules": [{
			"id": 0,
			"fieldName": "status",
			"ruleSet": [{
				"invalid": false,
				"option": "Final",
				"validate": false
			},{
				"invalid": false,
				"option": "Amended",
				"validate": false
			},{
				"invalid": false,
				"option": "- Corrected",
				"validate": false
			}]
		},{
			"id": 1,
			"fieldName": "code",
			"ruleSet": [{
				"system": "http://loinc.org",
				"code": "4548-4"
			}]
		}]
	},{
		"name": "Most Recent A1C Elevated",
		"retention": { "retentionType": "none" },
		"definition": definitions[0],
		"parentId": 2,
		"id": 3,
		"nextRuleId": 2,
		"rules": [{
			"id": 0,
			"fieldName": "id",
			"edit": false,
			"ruleSet": [{
				"invalid": false,
				"target": "2.id",
				"validate": false
			}]
		},{
			"id": 1,
			"fieldName": "valueQuantity",
			"edit": false,
			"ruleSet": [{
				"comparator": "gte",
				"compareTo": "fixed",
				"fixedValue": "7",
				"offsetDir": "plus",
				"offsetValue": 0,
				"validate": false
			}]
		}]
	},{
		"name": "Penultimate A1C",
		"retention": {
			"retentionType": "latest",
			"retentionSortField": "effectiveDateTimeEnd",
			"retentionVar": "a1c_1"
		},
		"definition": definitions[0],
		"parentId": 3,
		"id": 4,
		"nextRuleId": 4,
		"rules": [{
			"id": 0,
			"fieldName": "status",
			"ruleSet": [{
				"invalid": false,
				"option": "Final",
				"validate": false
			},{
				"invalid": false,
				"option": "Amended",
				"validate": false
			},{
				"invalid": false,
				"option": "- Corrected",
				"validate": false
			}]
		},{
			"id": 1,
			"fieldName": "effectiveDateTimeStart",
			"edit": false,
			"ruleSet": [{
				"invalid": false,
				"comparator": "lt",
				"compareTo": "2.effectiveDateTimeStart",
				"offsetUnit": "months",
				"offsetDir": "minus",
				"offsetValue": "1",
				"validate": false
			}]
		},{
			"id": 2,
			"fieldName": "effectiveDateTimeStart",
			"edit": false,
			"ruleSet": [{
				"invalid": false,
				"comparator": "gte",
				"compareTo": "0.birthDate",
				"fixedValue": "2020-01-01",
				"offsetUnit": "years",
				"offsetDir": "plus",
				"offsetValue": "18",
				"validate": false
			}]
		},{
			"id": 3,
			"fieldName": "code",
			"ruleSet": [{
				"system": "http://loinc.org",
				"code": "4548-4"
			}]
		}]
	},{
		"name": "Penultimate A1C Elevated",
		"retention": { "retentionType": "none" },
		"definition": definitions[0],
		"parentId": 4,
		"id": 5,
		"nextRuleId": 2,
		"rules": [{
			"id": 0,
			"fieldName": "id",
			"edit": false,
			"ruleSet": [{
				"invalid": false,
				"target": "4.id",
				"validate": false
			}]
		},{
			"id": 1,
			"fieldName": "valueQuantity",
			"edit": false,
			"ruleSet": [{
				"comparator": "gte",
				"compareTo": "fixed",
				"fixedValue": "7",
				"offsetDir": "plus",
				"offsetValue": 0,
				"validate": false
			}]
		}]
	},{
		"name": "HTN Dx",
		"retention": {"retentionType": "none"},
		"definition": definitions[1],
		"parentId": "root",
		"id": 7,
		"nextRuleId": 2,
		"exclude": true,
		"rules":[{
			"id":0,
			"fieldName":"clinicalStatus",
			"ruleSet": [{
				"invalid":false,
				"option":"Active",
				"validate":false
			}]
		},{
			"id":1,
			"fieldName":"verificationStatus",
			"ruleSet":[{
				"option":"Confirmed"
			}]
		},{
			"id":2,
			"fieldName":"code",
			"ruleSet":[{
				"system":"http://snomed.info/sct",
				"name":"SNOMED",
				"code":"10725009, 10964002, 1201005, 123799005, 59621000"
			},{
				"name":"ICD-9",
				"system":"http://hl7.org/fhir/ValueSet/icd-9",
				"code":"401.1, 401.9"
			}]		
		}]

	}]
}