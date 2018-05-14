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

    this.schemaWhiteList = [ "ec6c33c26b5d6015bb40" ];

    if (this.props.dataJSON) {
      stateVar.fetchingData = false;
      stateVar.dataJSON = this.props.dataJSON;
      stateVar.languageTexts = this.getLanguageTexts(this.props.dataJSON.data.language);
    }

    if (this.props.optionalConfigJSON) {
      stateVar.optionalConfigJSON = this.props.optionalConfigJSON;
    }

    if (this.props.streamData) {
      stateVar.streamData = this.props.streamData;
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

        let fetchJSON = [],
          streams = stateVar.dataJSON.data.streams;

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
            let d = e.filter(f => this.schemaWhiteList.indexOf(f.schema_id) >=0 );
            processedStream = processedStream.concat(d);
          });

          processedStream = processedStream.slice(0, 10);
          data.streamData = processedStream;

          this.setState(data);
        });

        stateVar.dataJSON.data.language = stateVar.siteConfigs.primary_language.toLowerCase();
        stateVar.languageTexts = this.getLanguageTexts(stateVar.dataJSON.data.language);
        this.setState(stateVar);
      }));
    } else {
      this.componentDidUpdate();
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

    let items = document.querySelectorAll('.single-story-card-display'),
      scroll_area = document.querySelector('.scroll-area'),
      length = items.length,
      width = 0;
    if (scroll_area) {
      for(let i = 0; i < length; i++) {
        width += (items[i].getBoundingClientRect().width + (this.state.renderMode === "col4" ? 10 : 5));
      }
      scroll_area.style.width = `${width}px`;
    }

    if (scroll_area) {
      var window_items = [],
        min = 0,
        max = items.length - 1,
        navBar = document.querySelector('.cards-display-area'),
        navBarBBox = navBar.getBoundingClientRect(),
        stateOfNavbar = [];
      for (let i = 0; i < max; i++) {
        let left = items[i].getBoundingClientRect().left,
          width = items[i].getBoundingClientRect().width;

        if ((left + width) <= navBarBBox.width) {
          window_items.push(i);
        }
      }

      stateOfNavbar.push({
        window_items: window_items,
        scrollLeft: 0
      });

      document.querySelector('#proto-navbar-prev').addEventListener('click', (e) => {
        // if (mode === "mobile" && stateOfNavbar.length === 1) {
        //   $('.proto-app-navbar-navigation-bar').css('display', 'none');
        //   $('.proto-app-navbar-logo-holder').css('display', 'inline-block');
        //   return;
        // }

        let popedElement = stateOfNavbar.pop(),
          currentElement = stateOfNavbar[stateOfNavbar.length - 1],
          next = document.querySelector('#proto-navbar-next');

        window_items = currentElement.window_items;

        if (next.style.display !== 'inline-block') {
          next.style.display = 'inline-block';
        }

        document.querySelector('.cards-display-area').style.overflow = 'scroll';
        document.querySelector('.cards-display-area').scrollLeft = currentElement.scrollLeft;
        document.querySelector('.cards-display-area').style.overflow = 'hidden';

        if (stateOfNavbar.length === 1) {
          document.querySelector('#proto-navbar-prev').style.display = 'none';
        }
      });

      document.querySelector('#proto-navbar-next').addEventListener('click', (e) => {
        let firstElement = window_items[0],
          lastElement = window_items[window_items.length - 1],
          new_width = 0,
          new_window_items = [],
          prev = document.querySelector('#proto-navbar-prev');

        if (lastElement !== max) {
          if (prev.style.display !== 'inline-block') {
            prev.style.display = 'inline-block';
          }

          for (let i = firstElement + 1; i <= max; i++) {
            let element = document.querySelector(`.single-story-card-display[data-item="${i}"]`),
              width = element.getBoundingClientRect().width;

            if ((new_width + width) <= navBarBBox.width) {
              new_width += width;
              new_window_items.push(i);
            } else {
              break;
            }
          }
          window_items = new_window_items.sort((a, b) => a - b);

          let nextElem = document.querySelector(`.single-story-card-display[data-item="${window_items[0]}"]`),
            scrollLeft = document.querySelector('.cards-display-area').scrollLeft,
            newScrollLeft = scrollLeft + nextElem.getBoundingClientRect().left;

          stateOfNavbar.push({
            window_items: window_items,
            scrollLeft: newScrollLeft
          });

          document.querySelector('.cards-display-area').style.overflow = 'scroll';
          document.querySelector('.cards-display-area').scrollLeft = newScrollLeft;
          document.querySelector('.cards-display-area').style.overflow = 'hidden';

          if (window_items[window_items.length - 1] === max) {
            document.querySelector('#proto-navbar-next').style.display = 'none';
          }
        }
      });
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
        <button id="proto-navbar-prev" > {"<"} </button>
        <button id="proto-navbar-next" > {">"} </button>
        <div className="cards-display-area">
          <div className="scroll-area">
            <div className="single-story-card-display site-details-card" data-item="0">
              <div className="proto-app-navbar-logo-holder">
                <h1 className="proto-app-navbar-project-name" >
                  <a href={this.state.dataJSON.data.home_page_url} target="_blank" dangerouslySetInnerHTML={{ __html: this.state.dataJSON.data.ref_category_html }} />
                </h1>
                {
                  this.state.dataJSON.data.show_by_publisher_in_header &&
                  <div className="proto-app-navbar-project-by">
                    <span>By {this.state.dataJSON.data.site_name}</span>
                  </div>
                }
              </div>
              {
                this.state.dataJSON.data.summary &&
                <div className="proto-toLanding-summary">{this.state.dataJSON.data.summary}</div>
              }
              <a href={this.state.dataJSON.data.home_page_url} target="_blank" className="proto-toLanding-visit-link">Visit Site <span className="proto-toLanding-go">></span></a>
            </div>
            {
              this.state.streamData.map((d,i) => {
                return (
                  <div key={d.view_cast_id} className="single-story-card-display" data-item={i + 1}>
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
