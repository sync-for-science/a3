import React, { useState, useRef, useEffect } from 'react';
import { useStoreon } from "storeon/react";
import {Modal, Form, Row, Col, Button} from 'react-bootstrap';
import sqliteGen from "./sqlite-gen";

function ExportQuery() {

	const {blocks, dispatch} = useStoreon(["blocks"]);

	const [copySuccess, setCopySuccess] = useState();
	const [show, setShow] = useState(true);
	const textAreaRef = useRef(null);
	const [sql, setSql] = useState();

	useEffect( () => {
		setSql( sqliteGen.buildSql(blocks, true) );
	}, []);

	const handleCopyToClipboard = e => {
		textAreaRef.current.select();
		document.execCommand('copy');
		e.target.focus();
		setCopySuccess('Copied!');
	}

	const handleDownload = e => {
		//per https://stackoverflow.com/questions/30864573/what-is-a-blob-url-and-why-it-is-used
		const fileName = "query.sql";
			if (typeof(Blob) != 'undefined') {
			const textFileAsBlob = new Blob([sql], {type: 'text/plain'});
			const downloadLink = document.createElement("a");
			downloadLink.download = fileName;
			if (window.webkitURL != null) {
				downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
			} else {
				downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
				downloadLink.onclick = e => document.body.removeChild(e.target);
				downloadLink.style.display = "none";
				document.body.appendChild(downloadLink);
			}
			downloadLink.click();
		} else {
			var pp = document.createElement('a');
			pp.setAttribute('href', 'data:text/plain;charset=utf-8,' +
				encodeURIComponent(sql));
			pp.setAttribute('download', fileName);
			pp.onclick = e => document.body.removeChild(e.target);
			pp.click();
		}
	}

	const handleDbChange = e => {
		setCopySuccess("");
	}

	return <Modal show={true} animation={false} size="lg" onHide={e => dispatch("view/set", "blocks")}>
		<Modal.Header closeButton>
			<Modal.Title>Export SQL</Modal.Title>
		</Modal.Header>
		<Modal.Body>
			<Form.Group as={Row} className="align-items-center">
				<Col xs="auto">
					<Form.Label>Format</Form.Label>
				</Col>
				<Col>
					<Form.Control as="select" onChange={handleDbChange}>
						<option>Sqlite</option>
					</Form.Control>
				</Col>
			</Form.Group>
			<Form.Control as="textarea" rows={6} ref={textAreaRef} defaultValue={sql} readOnly 
				style={{backgroundColor:"#FFF", "fontFamily": "monospace,monospace", whiteSpace: "pre"}}
			/>
		</Modal.Body>
		<Modal.Footer className="align-items-center">
			<div className="mr-auto my-auto ml-2">{copySuccess}</div>
			<Button variant="outline-primary" onClick={handleCopyToClipboard}>Copy to Clipboard</Button>
			<Button onClick={handleDownload}>Download</Button>
		</Modal.Footer>
	</Modal>
}

export default ExportQuery;