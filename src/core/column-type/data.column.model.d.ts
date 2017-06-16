import {ColumnModel} from './column.model';

export declare interface IAggregationOptions{
	distinct?: boolean;
	separator?: string;
}

export class DataColumnModel extends ColumnModel {
	constructor();

	isDefault?: boolean;
	aggregation?: string;
	aggregationOptions?: IAggregationOptions;

}