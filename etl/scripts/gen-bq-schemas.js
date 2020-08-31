const resourceProfiles = require("../fhir/R4.0.1/profiles-resources.json");
const typeProfiles = require("../fhir/R4.0.1//profiles-types.json");

const config = require("./config-bq-schemas.json");

const fs = require("fs");
const path = require("path");

const builder = require("../src/build-definitions");
const bigQuery = require("../src/bigquery");

const resourceDefinitions = builder.buildBundle(resourceProfiles);
const typeDefinitions = builder.buildBundle(typeProfiles);
const definitions = {definitions: Object.assign(resourceDefinitions.definitions, typeDefinitions.definitions), resourceNames: resourceDefinitions.resourceNames};

const outputDir = path.join(__dirname, config.outputDir);
fs.readdirSync(outputDir).map( file =>  fs.unlinkSync(path.join(outputDir, file)) );

config.resourceTypes.forEach( resourceType => {
	console.log(`Generating schema for ${resourceType}`);
	const schema = bigQuery.buildSchema(resourceType, definitions.definitions, {
		includeExtensions: config.extensions, 
		recursionLimits: config.recursionLimits, 
		includeAA: true
	});
	fs.writeFileSync(path.join(outputDir, `${resourceType}.json`), JSON.stringify(schema, null, 2));
});