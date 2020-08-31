const resourceProfiles = require("../fhir/R4.0.1/profiles-resources.json");
const typeProfiles = require("../fhir/R4.0.1//profiles-types.json");

const config = require("./config-annotated.json");

const fs = require("fs");
const path = require("path");

const builder = require("../src/build-definitions");
const augmentor = require("../src/augmentor");

const resourceDefinitions = builder.buildBundle(resourceProfiles);
const typeDefinitions = builder.buildBundle(typeProfiles);

const definitions = {definitions: Object.assign(resourceDefinitions.definitions, typeDefinitions.definitions), resourceNames: resourceDefinitions.resourceNames};
// fs.writeFileSync(path.join(__dirname, "output", "definitions.json"), JSON.stringify(definitions.definitions, null, 2));

//TODO: convert to streaming reads and writes to handle large files
let output = {};

config.resourceTypes.forEach( resourceType => {
	console.log(`Transforming ${resourceType}`)
	const input = fs.readFileSync(path.join(__dirname, config.inputDir, `${resourceType}.ndjson`), "utf-8");
	input.split("\n").forEach( inputResource => {
		if (!inputResource) return;
		const json = JSON.parse(inputResource);
		const result = augmentor.transformResource(json, definitions.definitions, config.inputUrl, null, {includeExtensions: config.extensions});
		(Array.isArray(result) ? result : [result]).forEach( outputResource => {
			output[outputResource.resourceType] = output[outputResource.resourceType] || [];
			output[outputResource.resourceType].push(JSON.stringify(outputResource));
		})
	})
});

const outputDir = path.join(__dirname, config.outputDir);
fs.readdirSync(outputDir).map( file =>  fs.unlinkSync(path.join(outputDir, file)) );

Object.keys(output).forEach( resourceType => {
	console.log(`Writing ${resourceType}`)
	fs.writeFileSync(path.join(outputDir, `${resourceType}.ndjson`), output[resourceType].join("\n"));
})