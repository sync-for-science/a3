import React, {useState} from "react";
import DateRule, {defaultDateProperties} from "./DateRule";
import CodingRule, { defaultCodingProperties } from "./CodingRule";
import CompositeRule from "./CompositeRule";
import {Button, ListGroup, ListGroupItem }  from "react-bootstrap";
import IdRule from "./IdRule";
import QuantityRule, { defaultQuantityProperties } from "./QuantityRule";

function RuleSet(props) {

	const [edit, setEdit] = useState(props.edit);

	const handleUpdateRule = (pos, ruleData) => {
		props.onUpdate(
			props.data.map( (r, i) => pos === i ? ruleData : r )
		)
	}

	const handleDeleteRule = pos => {
		if (props.data.length === 1)
			return props.onDelete(props.id);

		props.onUpdate(
			props.data.filter( (r, i) => pos !== i )
		)
	}

	const handleOr = () => {
		props.onUpdate(
			props.data.concat([getRuleDefaults(props.fieldDefinition)])
		);
	}

	const handleDone = () => {
		const invalid = props.data.filter( r => r.invalid ? true : false )
		if (invalid.length)
			return props.onUpdate(
				props.data.map( r => ({...r, validate: true}) )
			);

		setEdit(false);
	}
		
	const renderRule = (ruleData, i) => {
		if (props.fieldDefinition.type === "instant") {
			const relativeOptions = (props.relativeOptions||[]).filter( r => r.fieldType === "instant" );
			return <DateRule 
				data={ruleData} 
				fieldDefinition={props.fieldDefinition} 
				relativeOptions={relativeOptions}
				edit={edit}
				onUpdate={data => handleUpdateRule(i, data)}
				onDelete={e => handleDeleteRule(i)}
				hideControls={!edit && i > 0}
			/>
		} else if (props.fieldDefinition.type === "coding") {
			return <CodingRule 
				data={ruleData} 
				fieldDefinition={props.fieldDefinition} 
				edit={edit}
				onUpdate={data => handleUpdateRule(i, data)}
				onDelete={e => handleDeleteRule(i)}
				hideControls={!edit && i > 0}
			/>
		} else if (props.fieldDefinition.type === "composite") {
			return <CompositeRule
				data={ruleData} 
				fieldDefinition={props.fieldDefinition} 
				edit={edit}
				onUpdate={data => handleUpdateRule(i, data)}
				onDelete={e => handleDeleteRule(i)}
				hideControls={!edit && i > 0}
			/>
		} else if (props.fieldDefinition.type === "fhirId") {
			const relativeOptions = (props.relativeOptions||[]).filter( r => r.fieldType === "fhirId" );
			return <IdRule 
				data={ruleData} 
				relativeOptions={relativeOptions}
				fieldDefinition={props.fieldDefinition} 
				edit={edit}
				onUpdate={data => handleUpdateRule(i, data)}
				onDelete={e => handleDeleteRule(i)}
				hideControls={!edit && i > 0}
			/>
		} else if (props.fieldDefinition.type === "quantity") {
			const relativeOptions = (props.relativeOptions||[]).filter( r => r.fieldType === "quantity" );
			return <QuantityRule 
				data={ruleData} 
				relativeOptions={relativeOptions}
				fieldDefinition={props.fieldDefinition} 
				edit={edit}
				onUpdate={data => handleUpdateRule(i, data)}
				onDelete={e => handleDeleteRule(i)}
				hideControls={!edit && i > 0}
			/>
		}
	}

	return <ListGroup className="shadow my-4">
		{edit && <ListGroupItem className="text-right">
			<Button variant="outline-primary" size="sm"
				onClick={handleDone} 
			>Done</Button>
		</ListGroupItem>}

		{props.data.map( (rule, i) => {
			return <ListGroupItem key={i}  onClick={e => !edit && setEdit(true)}>
				{i > 0 && <div className="text-center p-1 mb-1">
					<span className="badge badge-pill badge-primary">or</span>
				</div>}
				{ renderRule(rule, i) }
			</ListGroupItem>
		})}

		{edit && <ListGroupItem className="text-center">
			<Button variant="outline-primary" size="sm"
				onClick={handleOr}
			>Or...</Button>
		</ListGroupItem>}
	</ListGroup>

}


function getRuleDefaults(fieldDefinition, ruleData={}) {
	if (fieldDefinition.type === "composite") {
		const children = fieldDefinition.fields.map( (field, i) => {
			return getRuleDefaults(field, (ruleData && ruleData[i]) || {});
		});
		return {children};
	} else if (fieldDefinition.type === "instant") {
		return  {invalid: false, ...defaultDateProperties(), ...(fieldDefinition.defaults || {}), ...ruleData};
	} else if (fieldDefinition.type === "quantity") {
		return  {invalid: false, ...defaultQuantityProperties(), ...(fieldDefinition.defaults || {}), ...ruleData};
	} else if (fieldDefinition.type === "coding") {
		return  {invalid: true, ...defaultCodingProperties(), ...(fieldDefinition.defaults || {}), ...ruleData};
	} else {
		return  {invalid: true, ...(fieldDefinition.defaults || {}), ...ruleData};
	}
}


export default RuleSet;
export {getRuleDefaults} ;