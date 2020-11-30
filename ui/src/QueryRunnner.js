import { useStoreon } from "storeon/react";
import React, { useEffect, useState, useRef } from 'react';
import {Modal, Button, Alert, Spinner, Table, Card, Form} from 'react-bootstrap';
import _ from 'lodash';

import sqliteGen from "./sqlite-gen";
import FileDropZone from "./FileDropZone";

let sqlite;

function QueryTester(props) {
	
	const {blocks, dispatch} = useStoreon("blocks");

	const [sqlState, setSqlState] = useState("loading_sqlite");
	const [dataSource, setDataSource] = useState("built-in");
	const [fileName, setFileName] = useState();
	const [db, setDb] = useState();
	const [error, setError] = useState();
	const fileInputRef = useRef(null);
	

	useEffect( () => {
		if (props.mode === "test-run")
			return setSqlState("running_query");

		if (!props.show || sqlite) return;

		import("./sql-wasm-json1").then( initSqlJs => {
			sqlite = initSqlJs.default();
			sqlite.then( () => {
				setSqlState("no_data");
				if (dataSource === "built-in")
					loadBuiltInData();
			}).catch( e => {
				console.log(e);
				setError("Error loading SQL engine");
				setSqlState("error");
			});
		});
	}, [props.show]);


	useEffect( () => {
		if (sqlState === "running_query")
			//this is ugly but seems necessary to allow time for browser to redraw screen
			window.setTimeout( () => {
				new Promise( (resolve, reject) => {
					try {
						const sql = sqliteGen.buildSql(blocks, true);
						const result = db.exec(sql);
						resolve(result)
					} catch (e) {
						reject(e);
					};
				}).then( result => {
					setSqlState("data_loaded");
					dispatch("patients/set", result);
				}).then( () => {
					dispatch("view/set", "blocks");
				}).catch( e => {
					setError("Query failed: " + e.message);
					setSqlState("error");
				})
			}, 500)
	}, [sqlState])

	if (!props.show) return null;

	const fhirToSql = data => {
		if (!data.find(r => r.resourceType === "Patient"))
			throw({message: "No patient resources found"});
		return _.chain(data)
			.groupBy("resourceType")
			.mapValues( (resources, rType) => {
				const resourceStrings = resources.map( r => "('" +JSON.stringify(r) + "')")
				return [
					`CREATE TEMPORARY TABLE ${rType}(json)`,
					`INSERT INTO ${rType} VALUES ${resourceStrings.join(",")}`
				]
			}).values().flatten().join("; ").value();
	} 

	const fhirToDb = fhir => {
		sqlite.then( sqlite => {
			const newDb = new sqlite.Database();
			const sql = fhirToSql(fhir);
			newDb.run(sql);
			setSqlState("data_loaded");
			dispatch("hasTestConfig/set", true);
			setDb(newDb)
		}).catch( e => {
			console.log(e);
			setError("Error loading FHIR data: " + e.message);
			setFileName(null);
			setSqlState("error");
		});
	}

	const openDb = data => {
		sqlite.then( sqlite => {
			const newDb = new sqlite.Database(data);
			setDb(newDb)
			setSqlState("data_loaded");
			dispatch("hasTestConfig/set", true);
		}).catch( e => {
			console.log(e);
			setError("Error loading FHIR data: " + e.message);
			setFileName(null);
			setSqlState("error");
		});
	}

	const loadFile = file => {
		const extension = file.name.split(".")[file.name.split(".").length-1];
		setFileName(file.name);
		setSqlState("loading_data");
		setDataSource("local");

		const reader = new FileReader();
		reader.onerror = e => {
			setFileName(null);
			setError("Error reading data file");
			setSqlState("error");
		};
		reader.onloadend = e => {
			if (file.size > 1000000 && extension === "ndjson") {
				setFileName(null);
				setError("File is too large - please limit NDJSON files to size to 1mb");
				setSqlState("error");
			} else if (extension === "ndjson") {
				const records = e.target.result
					.replace(/\'/g, "''")
					.trim().split("\n")
					.map( r => JSON.parse(r));
				setFileName(`${file.name} (${records.length} resources)`)
				fhirToDb(records);
			} else {
				const data = new Uint8Array(reader.result);
				openDb(data);
			}
		}
		if (extension === "ndjson") {
			reader.readAsText(file);
		} else {
			reader.readAsArrayBuffer(file);
		}
	}

	const loadBuiltInData = () => {
		setSqlState("loading_data");
		fetch(`bulk.db`).then( response => {
			return response.arrayBuffer();
		})
		.then( arrayBuffer => {
			const data = new Uint8Array(arrayBuffer);
			openDb(data);
		})
		.catch( error => {
			console.log(error);
			setError("Error reading data file");
			setSqlState("error");
		});
	}

	const handleHide = e => {
		if (sqlState === "loading_sqlite" || sqlState === "loading_data" || sqlState === "running_query")
			return false;
		dispatch("view/set", "blocks")
	}

	const handleFileChange = e => {
		const file = fileInputRef.current.files[0];
		if (file) loadFile(file);
	}

	const handleSetData = e => {
		fileInputRef.current.click();
	}

	const handleRunQuery = e => {
		setSqlState("running_query");
	}

	const handleDataSourceChange = e => {
		if (e.target.value === "built-in") {
			setDataSource("built-in");
			loadBuiltInData();
		} else {
			setDataSource("local");
			setSqlState("no_data");
			dispatch("hasTestConfig/set", false);
		}
	}

	// console.log(sqlState)

	return <div>
		<input type="file" ref={fileInputRef} style={{display: "none"}} accept=".ndjson,.sqlite,.db" onChange={handleFileChange}/>
		<Modal background="static" show={true} animation={false} size="lg" onHide={handleHide}>
			<Modal.Header closeButton>
				<Modal.Title>Test Query</Modal.Title>
			</Modal.Header>
			<Modal.Body><FileDropZone fileDropHandler={loadFile}>

				{sqlState === "error" && 
					<Alert variant="danger">{error}</Alert>
				}

				{sqlState !== "loading_data" && sqlState !== "running_query" && sqlState !== "loading_sqlite" && <div>

					<Form.Group>
						<Form.Control as="select" value={dataSource} onChange={handleDataSourceChange}>
							<option value="local">Local Dataset</option>
							<option value="built-in">Test Dataset</option>
						</Form.Control>
					</Form.Group>

					{ dataSource === "local" && 
						<Card><Card.Body>
							<div className="font-weight-bold mb-2">
								A3 Annotated FHIR Data (NDJSON or SQLITE DB)
							</div>
							<div>
								<Button size="sm" variant="success" onClick={handleSetData} className="mr-2">
									{fileName ? "Change File" : "Choose File"}
								</Button>
								<span>{fileName}</span>	
							</div>
						</Card.Body></Card>
					}
					
					</div>
				}

				{(sqlState === "loading_sqlite" || sqlState === "loading_data" || sqlState === "running_query") &&
					<div className="my-2 text-center">
						<Spinner animation="border" role="status" />
						{sqlState !== "loading_sqlite" &&
							<div className="mt-1 font-weight-bold">
								{sqlState === "loading_data" ? "Loading Data" : "Running Query"}
							</div>
						}
					</div>
				}

				{sqlState === "data_loaded" &&
					<div className="m-2 mt-4 text-right">
						{sqlState === "data_loaded" && <Button onClick={handleRunQuery}>Run Query!</Button>}
					</div>				
				}

			</FileDropZone></Modal.Body>
		</Modal>
	</div>
}

export default QueryTester;