import Directive from '../directive';
import {STICKY_CORE_NAME, VIEW_CORE_NAME, VIEWPORT_CORE_NAME,
	TABLE_CORE_NAME, HEAD_CORE_NAME, FOOT_CORE_NAME} from 'src/definition';
import AppError from 'core/infrastructure/error';
import StickyFactory from 'core/sticky/sticky.factory';
import angular from 'angular';

class StickyCore extends Directive(STICKY_CORE_NAME, {
	view: `^^${VIEW_CORE_NAME}`,
	viewport: `^^${VIEWPORT_CORE_NAME}`,
	table: `^^${TABLE_CORE_NAME}`,
	head: `?${HEAD_CORE_NAME}`,
	foot: `?${FOOT_CORE_NAME}`
}) {
	constructor($scope, $element, $window, $timeout, $compile, $templateCache) {
		super();

		this.$scope = $scope;
		this.$element = $element;
		this.$window = $window;
		this.$timeout = $timeout;
		this.$compile = $compile;
		this.$templateCache = $templateCache;
	}

	onInit() {
		const model = this.view.model;
		const target =
			this.head ? 'head' :
				this.foot ? 'foot' : null;

		if (target === null) {
			return;
		}

		if (!model.hasOwnProperty(target)) {
			throw new AppError(
				'sticky',
				`Appropriate model for "${target}" is not found`);
		}

		model[target + 'Changed']
			.on(e => {
				if (e.changes.hasOwnProperty('sticky') && e.changes.sticky) {
					this.apply(target);
				}
			});

		if (model[target]().sticky) {
			this.apply(target)
		}
	}

	apply(target) {
		if (this.$element.hasClass('sticky')) {
			return;
		}

		const self = this;
		const table = this.table.$element[0];
		const scrollView = this.viewport.$element[0];
		const sticky = StickyFactory.create(target, table, scrollView, this.$element[0], false);

		const templateUrl = this.view.templateUrl(target);
		const stickySync = angular.element(`<t${target}>${this.$templateCache.get(templateUrl)}</t${target}>`);

		const removeGridAttrs = element => {
			const attributes = Array.from(element.attributes);
			attributes.forEach(attr => {
				const name = attr.name;
				if (name && name.indexOf('q-grid') === 0) {
					element.removeAttribute(name);
				}
			});
			Array.from(element.children).forEach(removeGridAttrs);
		};

		removeGridAttrs(stickySync[0]);

		sticky.origin = stickySync[0];
		this.$element.after(stickySync);
		stickySync.css('visibility', 'hidden');

		this.$compile(stickySync.contents())(this.$scope);

		const unwatches = [];
		unwatches.push(this.view.theme.changed.on(
			() => self.$timeout(() => sticky.invalidate())
		));

		unwatches.push(this.view.model.viewChanged.on(
			() => self.$timeout(() => sticky.invalidate())
		));

		unwatches.push(this.view.model.dataChanged.on(
			() => self.$timeout(() => sticky.invalidate())
		));

		unwatches.push(this.view.model.groupChanged.on(
			() => self.$timeout(() => sticky.invalidate())
		));

		unwatches.push(this.view.model.pivotChanged.on(
			() => self.$timeout(() => sticky.invalidate())
		));

		unwatches.push(sticky.invalidated.on(
			() => self.$scope.$apply()
		));

		const onScroll = () => sticky.scrollSync();
		sticky.scrollView.addEventListener('scroll', onScroll);

		const onResize = () => sticky.invalidate();
		this.$window.addEventListener('resize', onResize);

		unwatches.push(this.$scope.$watch(() => {
			const tagName = target === 'head' ? 'th' : 'td';
			return Array.from(stickySync.find(tagName))
				.map(col => col.offsetWidth);
		}, () => self.$timeout(() => sticky.invalidate()),
			true));

		this.$scope.$on('$destroy', () => {
			unwatches.forEach(u => u());
			sticky.scrollView.removeEventListener('scroll', onScroll);
			self.$window.removeEventListener('resize', onResize);
			sticky.destroy();
		});
	}
}

StickyCore.$inject = ['$scope',
	'$element',
	'$window',
	'$timeout',
	'$compile',
	'$templateCache'];

export default {
	restrict: 'A',
	bindToController: true,
	controllerAs: '$sticky',
	controller: StickyCore,
	require: StickyCore.require,
	link: StickyCore.link
};