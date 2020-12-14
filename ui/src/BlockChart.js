import React, {useState} from "react";
import _ from "lodash";
import { Button, DropdownButton, Dropdown, Badge, Row, Col } from "react-bootstrap";
import { useStoreon } from "storeon/react";
import BlockEditor from "./BlockEditor";

function BlockChart(props) {

	const { dispatch, blocks, definitions, patients } = useStoreon("blocks", "definitions", "patients");
	const [activeInstance, setActiveInstance] = useState();
	let cells = {};

	const blockList = blocks.concat(
		blocks.filter( b => {
			return !blocks.find( node => node.parentId === b.id )
		}).map( b => {
			return {id: b.id+"-end", name: b.exclude? "Exclude" : "Include", parentId: b.id, isLeaf:true, patients: patients}
		})
	)
	const walkUp = (id, span=1) => {
		const node = blockList.find( b => b.id === id );
		if (cells[id]) {
			cells[id].span = cells[id].span + span;
		} else {
			cells[id] = {
				id, span, name: node.name, retention: node.retention, 
				parentId: node.parentId, isLeaf: node.isLeaf,
				patients: node.patients
			}
		}
		if (node && node.parentId !== null) walkUp(node.parentId, span)

	}

	const walkDown = (id, row, col=1) => {
		cells[id] = {...cells[id], id, row, col,}

		let nextCol = col;
		blockList.filter( bi => bi.parentId === id )
			.forEach( child => {
				walkDown(child.id, row+1, nextCol)
				nextCol = nextCol + cells[child.id].span;
			});
	}

	//walk up from leaf nodes
	blockList.filter( bi => {
		return !blockList.find( child => child.parentId === bi.id )
	}).forEach( node => walkUp(node.id) );

	//walk down from root node
	blockList.filter( bi => bi.parentId === null )
		.forEach( (node, i) => walkDown(node.id, 1, 1) );

	const colCount = blockList.reduce( (acc, node) => {
		const cell = cells[node.id];
		return Math.max(acc, cell.col + cell.span);
	}, 0);

	const rowCount = blockList.reduce( (acc, node) => {
		return Math.max(acc, cells[node.id].row) 
	}, 0);

	const saveBlock = data => {
		dispatch("block/upsert", {block: data, insertAbove: (activeInstance && activeInstance.insertAbove) || undefined});
		setActiveInstance(null);
	}

	const deleteBlock = () => {
		if (activeInstance.id !== undefined)
			dispatch("block/delete", activeInstance);
		setActiveInstance(null);
	}

	let skip = 0;
	const renderCell = (r, c, cell) => {

		const cellStyles = "btn m-2 p-4 flex-grow-1 block-button text-dark " + (
			(cell.name === "Include" && "btn-outline-success") || 
			(cell.name === "Exclude" && "btn-outline-danger") ||
			"btn-outline-primary"
		);

		const retentionText = cell.retention && cell.retention.retentionType !== "none"
			? `retain ${cell.retention.retentionType} as ${cell.retention.retentionVar}`
			: "";

		const name = retentionText
			? <span>{cell.name}<br/>&#8595;<br/>{retentionText}</span>
			: cell.name;

		return <td key={r+":"+c} colSpan={cell.span} className="text-center" style={{height: "1px"}}>
			<div className="h-100 w-100 d-flex flex-column">
				{ r !== 1 && !cell.isLeaf && <div>
					<DropdownButton title="&#8595;" size="sm" variant="outline-primary" className="m-2 no-caret">
						<Dropdown.Item href="#" onClick={e => setActiveInstance({parentId: cell.parentId})}>Add Branch</Dropdown.Item>
						<Dropdown.Item href="#" onClick={e => setActiveInstance({parentId: cell.parentId, insertAbove: cell.id})}>Insert Block</Dropdown.Item>
					</DropdownButton>
				</div> }

				{ cell.isLeaf && <div>
					<Button size="sm" variant="outline-primary" className="m-2"
						onClick={e => setActiveInstance({parentId: cell.parentId})}
					>&#8595;</Button>
				</div> }

				<button className={cellStyles} onClick={e => {
					if (cell.isLeaf) {
						saveBlock({
							id: cell.parentId, 
							exclude: cell.name === "Exclude" ? false : true
						});
					} else if (cell.id !=="root" && !cell.isLeaf) {
						setActiveInstance({id: cell.id, parentId: cell.parentId})
					};
				}}>
					{name}
				</button>
				
				{ cell.patients !== undefined && !cell.isLeaf && <div>
					<Badge variant="primary" size="sm">{cell.patients} {cell.patients !== 1 ? "Patients" : "Patient"}</Badge>
				</div> }

				{ cell.patients !== undefined && cell.isLeaf && <div>
					<Badge variant="success" size="sm">Cohort:<br/>{cell.patients} {cell.patients !== 1 ? "Patients" : "Patient"}</Badge>
				</div> }


			</div>
		</td>;
	}

	const renderRow = r => {
		let skip = 0;
		return <tr key={r} className="" style={{height: "100%"}}>{
			 _.range(1, colCount).map( c => {
				 if (skip) {
					skip -=1;
					return;
				 }
				const cell = _.find(cells, cell => cell.row === r && cell.col === c);
				if (cell) {
					skip = cell.span-1;
					return renderCell(r, c, cell) 
				} else {
					return <td key={r+":"+c}></td>;
				}
			})
		}</tr>
	}
	
	const getRelativeOptions = (blockId, blocks) => {
		let relativeOptions = [];

		const block = blocks.find( b => b.id === blockId);

		block.retention && block.retention.retentionVar && 
			block.definition.fields.forEach( field => {
				relativeOptions.push({
					retentionVar: block.retention.retentionVar,
					fieldType: field.type,
					fieldName: field.name || field.id,
					value: [block.id, field.id].join("."),
					label: [block.retention.retentionVar, field.name || field.id].join(".")
				})
			});
		
		return block.parentId !== null
			? relativeOptions.concat( getRelativeOptions(block.parentId, blocks) )
			: relativeOptions;
	}



	const renderModal = () => {
		const data = blocks.find( b => b.id === activeInstance.id) || {};
		const retentionVar = data.retention && data.retention.retentionType !== "none" ? data.retention.retentionVar : "";
		const usedVars = blocks
			.filter( b => b.retention && b.retention.retentionType !== "none" && 
				b.retention.retentionVar && 
				b.retention.retentionVar !== retentionVar
			)
			.map( b => b.retention.retentionVar );

		const relativeOptions = data.parentId !== null ? getRelativeOptions(activeInstance.parentId, blocks) : [];

		const isReferenced = blocks.find( b => {
			return b.rules && b.rules.find( r => {
				return r.restrictions && r.restrictions.find( rs => {
					return (rs.compareTo && rs.compareTo.split(".")[0] === activeInstance.id.toString()) ||
						(rs.target && rs.target.split(".")[0] === activeInstance.id.toString())
				})
			})
		});

		console.log(isReferenced)

		return <BlockEditor 
			id={activeInstance.id}
			parentId={activeInstance.parentId}
			data={data}
			definitions={definitions}
			usedVars={usedVars}
			onClose={e => setActiveInstance(null)}
			relativeOptions={relativeOptions}
			onSave={saveBlock}
			onDelete={deleteBlock}
			isReferenced={!!isReferenced}
		/>
	}

	return <div>
		<div className="container-fluid split">
			<table className="m-4"><tbody>
				{ _.range(1, rowCount+1).map( renderRow )}
			</tbody></table></div>
			{ activeInstance && renderModal() }
	</div>
	

}

export default BlockChart;