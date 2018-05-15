import React from 'react';
import ReactDOM from 'react-dom';
import Card from './src/js/card.jsx';

window.ProtoGraph = window.ProtoGraph || {};
window.ProtoGraph.Card = window.ProtoGraph.Card || {};


ProtoGraph.Card.toLanding = function () {
  this.cardType = 'LandingCard';
}

ProtoGraph.Card.toLanding.prototype.init = function (options) {
  this.options = options;
}

ProtoGraph.Card.toLanding.prototype.getData = function (data) {
  return this.containerInstance.exportData();
}

ProtoGraph.Card.toLanding.prototype.renderCol16 = function (data) {
  this.mode = 'col16';
  this.render();
}

ProtoGraph.Card.toLanding.prototype.renderCol4 = function (data) {
  this.mode = 'col4';
  this.render();
}

ProtoGraph.Card.toLanding.prototype.render = function () {
  ReactDOM.unmountComponentAtNode(this.options.selector);
  ReactDOM.render(
    <Card
      dataURL={this.options.data_url}
      schemaURL={this.options.schema_url}
      siteConfigs={this.options.site_configs}
      siteConfigURL={this.options.site_config_url}
      mode={this.mode}
      ref={(e) => {
        this.containerInstance = this.containerInstance || e;
      }} />,
    this.options.selector);
}

