import {AppError} from '@grid/core/infrastructure';
import {columnFactory} from '@grid/core/column/column.factory';
import {generate} from '@grid/core/column-list';
import {Json} from '@grid/core/import/json';
import {Xml} from '@grid/core/import/xml';
import {Csv} from '@grid/core/import/csv';
import {Xlsx} from './xlsx';

function getType(name) {
	const dotDelimeter = /[.]/g.test(name);
	if (dotDelimeter) {
		let type = name.split('.');
		return type[type.length - 1];
	}
}

function firstRowTitle(index, row) {
	return row[index];
}
function numericTitle(index) {
	return index;
}
function alphabeticalTitle(index) {
	const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

	if (index < alphabet.length) {
		return alphabet[index];
	} else {
		const indexFirst = Math.floor(index / alphabet.length - 1);
		const indexSecond = index % alphabet.length;
		return `${alphabet[indexFirst]}${alphabet[indexSecond]}`;
	}
}

function readFile(e, file, model, options = {}) {
	const data = e.target.result;
	const type = file.type === '' ? getType(file.name) : file.type;
	switch (type) {
		case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
		case 'xlsx': {
			const xlsx = new Xlsx();
			const rows = xlsx.read(data, options);
			const createColumn = columnFactory(model);
			const columns = generate({rows: rows, columnFactory: (type, body) => createColumn('text', body), deep: false});
			model.data({
				columns: columns,
				rows: rows
			});
			break;
		}
		case 'application/json':
		case 'text/json':
		case 'json': {
			const json = new Json();
			const rows = json.read(data);
			if (rows.length) {
				const columns = generate({rows: rows, columnFactory: columnFactory(model), deep: true});
				model.data({
					columns: columns,
					rows: rows
				});
			} else {
				throw new AppError('import', 'JSON for input should be an array of objects');
			}
			break;
		}
		case 'application/xml':
		case 'text/xml':
		case 'xml': {
			const xml = new Xml();
			const rows = xml.read(data, 'row');
			const createColumn = columnFactory(model);
			const columns = generate({rows: rows, columnFactory: (type, body) => createColumn('text', body), deep: true});
			model.data({
				columns: columns,
				rows: rows
			});
			break;
		}
		case 'application/vnd.ms-excel':
		case 'text/csv':
		case 'csv': {
			const csv = new Csv();
			const rows = csv.read(data);
			let title = firstRowTitle;
			if (options.header === 1) {
				title = numericTitle;
			} else if (options.header === 'A') {
				title = alphabeticalTitle;
			}
			const columns = generate({rows: rows, columnFactory: columnFactory(model), deep: false, title: title});
			rows.shift(0);
			model.data({
				columns: columns,
				rows: rows
			});
			break;
		}
		default: {
			throw new AppError('import', `This is not valid file type ${type}`);
		}
	}
}

export {
	readFile
};