import React, {useState} from "react";
import DateRule from "./DateRule";
import CodingRule from "./CodingRule";
import IdRule from "./IdRule";
import { Modal, Button, DropdownButton, Dropdown, Form, Container, Row, Col, Card, ListGroup, ListGroupItem }  from "react-bootstrap";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEdit, faTrashAlt, faCheck } from '@fortawesome/free-solid-svg-icons'

function CompositeRule(props) {

	const handleUpdateRule = (id, ruleData) => {
		let children = props.data.children.map( (r, i) => {
			return i === id ? ruleData : r
		})
		if (id > children.length-1) children[id] = ruleData;
		const invalid = children.filter( r => r.invalid ? true : false ).length > 0;
		props.onUpdate({...props.data, children, invalid});
	}

	const handleNameChange = e => {
		if (/^[a-zA-Z_]?[a-zA-Z0-9_]*$/.test(e.target.value))
			props.onUpdate({...props.data, name: e.target.value});
	}
	const renderRule = (ruleData, fieldDefinition, i) => {
		if (fieldDefinition.type === "instant") {
			const relativeOptions = (props.relativeOptions||[]).filter( r => r.type === "instant" );
			return <DateRule 
				data={{...ruleData, validate: props.data.validate}}
				fieldDefinition={fieldDefinition} 
				relativeOptions={relativeOptions}
				edit={props.edit}
				onUpdate={data => handleUpdateRule(i, data)}
				hideControls={true}
			/>
		} else if (fieldDefinition.type === "coding") {
			return <CodingRule 
				data={{...ruleData, validate: props.data.validate}}
				fieldDefinition={fieldDefinition} 
				edit={props.edit}
				onUpdate={data => handleUpdateRule(i, data)}
				hideControls={true}
			/>
		} else if (props.fieldDefinition.type === "fhirId") {
			const relativeOptions = (props.relativeOptions||[]).filter( r => r.fieldType === "fhirId" );
			return <IdRule 
				relativeOptions={relativeOptions}
				data={{...ruleData, validate: props.data.validate}}
				fieldDefinition={fieldDefinition} 
				edit={props.edit}
				onUpdate={data => handleUpdateRule(i, data)}
				hideControls={true}
			/>
		}
	}

	const renderHeaderEdit = () => {
		return <div>
			<span className="font-weight-bold">
				{props.fieldDefinition.name}
			</span>
			<FontAwesomeIcon icon={faTrashAlt} 
				opacity="0.5"
				style={{cursor: "pointer"}} 
				pull="right"
				onClick={e => props.onDelete(props.id)} 
			/>
			<div className="my-2">
				<input type="text" className="form-control" 
					placeholder="Rule Name (letters, numbers or underscore)"
					value={props.data.name || ""}
					onChange={handleNameChange}
				/>
			</div>
		</div>
	}

	const renderHeaderDisplay = () => {
		return <div className="d-flex justify-content-between align-items-top">
			<span className="font-weight-bold">
				{props.fieldDefinition.name}{" "}
				(<span className="mark">{props.data.name || "Unnamed"}</span>)
			</span>
			{!props.hideControls &&
				<FontAwesomeIcon icon={faEdit} opacity="0.5" style={{cursor: "pointer"}} className="m-1" />
			}
		</div>
	}

	return <>
		{ props.edit ? renderHeaderEdit() : renderHeaderDisplay() }
		{props.fieldDefinition.fields.map( (f, i) => {
			return <div key={i} className="ml-4 my-3">
				{ renderRule(props.data.children[i], f, i) }
			</div>
		})}		
	</>


}

export default CompositeRule;