import { LitElement, css, html } from 'lit';
import { property } from 'lit/decorators.js';
import { customElement } from 'lit/decorators/custom-element.js';
import * as L from 'leaflet';

import '../node_modules/leaflet/dist/leaflet.css';

/**
render
  firstUpdated
  setupMap
    setupMarkers

render
  update markers
    setupMarkers
 */

/**
 * Based on: https://gist.github.com/thomasloven/1de8c62d691e754f95b023105fe4b74b
 */
@customElement('ha-my-map')
export class MyMap extends LitElement {

  @property({ attribute: false })
  private hass!: any;

  private config: any;

  private map: L.Map | undefined;
  private resizeObserver: ResizeObserver | undefined;
  private markers: L.Marker[] = [];

  setConfig(config: any) {
    console.log('set config', config);
    this.config = config;
  }

  connectedCallback() {
    super.connectedCallback();
    console.log('connectedCallback');

    // Reinitialize the map when the card gets reloaded but it's still in view
    if (this.shadowRoot!.querySelector('#map')) {
      this.firstUpdated();
    }
  }

  firstUpdated() {
    console.log('firstUpdated');
    this.map = this.setupMap();
    this.resizeObserver = this.setupResizeObserver();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    console.log('disconnectedCallback');
    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
    this.resizeObserver?.unobserve(this);
  }

  render() {
    console.log('render');
    if (!this.hass || !this.config) {
      return html``;
    }

    const blitzerList = this.config.blitzer_list
      .map((sensorName: string) => this.hass.states[sensorName])
      .filter((blitzerData: any) => blitzerData?.state === 'True')
      .map((blitzerData: any) => blitzerData.attributes);
    /*const r1 = Math.random() * 10;
    const r2 = Math.random() * 100;
    const blitzerList = [
      { address: r1, limit: r1, lastConfirmedAt: r1 },
      { address: r2, limit: r1, lastConfirmedAt: r2 },
    ];*/
    //console.log(this.config.blitzer_list.map((sensorName: string) => this.hass.states[sensorName]), blitzerList);

    if (this.map) {
      console.log('update markers');
      this.setupMarkers(this.map);
    }

    return html`
      <link rel="stylesheet" href="/local/ha-custom-cards/style.css">
      <ha-card header="${this.config.header}">
        <button @click=${this.buttonClicked}>Blitzer aktualisieren</button>
        ${blitzerList.map((attributes: any) =>
          html`<div>${attributes.address} (${attributes.limit} km/h) - ${attributes.lastConfirmedAt}</div>`
        )}
        <div id="map"></div>
      </ha-card>
    `;
  }

  buttonClicked() {
    console.log('buttonClicked');
    this.hass.callService('homeassistant', 'update_entity', { entity_id: 'sensor.blitzer_last_update' });
  }

  private setupResizeObserver() {
    if (this.resizeObserver) {
      return this.resizeObserver;
    }

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        if (entry.target === this.map?.getContainer()) {
          this.map?.invalidateSize();
        }
      }
    });

    resizeObserver.observe(this.map!.getContainer());
    return resizeObserver;
  }

  private setupMap(): L.Map {
    console.log('setupMap');
    const { latitude, longitude } = this.hass.states[this.config.map_config.center].attributes;

    const mapEl = this.shadowRoot!.querySelector('#map') as HTMLElement;
    const map = L.map(mapEl).setView([latitude, longitude], 13);
    const tl = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      // minZoom: 4,
      // maxZoom: 19,
      // attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });
    map.addLayer(tl);

    this.setupMarkers(map, true);

    return map;
  }

  private setupMarkers(map: L.Map, centralize = false): void {
    console.log('setupMarkers');
    this.clearMarkers(map);

    this.config.blitzer_list
      .map((sensorName: string) => this.hass.states[sensorName])
      .filter((blitzerData: any) => blitzerData?.state === 'True')
      .map((blitzerData: any) => blitzerData.attributes)
      .forEach((attributes: any) => {
        const markerIcon = L.divIcon({
          html: `
            <div>
            ${attributes.limit}
            </div>
          `,
          iconSize: [30, 30],
          className: 'my-div-icon'
        });
        const marker = L.marker([attributes.latitude, attributes.longitude], {icon: markerIcon})
          .bindPopup(`${attributes.address} (${attributes.limit} km/h) - ${attributes.lastConfirmedAt}`)
          .addTo(map);
        this.markers.push(marker);
      });

      if (centralize && this.markers.length > 0) {
        const markerGroup = L.featureGroup(this.markers);
        map.fitBounds(markerGroup.getBounds());
      }
  }

  private clearMarkers(map: L.Map): void {
    this.markers.map(marker => map.removeLayer(marker));
    this.markers = [];
  }

  static get styles() {
    return css`
      #map {
        height: 400px;
        border-radius: var(--ha-card-border-radius,12px);
      }

      .leaflet-pane {
        z-index: 0 !important;
      }

      .leaflet-control,
      .leaflet-top,
      .leaflet-bottom {
        z-index: 1 !important;
      }

      .my-div-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #fff;
        border-radius: 50%;
        border: 3px solid #f00;
        font-size: 16px;
        font-weight: bold;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ha-my-map': MyMap
  }
}