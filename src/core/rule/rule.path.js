import {AppError, Log} from '../infrastructure';
import {isUndefined} from '../utility';

const resolvers = {};

export class RulePath {
	constructor() {
	}

	static register(name, resolve) {
		Log.warn(`rule path REGISTER ${name}`);
		if (resolvers.hasOwnProperty(name)) {

			throw new AppError(
				'rule.path',
				`"${name}" is already registered`);
		}


		resolvers[name] = resolve;
		return RulePath;
	}

	static get(source) {
		const path = this.find(source);
		if (!path) {
			throw new AppError(
				'rule.path',
				'Rule path can\'t be found');
		}

		return path;
	}

	static find(source) {
		const getName = this.name;
		for (let key of Object.keys(resolvers)) {
			const name = getName(key);
			const value = source[name];
			if (!isUndefined(value) && value !== null) {
				const path = resolvers[key](source, value);
				if (path) {
					return path;
				}
			}
		}

		return null;
	}

	static name(name) {
		return '_' + name;
	}

	static get require() {
		const getName = this.name;
		return Object.keys(resolvers)
			.reduce((memo, key) => {
				memo[getName(key)] = `^^?${key}`;
				return memo;
			}, {});
	}
}