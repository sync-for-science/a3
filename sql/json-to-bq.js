const data = require("./dm-sample-data");
const _ = require("lodash");

function jsonToSql(json, level=0) {

	function pad() {
		return [...arguments].join(" ");
			// .map( v => " ".repeat(level) + v )
			// .join("\n");
	}

	function fixReserved(name) {
		return {
			end: "end_aa"
		}[name] || name;
	}

	if (Array.isArray(json)) {
		return pad(
			"[",  json.map( j => jsonToSql(j, level+1) ).join(""), "]"
		);

	} else if (json === null) {
		return pad("NULL")

	} else if (typeof(json) === "object") {
		let sql = [];
		for (let key in json) {
			sql.push( jsonToSql(json[key], level+1) + " AS " + fixReserved(key) )
		}
		return typeof(json) === "object" && level > 0
			? pad( "STRUCT ( " + sql.join(",\n"), " )")
			: pad( sql.join(",\n") )
			
	} else if (typeof(json) === "number") {
		return pad(json);

	} else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(json)) {
		return pad("TIMESTAMP('" + json + "')");

	} else  {
		return pad("'" + json + "'");
	}
}


const resources = _.groupBy(data, "resourceType");
const sql = _.map( resources, (v,k) => {
	let sql = ["CREATE TEMP TABLE " + k + " AS ("];
	const statements = v.map( (resource,i) => {
		return "SELECT " + jsonToSql(resource) + (i < v.length-1 ? " UNION ALL " : "")
	})
	sql.push(...statements)
	sql.push(")")
	return sql.join(" ")
}).join(";\n\n") + ";";
console.log(sql);