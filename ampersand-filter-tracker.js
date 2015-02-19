;(function() {
  var d3 = require('d3');
  var _ = require('lodash');

  var AmpersandState = require('ampersand-state');
  var AmpersandView = require('ampersand-view');

  var FilterTrackerState = AmpersandState.extend({
    props: {
      filter: 'function'
    },
    session: {
      handles: 'array',
      onApply: [ 'function', false, function() { return function() {}; } ]
    },
    initialize: function() {
      _.each(this.handles, function(handle) {
        handle.active = false;
        handle.model.on(_.map(handle.props, function(prop) { return 'change:' + prop; }).join(' '), function(model, prop) {
          handle.active = _.any(handle.props, function(prop, index) {
            var clearValue = handle.clearValues[index];
            return _.isFunction(clearValue) ? clearValue.call(handle.model) : model[prop] !== clearValue;
          });
          this._view.renderFilters(this.handles);
          this.filter = this.generateFilter(this.handles);
        }.bind(this));
      }, this);
    },
    applyFilters: function() {
      var props = {};
      _.each(this.handles, function(handle) {
        _.each(handle.props, function(prop) {
          props[prop] = handle.model[prop];
        });
      });
      this.onApply(props);
    },
    cancelFilter: function(event) {
      d3.select(event.target.parentNode).each(function(d) {
        d.active = false;
        d.clear.call(d.model);
      });
    },
    cancelAllFilters: function() {
      _.each(this.handles, function(handle) {
        handle.active = false;
        handle.clear.call(handle.model);
      });
    },
    generateFilter: function(handles) {
      return function(model) {
        return _.all(handles, function(handle) {
          return handle.filter(model);
        });
      };
    }
  });

  var FilterTrackerView = AmpersandView.extend({
    template: '<div></div>',
    autoRender: true,
    initialize: function() {
      this.model._view = this;
    },
    events: {
      'click .ampersand-filter-tracker-item-cancel': 'cancelFilter',
      'click .ampersand-filter-tracker-buttons-apply': 'applyFilters',
      'click .ampersand-filter-tracker-buttons-cancel': 'cancelAllFilters'
    },
    render: function() {
      AmpersandView.prototype.render.call(this);

      var filterTracker = d3.select(this.el)
        .attr('class', 'ampersand-filter-tracker');

      var filterTrackerUl = this.ul = filterTracker.append('ul')
        .attr('class', 'ampersand-filter-tracker-ul');

      var filterTrackerButtons = this.div = filterTracker.append('div')
        .attr('class', 'ampersand-filter-tracker-buttons')
        .style('display', 'none');

      var filterTrackerCancel = filterTrackerButtons.append('button')
        .attr('class', 'ampersand-filter-tracker-buttons-cancel')
        .text('cancel');

      var filterTrackerAppply = filterTrackerButtons.append('button')
        .attr('class', 'ampersand-filter-tracker-buttons-apply')
        .text('apply');

      this.renderFilters(this.model.handles);
    },
    renderFilters: function(handles) {
      var filterContainers = this.ul.selectAll('li.ampersand-filter-tracker-item')
        .data(handles);

      filterContainers.exit()
        .remove();

      var filterContainer = filterContainers.enter().append('li')
        .attr('class', 'ampersand-filter-tracker-item');

      var filterCheck = filterContainer.append('svg')
        .attr('class', 'ampersand-filter-tracker-item-check')
        .attr('width', '1.5em')
        .attr('height', '1.5em');

      filterCheck.append('circle')
        .attr('class', 'ampersand-filter-tracker-item-check-circle')
        .attr('r', '0.75em')
        .attr('cx', '0.75em')
        .attr('cy', '0.75em');

      filterCheck.append('line')
        .attr('class', 'ampersand-filter-tracker-item-check-line')
        .attr('x1', '0.5em')
        .attr('y1', '0.75em')
        .attr('x2', '0.75em')
        .attr('y2', '1em');

      filterCheck.append('line')
        .attr('class', 'ampersand-filter-tracker-item-check-line')
        .attr('x1', '0.75em')
        .attr('y1', '1em')
        .attr('x2', '1em')
        .attr('y2', '0.5em');

      filterContainer.append('span')
        .attr('class', 'ampersand-filter-tracker-item-text');

      var filterCancel = filterContainer.append('svg')
        .attr('class', 'ampersand-filter-tracker-item-cancel')
        .attr('width', '1.5em')
        .attr('height', '1.5em');

      filterCancel.append('line')
        .attr('class', 'ampersand-filter-tracker-item-cancel-line')
        .attr('x1', '0.5em')
        .attr('y1', '0.5em')
        .attr('x2', '1em')
        .attr('y2', '1em');

      filterCancel.append('line')
        .attr('class', 'ampersand-filter-tracker-item-cancel-line')
        .attr('x1', '0.5em')
        .attr('y1', '1em')
        .attr('x2', '1em')
        .attr('y2', '0.5em');

      filterContainers
        .style('display', function(d) { return d.active ? 'block' : 'none'; });

      filterContainers.select('span.ampersand-filter-tracker-item-text')
        .text(function(d) { return d.output.call(d.model); });

      this.div
        .style('display', _.any(handles, function(handle) { return handle.active; }) ? undefined : 'none');
    },
    applyFilters: function() {
      this.model.applyFilters();
    },
    cancelFilter: function(event) {
      this.model.cancelFilter(event);
      this.renderFilters(this.model.handles);
    },
    cancelAllFilters: function(event) {
      this.model.cancelAllFilters();
      this.renderFilters(this.model.handles);
    }
  });

  module.exports = {
    State: FilterTrackerState,
    View: FilterTrackerView
  };
})();
