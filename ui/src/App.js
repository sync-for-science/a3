import React from 'react';
import './App.css';
import {Navbar, Nav, Dropdown, ButtonGroup, Button, Form} from 'react-bootstrap';
import { useStoreon } from "storeon/react";

import QueryRunner from './QueryRunnner';
import ExportQuery from './ExportQuery';
import BlockChart from "./BlockChart";



function App() {

	const {view, hasTestConfig, dispatch} = useStoreon("view", "hasTestConfig");

	const handleShowTest = (mode, e) => {
		e.preventDefault();
		dispatch("view/set", mode);
	}


	const handleShowExport = e => {
		e.preventDefault();
		dispatch("view/set", "export");
	}

	const renderTestButton = () => {
		return hasTestConfig
			? <Form inline>
				<Dropdown as={ButtonGroup}>
				<Button variant="outline-light" onClick={handleShowTest.bind(this, "test-run")}>Test Query</Button>
				<Dropdown.Toggle split variant="outline-light" />
				<Dropdown.Menu>
					<Dropdown.Item onClick={handleShowTest.bind(this, "test-configure")}>Change Data Source</Dropdown.Item>
				</Dropdown.Menu>
				</Dropdown>
				</Form>
			: <Button variant="outline-light" onClick={handleShowTest.bind(this, "test-configure")}>Test Query</Button>;

	}

	return <div>
		<Navbar bg="info" variant="dark">
			<Navbar.Brand href="#">FHIR Cohort Query Builder</Navbar.Brand>
			<Nav className="ml-auto">
				{ renderTestButton() }
				<Button variant="outline-light" className="ml-3" onClick={handleShowExport}>Export SQL</Button>
			</Nav>
		</Navbar>
		{view === "export" && <ExportQuery />}
		<QueryRunner show={view && view.indexOf("test") === 0} mode={view} />
		<BlockChart />
	</div>

}

export default App;

