import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import Card from './card.jsx';
import JSONSchemaForm from '../../lib/js/react-jsonschema-form';

export default class editToLanding extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      step: 1,
      dataJSON: {},
      mode: "col16",
      publishing: false,
      schemaJSON: undefined,
      fetchingData: true,
      optionalConfigJSON: {},
      optionalConfigSchemaJSON: undefined,
      uiSchemaJSON: {}
    }
    this.schemaWhiteList = ["ec6c33c26b5d6015bb40"];
    this.toggleMode = this.toggleMode.bind(this);
  }

  exportData() {
    let getDataObj = {
      step: this.state.step,
      dataJSON: this.state.dataJSON,
      schemaJSON: this.state.schemaJSON,
      optionalConfigJSON: this.state.optionalConfigJSON,
      optionalConfigSchemaJSON: this.state.optionalConfigSchemaJSON
    }
    getDataObj["name"] = getDataObj.dataJSON.data.title.substr(0,225); // Reduces the name to ensure the slug does not get too long
    return getDataObj;
  }

  componentDidMount() {
    // get sample json data based on type i.e string or object.
    if (this.state.fetchingData){
      axios.all([
        axios.get(this.props.dataURL),
        axios.get(this.props.schemaURL),
        axios.get(this.props.optionalConfigURL),
        axios.get(this.props.optionalConfigSchemaURL),
        axios.get(this.props.uiSchemaURL)
      ])
      .then(axios.spread((card, schema, opt_config, opt_config_schema, uiSchema) => {
        // fetchingData: false,
        let stateVars = {
          dataJSON: card.data,
          schemaJSON: schema.data,
          optionalConfigJSON: opt_config.data,
          optionalConfigSchemaJSON: opt_config_schema.data,
          uiSchemaJSON: uiSchema.data
        };

        let fetchJSON = [],
          streams = stateVars.dataJSON.data.streams;

        streams.forEach(e => {
          fetchJSON.push(axios.get(e.url));
        });

        axios.all(fetchJSON).then(streams => {
          let data = {
            fetchingData: false,
            streamData: streams.map(e => e.data)
          },
            processedStream = [];

          data.streamData.forEach(e => {
            let d = e.filter(f => this.schemaWhiteList.indexOf(f.schema_id) >= 0);
            processedStream = processedStream.concat(d);
          });

          processedStream = processedStream.slice(0, 10);
          data.streamData = processedStream;

          this.setState(data);
        });

        this.setState(stateVars);
      }));
    }
  }

  onChangeHandler({formData}) {
    switch (this.state.step) {
      case 1:
        this.setState((prevStep, prop) => {
          // Manipulate dataJSON
          return {
            dataJSON: dataJSON
          }
        })
        break;
      case 2:
        this.setState((prevState, prop) => {
          // Manipulate dataJSON
          return {
            dataJSON: dataJSON
          }
        })
        break;
    }
  }

  onSubmitHandler({formData}) {
    switch(this.state.step) {
      case 1:
        this.setState({ step: 2 });
        break;
      case 2:
        if (typeof this.props.onPublishCallback === "function") {
          let dataJSON = this.state.dataJSON;
          dataJSON.data.section = dataJSON.data.title;
          this.setState({ publishing: true, dataJSON: dataJSON });
          let publishCallback = this.props.onPublishCallback();
          publishCallback.then((message) => {
            this.setState({ publishing: false });
          });
        }
        break;
    }
  }

  formValidator(formData, errors) {
    switch (this.state.step) {
      case 1:
        formData.links.forEach((e, i) => {
          // let details = this.lookUpLinkDetail(e.link);
          let details = this.isUrlValid(e.link);
          if (!details) {
            errors.links[i].addError("Article link is invalid");
          }
        });
        return errors;
      default:
        return errors;
    }
    return errors;
  }

  renderSEO() {
    let d = this.state.dataJSON.data;

    let blockquote_string = `<h1>${d.title}</h1>`;
    // Create blockqoute string.
    let seo_blockquote = '<blockquote>' + blockquote_string + '</blockquote>'
    return seo_blockquote;
  }

  renderSchemaJSON() {
    let schema;
    switch(this.state.step){
      case 1:
        return this.state.schemaJSON.properties.data;
        break;
      // Add more schemas...
    }
  }

  renderFormData() {
    switch(this.state.step) {
      case 1:
        return this.state.dataJSON.data;
        break;
      case 2:
        return {analysis: this.state.dataJSON.data.analysis};
        break;
    }
  }

  showLinkText() {
    switch(this.state.step) {
      case 1:
        return '';
        break;
      case 2:
        return '< Back';
        break;
    }
  }

  showButtonText() {
    switch(this.state.step) {
      case 1:
        return 'Next';
        break;
      case 2:
        return 'Publish';
        break;
    }
  }

  getUISchemaJSON() {
    switch (this.state.step) {
      case 1:
        return this.state.uiSchemaJSON;
        break;
      default:
        return {};
        break;
    }
  }

  onPrevHandler() {
    let prev_step = --this.state.step;
    this.setState({
      step: prev_step
    });
  }

  toggleMode(e) {
    let element = e.target.closest('a'),
      mode = element.getAttribute('data-mode');

    this.setState((prevState, props) => {
      let newMode;
      if (mode !== prevState.mode) {
        newMode = mode;
      } else {
        newMode = prevState.mode
      }

      return {
        mode: newMode
      }
    })
  }

  render() {
    if (this.state.fetchingData) {
      return(<div>Loading</div>)
    } else {
      return (
        <div className="proto-container">
          <div className="ui grid form-layout">
            <div className="row">
              <div className="four wide column proto-card-form protograph-scroll-form">
                <div>
                  <div className="section-title-text">Fill the form</div>
                  <div className="ui label proto-pull-right">
                    ToCluster
                  </div>
                </div>
                <JSONSchemaForm schema={this.renderSchemaJSON()}
                  onSubmit={((e) => this.onSubmitHandler(e))}
                  onChange={((e) => this.onChangeHandler(e))}
                  uiSchema={this.getUISchemaJSON()}
                  formData={this.renderFormData()}>
                  <br/>
                  <a id="protograph-prev-link" className={`${this.state.publishing ? 'protograph-disable' : ''}`} onClick={((e) => this.onPrevHandler(e))}>{this.showLinkText()} </a>
                  <button type="submit" className={`${this.state.publishing ? 'ui primary loading disabled button' : ''} default-button protograph-primary-button`}>{this.showButtonText()}</button>
                </JSONSchemaForm>
              </div>
              <div className="twelve wide column proto-card-preview proto-share-card-div">
                <div className="protograph-menu-container">
                  <div className="ui compact menu">
                    <a className={`item ${this.state.mode === 'col16' ? 'active' : ''}`}
                      data-mode='col16'
                      onClick={this.toggleMode}
                    >
                      col-16
                    </a>
                    <a className={`item ${this.state.mode === 'col4' ? 'active' : ''}`}
                      data-mode='col4'
                      onClick={this.toggleMode}
                    >
                      col-4
                    </a>
                  </div>
                </div>
                <div className="protograph-app-holder">
                  <Card
                    mode={this.state.mode}
                    dataJSON={this.state.dataJSON}
                    schemaJSON={this.state.schemaJSON}
                    optionalConfigJSON={this.state.optionalConfigJSON}
                    optionalConfigSchemaJSON={this.state.optionalConfigSchemaJSON}
                    streamData={this.state.streamData}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  }
}
