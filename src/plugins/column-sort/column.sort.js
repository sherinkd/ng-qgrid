import Component from '../../view/components/component';
import { VIEW_CORE_NAME } from '@grid/view/definition';
import { EventListener, EventManager } from '@grid/core/infrastructure';
import { ColumnSortView } from '@grid/plugin/column-sort/column.sort.view';

class ColumnSort extends Component {
	constructor($element) {
		super();

		this.element = $element[0];
	}

	onInit() {
		const iconAsc = this.element.querySelector('.q-grid-asc');
		const iconDesc = this.element.querySelector('.q-grid-desc');

		this.$columnSort = new ColumnSortView(this.view.model, {
			element: this.element,
			view: this.view,
			column: this.column,
			iconAsc,
			iconDesc
		});

		if (this.column.canSort) {
			const listener = new EventListener(this.element, new EventManager(this));
			this.using(listener.on('click', () => this.$columnSort.onClick()));
			this.using(listener.on('mouseleave', () => this.$columnSort.onMouseLeave()));
		}
	}

	onDestroy() {
		this.$columnSort.dispose()
	}
}

ColumnSort.$inject = ['$element'];

export default {
	transclude: true,
	templateUrl: 'qgrid.plugin.column-sort.tpl.html',
	controller: ColumnSort,
	controllerAs: '$columnSortPlugin',
	bindings: {
		'column': '<'
	},
	require: {
		view: `^^${VIEW_CORE_NAME}`
	}
};
