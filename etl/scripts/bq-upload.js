const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const scriptConfig = require("./config-bq-upload.json");


const PROJECT_ID = scriptConfig.projectId;
const DATASET = scriptConfig.dataset;

const resourceTypes = fs.readdirSync(path.join(__dirname, scriptConfig.dataDir))
	.filter( f => f[0] !== "." );

resourceTypes.slice().forEach(resourceType => {

	const command = [
		"bq load --source_format=NEWLINE_DELIMITED_JSON",
		`--project_id=${PROJECT_ID}`,
		`${DATASET}.${resourceType.replace(".ndjson", "")}`,
		path.join(__dirname, scriptConfig.dataDir, resourceType),
		path.join(__dirname, scriptConfig.schemaDir, resourceType.replace(".ndjson", ".json"))
	].join(" ");

	console.log(execSync(command).toString());
	
});