import React, {useState} from "react";
import Restrictions, {getRuleDefaults} from "./Restrictions";
import Retention from "./Retention";
import _ from "lodash";
import { Modal, Button, DropdownButton, Dropdown, ListGroup, ListGroupItem, Form }  from "react-bootstrap";

function BlockEditor(props) {

	const [name, setName] = useState(props.data.name);
	const [retention, setRetention] = useState(props.data.retention || {retentionType: "none"});
	const [rules, setRules] = useState(props.data.rules || []);
	const [nextRuleId, setNextRuleId] = useState(props.data.nextRuleId || 0);

	const [isDirty, setIsDirty] = useState();
	const [dirtyWarning, setDirtyWarning] = useState();
	const [referenceWarning, setReferenceWarning] = useState();

	const [definition, setDefinition] = useState(props.data.definition);
	const [validate, setValidate] = useState();
	
	const updateRule = (ruleId, newRule) => {
		setRules(
			rules.map(rule => rule.id !== ruleId ? rule : {...rule, restrictions: newRule})
		);
		setIsDirty(true);
	}

	const addRule = fieldId => {	
		const fieldDefinition = definition.fields.find( d => d.id === fieldId);
		setRules(
			rules.concat([{id: nextRuleId, fieldId, edit: true, restrictions: [getRuleDefaults(fieldDefinition)] }])
		);
		setNextRuleId(nextRuleId+1);
		setIsDirty(true);
	}

	const deleteRule = ruleId => {
		setRules(rules.filter( rule => rule.id !== ruleId ));
		setIsDirty(true)
	}

	const handleSaveBlock = () => {
		const invalidRules = rules.filter(r => {
			return r.restrictions.filter(rs => rs.invalid ? true : false).length
		});
		if (invalidRules.length > 0) setRules(
			rules.map( r => ({
				...r,
				edit: r.restrictions.filter(rs => rs.invalid ? true : false).length > 0,
				restrictions: r.restrictions.map(rs => ({...rs, validate: true}) )
			}) )
		);
		if (retention.invalid || !name) setValidate(true);
		if (invalidRules.length > 0 || retention.invalid || !name)
			return;
		
		props.onSave({
			name, retention, definition, 
			parentId: props.parentId, id: props.id,
			nextRuleId,
			rules: rules.map( r => {
				const restrictions = r.restrictions.map( restriction => {
					const {validate, invalid, ...detail} = restriction;
					return detail;
				})
				const {edit, ...rule} = r;
				return {...rule, restrictions}
			})
		})
	
	}

	const handleClose = (e, force) => {
		e && e.preventDefault();
		if (isDirty && !force && definition) {
			setDirtyWarning(true);
		} else {
			props.onClose();
		}
	}

	const handleDeleteBlock = (e, force) => {
		if (!force && props.isReferenced) {
			setReferenceWarning(true);
		} else {
			props.onDelete();
		}
	}

	const renderRenderBlockTypeList = () => {
		const renderBlockType = (block, i) => {
			return <ListGroupItem key={i} action onClick={ e => {
				setName(block.name); 
				setDefinition(block);
			 }}>
				{block.name}
			</ListGroupItem>
		}
		return <>
			<Modal.Header closeButton>
				<Modal.Title>Block Type</Modal.Title>
			</Modal.Header>
			<Modal.Body><ListGroup>
				{props.definitions.map(renderBlockType)}
			</ListGroup></Modal.Body>
		</>
	}

	const renderHeader = () => {
		const idJoinOptions = props.relativeOptions.find( r => r.fieldType === "fhirId");
		const ddFields = definition.fields
			.filter( f => f.name !== "patient" && (idJoinOptions || f.type !== "fhirId"));

		return <div className="d-flex">
			<DropdownButton title="Add Rule" variant="success" className="mr-auto">
				{ddFields.map( field => {
					return <Dropdown.Item onClick={e => addRule(field.id)} key={field.id}>
						{field.name || field.id}
					</Dropdown.Item>
				})}
			</DropdownButton>
			<Button variant="outline-danger" className="mr-2" onClick={handleDeleteBlock}>Delete Block</Button>
			{ isDirty && <Button variant="primary" className="mr-1" onClick={handleSaveBlock}>Save Block</Button> }
		</div>
	}


	const renderRules = () => {
		return rules.map( rule => {
			const id = rule.id;
			const fieldDefinition = definition.fields.find( d => d.id === rule.fieldId)
			return <div key={rule.id}><Restrictions
				fieldDefinition={fieldDefinition}
				relativeOptions={props.relativeOptions}
				data={rule.restrictions}
				edit={rule.edit}
				onUpdate={r => updateRule(id, r)}
				onDelete={r => deleteRule(id, r)}
			/></div>
		})
	}

	const hasErrors = rules.filter(r => {
		return r.restrictions.filter(rs => rs.invalid && rs.validate ? true : false).length > 0
	}).length > 0 || (validate && !name) || (validate && retention.invalid);

	const renderRuleList = () => <>
		<Modal.Header closeButton>
			<Modal.Title className="d-flex flex-grow-1">
				<Form.Control 
					autoFocus
					placeholder="Name"
					value={name || ""}
					className={validate && !name ? "is-invalid" : ""}
					onChange={e => {
						setName(e.target.value);
						setIsDirty(true);
					}}
				/>
				</Modal.Title>
		</Modal.Header>
		<Modal.Body>
			<p>Block Type: {definition.name} <small>({definition.version})</small></p>
			{ dirtyWarning && <div className="alert alert-danger text-center mb-4">
				You have unsaved changes -&nbsp;
				<a href="#" className="alert-link" onClick={e => handleClose(e, true)}>discard?</a>
			</div>}
			{ referenceWarning && <div className="alert alert-danger text-center mb-4">
				Other blocks reference this block -&nbsp;
				<a href="#" className="alert-link" onClick={e => handleDeleteBlock(e, true)}>delete anyway?</a>
			</div>}
			{ hasErrors && <div className="alert alert-danger text-center mb-4">
				Please fix the highlighted errors
			</div>}
			{ renderHeader() }
			{ renderRules() }
		</Modal.Body>
		<Modal.Footer>
			<Retention
				{...retention}
				definition={definition}
				usedVars={props.usedVars}
				validate={validate}
				onChange={newRetention => {
					setRetention({...retention, ...newRetention}); 
					setIsDirty(true)
				}}
				edit={true}
			/>
		</Modal.Footer>
	</>

	return <Modal backdrop="static" show={true} animation={false} onHide={handleClose} size="lg">
		{definition ? renderRuleList() : renderRenderBlockTypeList()}
	</Modal>

}

export default BlockEditor;