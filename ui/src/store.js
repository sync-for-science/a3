import { createStoreon } from "storeon";
import definitions from "./definitions.js";
import dmExample from "./dm-example";

const defaultState = {
	nextId: 1,
	definitions: definitions,
	view: "blocks",
	hasTestConfig: false,
	blocks: [{
		id: "root",
		name: "All Patients",
		parentId: null,
		definition: {
			tableName: "Patient",
			patientIdField: "id"
		}
	}]
}

const actions = store => {
	store.on("@init", () => {
		return /example=true/.test(window.location.search)
			? dmExample
			: defaultState;
	});
	
	store.on("block/upsert", ({nextId, blocks}, {block, insertAbove}) => {
		const result = block.id === undefined ? {
			nextId: nextId+1,
			patients: undefined,
			blocks: blocks.map( b => {
				return b.id === insertAbove
					? {...b, parentId: nextId+1}
					: {...b, patients: undefined}
				}).concat([{...block, id: nextId+1}])
			} : {
				patients: undefined,
				blocks: blocks.map( b => {
					if (block.id !== b.id) {
						return {...b, patients: undefined}
					} else {
						return {...b, ...block, patients: undefined};
					}
				})
			}
		console.log(result)
		return result;
	});

	store.on("block/delete", ({blocks}, {id, parentId}) => {
		const result =  {
			patients: undefined,
			blocks: blocks
				.map( b => b.parentId === id
					? {...b, parentId, patients: undefined}
					: {...b, patients: undefined}
				)	
				.filter( b => b.id !== id)
				.map( b => ({
					...b,
					rules: b.rules && b.rules.map( r => ({
						...r,
						restrictions: r.restrictions && r.restrictions.filter( rs => {
							return (!rs.target || rs.target.split(".")[0] !== id.toString()) &&
								(!rs.compareTo || rs.compareTo.split(".")[0] !== id.toString())
						})
					}))
				}))
		}
		return result;
	});

	store.on("view/set", ({}, view) => {
		return {view}
	});

	store.on("hasTestConfig/set", ({}, hasTestConfig) => {
		return {hasTestConfig}
	});

	store.on("patients/set", ({blocks}, result) => {
		if (!result) return {
			patients: undefined, 
			blocks: blocks.map( b => ({...b, patients: undefined}) )
		}
		const blockResults = result[0].values.reduce( (acc, row) => {
			return {...acc, [row[0]]: row[1]}
		}, {});
		return {
			patients: blockResults["result"],
			blocks: blocks.map( b => {
				return {...b, patients: blockResults[b.id.toString()]}
			})
		}

	});

}

const store = createStoreon([actions]);
export default store;