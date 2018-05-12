import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';

export default class toLanding extends React.Component {

  constructor(props) {
    super(props)
    let stateVar = {
      fetchingData: true,
      dataJSON: {},
      optionalConfigJSON: {},
      languageTexts: undefined,
      siteConfigs: this.props.siteConfigs,
      renderMode: this.props.mode === 'col16' ? 'col4' : 'col2'
    };

    this.schemaWhiteList = ["ec6c33c26b5d6015bb40"]

    if (this.props.dataJSON) {
      stateVar.fetchingData = false;
      stateVar.dataJSON = this.props.dataJSON;
      stateVar.languageTexts = this.getLanguageTexts(this.props.dataJSON.data.language);
    }

    if (this.props.optionalConfigJSON) {
      stateVar.optionalConfigJSON = this.props.optionalConfigJSON;
    }

    this.state = stateVar;
  }

  exportData() {
    return document.getElementById('protograph_div').getBoundingClientRect();
  }

  componentDidMount() {
    if (this.state.fetchingData) {
      let items_to_fetch = [
        axios.get(this.props.dataURL)
      ];

      if (this.props.siteConfigURL) {
        items_to_fetch.push(axios.get(this.props.siteConfigURL));
      }

      axios.all(items_to_fetch).then(axios.spread((card, site_configs) => {
        // fetchingData: false,
        let stateVar = {
          dataJSON: card.data,
          optionalConfigJSON:{},
          siteConfigs: site_configs ? site_configs.data : this.state.siteConfigs
        };

        let fetchJSON = [
            axios.get(stateVar.dataJSON.data.site_header_json_url),
            axios.get(stateVar.dataJSON.data.homepage_header_json_url)
          ],
          streams = stateVar.dataJSON.data.streams;

        streams.forEach(e => {
          fetchJSON.push(axios.get(e.url));
        });

        axios.all(fetchJSON).then(axios.spread((site_json, homepage_json, ...streams) => {
          let data = {
            fetchingData: false,
            siteJSON: site_json.data,
            homepageJSON: homepage_json.data.filter(e => e.name === stateVar.dataJSON.data.ref_category_name)[0],
            streamData: streams.map(e => e.data)
          },
          processedStream = [];

          data.streamData.forEach(e => {
            let d = e.filter(f => this.schemaWhiteList.indexOf(f.schema_id) >=0 );
            processedStream = processedStream.concat(d);
          });

          processedStream = processedStream.slice(0, 10);
          data.streamData = processedStream;

          this.setState(data);
        }));

        stateVar.dataJSON.data.language = stateVar.siteConfigs.primary_language.toLowerCase();
        stateVar.languageTexts = this.getLanguageTexts(stateVar.dataJSON.data.language);
        this.setState(stateVar);
      }));
    }
  }

  componentWillReceiveProps(nextProps) {
    if(nextProps.dataJSON) {
      this.setState({
        dataJSON: nextProps.dataJSON
      });
    }
  }

  getLanguageTexts(languageConfig) {
    let language = languageConfig ? languageConfig : "hindi",
      text_obj;

    switch(language.toLowerCase()) {
      case "hindi":
        text_obj = {
          font: "'Sarala', sans-serif"
        }
        break;
      default:
        text_obj = {
          font: undefined
        }
        break;
    }

    return text_obj;
  }

  componentDidUpdate() {
    let iframeContainers = document.querySelectorAll('.scroll-area .single-story-card-display .proto-app-iframe'),
      iframes = document.querySelectorAll('.scroll-area .single-story-card-display iframe');

    if (iframeContainers.length > 0 && iframes.length == 0) {
      for (let i = 0; i < iframeContainers.length; i++) {
        let element = iframeContainers[i],
          id = element.getAttribute('data-view-cast-id'),
          iframe_url = element.getAttribute('data-iframe-url'),
          mode = this.state.renderMode;

        setTimeout(function () {
          new ProtoEmbed.initFrame(element, `${iframe_url}%26domain=${location.hostname}`, mode);
        }, 0)
      }
    }
  }

  renderCol16() {
    let data = this.state.dataJSON.data;
    if (this.state.fetchingData ){
      return(<div>Loading</div>)
    } else {
      return (
        <div
          id="protograph_div"
          className="landing-card-parent-div col-16"
          style={{ fontFamily: this.state.languageTexts.font }}>
          { this.renderCard() }
        </div>
      )
    }
  }

  renderCol4() {
    if (this.state.fetchingData) {
      return (<div>Loading</div>)
    } else {
      return (
        <div
          id="protograph_div"
          className="landing-card-parent-div col-4"
          style={{ fontFamily: this.state.languageTexts.font }}>
          { this.renderCard() }
        </div>
      )
    }
  }

  renderCard() {
    return (
      <div>
        <div className="row-title">
          <h1 className="proto-app-navbar-project-name" >
            <a href={this.state.homepageJSON.url} target="_blank" dangerouslySetInnerHTML={{ __html: this.state.homepageJSON.name_html }} />
          </h1>
          {
            this.state.homepageJSON.show_by_publisher_in_header &&
            <div className="proto-app-navbar-project-by">By {this.state.dataJSON.data.site_name}</div>
          }
        </div>
        {
          this.state.dataJSON.data.summary &&
          <p>{this.state.dataJSON.data.summary}</p>
        }
        <div className="cards-display-area">
          <div className="scroll-area">
            {
              this.state.streamData.map(d => {
                return (
                  <div key={d.view_cast_id} className="single-story-card-display">
                    <div
                      id={d.view_cast_id}
                      className="proto-app-iframe"
                      data-view-cast-id={d.view_cast_id}
                      data-iframe-url={d.iframe_url}
                      data-mode={d.mode}
                    />
                  </div>
                )
              })
            }
          </div>
        </div>
        <div className="row-footer">
          Powered by Proto
        </div>
      </div>
    )
  }

  render() {
    switch(this.props.mode) {
      case 'col16' :
        return this.renderCol16();
        break;
      case 'col4':
        return this.renderCol4();
        break;
    }
  }
}
